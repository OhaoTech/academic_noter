export type CellType = 'markdown' | 'python' | 'javascript' | 'shader';

export interface NotebookMetadata {
  title: string;
  created: string;
  modified: string;
  version: string;
  authors?: string[];
  tags?: string[];
}

export interface CellMetadata {
  id: string;
  type: CellType;
  created: string;
  modified: string;
  collapsed?: boolean;
}

export interface CellOutput {
  type: 'text' | 'html' | 'image' | '3d' | 'error';
  data: string;
  timestamp: string;
}

export interface CellContent {
  source: string;
  outputs?: CellOutput[];
}

export interface NotebookCell {
  metadata: CellMetadata;
  content: CellContent;
}

export interface Notebook {
  metadata: NotebookMetadata;
  cells: NotebookCell[];
}

// File format version
export const NOTEBOOK_VERSION = '1.0.0'; 