declare module 'marked' {
  export interface RendererObject {
    code(code: string, language: string | undefined, isEscaped?: boolean): string;
    blockquote(quote: string): string;
    html(html: string): string;
    heading(text: string, level: number): string;
    hr(): string;
    list(body: string, ordered: boolean): string;
    listitem(text: string): string;
    checkbox(checked: boolean): string;
    paragraph(text: string): string;
    table(header: string, body: string): string;
    tablerow(content: string): string;
    tablecell(content: string, flags: { header: boolean; align: 'center' | 'left' | 'right' | null }): string;
    strong(text: string): string;
    em(text: string): string;
    codespan(code: string): string;
    br(): string;
    del(text: string): string;
    link(href: string, title: string | null, text: string): string;
    image(href: string, title: string | null, text: string): string;
    text(text: string): string;
  }

  export class Renderer implements RendererObject {
    constructor();
    code(code: string, language: string | undefined, isEscaped?: boolean): string;
    blockquote(quote: string): string;
    html(html: string): string;
    heading(text: string, level: number): string;
    hr(): string;
    list(body: string, ordered: boolean): string;
    listitem(text: string): string;
    checkbox(checked: boolean): string;
    paragraph(text: string): string;
    table(header: string, body: string): string;
    tablerow(content: string): string;
    tablecell(content: string, flags: { header: boolean; align: 'center' | 'left' | 'right' | null }): string;
    strong(text: string): string;
    em(text: string): string;
    codespan(code: string): string;
    br(): string;
    del(text: string): string;
    link(href: string, title: string | null, text: string): string;
    image(href: string, title: string | null, text: string): string;
    text(text: string): string;
  }

  export interface MarkedOptions {
    renderer?: Renderer;
    gfm?: boolean;
    breaks?: boolean;
    sanitize?: boolean;
    smartLists?: boolean;
    smartypants?: boolean;
    xhtml?: boolean;
  }

  export function setOptions(options: MarkedOptions): void;
  export function parse(markdown: string, options?: MarkedOptions): string;
}

declare module 'katex' {
  interface KaTeXOptions {
    displayMode?: boolean;
    throwOnError?: boolean;
    errorColor?: string;
    macros?: { [key: string]: string };
    colorIsTextColor?: boolean;
    maxSize?: number;
    maxExpand?: number;
    strict?: boolean | string | string[];
    trust?: boolean | ((context: { command: string; url: string; protocol: string }) => boolean);
  }

  export function renderToString(math: string, options?: KaTeXOptions): string;
}

declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher } from 'three';
  export class OrbitControls extends EventDispatcher {
    constructor(camera: Camera, domElement?: HTMLElement);
    enabled: boolean;
    enableDamping: boolean;
    dampingFactor: number;
    update(): void;
    dispose(): void;
  }
} 