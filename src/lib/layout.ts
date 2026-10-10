/**
 * 基础排布（对齐 / 等距 / 网格对齐）。
 *
 * 只做设计软件里那套最常用的：拿选中元素的中心点与宽高算目标位置，
 * 不读版式语义、不做智能构图。元素坐标系和 Item 一致（x/y 是中心点，单位页面像素）。
 * 旋转过的元素按未旋转的外框参与计算，符合大家用对齐工具时的预期。
 */
import type { Item } from './types'

export type LayoutOp =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'hcenter'
  | 'vcenter'
  | 'hdist'
  | 'vdist'
  | 'grid'

export interface LayoutOpDef {
  op: LayoutOp
  name: string
  /** 按钮上的短标记（不依赖图标字体，任何环境都能显示） */
  glyph: string
  hint: string
}

export const LAYOUT_OPS: LayoutOpDef[] = [
  { op: 'left', name: '左对齐', glyph: '\u219E', hint: '把选中元素的最左边对齐到最靠左的那个' },
  { op: 'hcenter', name: '水平居中', glyph: '\u21D4', hint: '把选中元素的水平中心对齐到同一条竖线' },
  { op: 'right', name: '右对齐', glyph: '\u21A0', hint: '把选中元素的最右边对齐到最靠右的那个' },
  { op: 'top', name: '上对齐', glyph: '\u219F', hint: '把选中元素的最上边对齐到最靠上的那个' },
  { op: 'vcenter', name: '垂直居中', glyph: '\u21D5', hint: '把选中元素的垂直中心对齐到同一条横线' },
  { op: 'bottom', name: '下对齐', glyph: '\u21A1', hint: '把选中元素的最下边对齐到最靠下的那个' },
  { op: 'hdist', name: '水平等距', glyph: '\u2261', hint: '保持首尾不动，中间元素的水平间距均分' },
  { op: 'vdist', name: '垂直等距', glyph: '\u2263', hint: '保持首尾不动，中间元素的垂直间距均分' },
  { op: 'grid', name: '网格对齐', glyph: '\u25A6', hint: '把元素吸附到 20px 网格' },
]

/** 网格吸附步长（页面像素） */
export const GRID_STEP = 20

function snap(v: number): number {
  return Math.round(v / GRID_STEP) * GRID_STEP
}

/**
 * 就地修改传进来的元素（调用方负责先记一条撤销）。
 * items 少于两个时除网格对齐外都不产生效果。
 */
export function applyLayout(items: Item[], op: LayoutOp): void {
  if (items.length === 0) return

  if (op === 'grid') {
    for (const it of items) {
      it.x = snap(it.x)
      it.y = snap(it.y)
    }
    return
  }

  if (items.length < 2) return

  if (op === 'left') {
    const t = Math.min(...items.map((i) => i.x - i.w / 2))
    for (const i of items) i.x = t + i.w / 2
    return
  }
  if (op === 'right') {
    const t = Math.max(...items.map((i) => i.x + i.w / 2))
    for (const i of items) i.x = t - i.w / 2
    return
  }
  if (op === 'top') {
    const t = Math.min(...items.map((i) => i.y - i.h / 2))
    for (const i of items) i.y = t + i.h / 2
    return
  }
  if (op === 'bottom') {
    const t = Math.max(...items.map((i) => i.y + i.h / 2))
    for (const i of items) i.y = t - i.h / 2
    return
  }
  if (op === 'hcenter') {
    const t = items.reduce((s, i) => s + i.x, 0) / items.length
    for (const i of items) i.x = t
    return
  }
  if (op === 'vcenter') {
    const t = items.reduce((s, i) => s + i.y, 0) / items.length
    for (const i of items) i.y = t
    return
  }

  // 等距：首尾元素不动，中间元素按「边到边」的间隙均分
  const horizontal = op === 'hdist'
  const sorted = [...items].sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const startEdge = horizontal ? first.x - first.w / 2 : first.y - first.h / 2
  const endEdge = horizontal ? last.x + last.w / 2 : last.y + last.h / 2
  const span = endEdge - startEdge
  const total = sorted.reduce((s, i) => s + (horizontal ? i.w : i.h), 0)
  const gap = (span - total) / (sorted.length - 1)
  let cursor = startEdge
  for (const i of sorted) {
    const size = horizontal ? i.w : i.h
    if (horizontal) i.x = cursor + size / 2
    else i.y = cursor + size / 2
    cursor += size + gap
  }
}
