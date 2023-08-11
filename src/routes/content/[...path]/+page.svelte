<script lang="ts">
  import { displayCategory } from "$lib";
  import type { PageData } from "./$types";
  import Doc from "$lib/Doc.svelte";

  export let data:PageData
</script>

<Doc doc={data.content} />