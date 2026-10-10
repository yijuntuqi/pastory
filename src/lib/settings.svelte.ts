import type { Feel, InkTool } from './ink'

const KEY = 'pastory.settings.v1'

interface Stored {
  depth?: boolean
  motion?: boolean
  tilt?: boolean
  tool?: InkTool
  inkColor?: string
  inkSize?: number
  fingerDraw?: boolean
  smooth?: number
  speedInfluence?: number
  jitter?: number
  nib?: number
}

const TOOLS: InkTool[] = ['pen', 'pencil', 'marker', 'highlighter', 'doodle', 'eraser']

function num(v: unknown, lo: number, hi: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : fallback
}

function read(): Stored {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Stored
  } catch {
    return {}
  }
}

/**
 * 全局开关：立体效果、动效、整页 3D 透视，以及手写笔刷与笔迹手感偏好。
 * 全部自动保存，下次打开保持上次的选择。
 */
class Settings {
  /** 立体效果总开关：刀模白边、纸纹和轻投影；关掉回到纯平贴纸，也省一点渲染 */
  depth = $state(true)
  /** 动效总开关：弹入弹出、循环动效；删掉大素材卡顿时可以关掉 */
  motion = $state(true)
  /** 整页 3D 透视倾斜，默认关闭，避免影响导出时的观感 */
  tilt = $state(false)

  /** 当前手写工具：钢笔 / 铅笔 / 马克笔 / 荧光笔 / 涂鸦笔 / 橡皮 */
  tool = $state<InkTool>('pen')
  /** 当前墨色 */
  inkColor = $state('#2b2b2b')
  /** 笔刷大小倍率 */
  inkSize = $state(1)
  /** 手指也能画；默认关闭，防止手掌压在屏幕上误触 */
  fingerDraw = $state(false)

  /** 笔迹手感：平滑强度 0..100 */
  smooth = $state(50)
  /** 笔迹手感：速度影响强度 0..100 */
  speedInfluence = $state(55)
  /** 笔迹手感：手抖幅度 0..100 */
  jitter = $state(50)
  /** 笔迹手感：笔锋倾斜角（度，-45..45） */
  nib = $state(18)

  constructor() {
    const s = read()
    if (typeof s.depth === 'boolean') this.depth = s.depth
    if (typeof s.motion === 'boolean') this.motion = s.motion
    if (typeof s.tilt === 'boolean') this.tilt = s.tilt
    if (s.tool && TOOLS.includes(s.tool)) this.tool = s.tool
    if (typeof s.inkColor === 'string') this.inkColor = s.inkColor
    if (typeof s.inkSize === 'number' && s.inkSize > 0) this.inkSize = s.inkSize
    if (typeof s.fingerDraw === 'boolean') this.fingerDraw = s.fingerDraw
    this.smooth = num(s.smooth, 0, 100, 50)
    this.speedInfluence = num(s.speedInfluence, 0, 100, 55)
    this.jitter = num(s.jitter, 0, 100, 50)
    this.nib = num(s.nib, -45, 45, 18)
  }

  /** 当前笔迹手感（渲染笔迹时使用） */
  get feel(): Feel {
    return { smooth: this.smooth, speed: this.speedInfluence, jitter: this.jitter, nib: this.nib }
  }

  toggleDepth() {
    this.depth = !this.depth
    this.persist()
  }

  toggleMotion() {
    this.motion = !this.motion
    this.persist()
  }

  toggleTilt() {
    this.tilt = !this.tilt
    this.persist()
  }

  setTool(t: InkTool) {
    this.tool = t
    this.persist()
  }

  setInkColor(c: string) {
    this.inkColor = c
    this.persist()
  }

  setInkSize(n: number) {
    this.inkSize = Math.max(0.4, Math.min(2.5, n))
    this.persist()
  }

  toggleFinger() {
    this.fingerDraw = !this.fingerDraw
    this.persist()
  }

  setSmooth(n: number) {
    this.smooth = num(n, 0, 100, this.smooth)
    this.persist()
  }

  setSpeedInfluence(n: number) {
    this.speedInfluence = num(n, 0, 100, this.speedInfluence)
    this.persist()
  }

  setJitter(n: number) {
    this.jitter = num(n, 0, 100, this.jitter)
    this.persist()
  }

  setNib(n: number) {
    this.nib = num(n, -45, 45, this.nib)
    this.persist()
  }

  /** 手感复位到默认值 */
  resetFeel() {
    this.smooth = 50
    this.speedInfluence = 55
    this.jitter = 50
    this.nib = 18
    this.persist()
  }

  private persist() {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          depth: this.depth,
          motion: this.motion,
          tilt: this.tilt,
          tool: this.tool,
          inkColor: this.inkColor,
          inkSize: this.inkSize,
          fingerDraw: this.fingerDraw,
          smooth: this.smooth,
          speedInfluence: this.speedInfluence,
          jitter: this.jitter,
          nib: this.nib,
        }),
      )
    } catch {
      /* 存不下就算了 */
    }
  }
}

export const settings = new Settings()
