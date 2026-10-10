/** 素材收藏：本地持久化，刷新不丢 */
const KEY = 'pastory.fav.v1'

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

class AssetFav {
  ids = $state<string[]>(read())

  has(id: string): boolean {
    return this.ids.includes(id)
  }

  toggle(id: string) {
    this.ids = this.has(id) ? this.ids.filter((x) => x !== id) : [id, ...this.ids]
    this.persist()
  }

  remove(id: string) {
    if (!this.has(id)) return
    this.ids = this.ids.filter((x) => x !== id)
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

export const favs = new AssetFav()
