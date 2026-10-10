import type { LoopId } from './look'
import type { FontId } from './fonts'

export type BrushId = 'pen' | 'pencil' | 'marker' | 'highlighter' | 'doodle'

/** 手写笔迹上的一个采样点 */
export interface InkPoint {
  x: number
  y: number
  /**
   * 宽度驱动值 0..1：有压感的笔（Apple Pencil）直接存压力；
   * 鼠标 / 普通手指没有压力，按速度估算后存进来（快细慢粗）。
   */
  p: number
}

/** 一条手写笔迹：矢量数据，可参与撤销，导出任意倍率都清晰 */
export interface Stroke {
  id: string
  brush: BrushId
  color: string
  /** 基础线宽（页面像素），未乘宽度驱动系数 */
  width: number
  points: InkPoint[]
}

export type TextAlign = 'left' | 'center' | 'right'

/**
 * 纸面上的一个元素。默认是素材贴纸（asset 指向 ASSETS 里的素材）；
 * type === 'text' 时是文字项，文字全部以矢量数据存下来，导出任意倍率都清晰。
 * 文字和贴纸共用同一个 items 数组，因此共用同一套图层顺序、撤销、复制和删除。
 */
export interface Item {
  id: string
  /** 素材 id，对应 assets.ts 里的 ASSETS；文字项为空串 */
  asset: string
  /** 中心点坐标，单位是页面像素 */
  x: number
  y: number
  /** 尺寸，单位是页面像素；文字项的 h 由排版自动算出来 */
  w: number
  h: number
  /** 旋转角度，单位度 */
  rot: number
  /** 是否水平翻转 */
  flip?: boolean
  opacity?: number
  /** 贴纸质感：白边刀模 + 轻投影；未设置时按素材分类取默认 */
  sticker?: boolean
  /** 层级，越小越靠下 */
  z: number
  /** 循环动效：breath 呼吸 / sway 摇摆 / float 漂浮；不设置表示不动 */
  loop?: LoopId

  // ---- 以下字段只有文字项（type === 'text'）会用 ----
  type?: 'text'
  /** 纯文本内容，换行用 \n */
  text?: string
  /** 字体 id，见 fonts.ts */
  font?: FontId
  /** 字号（页面像素） */
  size?: number
  /** 字色 */
  color?: string
  bold?: boolean
  italic?: boolean
  /** 字距（页面像素），可为负 */
  letter?: number
  /** 行距倍数 */
  lineH?: number
  align?: TextAlign
  /** 描边颜色（描边宽度为 0 时不画） */
  strokeColor?: string
  /** 描边宽度（页面像素） */
  strokeWidth?: number
  /** 是否加投影 */
  shadow?: boolean
  /** 文字底色块颜色；null / 不设置表示没有底色 */
  bgColor?: string | null
  /** 底色块内边距（页面像素） */
  bgPad?: number
}

/** 是不是文字项 */
export function isText(item: Item): boolean {
  return item.type === 'text'
}

export type BgType = 'plain' | 'dots' | 'grid' | 'lined'

export interface PageDoc {
  id: string
  name: string
  width: number
  height: number
  bg: {
    type: BgType
    color: string
    /** 纸面底纹素材（public 下的相对 URL） */
    tex?: string
  }
  items: Item[]
  /** 手写墨迹层：纸面之上、贴纸之下（除非打开「墨迹置顶」） */
  strokes: Stroke[]
  /** 墨迹是否压在所有贴纸之上 */
  inkTop?: boolean
}

export interface TemplateDef {
  id: string
  name: string
  hint: string
  /** 墨色提示：深色纸面的模板（如星空）会提醒用浅色墨水 */
  inkTip?: string
}
