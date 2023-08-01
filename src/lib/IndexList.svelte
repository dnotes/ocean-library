<script lang="ts">
  import type { LibraryTree, Doc } from ".";
  import LibraryTreeSvelte from "./LibraryTree.svelte";

  export let items:Doc[]

  let tree:LibraryTree = {}

  $: tree = items.reduce((tree:LibraryTree, item:Doc) => {

    if (!tree[item.category]) tree[item.category] = {}

    if (!tree[item.category][item.collection || item.author]) tree[item.category][item.collection || item.author] = { [item.title]:item }

    if (!tree[item.category][item.collection || item.author][item.title]) tree[item.category][item.collection || item.author][item.title] = item

    return tree
  }, {})

</script>

<LibraryTreeSvelte bind:tree />