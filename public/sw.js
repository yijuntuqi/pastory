/* Pastory 的 Service Worker：离线可用。
 *
 * 策略：
 * - 安装时预缓存「首屏外壳」：首页、manifest、图标、favicon（很小）。
 * - 导航请求：网络优先，失败时回落到缓存里的首页，断网也能打开。
 * - 其它同源 GET：缓存优先；第一次请求时按需写进缓存。
 *   因此字体、缩略图、以及用户真的用到的素材原图会被缓存，
 *   不会在首次访问时把 20 多 MB 素材一次性塞进缓存。
 *
 * 子路径适配（GitHub Pages 项目站点是 /<repo>/）：
 * 所有路径都用 self.registration.scope 推出来的 BASE 拼，绝不再写死 '/'。
 */
const VERSION = 'v2'
const SHELL = 'pastory-shell-' + VERSION
const RUNTIME = 'pastory-runtime-' + VERSION
const MAX_RUNTIME = 120

/** 部署基路径，末尾一定带 '/'（根路径就是 '/'，项目站点是 '/pastory/'） */
const BASE = (() => {
  try {
    return new URL(self.registration.scope).pathname
  } catch {
    return '/'
  }
})()

/** 把站内相对路径拼成带基路径的地址 */
function at(p) {
  return BASE.replace(/\/+$/, '') + '/' + String(p).replace(/^\/+/, '')
}

const HOME = at('index.html')
const ROOT = BASE
const PRECACHE = [
  HOME,
  at('manifest.webmanifest'),
  at('favicon.svg'),
  at('icon-192.png'),
  at('icon-512.png'),
  at('apple-touch-icon.png'),
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
          cache.put(HOME, res.clone())
          return res
        } catch {
          const cache = await caches.open(SHELL)
          return (
            (await cache.match(HOME)) ||
            (await cache.match(ROOT)) ||
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
