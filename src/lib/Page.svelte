<script lang="ts">
  import { itemSrc } from './user-assets.svelte'
  import { itemFilter, paperOn } from './sticker'
  import { settings } from './settings.svelte'
  import { PAPER_TEX_ALPHA, paperClip, paperEdge } from './look'
  import { brushDef, makeSpeedMapper, MIN_SAMPLE_DIST, paintInk, paintStroke, smoothAlpha, strokeHit, strokeLength } from './ink'
  import { clearTextCache, cssFamilyOf, cssShadowOf, layoutOf, TEXT_MAX_W, TEXT_MIN_W } from './text'
  import { ensureFont, type FontId } from './fonts'
  import type { Editor } from './editor.svelte'
  import { isText, type Item, type Stroke } from './types'

  let { editor }: { editor: Editor } = $props()

  const MIN_Z = 0.2
  const MAX_Z = 4
  const MIN_SIZE = 24
  const MAX_SIZE = 2400

  let zoom = $state(1)
  let panX = $state(0)
  let panY = $state(0)
  let viewport = $state<HTMLDivElement | null>(null)
  let stageEl = $state<HTMLDivElement | null>(null)
  /** 叠在画布上的文字输入框（viewport 坐标系，不参与画布的 scale 变换，iPad 上更稳） */
  let editEl = $state<HTMLTextAreaElement | null>(null)

  type Mode = 'idle' | 'move' | 'scale' | 'rotate' | 'pan' | 'pinch'
  let mode: Mode = $state('idle')
  const pts = new Map<number, { x: number; y: number }>()

  let d = {
    id: '',
    px: 0,
    py: 0,
    x0: 0,
    y0: 0,
    w0: 0,
    h0: 0,
    rot0: 0,
    cx: 0,
    cy: 0,
    v0: 1,
    a0: 0,
    panX0: 0,
    panY0: 0,
    zoom0: 1,
    dist0: 1,
    midX0: 0,
    midY0: 0,
  }

  // ---- 手写墨迹：两层独立画布（已落笔的 + 正在画的那一笔） ----
  /** 画布内部渲染倍率，缩放后依然锐利 */
  const INK_RES = Math.min(3, Math.max(2, window.devicePixelRatio || 1))
  let inkBase = $state<HTMLCanvasElement | null>(null)
  let inkLive = $state<HTMLCanvasElement | null>(null)
  let drawing = false
  let drawId = -1
  let erasing = false
  let eraseId = -1
  let eraseMarked = false
  let stroke: Stroke | null = null
  let strokeByPressure = false
  let lastX = 0
  let lastY = 0
  let lastT = 0
  let lastP = 0.6
  /** 无压感输入的宽度映射器：每一笔重建一个，窗口平均 + 一阶滞后 */
  let speedMap: ((speed: number) => number) | null = null
  /** 指数平滑后的上一个采样点（防抖） */
  let smoothX = 0
  let smoothY = 0
  let rafId = 0
  let inkSeq = 0

  function inkId(): string {
    inkSeq += 1
    return 'k' + Date.now().toString(36) + inkSeq.toString(36)
  }

  function clamp(v: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, v))
  }

  function toPage(cx: number, cy: number) {
    const el = stageEl
    if (!el) return { x: 0, y: 0 }
    const r = el.getBoundingClientRect()
    return { x: (cx - r.left) / zoom, y: (cy - r.top) / zoom }
  }

  function hit(p: { x: number; y: number }): Item | null {
    const items = [...editor.page.items].sort((a, b) => b.z - a.z)
    for (const it of items) {
      const dx = p.x - it.x
      const dy = p.y - it.y
      const a = (-it.rot * Math.PI) / 180
      const lx = dx * Math.cos(a) - dy * Math.sin(a)
      const ly = dx * Math.sin(a) + dy * Math.cos(a)
      if (Math.abs(lx) <= it.w / 2 && Math.abs(ly) <= it.h / 2) return it
    }
    return null
  }

  export function fit() {
    const el = viewport
    if (!el) return
    const vw = el.clientWidth
    const vh = el.clientHeight
    const pw = editor.page.width
    const ph = editor.page.height
    const z = clamp(Math.min((vw - 40) / pw, (vh - 40) / ph), MIN_Z, MAX_Z)
    zoom = z
    panX = (vw - pw * z) / 2
    panY = (vh - ph * z) / 2
  }

  $effect(() => {
    const el = viewport
    if (!el) return
    fit()
    const ro = new ResizeObserver(() => fit())
    ro.observe(el)
    return () => ro.disconnect()
  })

  // 把屏幕坐标换算成画布坐标（复用本组件的 zoom / pan，不另建一套状态），
  // 注册给 editor，供素材栏拖拽时判断落点。
  $effect(() => {
    const el = stageEl
    if (!el) return
    editor.setDropResolver((cx, cy) => {
      const r = el.getBoundingClientRect()
      const x = (cx - r.left) / zoom
      const y = (cy - r.top) / zoom
      if (x < 0 || y < 0 || x > editor.page.width || y > editor.page.height) return null
      return { x, y }
    })
    return () => editor.setDropResolver(null)
  })

  // 画布尺寸或画布元素变化时重新配好墨迹层
  $effect(() => {
    void editor.page.width
    void editor.page.height
    void inkBase
    void inkLive
    setupInk()
  })

  // 墨迹数据变动（落笔 / 擦除 / 撤销重做）时只重画已落笔的那一层
  $effect(() => {
    void editor.page.strokes.length
    void settings.jitter
    void settings.nib
    drawBase()
  })

  // 退出书写模式时收尾还没结束的笔迹
  $effect(() => {
    if (!editor.writeMode && drawing) endStroke(true)
  })

  // ---- 动效：全在单个素材元素上做，不动画布容器 ----
  /** 刚刚落下的素材：播一次弹入 */
  let popId = $state<string | null>(null)
  /** 被删掉 / 撤销掉的素材：淡出一下再移除 */
  let ghosts = $state<{ key: string; item: Item }[]>([])
  let ghostSeq = 0
  let prevItems: Item[] = []

  function loopClass(item: Item): string {
    if (!settings.motion || !item.loop) return ''
    return 'm-' + item.loop
  }

  $effect(() => {
    const id = editor.lastAdded
    if (!id || !settings.motion) return
    popId = id
    const t = setTimeout(() => {
      if (popId === id) popId = null
    }, 240)
    return () => clearTimeout(t)
  })

  $effect(() => {
    const current = editor.page.items
    const ids = new Set(current.map((i) => i.id))
    const prev = prevItems
    prevItems = current.map((i) => ({ ...i }) as Item)
    if (!settings.motion) {
      if (ghosts.length) ghosts = []
      return
    }
    for (const old of prev) {
      if (ids.has(old.id)) continue
      ghostSeq += 1
      const key = 'g' + ghostSeq
      ghosts.push({ key, item: old })
      setTimeout(() => {
        ghosts = ghosts.filter((g) => g.key !== key)
      }, 260)
    }
  })

  function mid() {
    const list = [...pts.values()]
    const a = list[0]
    const b = list[1]
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }

  function dist() {
    const list = [...pts.values()]
    const a = list[0]
    const b = list[1]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function inkCtx(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
    return canvas ? canvas.getContext('2d') : null
  }

  function setupInk(): void {
    const w = editor.page.width
    const h = editor.page.height
    for (const c of [inkBase, inkLive]) {
      if (!c) continue
      c.width = Math.max(1, Math.round(w * INK_RES))
      c.height = Math.max(1, Math.round(h * INK_RES))
      c.style.width = w + 'px'
      c.style.height = h + 'px'
    }
    drawBase()
    drawLive()
  }

  /** 已落笔的全部墨迹：只在增删、撤销重做时整层重画 */
  function drawBase(): void {
    const ctx = inkCtx(inkBase)
    if (!ctx || !inkBase) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, inkBase.width, inkBase.height)
    ctx.setTransform(INK_RES, 0, 0, INK_RES, 0, 0)
    paintInk(ctx, editor.page.strokes, settings.feel)
  }

  /** 正在画的那一笔：单独一层，每一帧只重画它自己，抬笔前就能看见 */
  function drawLive(): void {
    const ctx = inkCtx(inkLive)
    if (!ctx || !inkLive) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, inkLive.width, inkLive.height)
    if (!stroke) return
    ctx.setTransform(INK_RES, 0, 0, INK_RES, 0, 0)
    paintStroke(ctx, stroke, settings.feel)
  }

  function scheduleLive(): void {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      drawLive()
    })
  }

  /** 这一笔能不能落：Apple Pencil 永远可以；手指默认不行，防止手掌误触 */
  function canDraw(e: PointerEvent): boolean {
    if (!editor.writeMode) return false
    if (e.pointerType === 'pen' || e.pointerType === 'mouse') return true
    return e.pointerType === 'touch' && settings.fingerDraw
  }

  /** Apple Pencil 直接取压力；拿不到压力时给一个轻触的默认值 */
  function pressureOf(e: PointerEvent): number {
    const p = typeof e.pressure === 'number' ? e.pressure : 0
    return p > 0 ? clamp(p, 0, 1) : 0.35
  }

  function beginStroke(e: PointerEvent): void {
    const p = toPage(e.clientX, e.clientY)
    const tool = settings.tool
    const def = brushDef(tool === 'eraser' ? 'pen' : tool)
    strokeByPressure = e.pointerType === 'pen'
    drawing = true
    drawId = e.pointerId
    lastX = p.x
    lastY = p.y
    lastT = e.timeStamp
    lastP = strokeByPressure ? pressureOf(e) : 0.6
    speedMap = makeSpeedMapper(settings.feel)
    smoothX = p.x
    smoothY = p.y
    stroke = {
      id: inkId(),
      brush: def.id,
      color: settings.inkColor,
      width: Math.max(0.8, def.width * settings.inkSize),
      points: [{ x: p.x, y: p.y, p: lastP }],
    }
    const el = stageEl
    if (el) {
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* 个别环境不支持，忽略 */
      }
    }
    drawLive()
  }

  function appendPoint(e: PointerEvent): void {
    const s = stroke
    if (!s) return
    const raw = toPage(e.clientX, e.clientY)
    // 防抖：先对采样点做指数平滑，再去掉鼠标的高频抖动
    const alpha = smoothAlpha(settings.feel)
    smoothX += (raw.x - smoothX) * alpha
    smoothY += (raw.y - smoothY) * alpha
    const p = { x: smoothX, y: smoothY }
    const moved = Math.hypot(p.x - lastX, p.y - lastY)
    if (moved < MIN_SAMPLE_DIST) return
    const dt = Math.max(1, e.timeStamp - lastT)
    let value: number
    if (strokeByPressure) {
      value = pressureOf(e)
      const tilt = Math.max(Math.abs(e.tiltX), Math.abs(e.tiltY))
      if (brushDef(s.brush).tilt && tilt > 0) value = clamp(value * (1 + (tilt / 90) * 0.35), 0, 1)
    } else {
      value = speedMap ? speedMap(moved / dt) : lastP
    }
    lastP = value
    lastX = p.x
    lastY = p.y
    lastT = e.timeStamp
    s.points.push({ x: p.x, y: p.y, p: value })
    scheduleLive()
  }

  /** 一笔结束：真正写进文档（自动保存 + 一条撤销记录） */
  function endStroke(keep: boolean): void {
    const s = stroke
    drawing = false
    drawId = -1
    stroke = null
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
    drawLive()
    // 剔除毛刺：单点或长度不到 3 个页面像素的抖动笔画不留
    if (keep && s && s.points.length > 1 && strokeLength(s) >= 3) editor.addInk(s)
  }

  /** 整笔擦除：点中哪一笔就删掉整条，不做像素级擦除 */
  function eraseAt(e: PointerEvent): void {
    const p = toPage(e.clientX, e.clientY)
    const tol = Math.max(6, 10 / zoom)
    const list = editor.page.strokes
    const targets: string[] = []
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (strokeHit(list[i], p.x, p.y, tol)) targets.push(list[i].id)
    }
    if (targets.length === 0) return
    editor.removeInk(targets, !eraseMarked)
    eraseMarked = true
  }

  function beginErase(e: PointerEvent): void {
    erasing = true
    eraseId = e.pointerId
    eraseMarked = false
    const el = stageEl
    if (el) {
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* 个别环境不支持，忽略 */
      }
    }
    eraseAt(e)
  }

  function onDown(e: PointerEvent) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return
    // 编辑文字时画布不参与拖动 / 缩放 / 选中，输入框自己接管指针
    if (editor.editing) return
    e.preventDefault()
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pts.size === 2) {
      // 第二根手指落下：当前笔迹立即收尾，转入双指缩放平移
      if (drawing) endStroke(true)
      if (erasing) erasing = false
      const m = mid()
      d.zoom0 = zoom
      d.panX0 = panX
      d.panY0 = panY
      d.dist0 = Math.max(1, dist())
      d.midX0 = m.x
      d.midY0 = m.y
      mode = 'pinch'
      return
    }
    if (pts.size > 2) return

    if (editor.textMode) {
      // 文字模式：点已有文字直接改，点空白处新建一个文字框
      const p = toPage(e.clientX, e.clientY)
      const it = hit(p)
      if (it && isText(it)) {
        editor.beginEdit(it.id)
        return
      }
      if (it) {
        editor.selected = it.id
        mode = 'move'
        d.id = it.id
        d.px = p.x
        d.py = p.y
        d.x0 = it.x
        d.y0 = it.y
        return
      }
      editor.addText(p.x, p.y)
      return
    }

    if (editor.writeMode) {
      if (canDraw(e)) {
        if (settings.tool === 'eraser') beginErase(e)
        else beginStroke(e)
        return
      }
      // 书写模式下非绘制指针（手指且未开「手指可画」）只平移，不选中也不误拖贴纸
      editor.selected = null
      mode = 'pan'
      d.px = e.clientX
      d.py = e.clientY
      d.panX0 = panX
      d.panY0 = panY
      return
    }

    const p = toPage(e.clientX, e.clientY)
    const it = hit(p)
    if (it) {
      editor.selected = it.id
      mode = 'move'
      d.id = it.id
      d.px = p.x
      d.py = p.y
      d.x0 = it.x
      d.y0 = it.y
    } else {
      editor.selected = null
      mode = 'pan'
      d.px = e.clientX
      d.py = e.clientY
      d.panX0 = panX
      d.panY0 = panY
    }
  }

  function onScaleDown(e: PointerEvent) {
    e.stopPropagation()
    e.preventDefault()
    const it = editor.selectedItem
    if (!it) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const p = toPage(e.clientX, e.clientY)
    const dx = p.x - it.x
    const dy = p.y - it.y
    d.id = it.id
    d.w0 = it.w
    d.h0 = it.h
    d.cx = it.x
    d.cy = it.y
    d.v0 = Math.max(1, Math.hypot(dx, dy))
    mode = 'scale'
    editor.mark()
  }

  function onRotateDown(e: PointerEvent) {
    e.stopPropagation()
    e.preventDefault()
    const it = editor.selectedItem
    if (!it) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const p = toPage(e.clientX, e.clientY)
    d.id = it.id
    d.cx = it.x
    d.cy = it.y
    d.rot0 = it.rot
    d.a0 = (Math.atan2(p.y - it.y, p.x - it.x) * 180) / Math.PI
    mode = 'rotate'
    editor.mark()
  }

  function onMove(e: PointerEvent) {
    if (!pts.has(e.pointerId)) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (drawing && e.pointerId === drawId) {
      // getCoalescedEvents 在 Safari 上不存在，必须先判断存在性再调用
      const coalesced = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : []
      if (coalesced.length > 0) {
        for (const ev of coalesced) appendPoint(ev)
      } else {
        appendPoint(e)
      }
      return
    }

    if (erasing && e.pointerId === eraseId) {
      eraseAt(e)
      return
    }

    if (mode === 'pinch' && pts.size >= 2) {
      const f = dist() / d.dist0
      const z = clamp(d.zoom0 * f, MIN_Z, MAX_Z)
      const m = mid()
      zoom = z
      panX = m.x - (d.midX0 - d.panX0) * (z / d.zoom0)
      panY = m.y - (d.midY0 - d.panY0) * (z / d.zoom0)
      return
    }

    if (mode === 'pan') {
      panX = d.panX0 + (e.clientX - d.px)
      panY = d.panY0 + (e.clientY - d.py)
      return
    }

    const it = editor.page.items.find((i) => i.id === d.id)
    if (!it) return
    const p = toPage(e.clientX, e.clientY)

    if (mode === 'move') {
      it.x = d.x0 + (p.x - d.px)
      it.y = d.y0 + (p.y - d.py)
    } else if (mode === 'scale') {
      const v = Math.hypot(p.x - d.cx, p.y - d.cy)
      const f = v / d.v0
      if (isText(it)) {
        // 文字框只改宽度，高度永远由排版算出来，避免和实际行数对不上
        it.w = clamp(d.w0 * f, TEXT_MIN_W, TEXT_MAX_W)
        editor.relayout(it)
      } else {
        it.w = clamp(d.w0 * f, MIN_SIZE, MAX_SIZE)
        it.h = clamp(d.h0 * f, MIN_SIZE, MAX_SIZE)
      }
    } else if (mode === 'rotate') {
      const a = (Math.atan2(p.y - d.cy, p.x - d.cx) * 180) / Math.PI
      it.rot = Math.round(d.rot0 + (a - d.a0))
    }
  }

  function onUp(e: PointerEvent) {
    if (!pts.has(e.pointerId)) return
    if (drawing && e.pointerId === drawId) endStroke(true)
    if (erasing && e.pointerId === eraseId) {
      erasing = false
      eraseId = -1
    }
    pts.delete(e.pointerId)
    if (pts.size === 0) {
      if (mode !== 'idle') editor.save()
      mode = 'idle'
    } else if (pts.size === 1) {
      const last = [...pts.values()][0]
      d.px = last.x
      d.py = last.y
      d.panX0 = panX
      d.panY0 = panY
      mode = 'pan'
    }
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    if (editor.editing) return
    const el = viewport
    if (!el) return
    const r = el.getBoundingClientRect()
    const mx = e.clientX - r.left
    const my = e.clientY - r.top
    const z = clamp(zoom * (e.deltaY < 0 ? 1.08 : 0.93), MIN_Z, MAX_Z)
    panX = mx - (mx - panX) * (z / zoom)
    panY = my - (my - panY) * (z / zoom)
    zoom = z
  }

  const sel = $derived(editor.selectedItem)
  const hs = $derived(Math.round(16 / Math.max(zoom, 0.3)))

  // ---- 文字：叠层输入框 ----
  const editingItem = $derived(editor.editingItem)
  const editBox = $derived.by(() => {
    const it = editingItem
    if (!it) return null
    const L = layoutOf(it)
    return {
      left: panX + it.x * zoom,
      top: panY + it.y * zoom,
      w: it.w * zoom,
      h: L.h * zoom,
      lineH: L.lineH * zoom,
      padX: L.padX * zoom,
      padY: L.padY * zoom,
      size: (it.size ?? 44) * zoom,
    }
  })
  /** 画面上所有文字项用到的字体；加载完成后要清排班缓存并重排 */
  const textFontKey = $derived(
    [...new Set(editor.page.items.filter(isText).map((i) => i.font ?? ''))].join(','),
  )

  /** 把文字框滚（平移）进可视区，而不是滚整个页面 */
  function ensureVisible(id: string) {
    const el = viewport
    const it = editor.page.items.find((i) => i.id === id)
    if (!el || !it) return
    const L = layoutOf(it)
    const vw = el.clientWidth
    const vh = el.clientHeight
    const bw = it.w * zoom
    const bh = L.h * zoom
    const m = 16
    let nx = panX
    let ny = panY
    const left = nx + it.x * zoom - bw / 2
    const top = ny + it.y * zoom - bh / 2
    if (left < m) nx += m - left
    if (left + bw > vw - m) nx -= left + bw - (vw - m)
    if (top < m) ny += m - top
    if (top + bh > vh - m) ny -= top + bh - (vh - m)
    panX = nx
    panY = ny
  }

  function onTextInput(e: Event) {
    const it = editingItem
    if (!it) return
    editor.setText(it.id, (e.currentTarget as HTMLTextAreaElement).value)
  }

  function onTextKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      editor.endEdit()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      editor.endEdit()
    }
  }

  function onDblClick(e: MouseEvent) {
    if (editor.editing) return
    const p = toPage(e.clientX, e.clientY)
    const it = hit(p)
    if (it && isText(it)) editor.beginEdit(it.id)
  }

  // 进入编辑：聚焦输入框、把光标放到末尾，并把文字框挪进可视区
  $effect(() => {
    const id = editor.editing
    if (!id) return
    const el = editEl
    ensureVisible(id)
    if (!el) return
    requestAnimationFrame(() => {
      try {
        el.focus({ preventScroll: true })
        const n = el.value.length
        el.setSelectionRange(n, n)
      } catch {
        /* 个别环境上 setSelectionRange 不可用，忽略 */
      }
    })
  })

  // iPad 弹出软键盘时 visualViewport 会变小，跟着把文字框挪回可视区
  $effect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => {
      if (editor.editing) ensureVisible(editor.editing)
    }
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  })

  // 字体到位后重排一次，屏幕和导出的度量才一致
  $effect(() => {
    const ids = [...new Set(textFontKey.split(',').filter(Boolean))] as FontId[]
    if (ids.length === 0) return
    for (const id of ids) {
      void ensureFont(id).then(() => {
        clearTextCache()
        editor.relayoutAll()
      })
    }
  })
</script>

{#snippet textVisual(item: Item, hidden: boolean)}
  {@const L = layoutOf(item)}
  <div
    class="txt"
    class:hide={hidden}
    style="font-family:{cssFamilyOf(item)}; font-size:{item.size ?? 44}px; font-weight:{item.bold
      ? 700
      : 400}; font-style:{item.italic
      ? 'italic'
      : 'normal'}; color:{item.color ??
      '#3A332C'}; letter-spacing:{item.letter ?? 0}px; line-height:{L.lineH}px; text-align:{item.align ??
      'left'}; text-shadow:{cssShadowOf(item)}; -webkit-text-stroke:{item.strokeWidth &&
    item.strokeWidth > 0
      ? (item.strokeWidth + 'px ' + (item.strokeColor ?? '#FFFFFF'))
      : '0'}; paint-order:stroke fill; background:{item.bgColor ??
      'transparent'}; padding:{L.padY}px {L.padX}px;"
  >
    {#each L.lines as line, i (i)}
      <div class="tline">{line === '' ? ' ' : line}</div>
    {/each}
  </div>
{/snippet}

{#snippet visual(item: Item, cls: string, active: boolean)}
  <div class="looper {cls}" style="filter:{itemFilter(item, { depth: settings.depth, active })};">
    {#if paperOn(item)}
      <div
        class="paper"
        style="clip-path:{paperClip(item.id)}; padding:{paperEdge(item.w, item.h)}px;"
      >
        <img class="photo" src={itemSrc(item.asset)} alt="" draggable="false" />
        <span class="sheen"></span>
      </div>
    {:else}
      <img class="plain" src={itemSrc(item.asset)} alt="" draggable="false" />
    {/if}
  </div>
{/snippet}

<svelte:window on:pointermove={onMove} on:pointerup={onUp} on:pointercancel={onUp} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="viewport" class:tilt={settings.tilt} bind:this={viewport} onwheel={onWheel}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="stage"
    class:dropping={!!editor.drag?.over}
    class:no-motion={!settings.motion}
    bind:this={stageEl}
    onpointerdown={onDown}
    ondblclick={onDblClick}
    style="width:{editor.page.width}px; height:{editor.page.height}px; background:{editor.page
      .bg.color}; transform: translate({panX}px, {panY}px) scale({zoom}){settings.tilt
      ? ' translate(50%, 50%) rotateX(7deg) rotateY(-4deg) translate(-50%, -50%)'
      : ''};"
  >
    {#if editor.page.bg.tex}
      <div
        class="bg bg-tex"
        style="background-image:url('{editor.page.bg.tex}'); opacity:{PAPER_TEX_ALPHA};"
      ></div>
    {/if}

    {#if editor.page.bg.type === 'dots'}
      <div class="bg bg-dots"></div>
    {:else if editor.page.bg.type === 'grid'}
      <div class="bg bg-grid"></div>
    {:else if editor.page.bg.type === 'lined'}
      <div class="bg bg-lined"></div>
    {/if}

    <div class="grain"></div>

    <canvas class="ink" class:on-top={editor.page.inkTop === true} bind:this={inkBase}></canvas>
    <canvas
      class="ink live"
      class:on-top={editor.page.inkTop === true}
      bind:this={inkLive}
    ></canvas>

    {#each editor.page.items as item (item.id)}
      <div
        class="item"
        style="left:{item.x}px; top:{item.y}px; width:{item.w}px; height:{item.h}px; opacity:{item
          .opacity ?? 1}; z-index:{item.z}; transform: translate(-50%, -50%) rotate({item.rot}deg) scaleX({item
          .flip ? -1 : 1}) scale({editor.selected === item.id ? 1.04 : 1});"
      >
        <div class="pop" class:on={popId === item.id}>
          {#if isText(item)}
            {@render textVisual(item, editor.editing === item.id)}
          {:else}
            {@render visual(item, loopClass(item), editor.selected === item.id)}
          {/if}
        </div>
      </div>
    {/each}

    {#each ghosts as g (g.key)}
      <div
        class="item gone"
        style="left:{g.item.x}px; top:{g.item.y}px; width:{g.item.w}px; height:{g.item.h}px; opacity:{g
          .item.opacity ?? 1}; z-index:{g.item.z}; transform: translate(-50%, -50%) rotate({g.item
          .rot}deg) scaleX({g.item.flip ? -1 : 1});"
      >
        {#if isText(g.item)}
          {@render textVisual(g.item, false)}
        {:else}
          {@render visual(g.item, '', false)}
        {/if}
      </div>
    {/each}

    {#if editor.drag?.over}
      <div class="drop-hint" style="left:{editor.drag.pageX}px; top:{editor.drag.pageY}px;"></div>
    {/if}

    {#if sel}
      <div
        class="sel-box"
        style="left:{sel.x}px; top:{sel.y}px; width:{sel.w}px; height:{sel.h}px; transform: translate(-50%, -50%) rotate({sel
          .rot}deg); z-index:90000; border-width:{Math.max(1, 1.5 / zoom)}px;"
      >
        <button
          class="handle rotate"
          aria-label="旋转"
          style="width:{hs}px; height:{hs}px; top:{-hs}px; left:calc(50% - {hs / 2}px); transform: rotate({-sel
            .rot}deg);"
          onpointerdown={onRotateDown}
        ></button>
        <button
          class="handle scale"
          aria-label="缩放"
          style="width:{hs}px; height:{hs}px; right:{-hs / 2}px; bottom:{-hs / 2}px; transform: rotate({-sel
            .rot}deg);"
          onpointerdown={onScaleDown}
        ></button>
      </div>
    {/if}
  </div>

  {#if editingItem && editBox}
    <textarea
      class="text-edit"
      bind:this={editEl}
      value={editingItem.text ?? ''}
      aria-label="编辑文字"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      oninput={onTextInput}
      onkeydown={onTextKey}
      onblur={() => editor.endEdit()}
      style="left:{editBox.left - editBox.w / 2}px; top:{editBox.top - editBox.h / 2}px; width:{editBox
        .w}px; height:{editBox.h}px; font-family:{cssFamilyOf(editingItem)}; font-size:{editBox
        .size}px; line-height:{editBox.lineH}px; font-weight:{editingItem.bold
        ? 700
        : 400}; font-style:{editingItem.italic
        ? 'italic'
        : 'normal'}; color:{editingItem.color ??
        '#3A332C'}; letter-spacing:{(editingItem.letter ?? 0) *
        zoom}px; text-align:{editingItem.align ??
        'left'}; padding:{editBox.padY}px {editBox.padX}px; background:{editingItem.bgColor ??
        'rgba(255,255,255,0.92)'}; transform: rotate({editingItem.rot}deg);"
    ></textarea>
    <button
      class="text-done"
      style="left:{editBox.left + editBox.w / 2}px; top:{editBox.top - editBox.h / 2}px;"
      onpointerdown={(e) => e.preventDefault()}
      onclick={() => editor.endEdit()}>完成</button>
  {/if}
</div>

<style>
  .viewport {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    touch-action: none;
    background: var(--paper-3);
  }

  /* 整页 3D 透视：默认关闭，开着会影响导出观感 */
  .viewport.tilt {
    perspective: 1400px;
    perspective-origin: 50% 40%;
  }

  .stage {
    position: absolute;
    left: 0;
    top: 0;
    transform-origin: 0 0;
    box-shadow: var(--shadow-md);
    border-radius: 4px;
    overflow: hidden;
    will-change: transform;
  }

  /* 拖拽悬停时给纸面描边高亮 */
  .stage.dropping {
    box-shadow: var(--shadow-md), 0 0 0 3px var(--terra);
  }

  /* 墨迹层：纸面之上、贴纸之下；打开「墨迹置顶」后压到所有贴纸之上 */
  .ink {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 0;
    pointer-events: none;
  }

  .ink.on-top {
    z-index: 50000;
  }

  .bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .bg-tex {
    background-size: cover;
    background-position: center;
  }

  .bg-dots {
    background-image: radial-gradient(#d6cbb8 1.6px, transparent 1.6px);
    background-size: 32px 32px;
    background-position: 8px 8px;
  }

  .bg-grid {
    background-image: linear-gradient(#d6cbb8 1px, transparent 1px),
      linear-gradient(90deg, #d6cbb8 1px, transparent 1px);
    background-size: 32px 32px;
  }

  .bg-lined {
    background-image: linear-gradient(#d6cbb8 1px, transparent 1px);
    background-size: 100% 36px;
    background-position: 0 48px;
  }

  /* 文字项：整块就是排版好的行，由 JS 断行，屏幕和导出共用同一组行 */
  .txt {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    white-space: pre;
    overflow: visible;
    transition: opacity 0.12s ease;
  }

  .txt.hide {
    opacity: 0;
  }

  .tline {
    white-space: pre;
  }

  /* 叠在画布上的输入框：位置和字号按 zoom 手工换算，不用 CSS 缩放，
     避免 Safari 在 transform: scale 下把光标和字形对错 */
  .text-edit {
    position: absolute;
    z-index: 80000;
    box-sizing: border-box;
    margin: 0;
    border: 1px dashed rgba(201, 123, 99, 0.75);
    border-radius: 4px;
    outline: none;
    resize: none;
    overflow: hidden;
    transform-origin: center center;
    font: inherit;
    caret-color: var(--terra);
    -webkit-user-select: text;
    user-select: text;
    touch-action: manipulation;
  }

  .text-done {
    position: absolute;
    z-index: 80001;
    transform: translate(-100%, -100%);
    padding: 4px 10px;
    border-radius: 8px;
    background: var(--ink);
    color: #fff;
    font-size: 12px;
    line-height: 1.4;
    box-shadow: var(--shadow-md);
  }

  .item {
    position: absolute;
    pointer-events: none;
    user-select: none;
    -webkit-user-drag: none;
    transition: transform 0.16s ease;
  }

  .pop,
  .looper,
  .paper,
  .plain {
    width: 100%;
    height: 100%;
  }

  .pop {
    position: relative;
  }

  /* 落下时的弹入：啪地贴上去，约 200ms */
  .pop.on {
    animation: pop-in 200ms cubic-bezier(0.2, 1.4, 0.5, 1);
  }

  .looper {
    position: relative;
    transition: filter 0.16s ease;
  }

  .plain {
    display: block;
    object-fit: contain;
  }

  /* 位图贴纸的纸片外观：白边是 padding 撑出来的，剪边靠上面的 clip-path */
  .paper {
    position: relative;
    background: #fff;
  }

  .photo {
    display: block;
    object-fit: cover;
  }

  .sheen {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.28),
      rgba(255, 255, 255, 0) 42%,
      rgba(58, 51, 44, 0.1)
    );
  }

  /* 循环动效：只动 transform，不碰会触发重排的属性 */
  .looper.m-breath {
    animation: loop-breath 3.2s ease-in-out infinite;
  }

  .looper.m-sway {
    animation: loop-sway 2.6s ease-in-out infinite;
  }

  .looper.m-float {
    animation: loop-float 3.6s ease-in-out infinite;
  }

  @keyframes pop-in {
    0% {
      transform: scale(1.16);
      opacity: 0.45;
    }

    60% {
      transform: scale(0.975);
      opacity: 1;
    }

    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes loop-breath {
    0%,
    100% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.04);
    }
  }

  @keyframes loop-sway {
    0%,
    100% {
      transform: rotate(-2.5deg);
    }

    50% {
      transform: rotate(2.5deg);
    }
  }

  @keyframes loop-float {
    0%,
    100% {
      transform: translateY(-2.5px);
    }

    50% {
      transform: translateY(2.5px);
    }
  }

  /* 删除 / 撤销时的淡出 */
  .item.gone {
    animation: ghost-out 220ms ease forwards;
  }

  @keyframes ghost-out {
    from {
      opacity: 1;
    }

    to {
      opacity: 0;
    }
  }

  /* 动效总开关：立刻安静 */
  .stage.no-motion .item,
  .stage.no-motion .pop,
  .stage.no-motion .looper {
    animation: none !important;
    transition: none !important;
  }

  /* 落点提示：拖拽经过画布时显示十字定位点 */
  .drop-hint {
    position: absolute;
    width: 34px;
    height: 34px;
    margin: -17px 0 0 -17px;
    pointer-events: none;
    z-index: 99999;
    border-radius: 50%;
    border: 1px dashed var(--terra);
    background: rgba(201, 123, 99, 0.14);
  }

  .drop-hint::before,
  .drop-hint::after {
    content: '';
    position: absolute;
    background: var(--terra);
  }

  .drop-hint::before {
    left: 50%;
    top: 5px;
    bottom: 5px;
    width: 1px;
    margin-left: -0.5px;
  }

  .drop-hint::after {
    top: 50%;
    left: 5px;
    right: 5px;
    height: 1px;
    margin-top: -0.5px;
  }

  .sel-box {
    position: absolute;
    border: 1.5px dashed var(--terra);
    pointer-events: none;
  }

  .handle {
    position: absolute;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--terra);
    pointer-events: auto;
    touch-action: none;
    box-shadow: 0 1px 4px rgba(58, 51, 44, 0.2);
  }

  .handle.rotate {
    border-color: var(--sage);
  }

  .grain {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image: radial-gradient(rgba(60, 48, 32, 0.05) 1px, transparent 1px);
    background-size: 3px 3px;
  }
</style>
