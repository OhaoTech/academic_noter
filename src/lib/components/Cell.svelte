<script lang="ts">
  import type { NotebookCell } from '$lib/types/notebook';
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { EditorView, basicSetup } from 'codemirror';
  import { EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { python } from '@codemirror/lang-python';
  import { javascript } from '@codemirror/lang-javascript';
  import { keymap } from '@codemirror/view';
  import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
  import { bracketMatching, indentOnInput, syntaxHighlighting } from '@codemirror/language';
  import { closeBrackets, autocompletion } from '@codemirror/autocomplete';
  import { lintGutter, lintKeymap } from '@codemirror/lint';
  import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
  import { oneDark } from '@codemirror/theme-one-dark';
  import RichText from './RichText.svelte';
  import { pythonReady, executePythonCode, installingPackage } from '$lib/services/python-runtime';

  export let cell: NotebookCell;
  export let isExecuting: boolean = false;

  const dispatch = createEventDispatcher();
  let editor: EditorView;
  let editorElement: HTMLElement;
  let outputElement: HTMLElement;

  // Add reactive statement to handle cell updates
  $: outputs = cell.content.outputs || [];

  function setupEditor() {
    const extensions = [
      basicSetup,
      oneDark,
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          dispatch('change', {
            id: cell.metadata.id,
            content: update.state.doc.toString()
          });
        }
      })
    ];

    // Add language support based on cell type
    switch (cell.metadata.type) {
      case 'python':
        extensions.push(python());
        break;
      case 'javascript':
        extensions.push(javascript());
        break;
      case 'markdown':
      case 'latex':
        extensions.push(markdown());
        break;
    }

    editor = new EditorView({
      doc: cell.content.source,
      extensions,
      parent: editorElement
    });
  }

  onMount(() => {
    if (editorElement) {
      setupEditor();
    }

    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  });

  function deleteCell() {
    dispatch('delete', {
      id: cell.metadata.id
    });
  }

  function moveCell(direction: 'up' | 'down') {
    dispatch('move', {
      id: cell.metadata.id,
      direction
    });
  }

  function saveContent() {
    if (editor) {
      const content = editor.state.doc.toString();
      if (content !== cell.content.source) {
        cell.content.source = content;
        cell.metadata.modified = new Date().toISOString();
        dispatch('change', {
          id: cell.metadata.id,
          content
        });
      }
    }
  }

  async function executeCell() {
    isExecuting = true;
    try {
      if (cell.metadata.type === 'python') {
        console.log('Executing Python code:', cell.content.source);
        const result = await executePythonCode(cell.content.source);
        console.log('Python execution result:', result);
        
        // Dispatch the change to parent to update the cell state
        dispatch('change', {
          id: cell.metadata.id,
          content: cell.content.source,
          outputs: [{
            type: result.type,
            data: result.data
          }]
        });
      }
      // ... handle other cell types ...
    } catch (error) {
      console.error('Cell execution failed:', error);
      dispatch('change', {
        id: cell.metadata.id,
        content: cell.content.source,
        outputs: [{
          type: 'error',
          data: error instanceof Error ? error.message : 'Execution failed'
        }]
      });
    } finally {
      isExecuting = false;
    }
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

  onDestroy(() => {
    if (editor) {
      saveContent();
      editor.destroy();
    }
  });
</script>

<div class="cell">
  <div class="cell-content">
    <div class="editor-section">
      <div bind:this={editorElement} class="editor" />
      {#if !['markdown', 'latex'].includes(cell.metadata.type)}
        <button 
          class="run-btn"
          on:click={executeCell}
          disabled={isExecuting || (cell.metadata.type === 'python' && !$pythonReady) || $installingPackage}
        >
          {#if cell.metadata.type === 'python' && !$pythonReady}
            Initializing...
          {:else if $installingPackage}
            Installing {$installingPackage}...
          {:else if isExecuting}
            Running...
          {:else}
            Run
          {/if}
        </button>
      {/if}
    </div>

    <div class="right-panel">
      {#if (cell.metadata.type === 'markdown' || cell.metadata.type === 'latex')}
        <div class="preview-section">
          <div class="rich-content">
            <RichText content={cell.content.source} />
          </div>
        </div>
      {/if}

      {#if outputs.length > 0}
        <div class="output-section">
          {#each outputs as output}
            <div class="cell-output">
              {#if output.type === 'text'}
                <pre class="output-text">{output.data}</pre>
              {:else if output.type === 'error'}
                <pre class="output-error">{output.data}</pre>
              {:else if output.type === 'image'}
                <img src={output.data} alt="Plot output" />
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .cell {
    position: relative;
    width: 100%;
    margin: 8px 0;
  }

  .cell-content {
    display: flex;
    flex-direction: row;
    gap: 16px;
    min-height: 100px;
  }

  .editor-section {
    position: relative;
    flex: 1;
    min-width: 45%;
    max-width: 50%;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }

  .right-panel {
    flex: 1;
    min-width: 45%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .editor {
    height: 100%;
    min-height: 100px;
  }

  .preview-section {
    padding: 8px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background: #fff;
  }

  .output-section {
    padding: 8px;
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }

  .cell-output {
    margin: 4px 0;
  }

  .output-text {
    margin: 0;
    padding: 8px;
    background: #fff;
    border-radius: 4px;
    font-family: monospace;
    white-space: pre-wrap;
  }

  .output-error {
    margin: 0;
    padding: 8px;
    background: #fff0f0;
    color: #d32f2f;
    border-radius: 4px;
    font-family: monospace;
    white-space: pre-wrap;
  }

  .run-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 12px;
    border: 1px solid #1976d2;
    border-radius: 4px;
    background: #1976d2;
    color: white;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
    z-index: 10;
  }

  .run-btn:hover {
    background: #1565c0;
    border-color: #1565c0;
  }

  .run-btn:disabled {
    background: #ccc;
    border-color: #bbb;
    cursor: not-allowed;
    opacity: 0.7;
  }

  .cell-output {
    font-family: monospace;
    white-space: pre-wrap;
    padding: 4px 8px;
  }

  .error {
    color: #d32f2f;
    background: #ffebee;
    padding: 8px;
    border-radius: 4px;
  }

  .rich-content {
    font-size: 15px;
    line-height: 1.6;
    color: #333;
  }

  .rich-content :global(p) {
    margin: 0 0 1em 0;
  }

  .rich-content :global(h1) {
    font-size: 2em;
    margin: 0.67em 0;
    font-weight: 400;
    color: #202124;
  }

  .rich-content :global(h2) {
    font-size: 1.5em;
    margin: 0.83em 0;
    font-weight: 400;
    color: #202124;
  }

  .rich-content :global(.katex-display) {
    margin: 1.5em 0;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .code-preview {
    font-family: 'Roboto Mono', 'Fira Code', monospace;
    font-size: 13px;
    line-height: 1.6;
    padding: 12px;
    background: #f8f8f8;
    border-radius: 4px;
    border: 1px solid #eee;
    margin: 0;
    white-space: pre-wrap;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  .output-section {
    margin-top: 8px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .cell-output {
    margin: 4px 0;
  }

  .output-text {
    margin: 0;
    padding: 8px;
    background: #fff;
    border-radius: 4px;
    font-family: monospace;
    white-space: pre-wrap;
  }

  .output-error {
    margin: 0;
    padding: 8px;
    background: #fff0f0;
    color: #d32f2f;
    border-radius: 4px;
    font-family: monospace;
    white-space: pre-wrap;
  }
</style>  