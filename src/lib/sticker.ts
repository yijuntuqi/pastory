import { ASSET_MAP } from './assets'
import type { Item } from './types'

/**
 * 默认带「贴纸感」外观的分类：印章、装饰、开窗、精选、植物。
 * 纸胶带（半透明）、便签、边框保持平面，需要时可在属性区单独打开。
 */
const STICKER_CATS = new Set(['stamp', 'deco', 'cut', 'pro', 'plant'])

/** 贴纸感 = 一圈半透明白边（白边刀模）+ 轻微下投影 */
export const STICKER_FILTER =
  'drop-shadow(1px 1px 0 rgba(255, 255, 255, 0.95)) ' +
  'drop-shadow(-1px 1px 0 rgba(255, 255, 255, 0.95)) ' +
  'drop-shadow(1px -1px 0 rgba(255, 255, 255, 0.95)) ' +
  'drop-shadow(-1px -1px 0 rgba(255, 255, 255, 0.95)) ' +
  'drop-shadow(0 0 1px rgba(255, 255, 255, 0.9)) ' +
  'drop-shadow(0 3px 2px rgba(58, 51, 44, 0.3))'

/** 单个素材是否开启贴纸感：显式设置优先，否则按分类取默认 */
export function stickerOn(item: Item): boolean {
  if (item.sticker !== undefined) return item.sticker
  if (item.asset.startsWith('u')) return false
  const def = ASSET_MAP[item.asset]
  return !!def && STICKER_CATS.has(def.cat)
}

export function stickerFilter(item: Item): string {
  return stickerOn(item) ? STICKER_FILTER : 'none'
}
