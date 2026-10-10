// Build-time thumbnail generator for the journal asset pack.
//
// Scans public/手账素材包/手账素材包/<group>/ for bitmaps and writes long-edge
// 160px thumbnails to public/手账素材包/thumbs/<group>/<same name and extension>.
// Transparent PNGs stay PNG (alpha preserved); JPEGs stay JPEG.
//
// 同时写出 src/lib/thumbs-manifest.ts —— 前端据它决定「哪些文件可以用缩略图」，
// 因此覆盖情况是可核对、可断言的，不会出现「报告说压了 73 个、界面还在拉原图」。
//
// Safe to re-run: an output is skipped when it already exists and is at least as
// new as its source, so adding or deleting pack files only touches the delta.
// Thumbnails whose source image is gone are pruned.
// 素材包目录不存在时只打印一行提示并正常退出，不阻塞 npm run build / dev。
//
// Run with: npm run thumbs（npm run build / npm run dev 之前会自动跑一次）
// Check coverage with: npm run thumbs:check（有源文件缺缩略图时以退出码 1 结束）
import { readdir, mkdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PROJECT = path.resolve(HERE, '..')
const PACK = path.join(PROJECT, 'public', '手账素材包')
const SRC = path.join(PACK, '手账素材包')
const OUT = path.join(PACK, 'thumbs')
const MANIFEST = path.join(PROJECT, 'src', 'lib', 'thumbs-manifest.ts')

const MAX_EDGE = 160
const PHOTO_QUALITY = 80
const IMAGE_RE = /\.(png|jpe?g)$/i
const CHECK = process.argv.includes('--check')

/**
 * 收集素材包里的位图，返回 POSIX 相对路径（`<group>/<file>`）。
 * 一律用 '/' 拼，不跟着平台走：Windows 上 path.join 会给出反斜杠，
 * 而缩略图地址和清单都是 URL 形式，混用就会出现「文件在、地址对不上」。
 */
async function listImages(dir, rel = '') {
  const out = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const r = rel ? rel + '/' + e.name : e.name
    if (e.isDirectory()) out.push(...(await listImages(path.join(dir, e.name), r)))
    else if (IMAGE_RE.test(e.name)) out.push(r)
  }
  return out
}

function toPosix(p) {
  return p.split(path.sep).join('/')
}

async function sizeOf(p) {
  try {
    return (await stat(p)).size
  } catch {
    return 0
  }
}

async function mtimeOf(p) {
  try {
    return (await stat(p)).mtimeMs
  } catch {
    return -1
  }
}

/** 缩略图的站内路径（解码前就是中文，和 src/lib/thumbs.ts 里的映射一致） */
function thumbUrlOf(rel) {
  return '/手账素材包/thumbs/' + rel
}

async function writeManifest(rels) {
  const groups = new Map()
  for (const rel of rels) {
    const g = rel.includes('/') ? rel.slice(0, rel.indexOf('/')) : '素材包'
    groups.set(g, (groups.get(g) ?? 0) + 1)
  }
  const groupLines = [...groups.entries()]
    .map(([name, count]) => `  { name: ${JSON.stringify(name)}, count: ${count} },`)
    .join('\n')
  const urlLines = rels.map((r) => '  ' + JSON.stringify(thumbUrlOf(r)) + ',').join('\n')
  const body =
    '// 本文件由 scripts/make-thumbs.mjs 生成，请勿手改。\n' +
    '// 它记录「public/手账素材包/thumbs/ 下真实存在哪些缩略图」。\n' +
    '// 前端只在清单里查得到时才用缩略图，查不到就退回原图，不会出现「以为有、其实 404」。\n' +
    '// 跑一次 npm run thumbs（或任意一次 npm run build / npm run dev，pre* 钩子会自动跑）即可刷新。\n\n' +
    'export interface ThumbGroup {\n  name: string\n  count: number\n}\n\n' +
    '/** 每个子目录各有几张缩略图 */\n' +
    'export const THUMB_GROUPS: ThumbGroup[] = [\n' +
    (groupLines ? groupLines + '\n' : '') +
    ']\n\n' +
    '/** 缩略图总数 */\n' +
    `export const THUMB_COUNT = ${rels.length}\n\n` +
    '/** 缩略图的站内路径（解码后的中文，以 / 开头的 POSIX 形式） */\n' +
    'export const THUMBS: ReadonlySet<string> = new Set<string>([\n' +
    (urlLines ? urlLines + '\n' : '') +
    '])\n'
  await writeFile(MANIFEST, body, 'utf8')
  return groups
}

const mb = (n) => (n / 1048576).toFixed(2)

async function main() {
  let srcs
  try {
    srcs = await listImages(SRC)
  } catch (err) {
    console.log('[thumbs] 没有找到素材包目录 public/手账素材包/手账素材包（' + err.message + '）')
    console.log('[thumbs] 跳过缩略图生成，界面会直接用原图；把素材包放回去再跑一次即可。')
    await writeManifest([])
    return
  }

  let made = 0
  let skipped = 0
  let failed = 0
  let srcBytes = 0
  let outBytes = 0
  const missing = []

  for (const rel of srcs) {
    const src = path.join(SRC, rel)
    const dst = path.join(OUT, rel)
    const info = await stat(src)
    srcBytes += info.size

    if ((await mtimeOf(dst)) >= info.mtimeMs) {
      outBytes += await sizeOf(dst)
      skipped += 1
      continue
    }

    try {
      await mkdir(path.dirname(dst), { recursive: true })
      const pipeline = sharp(src)
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      if (path.extname(rel).toLowerCase() === '.png') {
        await pipeline.png({ compressionLevel: 9 }).toFile(dst)
      } else {
        await pipeline.jpeg({ quality: PHOTO_QUALITY, mozjpeg: true }).toFile(dst)
      }
      outBytes += await sizeOf(dst)
      made += 1
    } catch (err) {
      failed += 1
      missing.push(rel)
      console.error('[thumbs] failed ' + rel + ': ' + err.message)
    }
  }

  let pruned = 0
  const keep = new Set(srcs.map((r) => toPosix(path.join(OUT, r)).toLowerCase()))
  try {
    for (const rel of await listImages(OUT)) {
      const full = toPosix(path.join(OUT, rel))
      if (!keep.has(full.toLowerCase())) {
        await rm(path.join(OUT, rel))
        pruned += 1
      }
    }
  } catch {
    /* thumbs directory does not exist yet */
  }

  // 清单只收「文件确实在盘上」的那批，保证前端拿到的一定能打开
  const present = []
  for (const rel of srcs) {
    if (await mtimeOf(path.join(OUT, rel)) >= 0) present.push(rel)
    else if (!missing.includes(rel)) missing.push(rel)
  }
  const groups = await writeManifest(present)

  console.log(
    '[thumbs] ' +
      srcs.length +
      ' source images: ' +
      made +
      ' generated, ' +
      skipped +
      ' up-to-date, ' +
      failed +
      ' failed, ' +
      pruned +
      ' pruned',
  )
  console.log(
    '[thumbs] 覆盖 ' + present.length + '/' + srcs.length + ' 个文件：' +
      [...groups.entries()].map(([n, c]) => n + ' ' + c).join('、'),
  )
  console.log(
    '[thumbs] source ' + mb(srcBytes) + ' MB -> thumbs ' + mb(outBytes) + ' MB (long edge ' + MAX_EDGE + 'px)',
  )
  console.log('[thumbs] 清单已写入 src/lib/thumbs-manifest.ts')

  if (missing.length > 0) {
    console.log('[thumbs] 还缺缩略图：' + missing.slice(0, 10).join('、') + (missing.length > 10 ? ' …' : ''))
  }

  if (present.length !== srcs.length) {
    process.exitCode = 1
  } else if (CHECK) {
    console.log('[thumbs] 覆盖完整，' + srcs.length + ' 个源文件全部有缩略图。')
  }
}

await main()
