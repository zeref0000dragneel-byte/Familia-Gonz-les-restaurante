// Versión del service worker - INCREMENTAR para forzar actualización
const SW_VERSION = '2.0.0';
const CACHE_NAME = `familia-gonzales-${SW_VERSION}`;
const STATIC_CACHE_NAME = `familia-gonzales-static-${SW_VERSION}`;
const DYNAMIC_CACHE_NAME = `familia-gonzales-dynamic-${SW_VERSION}`;

// Recursos estáticos críticos
const urlsToCache = [
  './',
  './index.html',
  './estilos.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// CDNs externos para cachear
const CDN_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando recursos estáticos');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Los CDNs se cachearán automáticamente cuando se soliciten
        // No los pre-cacheamos aquí para evitar problemas de CORS
        console.log('[Service Worker] CDNs se cachearán bajo demanda');
      })
      .then(() => {
        console.log('[Service Worker] Instalación completada');
        return self.skipWaiting(); // Activar inmediatamente
      })
      .catch(err => {
        console.error('[Service Worker] Error en instalación:', err);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando versión:', SW_VERSION);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      console.log('[Service Worker] Caches encontrados:', cacheNames);
      
      // Eliminar TODOS los caches que no sean de la versión actual
      const cachesToDelete = cacheNames.filter(cacheName => {
        // Mantener solo los caches de la versión actual
        const isCurrentVersion = cacheName === STATIC_CACHE_NAME || 
                                  cacheName === DYNAMIC_CACHE_NAME || 
                                  cacheName === CACHE_NAME;
        
        if (!isCurrentVersion) {
          console.log('[Service Worker] Eliminando cache antiguo:', cacheName);
        }
        
        return !isCurrentVersion;
      });
      
      return Promise.all([
        // Eliminar caches antiguos
        ...cachesToDelete.map(cacheName => caches.delete(cacheName)),
        // Tomar control inmediatamente
        self.clients.claim()
      ]);
    })
    .then(() => {
      console.log('[Service Worker] Activación completada - Versión', SW_VERSION);
      // Forzar actualización de todas las páginas
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_ACTIVATED', version: SW_VERSION });
        });
      });
    })
  );
});

// Estrategia de cache: Cache First con fallback a red
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar peticiones GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Estrategia para recursos estáticos (HTML, CSS, JS, imágenes)
  if (urlsToCache.some(cachedUrl => request.url.includes(cachedUrl)) ||
      request.url.includes('index.html') ||
      request.url.includes('estilos.css') ||
      request.url.includes('app.js') ||
      request.url.includes('manifest.json') ||
      request.url.includes('icon-')) {
    
    event.respondWith(
      caches.match(request)
        .then(response => {
          // Cache hit - retornar desde cache
          if (response) {
            return response;
          }
          
          // Cache miss - obtener de red y cachear
          return fetch(request)
            .then(response => {
              // Verificar respuesta válida
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clonar respuesta para cachear
              const responseToCache = response.clone();
              
              caches.open(STATIC_CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // Si falla la red, intentar servir desde cache como último recurso
              return caches.match('./index.html');
            });
        })
    );
    return;
  }
  
  // Estrategia Network First para CDNs externos (Chart.js, jsPDF)
  // Esto permite que funcionen offline si ya fueron cargados antes
  if (CDN_URLS.some(cdnUrl => request.url.includes(cdnUrl)) ||
      request.url.includes('cdnjs.cloudflare.com') ||
      request.url.includes('cdn.jsdelivr.net')) {
    
    event.respondWith(
      fetch(request)
        .then(response => {
          // Si la red funciona, cachear y retornar
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });
          }
          
          return response;
        })
        .catch(() => {
          // Si falla la red, intentar desde cache
          return caches.match(request)
            .then(response => {
              if (response) {
                console.log('[Service Worker] Sirviendo CDN desde cache:', request.url);
                return response;
              }
              
              // Si no hay en cache, retornar error
              console.warn('[Service Worker] CDN no disponible offline:', request.url);
              return new Response('Recurso no disponible offline. Conecta a internet para cargar este recurso.', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        })
    );
    return;
  }
  
  // Estrategia Network First para otras peticiones (APIs, etc.)
  event.respondWith(
    fetch(request)
      .then(response => {
        // Si la red funciona, cachear y retornar
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          
          caches.open(DYNAMIC_CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
        }
        
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar desde cache
        return caches.match(request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // Si no hay en cache, retornar página offline
            if (request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
