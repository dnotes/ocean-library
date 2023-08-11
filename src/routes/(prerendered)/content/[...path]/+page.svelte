<script lang="ts">
  import type { PageData } from "./$types";
  import Doc from "$lib/Doc.svelte";

  export let data:PageData
</script>

{#if data.content}
  <Doc doc={data.content} />
{/if}
