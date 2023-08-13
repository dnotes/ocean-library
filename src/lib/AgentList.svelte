<script lang="ts">
  import { agents, ephemeralApiKey } from './stores';
  export let setting:string = ''
</script>

<select bind:value={setting} class="p-0 text-blue-500 bg-transparent border-0 mx-2">
  <option value="" selected><em>- none -</em></option>
  {#each $agents as agent}
    {#if agent.url && agent.model && (agent.apiKey || $ephemeralApiKey)}
      <option value={agent.name}>{agent.name}</option>
    {/if}
  {/each}
</select>