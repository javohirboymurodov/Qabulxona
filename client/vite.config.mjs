import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env': JSON.stringify(import.meta.env),
    global: 'globalThis'
  },
  assetsInclude: ['**/*.ttf', '**/*.woff', '**/*.woff2'],
  optimizeDeps: {
    include: ['pdfkit', 'buffer', 'events', 'stream-browserify', 'util']
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      events: 'events',
      stream: 'stream-browserify',
      util: 'util',
      path: 'path-browserify',
      crypto: 'crypto-browserify'
    }
  }
});
