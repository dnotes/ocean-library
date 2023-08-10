<script lang="ts">
  import type { PageServerData } from "./$types";
  import SearchForm from "$lib/SearchForm.svelte";
  import { goto } from "$app/navigation";
  import { currentSearch } from "$lib/stores";

  export let data:PageServerData

</script>

<div class="prose prose-stone dark:prose-invert prose-lg flex flex-col mx-auto pt-9">

{@html data.html}

<SearchForm on:search={(e)=>{ $currentSearch=e.detail; goto('search') }} />

</div>
