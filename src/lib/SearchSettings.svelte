<script lang="ts">
  import AgentList from "./AgentList.svelte";
  import { defaultSearchSettings, type SearchSettings } from "./stores";

  export let settings:SearchSettings = {...defaultSearchSettings}

</script>

<div class="settings-wrapper">

<div class="field flex gap-5">

  <label class="flex-grow">
    Limit results:
    <input type="number" name="searchLimit" id="searchLimit" bind:value={settings.searchLimit}>
  </label>

  <label>
    Sort:
    <select name="searchSort" id="searchSort" bind:value={settings.searchSort} class="bg-transparent text-blue-500">
      <option value="ordered">by order</option>
      <option value="scored">by score</option>
    </select>
  </label>

</div>

<div class="field">
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <div class="flex gap-5">
    <label class="flex-grow">
      🔍 Preprocess text
      <AgentList bind:setting={settings.searchTextPreprocessing} />
    </label>
    <label>
      Temp
      <input type="number" min=0 max=2 step=.01 name="searchTextPreprocessingTemperature" id="searchTextPreprocessingTemperature" bind:value={settings.searchTextPreprocessingTemp}>
    </label>
  </div>
  <div class:hidden={!settings.searchTextPreprocessing}>
    <textarea name="searchTextPreprocessingPrompt" id="searchTextPreprocessingPrompt" rows="4" bind:value={settings.searchTextPreprocessingPrompt}></textarea>
    <div class="helptext">
      <p>This prompt asks your AI agent to create a database query from your original question. You can use the following variables:</p>
      <ul>
        <li><span>&lbrace;question&rbrace;</span>the original question from the user</li>
      </ul>
    </div>
  </div>
</div>

<div class="field">
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <div class="flex gap-5">
    <label class="flex-grow">
      📖 Preprocess results
      <AgentList bind:setting={settings.searchResultsPreprocessing} />
    </label>
    <label>
      Temp
      <input type="number" min=0 max=2 step=.01 name="searchResultsPreprocessingTemperature" id="searchResultsPreprocessingTemperature" bind:value={settings.searchResultsPreprocessingTemp}>
    </label>
  </div>
  <div class:hidden={!settings.searchResultsPreprocessing}>
    <textarea name="searchResultsPreprocessingPrompt" id="searchResultsPreprocessingPrompt" rows="4" bind:value={settings.searchResultsPreprocessingPrompt}></textarea>
    <div class="helptext">
      <p>This prompt asks your AI agent to narrow down the search results to obtain a better context. You can use the following variables:</p>
      <ul>
        <li><span>&lbrace;question&rbrace;</span>the original question from the user</li>
        <li><span>&lbrace;query&rbrace;</span>the database query from search text preprocessing</li>
        <li><span>&lbrace;context&rbrace;</span>the results of the database query, as text</li>
      </ul>
    </div>
  </div>
</div>

<div class="field">
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <div class="flex gap-5">
    <label class="flex-grow">
      🤓 Summarize results
      <AgentList bind:setting={settings.searchResultsProcessing} />
    </label>
    <label>
      Temp
      <input type="number" min=0 max=2 step=.01 name="searchResultsProcessingTemperature" id="searchResultsProcessingTemperature" bind:value={settings.searchResultsProcessingTemp}>
    </label>
  </div>
  <div class:hidden={!settings.searchResultsProcessing}>
    <textarea name="searchResultsProcessingPrompt" id="searchResultsProcessingPrompt" rows="4" bind:value={settings.searchResultsProcessingPrompt}></textarea>
    <div class="helptext">
      <p>This prompt asks your AI agent to do something with the full search results. You can use the following variables:</p>
      <ul>
        <li><span>&lbrace;question&rbrace;</span>the original question from the user</li>
        <li><span>&lbrace;query&rbrace;</span>the database query from search text preprocessing</li>
        <li><span>&lbrace;context&rbrace;</span>the results of the database query, as text</li>
      </ul>
    </div>
  </div>
</div>

</div>

<style lang="postcss">
  input[type=number] { @apply bg-transparent text-blue-500 w-16; }
  textarea { @apply px-3 py-2 rounded text-stone-900; }
  textarea { @apply w-full leading-tight; }
  .field { @apply mt-3; }
  .field:first-child { @apply mt-0}
  .helptext { @apply text-sm text-stone-500 leading-tight px-4 my-2; }
  .helptext li>span { @apply inline-block w-24 text-green-700 font-bold; }
</style>