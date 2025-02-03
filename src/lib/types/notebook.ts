export type CellType = 
  | 'markdown'   // For markdown/LaTeX content
  | 'python'     // For Python code (Manim, etc)
  | 'javascript' // For JS code and 3D visualizations
  | 'latex'      // For pure LaTeX content
  | 'shader'     // For GLSL shaders
  | 'output';    // For cell outputs

export interface CellMetadata {
  id: string;
  type: CellType;
  created: string;
  modified: string;
  dependencies?: string[]; // IDs of cells this cell depends on
  runtime?: {
    language: string;
    version: string;
  };
}

export interface CellContent {
  source: string;
  outputs?: Array<{
    type: 'text' | 'html' | 'image' | '3d' | 'error';
    data: any;
    timestamp: string;
  }>;
}

export interface NotebookCell {
  metadata: CellMetadata;
  content: CellContent;
}

export interface NotebookMetadata {
  title: string;
  authors: string[];
  created: string;
  modified: string;
  tags: string[];
  references?: {
    zotero_ids: string[];
    paper_citations: string[];
  };
}

export interface Notebook {
  metadata: NotebookMetadata;
  cells: NotebookCell[];
  version: string; // Format version
} 