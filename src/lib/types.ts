interface Cell {
  metadata: {
    id: string;
    type: 'python' | 'markdown' | 'javascript' | 'latex';
  };
  content: {
    source: string;
    outputs?: Array<{
      type: 'text' | 'error' | 'image';
      data: string;
    }>;
  };
} 