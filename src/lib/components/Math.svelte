<script lang="ts">
  import katex from 'katex';
  import 'katex/dist/katex.min.css';
  import { onMount } from 'svelte';

  export let math: string;
  export let displayMode = false;
  let element: HTMLElement;

  $: if (element && math) {
    katex.render(math, element, {
      displayMode,
      throwOnError: false,
      trust: true,
      strict: false,
      output: 'html'
    });
  }

  onMount(() => {
    if (element && math) {
      katex.render(math, element, {
        displayMode,
        throwOnError: false,
        trust: true,
        strict: false,
        output: 'html'
      });
    }
  });
</script>

<span bind:this={element}></span>

<style>
  span {
    display: inline-block;
  }
  span :global(.katex) {
    font-size: 1.1em;
  }
  span :global(.katex-display) {
    margin: 1em 0;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.5em 0;
  }
  span :global(.katex-error) {
    color: #e53935;
    background: #ffebee;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
  }
</style> 