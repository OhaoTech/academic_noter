<script lang="ts">
    import katex from "katex";
    import "katex/dist/katex.min.css";
    import { onMount } from "svelte";

    export let math: string;
    export let displayMode = false;
    let element: HTMLElement;

    function renderMath() {
        if (element && math) {
            try {
                const html = katex.renderToString(math, {
                    displayMode,
                    throwOnError: false,
                    trust: true,
                    strict: false,
                    output: "html",
                });
                element.innerHTML = html;
            } catch (error) {
                console.error("KaTeX rendering error:", error);
                element.innerHTML = `<span class="katex-error">${error instanceof Error ? error.message : "Math rendering error"}</span>`;
            }
        }
    }

    $: if (element && math) {
        renderMath();
    }

    onMount(() => {
        renderMath();
    });
</script>

{#if displayMode}
    <div bind:this={element} class="display-math"></div>
{:else}
    <span bind:this={element} class="inline-math"></span>
{/if}

<style>
    .inline-math {
        display: inline;
        white-space: nowrap;
        padding: 0 2px;
    }

    .display-math {
        display: block;
        margin: 1em 0;
        overflow-x: auto;
        overflow-y: hidden;
    }

    :global(.katex) {
        font-size: 1.1em;
    }

    :global(.katex-display) {
        margin: 1em 0;
        padding: 0;
    }

    :global(.katex-error) {
        color: #e53935;
        background: #ffebee;
        padding: 0.2em 0.4em;
        border-radius: 4px;
        font-size: 0.9em;
    }
</style>
