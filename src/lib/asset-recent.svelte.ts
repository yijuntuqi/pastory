/** 最近使用的素材：按使用时间倒序，本地持久化 */
const KEY = 'pastory.recent.v1'
const MAX = 24

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

class AssetRecent {
  ids = $state<string[]>(read())

  push(id: string) {
    if (!id) return
    this.ids = [id, ...this.ids.filter((x) => x !== id)].slice(0, MAX)
    this.persist()
  }

  clear() {
    this.ids = []
    this.persist()
  }

  private persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.ids))
    } catch {
      /* 存不上就算了 */
    }
  }
}

export const recents = new AssetRecent()
