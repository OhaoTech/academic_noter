<script lang="ts">
  import * as marked from 'marked';
  import { parseMathContent } from '$lib/utils/math';
  import Math from './Math.svelte';
  
  export let content: string = '';
  
  $: segments = parseMathContent(content);
  
  function renderText(text: string): string {
    const renderer = new marked.Renderer();
    
    // Custom handling for definition lists
    renderer.paragraph = (text) => {
      // Check if this is a definition (single line with "is" or "is the")
      if (text.includes(' is ')) {
        const parts = text.split(/(?: is | is the )/);
        if (parts.length === 2) {
          return `<div class="definition">
            <div class="term"><p>${parts[0]}</p></div>
            <div class="description"><p>${parts[1]}</p></div>
          </div>`;
        }
      }
      return `<p>${text}</p>`;
    };

    return marked.parse(text, { renderer });
  }
</script>

{#each segments as segment}
  {#if segment.type === 'text'}
    {@html renderText(segment.content)}
  {:else if segment.type === 'inline-math'}
    <Math math={segment.content} displayMode={false} />
  {:else if segment.type === 'display-math'}
    <Math math={segment.content} displayMode={true} />
  {/if}
{/each}

<style>
  :global(.rich-text p) {
    margin: 0.5em 0;
  }
  :global(.rich-text pre) {
    background-color: #f5f5f5;
    padding: 1em;
    border-radius: 4px;
    overflow-x: auto;
  }
  :global(.rich-text code) {
    font-family: 'Fira Code', monospace;
    font-size: 0.9em;
  }
  :global(.definition) {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2em;
    margin: 1.5em 0;
    align-items: center;
  }
  :global(.definition .term) {
    font-size: 1.2em;
    padding: 0.5em 1em;
    background: #f8f9fa;
    border-radius: 4px;
    border-left: 3px solid #2196f3;
  }
  :global(.definition .term p) {
    margin: 0;
  }
  :global(.definition .description) {
    font-size: 1.1em;
    color: #444;
  }
  :global(.definition .description p) {
    margin: 0;
  }
  :global(.katex) {
    font-size: 1.1em;
  }
  :global(.katex-display) {
    margin: 1.5em 0;
    padding: 1em;
    background: #f8f9fa;
    border-radius: 4px;
    overflow-x: auto;
    overflow-y: hidden;
  }
</style> 