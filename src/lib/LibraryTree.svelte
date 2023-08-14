<script lang="ts">
  import { sortBy } from "lodash-es";
  import { type LibraryTree, type Doc, displayCategory } from ".";
  import type { SearchHit } from "./search";
  import { createEventDispatcher } from "svelte";
  import { appSettings } from "./stores";

  const dispatch = createEventDispatcher()

  export let categoriesHidden:string[] = []
  export let authorsHidden:string[] = []
  export let documentsHidden:string[] = []

  export let items:(Doc|SearchHit)[]
  let tree:LibraryTree = {}

  $: tree = sortBy(items, 'sort').reduce((tree:LibraryTree, item:Doc|SearchHit) => {
    if (!tree[item.category]) tree[item.category] = {}
    if (!tree[item.category][item.collection || item.author]) tree[item.category][item.collection || item.author] = {}
    if (!tree[item.category][item.collection || item.author][item.title]) tree[item.category][item.collection || item.author][item.title] = []
    tree[item.category][item.collection || item.author][item.title].push(item)
    return tree
  }, {})

  export let currentItem:SearchHit|undefined = undefined
  function setItem(item:SearchHit) {
    currentItem = item
    dispatch('change', item)
  }

  const areSearchHits = (x:any[]):x is SearchHit[] => !x[0].isDoc

</script>

<div class="flex items-center content-center h-10 sticky top-0 z-40 py-1 px-2 bg-stone-50 dark:bg-stone-900">
  <div class="flex-grow">Category / Author / Title</div>
</div>

{#each Object.entries(tree) as [category, authors]}
  <div class="category px-2 sticky h-10 top-10 z-30 flex items-center bg-stone-400 dark:bg-stone-600" class:mb-1={categoriesHidden.includes(category)}>
    <label>
      <input type="checkbox" name="category" value="{category}" bind:group={categoriesHidden}>
      {displayCategory(category)}
    </label>
  </div>
  {#each Object.entries(authors) as [author, documents]}
    {#if author}
      <div class="author pr-5 sticky h-10 top-20 z-20 flex items-center bg-stone-200 dark:bg-stone-900"
        class:mb-1={authorsHidden.includes(author)}
        class:hidden={categoriesHidden.includes(category)}
      >
        <label>
          <input type="checkbox" name="author" value="{author}" bind:group={authorsHidden}>
          <span class="float-right">{Object.keys(documents ?? {}).length}</span>
          <span class="text-sm float-left mr-1 ml-2 pt-1">{#if authorsHidden.includes(author)}&plusb;{:else}&minusb;{/if}</span>
          <span class="underline">{author}</span>
        </label>
      </div>
    {/if}
    {#each Object.entries(documents) as [title, items]}
      <div class="document pl-6 pr-5 flex items-center top-28 z-10 h-8 bg-stone-200 dark:bg-stone-900"
        class:sticky={areSearchHits(items)}
        class:hidden={authorsHidden.includes(author) || categoriesHidden.includes(category)}
      >
        {#if !areSearchHits(items)}
          <div class="title leading-tight flex-grow line-clamp-1">
            <a href="/content/{items[0].slug}">{title}</a>
          </div>
        {:else}
          <label class="flex items-center">
            <input type="checkbox" name="document" value="{items[0].slug}" bind:group={documentsHidden}>
            <span class="float-right">{items.length}</span>
            <span class="text-sm float-left mr-2">{#if documentsHidden.includes(items[0].slug)}&plusb;{:else}&minusb;{/if}</span>
            <span class="line-clamp-1 font-bold text-normal">{items[0].title}</span>
          </label>
        {/if}

      </div>
      {#if areSearchHits(items)}
        {#each items as item, i}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class:hidden={authorsHidden.includes(author) || categoriesHidden.includes(category) || documentsHidden.includes(item.slug)}
            class="search-hit pl-12 py-1 leading-tight cursor-pointer border-b border-stone-500 line-clamp-{$appSettings.linesPerHit}"
            class:border-t={!i}
            on:click={()=>{ setItem(item) }}
          >
            {item?.text}
          </div>
        {/each}
      {/if}
    {/each}
  {/each}
{/each}

<style lang="postcss">

  a { @apply no-underline; }

  input[type="checkbox"] { display:none; }
  label { @apply w-full inline-block cursor-pointer; }

  div.category { font-size: 130%; }
  div.author { font-size: 110%; }
  div.document { font-size: 90%; }

</style>