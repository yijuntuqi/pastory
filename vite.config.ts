import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

/**
 * 部署基路径。
 * - 默认 '/'：本地预览、Netlify、Cloudflare Pages、自有域名都跑在根路径；
 * - GitHub Pages 的项目站点跑在 https://<user>.github.io/<repo>/ 这个子路径下，
 *   发布时由 .github/workflows/pages.yml 用环境变量 VITE_BASE 传进来。
 * 结尾统一补 '/'，避免生成 //assets 之类的地址。
 */
function normalizeBase(raw: string | undefined): string {
  const v = (raw ?? '').trim()
  if (!v || v === '/') return '/'
  const lead = v.startsWith('/') ? v : '/' + v
  return lead.endsWith('/') ? lead : lead + '/'
}

export default defineConfig({
  base: normalizeBase(process.env.VITE_BASE),
  plugins: [svelte()],
})
