import { assetUrl, type AssetDef } from './assets'

/**
 * 素材包原始目录与缩略图目录的 URL 片段。
 * 原始 URL 是 encodeURI 过的，这里先解码再替换，避免维护一串百分号编码。
 */
const PACK_SRC_MARKER = '/手账素材包/手账素材包/'
const PACK_THUMB_PREFIX = '/手账素材包/thumbs/'

/**
 * 把素材包位图的 URL 换成构建期生成的缩略图 URL（scripts/make-thumbs.mjs 产出，
 * 长边 160px，与源文件同名同后缀）。不是素材包位图（内联 SVG、用户导入图）返回 null，
 * 调用方继续用原图。
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
  return encodeURI(decoded.replace(PACK_SRC_MARKER, PACK_THUMB_PREFIX))
}

/** 素材栏用的缩略图地址；没有缩略图就退回原图。 */
export function assetThumb(a: AssetDef): string {
  return thumbUrl(a.src) ?? assetUrl(a)
}