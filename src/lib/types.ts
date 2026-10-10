import type { LoopId } from './look'

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

export interface Item {
  id: string
  /** 素材 id，对应 assets.ts 里的 ASSETS */
  asset: string
  /** 中心点坐标，单位是页面像素 */
  x: number
  y: number
  /** 尺寸，单位是页面像素 */
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
