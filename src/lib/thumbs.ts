import { assetUrl, type AssetDef } from './assets'
import { withBase } from './base'
import { THUMBS } from './thumbs-manifest'

/**
 * 素材包原始目录与缩略图目录的 URL 片段。
 * 原始 URL 是 encodeURI 过的，这里先解码再替换，避免维护一串百分号编码。
 */
const PACK_SRC_MARKER = '/手账素材包/手账素材包/'
const PACK_THUMB_PREFIX = '/手账素材包/thumbs/'

/**
 * 把素材包位图的 URL 换成构建期生成的缩略图 URL（scripts/make-thumbs.mjs 产出，
 * 长边 160px，与源文件同名同后缀）。
 *
 * 只有「清单里真的存在」的缩略图才会被用上，因此：
 * - 缩略图还没生成（没跑过 npm run thumbs）时，这里统一返回 null，调用方用原图，不会 404；
 * - 素材包新增了文件但缩略图没跟上，那个文件自动走原图，不会半新半旧。
 * 不是素材包位图（内联 SVG、用户导入图）同样返回 null。
 */
export function thumbUrl(src: string | undefined | null): string | null {
  if (!src) return null
  let decoded: string
  try {
    decoded = decodeURI(src)
  } catch {
    return null
  }
  if (!decoded.includes(PACK_SRC_MARKER)) return null
  const thumb = decoded.replace(PACK_SRC_MARKER, PACK_THUMB_PREFIX)
  if (!THUMBS.has(thumb)) return null
  return withBase(encodeURI(thumb))
}

/** 素材栏用的缩略图地址；没有缩略图就退回原图。 */
export function assetThumb(a: AssetDef): string {
  return thumbUrl(a.src) ?? assetUrl(a)
}
