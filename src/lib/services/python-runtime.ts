import type { PyodideInterface } from 'pyodide';
import { writable } from 'svelte/store';

export const pythonReady = writable(false);
let pyodide: PyodideInterface;

export async function initializePython() {
  if (pyodide) return;

  // Load Pyodide
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
  });

  // Install required packages
  await pyodide.loadPackage(['numpy', 'matplotlib']);
  
  // Initialize matplotlib for web output
  await pyodide.runPythonAsync(`
    import matplotlib.pyplot as plt
    import io, base64
    
    def get_plot_as_base64():
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        return base64.b64encode(buf.read()).decode('utf-8')
  `);

  pythonReady.set(true);
}

export async function executePythonCode(code: string): Promise<{
  type: 'text' | 'image' | 'error';
  data: any;
}> {
  if (!pyodide) {
    throw new Error('Python runtime not initialized');
  }

  try {
    // Check if code contains matplotlib
    const hasPlot = code.includes('plt.');
    
    // Execute the code
    const result = await pyodide.runPythonAsync(code);
    
    // If there's a plot, get it as base64
    if (hasPlot) {
      const base64Image = await pyodide.runPythonAsync('get_plot_as_base64()');
      return {
        type: 'image',
        data: `data:image/png;base64,${base64Image}`
      };
    }
    
    // Return text output
    return {
      type: 'text',
      data: result?.toString() || ''
    };
  } catch (error) {
    return {
      type: 'error',
      data: error.message
    };
  }
}

// Function to check if code is Manim-related
export function isManimCode(code: string): boolean {
  return code.includes('class') && code.includes('Scene') && code.includes('def construct');
}

// Special handler for Manim code (will need a backend service)
export async function executeManimCode(code: string): Promise<{
  type: 'video' | 'error';
  data: any;
}> {
  // This will need to be implemented with a backend service
  // For now, return an error
  return {
    type: 'error',
    data: 'Manim execution requires backend support - coming soon!'
  };
} 