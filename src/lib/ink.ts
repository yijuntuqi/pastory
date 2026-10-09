import type { BrushId, InkPoint, Stroke } from './types'

export type InkTool = BrushId | 'eraser'

export interface BrushDef {
  id: BrushId
  name: string
  /** 基础线宽（页面像素），实际半宽再乘压力系数 */
  width: number
  /** 整笔不透明度 */
  alpha: number
  /** 混合模式：马克笔 / 荧光笔用正片叠底 */
  blend: GlobalCompositeOperation
  /** 是否用「压力（或速度估算）」调制粗细 */
  pressure: boolean
  /** 起收笔收尖程度 0..1，0 表示不收尖 */
  taper: number
  /** 是否叠颗粒（铅笔） */
  grain: boolean
  /** 是否随 Apple Pencil 倾斜变宽（铅笔） */
  tilt: boolean
}

export const BRUSHES: BrushDef[] = [
  { id: 'pen', name: '钢笔', width: 3, alpha: 1, blend: 'source-over', pressure: true, taper: 0.9, grain: false, tilt: false },
  { id: 'pencil', name: '铅笔', width: 4.5, alpha: 0.72, blend: 'source-over', pressure: true, taper: 0.75, grain: true, tilt: true },
  { id: 'marker', name: '马克笔', width: 10, alpha: 0.82, blend: 'multiply', pressure: false, taper: 0.2, grain: false, tilt: false },
  { id: 'highlighter', name: '荧光笔', width: 22, alpha: 0.3, blend: 'multiply', pressure: false, taper: 0.06, grain: false, tilt: false },
]

export function brushDef(id: BrushId): BrushDef {
  return BRUSHES.find((b) => b.id === id) ?? BRUSHES[0]
}

/** 常用墨色：黑 / 深灰 / 红 / 蓝 / 绿 / 黄 / 白 */
export const INK_COLORS: string[] = ['#2b2b2b', '#6b6b6b', '#c0392b', '#2f6fb0', '#3f8f5a', '#e0b23a', '#ffffff']

/** 取样最小间距（页面像素），太密会拖慢实时渲染 */
export const MIN_SAMPLE_DIST = 1.6

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/**
 * 无压感输入（鼠标、普通手指）的速度兜底：画得快线细、画得慢线粗。
 * 返回 0..1 的宽度驱动值，并用指数平滑避免抖动。
 */
export function speedToPressure(speed: number, prev: number): number {
  const x = Math.max(0, Math.min(1, (speed - 0.15) / 2.35))
  const target = 1 - x * 0.7
  return prev + (target - prev) * 0.35
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

/** 低频噪声：给边缘一点手抖的不齐感，幅度小、频率低 */
function wobble(t: number, phase: number): number {
  return Math.sin(t * 9.1 + phase) * 0.55 + Math.sin(t * 20.7 + phase * 2.3) * 0.45
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

/** 把折线点重采样成平滑中线，并把压力、收尖换算成每个采样点的半宽 */
function sampleStroke(stroke: Stroke, def: BrushDef): Sample[] {
  const pts = stroke.points
  const n = pts.length
  const out: Sample[] = []
  if (n === 0) return out
  const base = Math.max(0.6, stroke.width) / 2

  const widthFactor = (i: number): number => (def.pressure ? 0.22 + 0.78 * clamp01(pts[i].p) : 1)

  const taperAt = (f: number): number => {
    if (def.taper <= 0) return 1
    const span = 0.14
    const edge = Math.min(f, 1 - f)
    if (edge >= span) return 1
    return 1 - def.taper * (1 - edge / span)
  }

  const emit = (x: number, y: number, wf: number, f: number): void => {
    out.push({ x, y, w: Math.max(0.3, base * wf * taperAt(f)) })
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

/** 沿中线按半宽向法线两侧偏移，得到一个闭合填充带（不是描线） */
function ribbonPath(samples: Sample[], def: BrushDef, seed: number): Path2D {
  const path = new Path2D()
  const n = samples.length
  if (n === 0) return path
  if (n === 1) {
    path.arc(samples[0].x, samples[0].y, Math.max(0.3, samples[0].w), 0, Math.PI * 2)
    return path
  }

  const arc: number[] = new Array<number>(n).fill(0)
  for (let i = 1; i < n; i += 1) {
    arc[i] = arc[i - 1] + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y)
  }
  const len = arc[n - 1] || 1
  const amp = def.grain ? 0.16 : 0.12

  const left: number[] = []
  const right: number[] = []
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
    const t = arc[i] / len
    const wl = samples[i].w * (1 + wobble(t, seed) * amp)
    const wr = samples[i].w * (1 + wobble(t, seed + 2.6) * amp)
    left.push(samples[i].x + nx * wl, samples[i].y + ny * wl)
    right.push(samples[i].x - nx * wr, samples[i].y - ny * wr)
  }

  path.moveTo(right[0], right[1])
  path.quadraticCurveTo(samples[0].x, samples[0].y, left[0], left[1])
  // 左侧正向：用二次贝塞尔穿过相邻点中点，避免折角
  for (let i = 1; i < n; i += 1) {
    const mx = (left[(i - 1) * 2] + left[i * 2]) / 2
    const my = (left[(i - 1) * 2 + 1] + left[i * 2 + 1]) / 2
    path.quadraticCurveTo(left[(i - 1) * 2], left[(i - 1) * 2 + 1], mx, my)
  }
  path.lineTo(left[(n - 1) * 2], left[(n - 1) * 2 + 1])
  // 末端收尖
  path.quadraticCurveTo(samples[n - 1].x, samples[n - 1].y, right[(n - 1) * 2], right[(n - 1) * 2 + 1])
  // 右侧反向回到起点
  for (let i = n - 2; i >= 0; i -= 1) {
    const mx = (right[(i + 1) * 2] + right[i * 2]) / 2
    const my = (right[(i + 1) * 2 + 1] + right[i * 2 + 1]) / 2
    path.quadraticCurveTo(right[(i + 1) * 2], right[(i + 1) * 2 + 1], mx, my)
  }
  path.closePath()
  return path
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

/** 画单条笔迹：填充带 + 可选颗粒 */
export function paintStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  if (stroke.points.length === 0) return
  const def = brushDef(stroke.brush)
  const samples = sampleStroke(stroke, def)
  if (samples.length === 0) return
  const seed = seedOf(stroke.id)
  const path = ribbonPath(samples, def, seed)

  ctx.save()
  ctx.globalAlpha = def.alpha
  ctx.globalCompositeOperation = def.blend
  ctx.fillStyle = stroke.color
  ctx.fill(path)
  ctx.restore()

  if (def.grain) paintGrain(ctx, path, samples, stroke.color, seed)
}

/** 按层序画所有笔迹：荧光笔永远压在其它墨迹下面 */
export function paintInk(ctx: CanvasRenderingContext2D, strokes: Stroke[]): void {
  const under: Stroke[] = []
  const over: Stroke[] = []
  for (const s of strokes) (s.brush === 'highlighter' ? under : over).push(s)
  for (const s of under) paintStroke(ctx, s)
  for (const s of over) paintStroke(ctx, s)
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
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    paintInk(ctx, strokes)
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
