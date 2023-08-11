<script>
  import SearchPage from "$lib/SearchPage.svelte";
  import { currentSearch } from "$lib/stores";
</script>

<SearchPage bind:search={$currentSearch}></SearchPage>