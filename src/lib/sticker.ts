import { ASSET_MAP } from './assets'
import type { Item } from './types'
import { stackShadow } from './look'

/**
 * 默认带纸张质感的分类：印章、装饰、开窗、精选、植物，以及素材包里的位图贴纸。
 * 纸纹理不当贴纸用，走纸面底纹。
 */
const STICKER_CATS = new Set(['stamp', 'deco', 'cut', 'pro', 'plant', 'pack'])

/** 刀模白边：四向各来一层 0 模糊的 drop-shadow，绕着不规则轮廓走 */
const CUT_LINE =
  'drop-shadow(1px 1px 0 rgba(255, 255, 255, 0.95)) ' +
  'drop-shadow(-1px 1px 0 rgba(255, 255, 255, 0.95)) ' +
  'drop-shadow(1px -1px 0 rgba(255, 255, 255, 0.95)) ' +
  'drop-shadow(-1px -1px 0 rgba(255, 255, 255, 0.95)) ' +
  'drop-shadow(0 0 1px rgba(255, 255, 255, 0.9))'

/** 静止时的厚度：近影 + 远影两层叠出纸边厚度，不用 box-shadow */
const LAYER_IDLE =
  'drop-shadow(0 1px 1px rgba(58, 51, 44, 0.3)) drop-shadow(0 3px 3px rgba(58, 51, 44, 0.16))'

/** 拿起时：投影变大变远，像纸片真的被抬起来 */
const LAYER_LIFT =
  'drop-shadow(0 5px 2px rgba(58, 51, 44, 0.32)) drop-shadow(0 12px 9px rgba(58, 51, 44, 0.2))'

/** 素材是否按贴纸渲染（白边 + 投影）；未设置时按分类取默认 */
export function stickerOn(item: Item): boolean {
  if (item.sticker !== undefined) return item.sticker
  if (item.asset.startsWith('u')) return false
  const def = ASSET_MAP[item.asset]
  return !!def && STICKER_CATS.has(def.cat)
}

/**
 * 位图 JPG 素材：它是方块的不透明图，白边靠内缩的 padding 撑出来（画在纸片里），
 * 所以不再重复叠刀模白边，只保留厚度与投影。
 */
export function paperOn(item: Item): boolean {
  const def = ASSET_MAP[item.asset]
  return !!def?.paper && stickerOn(item)
}

/** 一个素材元素最终要用的 filter；立体开关关掉时直接 none */
export function itemFilter(item: Item, opts: { depth: boolean; active: boolean }): string {
  if (!opts.depth || !stickerOn(item)) return 'none'
  const parts: string[] = []
  if (!paperOn(item)) parts.push(CUT_LINE)
  parts.push(opts.active ? LAYER_LIFT : LAYER_IDLE)
  if (!opts.active) parts.push(stackShadow(item.id))
  return parts.join(' ')
}
