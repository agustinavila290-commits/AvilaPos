/* eslint-env node */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Para que funcione con Electron
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Permite acceso desde red local
    port: 5173,
    proxy: {
      '/api': {
        // Usar IP local del servidor si está disponible, sino localhost
        target: process.env.VITE_API_HOST || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Todos los node_modules en un solo chunk para evitar
          // problemas de orden de evaluación con React.forwardRef
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (id.includes('src/components')) {
            return 'components';
          }
          if (id.includes('src/pages')) {
            return 'pages';
          }
          if (id.includes('src/context') || id.includes('src/utils')) {
            return 'app-utils';
          }
        },
      },
    },
    // Aumentar el límite de warning de chunk size para no mostrar el warning
    chunkSizeWarningLimit: 1000,
  },
})
