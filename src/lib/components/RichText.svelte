<script lang="ts">
    import * as marked from "marked";
    import { parseMathContent } from "$lib/utils/math";
    import Math from "./Math.svelte";

    export let content: string = "";
    export let isEditing: boolean = false;

    $: segments = parseMathContent(content);

    function renderText(text: string): string {
        const renderer = new marked.Renderer();
        
        renderer.list = (body, ordered) => {
            const type = ordered ? "ol" : "ul";
            return `<${type}>${body}</${type}>`;
        };

        renderer.listitem = (text) => {
            const content = text
                .replace(/^<p>(.*?)<\/p>$/, '$1')
                .replace(/\s+/g, ' ')
                .trim();
            return `<li>${content}</li>`;
        };

        renderer.code = (code, language) => {
            // Preserve exact formatting
            const escapedCode = code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '&#10;')  // Preserve line breaks
                .replace(/\t/g, '&#9;')   // Preserve tabs
                .replace(/ /g, '&nbsp;'); // Preserve spaces
            return `<pre><code class="language-${language || ''}">${escapedCode}</code></pre>`;
        };

        return marked.parse(text, {
            renderer,
            gfm: true,
            breaks: false,  
            pedantic: false,
            smartLists: true,
            smartypants: false,
            xhtml: true
        });
    }
</script>

{#if isEditing}
    <slot />
{:else}
    <div class="rich-text">
        {#each segments as segment}
            {#if segment.type === "text"}
                {@html renderText(segment.content)}
            {:else if segment.type === "inline-math"}
                <Math math={segment.content} displayMode={false} />
            {:else if segment.type === "display-math"}
                <Math math={segment.content} displayMode={true} />
            {/if}
        {/each}
    </div>
{/if}

<style>
    .rich-text {
        line-height: 1.6;
        font-size: 16px;
    }

    .rich-text :global(ul),
    .rich-text :global(ol) {
        margin: 1em 0;
        padding-left: 2em;
    }

    .rich-text :global(li) {
        display: list-item;
        margin: 0.2em 0;
    }

    .rich-text :global(p) {
        display: inline;
    }

    .rich-text :global(.katex) {
        display: inline !important;
    }

    .rich-text :global(pre) {
        margin: 1em 0;
        padding: 1em;
        background-color: #f5f5f5;
        border-radius: 4px;
        overflow-x: auto;
        white-space: pre !important;
        tab-size: 4;
    }

    .rich-text :global(pre code) {
        white-space: pre !important;
        display: block;
        font-family: 'Consolas', 'Monaco', 'Andale Mono', monospace;
        font-size: 0.9em;
        line-height: 1.5;
        tab-size: 4;
        word-break: keep-all;
        word-wrap: normal;
    }
</style>
