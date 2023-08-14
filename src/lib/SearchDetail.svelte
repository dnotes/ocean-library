<script lang="ts">

  import type { Writable } from "svelte/store";
  import { yamlSearchHits, type Search, type SearchHit, type SearchStatus, generateEmbeddings, dbQuery, preprocessResults, preprocessSearchText } from "./search";
  import { currentSearch, currentSearchStatus } from "./stores";
  import { pick } from "lodash-es";
  import SearchSettings from "./SearchSettings.svelte";

  export let search:Writable<Search> = currentSearch
  export let searchStatus:Writable<SearchStatus> = currentSearchStatus

  function getYaml(results:SearchHit[]|undefined) {
    if (!results) return ''
    let text = yamlSearchHits(results)
    navigator.clipboard.writeText(text)
    return text
  }

</script>

<div class="text-sm opacity-70">
  <table>

    <tr><th class="w-24 text-left">Item</th><th class="text-left">Detail</th></tr>

    <tr><td>Query:</td><td>{$search.text}</td></tr>

    {#if $search.settings?.searchTextPreprocessing}
      <tr><td>Search Text:</td><td>
        {$search.textPreprocessed ?? $search.text}
        <button type="button" disabled={$searchStatus.working} on:click={async ()=>{
          $searchStatus = { working:true, message:'Preprocessing search text...' }
          $search = await preprocessSearchText($search)
          $searchStatus = { working:false, message:'' }
        }}>retry</button>
      </td></tr>
    {/if}

    <tr title="{JSON.stringify(($search?.results || []).map(r => pick(r,['title','text'])),null,2)}">
      <td>Raw:</td><td>
      {($search.results || []).length} results
      <button type="button" on:click={()=>{getYaml($search.results)}}>copy</button>
      <button type="button" disabled={$searchStatus.working} on:click={async ()=>{
        $searchStatus = { working:true, message:'Running db query...'}
        $search = await generateEmbeddings($search)
        $search = await dbQuery($search)
        $searchStatus = { working:false, message:'' }
      }}>retry</button>
    </td></tr>

    {#if $search.settings.searchResultsPreprocessing}
      <tr title="{JSON.stringify(($search?.filteredResults || []).map(r => pick(r,['title','text'])),null,2)}">
        <td>Filtered:</td><td>{$search.filteredResults?.length ?? 'N/A'} results
        <button type="button" class="text-xs rounded px-2 text-white bg-blue-500" on:click={()=>{getYaml($search.filteredResults)}}>copy</button>
        <button type="button" disabled={$searchStatus.working} on:click={async ()=>{
          $searchStatus = { working:true, message:'Filtering results...'}
          $search = await preprocessResults($search)
          $searchStatus = { working:false, message:'' }
        }}>retry
        </button>
      </td></tr>
    {/if}

    {#if $search.errors?.length}
      <tr>
        <td>
          Errors:
          <button type="button" class="px-2 text-white bg-blue-500"
          on:click={()=>{$search.errors=[]}}>reset</button>
        </td>
        <td>
          <ul>
            {#each ($search.errors || []) as err}
              <li title="{err.detail && JSON.stringify(err.detail,null,2)}">
                {err.message}
                {#if err.detail}
                  <button type="button" class="text-xs rounded px-2 text-white bg-blue-500" on:click={()=>{navigator.clipboard.writeText(JSON.stringify(err.detail,null,2))}}>copy json</button>
                {/if}
              </li>
            {/each}
          </ul>
        </td>
      </tr>
    {/if}

  </table>

  <SearchSettings settings={$search.settings} />
</div>

<style lang="postcss">
  button { @apply text-xs rounded px-2 text-white bg-blue-500 }
  button:disabled { @apply bg-gray-400; }
</style>