<script lang="ts">

  import { dbQuery, generateEmbeddings, filterResults, preprocessSearchText, type Search, type SearchHit, type SearchStatus, processResults } from "$lib/search";
  import { createEventDispatcher } from "svelte";
  import { searchSettings, searchHistory, currentSearch, currentSearchStatus, currentSearchHit } from "./stores";
  import type { Writable } from "svelte/store";

  export let search:Writable<Search> = currentSearch
  export let searchStatus:Writable<SearchStatus> = currentSearchStatus

  const dispatch = createEventDispatcher()

  export let searchText:string = $search.text

  let touched=$search.text ? false : true

  async function doSearch() {

    $searchStatus = { working:true, message:'Running search...'}

    if (touched) {
      let idx = $searchHistory.findIndex(s => s.text === searchText)
      if (idx > -1) { // existing search
        let searchItem = $searchHistory.splice(idx,1)[0]
        $search = searchItem
        $searchHistory = [$search, ...$searchHistory]
      }
      else { // new search
        $search = { text:searchText, errors:[], settings:{...$searchSettings}}
        $searchHistory = [$search, ...$searchHistory]
      }
    }
    touched = false

    if ($search.text.length <= 2) {
      $searchStatus = { working:false, message:'Search text must be more than 2 characters.' }
      return
    }

    dispatch('search', $search)

    $search = {...$search, results:[], errors:[], filteredResults:[], textPreprocessed:'', vector:[] }

    if ($search.settings.searchTextPreprocessing) {
      $searchStatus = { working:true, message:'Preprocessing search text...'}
      $search = await preprocessSearchText($search)
    }

    $searchStatus = { working:true, message:'Generating vector search...'}
    $search = await generateEmbeddings($search)

    $searchStatus = { working:true, message:'Querying database...'}
    $search = await dbQuery($search)
    if (!$search.results?.length) {
      $searchStatus = { working:false, message:'Error: No search results.'}
      return
    }

    if ($search.settings.searchResultsFiltering) {
      $searchStatus = { working:true, message:'Filtering results...'}
      $search = await filterResults($search)
    }

    if ($search.settings.searchResultsProcessing) {
      $searchStatus = { working:true, message:'Summarizing results...'}
      $search = await processResults($search)
    }

    $searchStatus = { working:false, message:`` }

  }

  async function setSearch(i:number) {

    let searchItem = $searchHistory.splice(i,1)[0];
    $searchHistory = $searchHistory
    $search = searchItem
    searchText = $search.text
    touched = false
    $searchHistory = [$search, ...$searchHistory]

  }

  let w:number

</script>

<div class="search-text not-prose relative w-full" role="search">

  <form action="dialog" method="post" class="flex gap-2" on:submit|preventDefault={doSearch}>
    <div class="search-input w-full" bind:clientWidth={w}>
      <div class="absolute right-1 bottom-px text-xs italic text-stone-400">{$searchStatus.message}</div>
      <input
        name="search"
        type="text"
        role="searchbox"
        aria-label="Search"
        bind:value={searchText}
        class="w-full px-3 py-2 rounded h-12 text-stone-900"
        placeholder="search text here"
        autocomplete="off"
        on:input={()=>{touched=true}}
      >
      <div class="search-history absolute top-full bg-stone-300 overflow-y-auto hidden flex-col max-h-60 z-50" style="width:{w}px;">
        <!-- TODO: add filtering of search history based on text -->
        {#each ($searchHistory ?? []).filter(item => item.text.includes(searchText)) as search,i}
          <button on:click={()=>{ setSearch(i) }} type="button" class="w-full block h-5 p-1 text-sm leading-none bg-stone-300 text-stone-900 border-0 text-left">
            {search?.text}
          </button>
        {/each}
      </div>
    </div>
    <button type="submit" disabled={$searchStatus.working} class="px-4 py-2 h-12 text-white bg-blue-500 rounded">Search</button>
  </form>

</div>

<style lang="postcss">
  input:focus ~ div.search-history, div.search-history:hover {
    display:flex;
  }
</style>