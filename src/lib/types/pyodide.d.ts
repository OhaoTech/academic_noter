declare module 'pyodide' {
  export interface PyodideInterface {
    loadPackage(packages: string | string[]): Promise<void>;
    runPythonAsync(code: string): Promise<any>;
    globals: any;
  }

  export interface PyodideConfig {
    indexURL: string;
  }

  export function loadPyodide(config: PyodideConfig): Promise<PyodideInterface>;
} 