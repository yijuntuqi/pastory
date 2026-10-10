#!/usr/bin/env node
/**
 * 构建前置钩子（predev / prebuild）。
 *
 * 它只做一件事：跑缩略图生成，并且无论成败都不让构建失败。
 * 缩略图是优化项，不是构建必需品：素材包不在仓库里（它只在你本机）、
 * 或者 sharp 在这个环境装不上，都只影响素材栏用不用缩略图，
 * 不应该把整个 build 拖死。
 *
 * 字体同理，而且它是手动的独立命令（npm run fonts），不在任何构建钩子里，
 * 所以 CI 上跑 npm ci && npm run build 根本不会碰字体下载。
 */
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')

const r = spawnSync(process.execPath, [join(HERE, 'make-thumbs.mjs')], {
  stdio: 'inherit',
  cwd: ROOT,
})

if (r.error || r.status !== 0) {
  const code = r.error ? r.error.message : String(r.status)
  console.warn('[prebuild] 缩略图生成没跑成功（' + code + '），已忽略，继续构建。')
  console.warn('[prebuild] 素材栏会自动退回原图，功能不受影响；想补齐在本机跑 npm run thumbs。')
}

process.exit(0)
