import type { BrushId, InkPoint, Stroke } from './types'

export type InkTool = BrushId | 'eraser'

export interface BrushDef {
  id: BrushId
  name: string
  /** 基础线宽（页面像素），实际半宽再乘宽度驱动系数 */
  width: number
  /** 整笔不透明度 */
  alpha: number
  /** 混合模式：马克笔 / 荧光笔 / 涂鸦笔用正片叠底 */
  blend: GlobalCompositeOperation
  /** 是否用「压力（或有压感时真实压力）」调制粗细 */
  pressure: boolean
  /** 收尖程度 0..1，0 表示不收尖 */
  taper: number
  /** 是否叠颗粒（铅笔） */
  grain: boolean
  /** 是否随 Apple Pencil 倾斜变宽（铅笔） */
  tilt: boolean
  /** 手抖幅度基准：沿弧长连续的低频摆动，铅笔最大、钢笔最小 */
  wobble: number
  /** 宽度驱动下限：0.28 表示最细压到基础宽度的 28% */
  floor: number
  /** 涂鸦式手写：起笔略重、收笔出锋 */
  doodle?: boolean
}

export const BRUSHES: BrushDef[] = [
  { id: 'pen', name: '钢笔', width: 3, alpha: 1, blend: 'source-over', pressure: true, taper: 0.9, grain: false, tilt: false, wobble: 0.02, floor: 0.28 },
  { id: 'pencil', name: '铅笔', width: 4.5, alpha: 0.72, blend: 'source-over', pressure: true, taper: 0.75, grain: true, tilt: true, wobble: 0.09, floor: 0.3 },
  { id: 'marker', name: '马克笔', width: 10, alpha: 0.82, blend: 'multiply', pressure: false, taper: 0.2, grain: false, tilt: false, wobble: 0.05, floor: 0.6 },
  { id: 'highlighter', name: '荧光笔', width: 22, alpha: 0.3, blend: 'multiply', pressure: false, taper: 0.06, grain: false, tilt: false, wobble: 0.03, floor: 0.8 },
  { id: 'doodle', name: '涂鸦笔', width: 13, alpha: 0.88, blend: 'multiply', pressure: true, taper: 0.85, grain: false, tilt: true, wobble: 0.08, floor: 0.16, doodle: true },
]

export function brushDef(id: BrushId): BrushDef {
  return BRUSHES.find((b) => b.id === id) ?? BRUSHES[0]
}

/** 常用墨色：黑 / 深灰 / 红 / 蓝 / 绿 / 黄 / 白 */
export const INK_COLORS: string[] = ['#2b2b2b', '#6b6b6b', '#c0392b', '#2f6fb0', '#3f8f5a', '#e0b23a', '#ffffff']

/** 取样最小间距（页面像素），太密会拖慢实时渲染 */
export const MIN_SAMPLE_DIST = 1.6

/**
 * 笔迹手感：由工具条上的「笔迹手感」面板调节，跟其他偏好一起本地保存。
 * 鼠标没有压力，所以这几项是鼠标笔迹「像不像真的笔」的主要开关。
 */
export interface Feel {
  /** 平滑强度 0..100：越大越能去掉鼠标高频抖动 */
  smooth: number
  /** 速度影响强度 0..100：越大「快细慢粗」越明显 */
  speed: number
  /** 手抖幅度 0..100：沿笔画弧长的低频摆动大小 */
  jitter: number
  /** 笔锋倾斜角（度，-45..45）：横画与竖画的粗细差，0 表示不倾斜 */
  nib: number
}

export const DEFAULT_FEEL: Feel = { smooth: 50, speed: 55, jitter: 50, nib: 18 }

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/**
 * 防抖：对采样点做指数平滑。返回每次采样向新点靠拢的比例，
 * 1 表示完全不平滑，越小越平滑（也越「慢半拍」）。
 */
export function smoothAlpha(feel: Feel): number {
  return 1 - clamp01(feel.smooth / 100) * 0.72
}

/** 速度映射的滑动窗口长度（采样点个数） */
const SPEED_WINDOW = 6
/** 一阶滞后系数：越小越「慢半拍」 */
const SPEED_LAG = 0.22

/**
 * 无压感输入（鼠标、普通手指）的宽度映射：
 * 先用滑动窗口平均压一遍高频抖动，再用一阶滞后（指数平滑）压平粗细曲线。
 * 返回 0..1 的宽度驱动值：画得慢线粗，画得快线细。
 */
export function makeSpeedMapper(feel: Feel): (speed: number) => number {
  const influence = clamp01(feel.speed / 100) * 0.72
  const win: number[] = []
  let value = 0.62
  let started = false
  return (speed: number) => {
    win.push(speed)
    if (win.length > SPEED_WINDOW) win.shift()
    let sum = 0
    for (const v of win) sum += v
    const avg = sum / win.length
    const x = Math.max(0, Math.min(1, (avg - 0.12) / 2.3))
    const target = 1 - x * influence
    value = started ? value + (target - value) * SPEED_LAG : target
    started = true
    return clamp01(value)
  }
}

/** 一条笔迹的折线长度（页面像素） */
export function strokeLength(stroke: Stroke): number {
  const pts = stroke.points
  let len = 0
  for (let i = 1; i < pts.length; i += 1) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  }
  return len
}

/** Catmull-Rom 插值 */
function cr(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  )
}

/** 用笔迹 id 得到稳定相位，保证屏幕和导出渲染一致 */
function seedOf(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (((h >>> 0) % 1000) / 1000) * 6.28318
}

/** 低频摆动的主波长（页面像素）：波长固定，短笔画也不会变成高频噪声 */
const WOBBLE_PX = 54

/**
 * 沿弧长的低频摆动：两个低频正弦叠在一起。
 * 只跟弧长有关，不掺高频随机，所以整条笔迹的抖动是连续的、像手写的。
 */
function wobble(s: number, phase: number): number {
  const t = (s / WOBBLE_PX) * Math.PI * 2
  return Math.sin(t + phase) * 0.58 + Math.sin(t * 2.17 + phase * 2.3) * 0.42
}

/** 稳定的伪随机，用于铅笔颗粒 */
function speck(i: number, k: number): number {
  const h = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return h - Math.floor(h)
}

interface Sample {
  x: number
  y: number
  /** 半宽 */
  w: number
}

interface Box {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

interface Shape {
  path: Path2D
  box: Box
  /** 转折处补的圆角（在离屏缓冲里单独填充，保证转折是圆角） */
  caps: { x: number; y: number; r: number }[]
}

/** 把折线点重采样成平滑中线，并把宽度驱动、收尖换算成每个采样点的半宽 */
function sampleStroke(stroke: Stroke, def: BrushDef): Sample[] {
  const pts = stroke.points
  const n = pts.length
  const out: Sample[] = []
  if (n === 0) return out
  const base = Math.max(0.6, stroke.width) / 2

  const widthFactor = (i: number): number => {
    if (!def.pressure) return 1
    return def.floor + (1 - def.floor) * clamp01(pts[i].p)
  }

  // 收尖：长度跟速度、笔画长度都相关；再夹一下，短笔画也不会变成两头尖的香肠
  const total = strokeLength(stroke)
  const avgStep = n > 1 ? total / (n - 1) : 0
  const speedNorm = clamp01((avgStep - MIN_SAMPLE_DIST) / 6)
  let headSpan = def.taper > 0 ? Math.min(0.14, 0.05 + speedNorm * 0.07) : 0
  let tailSpan = def.taper > 0 ? Math.min(0.34, 0.09 + speedNorm * 0.17) : 0
  if (headSpan + tailSpan > 0.8) {
    const k = 0.8 / (headSpan + tailSpan)
    headSpan *= k
    tailSpan *= k
  }

  const taperAt = (f: number): number => {
    if (def.taper <= 0) return 1
    let g = 1
    if (headSpan > 0 && f < headSpan) g = Math.min(g, Math.pow(Math.max(0, f) / headSpan, 0.6))
    if (tailSpan > 0 && 1 - f < tailSpan) g = Math.min(g, Math.pow(Math.max(0, 1 - f) / tailSpan, 0.55))
    return 1 - def.taper * (1 - g)
  }

  // 涂鸦笔：起笔略重（靠近起点的位置鼓一下），收笔靠上面的长收尖出锋
  const pressAt = (f: number): number =>
    def.doodle ? 1 + 0.22 * Math.exp(-Math.pow(f / 0.1, 2)) : 1

  const emit = (x: number, y: number, wf: number, f: number): void => {
    out.push({ x, y, w: Math.max(0.3, base * wf * taperAt(f) * pressAt(f)) })
  }

  if (n === 1) {
    emit(pts[0].x, pts[0].y, widthFactor(0), 0.5)
    return out
  }

  const at = (i: number): InkPoint => pts[i < 0 ? 0 : i > n - 1 ? n - 1 : i]
  for (let i = 0; i < n - 1; i += 1) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    const w1 = widthFactor(i)
    const w2 = widthFactor(i + 1)
    const seg = Math.hypot(p2.x - p1.x, p2.y - p1.y)
    const sub = Math.max(1, Math.min(6, Math.round(seg / 3)))
    for (let s = 0; s < sub; s += 1) {
      const t = s / sub
      emit(
        cr(p0.x, p1.x, p2.x, p3.x, t),
        cr(p0.y, p1.y, p2.y, p3.y, t),
        w1 + (w2 - w1) * t,
        (i + t) / (n - 1),
      )
    }
  }
  emit(pts[n - 1].x, pts[n - 1].y, widthFactor(n - 1), 1)
  return out
}

/**
 * 沿中线按半宽向法线两侧偏移，得到一个闭合填充带（不是描线）。
 * 同时把笔锋（方向 → 宽度）和沿弧长的手抖摆应用上去，并收集转折处的圆角。
 */
function ribbonShape(samples: Sample[], def: BrushDef, seed: number, feel: Feel): Shape {
  const path = new Path2D()
  const caps: { x: number; y: number; r: number }[] = []
  const n = samples.length
  let box: Box = { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  if (n === 0) return { path, box, caps }
  if (n === 1) {
    const r = Math.max(0.3, samples[0].w)
    path.arc(samples[0].x, samples[0].y, r, 0, Math.PI * 2)
    return { path, box: { minX: samples[0].x - r, minY: samples[0].y - r, maxX: samples[0].x + r, maxY: samples[0].y + r }, caps }
  }

  const arc: number[] = new Array<number>(n).fill(0)
  for (let i = 1; i < n; i += 1) {
    arc[i] = arc[i - 1] + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y)
  }

  // 手抖：幅度按笔刷区分（铅笔最大、钢笔最小），整体幅度由「手抖幅度」调节
  const amp = def.wobble * clamp01(feel.jitter / 100) * 2.2
  // 笔锋：笔尖旋转一个角度，横画竖画的粗细就不一样
  const nibRad = (feel.nib / 180) * Math.PI
  const nibK = (Math.abs(feel.nib) / 45) * 0.2

  const left: number[] = []
  const right: number[] = []
  const pts2: { x: number; y: number }[] = []
  let prevDir = 0
  for (let i = 0; i < n; i += 1) {
    const prev = samples[i > 0 ? i - 1 : 0]
    const next = samples[i < n - 1 ? i + 1 : n - 1]
    let dx = next.x - prev.x
    let dy = next.y - prev.y
    const d = Math.hypot(dx, dy) || 1
    dx /= d
    dy /= d
    const nx = -dy
    const ny = dx
    const s = arc[i]
    const dir = Math.atan2(dy, dx)
    const nib = nibK > 0 ? 1 + nibK * (Math.abs(Math.cos(dir - nibRad)) - 0.5) * 2 : 1
    const wl = samples[i].w * (1 + wobble(s, seed) * amp) * nib
    const wr = samples[i].w * (1 + wobble(s, seed + 2.6) * amp) * nib
    left.push(samples[i].x + nx * wl, samples[i].y + ny * wl)
    right.push(samples[i].x - nx * wr, samples[i].y - ny * wr)
    pts2.push({ x: samples[i].x, y: samples[i].y })
    if (i > 0) {
      let dt = dir - prevDir
      while (dt > Math.PI) dt -= Math.PI * 2
      while (dt < -Math.PI) dt += Math.PI * 2
      if (Math.abs(dt) > 0.34) caps.push({ x: samples[i].x, y: samples[i].y, r: Math.max(0.3, Math.min(wl, wr)) })
    }
    prevDir = dir
  }

  path.moveTo(right[0], right[1])
  path.quadraticCurveTo(samples[0].x, samples[0].y, left[0], left[1])
  for (let i = 1; i < n; i += 1) {
    const mx = (left[(i - 1) * 2] + left[i * 2]) / 2
    const my = (left[(i - 1) * 2 + 1] + left[i * 2 + 1]) / 2
    path.quadraticCurveTo(left[(i - 1) * 2], left[(i - 1) * 2 + 1], mx, my)
  }
  path.lineTo(left[(n - 1) * 2], left[(n - 1) * 2 + 1])
  path.quadraticCurveTo(samples[n - 1].x, samples[n - 1].y, right[(n - 1) * 2], right[(n - 1) * 2 + 1])
  for (let i = n - 2; i >= 0; i -= 1) {
    const mx = (right[(i + 1) * 2] + right[i * 2]) / 2
    const my = (right[(i + 1) * 2 + 1] + right[i * 2 + 1]) / 2
    path.quadraticCurveTo(right[(i + 1) * 2], right[(i + 1) * 2 + 1], mx, my)
  }
  path.closePath()

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxW = 0
  for (const p of samples) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
    if (p.w > maxW) maxW = p.w
  }
  const pad = maxW * 3 + 3
  box = { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad }
  return { path, box, caps }
}

function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return hex
  const num = parseInt(m[1], 16)
  const mix = (c: number): number => {
    const t = amount < 0 ? 0 : 255
    return Math.round(c + (t - c) * Math.abs(amount))
  }
  const to2 = (c: number): string => c.toString(16).padStart(2, '0')
  return '#' + to2(mix((num >> 16) & 255)) + to2(mix((num >> 8) & 255)) + to2(mix(num & 255))
}

/** 铅笔画完之后在带内撒颗粒，做出纸笔摩擦的粗糙感 */
function paintGrain(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  samples: Sample[],
  color: string,
  seed: number,
): void {
  const dark = shade(color, -0.28)
  const light = shade(color, 0.4)
  ctx.save()
  ctx.clip(path)
  ctx.globalCompositeOperation = 'source-over'
  let acc = 0
  for (let i = 1; i < samples.length; i += 1) {
    const s = samples[i]
    const prev = samples[i - 1]
    acc += Math.hypot(s.x - prev.x, s.y - prev.y)
    if (acc < 1.9) continue
    acc = 0
    let dx = s.x - prev.x
    let dy = s.y - prev.y
    const d = Math.hypot(dx, dy) || 1
    dx /= d
    dy /= d
    const off = (speck(i, seed + 7.3) - 0.5) * 1.3 * s.w
    const r = 0.45 + speck(i, seed + 3.1) * 0.85
    ctx.globalAlpha = 0.04 + speck(i, seed) * 0.16
    ctx.fillStyle = speck(i, seed + 5.9) > 0.5 ? dark : light
    ctx.fillRect(s.x - dy * off - r, s.y + dx * off - r, r * 2, r * 2)
  }
  ctx.restore()
}

interface Scratch {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

/** 整笔渲染用的离屏缓冲：尺寸跟目标画布一致，跨笔迹复用 */
let scratch: Scratch | null = null

function scratchOf(w: number, h: number): Scratch | null {
  if (typeof document === 'undefined') return null
  if (!scratch || scratch.canvas.width < w || scratch.canvas.height < h) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, w)
    canvas.height = Math.max(1, h)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    scratch = { canvas, ctx }
  }
  return scratch
}

/** 把页面坐标下的包围盒换算成目标画布上的设备像素区域 */
function deviceBox(b: Box, t: DOMMatrix, w: number, h: number): { x: number; y: number; w: number; h: number } {
  const xs: number[] = []
  const ys: number[] = []
  const corners: [number, number][] = [
    [b.minX, b.minY],
    [b.maxX, b.minY],
    [b.minX, b.maxY],
    [b.maxX, b.maxY],
  ]
  for (const [x, y] of corners) {
    xs.push(t.a * x + t.c * y + t.e)
    ys.push(t.b * x + t.d * y + t.f)
  }
  const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 2)
  const y0 = Math.max(0, Math.floor(Math.min(...ys)) - 2)
  const x1 = Math.min(w, Math.ceil(Math.max(...xs)) + 2)
  const y1 = Math.min(h, Math.ceil(Math.max(...ys)) + 2)
  return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) }
}

/**
 * 画单条笔迹：填充带 + 转折圆角 + 可选颗粒。
 *
 * 半透明笔刷（铅笔 / 马克笔 / 荧光笔 / 涂鸦笔）整笔先在离屏缓冲里以
 * 不透明画成一张，最后整体合成一次，所以一笔内部的交叠处不会重复叠色，
 * 不会出现一节一节的色带。
 */
export function paintStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, feel: Feel = DEFAULT_FEEL): void {
  if (stroke.points.length === 0) return
  const def = brushDef(stroke.brush)
  const samples = sampleStroke(stroke, def)
  if (samples.length === 0) return
  const seed = seedOf(stroke.id)
  const shape = ribbonShape(samples, def, seed, feel)

  const s = scratchOf(ctx.canvas.width, ctx.canvas.height)
  if (!s) return
  const box = deviceBox(shape.box, ctx.getTransform(), ctx.canvas.width, ctx.canvas.height)
  const sctx = s.ctx
  sctx.setTransform(1, 0, 0, 1, 0, 0)
  sctx.clearRect(box.x, box.y, box.w, box.h)
  sctx.setTransform(ctx.getTransform())
  sctx.globalAlpha = 1
  sctx.globalCompositeOperation = 'source-over'
  sctx.fillStyle = stroke.color
  sctx.fill(shape.path)
  for (const c of shape.caps) {
    sctx.beginPath()
    sctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
    sctx.fill()
  }
  if (def.grain) paintGrain(sctx, shape.path, samples, stroke.color, seed)
  sctx.setTransform(1, 0, 0, 1, 0, 0)

  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = def.alpha
  ctx.globalCompositeOperation = def.blend
  ctx.drawImage(s.canvas, box.x, box.y, box.w, box.h, box.x, box.y, box.w, box.h)
  ctx.restore()
}

/** 按层序画所有笔迹：荧光笔永远压在其它墨迹下面 */
export function paintInk(ctx: CanvasRenderingContext2D, strokes: Stroke[], feel: Feel = DEFAULT_FEEL): void {
  const under: Stroke[] = []
  const over: Stroke[] = []
  for (const s of strokes) (s.brush === 'highlighter' ? under : over).push(s)
  for (const s of under) paintStroke(ctx, s, feel)
  for (const s of over) paintStroke(ctx, s, feel)
}

/**
 * 把墨迹层渲染到一张独立画布（透明底）。
 * 导出时用它整层贴上去，屏幕与导出的混合结果才一致。
 */
export function inkLayerCanvas(
  strokes: Stroke[],
  width: number,
  height: number,
  scale: number,
  feel: Feel = DEFAULT_FEEL,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    paintInk(ctx, strokes, feel)
  }
  return canvas
}

function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const l2 = dx * dx + dy * dy
  if (l2 === 0) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / l2
  t = t < 0 ? 0 : t > 1 ? 1 : t
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** 橡皮命中判定：点到这条笔迹折线的距离在「半宽 + 容差」内就算点中 */
export function strokeHit(stroke: Stroke, x: number, y: number, tol: number): boolean {
  const pts = stroke.points
  if (pts.length === 0) return false
  const r = stroke.width * 0.5 + tol
  if (pts.length === 1) return Math.hypot(x - pts[0].x, y - pts[0].y) <= r
  for (let i = 1; i < pts.length; i += 1) {
    if (segDist(x, y, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y) <= r) return true
  }
  return false
}
