/* Pastory 的 Service Worker：离线可用。
 *
 * 策略：
 * - 安装时预缓存「首屏外壳」：index.html、manifest、图标、favicon（很小）。
 * - 导航请求：网络优先，失败时回落到缓存里的 index.html，断网也能打开。
 * - 其它同源 GET：缓存优先；第一次请求时按需写进缓存。
 *   因此字体、缩略图、以及用户真的用到的素材原图会被缓存，
 *   不会在首次访问时把 20 多 MB 素材一次性塞进缓存。
 */
const VERSION = 'v1'
const SHELL = 'pastory-shell-' + VERSION
const RUNTIME = 'pastory-runtime-' + VERSION
const MAX_RUNTIME = 120

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

async function trim(cache, max) {
  const keys = await cache.keys()
  if (keys.length <= max) return
  for (const key of keys.slice(0, keys.length - max)) {
    await cache.delete(key)
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  let url
  try {
    url = new URL(req.url)
  } catch {
    return
  }
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req)
          const cache = await caches.open(SHELL)
          cache.put('/index.html', res.clone())
          return res
        } catch {
          const cache = await caches.open(SHELL)
          return (
            (await cache.match('/index.html')) ||
            (await cache.match('/')) ||
            new Response('离线了，连上网络再打开一次就好。', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          )
        }
      })(),
    )
    return
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME)
      const hit = await cache.match(req)
      if (hit) return hit
      try {
        const res = await fetch(req)
        const cacheable =
          res && res.status === 200 && (res.type === 'basic' || res.type === 'default')
        if (cacheable) {
          cache.put(req, res.clone()).then(() => trim(cache, MAX_RUNTIME)).catch(() => undefined)
        }
        return res
      } catch (err) {
        const shell = await caches.open(SHELL)
        const fallback = await shell.match(req)
        if (fallback) return fallback
        throw err
      }
    })(),
  )
})
