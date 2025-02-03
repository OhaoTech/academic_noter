import { browser } from '$app/environment';

export async function executeJavaScriptCode(code: string): Promise<{
  type: 'text' | 'error';
  data: string;
}> {
  if (!browser) {
    return {
      type: 'error',
      data: 'JavaScript code can only be executed in the browser'
    };
  }

  try {
    // For standard JavaScript execution
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction(code);
    const result = await fn();
    
    return {
      type: 'text',
      data: result !== undefined ? String(result) : 'Code executed successfully'
    };
  } catch (error) {
    console.error('JavaScript execution error:', error);
    return {
      type: 'error',
      data: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Handle window resize
if (browser) {
  window.addEventListener('resize', () => { 
    // No need to update scenes as the new implementation does not use THREE.js
  });
} 