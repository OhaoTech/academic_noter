<script lang="ts">
  import { NotebookFileService } from '$lib/services/notebook-file';
  import type { Notebook } from '$lib/types/notebook';
  import { createEventDispatcher } from 'svelte';

  export let notebook: Notebook;
  const dispatch = createEventDispatcher<{
    load: { notebook: Notebook };
    save: void;
    new: { notebook: Notebook };
  }>();

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    try {
      const file = input.files[0];
      if (!file.name.endsWith('.an')) {
        alert('Please select a valid .an notebook file');
        return;
      }

      const loadedNotebook = await NotebookFileService.loadNotebook(file);
      if (!NotebookFileService.validateNotebook(loadedNotebook)) {
        throw new Error('Invalid notebook file format');
      }

      dispatch('load', { notebook: loadedNotebook });
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Failed to load notebook file');
    }
  }

  async function handleSave() {
    try {
      const blob = await NotebookFileService.saveNotebook(notebook);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${notebook.metadata.title.toLowerCase().replace(/\s+/g, '_')}.an`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      dispatch('save');
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Failed to save notebook');
    }
  }

  function handleNew() {
    const title = prompt('Enter notebook title:', 'Untitled Notebook');
    if (!title) return;

    const newNotebook = NotebookFileService.createNewNotebook(title);
    dispatch('new', { notebook: newNotebook });
  }
</script>

<div class="toolbar">
  <div class="file-operations">
    <button on:click={handleNew}>New</button>
    <label class="file-input-label">
      Open
      <input
        type="file"
        accept=".an"
        on:change={handleFileSelect}
        style="display: none;"
      />
    </label>
    <button on:click={handleSave}>Save</button>
  </div>
  
  <div class="notebook-info">
    <h1>{notebook.metadata.title}</h1>
    {#if notebook.metadata.authors?.length}
      <div class="authors">by {notebook.metadata.authors.join(', ')}</div>
    {/if}
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
  }

  .file-operations {
    display: flex;
    gap: 0.5rem;
  }

  .file-operations button,
  .file-input-label {
    padding: 0.5rem 1rem;
    background: #fff;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .file-operations button:hover,
  .file-input-label:hover {
    background: #e9ecef;
  }

  .notebook-info {
    text-align: right;
  }

  .notebook-info h1 {
    margin: 0;
    font-size: 1.5rem;
    color: #212529;
  }

  .authors {
    font-size: 0.9rem;
    color: #6c757d;
    margin-top: 0.25rem;
  }
</style> 