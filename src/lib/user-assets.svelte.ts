import { SvelteMap } from 'svelte/reactivity'
import { ASSET_MAP, assetUrl } from './assets'

export interface UserAsset {
  src: string
  w: number
  h: number
}

const DB_NAME = 'pastory-user-assets'
const STORE = 'images'
const MAX_SIDE = 1400
const BLANK =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

export const userAssets = new SvelteMap<string, UserAsset>()

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

export async function loadUserAssets(): Promise<void> {
  try {
    const db = await openDB()
    const store = db.transaction(STORE, 'readonly').objectStore(STORE)
    const keys = await new Promise<IDBValidKey[]>((res, rej) => {
      const r = store.getAllKeys()
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
    })
    const vals = await new Promise<UserAsset[]>((res, rej) => {
      const r = store.getAll()
      r.onsuccess = () => res(r.result as UserAsset[])
      r.onerror = () => rej(r.error)
    })
    userAssets.clear()
    keys.forEach((k, i) => {
      const v = vals[i]
      if (v && v.src) userAssets.set(String(k), v)
    })
  } catch {
    /* read failed: keep running with built-ins only */
  }
}

async function shrink(file: File): Promise<UserAsset> {
  const bmp = await createImageBitmap(file)
  const ratio = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
  const w = Math.max(1, Math.round(bmp.width * ratio))
  const h = Math.max(1, Math.round(bmp.height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no 2d context')
  ctx.drawImage(bmp, 0, 0, w, h)
  if (typeof bmp.close === 'function') bmp.close()
  return { src: canvas.toDataURL('image/png'), w, h }
}

export async function importFiles(files: FileList | File[]): Promise<number> {
  let n = 0
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue
    if (file.size > 12 * 1024 * 1024) continue
    try {
      const asset = await shrink(file)
      const id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      userAssets.set(id, asset)
      const db = await openDB()
      db.transaction(STORE, 'readwrite').objectStore(STORE).put(asset, id)
      n += 1
    } catch {
      /* skip this file */
    }
  }
  return n
}

export async function removeUserAsset(id: string): Promise<void> {
  userAssets.delete(id)
  try {
    const db = await openDB()
    db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id)
  } catch {
    /* ignore */
  }
}

export function itemSrc(assetId: string): string {
  const u = userAssets.get(assetId)
  if (u) return u.src
  const def = ASSET_MAP[assetId]
  if (def) return assetUrl(def)
  return assetId.startsWith('u') ? BLANK : ''
}
