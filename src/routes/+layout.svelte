<script>
  import { goto } from "$app/navigation";
  import SearchForm from "$lib/SearchForm.svelte";
  import { currentSearch } from "$lib/stores";
  import "../app.postcss";
</script>

<div id="page" class="flex flex-col w-screen h-screen relative">

  <div class="hidden md:flex sticky top-0 z-50 px-9 h-16 w-full bg-blue-400 flex-shrink-0 items-center gap-5">
    <div class="text-3xl font-bold">
      <a href="/">Ocean AI Testing</a>
    </div>
    <div class="flex-grow"></div>
    <nav class="flex gap-2">
      <a href="/content">Content</a>
      <a href="/search">Search</a>
      <a href="/settings">Settings</a>
    </nav>
    <div class="w-800">
      <SearchForm on:search={(e)=>{
        $currentSearch = e.detail
        goto('/search')
      }} />
    </div>
  </div>

  <div class="px-9 overflow-auto flex-grow">
    <slot/>
  </div>

  <nav class="flex md:hidden px-5 h-12 w-full flex-shrink-0 items-center gap-1">
    <a href="/content">Content</a>
    <a href="/search">Search</a>
    <a href="/settings">Settings</a>
  </nav>

</div>

<style lang="postcss">
  nav a { @apply py-1 px-2 block font-bold; }
</style>