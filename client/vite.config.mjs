import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ESM muhitida __dirname o‘rnini bosuvchi yechim
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env': JSON.stringify(import.meta.env),
    global: 'globalThis',
  },
  assetsInclude: ['**/*.ttf', '**/*.woff', '**/*.woff2'],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['pdfkit', 'buffer'],
  },
  build: {
    target: 'es2015',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
        },
      },
    },
  },
})
