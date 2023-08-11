#!/usr/bin/env node
import sade from 'sade'
import fs from 'node:fs/promises'
import { glob } from 'glob'
import { pipeline } from '@xenova/transformers'
import { pick } from 'lodash-es'
import fetch from 'node-fetch'
import url from 'node:url'
import { dirname, resolve } from 'node:path'
import { getDoc, sentenceSplitter, clauseSplitter } from '../src/lib/Doc.mjs'

import { PineconeClient } from '@pinecone-database/pinecone'
const dbClient = new PineconeClient()
await dbClient.init({
  environment: 'us-west1-gcp-free',
  apiKey: process.env.PINECONE_API_KEY,
})
const db = dbClient.Index('ocean')

import md from 'ocean-markdown-it'
import parnums from 'markdown-it-auto-parnum'
md.use(parnums)
import * as cheerio from 'cheerio'

import { Sema } from 'async-sema'
const s = new Sema(4)

const generateEmbeddings = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

/** @type {import('sade').Sade} */
const prog = sade('ocean-db')

async function dbRecord(text, doc, blockIdx, sentenceIdx, clauseIdx) {
  let emb = await generateEmbeddings(text, {
    pooling: 'mean',
    normalize: true,
  })
  let id = `${doc.slug}_${blockIdx.toString().padStart(6,'0')}_${sentenceIdx.toString().padStart(3,'0')}`
  if (clauseIdx !== undefined) id += '_' + clauseIdx.toString().padStart(3,'0')
  return {
    id,
    values: Object.values(emb.data),
    metadata: { ...pick(doc, ['slug','title','author','collection','language','category','date','sort']), blk:blockIdx, s:sentenceIdx, c:clauseIdx, text }
  }
}

/**
 * Inserts or updates a set of vectors to the Pinecone database
 * @param {import('@pinecone-database/pinecone').UpsertRequest} upsertRequest
 */
async function upsert(upsertRequest, retries = 0) {
  if (!retries) await s.acquire()
  try {
    let promise = await db.upsert({upsertRequest})
    s.release()
    process.stdout.write('.')
    return promise.upsertedCount || 0
  }
  catch(e) {
    if (retries < 3) {
      process.stdout.write(',')
      return upsert(upsertRequest, retries + 1)
    }
    else {
      errors.push({
        message: `${upsertRequest.vectors[0].metadata.slug} #${upsertRequest.vectors[0].metadata.blockIdx}: ${e.message}`,
        vectors: upsertRequest.vectors.map(v => { return {...v.metadata, values:`(${v.values.length})`}})
      })
      s.release()
      process.stdout.write('!')
      return 0
    }
  }
}

async function deleteAll(slug) {

  let ids = []
  let vector = [...Array(384)].map(k=>0)

  try {
    const res = await fetch('https://ocean-af77af9.svc.us-west1-gcp-free.pinecone.io/query', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.PINECONE_API_KEY,
      },
      body: JSON.stringify({
        filter: {slug},
        topK: 1000,
        includeValues: false,
        includeMetadata: false,
        vector,
      })
    })

    if (res.status === 200) {
      let json = await res.json()
      ids = json.matches.map((hit) => hit.id)
    }
    else {
      let text = await res.text()
      throw new Error(`Response: ${res.status} ${res.statusText} ${text}`)
    }

  }
  catch(err) {
    throw new Error(`Could not retrieve IDs for ${slug}\n` + err?.message)
  }

  if (!ids) return { more:false, ids:[] }

  try {
    const res = await fetch('https://ocean-af77af9.svc.us-west1-gcp-free.pinecone.io/vectors/delete', {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.PINECONE_API_KEY,
      },
      body: JSON.stringify({ ids })
    })

    let text = await res.text()

  }
  catch(err) {
    throw new Error(`Could not delete IDs for ${slug}\n` + err?.message)
  }

  return { ids, more: ids.length === 1000 }

}

async function indexDoc(doc) {

  let blocks = []
  let html = md.render(doc.markdown)
  const $ = cheerio.load(html)
  $('a[¶]').text('')
  $('h1,h2,h3,h4,h5,h6').text('')
  if ($('body').children().first()[0].name.match(/h1/i)) $('body').children().first().remove()
  blocks = $('body').children().toArray().map(el => $(el).text())

  let vectors = []
  let queue = []

  for (let i=0; i<blocks.length; i++) {

    // get the block
    const block = blocks[i]

    if (block.match(/\w{3,}/)) {

      // get all the sentences
      let sentences = block.split(sentenceSplitter)

      for (let ii=0; ii<sentences.length; ii++) {

        const sentence = (sentences[ii]).trim()

        if (sentence.match(/\w{3,}/)) {

          const snippets = sentence.length < 2000 ? [sentence] : sentence.split(clauseSplitter)

          for (let iii=0; iii<snippets.length; iii++) {

            let snippet = snippets[iii]

            let record = await dbRecord( snippet, doc, i, ii, (snippets.length > 1 ? iii : undefined) )
            vectors.push(record)
            if (vectors.length > 9) {
              queue.push(upsert({ vectors }))
              vectors = []
            }

          }
        }

      }

    }

  }

  // Don't forget the last bits!
  if (vectors.length) queue.push(upsert({ vectors }))

  let upserts = await Promise.all(queue)
  let total = upserts.reduce((acc,cur) => (acc + cur), 0)
  console.log(`Indexed ${total} vectors for ${doc.slug}`)

}

function getSlug(filepath) {
  return filepath.replace(/^.+\//, '').replace(/\.md$/, '')
}

async function getAllFiles(f, opts) {
  let files = [f, ...(opts?.['_'] ?? [])].filter(Boolean)
  if (!files.length) {
    let path = resolve(dirname(url.fileURLToPath(import.meta.url)), '..')
    files = await glob(`${path}/content/**/*.md`)
  }
  if (opts.m) {
    let strs = Array.isArray(opts.m) ? opts.m : [opts.m]
    files = files.filter(f => {
      for (let i=0;i<strs.length;i++) {
        if (f.includes(strs[i])) return true
      }
      return false
    })
  }
  if (opts.M) {
    let strs = Array.isArray(opts.M) ? opts.M : [opts.M]
    files = files.filter(f => {
      for (let i=0;i<strs.length;i++) {
        if (f.includes(strs[i])) return false
      }
      return true
    })
  }
  return files

}

prog.command('test [...files]')
  .option('-m, --matching', 'Only delete files whos paths match the given string')
  .option('-M, --not-matching', 'Only delete files whos paths do NOT match the given string')
  .action(async (f, opts) => {
    let files = await getAllFiles(f,opts)
    console.log({ files, opts: { ...opts, _:[] } })
  })

prog.command('delete [...files]')
  .option('-m, --matching', 'Only delete files whos paths match the given string')
  .option('-M, --not-matching', 'Only delete files whos paths do NOT match the given string')
  .action(async (f, opts) => {

    let files = await getAllFiles(f,opts)

    for (let i=0;i<files.length;i++) {
      const filepath = files[i]
      const slug = getSlug(filepath)

      // Delete old records
      let ids = [], more = true
      do {
        let res = await deleteAll(slug)
        more = res.more && (res.ids !== ids)
        ids = ids.concat(res.ids)
      } while (more)
      if (ids.length) console.log(`Deleted ${ids.length} vectors for ${slug}`)

    }

  })

prog.command('upsert [...files]')
  .option('-m, --matching', 'Only upsert files whos paths match the given string')
  .option('-M, --not-matching', 'Only upsert files whos paths do NOT match the given string')
  .action(async (f, opts) => {

    let files = await getAllFiles(f,opts)
    let errors = []

    for (let i=0;i<files.length;i++) {
      const filepath = files[i]
      const slug = getSlug(filepath)
      const raw = await fs.readFile(filepath, 'utf-8')
      const doc = getDoc(raw, filepath, false, true)

      // Delete old records
      let ids = [], more = true
      do {
        let res = await deleteAll(slug)
        more = res.more && (res.ids !== ids)
        ids = ids.concat(res.ids)
      } while (more)
      if (ids.length) console.log(`Deleted ${ids.length} vectors for ${slug}`)

      // Add all records
      await indexDoc(doc)

    }

    if (errors.length) await fs.writeFile('./index-errors.json', JSON.stringify(errors, null, 2))

  })

prog.parse(process.argv)

