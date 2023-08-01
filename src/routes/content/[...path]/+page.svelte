<script lang="ts">
  import type { PageData } from "./$types";
  // @ts-ignore this doesn't have a type
  import md from 'ocean-markdown-it'
  // @ts-ignore same here
  import mdParNums from 'markdown-it-auto-parnum'
  md.use(mdParNums)

  import { pipeline } from "@xenova/transformers";
  import { onMount } from "svelte";
  import { pick } from "lodash-es";
  import type { Doc } from "$lib";

  export let data:PageData

  let generateEmbeddings:any
  let ready = false

  onMount(async () => {
    generateEmbeddings = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    ready = true
  })

  let length = data.content.markdown?.length || 0
  let offset:number = 0
  $: donePercent = length && offset ? (offset/length) : 0

  async function dbRecord(text:string, doc:Doc, blockIdx:number, textIdx:number, offset:number, blockLength:number) {
    let emb = await generateEmbeddings(text, {
      pooling: 'mean',
      normalize: true,
    })
    return {
      id: `${data.content.slug}_${blockIdx.toString().padStart(7,'0')}_${textIdx.toString().padStart(5,'0')}`,
      values: emb.data,
      metadata: { ...pick(doc, ['slug','title','author','collection','language','category','date']), address:[offset, blockLength], text }
    }
  }

  async function upsert(records:any) {
    let request = fetch(`https://ocean-af77af9.svc.us-west1-gcp-free.pinecone.io/vectors/upsert`, {
      method: 'POST',
      body: JSON.stringify(records),
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': '',
      },
    })
    return request
  }

  async function indexItem() {

    const text = data.content.markdown || ''
    length = data.content.markdown?.length || 0
    let blocks = text.split('\n\n')

    offset = 0
    let vectors = []
    let queue:Promise<Response>[] = []

    for (let i=0; i<blocks.length; i++) {

      // get the block
      const block = blocks[i]

      if (block.match(/\w/)) {

        // get all the sentences
        let sentences = block.split('.')

        let textIdx = 0
        for (let ii=0; ii<sentences.length; ii++) {

          const sentence = (sentences[ii] + '.').trim()

          if (sentence.match(/\w/)) {
            const snippets = sentence.length < 2000 ? [sentence] : sentence.split(';')

            for (let iii=0; iii<snippets.length; iii++) {

              let snippet = snippets[iii]
              if (!snippet.endsWith('.')) snippet += ';'

              let record = await dbRecord( snippet, data.content, i, textIdx++, offset, block.length )
              vectors.push(record)
              if (vectors.length > 9) {
                queue.push(upsert({ vectors }))
                vectors = []
              }

            }
          }

        }

      }

      offset += block.length + (i < blocks.length - 1 ? 2 : 0)
    }
  }

  let disabled = false
  async function indexItemBackend() {
    disabled = true
    return fetch('/upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data.content),
    })
  }

</script>

<div>
  {#if import.meta.env.DEV && !disabled}
  <div class="flex">
    <button on:click={indexItem}>Index</button>
    <input type="range" min="0" max="1" bind:value={donePercent}>
    <div>{Math.round(donePercent * 100)}% finished</div>
  </div>
  {/if}
  {#if !data.content.markdown?.startsWith('# ')}
    <h1>{data.content.title}</h1>
  {/if}
  {@html md.render(data.content.markdown)}
</div>

<style lang="postcss">
  div>:global(*) {
    position: relative;
  }
</style>