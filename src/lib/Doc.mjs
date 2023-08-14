import yaml from 'js-yaml'
// @ts-ignore no type def
import md from 'ocean-markdown-it'
// @ts-ignore no type def
import parnums from 'markdown-it-auto-parnum'
md.use(parnums)

import * as cheerio from 'cheerio'

import { slugify } from 'transliteration'

/** @type {{[key:string]:string}} */
let images = {}
try {
  images = import.meta.glob('../../content/**/*.(jpg|jpeg|gif|svg|webp|avif)', { eager:true, import:'default' })
}
catch(e) {
  // This happens when we are not in Vite, i.e. when running upsert script
}

/** @type {(raw:string, path:string, getContent?:boolean, includeMarkdown?:boolean) => import('.').Doc} */
export function getDoc(raw, path, getContent = true, includeMarkdown = false) {

  let [ language, category ] = path.replace(/(?:^|.+\/)content\//, '').split('/')
  let slug = path.replace(/.+\//, '').replace(/\.md$/, '');
  let dir = path.replace(/\/[^\/]+$/, '')
  let [, yfm, ...markdownArray] = raw.split(/^---$/gm)
  let markdown = markdownArray.join('---')

  /** @type {any} */
  let data = {
    language,
    category,
    slug,
    author: 'unknown',
    title: 'untitled',
    blocks: []
  }

  try {
    data = yaml.load(yfm)
  }
  catch(e) {
    // the data did not load, just return the full text
    return { ...data, markdown: `***Error: metadata not loaded!***\n\n${raw}` }
  }

  let words = (data?.words ?? data?.wordsCount)
  if (typeof words !== 'undefined' && typeof words !== 'number') {
    words = parseInt(words.toString())
  }

  /** @type {string[]} */
  let blocks = []
  if (getContent) {
    let html = md.render(cleanText(markdown))
    const $ = cheerio.load(html)

    // Import all images
    $('img').toArray().map((el) => {
      let src = $(el).attr('src')
      $(el).attr('src', images[`../../${dir.replace(/^.*\/content\//,'content/')}/${src?.replace(/^\.\//,'')}`])
    })

    // Remove text from all paragraph numbers
    $('a[¶]').text('')

    // Remove the h1 if it matches the work's title
    if ($('body').children().first()[0].name.match(/h1/i)) $('body').children().first().remove()

    // Add a block id to each block, for linking
    blocks = $('body').children().toArray().map((el,i) => {
      $(el).attr('id', `blk-${i}`)
      return $.html(el)
    })

  }

  /** @type {import('.').Doc} */
  let item = {
    isDoc: true,
    id: cleanText(data?.id),
    title: cleanText(data?.title) || '',
    author: cleanText(data?.author) || '',
    collection: cleanText(data?.collection || data?.collectionTitle),
    collectionIndex: data?.collectionIndex,
    language,
    category,
    description: cleanText(data?.description),
    date: cleanText(data?.date),
    sort: '',
    url: (data?._sourceUrl ?? data?._convertedFrom),

    slug,
    blocks,
    markdown: includeMarkdown ? cleanText(markdown?.trim()) : undefined
  }

  item.sort = item.collection
    ? sortText([item.category, item.collection, (item.collectionIndex ?? 0), item.title].map(sortText).join('_'))
    : sortText([item.category, item.author, item.title].map(sortText).join('_'))

  return item
}


/** @type {(str:string|number)=>string} */
export function sortText(str) {
  if (typeof str === 'number') return str.toString().padStart(4,'0')
  return slugify(str.replace(/['‘’`]/g,'').replace(/^the\s+/i,''))
}

/** @type {(str:string|undefined)=>string|undefined} */
export function cleanText(str) {
  if (str === undefined) return
  str = str
    ?.toString()
    ?.replace(/\B_([hH])/g, '͟h')

  return str
}

export const sentenceSplitter = /(?<=[\.\?!]+(?:["“”'‘’`])*)\s(?=[^\.\?!]{4,})/gm
export const clauseSplitter = /(?<=[:;]+(?:["“”'‘’`])*)\s/gm