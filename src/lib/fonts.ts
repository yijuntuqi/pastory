/**
 * 文字工具可用的字体。
 *
 * 挑选依据是项目里的《手账素材来源清单》第 2 节「可免费商用的中文字体」：
 * 只收清单里明确写了「可商用 + 可嵌入网页产品」的字体，授权全部是 SIL OFL 1.1。
 * 每个字体都被裁成子集（GB2312 一级常用字 + 标点 + 数字 + 英文字母），产出 woff2，
 * 放在 public/fonts/ 下，随包分发。字号以外的信息见 FONTS 里的 note 字段。
 *
 * 体积硬约束：首屏不加载任何字体。只有用户真的选到某个字体（或导出用到它）时，
 * 才用 FontFace 去 fetch 对应的 woff2，因此首屏速度不受字体影响。
 */

import { withBase } from './base'

export type FontId = 'wenkai' | 'kuaile' | 'serif' | 'sans' | 'smiley' | 'qingke'

export type FontTier = 'hand' | 'doodle' | 'serif' | 'sans' | 'title'

export const FONT_TIERS: { id: FontTier; name: string }[] = [
  { id: 'hand', name: '手写' },
  { id: 'doodle', name: '涂鸦' },
  { id: 'serif', name: '宋体' },
  { id: 'sans', name: '黑体' },
  { id: 'title', name: '标题' },
]

export interface FontDef {
  id: FontId
  /** 面板里显示的名字 */
  name: string
  tier: FontTier
  /** CSS 里用的家族名，加前缀避免和系统字体重名 */
  family: string
  /** 子集 woff2 的路径（public 下） */
  file: string
  weight: number
  /** 授权类型 */
  license: string
  /** 来源 */
  source: string
  /** 出处与注意事项 */
  note: string
}

export const FONTS: FontDef[] = [
  {
    id: 'wenkai',
    name: '霞鹜文楷',
    tier: 'hand',
    family: 'Pastory WenKai',
    file: '/fonts/lxgw-wenkai.woff2',
    weight: 400,
    license: 'SIL OFL 1.1',
    source: 'lxgw/LxgwWenKai v1.520（GitHub）',
    note: '手写正文体，基于 Klee One。允许嵌入与随包分发；不得单独售卖；保留字体名 LXGW WenKai。',
  },
  {
    id: 'kuaile',
    name: '站酷快乐体',
    tier: 'doodle',
    family: 'Pastory KuaiLe',
    file: '/fonts/zcool-kuaile.woff2',
    weight: 400,
    license: 'SIL OFL 1.1',
    source: 'Google Fonts，ofl/zcoolkuaile',
    note: '圆润涂鸦感，适合标题、便签和随手写的字。',
  },
  {
    id: 'serif',
    name: '思源宋体',
    tier: 'serif',
    family: 'Pastory Serif SC',
    file: '/fonts/noto-serif-sc.woff2',
    weight: 400,
    license: 'SIL OFL 1.1',
    source: 'Google Fonts，ofl/notoserifsc（Noto Serif SC）',
    note: '宋体，文艺排版与摘抄用。变量字体在子集化时把字重固定到 400。',
  },
  {
    id: 'sans',
    name: '思源黑体',
    tier: 'sans',
    family: 'Pastory Sans SC',
    file: '/fonts/noto-sans-sc.woff2',
    weight: 400,
    license: 'SIL OFL 1.1',
    source: 'Google Fonts，ofl/notosanssc（Noto Sans SC）',
    note: '黑体，信息类正文与清单用。变量字体在子集化时把字重固定到 400。',
  },
  {
    id: 'smiley',
    name: '得意黑',
    tier: 'title',
    family: 'Pastory Smiley',
    file: '/fonts/smiley-sans.woff2',
    weight: 400,
    license: 'SIL OFL 1.1',
    source: 'atelier-anchor/smiley-sans v2.0.1（GitHub Release）',
    note: '斜体美术标题字。保留字体名 Smiley / 得意黑，不得单独售卖。',
  },
  {
    id: 'qingke',
    name: '站酷庆科黄油体',
    tier: 'title',
    family: 'Pastory QingKe',
    file: '/fonts/zcool-qingke.woff2',
    weight: 400,
    license: 'SIL OFL 1.1',
    source: 'Google Fonts，ofl/zcoolqingkehuangyou',
    note: '标题体，笔画圆润偏粗，适合大标题。',
  },
]

export const FONT_MAP: Record<string, FontDef> = Object.fromEntries(
  FONTS.map((f) => [f.id, f]),
)

/** 新文字框默认用的字体 */
export const DEFAULT_FONT: FontId = 'wenkai'

/** 子集里没有的字会自动落到这套系统字体上，保证不漏字 */
export const FONT_FALLBACK =
  "'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Noto Sans CJK SC',system-ui,sans-serif"

export function fontDef(id?: string | null): FontDef | undefined {
  return id ? FONT_MAP[id] : undefined
}

/** 生成 CSS / canvas 用的 font-family 值（自带系统字体兜底） */
export function fontFamily(id?: string | null): string {
  const def = fontDef(id)
  return def ? `'${def.family}', ${FONT_FALLBACK}` : FONT_FALLBACK
}

/** 字体所属档次的中文名 */
export function tierName(t: FontTier): string {
  return FONT_TIERS.find((x) => x.id === t)?.name ?? ''
}

const faces = new Map<FontId, FontFace>()
const inflight = new Map<FontId, Promise<void>>()

export function isFontLoaded(id: FontId): boolean {
  return faces.has(id)
}

/**
 * 按需加载一个字体：只有这里被调用时才会去 fetch 那个 woff2。
 * 加载失败时静默退回系统字体，不影响使用。
 */
export function ensureFont(id: FontId): Promise<void> {
  if (faces.has(id)) return Promise.resolve()
  const running = inflight.get(id)
  if (running) return running
  const def = FONT_MAP[id]
  if (!def || typeof document === 'undefined' || typeof FontFace === 'undefined') {
    return Promise.resolve()
  }
  const job = (async () => {
    try {
      const face = new FontFace(def.family, `url('${withBase(def.file)}')`, {
        weight: String(def.weight),
        style: 'normal',
        display: 'swap',
      })
      await face.load()
      document.fonts.add(face)
      faces.set(id, face)
    } catch {
      /* 字体没加载上就退回系统字体 */
    } finally {
      inflight.delete(id)
    }
  })()
  inflight.set(id, job)
  return job
}

/** 批量加载（导出前把所有用到的字体都等出来） */
export async function ensureFonts(ids: Iterable<FontId | undefined>): Promise<void> {
  const list = [...new Set([...ids].filter(Boolean) as FontId[])]
  await Promise.all(list.map((id) => ensureFont(id)))
}
