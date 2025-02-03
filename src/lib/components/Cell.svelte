<script lang="ts">
  import type { NotebookCell } from '$lib/types/notebook';
  import { onMount, createEventDispatcher } from 'svelte';
  import { EditorView } from 'codemirror';
  import { markdown } from '@codemirror/lang-markdown';
  import { python } from '@codemirror/lang-python';
  import { javascript } from '@codemirror/lang-javascript';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { marked } from 'marked';
  import katex from 'katex';

  export let cell: NotebookCell;
  export let isEditing: boolean = false;
  export let isExecuting: boolean = false;

  const dispatch = createEventDispatcher();
  let editor: EditorView;
  let editorElement: HTMLElement;
  let outputElement: HTMLElement;

  // Configure marked to use KaTeX for math
  const renderer = new marked.Renderer();
  renderer.code = function(code: string, language: string | undefined) {
    if (language === 'math') {
      try {
        return katex.renderToString(code, { displayMode: true });
      } catch (error) {
        if (error instanceof Error) {
          return `<pre class="error">KaTeX error: ${error.message}</pre>`;
        }
        return `<pre class="error">KaTeX error: Unknown error</pre>`;
      }
    }
    return `<pre><code class="language-${language || ''}">${code}</code></pre>`;
  };

  marked.setOptions({
    renderer,
    gfm: true,
    breaks: true,
    sanitize: false,
    smartLists: true,
    smartypants: true,
    xhtml: true
  });

  onMount(() => {
    if (isEditing) {
      setupEditor();
    }
  });

  function setupEditor() {
    const extensions = [oneDark];
    
    switch (cell.metadata.type) {
      case 'markdown':
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

    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: cell.content.source }
    });
  }

  async function executeCell() {
    if (isExecuting) return;
    
    dispatch('execute', {
      id: cell.metadata.id,
      type: cell.metadata.type,
      content: editor?.state?.doc?.toString() || cell.content.source
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
</script>

<div class="cell" class:editing={isEditing}>
  <div class="cell-controls">
    <button on:click={() => dispatch('toggle-edit')}>
      {isEditing ? 'View' : 'Edit'}
    </button>
    {#if cell.metadata.type !== 'markdown'}
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
      {#if cell.metadata.type === 'markdown'}
        <div class="markdown-content">
          {@html marked(cell.content.source)}
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

  /* svelte-ignore css-unused-selector */
  .error {
    color: #e53935;
    background: #ffebee;
    padding: 8px;
    border-radius: 4px;
  }

  .markdown-content :global(math) {
    display: block;
    margin: 1em 0;
  }

  /* svelte-ignore css-unused-selector */
  .threejs-container {
    width: 100%;
    height: 400px;
    background: #000;
  }
</style>  