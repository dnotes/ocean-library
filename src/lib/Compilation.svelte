<script lang="ts">
  import type { Writable } from "svelte/store";
  import type { Search } from "./search";
  import DocSvelte from "./Doc.svelte";
  import type { Doc } from "$lib";
  import { transliterate } from "transliteration";

  export let search:Writable<Search>

  let doc:Doc
  $: doc = {
    isDoc: true,
    id: 'compilation',
    author: '',
    sort: '',
    title: $search.text,
    category: 'compilations',
    slug: transliterate($search.text),
    language: 'en',
    blocks: []
  }

  $: excerpts = ($search.compilation || [])?.map(item => $search.filteredResults?.find(b => b.slug === item.slug && b.blk === item.blk))

  $: summary = ($search.summary || '')?.split(/\n\n+/g).filter(Boolean)

</script>


{#if doc}

  <DocSvelte {doc}>

    <div slot="blocks">
      {#each summary as item}
        <p class="font-thin italic leading-snug">{item}</p>
      {/each}

      <hr>

      {#each (excerpts) as ex}
        {#if ex}
          {#each ex?.blocks as text, i}
            <p>{text}</p>
          {/each}
          <p class="cite"><a href="/content/{ex.slug}#{ex.blocksStart}">{ex.author}, <em>{ex.title}</em></a></p>
        {/if}
      {/each}
    </div>

  </DocSvelte>

{/if}

