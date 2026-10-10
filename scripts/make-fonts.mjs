#!/usr/bin/env node
/**
 * 生成文字工具用的中文字体子集。
 *
 * 做什么：
 * 1. 用 GB2312 一级汉字（3755 字）加上标点 / 数字 / 英文字母，拼出子集字符集；
 * 2. 把字符集写进 src/lib/font-subset.ts，前端据此判断「哪些字会退回系统字体」；
 * 3. 从官方 GitHub Release / Google Fonts 仓库直连下载字体原文件，
 *    用 harfbuzz（subset-font，npm devDependency）裁成子集，输出 woff2 到 public/fonts/；
 * 4. 把各字体的授权文件抓到 public/fonts/licenses/，并写一份 SOURCES.md。
 *
 * 下载策略（v2，2026-10-10 修）：
 * - 不再从 jsdelivr 拉大 TTF：LXGW WenKai / Noto SC 的完整字体接近或超过 20MB，
 *   超出 jsdelivr 单文件上限，它会返回一段错误页而不是字体，脚本拿到 199 字节的
 *   HTML 后 harfbuzz 报「Unrecognized font signature: 429」。
 *   现在按「官方 Release 附件 / Google Fonts 仓库 raw」直连，并跟随重定向。
 * - 每个字体配一串候选地址，按顺序尝试；国内访问 GitHub 慢或超时的情况，
 *   候选里带了 GitHub 加速镜像，得意黑另配了它已发布的 woff2 包。
 * - 每个候选拿到手先校验字体文件头（00010000 / OTTO / true / ttcf，另兼容
 *   wOFF / wOF2，因为得意黑的镜像候选是 woff2）：不是字体就换下一个候选。
 * - 单个字体全部候选都失败，只记一条失败继续下一个字体，最后汇总打印。
 *
 * 只用 npm 依赖，不装任何全局命令行工具。跑法：npm run fonts
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const require = createRequire(import.meta.url)
const subsetFont = require('subset-font')

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const OUT_DIR = join(ROOT, 'public', 'fonts')
const LICENSE_DIR = join(OUT_DIR, 'licenses')
const SUBSET_TS = join(ROOT, 'src', 'lib', 'font-subset.ts')

const CHARSET_ONLY = process.argv.includes('--charset-only')

// ---------------------------------------------------------------- 字符集

/** GB2312 一级汉字 3755 个（0xB0A1 - 0xD7F9） */
function gb2312Level1() {
  const dec = new TextDecoder('gbk', { fatal: false })
  let s = ''
  for (let hi = 0xb0; hi <= 0xd7; hi += 1) {
    for (let lo = 0xa1; lo <= 0xfe; lo += 1) {
      const c = dec.decode(Uint8Array.from([hi, lo]))
      if (c && c !== '\uFFFD') s += c
    }
  }
  return s
}

function extraChars() {
  let s = ''
  for (let c = 0x20; c <= 0x7e; c += 1) s += String.fromCharCode(c)
  const punct = [
    '\u3000', '\u3001', '\u3002', '\uff01', '\uff08', '\uff09', '\uff0c', '\uff0e',
    '\uff1a', '\uff1b', '\uff1f', '\u2018', '\u2019', '\u201c', '\u201d', '\u2014',
    '\u2026', '\u00b7', '\u3010', '\u3011', '\u300a', '\u300b', '\u3008', '\u3009',
    '\u3014', '\u3015', '\uff5e', '\uffe5', '\u00b0', '\u00b1', '\u00d7', '\u00f7',
    '\u2248', '\u2260', '\u2264', '\u2265', '\u2190', '\u2192', '\u2191', '\u2193',
    '\u2605', '\u2606', '\u2661', '\u2665', '\u266a', '\u20ac', '\u00a2', '\u00a3',
    '\u00a5', '\u2116', '\u00a7', '\u00b6', '\u2020', '\u2021', '\u2022', '\u2030',
    '\u2032', '\u2033', '\u2103', '\u33a1', '\uff5b', '\uff5d', '\ufe30', '\u00ae',
    '\u00a9', '\u2122', '\u3007', '\u25ab', '\u25cb', '\u25a1', '\u25b3', '\u25cf',
    '\u25b6', '\u25c0', '\u2713', '\u2714', '\u2717', '\u2718', '\u2708', '\u2691',
  ]
  for (const c of punct) s += c
  return s
}

function buildCharset() {
  const all = new Set()
  for (const ch of gb2312Level1() + extraChars()) all.add(ch)
  return [...all].join('')
}

// ---------------------------------------------------------------- 下载

async function fetchBuf(url, tries = 2) {
  let last
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url, {
        // 官方 Release 附件会 302 到 objects.githubusercontent.com，必须跟随
        redirect: 'follow',
        headers: { 'User-Agent': 'pastory-font-builder' },
        signal: AbortSignal.timeout(180000),
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return Buffer.from(await res.arrayBuffer())
    } catch (err) {
      last = err
      await new Promise((r) => setTimeout(r, 800 * (i + 1)))
    }
  }
  throw last ?? new Error('download failed: ' + url)
}

// ---------------------------------------------------------------- 字体文件头

/** sfnt / woff 文件头：前四个字节 */
const FONT_SIGNATURES = new Set(['\u0000\u0001\u0000\u0000', 'OTTO', 'true', 'ttcf', 'wOFF', 'wOF2'])

function looksLikeFont(buf) {
  if (!buf || buf.length < 12) return false
  return FONT_SIGNATURES.has(buf.toString('latin1', 0, 4))
}

function signatureOf(buf) {
  if (!buf || buf.length < 4) return '(too short)'
  const s = buf.toString('latin1', 0, 4)
  return /^[\x20-\x7e]+$/.test(s) ? s.trim() : '0x' + buf.toString('hex', 0, 4)
}

function isZip(buf) {
  return buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b
}

// ---------------------------------------------------------------- zip

/** 从 zip 里取出第一个 .ttf/.otf（得意黑只发 zip） */
function firstFontFromZip(buf) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  if (eocd < 0) throw new Error('不是有效的 zip')
  const count = buf.readUInt16LE(eocd + 10)
  let off = buf.readUInt32LE(eocd + 16)
  for (let i = 0; i < count; i += 1) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break
    const method = buf.readUInt16LE(off + 10)
    const compSize = buf.readUInt32LE(off + 20)
    const nameLen = buf.readUInt16LE(off + 28)
    const extraLen = buf.readUInt16LE(off + 30)
    const commentLen = buf.readUInt16LE(off + 32)
    const localOff = buf.readUInt32LE(off + 42)
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen)
    const lower = name.toLowerCase()
    if (lower.endsWith('.ttf') || lower.endsWith('.otf')) {
      const lNameLen = buf.readUInt16LE(localOff + 26)
      const lExtraLen = buf.readUInt16LE(localOff + 28)
      const dataStart = localOff + 30 + lNameLen + lExtraLen
      const raw = buf.subarray(dataStart, dataStart + compSize)
      const data = method === 0 ? Buffer.from(raw) : zlib.inflateRawSync(raw)
      process.stdout.write(`  zip 内取到 ${name}（${data.length} 字节）\n`)
      return data
    }
    off += 46 + nameLen + extraLen + commentLen
  }
  throw new Error('zip 里没有找到字体文件')
}

/** 把下载到的字节规整成字体缓冲：zip 就解内层，否则原样返回 */
function toFontBuffer(raw) {
  return isZip(raw) ? firstFontFromZip(raw) : raw
}

// ---------------------------------------------------------------- 字体表
//
// 说明：
// - kind: 'ttf' 静态字体 / 'variable' 可变字体（裁子集时锁 wght=400）
//   zip 与 woff2 不用标 kind，靠文件头自动识别。
// - sources 是候选列表，按顺序尝试，任何一个成功就停。带镜像的候选专为
//   「GitHub 直连超时」（国内网络常见）准备。

const MIRRORS = [
  (u) => 'https://ghproxy.net/' + u,
  (u) => 'https://gh-proxy.com/' + u,
  (u) => 'https://ghfast.top/' + u,
]

function withMirrors(url) {
  return [url, ...MIRRORS.map((m) => m(url))]
}

const FONTS = [
  {
    id: 'wenkai',
    out: 'lxgw-wenkai.woff2',
    kind: 'ttf',
    licenseName: 'LXGW WenKai',
    sources: [
      // 官方 Release 附件（会 302 到 objects.githubusercontent.com）
      ...withMirrors('https://github.com/lxgw/LxgwWenKai/releases/download/v1.520/LXGWWenKai-Regular.ttf'),
      // 官方 Release 的整包 zip（脚本会自动取里面的 .ttf）
      'https://github.com/lxgw/LxgwWenKai/releases/download/v1.520/LXGWWenKai-v1.520.zip',
      // 仓库 raw（无 20MB 上限，作为兜底）
      'https://raw.githubusercontent.com/lxgw/LxgwWenKai/v1.520/fonts/TTF/LXGWWenKai-Regular.ttf',
    ],
    licenseUrl: 'https://raw.githubusercontent.com/lxgw/LxgwWenKai/v1.520/OFL.txt',
  },
  {
    id: 'kuaile',
    out: 'zcool-kuaile.woff2',
    kind: 'ttf',
    licenseName: 'ZCOOL KuaiLe',
    sources: [
      'https://raw.githubusercontent.com/google/fonts/main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf',
      ...withMirrors('https://raw.githubusercontent.com/google/fonts/main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf'),
      'https://cdn.statically.io/gh/google/fonts/main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf',
      // 这个字体只有 2MB 左右，jsdelivr 放得下，留作最后兜底
      'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf',
    ],
    licenseUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/zcoolkuaile/OFL.txt',
  },
  {
    id: 'qingke',
    out: 'zcool-qingke.woff2',
    kind: 'ttf',
    licenseName: 'ZCOOL QingKe HuangYou',
    sources: [
      'https://raw.githubusercontent.com/google/fonts/main/ofl/zcoolqingkehuangyou/ZCOOLQingKeHuangYou-Regular.ttf',
      ...withMirrors('https://raw.githubusercontent.com/google/fonts/main/ofl/zcoolqingkehuangyou/ZCOOLQingKeHuangYou-Regular.ttf'),
      'https://cdn.statically.io/gh/google/fonts/main/ofl/zcoolqingkehuangyou/ZCOOLQingKeHuangYou-Regular.ttf',
      'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zcoolqingkehuangyou/ZCOOLQingKeHuangYou-Regular.ttf',
    ],
    licenseUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/zcoolqingkehuangyou/OFL.txt',
  },
  {
    id: 'smiley',
    out: 'smiley-sans.woff2',
    kind: 'ttf',
    licenseName: 'Smiley Sans',
    // 得意黑只发 zip；官方 Release 直连在国内经常超时，
    // 所以先走加速镜像，再退到它仓库里已发布的 woff2 包。
    sources: [
      'https://github.com/atelier-anchor/smiley-sans/releases/download/v2.0.1/smiley-sans-v2.0.1.zip',
      ...withMirrors('https://github.com/atelier-anchor/smiley-sans/releases/download/v2.0.1/smiley-sans-v2.0.1.zip'),
      'https://raw.githubusercontent.com/atelier-anchor/smiley-sans/v2.0.1/fonts/webfonts/SmileySans-Oblique.woff2',
      'https://cdn.jsdelivr.net/gh/atelier-anchor/smiley-sans@v2.0.1/fonts/webfonts/SmileySans-Oblique.woff2',
    ],
    licenseUrl: 'https://raw.githubusercontent.com/atelier-anchor/smiley-sans/v2.0.1/LICENSE',
  },
  {
    id: 'serif',
    out: 'noto-serif-sc.woff2',
    kind: 'variable',
    licenseName: 'Noto Serif SC',
    sources: [
      'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf',
      ...withMirrors('https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf'),
      'https://cdn.statically.io/gh/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf',
      'https://github.com/google/fonts/raw/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf',
    ],
    licenseUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/OFL.txt',
  },
  {
    id: 'sans',
    out: 'noto-sans-sc.woff2',
    kind: 'variable',
    licenseName: 'Noto Sans SC',
    sources: [
      'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf',
      ...withMirrors('https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf'),
      'https://cdn.statically.io/gh/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf',
      'https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf',
    ],
    licenseUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt',
  },
]

// ---------------------------------------------------------------- 单个字体

/**
 * 依次尝试候选地址，返回裁好的 woff2。
 * 任何一个候选失败（网络、不是字体、裁剪报错）都只记一行日志，继续下一个。
 */
async function buildOneFont(font, chars) {
  const tried = []
  for (const url of font.sources) {
    process.stdout.write(`  尝试 ${url}\n`)
    try {
      const raw = await fetchBuf(url)
      const buf = toFontBuffer(raw)
      if (!looksLikeFont(buf)) {
        throw new Error(`这个源返回的不是字体文件（文件头 ${signatureOf(buf)}，${buf.length} 字节）`)
      }
      const out = await subsetFont(buf, chars, {
        targetFormat: 'woff2',
        noHinting: true,
        preserveNameIds: [13, 14],
        ...(font.kind === 'variable' ? { variationAxes: { wght: 400 } } : {}),
      })
      process.stdout.write(`  源文件 ${buf.length} 字节 -> ${out.length} 字节\n`)
      return { out, srcBytes: buf.length, source: url }
    } catch (err) {
      tried.push(url)
      process.stdout.write(`    失败：${err && err.message ? err.message : err}\n`)
      continue
    }
  }
  const err = new Error(`${font.licenseName}：${tried.length} 个候选地址全部失败`)
  err.tried = tried
  throw err
}

// ---------------------------------------------------------------- 主流程

async function main() {
  const text = buildCharset()
  const unique = [...new Set([...text])]
  console.log(`字符集：${unique.length} 个字符`)

  writeFileSync(
    SUBSET_TS,
    '// 本文件由 scripts/make-fonts.mjs 生成，请勿手改。\n' +
      '// 与 public/fonts/ 下各子集字体使用的字符集完全一致。\n' +
      `export const SUBSET_CHARS = ${JSON.stringify(unique.join(''))}\n\n` +
      `export const SUBSET_SIZE = ${unique.length}\n`,
    'utf8',
  )
  console.log(`已写入 ${SUBSET_TS}`)

  if (CHARSET_ONLY) return

  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(LICENSE_DIR, { recursive: true })

  const ok = []
  const failed = []

  for (const font of FONTS) {
    console.log(`\n=== ${font.id} （${font.licenseName}）===`)
    try {
      const r = await buildOneFont(font, unique.join(''))
      writeFileSync(join(OUT_DIR, font.out), r.out)
      console.log(
        `  写出 public/fonts/${font.out}：${r.out.length} 字节 (${(r.out.length / 1024).toFixed(0)} KB)`,
      )
      ok.push({ id: font.id, file: font.out, src: r.srcBytes, out: r.out.length, source: r.source })
    } catch (err) {
      // 单个字体失败绝不中断整批
      console.log(`  ${err && err.message ? err.message : err}`)
      failed.push({ id: font.id, name: font.licenseName, message: err && err.message ? err.message : String(err) })
    }

    // 授权文件单独失败不影响字体本体
    try {
      const lic = await fetchBuf(font.licenseUrl, 1)
      writeFileSync(join(LICENSE_DIR, font.id + '-OFL.txt'), lic.toString('utf8'), 'utf8')
    } catch (err) {
      writeFileSync(
        join(LICENSE_DIR, font.id + '-OFL.txt'),
        `${font.licenseName} \u91c7\u7528 SIL Open Font License 1.1\u3002\u5b8c\u6574\u6587\u672c\u8bf7\u89c1 https://openfontlicense.org/\n`,
        'utf8',
      )
      console.log(`  授权文件下载失败（${err && err.message ? err.message : err}），已写占位说明`)
    }
  }

  const lines = [
    '# 字体来源与授权',
    '',
    '这些字体由 `npm run fonts`（scripts/make-fonts.mjs）从官方来源下载并裁成子集，',
    '子集字符集 = GB2312 一级常用字 + 标点 / 数字 / 英文字母。',
    '全部为 SIL OFL 1.1，允许免费商用、允许网页嵌入与随产品分发；',
    '不得单独售卖字体文件；修改版不得使用保留字体名；随附授权文件见本目录 licenses/。',
    '',
    '| 字体 | 输出文件 | 授权 | 来源 | 原文件 | 子集大小 |',
    '| --- | --- | --- | --- | --- | --- |',
  ]
  for (const f of FONTS) {
    const r = ok.find((x) => x.id === f.id)
    lines.push(
      `| ${f.licenseName} | ${f.out} | SIL OFL 1.1 | ${r ? r.source : f.licenseUrl} | ${
        r ? (r.src / 1048576).toFixed(1) + ' MB' : '-'
      } | ${r ? (r.out / 1048576).toFixed(2) + ' MB' : '-'} |`,
    )
  }
  writeFileSync(join(OUT_DIR, 'SOURCES.md'), lines.join('\n') + '\n', 'utf8')

  console.log('\n=== 汇总 ===')
  console.log(`成功 ${ok.length} 个：${ok.map((r) => r.file).join('、') || '（无）'}`)
  console.log(`失败 ${failed.length} 个：${failed.map((f) => f.name).join('、') || '（无）'}`)
  for (const f of failed) console.log(`  - ${f.name}：${f.message}`)

  const files = existsSync(OUT_DIR) ? readdirSync(OUT_DIR).filter((f) => f.endsWith('.woff2')) : []
  if (files.length > 0) {
    console.log(
      `public/fonts 下共 ${files.length} 个 woff2，合计 ${(
        files.reduce((n, f) => n + statSync(join(OUT_DIR, f)).size, 0) / 1048576
      ).toFixed(2)} MB`,
    )
  }
  if (failed.length > 0) {
    console.log('（失败的字体不影响其他字体；想补齐可以等信息好的时候重跑一次 npm run fonts）')
  }
  // 只要有一个成功就当这次跑通了；全失败才算真失败，避免「六个里挂一个」被当成整体崩掉
  if (ok.length === 0) process.exitCode = 1
}

main().catch((err) => {
  console.error('生成失败：', err && err.message ? err.message : err)
  process.exitCode = 1
})
