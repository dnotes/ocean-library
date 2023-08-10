<script lang="ts">
  import { pick } from "lodash-es";
  import type { Doc } from "$lib";
  import { sentenceSplitter, clauseSplitter } from "$lib";
  export let item:Doc
  import { pipeline } from "@xenova/transformers";

  let generateEmbeddings:any
  let length = item.blocks.length
  let current = 0

  async function dbRecord(text:string, doc:Doc, blockIdx:number, sentenceIdx:number, clauseIdx?:number) {
    let emb = await generateEmbeddings(text, {
      pooling: 'mean',
      normalize: true,
    })
    let id = `${item.slug}_${blockIdx.toString().padStart(6,'0')}_${sentenceIdx.toString().padStart(3,'0')}`
    if (clauseIdx !== undefined) id += '_' + clauseIdx.toString().padStart(3,'0')
    return {
      id,
      values: Object.values(emb.data),
      metadata: { ...pick(doc, ['slug','title','author','collection','language','category','date']), blk:blockIdx, s:sentenceIdx, c:clauseIdx, text }
    }
  }

  async function upsert(records:any, idx:number) {
    let request = await fetch(`/db/upsert`, {
      method: 'POST',
      body: JSON.stringify(records),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    current = idx
    return request
  }

  async function indexItem() {
    generateEmbeddings = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

    const blocks = item.blocks.map(b => { return document?.createRange().createContextualFragment(b).textContent?.trim() || '' })

    let vectors = []
    let queue:Promise<Response>[] = []

    for (let i=0; i<blocks.length; i++) {

      // get the block
      const block = blocks[i]

      if (block.match(/\w/)) {

        // get all the sentences
        let sentences = block.split(sentenceSplitter)

        for (let ii=0; ii<sentences.length; ii++) {

          const sentence = (sentences[ii]).trim()

          if (sentence.match(/\w/)) {

            const snippets = sentence.length < 2000 ? [sentence] : sentence.split(clauseSplitter)

            for (let iii=0; iii<snippets.length; iii++) {

              let snippet = snippets[iii]

              let record = await dbRecord( snippet, item, i, ii, (snippets.length > 1 ? iii : undefined) )
              vectors.push(record)
              if (vectors.length > 9) {
                queue.push(upsert({ vectors }, i))
                vectors = []
              }

            }
          }

        }

      }

    }

  }

</script>

<div class="flex items-center gap-5">
  <button class="px-4 py-2 h-12 text-white bg-blue-500 rounded" on:click={indexItem}>Index</button>
  <input type="range" min="0" max={length} bind:value={current}>
  <div>{current}/{length} finished</div>
</div>
