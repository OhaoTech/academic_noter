<script lang="ts">
  import type { NotebookCell } from '$lib/types/notebook';
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { EditorView } from 'codemirror';
  import { markdown } from '@codemirror/lang-markdown';
  import { python } from '@codemirror/lang-python';
  import { javascript } from '@codemirror/lang-javascript';
  import { oneDark } from '@codemirror/theme-one-dark';
  import RichText from './RichText.svelte';

  export let cell: NotebookCell;
  export let isEditing: boolean = true;  // Default to editing mode
  export let isExecuting: boolean = false;

  const dispatch = createEventDispatcher();
  let editor: EditorView;
  let editorElement: HTMLElement;
  let outputElement: HTMLElement;

  // Watch for changes in isEditing
  $: if (isEditing && editorElement && !editor) {
    setupEditor();
  } else if (!isEditing && editor) {
    editor.destroy();
    editor = null;
  }

  onMount(() => {
    if (isEditing) {
      setupEditor();
    }
  });

  function setupEditor() {
    if (!editorElement) return;  // Guard against null element
    
    const extensions = [oneDark];
    
    switch (cell.metadata.type) {
      case 'markdown':
      case 'latex':
        extensions.push(markdown());
        break;
      case 'python':
        extensions.push(python());
        break;
      case 'javascript':
        extensions.push(javascript());
        break;
    }

    editor = new EditorView({
      parent: editorElement,
      extensions,
      doc: cell.content.source
    });

    // Format math content on initial load for latex cells
    if (cell.metadata.type === 'latex') {
      const content = cell.content.source;
      // Replace plain text math variables with LaTeX
      const formattedContent = content
        .replace(/\$L_o\$(?!\s+is)/g, '$L_o(x, \\omega_o)$')
        .replace(/\$L_e\$(?!\s+is)/g, '$L_e(x, \\omega_o)$')
        .replace(/\$f_r\$(?!\s+is)/g, '$f_r(x, \\omega_i, \\omega_o)$')
        .replace(/\$L_i\$(?!\s+is)/g, '$L_i(x, \\omega_i)$');
      
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: formattedContent }
      });
    }

    // Set focus to the editor
    editor.focus();
  }

  // Update cell content when editor changes
  function handleEditorChange() {
    if (editor) {
      const content = editor.state.doc.toString();
      cell.content.source = content;
      dispatch('change', {
        id: cell.metadata.id,
        content
      });
    }
  }

  async function executeCell() {
    if (isExecuting) return;
    
    // Make sure to get the latest content from the editor
    const content = editor?.state?.doc?.toString() || cell.content.source;
    
    dispatch('execute', {
      id: cell.metadata.id,
      type: cell.metadata.type,
      content
    });
  }

  function renderOutput() {
    if (!cell.content.outputs?.length) return;
    
    const output = cell.content.outputs[cell.content.outputs.length - 1];
    switch (output.type) {
      case 'text':
        return `<pre>${output.data}</pre>`;
      case 'html':
        return output.data;
      case '3d':
        return '<div class="threejs-container"></div>';
      case 'error':
        return `<div class="error">${output.data}</div>`;
      default:
        return '';
    }
  }

  // Clean up editor on destroy
  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });
</script>

<div class="cell" class:editing={isEditing}>
  <div class="cell-controls">
    <button on:click={() => dispatch('toggle-edit')}>
      {isEditing ? 'Preview' : 'Edit'}
    </button>
    {#if !['markdown', 'latex'].includes(cell.metadata.type)}
      <button 
        on:click={executeCell}
        disabled={isExecuting}
      >
        {isExecuting ? 'Running...' : 'Run'}
      </button>
    {/if}
  </div>

  <div class="cell-content">
    {#if isEditing}
      <div bind:this={editorElement} class="editor" />
    {:else}
      {#if cell.metadata.type === 'markdown' || cell.metadata.type === 'latex'}
        <div class="rich-content">
          <RichText content={cell.content.source} />
        </div>
      {:else}
        <pre class="code-preview">{cell.content.source}</pre>
      {/if}
    {/if}

    {#if cell.content.outputs?.length}
      <div bind:this={outputElement} class="cell-output">
        {@html renderOutput()}
      </div>
    {/if}
  </div>
</div>

<style>
  .cell {
    border: 1px solid #ddd;
    margin: 8px 0;
    border-radius: 4px;
    overflow: hidden;
  }

  .cell-controls {
    padding: 8px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }

  .cell-content {
    padding: 16px;
  }

  .editor {
    min-height: 100px;
  }

  .cell-output {
    margin-top: 8px;
    padding: 8px;
    background: #f8f8f8;
    border-radius: 4px;
  }

  .error {
    color: #e53935;
    background: #ffebee;
    padding: 8px;
    border-radius: 4px;
  }

  .rich-content {
    font-size: 1.1em;
    line-height: 1.5;
  }

  .rich-content :global(p) {
    margin: 0.8em 0;
  }

  .rich-content :global(.katex-display) {
    margin: 1.5em 0;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .threejs-container {
    width: 100%;
    height: 400px;
    background: #000;
  }
</style>  