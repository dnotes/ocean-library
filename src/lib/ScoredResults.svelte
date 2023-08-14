<script lang="ts">
  import type { SearchHit } from "$lib/search";
  import { sortBy } from "lodash-es";
  import { createEventDispatcher } from "svelte";
  import { appSettings } from "./stores";

  const dispatch = createEventDispatcher()

  export let items:SearchHit[]

  let results = sortBy(items,'score').reverse()

  export let currentItem:SearchHit|undefined
  function setItem(item:SearchHit) {
    currentItem = item
    dispatch('change',item)
  }

</script>


{#each results as item}

  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="px-4 py-1 leading-snug border-b border-b-stone-500 overflow-hidden relative line-clamp-{$appSettings.linesPerHit} cursor-pointer"
    class:highlight={item === currentItem}
    on:click={()=>{setItem(item)}}
  >
    {item.text}
  </div>

{/each}
