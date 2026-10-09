<script lang="ts">
  let {
    src,
    onconfirm,
    oncancel,
  }: {
    src: string
    onconfirm: (out: { src: string; w: number; h: number }) => void
    oncancel: () => void
  } = $props()

  const MIN = 40
  const MAX_SIDE = 1400

  type Dir = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
  const DIRS: Dir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

  let frameEl = $state<HTMLDivElement | null>(null)
  let imgEl = $state<HTMLImageElement | null>(null)
  let nat = $state({ w: 1, h: 1 })
  let disp = $state({ w: 1, h: 1 })
  let rect = $state({ x: 0, y: 0, w: 1, h: 1 })
  let busy = $state(false)
  let drag: { dir: Dir; px: number; py: number; r0: { x: number; y: number; w: number; h: number } } | null =
    null

  function fit() {
    if (!imgEl) return
    const nw = imgEl.naturalWidth || 1
    const nh = imgEl.naturalHeight || 1
    nat = { w: nw, h: nh }
    const availW = Math.max(160, Math.min(window.innerWidth - 96, 520))
    const availH = Math.max(160, Math.min(window.innerHeight - 300, 480))
    const s = Math.min(availW / nw, availH / nh, 1)
    disp = { w: Math.max(60, Math.round(nw * s)), h: Math.max(60, Math.round(nh * s)) }
    rect = { x: 0, y: 0, w: disp.w, h: disp.h }
  }

  function pos(e: PointerEvent) {
    const b = frameEl?.getBoundingClientRect()
    if (!b) return { x: 0, y: 0 }
    return { x: e.clientX - b.left, y: e.clientY - b.top }
  }

  function down(e: PointerEvent, dir: Dir) {
    e.preventDefault()
    e.stopPropagation()
    const p = pos(e)
    drag = { dir, px: p.x, py: p.y, r0: { ...rect } }
    const el = e.currentTarget as HTMLElement
    if (el.setPointerCapture) el.setPointerCapture(e.pointerId)
  }

  function move(e: PointerEvent) {
    if (!drag) return
    e.preventDefault()
    const p = pos(e)
    const dx = p.x - drag.px
    const dy = p.y - drag.py
    const r = { ...drag.r0 }
    if (drag.dir === 'move') {
      r.x = Math.min(Math.max(0, r.x + dx), disp.w - r.w)
      r.y = Math.min(Math.max(0, r.y + dy), disp.h - r.h)
    } else {
      const d = drag.dir
      let x1 = r.x
      let y1 = r.y
      let x2 = r.x + r.w
      let y2 = r.y + r.h
      if (d.indexOf('w') >= 0) x1 = Math.min(Math.max(0, r.x + dx), x2 - MIN)
      if (d.indexOf('e') >= 0) x2 = Math.max(Math.min(disp.w, r.x + r.w + dx), x1 + MIN)
      if (d.indexOf('n') >= 0) y1 = Math.min(Math.max(0, r.y + dy), y2 - MIN)
      if (d.indexOf('s') >= 0) y2 = Math.max(Math.min(disp.h, r.y + r.h + dy), y1 + MIN)
      r.x = x1
      r.y = y1
      r.w = x2 - x1
      r.h = y2 - y1
    }
    rect = r
  }

  function up(e: PointerEvent) {
    drag = null
    const el = e.currentTarget as HTMLElement
    if (el.releasePointerCapture) el.releasePointerCapture(e.pointerId)
  }

  function reset() {
    rect = { x: 0, y: 0, w: disp.w, h: disp.h }
  }

  async function confirm() {
    if (busy) return
    busy = true
    try {
      const sx = nat.w / disp.w
      const sy = nat.h / disp.h
      const cw = Math.max(1, Math.round(rect.w * sx))
      const ch = Math.max(1, Math.round(rect.h * sy))
      const cap = Math.min(1, MAX_SIDE / Math.max(cw, ch))
      const w = Math.max(1, Math.round(cw * cap))
      const h = Math.max(1, Math.round(ch * cap))
      const img = new Image()
      img.src = src
      await img.decode()
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      if (!ctx) throw new Error('no ctx')
      ctx.drawImage(img, Math.round(rect.x * sx), Math.round(rect.y * sy), cw, ch, 0, 0, w, h)
      onconfirm({ src: c.toDataURL('image/png'), w, h })
    } catch {
      oncancel()
    } finally {
      busy = false
    }
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && oncancel()} />

<div class="mask" role="presentation" onclick={oncancel}>
  <div class="panel" role="dialog" aria-label="裁剪图片" onclick={(e) => e.stopPropagation()}>
    <div class="head">
      <strong>裁剪</strong>
      <span>拖动方框，只留要放进手帐的部分</span>
    </div>

    <div class="viewport">
      <div class="frame" bind:this={frameEl} style="width:{disp.w}px;height:{disp.h}px">
        <img bind:this={imgEl} {src} alt="" draggable="false" onload={fit} />
        <div
          class="crop"
          style="left:{rect.x}px;top:{rect.y}px;width:{rect.w}px;height:{rect.h}px"
          onpointerdown={(e) => down(e, 'move')}
          onpointermove={move}
          onpointerup={up}
          onpointercancel={up}
        >
          {#each DIRS as d (d)}
            <span
              class="g {d}"
              onpointerdown={(e) => down(e, d)}
              onpointermove={move}
              onpointerup={up}
              onpointercancel={up}
            ></span>
          {/each}
        </div>
      </div>
    </div>

    <div class="foot">
      <span class="size">
        {Math.max(1, Math.round(rect.w * (nat.w / disp.w)))} x {Math.max(
          1,
          Math.round(rect.h * (nat.h / disp.h)),
        )} px
      </span>
      <div class="acts">
        <button class="ghost" onclick={reset}>全选</button>
        <button class="ghost" onclick={oncancel}>取消</button>
        <button class="solid" disabled={busy} onclick={() => void confirm()}>
          {busy ? '处理中…' : '确定'}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .mask {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(24, 20, 16, 0.55);
  }

  .panel {
    width: max-content;
    max-width: 94vw;
    padding: 14px;
    border-radius: 14px;
    background: #fffdfa;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.3);
  }

  .head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding-bottom: 10px;
  }

  .head strong {
    font-size: 15px;
    color: var(--ink);
  }

  .head span {
    font-size: 12px;
    color: var(--ink-soft);
  }

  .viewport {
    position: relative;
    overflow: hidden;
    padding: 14px;
    border-radius: 10px;
    background: #efe9df;
  }

  .frame {
    position: relative;
    touch-action: none;
    line-height: 0;
    background: #fff;
  }

  .frame img {
    display: block;
    width: 100%;
    height: 100%;
    user-select: none;
    -webkit-user-drag: none;
  }

  .crop {
    position: absolute;
    box-shadow: 0 0 0 9999px rgba(18, 14, 10, 0.5);
    outline: 1px solid rgba(255, 255, 255, 0.95);
    cursor: move;
    touch-action: none;
  }

  .g {
    position: absolute;
    width: 24px;
    height: 24px;
    touch-action: none;
  }

  .g::after {
    content: '';
    position: absolute;
    inset: 7px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  }

  .nw {
    left: -12px;
    top: -12px;
    cursor: nwse-resize;
  }

  .n {
    left: 50%;
    top: -12px;
    margin-left: -12px;
    cursor: ns-resize;
  }

  .ne {
    right: -12px;
    top: -12px;
    cursor: nesw-resize;
  }

  .e {
    right: -12px;
    top: 50%;
    margin-top: -12px;
    cursor: ew-resize;
  }

  .se {
    right: -12px;
    bottom: -12px;
    cursor: nwse-resize;
  }

  .s {
    left: 50%;
    bottom: -12px;
    margin-left: -12px;
    cursor: ns-resize;
  }

  .sw {
    left: -12px;
    bottom: -12px;
    cursor: nesw-resize;
  }

  .w {
    left: -12px;
    top: 50%;
    margin-top: -12px;
    cursor: ew-resize;
  }

  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 12px;
  }

  .size {
    font-size: 12px;
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
  }

  .acts {
    display: flex;
    gap: 8px;
  }

  .ghost {
    height: 32px;
    padding: 0 14px;
    border-radius: 9px;
    font-size: 13px;
    border: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink);
  }

  .solid {
    height: 32px;
    padding: 0 18px;
    border-radius: 9px;
    font-size: 13px;
    background: var(--ink);
    color: #fff;
  }

  .solid:disabled {
    opacity: 0.55;
  }
</style>
