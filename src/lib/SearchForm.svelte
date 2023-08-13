<script lang="ts">

  import type { Search } from "$lib";
  import { createEventDispatcher } from "svelte";
  import { searchSettings, searchHistory, searchRunner, currentSearch } from "./stores";
  import type { Writable } from "svelte/store";

  let dispatch = createEventDispatcher()

  export let search:Search = { text:'', results:[], settings:{...$searchSettings} }
  export let searchText:string = search?.text ?? ''
  export let searchStore:Writable<Search>|undefined = undefined

  export let disabled=false

  async function doSearch(text:string|Search) {

    // TODO: add method to get search history with arrow keys

    search = await $searchRunner(text, searchStore)
    dispatch('search', search)

  }

  let w:number

</script>

<div class="search-text not-prose relative w-full" role="search">

  <form action="dialog" method="post" class="flex gap-2" on:submit|preventDefault={()=>{doSearch(searchText)}}>
    <div class="search-input w-full" bind:clientWidth={w}>
      <input
        name="search"
        type="text"
        role="searchbox"
        aria-label="Search"
        bind:value={searchText}
        class="w-full px-3 py-2 rounded h-12 text-stone-900"
        placeholder="search text here"
        autocomplete="off"
      >
      <div class="search-history absolute top-full bg-stone-300 overflow-y-auto hidden flex-col max-h-60 z-50" style="width:{w}px;">
        <!-- TODO: add filtering of search history based on text -->
        {#each ($searchHistory ?? []) as item}
          <button on:click={()=>{ $currentSearch = item }} type="button" class="w-full block h-5 p-1 text-sm leading-none bg-stone-300 text-stone-900 border-0 text-left">
            {item?.text}
          </button>
        {/each}
      </div>
    </div>
    <button type="submit" {disabled} class="px-4 py-2 h-12 text-white bg-blue-500 rounded">Search</button>
  </form>

</div>

<style lang="postcss">
  input:focus ~ div.search-history, div.search-history:hover {
    display:flex;
  }
</style>