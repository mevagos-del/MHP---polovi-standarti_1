const CACHE_VERSION = 'v2';
const STATIC_CACHE = `field-standards-static-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE)
          .map((key) => caches.delete(key)),
      )),
  );
  self.clients.claim();
});

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const cachedRoot = await caches.match('/');
    return cachedRoot || Response.error();
  }
}

async function cacheFirstStaticAsset(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(networkFirstNavigation(event.request));
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname === '/index.html' || url.pathname.startsWith('/assets/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirstStaticAsset(event.request));
  }
});
