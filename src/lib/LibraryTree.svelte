<script lang="ts">
  import { type LibraryTree, type Doc, displayCategory } from ".";
  import { settings, defaultSettings } from "./stores";

  if (!$settings) $settings = defaultSettings
  if (!$settings.categoriesHidden) $settings.categoriesHidden = []
  if (!$settings.authorsHidden) $settings.authorsHidden = []

  export let tree:LibraryTree

  Object.values(tree || {}).forEach(authors => {
    Object.entries(authors || {}).forEach(([author,documents])=> {
      let doc = (Object.values(documents) || [{}])[0]
    })
  })

</script>

<div class="flex items-center content-center h-10 sticky top-0 z-40 py-1 px-2 bg-stone-900">
  <div class="flex-grow">Category / Author / Title</div>
</div>

{#each Object.entries(tree) as [category, authors]}
  <div class="category px-2 sticky h-10 top-10 z-30 flex items-center bg-stone-600" class:mb-1={$settings.categoriesHidden.includes(category)}>
    <label>
      <input type="checkbox" name="category" value="{category}" bind:group={$settings.categoriesHidden}>
      {displayCategory(category)}
    </label>
  </div>
  {#each Object.entries(authors) as [author, documents]}
    {#if author}
      <div class="author pl-5 pr-5 h-10 top-20 z-20 flex items-center bg-stone-200 dark:bg-stone-900 underline"
        class:mb-1={$settings.authorsHidden.includes(author)}
        class:hidden={$settings.categoriesHidden.includes(category)}
      >
        <label>
          <input type="checkbox" name="author" value="{author}" bind:group={$settings.authorsHidden}>
          {author}
          <span class="float-right">{Object.keys(documents ?? {}).length}</span>
        </label>
      </div>
    {/if}
    {#each Object.entries(documents) as [title, detail]}
      <div class="document pl-7 flex items-center top-28 z-10 h-8"
        class:hidden={$settings.authorsHidden.includes(author) || $settings.categoriesHidden.includes(category)}
      >
        <div class="title leading-tight flex-grow line-clamp-1">
          <a href="/content/{detail.slug}">{title}</a>
        </div>

      </div>

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