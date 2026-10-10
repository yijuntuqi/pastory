#!/usr/bin/env node
/**
 * 生成 PWA 图标（192 / 512 / apple-touch 180）。
 * 图案是纯几何形状（纸片 + 胶带 + 手绘波浪线），不依赖系统字体，
 * 因此在任何机器上渲染结果都一致。跑法：npm run icons
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public')

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#FBF7F0"/>
  <g transform="rotate(-7 256 268)">
    <rect x="126" y="118" width="260" height="292" rx="28" fill="#FFFFFF" stroke="#E4DACA" stroke-width="7"/>
  </g>
  <g transform="rotate(7 256 118)">
    <rect x="166" y="86" width="180" height="50" rx="9" fill="#C97B63" opacity="0.86"/>
  </g>
  <circle cx="198" cy="232" r="21" fill="#D9A441"/>
  <rect x="238" y="214" width="106" height="15" rx="7.5" fill="#E7DFD2"/>
  <rect x="238" y="248" width="74" height="15" rx="7.5" fill="#E7DFD2"/>
  <path d="M170 340 q41 -27 82 0 t82 0" fill="none" stroke="#8FA98F" stroke-width="11" stroke-linecap="round"/>
  <circle cx="352" cy="404" r="15" fill="#D98C8C"/>
</svg>`

mkdirSync(OUT, { recursive: true })
const jobs = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]
for (const [name, size] of jobs) {
  const buf = await sharp(Buffer.from(SVG)).resize(size, size).png({ compressionLevel: 9 }).toBuffer()
  writeFileSync(join(OUT, name), buf)
  console.log(`${name}: ${buf.length} 字节`)
}
