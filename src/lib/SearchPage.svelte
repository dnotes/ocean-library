<script lang="ts">
  import type { Doc, Search, SearchHit } from "$lib";
  import SearchForm from "./SearchForm.svelte";
  import { createEventDispatcher } from "svelte";
  import { currentSearchHit, settings } from "./stores";
  import LibraryTree from "./LibraryTree.svelte";
  import ScoredResults from "./ScoredResults.svelte";
  import { goto } from "$app/navigation";
  import { sortBy } from "lodash-es";

  export let search:Search = { text:'', results:[] }

  let dispatch = createEventDispatcher()

  function updateSearch(e:any) {
    search = e.detail
    dispatch('search',search)
  }

  let docs:{[slug:string]:Promise<Doc>} = {}

  $: if ($currentSearchHit && !docs[$currentSearchHit.slug]) {
    docs[$currentSearchHit.slug] = fetch(`/content/${$currentSearchHit.slug}.json`).then(res => res.json());
  }

  // @ts-ignore yes, it will always return true; I still need it.
  $: if ($currentSearchHit && docs[$currentSearchHit.slug]) {
    (async() => {
      await docs[$currentSearchHit.slug]
      goto(`#blk-${$currentSearchHit.blk}`)
    })()
  }

  let items:SearchHit[] = []
  $: if (search?.results?.length) {
    items = $settings.searchSort === 'scored' ? sortBy(search.results,'score').reverse() : sortBy(search.results, 'sort')
  }

  let currentItemIndex:number = 0
  $: if ($currentSearchHit) currentItemIndex = items.findIndex(item => item === $currentSearchHit)

  $:console.log(currentItemIndex)

  function prevHit() {
    if (currentItemIndex <= 0) return
    $currentSearchHit = items[currentItemIndex-1]
  }
  function nextHit() {
    if (currentItemIndex >= items.length -1) return
    $currentSearchHit = items[currentItemIndex+1]
  }

</script>

<div class="flex gap-2 w-full max-w-full max-h-full overflow-hidden">

  <div class="max-w-full w-[500px] flex-grow flex-shrink-0 max-h-full flex flex-col">

    <div class="pt-7">
      <SearchForm {search} on:search={updateSearch} />
    </div>

    <div class="py-1">
      <label>
        Sort:
        <select name="searchSort" id="searchSort" bind:value={$settings.searchSort} class="bg-transparent text-blue-500">
          <option value="ordered">by library order</option>
          <option value="scored">by score</option>
        </select>
      </label>
    </div>

    <div class:pr-2={$settings.searchSort!=='scored'} class="search-results flex-grow overflow-auto">
      {#if search.results}

        {#if $settings?.searchSort === 'scored'}
          <ScoredResults {items} bind:currentItem={$currentSearchHit} />
        {:else}
          <LibraryTree {items} bind:currentItem={$currentSearchHit} />
        {/if}

      {:else}
        <pre>
          {search?.message}
        </pre>
      {/if}
    </div>

  </div>

  {#if !$currentSearchHit}
    <div class="hidden lg:block lg:w-full text-center py-12 px-9 opacity-40 italic">
      - select a search item -
    </div>
  {/if}

  <div class:hidden={!$currentSearchHit} class="fixed left-0 right-0 top-0 bottom-0 lg:static w-full p-12 max-h-full flex flex-col overflow-hidden bg-stone-200 dark:bg-stone-900 z-50">

    <div class:hidden={!$currentSearchHit} class="min-h-20 flex-shrink-0 bg-stone-500 -ml-12 -mr-12 lg:-ml-5 -mt-12 lg:-mt-0 flex lg:flex relative">
      <div class="absolute top-0 right-2 text-2xl lg:hidden">
        <button type="button" on:click={()=>{$currentSearchHit=undefined}}>
          &CircleTimes;
        </button>
      </div>
      <div class="flex h-18 w-20 pb-2 text-5xl items-end justify-center">
        <button type="button" on:click={prevHit}>&#8678;</button>
      </div>
      <div class="flex flex-grow flex-col text-center">
        <div class="font-bold text-lg leading-tight">
          {$currentSearchHit?.title}
        </div>
        {#if $currentSearchHit?.author}
          <div class="italic text-sm">
            {$currentSearchHit?.author}
          </div>
        {/if}
        <div class="text-sm">
          score: {Math.round(($currentSearchHit?.score || 0) * 100)}%
        </div>
      </div>
      <div class="h-20 w-20 pb-2 text-5xl flex items-end justify-center">
        <button type="button" on:click={nextHit}>&#8680;</button>
      </div>
    </div>
    {#await docs[$currentSearchHit?.slug || ''] then doc}
      {#if doc}
        <div class="prose prose-xl prose-stone dark:prose-invert mx-auto overflow-auto flex-grow xl:max-w-screen-lg">
          {#each doc.blocks.slice(Math.max(($currentSearchHit?.blk || 0) - 50, 0), ($currentSearchHit?.blk || 0) + 50) as block}
            <div class="relative">{@html block}</div>
          {/each}
        </div>
      {/if}
    {/await}

  </div>

</div>
