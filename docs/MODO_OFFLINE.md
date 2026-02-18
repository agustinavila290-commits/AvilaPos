# Modo Offline - PWA

## Descripción

El sistema incluye capacidades de **Progressive Web App (PWA)** que permiten un funcionamiento limitado sin conexión a internet.

## Características Implementadas

### 1. Service Worker
- **Archivo**: `frontend/public/service-worker.js`
- **Función**: Cachea recursos estáticos para acceso offline
- **Cache Strategy**: Cache-first con fallback a network

### 2. Manifest.json
- **Archivo**: `frontend/public/manifest.json`
- **Función**: Define metadatos de la aplicación web
- **Permite**: Instalación en dispositivos móviles

## Configuración

### Activar Service Worker

Para activar el service worker en producción:

1. Editar `frontend/src/main.jsx`:

```javascript
// Al final del archivo
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registrado:', registration);
      })
      .catch((error) => {
        console.log('SW registro falló:', error);
      });
  });
}
```

2. Agregar el link al manifest en `index.html`:

```html
<link rel="manifest" href="/manifest.json">
```

## Limitaciones en Modo Offline

### ✅ Funciona Offline:
- Archivos estáticos (HTML, CSS, JS)
- Recursos cacheados previamente
- Interfaz de usuario básica

### ❌ NO Funciona Offline:
- Consultas a la API
- Nuevas ventas/compras
- Actualización de datos
- Sincronización con servidor

## Mejoras Futuras (No Implementadas)

### 1. IndexedDB para Datos Locales
```javascript
// Almacenar datos localmente
const db = await openDB('casa-repuestos-db', 1, {
  upgrade(db) {
    db.createObjectStore('ventas');
    db.createObjectStore('productos');
  }
});
```

### 2. Background Sync API
```javascript
// Sincronizar cuando vuelva la conexión
navigator.serviceWorker.ready.then((swRegistration) => {
  return swRegistration.sync.register('sync-ventas');
});
```

### 3. Queue de Operaciones Pendientes
- Cola de ventas pendientes de enviar
- Reintentos automáticos
- Notificaciones de sincronización

## Instalación como PWA

### En Android (Chrome):
1. Abrir la app en Chrome
2. Menú → "Agregar a pantalla de inicio"
3. La app se instala como aplicación nativa

### En iOS (Safari):
1. Abrir la app en Safari
2. Compartir → "Agregar a la pantalla de inicio"
3. La app aparece como icono independiente

## Verificar Funcionamiento

### Chrome DevTools:
1. Abrir DevTools (F12)
2. Tab "Application"
3. Sección "Service Workers"
4. Verificar que esté "activated"

### Simular Offline:
1. DevTools → Network tab
2. Cambiar a "Offline"
3. Recargar página
4. Debería cargar recursos cacheados

## Notas Importantes

⚠️ **Advertencia**: El modo offline es limitado y solo sirve para consultas básicas. Para operaciones críticas (ventas, compras) se requiere conexión.

📝 **Recomendación**: Implementar indicador visual de estado de conexión en el frontend.

## Estado Actual

**Implementación**: ⚠️ Básica/Conceptual

- ✅ Service Worker creado
- ✅ Manifest.json creado
- ⚠️ NO activado por defecto (requiere configuración manual)
- ❌ NO implementado: IndexedDB, Background Sync, Queue de operaciones

Para producción se recomienda implementar las mejoras listadas arriba.
