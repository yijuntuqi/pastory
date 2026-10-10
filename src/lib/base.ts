/**
 * 部署基路径工具。
 *
 * 同一份源码要同时跑在三种地方：
 * - 根路径（Netlify / Cloudflare Pages / 本地 preview / 自有域名）；
 * - GitHub Pages 的项目站点子路径（https://<user>.github.io/<repo>/）。
 *
 * 子路径下，所有以 '/' 开头的资源（素材包图片、字体、缩略图、底纹）都必须带上基路径，
 * 否则会去域名根目录找文件，全部 404。BASE 由 vite 的 base 注入，
 * 默认 '/'，发布 GitHub Pages 时用环境变量 VITE_BASE=/<repo>/ 覆盖。
 */
export const BASE: string = import.meta.env.BASE_URL || '/'

/** 给以 '/' 开头的站内路径补上基路径；外链、data:、blob:、相对路径原样返回 */
export function withBase(p: string | undefined | null): string {
  if (!p) return ''
  if (/^(?:[a-z]+:|\/\/)/i.test(p)) return p
  if (!p.startsWith('/')) return p
  return BASE.replace(/\/+$/, '') + p
}
