/* eslint-env node */

/**
 * Preload script
 * Se ejecuta antes de cargar la página
 * Permite exponer APIs de Electron de forma segura
 */

const { contextBridge } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electron', {
  // Aquí puedes exponer funcionalidades específicas si las necesitas
  version: process.versions.electron,
  platform: process.platform
});

console.log('Preload script cargado');
