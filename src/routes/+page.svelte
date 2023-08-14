<script lang="ts">
  import SearchForm from "$lib/SearchForm.svelte";
  import { goto } from "$app/navigation";
  import { currentSearch } from "$lib/stores";

</script>

<div class="prose prose-stone dark:prose-invert prose-lg flex flex-col mx-auto pt-9">

  <h1>Ocean Library AI Testing</h1>

  <p>
    This web application has been created to test AI-assisted semantic search of some core Ocean content.
    Please be aware of the following limitations:
  </p>

  <ul>
    <li>
      <h4>Only a subset of the available books are indexed</h4>
      <p>This is owing to database size restrictions with free usage tiers. This is only for testing, after all!</p>
    </li>
    <li>
      <h4 class="text-red-400">Some content may be textually inaccurate</h4>
      <p>This site uses markdown versions of these texts which have not been vetted extensively, and
        you will commonly find the following errors:</p>
        <ul>
          <li>mis-numbered paragraphs</li>
          <li>headings improperly rendered as paragraphs</li>
          <li>missing or incorrect footnotes</li>
          <li>completely garbled tables</li>
        </ul>
        <p>Less commonly you may also find some errors in the texts themselves.
          Again, this is only for testing; the real Ocean Library will have far more accurate texts.</p>
    </li>
  </ul>

  <p class="font-bold">Please visit <a href="https://oceanlibrary.com" class="font-bold text-blue-500">https://oceanlibrary.com</a> for the
    free, fully-featured version 2 of Ocean Library, where you can read, download, and listen to professional audio recordings for all these
    texts and more.</p>

  <img src="/images/Ocean2.png" alt="Ocean 2.0, an amazing app for reading or listening to the religious texts of the world.">

  <h2>Search testing</h2>

  <p>To use this playground for testing AI-assisted search of religious texts, you can start with the basic search below.</p>

  <SearchForm on:search={(e)=>{ $currentSearch=e.detail; goto('search') }} />

</div>
