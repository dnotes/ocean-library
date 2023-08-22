<script lang="ts">
  import { cleanText, displayCategory, type Doc } from "$lib";
  import type { SearchHit } from "./search";

  export let doc:Doc|SearchHit & { blocks?:string[] }
  export let blk:number|undefined = undefined
  export let hit:SearchHit|undefined = undefined

  $: blocks = (typeof blk === 'undefined' || !doc.blocks) ? (doc?.blocks || []) : blkBlocks()

  function blkBlocks() {
    if (!doc.blocks || typeof blk === 'undefined') return doc?.blocks || []
    let preBlocks = doc.blocks.slice(Math.max(blk-50,0), blk)
    let block = doc.blocks[blk]
    let postBlocks = doc.blocks.slice(blk+1, blk+50)
    if (hit) {
      hit.texts.forEach(t => {
        block = block.replace(t, `<b>${t}</b>`)
      })
    }
    return [...preBlocks, block, ...postBlocks]
  }

  $: headings = (doc?.blocks || []).map((html,blk) => {
    let isHeading = html.match(/<\/h([1-6])>/)
    return {
      isHeading,
      blk,
      level: isHeading ? isHeading[1] : '',
      text: isHeading ? cleanText( html.replace(/<u>(.)(h|H)<\/u>/g, '$1_$2').replace(/<[^>]*?>/g, ' ').replace(/(.)_(h|H)/g, '<u>$1$2</u>').replace(/\s+/g, ' ') ) : ''
    }
  }).filter(b => b.isHeading)

  let showToc = false
  function toggleToc() { showToc = !showToc; showInfo=false; }

  let showInfo = false
  function toggleInfo() { showInfo = !showInfo; showToc=false; }

  let w:number = 0
  $: compact = w<980

  function hasUrl(doc:Doc|SearchHit): doc is Doc {
    return (doc as Doc)?.url ? true : false
  }
  function hasDescription(doc:Doc|SearchHit): doc is Doc {
    return (doc as Doc)?.description ? true : false
  }

</script>

<div class="flex flex-{compact ? 'col' : 'row'} gap-4 max-h-full justify-center" bind:clientWidth={w}>
  <div class="min-h-14 p-5 prose prose-stone dark:prose-invert bg-stone-500 bg-opacity-50 max-w-full max-h-full overflow-auto prose-sm {compact ? 'w-full text-center flex-shrink-0' : 'w-96'}">

    <h1 class="mb-1 text-lg leading-tight">
      <a href="/content/{doc.slug}" >{doc.title}</a>
    </h1>

    <div class="flex flex-{compact ? 'row' : 'col'} justify-center">

      {#if doc.author}
        <div class="italic px-1">by {doc.author}</div>
      {/if}

      <div class="italic px-1">
        in
        {displayCategory(doc.category)}
        {#if doc.collection}
          &RightArrow; {doc.collection}
        {/if}
      </div>

    </div>

    <div class="text-xs leading-none font-bold opacity-50 {compact ? 'flex gap-2 justify-center' : ''}">

      {#if hasUrl(doc)}
        <a target="_blank" href="{doc.url}" class="no-underline block">Source</a>
      {/if}

      {#if compact}
        {#if hasDescription(doc)}
          <button type="button" on:click={toggleInfo}>Info</button>
        {/if}
        {#if headings.length}
          <button type="button" on:click={toggleToc}>TOC</button>
        {/if}
      {/if}

    </div>

    {#if compact}
      <slot name="compact" />
    {/if}

    <div>
      <slot></slot>
    </div>


    {#if hasDescription(doc) && (!compact || showInfo)}
      <div class="text-left text-small leading-tight {compact ? 'prose-sm mx-auto' : ''}">{doc.description}</div>
    {/if}

    {#if headings.length && (!compact || showToc)}
      <div class="text-left {compact ? 'max-h-[600px]' : ''}">
        <h2 class="font-thin text-lg">Contents</h2>
        {#each headings as item}
          <div class="leading-tight mt-3 indent-{item.level}"><a href="#blk-{item.blk}" class="no-underline" on:click={()=>{showToc=false}}>{@html item.text}</a></div>
        {/each}
      </div>
    {/if}

  </div>
  <div class="prose prose-lg prose-stone dark:prose-invert pl-12 pr-5 max-h-full max-w-screen-md 2xl:max-w-screen-lg 3xl:max-w-screen-2xl w-full overflow-auto mx-auto">

    <slot name="blocks">
      {#each blocks as item}
        <div class="relative">{@html item}</div>
      {/each}
    </slot>

  </div>
</div>
