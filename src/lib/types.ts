import type { LoopId } from './look'

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
}

export interface TemplateDef {
  id: string
  name: string
  hint: string
}
