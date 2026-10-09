const KEY = 'pastory.settings.v1'

interface Stored {
  depth?: boolean
  motion?: boolean
  tilt?: boolean
}

function read(): Stored {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Stored
  } catch {
    return {}
  }
}

/**
 * 全局开关：立体效果、动效、整页 3D 透视。
 * 全部跟着自动保存，下次打开保持上次的选择。
 */
class Settings {
  /** 立体效果总开关：白边、纸张厚度、投影；关掉导出更干净、也更省电 */
  depth = $state(true)
  /** 动效总开关：拖入弹入、循环动效、删除淡出；关掉后立即静止 */
  motion = $state(true)
  /** 整页 3D 透视倾斜，默认关闭（开着会影响导出时的观感） */
  tilt = $state(false)

  constructor() {
    const s = read()
    if (typeof s.depth === 'boolean') this.depth = s.depth
    if (typeof s.motion === 'boolean') this.motion = s.motion
    if (typeof s.tilt === 'boolean') this.tilt = s.tilt
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

  private persist() {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ depth: this.depth, motion: this.motion, tilt: this.tilt }),
      )
    } catch {
      /* 存不上就算了 */
    }
  }
}

export const settings = new Settings()
