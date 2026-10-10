import { itemSrc } from './user-assets.svelte'
import { withBase } from './base'
import { settings } from './settings.svelte'
import { PAPER_TEX_ALPHA, paperEdge, paperOutline } from './look'
import { paperOn } from './sticker'
import { inkLayerCanvas } from './ink'
import { drawTextItem } from './text'
import { ensureFonts } from './fonts'
import { isText, type Item, type PageDoc } from './types'

const MAX_AREA = 16777216

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('素材加载失败'))
    img.src = src
  })
}

/** 底纹按 cover 铺满，和 DOM 里 background-size: cover 保持一致 */
function cover(iw: number, ih: number, w: number, h: number) {
  const s = Math.max(w / iw, h / ih)
  const dw = iw * s
  const dh = ih * s
  return { x: (w - dw) / 2, y: (h - dh) / 2, w: dw, h: dh }
}

/** 背景在页面坐标系里画，外层统一 scale，所以各种底纹的间距不会跑偏 */
export function paintBg(ctx: CanvasRenderingContext2D, page: PageDoc, tex: HTMLImageElement | null) {
  const w = page.width
  const h = page.height
  ctx.fillStyle = page.bg.color
  ctx.fillRect(0, 0, w, h)

  if (tex && tex.naturalWidth) {
    const r = cover(tex.naturalWidth, tex.naturalHeight, w, h)
    ctx.save()
    ctx.globalAlpha = PAPER_TEX_ALPHA
    ctx.drawImage(tex, r.x, r.y, r.w, r.h)
    ctx.restore()
  }

  ctx.save()
  ctx.strokeStyle = '#D6CBB8'
  ctx.fillStyle = '#D6CBB8'
  if (page.bg.type === 'dots') {
    for (let y = 24; y < h; y += 32) {
      for (let x = 24; x < w; x += 32) {
        ctx.beginPath()
        ctx.arc(x, y, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else if (page.bg.type === 'grid') {
    ctx.lineWidth = 1
    for (let x = 0; x <= w; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y <= h; y += 32) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  } else if (page.bg.type === 'lined') {
    ctx.lineWidth = 1
    for (let y = 48; y < h; y += 36) {
      ctx.beginPath()
      ctx.moveTo(24, y)
      ctx.lineTo(w - 24, y)
      ctx.stroke()
    }
  }
  ctx.restore()
}

export function fitScale(page: PageDoc, want: number): number {
  let s = want
  while (page.width * page.height * s * s > MAX_AREA && s > 0.5) {
    s -= 0.5
  }
  return Math.max(0.5, s)
}

/** 和屏幕上的 clip-path 用同一组点，只是换算成 canvas 坐标 */
function paperPath(seed: string, w: number, h: number): Path2D {
  const path = new Path2D()
  paperOutline(seed).forEach(([x, y], i) => {
    const px = -w / 2 + x * w
    const py = -h / 2 + y * h
    if (i === 0) path.moveTo(px, py)
    else path.lineTo(px, py)
  })
  path.closePath()
  return path
}

/** 动效导出的逐帧偏移：dx/dy 单位页面像素，drot 单位度，dscale 是额外缩放 */
export interface ItemAnim {
  dx?: number
  dy?: number
  drot?: number
  dscale?: number
}

export function drawItem(
  ctx: CanvasRenderingContext2D,
  item: Item,
  img: HTMLImageElement,
  scale: number,
  anim?: ItemAnim,
) {
  const w = item.w * scale
  const h = item.h * scale
  ctx.save()
  ctx.globalAlpha = item.opacity ?? 1
  ctx.translate((item.x + (anim?.dx ?? 0)) * scale, (item.y + (anim?.dy ?? 0)) * scale)
  ctx.rotate(((item.rot + (anim?.drot ?? 0)) * Math.PI) / 180)
  if (anim?.dscale && anim.dscale !== 1) ctx.scale(anim.dscale, anim.dscale)
  if (item.flip) ctx.scale(-1, 1)

  if (settings.depth && paperOn(item)) {
    // 纸质外观：先铺一张带投影的白纸，再把图片按白边内缩贴上去
    const pad = paperEdge(item.w, item.h) * scale
    const path = paperPath(item.id, w, h)
    ctx.save()
    ctx.shadowColor = 'rgba(58, 51, 44, 0.32)'
    ctx.shadowBlur = 3 * scale
    ctx.shadowOffsetY = 2 * scale
    ctx.fillStyle = '#fff'
    ctx.fill(path)
    ctx.restore()
    ctx.save()
    ctx.clip(path)
    ctx.drawImage(img, -w / 2 + pad, -h / 2 + pad, w - pad * 2, h - pad * 2)
    const sheen = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2)
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.28)')
    sheen.addColorStop(0.42, 'rgba(255, 255, 255, 0)')
    sheen.addColorStop(1, 'rgba(58, 51, 44, 0.1)')
    ctx.fillStyle = sheen
    ctx.fill(path)
    ctx.restore()
  } else {
    // SVG / 透明 PNG / 用户图片：轮廓自己去 alpha，不要白纸底
    ctx.drawImage(img, -w / 2, -h / 2, w, h)
  }
  ctx.restore()
}

export async function exportPNG(page: PageDoc, want = 2): Promise<Blob> {
  // 先把用到的字体等出来，否则导出图会掉字或变成系统字体（屏幕和导出就不一致了）
  await ensureFonts(page.items.filter(isText).map((i) => i.font))
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready
  } catch {
    /* fonts.ready 不可用就跳过，ensureFonts 已经保证用到的字体加载完成 */
  }

  const scale = fitScale(page, want)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(page.width * scale)
  canvas.height = Math.round(page.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')

  let tex: HTMLImageElement | null = null
  if (page.bg.tex) {
    try {
      tex = await loadImage(withBase(page.bg.tex))
    } catch {
      tex = null
    }
  }

  ctx.save()
  ctx.scale(scale, scale)
  paintBg(ctx, page, tex)
  ctx.restore()

  // 墨迹层：先单独渲染到一张透明画布再整层贴上，这样屏幕和导出的混合结果一致
  const inkLayer =
    page.strokes.length > 0 ? inkLayerCanvas(page.strokes, page.width, page.height, scale, settings.feel) : null
  if (inkLayer && !page.inkTop) ctx.drawImage(inkLayer, 0, 0)

  const used = Array.from(new Set(page.items.map((i) => i.asset)))
  const loaded = await Promise.all(
    used.map(async (id) => {
      const src = itemSrc(id)
      if (!src) return null
      try {
        return [id, await loadImage(src)] as const
      } catch {
        return null
      }
    }),
  )
  const imgs = new Map(loaded.filter(Boolean) as [string, HTMLImageElement][])

  const sorted = [...page.items].sort((a, b) => a.z - b.z)
  for (const item of sorted) {
    if (isText(item)) {
      drawTextItem(ctx, item, scale)
      continue
    }
    const img = imgs.get(item.asset)
    if (!img) continue
    drawItem(ctx, item, img, scale)
  }

  if (inkLayer && page.inkTop) ctx.drawImage(inkLayer, 0, 0)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('导出失败'))
    }, 'image/png')
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
