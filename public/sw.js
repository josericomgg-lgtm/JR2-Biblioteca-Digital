
const CACHE_NAME = "jr2-biblioteca-v1";

const BASE_PATH = "/JR2-Biblioteca-Digital/";

const ARCHIVOS_BASE = [
  BASE_PATH,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}favicon.svg`,
  `${BASE_PATH}icons.svg`
];

// INSTALACIÓN
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(ARCHIVOS_BASE);
      await self.skipWaiting();
    })
  );
});

// ACTIVACIÓN Y LIMPIEZA DE CACHÉS ANTIGUAS
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (nombres) => {
      await Promise.all(
        nombres
          .filter(
            (nombre) =>
              nombre.startsWith("jr2-biblioteca-") &&
              nombre !== CACHE_NAME
          )
          .map((nombre) => caches.delete(nombre))
      );

      await self.clients.claim();
    })
  );
});

// PETICIONES DE LA APLICACIÓN
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Solo manejar solicitudes GET del mismo origen.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // No interceptar Firebase, API ni archivos externos.
  if (!url.pathname.startsWith(BASE_PATH)) {
    return;
  }

  // Navegación: intentar red y utilizar caché como respaldo.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copia = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copia);
            });
          }

          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match(BASE_PATH))
          );
        })
    );

    return;
  }

  // Recursos estáticos: caché primero y red como respaldo.
  event.respondWith(
    caches.match(request).then(async (guardado) => {
      if (guardado) return guardado;

      try {
        const response = await fetch(request);

        if (response.ok) {
          const copia = response.clone();

          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, copia);
        }

        return response;
      } catch (error) {
        return new Response("Recurso no disponible sin conexión.", {
          status: 503,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        });
      }
    })
  );
});
