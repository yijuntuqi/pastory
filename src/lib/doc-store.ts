/**
 * 文档持久化。
 *
 * 贴纸、文字、墨迹都在同一份 PageDoc 里，所以文字天然和贴纸共用一套存储：
 * - localStorage 仍是同步快照（老草稿从这儿读，秒开不闪）；
 * - IndexedDB（库 pastory-docs）存同一份文档，作为矢量数据的正式落盘位置。
 * 两者写的是同一份数据，读的时候 IndexedDB 优先、localStorage 兜底，
 * 因此升级后不会丢老草稿，也不会出现两套数据不一致。
 */
import type { PageDoc } from './types'

const LS_KEY = 'pastory.doc.v1'
const DB_NAME = 'pastory-docs'
const STORE = 'docs'
const DOC_KEY = 'current'

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      try {
        const req = indexedDB.open(DB_NAME, 1)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      } catch (err) {
        reject(err)
      }
    })
  }
  return dbPromise
}

/** 同步读 localStorage（首屏先用它，避免白屏） */
export function loadLocal(): PageDoc | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PageDoc
  } catch {
    return null
  }
}

/** 异步读 IndexedDB；没有就返回 null */
export async function loadAsync(): Promise<PageDoc | null> {
  try {
    const db = await openDB()
    return await new Promise<PageDoc | null>((resolve, reject) => {
      const r = db.transaction(STORE, 'readonly').objectStore(STORE).get(DOC_KEY)
      r.onsuccess = () => resolve((r.result as PageDoc) ?? null)
      r.onerror = () => reject(r.error)
    })
  } catch {
    return null
  }
}

let pending: PageDoc | null = null
let writing = false

async function flush(): Promise<void> {
  if (writing) return
  const doc = pending
  if (!doc) return
  pending = null
  writing = true
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(doc, DOC_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } catch {
    /* IndexedDB 写不进去就算了，localStorage 那份还在 */
  } finally {
    writing = false
    if (pending) void flush()
  }
}

/** 写两份：localStorage 同步落，IndexedDB 异步落 */
export function saveDoc(doc: PageDoc): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(doc))
  } catch {
    /* 存不上就算了 */
  }
  pending = doc
  void flush()
}
