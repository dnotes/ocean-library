<script lang="ts">
  import type { SearchHit } from "$lib";
  import { sortBy } from "lodash-es";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher()

  export let items:SearchHit[]

  let results = sortBy(items,'score').reverse()

  let currentItem:SearchHit|undefined
  function setItem(item:SearchHit) {
    currentItem = item
    dispatch('change',item)
  }

</script>


{#each items as item}

  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="px-4 leading-loose border-b border-b-stone-500 overflow-hidden relative line-clamp-1 cursor-pointer"
    on:click={()=>{setItem(item)}}
  >
    {item.text}
  </div>

{/each}
