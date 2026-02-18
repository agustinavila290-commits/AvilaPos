/**
 * Service Worker para modo offline
 * Cachea recursos estáticos y permite funcionamiento sin conexión
 */

const CACHE_NAME = 'casa-repuestos-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Agregar más recursos según necesidad
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepción de peticiones
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si hay respuesta en caché, devolverla
        if (response) {
          return response;
        }
        
        // Si no, hacer fetch a la red
        return fetch(event.request).then((response) => {
          // No cachear respuestas no válidas
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clonar la respuesta
          const responseToCache = response.clone();
          
          // Guardar en caché
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});
