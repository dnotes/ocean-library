<script lang="ts">
  import type { Doc, Search, SearchHit } from "$lib";
  import SearchForm from "./SearchForm.svelte";
  import { createEventDispatcher } from "svelte";
  import { currentSearchHit, settings } from "./stores";
  import LibraryTree from "./LibraryTree.svelte";
  import ScoredResults from "./ScoredResults.svelte";

  export let search:Search = { text:'', results:[] }

  let dispatch = createEventDispatcher()

  function updateSearch(e:any) {
    search = e.detail
    dispatch('search',search)
  }

  let docs:{[slug:string]:Promise<Doc>} = {}

  $: if ($currentSearchHit && !docs[$currentSearchHit.slug]) {
    docs[$currentSearchHit.slug] = fetch(`/content/${$currentSearchHit.slug}.json`).then(res => res.json())
  }

</script>

<div class="flex gap-2 w-full max-w-full max-h-full overflow-hidden">

  <div class="max-w-full w-96 flex-grow flex-shrink-0 max-h-full flex flex-col">

    <div class="pt-7">
      <SearchForm {search} on:search={updateSearch} />
    </div>

    <div class="py-3">
      <label>
        Sort:
        <select name="searchSort" id="searchSort" bind:value={$settings.searchSort} class="text-stone-900 px-2 py-1">
          <option value="ordered">by library order</option>
          <option value="scored">by score</option>
        </select>
      </label>
    </div>

    <div class="search-results flex-grow overflow-auto">
      {#if search.results}

        {#if $settings?.searchSort === 'scored'}
          <ScoredResults items={search.results} on:change={(e)=>{$currentSearchHit = e.detail}} />
        {:else}
          <LibraryTree items={search.results} on:change={(e)=>{$currentSearchHit = e.detail}} />
        {/if}

      {:else}
        <pre>
          {search?.message}
        </pre>
      {/if}
    </div>

  </div>

  <div class="hidden md:block w-full p-12 max-h-full overflow-auto">

    {#if $currentSearchHit}
      {#await docs[$currentSearchHit.slug] then doc}
        <div class="prose prose-xl prose-stone dark:prose-invert mx-auto">
          {@html doc.blocks[$currentSearchHit.blk]}
          <div class="cite">
            {#if $currentSearchHit.author && $currentSearchHit.author !== 'various'}
              {$currentSearchHit.author},
            {/if}
            <a class="italic no-underline text-blue-500" href="/content/{$currentSearchHit.slug}#blk-{$currentSearchHit.blk}">{$currentSearchHit.title}</a>
          </div>
        </div>
      {/await}
    {/if}

  </div>

</div>
