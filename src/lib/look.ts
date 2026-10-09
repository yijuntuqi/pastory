/**
 * 立体外观与动效的共用工具。
 *
 * 纸片轮廓用「归一化多边形」（0..1）描述：画布上用 clip-path 百分比渲染，
 * 导出时用同一组点在 canvas 里画路径，保证屏幕和导出观感一致。
 */

export const LOOP_IDS = ['breath', 'sway', 'float'] as const

export type LoopId = (typeof LOOP_IDS)[number]

export const LOOP_NAMES: { id: LoopId | ''; name: string }[] = [
  { id: '', name: '无' },
  { id: 'breath', name: '呼吸' },
  { id: 'sway', name: '摇摆' },
  { id: 'float', name: '漂浮' },
]

/** 剪边的抖动幅度（相对素材宽高），大了就像撕的，小了看不出来 */
export const PAPER_WOBBLE = 0.008

/** 纸面底纹的透明度，屏幕和导出用同一个值 */
export const PAPER_TEX_ALPHA = 0.92

/** 纸张白边宽度：跟素材尺寸走，但夹在一个好看的范围里 */
export function paperEdge(w: number, h: number): number {
  return Math.max(2, Math.min(6, Math.min(w, h) * 0.018))
}

/** 一串稳定的伪随机数：同一个 id 永远得到同一组抖动，不会每次渲染都在跳 */
function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rand(seed: string, i: number): number {
  return (hash(seed + '#' + i) % 100000) / 100000
}

/**
 * 剪下来的纸边：四条边各放几个抖动的点，围成一圈。
 * 返回归一化坐标（0..1），允许略微超出一点点，看起来才像手工剪的。
 */
export function paperOutline(seed: string): [number, number][] {
  const edges: [number, number, number, number][] = [
    [0, 0, 1, 0],
    [1, 0, 1, 1],
    [1, 1, 0, 1],
    [0, 1, 0, 0],
  ]
  const steps = 4
  const pts: [number, number][] = []
  let k = 0
  for (const [ax, ay, bx, by] of edges) {
    const dx = bx - ax
    const dy = by - ay
    // 顺时针走一圈，外法线是 (dy, -dx)
    const nx = dy
    const ny = -dx
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps + (rand(seed, k++) - 0.5) * (0.7 / steps)
      const j = (rand(seed, k++) - 0.5) * 2 * PAPER_WOBBLE
      pts.push([ax + dx * t + nx * j, ay + dy * t + ny * j])
    }
  }
  return pts
}

/** clip-path 用的多边形字符串 */
export function paperClip(seed: string): string {
  return (
    'polygon(' +
    paperOutline(seed)
      .map(([x, y]) => `${(x * 100).toFixed(3)}% ${(y * 100).toFixed(3)}%`)
      .join(', ') +
    ')'
  )
}

/**
 * 层叠错位：每一层纸片的投影方向都有一点稳定的偏差，
 * 叠在一起时就不会像一块铁板，而是纸压着纸。
 */
export function stackShadow(seed: string): string {
  const dx = ((rand(seed, 91) - 0.5) * 1.8).toFixed(2)
  const dy = (1.2 + (rand(seed, 92) - 0.5) * 1.4).toFixed(2)
  return `drop-shadow(${dx}px ${dy}px 2px rgba(58, 51, 44, 0.16))`
}
