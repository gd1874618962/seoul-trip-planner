const VERSION = 'stp-pwa-v1'
const SHELL_CACHE = `${VERSION}-shell`
const RUNTIME_CACHE = `${VERSION}-runtime`
const MAP_CACHE = `${VERSION}-maps`
const SCOPE = self.registration.scope
const SHELL = [
  new URL('./', SCOPE).toString(),
  new URL('index.html', SCOPE).toString(),
  new URL('manifest.webmanifest', SCOPE).toString(),
  new URL('icons/icon-192.png', SCOPE).toString(),
  new URL('icons/icon-512.png', SCOPE).toString(),
  new URL('icons/apple-touch-icon.png', SCOPE).toString(),
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![SHELL_CACHE, RUNTIME_CACHE, MAP_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isMapTile(url) {
  return (
    url.hostname.endsWith('tile.openstreetmap.org') ||
    url.hostname.endsWith('basemaps.cartocdn.com')
  )
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
  return response
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => null)
  return cached || (await network) || Response.error()
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(new URL('index.html', SCOPE).toString(), response.clone())
    return response
  } catch {
    return (
      (await cache.match(request)) ||
      (await cache.match(new URL('index.html', SCOPE).toString())) ||
      Response.error()
    )
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (url.pathname.includes('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  if (isMapTile(url)) {
    event.respondWith(cacheFirst(request, MAP_CACHE))
    return
  }

  if (url.origin !== self.location.origin) return
  event.respondWith(staleWhileRevalidate(request))
})
