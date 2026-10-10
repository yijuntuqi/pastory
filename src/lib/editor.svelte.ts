import { ASSET_MAP } from './assets'
import { newPage, uid } from './templates'
import type { LoopId } from './look'
import { stickerOn } from './sticker'
import { loadAsync, loadLocal, saveDoc } from './doc-store'
import { DEFAULT_FONT } from './fonts'
import { DEFAULT_TEXT_W, TEXT_MAX_W, TEXT_MIN_W, textHeight } from './text'
import { isText, type BgType, type Item, type PageDoc, type Stroke, type TextAlign } from './types'

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

/** 文字常用色（和纸面配色同一族） */
export const TEXT_COLORS = [
  '#3A332C',
  '#FFFFFF',
  '#7A6A58',
  '#C97B63',
  '#D98C8C',
  '#D9A441',
  '#8FA98F',
  '#6E7FA0',
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

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function textDefaults(item: Item): Item {
  item.size = num(item.size, 44)
  item.color = typeof item.color === 'string' ? item.color : '#3A332C'
  item.font = item.font ?? DEFAULT_FONT
  item.bold = item.bold === true
  item.italic = item.italic === true
  item.letter = num(item.letter, 0)
  item.lineH = num(item.lineH, 1.4)
  item.align = (item.align === 'center' || item.align === 'right' ? item.align : 'left') as TextAlign
  item.strokeColor = typeof item.strokeColor === 'string' ? item.strokeColor : '#FFFFFF'
  item.strokeWidth = num(item.strokeWidth, 0)
  item.shadow = item.shadow === true
  item.bgPad = num(item.bgPad, 14)
  item.text = typeof item.text === 'string' ? item.text : ''
  item.w = Math.min(TEXT_MAX_W, Math.max(TEXT_MIN_W, num(item.w, DEFAULT_TEXT_W)))
  return item
}

/**
 * 老草稿兼容：缺字段补默认值，删掉彻底没法渲染的元素。
 * 只认「有 asset 的贴纸」和「type === 'text' 的文字」两种。
 */
export function normalizeDoc(doc: PageDoc | null): PageDoc | null {
  if (!doc || typeof doc !== 'object') return null
  if (!Array.isArray(doc.items)) return null
  doc.strokes = Array.isArray(doc.strokes) ? doc.strokes : []
  doc.width = num(doc.width, 1240)
  doc.height = num(doc.height, 1754)
  doc.bg = doc.bg && typeof doc.bg === 'object' ? doc.bg : { type: 'plain', color: '#FBF7F0' }
  doc.bg.type = doc.bg.type ?? 'plain'
  doc.bg.color = doc.bg.color ?? '#FBF7F0'
  doc.items = doc.items.filter((it) => {
    if (!it || typeof it !== 'object') return false
    if (isText(it)) return true
    return typeof it.asset === 'string' && it.asset !== ''
  })
  doc.items.forEach((it, i) => {
    it.id = it.id ?? uid()
    it.x = num(it.x, doc.width! / 2)
    it.y = num(it.y, doc.height! / 2)
    it.w = num(it.w, 200)
    it.h = num(it.h, 200)
    it.rot = num(it.rot, 0)
    it.z = num(it.z, i + 1)
    if (isText(it)) textDefaults(it)
  })
  return doc
}

function load(): PageDoc | null {
  return normalizeDoc(loadLocal())
}

export class Editor {
  page = $state<PageDoc>(load() ?? newPage())
  selected = $state<string | null>(null)
  /** 刚刚放下的素材 id：画布据此播一次弹入动效 */
  lastAdded = $state<string | null>(null)
  past = $state<PageDoc[]>([])
  future = $state<PageDoc[]>([])

  /** 书写模式：画布只收手写笔迹，不选中也不误拖贴纸 */
  writeMode = $state(false)
  /** 文字模式：点空白处新建文字，点已有文字直接改 */
  textMode = $state(false)
  /** 正在编辑的文字项 id（编辑时画布不响应拖动 / 缩放 / 选中） */
  editing = $state<string | null>(null)
  /** 这一轮编辑是否已经记过撤销，用来把「一次编辑」合并成一条记录 */
  private editMarked = false

  constructor() {
    // 首屏先用 localStorage 的快照（同步、不闪），随后用 IndexedDB 里的矢量文档纠正一次
    if (typeof window !== 'undefined') {
      void loadAsync().then((doc) => {
        const fixed = normalizeDoc(doc)
        if (fixed && fixed.items.length !== this.page.items.length) {
          this.page = fixed
          this.selected = null
        } else if (fixed && JSON.stringify(fixed) !== JSON.stringify(this.page)) {
          this.page = fixed
        }
      })
    }
  }

  toggleWrite() {
    this.writeMode = !this.writeMode
    if (this.writeMode) {
      this.selected = null
      this.textMode = false
      this.endEdit()
    }
  }

  toggleText() {
    this.textMode = !this.textMode
    if (this.textMode) this.writeMode = false
    else this.endEdit()
  }

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

  get editingItem(): Item | null {
    if (!this.editing) return null
    return this.page.items.find((i) => i.id === this.editing) ?? null
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
    saveDoc(clone(this.page))
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
    this.editing = null
    this.editMarked = false
    this.save()
  }

  redo() {
    const next = this.future.pop()
    if (!next) return
    this.past.push(this.snap())
    this.page = next
    this.selected = null
    this.editing = null
    this.editMarked = false
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
    this.lastAdded = item.id
    this.editMarked = false
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
    this.lastAdded = item.id
    this.editMarked = false
    this.save()
  }

  /** 新建一个文字框，并直接进入编辑 */
  addText(x?: number, y?: number, text = ''): Item {
    this.mark()
    const item: Item = textDefaults({
      id: uid(),
      asset: '',
      type: 'text',
      text,
      x: x ?? this.page.width / 2,
      y: y ?? this.page.height / 2,
      w: DEFAULT_TEXT_W,
      h: 60,
      rot: 0,
      z: this.topZ() + 1,
    })
    this.page.items.push(item)
    this.relayout(item)
    this.selected = item.id
    this.lastAdded = item.id
    // 新建时已经记过一条撤销，接下来打字合并进同一条
    this.editMarked = true
    this.editing = item.id
    this.save()
    return item
  }

  /** 文字内容变更（输入框每次输入都会调） */
  setText(id: string, text: string) {
    const item = this.page.items.find((i) => i.id === id)
    if (!item || !isText(item)) return
    if (item.text === text) return
    this.beforeTextChange(id)
    item.text = text
    this.relayout(item)
    this.save()
  }

  /** 文字样式变更（字号 / 颜色 / 字体 …） */
  patchText(id: string, patch: Partial<Item>) {
    const item = this.page.items.find((i) => i.id === id)
    if (!item || !isText(item)) return
    this.beforeTextChange(id)
    Object.assign(item, patch)
    textDefaults(item)
    this.relayout(item)
    this.save()
  }

  /** 编辑期间只在第一次改动前记一条撤销，之后的输入合并进同一条 */
  private beforeTextChange(id: string) {
    if (this.editing === id && this.editMarked) return
    this.mark()
    this.editMarked = this.editing === id
  }

  /** 重算文字框高度（排版一变就调） */
  relayout(item: Item) {
    if (!isText(item)) return
    item.h = textHeight(item)
  }

  /** 所有文字项重排一次（字体加载完、清缓存后调） */
  relayoutAll() {
    for (const item of this.page.items) {
      if (isText(item)) this.relayout(item)
    }
    this.save()
  }

  beginEdit(id: string) {
    const item = this.page.items.find((i) => i.id === id)
    if (!item || !isText(item)) return
    this.selected = id
    this.editing = id
    this.editMarked = false
  }

  endEdit() {
    if (!this.editing) return
    this.editing = null
    this.editMarked = false
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
    this.editMarked = false
    this.save()
  }

  remove() {
    if (!this.selected) return
    if (this.editing === this.selected) this.editing = null
    this.mark()
    this.page.items = this.page.items.filter((i) => i.id !== this.selected)
    this.selected = null
    this.editMarked = false
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

  /** 给选中的素材挂一个循环动效；传空字符串表示关掉 */
  setLoop(loop: LoopId | '') {
    const item = this.selectedItem
    if (!item) return
    this.mark()
    item.loop = loop ? loop : undefined
    this.save()
  }

  /** 切换纸面底纹；传 null 表示去掉底纹 */
  setBgTex(tex: string | null) {
    const { type, color } = this.page.bg
    this.mark()
    this.page.bg = tex ? { type, color, tex } : { type, color }
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
    this.editing = null
    this.editMarked = false
    this.save()
  }

  clearItems() {
    this.mark()
    this.page.items = []
    this.selected = null
    this.editing = null
    this.save()
  }

  /** 落下一整条手写笔迹：一笔就是一条撤销记录 */
  addInk(stroke: Stroke) {
    if (stroke.points.length === 0) return
    this.mark()
    this.page.strokes.push(stroke)
    this.save()
  }

  /** 整笔擦除：点中哪几笔就删哪几笔，一次擦除动作只记一条撤销 */
  removeInk(ids: string[], record: boolean) {
    if (ids.length === 0) return
    if (record) this.mark()
    const gone = new Set(ids)
    this.page.strokes = this.page.strokes.filter((s) => !gone.has(s.id))
    this.save()
  }

  /** 墨迹置顶开关（存进文档，导出时同样生效） */
  toggleInkTop() {
    this.page.inkTop = !this.page.inkTop
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
