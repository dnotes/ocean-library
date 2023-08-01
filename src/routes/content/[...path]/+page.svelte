<script lang="ts">
  import type { PageData } from "./$types";
  // @ts-ignore this doesn't have a type
  import md from 'ocean-markdown-it'
  export let data:PageData
</script>

<div>
  {#if !data.content.markdown?.startsWith('# ')}
    <h1>{data.content.title}</h1>
  {/if}
  {@html md.render(data.content.markdown)}
</div>
