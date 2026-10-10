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
  /** 面板里的分类（计划 / 记录 / 主题 / 纪念 / 排版）；不填算「经典」 */
  tag?: string
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
  tag?: string,
): SceneDef {
  return { id, name, hint, inkTip, bg, seeds, tag }
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
  // ---- 第二批：日常记录类场景（学习 / 月度 / 复盘 / 追剧 / 美食 / 宠物 / 购物 / 健身 / 情绪 / 节日 / 纪念 / 毕业 / 标本 / 复古 / 极简 / 票据） ----

  scene(
    'study',
    '学习计划',
    '待办清单加铅笔，今天要啃的书',
    { type: 'lined', color: '#FCFAF4', tex: tex('pack-tex-04') },
    [
      { a: 'tape-grid', x: 200, y: 88, w: 220, rot: -4 },
      { a: 'd3-checklist', x: 372, y: 300, w: 420, rot: -1 },
      { a: 'note-lined', x: 224, y: 640, w: 340, rot: -2 },
      { a: 'pro-label-notes', x: 576, y: 512, w: 168, rot: 8 },
      { a: 'd3-pencil', x: 608, y: 720, w: 148, rot: 24 },
      { a: 'stamp-ok', x: 588, y: 900, w: 104, rot: 10 },
      { a: 'plant-euca', x: 116, y: 380, w: 130, rot: -12 },
      { a: 'deco-sparkle', x: 122, y: 880, w: 62, rot: -6 },
    ],
    undefined,
    '计划',
  ),

  scene(
    'monthly',
    '月度总览',
    '四宫格记满一个月',
    { type: 'grid', color: '#FBF7F0', tex: tex('pack-tex-05') },
    [
      { a: 'tape-stripe', x: 356, y: 86, w: 250, rot: 2 },
      { a: 'p2-dater', x: 606, y: 194, w: 140, rot: 10 },
      { a: 'note-plain', x: 214, y: 400, w: 302, rot: -1 },
      { a: 'note-plain', x: 506, y: 400, w: 302, rot: 1 },
      { a: 'note-plain', x: 214, y: 706, w: 302, rot: 1 },
      { a: 'note-plain', x: 506, y: 706, w: 302, rot: -1 },
      { a: 'stamp-wreath', x: 112, y: 196, w: 118, rot: -10 },
      { a: 'deco-sparkle', x: 628, y: 902, w: 64, rot: 6 },
    ],
    undefined,
    '计划',
  ),

  scene(
    'review',
    '周复盘',
    '横线纸，写写这一周',
    { type: 'lined', color: '#FAF6EE', tex: tex('pack-tex-04') },
    [
      { a: 'tape-plain', x: 356, y: 90, w: 240, rot: -3 },
      { a: 'note-lined', x: 356, y: 400, w: 460, rot: -1 },
      { a: 'note-kraft', x: 200, y: 720, w: 250, rot: -4 },
      { a: 'pro-label-notes', x: 560, y: 700, w: 168, rot: 7 },
      { a: 'stamp-ok', x: 590, y: 898, w: 104, rot: 9 },
      { a: 'pro-sparkle', x: 122, y: 520, w: 68, rot: -8 },
      { a: 'plant-branch', x: 622, y: 300, w: 120, rot: 14 },
    ],
    undefined,
    '计划',
  ),

  scene(
    'watch',
    '追剧手记',
    '爆米花与手柄，记下每一集',
    { type: 'plain', color: '#F6EFE6', tex: tex('pack-tex-09') },
    [
      { a: 'tape-dot', x: 350, y: 88, w: 240, rot: -3 },
      { a: 'd3-popcorn', x: 574, y: 262, w: 156, rot: 8 },
      { a: 'd3-controller', x: 168, y: 300, w: 186, rot: -8 },
      { a: 'note-kraft', x: 360, y: 596, w: 430, rot: 1 },
      { a: 'pro-film', x: 356, y: 300, w: 300, rot: -1, opacity: 0.92 },
      { a: 'stamp-star', x: 594, y: 872, w: 110, rot: 10 },
      { a: 'deco-star', x: 128, y: 866, w: 72, rot: -12 },
    ],
    undefined,
    '记录',
  ),

  scene(
    'food',
    '美食探店',
    '面碗与奶茶，先拍一张',
    { type: 'plain', color: '#F8F0E2', tex: tex('pack-tex-01') },
    [
      { a: 'tape-wave', x: 360, y: 90, w: 250, rot: -2 },
      { a: 'd3-bowl', x: 244, y: 322, w: 190, rot: -4 },
      { a: 'd3-boba', x: 566, y: 340, w: 120, rot: 9 },
      { a: 'note-torn', x: 366, y: 636, w: 400, rot: -1 },
      { a: 'pro-label-day', x: 156, y: 560, w: 168, rot: -8 },
      { a: 'd3-cup', x: 608, y: 700, w: 130, rot: 12 },
      { a: 'stamp-post', x: 596, y: 900, w: 112, rot: 8 },
      { a: 'plant-clover', x: 122, y: 880, w: 92, rot: -10 },
    ],
    undefined,
    '记录',
  ),

  scene(
    'pet',
    '宠物日常',
    '爪印和拍立得，家里的小家伙',
    { type: 'plain', color: '#EEF4EC', tex: tex('pack-tex-02') },
    [
      { a: 'tape-grid', x: 356, y: 88, w: 240, rot: 3 },
      { a: 'd3-paw', x: 590, y: 220, w: 128, rot: 12 },
      { a: 'note-polaroid', x: 292, y: 420, w: 300, rot: -2 },
      { a: 'note-plain', x: 400, y: 700, w: 400, rot: 1 },
      { a: 'stamp-date', x: 128, y: 216, w: 128, rot: -9 },
      { a: 'deco-heart', x: 606, y: 880, w: 76, rot: 10 },
      { a: 'plant-flower', x: 116, y: 884, w: 96, rot: -12 },
    ],
    undefined,
    '记录',
  ),

  scene(
    'shopping',
    '购物清单',
    '方格纸打勾，买东西不心疼',
    { type: 'grid', color: '#FCF8F2', tex: tex('pack-tex-05') },
    [
      { a: 'tape-stripe', x: 500, y: 90, w: 230, rot: 4 },
      { a: 'd3-cart', x: 196, y: 236, w: 176, rot: -6 },
      { a: 'd3-checklist', x: 376, y: 560, w: 430, rot: -1 },
      { a: 'note-kraft', x: 574, y: 270, w: 190, rot: 8 },
      { a: 'stamp-ok', x: 150, y: 560, w: 104, rot: -10 },
      { a: 'deco-sparkle', x: 606, y: 880, w: 68, rot: 6 },
      { a: 'plant-berry', x: 118, y: 872, w: 90, rot: -8 },
    ],
    undefined,
    '计划',
  ),

  scene(
    'fitness',
    '健身打卡',
    '心率线与哑铃，动起来',
    { type: 'grid', color: '#F5F2EA', tex: tex('pack-tex-04') },
    [
      { a: 'tape-plain', x: 180, y: 90, w: 220, rot: -5 },
      { a: 'd3-dumbbell', x: 356, y: 264, w: 220, rot: -2 },
      { a: 'd3-heartline', x: 356, y: 430, w: 420, rot: -1 },
      { a: 'note-lined', x: 356, y: 680, w: 440, rot: 1 },
      { a: 'pro-label-day', x: 596, y: 168, w: 160, rot: 9 },
      { a: 'stamp-ok', x: 132, y: 540, w: 100, rot: -10 },
      { a: 'deco-sparkle', x: 610, y: 906, w: 62, rot: 4 },
    ],
    undefined,
    '记录',
  ),

  scene(
    'mood',
    '情绪日记',
    '淡粉纸面，写点心里的事',
    { type: 'plain', color: '#FBEFF0', tex: tex('pack-tex-07') },
    [
      { a: 'tape-dot', x: 356, y: 88, w: 240, rot: 2 },
      { a: 'd3-moon', x: 588, y: 236, w: 150, rot: 10 },
      { a: 'note-lined', x: 356, y: 430, w: 450, rot: -1 },
      { a: 'note-torn', x: 356, y: 748, w: 420, rot: 1 },
      { a: 'deco-heart', x: 126, y: 300, w: 90, rot: -10 },
      { a: 'stamp-wreath', x: 128, y: 640, w: 118, rot: -8 },
      { a: 'pro-sparkle', x: 604, y: 880, w: 76, rot: 8 },
    ],
    undefined,
    '记录',
  ),

  scene(
    'christmas',
    '圣诞一页',
    '雪花、礼物和松枝',
    { type: 'plain', color: '#EEF4EC', tex: tex('pack-tex-02') },
    [
      { a: 'tape-grid', x: 356, y: 88, w: 240, rot: 3 },
      { a: 'd3-snow', x: 594, y: 214, w: 128, rot: 8 },
      { a: 'd3-gift', x: 168, y: 296, w: 156, rot: -8 },
      { a: 'note-plain', x: 366, y: 596, w: 440, rot: -1 },
      { a: 'plant-branch', x: 118, y: 700, w: 150, rot: -14 },
      { a: 'stamp-wreath', x: 596, y: 720, w: 122, rot: 10 },
      { a: 'deco-star', x: 356, y: 250, w: 70, rot: 0, opacity: 0.9 },
      { a: 'deco-sparkle', x: 132, y: 880, w: 66, rot: -6 },
    ],
    undefined,
    '主题',
  ),

  scene(
    'newyear',
    '新年一页',
    '烟花与蜡封，写下新年愿望',
    { type: 'plain', color: '#FBEFF0', tex: tex('pack-tex-07') },
    [
      { a: 'tape-stripe', x: 356, y: 88, w: 250, rot: -2 },
      { a: 'd3-firework', x: 356, y: 268, w: 210, rot: 0 },
      { a: 'note-plain', x: 356, y: 620, w: 450, rot: -1 },
      { a: 'stamp-date', x: 138, y: 300, w: 132, rot: -8 },
      { a: 'p2-wax', x: 590, y: 520, w: 104, rot: 12 },
      { a: 'deco-sparkle', x: 610, y: 880, w: 66, rot: 6 },
      { a: 'plant-clover', x: 122, y: 860, w: 92, rot: -10 },
    ],
    undefined,
    '主题',
  ),

  scene(
    'anniv',
    '纪念日',
    '拱形相框，收一张合照',
    { type: 'plain', color: '#FBF0DC', tex: tex('pack-tex-08') },
    [
      { a: 'tape-wave', x: 356, y: 88, w: 250, rot: -2 },
      { a: 'frame-arch', x: 240, y: 374, w: 250, rot: -2 },
      { a: 'note-polaroid', x: 486, y: 470, w: 268, rot: 4 },
      { a: 'deco-heart', x: 128, y: 300, w: 96, rot: -10 },
      { a: 'pro-label-love', x: 566, y: 726, w: 176, rot: 8 },
      { a: 'd3-cake', x: 168, y: 720, w: 160, rot: -6 },
      { a: 'deco-sparkle', x: 356, y: 900, w: 62, rot: 0 },
    ],
    undefined,
    '纪念',
  ),

  scene(
    'graduation',
    '毕业季',
    '学士帽的夏天，和朋友一起',
    { type: 'plain', color: '#EEF4EC', tex: tex('pack-tex-02') },
    [
      { a: 'tape-plain', x: 356, y: 88, w: 240, rot: 2 },
      { a: 'frame-line', x: 356, y: 330, w: 420, rot: -1 },
      { a: 'note-polaroid', x: 250, y: 620, w: 280, rot: -3 },
      { a: 'note-torn', x: 500, y: 700, w: 300, rot: 3 },
      { a: 'stamp-post', x: 596, y: 216, w: 118, rot: 9 },
      { a: 'deco-sun', x: 126, y: 260, w: 96, rot: -8 },
      { a: 'pro-lace', x: 356, y: 900, w: 280, rot: 0, opacity: 0.85 },
      { a: 'plant-flower', x: 120, y: 880, w: 96, rot: -12 },
    ],
    undefined,
    '纪念',
  ),

  scene(
    'herbarium',
    '植物标本',
    '压好的叶子，夹进纸页里',
    { type: 'plain', color: '#FAF6EE', tex: tex('pack-tex-04') },
    [
      { a: 'tape-grid', x: 200, y: 88, w: 210, rot: -4 },
      { a: 'd3-frame', x: 356, y: 380, w: 400, rot: -1 },
      { a: 'd3-pressed', x: 268, y: 380, w: 210, rot: -2 },
      { a: 'pack-plant-11', x: 508, y: 400, w: 190, rot: 4 },
      { a: 'plant-euca', x: 596, y: 760, w: 160, rot: 14 },
      { a: 'stamp-date', x: 136, y: 724, w: 126, rot: -9 },
      { a: 'pro-label-notes', x: 356, y: 900, w: 176, rot: 0 },
    ],
    undefined,
    '主题',
  ),

  scene(
    'retro',
    '复古报刊',
    '旧报纸拼贴，黑白灰配一点红',
    { type: 'plain', color: '#F5EFE1', tex: tex('pack-tex-09') },
    [
      { a: 'pack-paper-03', x: 356, y: 330, w: 500, rot: -1, opacity: 0.92 },
      { a: 'd3-magazine', x: 356, y: 300, w: 440, rot: 1 },
      { a: 'd3-frame', x: 356, y: 700, w: 460, rot: -1 },
      { a: 'pack-stamp-01', x: 596, y: 176, w: 140, rot: 8 },
      { a: 'p2-postmark', x: 150, y: 196, w: 150, rot: -10 },
      { a: 'tape-plain', x: 356, y: 88, w: 230, rot: 2 },
      { a: 'stamp-wreath', x: 132, y: 880, w: 118, rot: -8 },
    ],
    undefined,
    '主题',
  ),

  scene(
    'minimal',
    '极简留白',
    '只留一点线和一枚章',
    { type: 'plain', color: '#FBF7F0' },
    [
      { a: 'tape-plain', x: 356, y: 76, w: 200, rot: 0 },
      { a: 'frame-line', x: 356, y: 470, w: 500, rot: 0 },
      { a: 'stamp-date', x: 596, y: 214, w: 112, rot: 6 },
      { a: 'deco-sparkle', x: 126, y: 880, w: 60, rot: 0 },
    ],
    undefined,
    '排版',
  ),

  scene(
    'receipts',
    '票据收藏',
    '电影票、车票、小票都留着',
    { type: 'plain', color: '#F8F0E2', tex: tex('pack-tex-09') },
    [
      { a: 'tape-plain', x: 356, y: 86, w: 230, rot: -3 },
      { a: 'pack-receipt-01', x: 232, y: 340, w: 300, rot: -3 },
      { a: 'pack-receipt-03', x: 480, y: 420, w: 300, rot: 4 },
      { a: 'pro-ticket', x: 356, y: 700, w: 330, rot: 1 },
      { a: 'p2-ticket', x: 156, y: 640, w: 180, rot: -8 },
      { a: 'stamp-date', x: 600, y: 726, w: 126, rot: 10 },
      { a: 'deco-sparkle', x: 128, y: 892, w: 62, rot: -6 },
    ],
    undefined,
    '主题',
  ),

]

/** 模板面板的分类顺序（不填 tag 的场景归到「经典」） */
export const TEMPLATE_TAGS = ['经典', '计划', '记录', '主题', '纪念', '排版']

export function tagOf(sceneDef: SceneDef): string {
  return sceneDef.tag ?? '经典'
}

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
