/**
 * 动效导出（基础版）：canvas.captureStream + MediaRecorder 录一段 3~5 秒的循环视频。
 *
 * 做法：
 * - 把页面按逐帧重绘到一张离屏 canvas 上，动效来自元素自身的 loop（呼吸 / 摇摆 / 漂浮），
 *   相位取「已播时长 / 总时长」，而这些函数是周期函数，所以视频首尾天然接得上、能无缝循环；
 * - captureStream(fps) 把这张 canvas 变成视频源，MediaRecorder 录下来；
 * - 优先要 MP4（video/mp4 + H.264），浏览器不支持就退到 WebM，并把这个事实回报给界面。
 *
 * 静态 PNG 导出完全不受影响，走的是 exporter.ts 里那条老路径。
 */
import { itemSrc } from './user-assets.svelte'
import { settings } from './settings.svelte'
import { inkLayerCanvas } from './ink'
import { drawTextItem } from './text'
import { ensureFonts } from './fonts'
import { isText, type Item, type PageDoc } from './types'
import { withBase } from './base'
import { drawItem, loadImage, paintBg, type ItemAnim } from './exporter'

/** 视频默认时长（秒），限定在 3~5 秒之间 */
export const VIDEO_MIN_SECS = 3
export const VIDEO_MAX_SECS = 5

const MIME_CANDIDATES = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4;codecs=h264',
  'video/mp4',
  'video/webm;codecs=h264',
  'video/webm;codecs=vp9',
  'video/webm',
]

/** 挑一个当前浏览器真的支持的录制格式；MP4 优先 */
export function pickVideoMime(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  for (const m of MIME_CANDIDATES) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m
    } catch {
      /* 有的浏览器对畸形 mime 会抛，忽略 */
    }
  }
  return ''
}

export function videoExtOf(mime: string): 'mp4' | 'webm' {
  return mime.includes('mp4') ? 'mp4' : 'webm'
}

/**
 * 有没有「动效 WebP」的能力。
 * 结论：至今 WebCodecs 没有动效 WebP 的编码器（它只有图片解码和 av1 / h264 / vp8 / vp9 等视频编码），
 * 所以这一版不做动效 WebP；这里留一个明确的探测点，将来浏览器支持了再打开。
 */
export async function canEncodeAnimatedWebp(): Promise<boolean> {
  const VE = (globalThis as { VideoEncoder?: { isConfigSupported(c: unknown): Promise<{ supported?: boolean }> } })
    .VideoEncoder
  if (!VE) return false
  try {
    const r = await VE.isConfigSupported({ codec: 'webp', width: 64, height: 64 })
    return r.supported === true
  } catch {
    return false
  }
}

/** 元素循环动效在某个相位（0..1）下的偏移量，和屏幕上的 CSS 动画是一套感觉 */
function loopAnim(item: Item, phase: number): ItemAnim {
  if (!item.loop) return {}
  const t = phase * Math.PI * 2
  if (item.loop === 'breath') return { dscale: 1 + 0.035 * Math.sin(t) }
  if (item.loop === 'sway') return { drot: 2.6 * Math.sin(t) }
  return { dy: 8 * Math.sin(t) }
}

export interface VideoResult {
  blob: Blob
  mime: string
  ext: 'mp4' | 'webm'
}

export interface VideoOptions {
  /** 时长（秒），会被夹到 3~5 */
  duration?: number
  /** 渲染倍率，默认 1x（视频用 1x 桌面和手机都稳） */
  scale?: number
  fps?: number
  onProgress?: (p: number) => void
}

export async function exportVideo(page: PageDoc, opts: VideoOptions = {}): Promise<VideoResult> {
  const duration = Math.min(VIDEO_MAX_SECS, Math.max(VIDEO_MIN_SECS, opts.duration ?? 4))
  const scale = opts.scale ?? 1
  const fps = opts.fps ?? 30

  const mime = pickVideoMime()
  if (!mime) throw new Error('这个浏览器不支持视频录制，导出 MP4 需要 Chrome / Edge / Safari 的较新版本')

  await ensureFonts(page.items.filter(isText).map((i) => i.font))
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready
  } catch {
    /* fonts.ready 不可用就跳过 */
  }

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
  const inkLayer =
    page.strokes.length > 0
      ? inkLayerCanvas(page.strokes, page.width, page.height, scale, settings.feel)
      : null

  const drawFrame = (phase: number) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(scale, scale)
    paintBg(ctx, page, tex)
    ctx.restore()

    if (inkLayer && !page.inkTop) ctx.drawImage(inkLayer, 0, 0)

    const sorted = [...page.items].sort((a, b) => a.z - b.z)
    for (const item of sorted) {
      if (isText(item)) {
        drawTextItem(ctx, item, scale)
        continue
      }
      const img = imgs.get(item.asset)
      if (!img) continue
      drawItem(ctx, item, img, scale, loopAnim(item, phase))
    }

    if (inkLayer && page.inkTop) ctx.drawImage(inkLayer, 0, 0)
  }

  // 先画第一帧，保证 captureStream 一开始就有内容
  drawFrame(0)

  const stream = canvas.captureStream(fps)
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 })
  const chunks: BlobPart[] = []
  rec.ondataavailable = (e: BlobEvent) => {
    if (e.data && e.data.size > 0) chunks.push(e.data)
  }
  const stopped = new Promise<void>((resolve, reject) => {
    rec.onstop = () => resolve()
    rec.onerror = () => reject(new Error('录制失败'))
  })

  rec.start(200)
  const t0 = performance.now()
  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - t0
      const p = Math.min(1, elapsed / (duration * 1000))
      drawFrame(p)
      opts.onProgress?.(p)
      if (p >= 1) {
        resolve()
        return
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  // 让最后一帧也进到流里，再收尾
  await new Promise((r) => setTimeout(r, 150))
  rec.stop()
  stream.getTracks().forEach((t) => t.stop())
  await stopped

  return { blob: new Blob(chunks, { type: mime.split(';')[0] }), mime, ext: videoExtOf(mime) }
}
