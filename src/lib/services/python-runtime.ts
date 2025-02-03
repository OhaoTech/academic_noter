import type { PyodideInterface } from 'pyodide';
import { writable } from 'svelte/store';

declare global {
  interface Window {
    loadPyodide: (config: any) => Promise<PyodideInterface>;
  }
}

export const pythonReady = writable(false);
export const pythonLoading = writable(false);
export const installingPackage = writable<string | null>(null);
let pyodide: PyodideInterface | null = null;

export async function initializePython(): Promise<void> {
  if (pyodide) return;
  if (!window?.loadPyodide) {
    throw new Error('Pyodide loading script not found');
  }

  try {
    pythonLoading.set(true);
    
    pyodide = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
    });

    // Initialize micropip
    await pyodide.loadPackage('micropip');
    await pyodide.runPythonAsync('import micropip');

    // Set up output capture
    await pyodide.runPythonAsync(
      'import sys\n' +
      'from io import StringIO\n' +
      '\n' +
      'class OutputCapture:\n' +
      '    def __init__(self):\n' +
      '        self.stdout = StringIO()\n' +
      '        self.stderr = StringIO()\n' +
      '    \n' +
      '    def __enter__(self):\n' +
      '        sys.stdout = self.stdout\n' +
      '        sys.stderr = self.stderr\n' +
      '        return self\n' +
      '    \n' +
      '    def __exit__(self, *args):\n' +
      '        sys.stdout = sys.__stdout__\n' +
      '        sys.stderr = sys.__stderr__\n' +
      '    \n' +
      '    def get_output(self):\n' +
      '        return self.stdout.getvalue()\n'
    );

    pythonReady.set(true);
  } catch (error) {
    console.error('Failed to initialize Python runtime:', error);
    throw error;
  } finally {
    pythonLoading.set(false);
  }
}

export async function installPackage(packageName: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (!pyodide) {
    return {
      success: false,
      message: 'Python runtime not initialized'
    };
  }

  try {
    installingPackage.set(packageName);
    await pyodide.runPythonAsync(`
      import micropip
      await micropip.install('${packageName}')
    `);
    return {
      success: true,
      message: `Successfully installed ${packageName}`
    };
  } catch (error) {
    console.error('Package installation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to install package'
    };
  } finally {
    installingPackage.set(null);
  }
}

export async function executePythonCode(code: string): Promise<{
  type: 'text' | 'image' | 'error';
  data: string;
}> {
  if (!pyodide) {
    return {
      type: 'error',
      data: 'Python runtime not initialized'
    };
  }

  try {
    // Check if this is a pip install command
    if (code.trim().startsWith('!pip install')) {
      const packageName = code.trim().split('!pip install')[1].trim();
      const result = await installPackage(packageName);
      return {
        type: result.success ? 'text' : 'error',
        data: result.message
      };
    }

    // Regular code execution
    await pyodide.runPythonAsync('output_capture = OutputCapture()');
    const execCode = [
      'with output_capture:',
      ...code.split('\n').map(line => '    ' + line),
      'output_capture.get_output()'
    ].join('\n');
    
    const result = await pyodide.runPythonAsync(execCode);
    const output = result?.toString() || '';
    
    if (output.trim()) {
      return {
        type: 'text',
        data: output.trim()
      };
    }
    
    return {
      type: 'text',
      data: 'Code executed successfully'
    };
  } catch (error) {
    console.error('Python execution error:', error);
    return {
      type: 'error',
      data: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Function to check if code is Manim-related
export function isManimCode(code: string): boolean {
  return code.includes('class') && 
         code.includes('Scene') && 
         code.includes('def construct');
}

// Special handler for Manim code (placeholder for future implementation)
export async function executeManimCode(code: string): Promise<{
  type: 'video' | 'error';
  data: string;
}> {
  return {
    type: 'error',
    data: 'Manim execution requires backend support - coming soon!'
  };
} 