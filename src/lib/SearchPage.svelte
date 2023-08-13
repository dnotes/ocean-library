<script lang="ts">
  import { yamlSearchHits, type Doc, type Search, type SearchHit } from "$lib";
  import SearchForm from "./SearchForm.svelte";
  import { createEventDispatcher } from "svelte";
  import { currentSearchHit, searchResultsPreprocessor, searchSettings } from "./stores";
  import LibraryTree from "./LibraryTree.svelte";
  import ScoredResults from "./ScoredResults.svelte";
  import { goto } from "$app/navigation";
  import { pick, sortBy } from "lodash-es";
  import DocSvelte from "./Doc.svelte";
  import type { Writable } from "svelte/store";
  import SearchSettings from "./SearchSettings.svelte";

  export let search:Search = { text:'', results:[], settings:{...$searchSettings} }
  export let searchStore:Writable<Search>|undefined = undefined

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

  let section:"results"|"filteredResults" = 'results'
  let items:SearchHit[] = []
  $: if (search?.[section]?.length) {
    items = search?.settings?.searchSort === 'scored' ? sortBy(search[section],'score').reverse() : sortBy(search[section], 'sort')
  }

  let currentItemIndex:number = 0
  $: if ($currentSearchHit) currentItemIndex = items.findIndex(item => item === $currentSearchHit)

  function prevHit() {
    if (currentItemIndex <= 0) return
    $currentSearchHit = items[currentItemIndex-1]
  }
  function nextHit() {
    if (currentItemIndex >= items.length -1) return
    $currentSearchHit = items[currentItemIndex+1]
  }

  function getYaml(results:SearchHit[]|undefined) {
    if (!results) return ''
    let text = yamlSearchHits(results)
    navigator.clipboard.writeText(text)
    return text
  }

  let disabled=false

  let showDetail=false

</script>

<div class="flex gap-2 w-full max-w-full max-h-full overflow-hidden">

  <div class="max-w-full w-[500px] flex-grow flex-shrink-0 max-h-full flex flex-col">

    <div class="pt-7">
      <SearchForm {search} {searchStore} {disabled} on:search={updateSearch} />
    </div>

    {#if search.settings}
      <div class="py-1 flex gap-1">

        {#if !showDetail}
          <div>
            <label class="relative">
              Limit:
              {#if ![100,200,500,1000,2000,5000].includes(search.settings.searchLimit)}
                <div class="absolute text-blue-500 select-none right-4 top-0">{search.settings.searchLimit}</div>
              {/if}
              <select bind:value={search.settings.searchLimit} class="bg-transparent text-blue-500">
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
              <select name="searchSort" id="searchSort" bind:value={search.settings.searchSort} class="bg-transparent text-blue-500">
                <option value="ordered">by order</option>
                <option value="scored">by score</option>
              </select>
            </label>
          </div>
        {/if}

        <div class="flex-grow"></div>

        <div>
          <label>
            <button type="button" class='text-blue-500' on:click={()=>{search=search; showDetail = !showDetail;}}>{showDetail ? 'hide' : 'show'} detail</button>
          </label>
        </div>

      </div>
    {/if}

    {#if showDetail}
      <div class="text-sm opacity-70">
        <table>

          <tr><td>Question:</td><td>{search.text}</td></tr>

          <tr><td>Search Text:</td><td>
            {search.textPreprocessed ?? search.text}
          </td></tr>

          <tr><td>Raw:</td><td>
            {search.results.length} results
            <button type="button" class="text-xs rounded px-2 text-white bg-blue-500" on:click={()=>{getYaml(search.results)}}>copy yml</button>
          </td></tr>

          <tr title="{JSON.stringify((search?.filteredResults || []).map(r => pick(r,['title','text'])),null,2)}">
            <td>Filtered:</td><td>{search.filteredResults?.length ?? 'N/A'} results
            <button type="button" class="text-xs rounded px-2 text-white bg-blue-500" on:click={()=>{getYaml(search.filteredResults)}}>copy yml</button>
            <button type="button"
              class="text-xs rounded px-2 text-white bg-blue-500"
              {disabled} on:click={async ()=>{
                disabled=true;
                await searchResultsPreprocessor(search)
                search=search
                disabled=false
              }}>retry
            </button>
          </td></tr>

          {#if search.errors?.length}
            <tr>
              <td>
                Errors:
                <button type="button" class="px-2 text-white bg-blue-500"
                on:click={()=>{search.errors=[]}}>reset</button>
              </td>
              <td>
                {#each (search.errors || []) as err}
                  <p title="{err.detail && JSON.stringify(err.detail,null,2)}">
                    {err.message}
                    {#if err.detail}
                      <button type="button" class="text-xs rounded px-2 text-white bg-blue-500" on:click={()=>{navigator.clipboard.writeText(JSON.stringify(err.detail,null,2))}}>copy json</button>
                    {/if}
                  </p>
                {/each}
              </td>
            </tr>
          {/if}

        </table>

        <SearchSettings settings={search.settings} />
      </div>
    {/if}

    {#if search.filteredResults}
      <div class="px-4 flex gap-2 border-b-2 border-stone-500 box-content">
        <button type="button" class="filter-button" class:selected={section==='results'} on:click={()=>{section="results"}}>Raw</button>
        <button type="button" class="filter-button" class:selected={section==='filteredResults'} on:click={()=>{section="filteredResults"}}>Filtered</button>
      </div>
    {/if}
    <div class:pr-2={search?.settings?.searchSort!=='scored'} class="search-results flex-grow overflow-auto">
      {#if items && items.length}

        {#if search?.settings?.searchSort === 'scored'}
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

    {#if $currentSearchHit}
      {#await docs[$currentSearchHit?.slug || '']}
        <DocSvelte doc={$currentSearchHit} />
      {:then doc}
        <DocSvelte {doc} bind:blk={$currentSearchHit.blk}>

          <div class="absolute top-0 right-2 text-2xl lg:hidden">
            <button type="button" on:click={()=>{$currentSearchHit=undefined}}>
              &CircleTimes;
            </button>
          </div>

          <div class="text-sm">
            score: {Math.round(($currentSearchHit?.score || 0) * 100)}%
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
  button.selected { @apply bg-stone-50 border-2 border-b-0 border-stone-500; }
</style>