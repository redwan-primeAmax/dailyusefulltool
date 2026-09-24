/*
 * Web OS Service Worker
 * Cache-first for the app shell, network-first with cache fallback for everything else.
 * Works with the vite-plugin-singlefile build (all JS/CSS inlined into index.html).
 */

const CACHE_NAME = 'webos-shell-v1';
const SHELL_URL = '/';
const SHELL_OFFLINE = '/offline.html';

/* ------------------------------------------------------------------ */
/*  Install — pre-cache the app shell                                 */
/* ------------------------------------------------------------------ */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try to cache the main shell; if it fails (e.g. offline during deploy)
      // the worker still activates — the next visit will try again.
      try {
        await cache.add(SHELL_URL);
      } catch { /* first install while fully offline is fine */ }
      return self.skipWaiting();
    }),
  );
});

/* ------------------------------------------------------------------ */
/*  Activate — purge stale caches                                      */
/* ------------------------------------------------------------------ */

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      ).then(() => self.clients.claim()),
    ),
  );
});

/* ------------------------------------------------------------------ */
/*  Fetch — cache-first for navigation / shell; network-first fallback */
/* ------------------------------------------------------------------ */

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests.
  if (req.method !== 'GET') return;

  // Same-origin navigation requests: cache-first so the app works offline instantly.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(SHELL_URL).then((cached) => {
        const fetchPromise = fetch(req)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((c) => c.put(SHELL_URL, clone));
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      }),
    );
    return;
  }

  // Same-origin static resources (JS, CSS, images, fonts, manifests):
  // stale-while-revalidate — serve cache instantly, update in background.
  if (new URL(req.url).origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              cache.put(req, clone);
            }
            return response;
          })
          .catch(() => cached);

        // Serve cached version immediately if available, otherwise wait for network.
        return cached || fetchPromise;
      }),
    );
    return;
  }

  // Cross-origin requests (CDN assets, etc.): network-first with cache fallback.
  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return response;
      })
      .catch(() => caches.match(req)),
  );
});

/* ------------------------------------------------------------------ */
/*  Messages — version check & cache management                        */
/* ------------------------------------------------------------------ */

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') {
    self.skipWaiting();
  }

  if (event.data === 'clear-caches') {
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k))).then(() => {
        self.clients.matchAll().then((clients) => {
          clients.forEach((c) => c.postMessage('caches-cleared'));
        });
      }),
    );
  }
});

/* ------------------------------------------------------------------ */
/*  Background Sync (when available)                                   */
/* ------------------------------------------------------------------ */

if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync-app-data') {
      // Placeholder: future offline-to-online data sync.
    }
  });
}
