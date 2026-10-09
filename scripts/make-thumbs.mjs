// Build-time thumbnail generator for the journal asset pack.
//
// Scans public/手账素材包/手账素材包/<group>/ for bitmaps and writes long-edge
// 160px thumbnails to public/手账素材包/thumbs/<group>/<same name and extension>.
// Transparent PNGs stay PNG (alpha preserved); JPEGs stay JPEG.
//
// Safe to re-run: an output is skipped when it already exists and is at least as
// new as its source, so adding or deleting pack files only touches the delta.
// Thumbnails whose source image is gone are pruned.
//
// Run with: npm run thumbs
import { readdir, mkdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PROJECT = path.resolve(HERE, '..')
const PACK = path.join(PROJECT, 'public', '手账素材包')
const SRC = path.join(PACK, '手账素材包')
const OUT = path.join(PACK, 'thumbs')

const MAX_EDGE = 160
const PHOTO_QUALITY = 80
const IMAGE_RE = /\.(png|jpe?g)$/i

async function listImages(dir, rel = '') {
  const out = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const r = rel ? path.join(rel, e.name) : e.name
    if (e.isDirectory()) out.push(...(await listImages(path.join(dir, e.name), r)))
    else if (IMAGE_RE.test(e.name)) out.push(r)
  }
  return out
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

async function main() {
  let srcs
  try {
    srcs = await listImages(SRC)
  } catch (err) {
    console.error('[thumbs] cannot read source pack: ' + err.message)
    process.exitCode = 1
    return
  }

  let made = 0
  let skipped = 0
  let failed = 0
  let srcBytes = 0
  let outBytes = 0

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
      console.error('[thumbs] failed ' + rel + ': ' + err.message)
    }
  }

  let pruned = 0
  const keep = new Set(srcs.map((r) => path.join(OUT, r).toLowerCase()))
  try {
    for (const rel of await listImages(OUT)) {
      const full = path.join(OUT, rel)
      if (!keep.has(full.toLowerCase())) {
        await rm(full)
        pruned += 1
      }
    }
  } catch {
    /* thumbs directory does not exist yet */
  }

  const mb = (n) => (n / 1048576).toFixed(2)
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
  console.log('[thumbs] source ' + mb(srcBytes) + ' MB -> thumbs ' + mb(outBytes) + ' MB (long edge ' + MAX_EDGE + 'px)')
  if (failed > 0) process.exitCode = 1
}

await main()