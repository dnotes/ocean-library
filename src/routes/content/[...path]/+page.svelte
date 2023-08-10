<script lang="ts">
  import { displayCategory } from "$lib";
  import type { PageData } from "./$types";

  export let data:PageData
</script>

<div class="prose prose-lg px-4 prose-stone dark:prose-invert pt-16 mx-auto max-h-full overflow-y-auto overflow-x-visible relative">
  <h1>{data.content.title}</h1>

  <div class="top-40 left-5 text-sm italic lg:fixed lg:w-44 xl:w-72">
    <div class="font-bold text-lg not-italic hidden lg:block">{data.content.title}</div>

    <div>
      {displayCategory(data.content.category)}
      {#if data.content.collection}
        &RightArrow; {data.content.collection}
      {/if}
    </div>

    {#if data.content.author}
      <div>author: {data.content.author}</div>
    {/if}

    {#if data.content.description}
      <div>{data.content.description}</div>
    {/if}
  </div>

  {#each data.content.blocks as item}
    <div class="relative">{@html item}</div>
  {/each}

</div>
