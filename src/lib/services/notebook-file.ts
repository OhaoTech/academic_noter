import type { Notebook, NotebookCell } from '$lib/types/notebook';
import { NOTEBOOK_VERSION } from '$lib/types/notebook';
import { v4 as uuidv4 } from 'uuid';

export class NotebookFileService {
  static async loadNotebook(file: File): Promise<Notebook> {
    try {
      const text = await file.text();
      const sections = text.split('---cell---\n');
      
      // First section is always metadata
      const metadata = JSON.parse(sections[0]);
      const cells: NotebookCell[] = [];

      // Process each cell section
      for (let i = 1; i < sections.length; i++) {
        const [cellMeta, ...contentParts] = sections[i].split('---content---\n');
        const cellMetadata = JSON.parse(cellMeta);
        const content = contentParts.join('---content---\n').trim();

        cells.push({
          metadata: cellMetadata,
          content: {
            source: content,
            outputs: []
          }
        });
      }

      return {
        metadata: {
          ...metadata,
          version: metadata.version || NOTEBOOK_VERSION
        },
        cells
      };
    } catch (error) {
      console.error('Error loading notebook:', error);
      throw new Error('Failed to load notebook file');
    }
  }

  static async saveNotebook(notebook: Notebook): Promise<Blob> {
    try {
      let content = JSON.stringify(notebook.metadata, null, 2) + '\n';

      // Add each cell
      for (const cell of notebook.cells) {
        content += '---cell---\n';
        content += JSON.stringify(cell.metadata, null, 2) + '\n';
        content += '---content---\n';
        content += cell.content.source + '\n';
      }

      return new Blob([content], { type: 'text/plain' });
    } catch (error) {
      console.error('Error saving notebook:', error);
      throw new Error('Failed to save notebook file');
    }
  }

  static createNewNotebook(title: string = 'Untitled Notebook'): Notebook {
    const now = new Date().toISOString();
    
    return {
      metadata: {
        title,
        created: now,
        modified: now,
        version: NOTEBOOK_VERSION,
        authors: [],
        tags: []
      },
      cells: [
        {
          metadata: {
            id: uuidv4(),
            type: 'markdown',
            created: now,
            modified: now
          },
          content: {
            source: '# ' + title + '\n\nStart writing your notes here...',
            outputs: []
          }
        }
      ]
    };
  }

  static validateNotebook(notebook: Notebook): boolean {
    // Basic validation
    if (!notebook.metadata || !notebook.cells) return false;
    if (!notebook.metadata.title || !notebook.metadata.version) return false;
    
    // Validate each cell
    return notebook.cells.every(cell => {
      return (
        cell.metadata &&
        cell.metadata.id &&
        cell.metadata.type &&
        cell.content &&
        typeof cell.content.source === 'string'
      );
    });
  }
} 