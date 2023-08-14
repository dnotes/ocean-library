<script lang="ts">

  import SearchSettings from "$lib/SearchSettings.svelte";
  import { appSettings, searchSettings, agents, defaultAgent, ephemeralApiKey, defaultAgents, defaultSearchSettings, searchHistory } from "$lib/stores";


</script>

<div class="settings-page prose prose-stone dark:prose-invert max-w-screen-md mt-9">

  <h2>App Settings</h2>
  <div class="settings-wrapper">

    <div class="field">
      <label>
        <span>Embedding LLM:</span>
        <div>
          <input type="text" disabled bind:value={$appSettings.embeddingsLLM}>
          <p class="helptext">For the moment, only the default LLM may be used to generate embeddings.</p>
        </div>
      </label>
    </div>

    <div class="field">
      <label>
        <span>Default Api Key:</span>
        <div>
          <input type="text" bind:value={$ephemeralApiKey}>
          <p class="helptext">This API Key will be used with any AI Agent that doesn't have one,
            and will not be saved to local storage.
            Refreshing the page will remove it from memory.</p>
        </div>
      </label>
    </div>

  </div>

  <h2>Default Search Settings
    <button type="button" class="blue" on:click={()=>{$searchSettings = {...defaultSearchSettings}}}>Reset</button>
  </h2>
  <SearchSettings bind:settings={$searchSettings} />

  <h2>AI Agents
    <button type="button" class="blue" on:click={()=>{$agents = [...defaultAgents]}}>Reset</button>
  </h2>
  <div class="settings-wrapper">
    {#each $agents as agent,i}
      <div class="field">
        <label class="relative">
          <span>Name:</span><input type="text" bind:value={agent.name}>
          <button type="button" class="text-red-600 text-3xl absolute right-1 -top-1" on:click={()=>{ $agents.splice(i,1); $agents=$agents; }}>&CircleTimes;</button>
        </label>
        <label><span>Model:</span><input type="text" bind:value={agent.model}></label>
        <label><span>API Key:</span><input type="text" bind:value={agent.apiKey}></label>
        <label><span>URL:</span><input type="text" bind:value={agent.url}></label>
        <label><span>Context Size:</span><input type="number" bind:value={agent.contextSize}></label>
      </div>
    {/each}
    <button type="button" class="text-sm px-4 py-2 text-white bg-blue-500 rounded" on:click={() => {$agents = [...$agents, {...defaultAgent}]}}>+ add</button>
  </div>

  <h2>Search History
    <button type="button" class="blue" on:click={()=>{$searchHistory = []}}>Reset</button>
  </h2>
  <div class="settings-wrapper">
    <ul>
      {#each $searchHistory as item}
        <li class="relative">{item.text}</li>
      {/each}
    </ul>
  </div>

</div>

<style lang="postcss">
  label { @apply flex mt-2; }
  label > span { @apply block w-32 flex-shrink-0; }
  input[type=text] { @apply flex-grow w-full; }
  input { @apply px-3 py-1 text-stone-900; }
  .field { @apply mt-8; }
  .field:first-child { @apply mt-0}
  .helptext { @apply text-sm text-stone-500 leading-tight px-4 my-2; }
  button.blue { @apply float-right text-sm font-normal px-4 py-2 text-white bg-blue-500 rounded; }
  :global(div.settings-wrapper) {
    @apply bg-stone-300 dark:bg-stone-900 p-2 prose prose-stone dark:prose-invert max-w-full;
  }
</style>