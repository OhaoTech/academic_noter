import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  optimizeDeps: {
    include: [
      'three',
      'katex',
      'marked',
      'codemirror',
      '@codemirror/lang-javascript',
      '@codemirror/lang-python',
      '@codemirror/lang-markdown',
      '@codemirror/theme-one-dark'
    ],
    exclude: ['@sveltejs/kit']
  },
  ssr: {
    noExternal: ['three', 'katex']
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          codemirror: [
            'codemirror',
            '@codemirror/lang-javascript',
            '@codemirror/lang-python',
            '@codemirror/lang-markdown',
            '@codemirror/theme-one-dark'
          ]
        }
      }
    }
  },
  server: {
    fs: {
      allow: ['..']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
}); 