<script lang="ts">
  import type { Doc } from "$lib";
  import type { Search, SearchHit, SearchStatus } from "./search";
  import SearchForm from "./SearchForm.svelte";
  import { appSettings, currentSearch, currentSearchHit, currentSearchStatus } from "./stores";
  import LibraryTree from "./LibraryTree.svelte";
  import ScoredResults from "./ScoredResults.svelte";
  import { goto } from "$app/navigation";
  import { sortBy } from "lodash-es";
  import DocSvelte from "./Doc.svelte";
  import type { Writable } from "svelte/store";
  import SearchDetail from '$lib/SearchDetail.svelte'

  export let search:Writable<Search> = currentSearch
  export let searchStatus:Writable<SearchStatus> = currentSearchStatus
  export let searchHit:Writable<SearchHit|undefined> = currentSearchHit

  let docs:{[slug:string]:Promise<Doc>} = {}

  $: if ($searchHit && !docs[$searchHit.slug]) {
    docs[$searchHit.slug] = fetch(`/content/${$searchHit.slug}.json`).then(res => res.json());
  }

  // @ts-ignore yes, it will always return true; I still need it.
  $: if ($searchHit && docs[$searchHit.slug]) {
    (async() => {
      await docs[$searchHit.slug]
      goto(`#blk-${$searchHit.blk}`)
    })()
  }

  let section:"results"|"filteredResults" = 'results'
  let items:SearchHit[] = []
  $: if ($search?.[section]?.length) {
    items = $search?.settings?.searchSort === 'scored' ? sortBy($search[section],'score').reverse() : sortBy($search[section], 'sort')
  }

  let currentItemIndex:number = 0
  $: if ($searchHit) currentItemIndex = items.findIndex(item => item === $searchHit)

  function prevHit() {
    if (currentItemIndex <= 0) return
    $searchHit = items[currentItemIndex-1]
  }
  function nextHit() {
    if (currentItemIndex >= items.length -1) return
    $searchHit = items[currentItemIndex+1]
  }

  let w:number = 0
  $: compact = w < 1350
  $: twoCols = !compact && $appSettings.showSearchDetail

</script>

<div class="flex gap-2 w-full max-w-full max-h-full overflow-hidden" bind:clientWidth={w}>

  <div class="max-w-full flex-grow flex-shrink-0 max-h-full flex flex-{twoCols  ? 'row' : 'col'} gap-4" style="width:{twoCols ? '900px' : '500px'};">

    <div class="flex flex-col max-w-full max-h-full overflow-auto flex-shrink-0 {twoCols && 'w-[450px]'}">
      <div class="pt-7">
        <SearchForm {search} {searchStatus} />
      </div>
      {#if $search.settings}
        <div class="py-1 flex gap-1">
          <div>
            <label class="relative">
              Limit:
              {#if ![100,200,500,1000,2000,5000].includes($search.settings.searchLimit)}
                <div class="absolute text-blue-500 select-none right-4 top-0">{$search.settings.searchLimit}</div>
              {/if}
              <select bind:value={$search.settings.searchLimit} class="bg-transparent text-blue-500">
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
                <option value={2000}>2000</option>
                <option value={5000}>5000</option>
              </select>
            </label>
          </div>
          <div>
            <label>
              Sort:
              <select name="searchSort" id="searchSort" bind:value={$search.settings.searchSort} class="bg-transparent text-blue-500">
                <option value="ordered">by order</option>
                <option value="scored">by score</option>
              </select>
            </label>
          </div>
          <div>
            <label>
              MaxLines:
              <select name="hitLines" id="hitLines" bind:value={$appSettings.linesPerHit} class="bg-transparent text-blue-500">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>
          </div>
          <div class="flex-grow"></div>
          <div>
            <label>
              <button type="button" class='text-blue-500 text-xs' on:click={()=>{$search = $search; $appSettings.showSearchDetail = !$appSettings.showSearchDetail;}}>
                <span class="rounded-full {$search.settings.searchTextPreprocessing ? 'bg-blue-200' : 'opacity-30'}">🔍</span>
                <span class="rounded-full {$search.settings.searchResultsFiltering ? 'bg-blue-200' : 'opacity-30'}">📖</span>
                <span class="rounded-full {$search.settings.searchResultsProcessing ? 'bg-blue-200' : 'opacity-30'}">🤓</span>
                {$appSettings.showSearchDetail ? 'hide' : 'show'} detail</button>
            </label>
          </div>
        </div>
      {/if}
      {#if $appSettings.showSearchDetail}
        <SearchDetail {search} {searchStatus}></SearchDetail>
      {/if}
    </div>

    <div class="flex flex-col max-w-full max-h-full overflow-auto {twoCols && 'w-[450px]'}">
      {#if $search.filteredResults}
        <div class="px-4 flex gap-2 border-b-2 border-stone-500 box-content">
          <button type="button" class="filter-button" class:selected={section==='results'} on:click={()=>{section="results"}}>Raw ({$search.results?.length || 0})</button>
          <button type="button" class="filter-button" class:selected={section==='filteredResults'} on:click={()=>{section="filteredResults"}}>Filtered ({$search.filteredResults?.length || 0})</button>
        </div>
      {/if}
      <div class:pr-2={$search?.settings?.searchSort!=='scored'} class="search-results flex-grow overflow-auto">
        {#if items && items.length}
          {#if $search?.settings?.searchSort === 'scored'}
            <ScoredResults {items} bind:currentItem={$searchHit} />
          {:else}
            <LibraryTree {items} bind:currentItem={$searchHit} />
          {/if}
        {/if}
      </div>
    </div>

  </div>

  {#if !$searchHit}
    <div class="hidden lg:block lg:w-full text-center py-12 px-9 opacity-40 italic">
      - select a search item -
    </div>
  {/if}

  <div class:hidden={!$searchHit} class="fixed left-0 right-0 top-0 bottom-0 lg:static w-full max-h-full flex flex-col overflow-hidden z-50 bg-stone-50 dark:bg-stone-900">

    {#if $searchHit}
      {#await docs[$searchHit?.slug || '']}
        <DocSvelte doc={$searchHit} />
      {:then doc}
        <DocSvelte {doc} bind:blk={$searchHit.blk} bind:hit={$searchHit}>

          <div class="absolute top-0 right-2 text-2xl lg:hidden">
            <button type="button" on:click={()=>{$searchHit=undefined}}>
              &CircleTimes;
            </button>
          </div>

          <div class="text-sm">
            score: {Math.round(($searchHit?.score || 0) * 100)}%
          </div>

          <div slot="compact">
            <div class="text-5xl absolute top-10 left-4">
              <button type="button" on:click={prevHit}>&#8678;</button>
            </div>

            <div class="text-5xl absolute top-10 right-4">
              <button type="button" on:click={nextHit}>&#8680;</button>
            </div>
          </div>
        </DocSvelte>
      {/await}
    {/if}

  </div>

</div>

<style lang="postcss">
  .filter-button { @apply relative top-1 rounded-t pb-1 px-2; }
  button.selected { @apply bg-stone-50 dark:bg-stone-900 border-2 border-b-0 border-stone-500; }
</style>