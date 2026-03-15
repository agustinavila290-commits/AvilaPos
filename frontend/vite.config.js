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
  },
})
