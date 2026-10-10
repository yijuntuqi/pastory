/**
 * 多页文档的持久化（页序 + 各页快照）。
 *
 * 单页的正式落盘位置仍是 doc-store（localStorage 快照 + IndexedDB 矢量文档），
 * 这里只多存一份「页列表」：当前页永远是 doc-store 里那一份（最新），
 * 其余页用切页 / 增删页时的快照。两者都写在 localStorage，键名独立，互不覆盖。
 */
import type { PageDoc } from './types'

const LS_KEY = 'pastory.pages.v1'

export interface PagesDoc {
  /** 当前页在 pages 里的下标 */
  index: number
  pages: PageDoc[]
}

export function loadPages(): PagesDoc | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PagesDoc
    if (!parsed || !Array.isArray(parsed.pages) || parsed.pages.length === 0) return null
    return { index: typeof parsed.index === 'number' ? parsed.index : 0, pages: parsed.pages }
  } catch {
    return null
  }
}

export function savePages(doc: PagesDoc): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(doc))
  } catch {
    /* 存不上就算了，单页那份还在 */
  }
}
