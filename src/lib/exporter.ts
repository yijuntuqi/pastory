import { ASSET_MAP, assetUrl } from './assets'
import type { Item, PageDoc } from './types'

const MAX_AREA = 16777216

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('素材加载失败'))
    img.src = src
  })
}

function paintBg(ctx: CanvasRenderingContext2D, page: PageDoc, scale: number) {
  const w = page.width
  const h = page.height
  ctx.fillStyle = page.bg.color
  ctx.fillRect(0, 0, w, h)
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

export async function exportPNG(page: PageDoc, want = 2): Promise<Blob> {
  const scale = fitScale(page, want)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(page.width * scale)
  canvas.height = Math.round(page.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')

  paintBg(ctx, page, scale)

  const used = Array.from(new Set(page.items.map((i) => i.asset)))
  const loaded = await Promise.all(
    used.map(async (id) => {
      const def = ASSET_MAP[id]
      if (!def) return null
      const img = await loadImage(assetUrl(def))
      return [id, img] as const
    }),
  )
  const imgs = new Map(loaded.filter(Boolean) as [string, HTMLImageElement][])

  const sorted = [...page.items].sort((a, b) => a.z - b.z)
  for (const item of sorted) {
    const img = imgs.get(item.asset)
    if (!img) continue
    ctx.save()
    ctx.globalAlpha = item.opacity ?? 1
    ctx.translate(item.x * scale, item.y * scale)
    ctx.rotate((item.rot * Math.PI) / 180)
    const w = item.w * scale
    const h = item.h * scale
    if (item.flip) {
      ctx.scale(-1, 1)
    }
    ctx.drawImage(img, -w / 2, -h / 2, w, h)
    ctx.restore()
  }

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
