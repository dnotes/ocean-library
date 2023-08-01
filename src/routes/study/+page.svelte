<script lang="ts">

  import { pipeline } from '@xenova/transformers'
  import { onMount } from 'svelte';
  import { typewriter } from '$lib/transitions';

  let generateEmbeddings:any
  let ready = false
  let searchString = ''

  let statements:string[] = []

  onMount(async () => {
    generateEmbeddings = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    ready = true
    setTimeout(() => { statements = [...statements, 'Ask me a question above, and I can create a custom compilation for you based on a semantic search of the texts you have selected.'] }, 2000)
  })

  function search() {

    let embeddings = generateEmbeddings(searchString, {
      pooling: 'mean',
      normalize: true,
    })

    console.log(embeddings)

  }

</script>

<div class="mx-auto w-full flex flex-col gap-5">

  <form action="dialog" class="flex gap-2" on:submit={search}>
    <input type="text" bind:value={searchString} class="w-full px-3 py-2 mb-3 rounded h-12" placeholder="What is your question?">
    <button type="submit" class="px-4 py-2 h-12 text-white bg-blue-500 rounded" disabled={!ready}>Search</button>
  </form>

  <div class="rounded-lg mx-12 bg-stone-200 dark:bg-stone-700">
    <div class="rounded-t-lg font-bold bg-stone-400 dark:bg-stone-800 px-5 py-2">Recent searches</div>
    <div class="px-5 py-2 italic text-center">
      <p>You have no recent searches.</p>
    </div>
  </div>

  <div class="px-10 w-full max-w-lg mx-auto">
    {#each statements as text}
      <p class="font-mono text-lg leading-tight " transition:typewriter={{ speed:15 }}>{text}</p>
    {/each}
  </div>

</div>