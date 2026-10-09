import { ASSET_MAP } from './assets'
import type { Item, PageDoc, TemplateDef } from './types'

export const PAGE_W = 720
export const PAGE_H = 1020

let seq = 0
export function uid(prefix = 'i'): string {
  seq += 1
  return `${prefix}${Date.now().toString(36)}${seq.toString(36)}`
}

interface Seed {
  a: string
  x: number
  y: number
  w: number
  rot?: number
  z?: number
}

let z = 0
function make(seeds: Seed[]): Item[] {
  z = 0
  return seeds.map((s) => {
    const def = ASSET_MAP[s.a]
    const ratio = def ? def.h / def.w : 1
    z += 1
    return {
      id: uid(),
      asset: s.a,
      x: s.x,
      y: s.y,
      w: s.w,
      h: s.w * ratio,
      rot: s.rot ?? 0,
      z: s.z ?? z,
    }
  })
}

export const TEMPLATES: TemplateDef[] = [
  { id: 'blank', name: '空白页', hint: '从零开始，自由摆' },
  { id: 'daily', name: '日常一页', hint: '便签加胶带，写今天' },
  { id: 'weekly', name: '周计划', hint: '四宫格，记一周的事' },
  { id: 'travel', name: '旅行手记', hint: '相框加邮票，收好一段路' },
]

export function buildTemplate(id: string): Item[] {
  if (id === 'daily') {
    return make([
      { a: 'tape-plain', x: 360, y: 96, w: 230, rot: -3 },
      { a: 'stamp-date', x: 128, y: 210, w: 132, rot: -9 },
      { a: 'deco-heart', x: 600, y: 268, w: 70, rot: 9 },
      { a: 'note-lined', x: 360, y: 470, w: 460, rot: -1 },
      { a: 'plant-euca', x: 620, y: 800, w: 170, rot: 14 },
      { a: 'deco-star', x: 118, y: 720, w: 78, rot: -12 },
    ])
  }
  if (id === 'weekly') {
    return make([
      { a: 'tape-stripe', x: 360, y: 88, w: 240, rot: 2 },
      { a: 'stamp-ok', x: 618, y: 172, w: 104, rot: 12 },
      { a: 'note-plain', x: 218, y: 370, w: 300, rot: -1 },
      { a: 'note-plain', x: 508, y: 370, w: 300, rot: 1 },
      { a: 'note-plain', x: 218, y: 660, w: 300, rot: 1 },
      { a: 'note-plain', x: 508, y: 660, w: 300, rot: -1 },
      { a: 'plant-branch', x: 108, y: 900, w: 150, rot: -18 },
      { a: 'deco-sparkle', x: 636, y: 892, w: 74, rot: 6 },
    ])
  }
  if (id === 'travel') {
    return make([
      { a: 'tape-grid', x: 190, y: 92, w: 210, rot: -7 },
      { a: 'note-polaroid', x: 360, y: 350, w: 300, rot: 2 },
      { a: 'stamp-post', x: 596, y: 196, w: 132, rot: 8 },
      { a: 'deco-sun', x: 128, y: 250, w: 92, rot: -8 },
      { a: 'deco-arrow', x: 250, y: 620, w: 160, rot: 22 },
      { a: 'note-torn', x: 400, y: 760, w: 360, rot: -2 },
      { a: 'plant-flower', x: 618, y: 900, w: 110, rot: 10 },
    ])
  }
  return []
}

export function newPage(templateId = 'blank', name = '未命名'): PageDoc {
  return {
    id: uid('p'),
    name,
    width: PAGE_W,
    height: PAGE_H,
    bg: { type: 'plain', color: '#FBF7F0' },
    items: buildTemplate(templateId),
  }
}
