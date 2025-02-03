<script lang="ts">
  import { NotebookFileService } from '$lib/services/notebook-file';
  import Notebook from '$lib/components/Notebook.svelte';
  import NotebookToolbar from '$lib/components/NotebookToolbar.svelte';
  import type { Notebook as NotebookType } from '$lib/types/notebook';
  import { onMount } from 'svelte';

  let currentNotebook: NotebookType;

  onMount(() => {
    // Start with a new notebook
    currentNotebook = NotebookFileService.createNewNotebook();
  });

  function handleNotebookLoad(event: CustomEvent<{ notebook: NotebookType }>) {
    currentNotebook = event.detail.notebook;
  }

  function handleNotebookNew(event: CustomEvent<{ notebook: NotebookType }>) {
    currentNotebook = event.detail.notebook;
  }
</script>

<div class="app">
  {#if currentNotebook}
    <NotebookToolbar
      notebook={currentNotebook}
      on:load={handleNotebookLoad}
      on:new={handleNotebookNew}
    />
    <Notebook bind:notebook={currentNotebook} />
  {/if}
</div>

<style>
  .app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background: #fff;
    color: #333;
  }
</style> 