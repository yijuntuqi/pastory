/**
 * 文字的排版与绘制。
 *
 * 关键约束：屏幕上看到的和导出 PNG 出来的必须一模一样。
 * 做法是「同一套排版数据喂两个渲染器」：
 * - 用一块离屏 canvas 测宽，贪心断行，得到 lines[]；
 * - 屏幕端把 lines[] 逐行渲染成独立的一行（不再让浏览器自己折行）；
 * - 导出端用同一组 lines[] 和同一个 canvas 字体去画。
 * 这样两边不会因为断行算法不同而错位。字距一律手工算推进量（不用 ctx.letterSpacing），
 * 保证各浏览器一致。
 */
import { fontFamily } from './fonts'
import type { Item, TextAlign } from './types'

export const TEXT_MIN_W = 80
export const TEXT_MAX_W = 1800
export const DEFAULT_TEXT_W = 320
export const DEFAULT_SIZE = 44

export interface TextLayout {
  lines: string[]
  /** 行高（页面像素） */
  lineH: number
  /** 文本框宽（页面像素） */
  w: number
  /** 文本框高（页面像素） */
  h: number
  padX: number
  padY: number
}

let mcanvas: HTMLCanvasElement | null = null

function measureCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  if (!mcanvas) mcanvas = document.createElement('canvas')
  return mcanvas.getContext('2d')
}

/** 这个文字项在 canvas 里对应的 font 简写 */
export function cssFontOf(item: Item): string {
  const style = item.italic ? 'italic ' : ''
  const weight = item.bold ? '700 ' : '400 '
  const size = item.size ?? DEFAULT_SIZE
  return `${style}${weight}${size}px ${fontFamily(item.font)}`
}

/** 屏幕端用的 CSS font-family 值 */
export function cssFamilyOf(item: Item): string {
  return fontFamily(item.font)
}

export function cssShadowOf(item: Item): string {
  if (!item.shadow) return 'none'
  const size = item.size ?? DEFAULT_SIZE
  return `${(size * 0.04).toFixed(2)}px ${(size * 0.06).toFixed(2)}px ${(size * 0.12).toFixed(
    2,
  )}px rgba(58, 51, 44, 0.35)`
}

const WORDISH = /[0-9A-Za-z@#$%&'’\-_+./:;=~!?,]/

/** 把一段文字切成「不可拆的最小单位」：英文单词整块，中文单字 */
function tokensOf(s: string): string[] {
  const out: string[] = []
  let buf = ''
  for (const ch of s) {
    if (WORDISH.test(ch)) {
      buf += ch
      continue
    }
    if (buf) {
      out.push(buf)
      buf = ''
    }
    out.push(ch)
  }
  if (buf) out.push(buf)
  return out
}

/** 贪心断行；超长的单词会按字强制断开 */
export function wrapText(text: string, maxW: number, widthOf: (s: string) => number): string[] {
  const lines: string[] = []
  for (const para of text.split('\n')) {
    if (para === '') {
      lines.push('')
      continue
    }
    let cur = ''
    for (const tok of tokensOf(para)) {
      const next = cur + tok
      if (cur !== '' && widthOf(next) > maxW) {
        lines.push(cur)
        cur = tok
        if (widthOf(tok) > maxW) {
          let piece = ''
          for (const ch of tok) {
            if (piece !== '' && widthOf(piece + ch) > maxW) {
              lines.push(piece)
              piece = ch
            } else {
              piece += ch
            }
          }
          cur = piece
        }
      } else {
        cur = next
      }
    }
    lines.push(cur)
  }
  return lines
}

/** 手工字距下的整行宽度 */
function lineWidth(ctx: CanvasRenderingContext2D | null, s: string, letter: number): number {
  if (!ctx) return [...s].length * 0.6 * 40
  const base = ctx.measureText(s).width
  if (letter === 0) return base
  return base + letter * Math.max(0, [...s].length - 1)
}

const cache = new Map<string, TextLayout>()

/** 排版结果（带缓存）。字体没加载完时先用回退字体的度量，字体到位后清缓存重排。 */
export function layoutOf(item: Item): TextLayout {
  const size = item.size ?? DEFAULT_SIZE
  const lineH = (item.lineH ?? 1.4) * size
  const letter = item.letter ?? 0
  const padX = item.bgColor ? (item.bgPad ?? 14) : 0
  const padY = item.bgColor ? (item.bgPad ?? 14) : 0
  const w = Math.max(TEXT_MIN_W, Math.min(TEXT_MAX_W, item.w))
  const text = item.text ?? ''
  const key = [
    text,
    w,
    size,
    item.font ?? '',
    item.bold ? 1 : 0,
    item.italic ? 1 : 0,
    letter,
    lineH,
    padX,
  ].join('\u0001')
  const hit = cache.get(key)
  if (hit) return hit

  const ctx = measureCtx()
  if (ctx) ctx.font = cssFontOf(item)
  const widthOf = (s: string) => lineWidth(ctx, s, letter)
  const inner = Math.max(16, w - padX * 2)
  const lines = wrapText(text === '' ? ' ' : text, inner, widthOf)
  const h = Math.max(lineH + padY * 2, lines.length * lineH + padY * 2)
  const out: TextLayout = { lines, lineH, w, h, padX, padY }
  if (cache.size > 600) cache.clear()
  cache.set(key, out)
  return out
}

export function textHeight(item: Item): number {
  return layoutOf(item).h
}

/** 字体加载完成后要丢掉旧度量 */
export function clearTextCache(): void {
  cache.clear()
}

function paintLine(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  letter: number,
  stroke: boolean,
): void {
  if (s === '') return
  if (letter === 0) {
    if (stroke) ctx.strokeText(s, x, y)
    else ctx.fillText(s, x, y)
    return
  }
  let cx = x
  for (const ch of s) {
    if (stroke) ctx.strokeText(ch, cx, y)
    else ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + letter
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r)
    return
  }
  const rr = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/**
 * 导出用：把文字项画进画布。
 * 画布的变换是「设备像素」的（和 drawItem 一致），所以这里先把原点搬到
 * 文字框中心、再按 scale 放大，之后所有绘制都用页面像素。
 */
export function drawTextItem(ctx: CanvasRenderingContext2D, item: Item, scale = 1): void {
  const L = layoutOf(item)
  const size = item.size ?? DEFAULT_SIZE
  const letter = item.letter ?? 0
  const align: TextAlign = item.align ?? 'left'
  const color = item.color ?? '#3A332C'
  const bg = item.bgColor

  ctx.save()
  ctx.globalAlpha = item.opacity ?? 1
  ctx.translate(item.x * scale, item.y * scale)
  ctx.rotate((item.rot * Math.PI) / 180)
  ctx.scale(scale, scale)
  if (item.flip) ctx.scale(-1, 1)

  const left = -L.w / 2
  const top = -L.h / 2

  if (bg) {
    roundRect(ctx, left, top, L.w, L.h, Math.min(18, size * 0.32))
    ctx.fillStyle = bg
    ctx.fill()
  }

  ctx.font = cssFontOf(item)
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2

  const innerW = L.w - L.padX * 2
  L.lines.forEach((line, i) => {
    const lw = lineWidth(ctx, line, letter)
    let x = left + L.padX
    if (align === 'center') x = left + L.padX + (innerW - lw) / 2
    else if (align === 'right') x = left + L.padX + (innerW - lw)
    const y = top + L.padY + i * L.lineH

    if (item.shadow) {
      ctx.save()
      ctx.shadowColor = 'rgba(58, 51, 44, 0.35)'
      ctx.shadowBlur = size * 0.12
      ctx.shadowOffsetX = size * 0.04
      ctx.shadowOffsetY = size * 0.06
      ctx.fillStyle = color
      paintLine(ctx, line, x, y, letter, false)
      ctx.restore()
    }

    const sw = item.strokeWidth ?? 0
    if (sw > 0 && item.strokeColor) {
      ctx.lineWidth = sw
      ctx.strokeStyle = item.strokeColor
      paintLine(ctx, line, x, y, letter, true)
    }

    ctx.fillStyle = color
    paintLine(ctx, line, x, y, letter, false)
  })

  ctx.restore()
}

let subsetSet: Set<string> | null = null

/** 文本里有没有落在子集之外的字（用来提示「这些字会用系统字体」） */
export function missingChars(text: string, subset: string): string[] {
  if (!subsetSet) subsetSet = new Set([...subset])
  const set = subsetSet
  const miss = new Set<string>()
  for (const ch of text) {
    if (ch === '\n' || ch === ' ' || ch === '\t') continue
    if (!set.has(ch)) miss.add(ch)
  }
  return [...miss]
}
