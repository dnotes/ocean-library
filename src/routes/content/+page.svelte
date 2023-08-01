<script lang="ts">
  import type { PageData } from "./$types";
  import IndexList from "$lib/IndexList.svelte";
  export let data:PageData
</script>

<IndexList items={data.allContent} />
