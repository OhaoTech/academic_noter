/// <reference types="svelte" />
<script lang="ts">
  import type { Notebook, NotebookCell } from '$lib/types/notebook';
  import { onMount } from 'svelte';
  import Cell from './Cell.svelte';
  import { initializePython, executePythonCode, isManimCode, executeManimCode } from '$lib/services/python-runtime';
  import { executeThreeCode } from '$lib/services/three-runtime';
  import { executeShaderCode } from '$lib/services/shader-runtime';
  import { v4 as uuidv4 } from 'uuid';
  import * as THREE from 'three';

  export let notebook: Notebook;
  
  let selectedCell: string | null = null;
  let executingCells = new Set<string>();

  onMount(async () => {
    // Initialize Python runtime
    await initializePython();
  });

  function addCell(type: 'markdown' | 'python' | 'javascript' | 'latex' | 'shader', index?: number) {
    const newCell: NotebookCell = {
      metadata: {
        id: uuidv4(),
        type,
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      },
      content: {
        source: type === 'shader' ? getDefaultShader() : ''
      }
    };

    if (typeof index === 'number') {
      notebook.cells.splice(index + 1, 0, newCell);
    } else {
      notebook.cells.push(newCell);
    }
    notebook = notebook; // Trigger reactivity
  }

  function getDefaultShader(): string {
    return `// Fragment shader with default uniforms:
// uniform float iTime;        // Shader playback time (in seconds)
// uniform vec3 iResolution;   // Viewport resolution (in pixels)
// uniform vec4 iMouse;        // Mouse pixel coords. xy: current, zw: click

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord/iResolution.xy;
    vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
    fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}`;
  }

  function deleteCell(id: string) {
    const index = notebook.cells.findIndex(cell => cell.metadata.id === id);
    if (index !== -1) {
      notebook.cells.splice(index, 1);
      notebook = notebook; // Trigger reactivity
    }
  }

  function moveCell(id: string, direction: 'up' | 'down') {
    const index = notebook.cells.findIndex(cell => cell.metadata.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= notebook.cells.length) return;

    const [cell] = notebook.cells.splice(index, 1);
    notebook.cells.splice(newIndex, 0, cell);
    notebook = notebook; // Trigger reactivity
  }

  async function handleCellExecution(event: CustomEvent<App.CellExecuteEvent>) {
    const { id, type, content } = event.detail;
    const cellIndex = notebook.cells.findIndex(cell => cell.metadata.id === id);
    if (cellIndex === -1) return;

    executingCells.add(id);
    executingCells = executingCells; // Trigger reactivity

    try {
      let result;
      switch (type) {
        case 'python':
          if (isManimCode(content)) {
            result = await executeManimCode(content);
          } else {
            result = await executePythonCode(content);
          }
          break;
        case 'javascript':
          result = await executeThreeCode(content, `three-${id}`);
          break;
        case 'shader':
          result = await executeShaderCode(content, `shader-${id}`);
          break;
      }

      if (result) {
        notebook.cells[cellIndex].content.outputs = [{
          type: result.type as 'text' | 'html' | 'image' | '3d' | 'error',
          data: result.data,
          timestamp: new Date().toISOString()
        }];
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      notebook.cells[cellIndex].content.outputs = [{
        type: 'error',
        data: errorMessage,
        timestamp: new Date().toISOString()
      }];
    } finally {
      executingCells.delete(id);
      executingCells = executingCells; // Trigger reactivity
      notebook = notebook; // Trigger reactivity
    }
  }

  function handleCellChange(event: CustomEvent<App.CellChangeEvent>) {
    const { id, content } = event.detail;
    const cell = notebook.cells.find(cell => cell.metadata.id === id);
    if (cell) {
      cell.content.source = content;
      cell.metadata.modified = new Date().toISOString();
      notebook = notebook; // Trigger reactivity
    }
  }
</script>

<div class="notebook">
  <div class="notebook-header">
    <h1>{notebook.metadata.title}</h1>
    <div class="notebook-controls">
      <button on:click={() => addCell('markdown')}>Add Markdown</button>
      <button on:click={() => addCell('python')}>Add Python</button>
      <button on:click={() => addCell('javascript')}>Add JavaScript</button>
      <button on:click={() => addCell('latex')}>Add LaTeX</button>
      <button on:click={() => addCell('shader')}>Add Shader</button>
    </div>
  </div>

  <div class="cells">
    {#each notebook.cells as cell, index (cell.metadata.id)}
      <div class="cell-wrapper" class:selected={selectedCell === cell.metadata.id}>
        <div class="cell-sidebar">
          <button 
            on:click={() => moveCell(cell.metadata.id, 'up')}
            disabled={index === 0}
          >↑</button>
          <button 
            on:click={() => moveCell(cell.metadata.id, 'down')}
            disabled={index === notebook.cells.length - 1}
          >↓</button>
          <button on:click={() => deleteCell(cell.metadata.id)}>×</button>
        </div>
        
        <Cell
          {cell}
          isExecuting={executingCells.has(cell.metadata.id)}
          on:change={handleCellChange}
          on:execute={handleCellExecution}
        />
        
        {#if cell.metadata.type === 'javascript'}
          <div id="three-{cell.metadata.id}" class="three-container"></div>
        {/if}
        
        {#if cell.metadata.type === 'shader'}
          <div id="shader-{cell.metadata.id}" class="shader-container"></div>
        {/if}
        
        <button 
          class="add-cell-button"
          on:click={() => addCell('markdown', index)}
        >
          +
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  .notebook {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .notebook-header {
    margin-bottom: 20px;
  }

  .notebook-controls {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }

  .cells {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .cell-wrapper {
    display: flex;
    gap: 8px;
    position: relative;
  }

  .cell-sidebar {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
  }

  .cell-wrapper.selected {
    box-shadow: 0 0 0 2px #2196f3;
  }

  .add-cell-button {
    position: absolute;
    left: 50%;
    bottom: -16px;
    transform: translateX(-50%);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: #2196f3;
    color: white;
    cursor: pointer;
    display: none;
    z-index: 10;
  }

  .cell-wrapper:hover .add-cell-button {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .three-container,
  .shader-container {
    width: 100%;
    height: 400px;
    background: #000;
    border-radius: 4px;
    overflow: hidden;
  }
</style> 