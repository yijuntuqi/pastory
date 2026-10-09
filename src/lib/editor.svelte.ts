import { ASSET_MAP } from './assets'
import { newPage, uid } from './templates'
import { stickerOn } from './sticker'
import type { BgType, Item, PageDoc } from './types'

const KEY = 'pastory.doc.v1'

export interface BgDef {
  type: BgType
  name: string
  color: string
}

export const BGS: BgDef[] = [
  { type: 'plain', name: '素面', color: '#FBF7F0' },
  { type: 'plain', name: '奶油', color: '#F7EEDF' },
  { type: 'plain', name: '淡粉', color: '#FBEFF0' },
  { type: 'plain', name: '薄荷', color: '#EEF4EC' },
  { type: 'dots', name: '点阵', color: '#FBF7F0' },
  { type: 'grid', name: '方格', color: '#FBF7F0' },
  { type: 'lined', name: '横线', color: '#FBF7F0' },
  { type: 'grid', name: '牛皮', color: '#EFE0C6' },
]

export interface DragStart {
  assetId: string
  name: string
  src: string
  isUser: boolean
  w: number
  h: number
  clientX: number
  clientY: number
}

export interface DragPreview extends DragStart {
  /** 指针当前是否落在画布内 */
  over: boolean
  /** 反算到画布坐标的落点（未在画布内时保留上一个值） */
  pageX: number
  pageY: number
}

/** 屏幕坐标 -> 画布坐标的换算器，由画布组件注册 */
export type DropResolver = (clientX: number, clientY: number) => { x: number; y: number } | null

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function load(): PageDoc | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const doc = JSON.parse(raw) as PageDoc
    if (!doc || !Array.isArray(doc.items)) return null
    return doc
  } catch {
    return null
  }
}

export class Editor {
  page = $state<PageDoc>(load() ?? newPage())
  selected = $state<string | null>(null)
  past = $state<PageDoc[]>([])
  future = $state<PageDoc[]>([])

  /** 素材栏拖拽的实时预览状态，画布据此显示落点提示 */
  drag = $state<DragPreview | null>(null)
  /** 画布注册的坐标换算器；缩放/平移状态由画布持有，这里只做换算 */
  dropResolver: DropResolver | null = null

  setDropResolver(fn: DropResolver | null) {
    this.dropResolver = fn
  }

  beginDrag(start: DragStart) {
    this.drag = { ...start, over: false, pageX: 0, pageY: 0 }
    this.updateDrag(start.clientX, start.clientY)
  }

  updateDrag(clientX: number, clientY: number) {
    const d = this.drag
    if (!d) return
    d.clientX = clientX
    d.clientY = clientY
    const p = this.dropResolver ? this.dropResolver(clientX, clientY) : null
    d.over = p !== null
    if (p) {
      d.pageX = p.x
      d.pageY = p.y
    }
  }

  cancelDrag() {
    this.drag = null
  }

  /** 松手：只有指针在画布内才插入，返回是否真的落下了素材 */
  dropDrag(): boolean {
    const d = this.drag
    this.drag = null
    if (!d || !d.over) return false
    if (d.isUser) this.addUser(d.assetId, d.w, d.h, d.pageX, d.pageY)
    else this.add(d.assetId, d.pageX, d.pageY)
    return true
  }

  get canUndo(): boolean {
    return this.past.length > 0
  }

  get canRedo(): boolean {
    return this.future.length > 0
  }

  get selectedItem(): Item | null {
    if (!this.selected) return null
    return this.page.items.find((i) => i.id === this.selected) ?? null
  }

  get itemCount(): number {
    return this.page.items.length
  }

  private snap(): PageDoc {
    return clone(this.page)
  }

  private topZ(): number {
    return this.page.items.reduce((m, i) => Math.max(m, i.z), 0)
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(clone(this.page)))
    } catch {
      /* 存不上就算了 */
    }
  }

  mark() {
    this.past.push(this.snap())
    if (this.past.length > 60) this.past.shift()
    this.future = []
  }

  undo() {
    const prev = this.past.pop()
    if (!prev) return
    this.future.push(this.snap())
    this.page = prev
    this.selected = null
    this.save()
  }

  redo() {
    const next = this.future.pop()
    if (!next) return
    this.past.push(this.snap())
    this.page = next
    this.selected = null
    this.save()
  }

  add(assetId: string, x?: number, y?: number) {
    const def = ASSET_MAP[assetId]
    if (!def) return
    this.mark()
    const w = 200
    const item: Item = {
      id: uid(),
      asset: assetId,
      x: x ?? this.page.width / 2 + (Math.random() * 80 - 40),
      y: y ?? this.page.height / 2 + (Math.random() * 80 - 40),
      w,
      h: w * (def.h / def.w),
      rot: 0,
      z: this.topZ() + 1,
    }
    this.page.items.push(item)
    this.selected = item.id
    this.save()
  }

  addUser(assetId: string, w: number, h: number, x?: number, y?: number) {
    this.mark()
    const width = 220
    const item: Item = {
      id: uid(),
      asset: assetId,
      x: x ?? this.page.width / 2 + (Math.random() * 80 - 40),
      y: y ?? this.page.height / 2 + (Math.random() * 80 - 40),
      w: width,
      h: width * (h / w),
      rot: 0,
      z: this.topZ() + 1,
    }
    this.page.items.push(item)
    this.selected = item.id
    this.save()
  }

  update(id: string, patch: Partial<Item>, record = false) {
    const item = this.page.items.find((i) => i.id === id)
    if (!item) return
    if (record) this.mark()
    Object.assign(item, patch)
    this.save()
  }

  duplicate() {
    const item = this.selectedItem
    if (!item) return
    this.mark()
    const copy: Item = {
      ...clone(item),
      id: uid(),
      x: item.x + 28,
      y: item.y + 28,
      z: this.topZ() + 1,
    }
    this.page.items.push(copy)
    this.selected = copy.id
    this.save()
  }

  remove() {
    if (!this.selected) return
    this.mark()
    this.page.items = this.page.items.filter((i) => i.id !== this.selected)
    this.selected = null
    this.save()
  }

  toFront() {
    const item = this.selectedItem
    if (!item) return
    this.mark()
    item.z = this.topZ() + 1
    this.save()
  }

  toBack() {
    const item = this.selectedItem
    if (!item) return
    this.mark()
    const min = this.page.items.reduce((m, i) => Math.min(m, i.z), 0)
    item.z = min - 1
    this.save()
  }

  flip() {
    const item = this.selectedItem
    if (!item) return
    this.mark()
    item.flip = !item.flip
    this.save()
  }

  toggleSticker() {
    const item = this.selectedItem
    if (!item) return
    this.mark()
    item.sticker = !stickerOn(item)
    this.save()
  }

  setBg(def: BgDef) {
    this.mark()
    this.page.bg = { type: def.type, color: def.color }
    this.save()
  }

  applyTemplate(id: string) {
    this.mark()
    const blank = newPage(id, this.page.name)
    this.page.bg = blank.bg
    this.page.items = blank.items
    this.page.width = blank.width
    this.page.height = blank.height
    this.selected = null
    this.save()
  }

  clearItems() {
    this.mark()
    this.page.items = []
    this.selected = null
    this.save()
  }

  rename(name: string) {
    this.page.name = name.trim() || '未命名'
    this.save()
  }
}

export function createEditor(): Editor {
  return new Editor()
}
