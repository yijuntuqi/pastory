import { ASSET_MAP } from './assets'
import { PACK_TEXTURES } from './pack-assets'
import type { BgType, Item, PageDoc, TemplateDef } from './types'

export const PAGE_W = 720
export const PAGE_H = 1020

let seq = 0
export function uid(prefix = 'i'): string {
  seq += 1
  return `${prefix}${Date.now().toString(36)}${seq.toString(36)}`
}

/** 模板里的一个预置素材：位置、宽度、角度都是页面像素 / 度 */
export interface SceneSeed {
  a: string
  x: number
  y: number
  w: number
  rot?: number
  flip?: boolean
  opacity?: number
}

export interface SceneBg {
  type: BgType
  color: string
  /** 纸面底纹（public 下的相对 URL），从素材包的纸纹理里取 */
  tex?: string
}

/** 一个场景模板：底色 + 预置素材，全是数据，加模板不改渲染逻辑 */
export interface SceneDef extends TemplateDef {
  bg: SceneBg
  seeds: SceneSeed[]
}

/** 拿纸纹理的 URL，不把那一长串百分号编码写死在模板里 */
function tex(id: string): string | undefined {
  return PACK_TEXTURES.find((t) => t.id === id)?.src
}

function make(seeds: SceneSeed[]): Item[] {
  let z = 0
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
      flip: s.flip,
      opacity: s.opacity,
      z,
    }
  })
}

function scene(
  id: string,
  name: string,
  hint: string,
  bg: SceneBg,
  seeds: SceneSeed[],
  inkTip?: string,
): SceneDef {
  return { id, name, hint, inkTip, bg, seeds }
}

/**
 * 所有场景模板。每个场景都是一套「底纹 + 胶带 + 照片框 + 便签 + 印章」的分层组合，
 * 而不是把素材随便撒上去：
 * - 底色决定气质，深色底（星空）会额外给一条墨色提示；
 * - 种子按数组顺序叠上去，排在后面的压在上面。
 * 想加模板只要往这个数组里加一条数据。
 */
export const SCENES: SceneDef[] = [
  scene('blank', '空白页', '从零开始，自由摆', { type: 'plain', color: '#FBF7F0' }, []),

  scene(
    'daily',
    '日常一页',
    '便签加胶带，写今天',
    { type: 'plain', color: '#FBF7F0', tex: tex('pack-tex-05') },
    [
      { a: 'tape-plain', x: 360, y: 96, w: 230, rot: -3 },
      { a: 'stamp-date', x: 128, y: 210, w: 132, rot: -9 },
      { a: 'deco-heart', x: 600, y: 268, w: 70, rot: 9 },
      { a: 'note-lined', x: 360, y: 470, w: 460, rot: -1 },
      { a: 'plant-euca', x: 620, y: 800, w: 170, rot: 14 },
      { a: 'deco-star', x: 118, y: 720, w: 78, rot: -12 },
    ],
  ),

  scene(
    'weekly',
    '周计划',
    '四宫格，记一周的事',
    { type: 'grid', color: '#FBF7F0', tex: tex('pack-tex-06') },
    [
      { a: 'tape-stripe', x: 360, y: 88, w: 240, rot: 2 },
      { a: 'stamp-ok', x: 618, y: 172, w: 104, rot: 12 },
      { a: 'note-plain', x: 218, y: 370, w: 300, rot: -1 },
      { a: 'note-plain', x: 508, y: 370, w: 300, rot: 1 },
      { a: 'note-plain', x: 218, y: 660, w: 300, rot: 1 },
      { a: 'note-plain', x: 508, y: 660, w: 300, rot: -1 },
      { a: 'plant-branch', x: 108, y: 900, w: 150, rot: -18 },
      { a: 'deco-sparkle', x: 636, y: 892, w: 74, rot: 6 },
    ],
  ),

  scene(
    'travel',
    '旅行手记',
    '相框加邮票，收好一段路',
    { type: 'plain', color: '#F7EEDF', tex: tex('pack-tex-01') },
    [
      { a: 'tape-grid', x: 190, y: 92, w: 210, rot: -7 },
      { a: 'note-polaroid', x: 360, y: 350, w: 300, rot: 2 },
      { a: 'stamp-post', x: 596, y: 196, w: 132, rot: 8 },
      { a: 'deco-sun', x: 128, y: 250, w: 92, rot: -8 },
      { a: 'deco-arrow', x: 250, y: 620, w: 160, rot: 22 },
      { a: 'note-torn', x: 400, y: 760, w: 360, rot: -2 },
      { a: 'plant-flower', x: 618, y: 900, w: 110, rot: 10 },
    ],
  ),

  scene(
    'beach',
    '海滩假日',
    '暖沙色，贝壳与海浪',
    { type: 'plain', color: '#FBF0DC', tex: tex('pack-tex-08') },
    [
      { a: 'tape-wave', x: 360, y: 92, w: 250, rot: -2 },
      { a: 'deco-sun', x: 608, y: 170, w: 104, rot: 6 },
      { a: 'd3-wave', x: 330, y: 720, w: 520, rot: -1, opacity: 0.9 },
      { a: 'note-polaroid', x: 300, y: 400, w: 290, rot: -3 },
      { a: 'pro-label-day', x: 566, y: 596, w: 168, rot: 7 },
      { a: 'd3-palm', x: 106, y: 306, w: 168, rot: -14 },
      { a: 'd3-shell', x: 592, y: 856, w: 128, rot: 12 },
      { a: 'd3-starfish', x: 132, y: 862, w: 120, rot: -8 },
      { a: 'pack-plant-05', x: 640, y: 440, w: 128, rot: 16 },
      { a: 'stamp-post', x: 120, y: 620, w: 120, rot: -10 },
      { a: 'deco-sparkle', x: 400, y: 560, w: 62, rot: 0 },
    ],
  ),

  scene(
    'starry',
    '星空夜',
    '深色纸面，星与月',
    { type: 'plain', color: '#1C2033' },
    [
      { a: 'd3-stars', x: 250, y: 190, w: 320, rot: -3 },
      { a: 'd3-moon', x: 570, y: 158, w: 170, rot: 10 },
      { a: 'deco-star', x: 130, y: 116, w: 66, rot: -14, opacity: 0.9 },
      { a: 'deco-star', x: 430, y: 96, w: 52, rot: 8, opacity: 0.75 },
      { a: 'd3-meteor', x: 520, y: 350, w: 210, rot: -26 },
      { a: 'note-plain', x: 356, y: 620, w: 420, rot: -1 },
      { a: 'tape-plain', x: 356, y: 458, w: 240, rot: 2 },
      { a: 'stamp-star', x: 590, y: 860, w: 118, rot: 10 },
      { a: 'deco-sparkle', x: 132, y: 800, w: 68, rot: -6 },
      { a: 'deco-star', x: 300, y: 906, w: 56, rot: 12, opacity: 0.8 },
    ],
    '深色纸面：点「手写」后把墨色换成白色或浅色，字才看得见。',
  ),

  scene(
    'classroom',
    '教室笔记',
    '横线纸，课程表与便签',
    { type: 'lined', color: '#FBF7F0', tex: tex('pack-tex-04') },
    [
      { a: 'tape-plain', x: 200, y: 88, w: 220, rot: -4 },
      { a: 'd3-timetable', x: 356, y: 250, w: 430, rot: -1 },
      { a: 'note-lined', x: 220, y: 610, w: 350, rot: -2 },
      { a: 'pro-label-notes', x: 566, y: 500, w: 172, rot: 8 },
      { a: 'd3-pencil', x: 604, y: 706, w: 150, rot: 22 },
      { a: 'd3-ruler', x: 150, y: 856, w: 220, rot: -8 },
      { a: 'pro-clip', x: 452, y: 452, w: 70, rot: 16 },
      { a: 'stamp-ok', x: 588, y: 890, w: 108, rot: 10 },
      { a: 'plant-euca', x: 626, y: 300, w: 120, rot: 12 },
      { a: 'deco-sparkle', x: 110, y: 700, w: 62, rot: -8 },
    ],
  ),

  scene(
    'exam',
    '考试周',
    '倒计时与待办，方格纸',
    { type: 'grid', color: '#FCF8F2', tex: tex('pack-tex-05') },
    [
      { a: 'tape-stripe', x: 520, y: 92, w: 230, rot: 4 },
      { a: 'stamp-date', x: 140, y: 150, w: 140, rot: -8 },
      { a: 'd3-checklist', x: 356, y: 520, w: 440, rot: -1 },
      { a: 'note-kraft', x: 170, y: 330, w: 240, rot: -4 },
      { a: 'd3-pencil', x: 592, y: 316, w: 140, rot: 34 },
      { a: 'pro-staple', x: 448, y: 300, w: 64, rot: 12 },
      { a: 'p2-dater', x: 596, y: 800, w: 150, rot: 10 },
      { a: 'deco-arrow', x: 200, y: 880, w: 150, rot: -18 },
      { a: 'plant-clover', x: 112, y: 620, w: 96, rot: -10 },
    ],
  ),

  scene(
    'cafe',
    '咖啡店',
    '牛皮纸与咖啡渍',
    { type: 'plain', color: '#F6EFE6', tex: tex('pack-tex-09') },
    [
      { a: 'tape-dot', x: 350, y: 90, w: 240, rot: -3 },
      { a: 'd3-cup', x: 560, y: 260, w: 170, rot: 6 },
      { a: 'd3-beans', x: 150, y: 230, w: 120, rot: -12 },
      { a: 'note-kraft', x: 356, y: 560, w: 430, rot: 1 },
      { a: 'pro-label-day', x: 150, y: 452, w: 168, rot: -9 },
      { a: 'p2-wax', x: 612, y: 640, w: 96, rot: 14 },
      { a: 'deco-heart', x: 132, y: 806, w: 78, rot: -8 },
      { a: 'plant-berry', x: 596, y: 880, w: 110, rot: 10 },
      { a: 'pro-lace', x: 356, y: 906, w: 260, rot: 0, opacity: 0.85 },
    ],
  ),

  scene(
    'camping',
    '露营山野',
    '帐篷、远山与绳结',
    { type: 'plain', color: '#EEF4EC', tex: tex('pack-tex-02') },
    [
      { a: 'tape-grid', x: 356, y: 90, w: 240, rot: 3 },
      { a: 'd3-mountain', x: 356, y: 300, w: 470, rot: -1 },
      { a: 'd3-tent', x: 220, y: 560, w: 230, rot: -3 },
      { a: 'note-torn', x: 440, y: 700, w: 340, rot: 2 },
      { a: 'plant-branch', x: 616, y: 880, w: 140, rot: 14 },
      { a: 'pro-dried', x: 108, y: 830, w: 130, rot: -12 },
      { a: 'p2-twine', x: 356, y: 452, w: 220, rot: 0 },
      { a: 'stamp-date', x: 590, y: 200, w: 128, rot: 8 },
      { a: 'deco-sparkle', x: 132, y: 470, w: 60, rot: -6 },
    ],
  ),

  scene(
    'reading',
    '读书笔记',
    '书堆、旧纸与摘抄',
    { type: 'lined', color: '#FAF6EE' },
    [
      { a: 'tape-grid', x: 356, y: 86, w: 230, rot: -2 },
      { a: 'd3-books', x: 574, y: 236, w: 180, rot: 8 },
      { a: 'd3-glasses', x: 160, y: 300, w: 170, rot: -8 },
      { a: 'pro-oldpaper', x: 356, y: 600, w: 440, rot: -1 },
      { a: 'pro-label-notes', x: 176, y: 830, w: 168, rot: -6 },
      { a: 'plant-clover', x: 600, y: 856, w: 100, rot: 12 },
      { a: 'stamp-wreath', x: 120, y: 500, w: 110, rot: -10 },
      { a: 'deco-arrow', x: 560, y: 452, w: 140, rot: 196 },
      { a: 'deco-star', x: 630, y: 620, w: 62, rot: 10 },
    ],
  ),

  scene(
    'birthday',
    '生日一页',
    '蛋糕、蜡烛与彩饰',
    { type: 'plain', color: '#FBEFF0', tex: tex('pack-tex-07') },
    [
      { a: 'tape-dot', x: 366, y: 88, w: 240, rot: 2 },
      { a: 'd3-cake', x: 250, y: 330, w: 250, rot: -3 },
      { a: 'd3-candle', x: 556, y: 254, w: 110, rot: 10 },
      { a: 'deco-bow', x: 128, y: 210, w: 130, rot: -10 },
      { a: 'pro-pearl', x: 366, y: 470, w: 300, rot: 0, opacity: 0.9 },
      { a: 'note-plain', x: 356, y: 700, w: 440, rot: -1 },
      { a: 'pro-label-love', x: 560, y: 880, w: 176, rot: 8 },
      { a: 'stamp-star', x: 122, y: 860, w: 110, rot: -12 },
      { a: 'deco-heart', x: 618, y: 560, w: 80, rot: 12 },
      { a: 'pro-sparkle', x: 158, y: 466, w: 70, rot: -6 },
      { a: 'deco-sparkle', x: 452, y: 176, w: 56, rot: 0 },
    ],
  ),
]

export const TEMPLATES: TemplateDef[] = SCENES.map((s) => ({
  id: s.id,
  name: s.name,
  hint: s.hint,
  inkTip: s.inkTip,
}))

/** 按 id 取场景；找不到就退回空白页 */
export function sceneOf(id: string): SceneDef {
  return SCENES.find((s) => s.id === id) ?? SCENES[0]
}

/** 把场景的预置素材展开成页面上的素材项 */
export function buildTemplate(id: string): Item[] {
  return make(sceneOf(id).seeds)
}

export function newPage(templateId = 'blank', name = '未命名'): PageDoc {
  const scene = sceneOf(templateId)
  return {
    id: uid('p'),
    name,
    width: PAGE_W,
    height: PAGE_H,
    bg: { ...scene.bg },
    items: make(scene.seeds),
    strokes: [],
  }
}
