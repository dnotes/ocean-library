<script lang="ts">
  import type { PageData } from "./$types";
  import LibraryTree from "$lib/LibraryTree.svelte";
  export let data:PageData
</script>

<LibraryTree items={data.allContent} />
