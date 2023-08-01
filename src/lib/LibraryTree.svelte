<script lang="ts">
  import { type LibraryTree, type Doc, displayCategory } from ".";

  export let tree:LibraryTree

  export let categoriesHidden:string[] = []
  export let authorsHidden:string[] = []

  Object.values(tree || {}).forEach(authors => {
    Object.entries(authors || {}).forEach(([author,documents])=> {
      let doc = (Object.values(documents) || [{}])[0]
      if (author === (doc?.collection) && Object.values(documents).length > 5) authorsHidden.push(author)
    })
  })
  authorsHidden = authorsHidden

</script>

<div class="flex items-center content-center h-10 sticky top-0 z-40 py-1 px-2 bg-stone-900">
  <div class="flex-grow">Category / Author / Title</div>
</div>

{#each Object.entries(tree) as [category, authors]}
  <div class="category px-2 sticky h-10 top-10 z-30 flex items-center bg-stone-600" class:mb-1={categoriesHidden.includes(category)}>
    <label>
      <input type="checkbox" name="category" value="{category}" bind:group={categoriesHidden}>
      {displayCategory(category)}
    </label>
  </div>
  {#each Object.entries(authors) as [author, documents]}
    <div class="author pl-7 pr-5 sticky h-10 top-20 z-20 flex items-center bg-stone-600"
      class:mb-1={authorsHidden.includes(author)}
      class:hidden={categoriesHidden.includes(category)}
    >
      <label>
        <input type="checkbox" name="author" value="{author}" bind:group={authorsHidden}>
        {author || '(no author)'}
        <span class="float-right">{Object.keys(documents ?? {}).length}</span>
      </label>
    </div>
    {#each Object.entries(documents) as [title, detail]}
      <div class="document pl-7 flex items-center top-28 z-10 h-8"
        class:hidden={authorsHidden.includes(author) || categoriesHidden.includes(category)}
      >
        <div class="title leading-tight flex-grow">
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