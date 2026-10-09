<script lang="ts">
  import { ASSET_MAP, assetUrl } from './assets'
  import type { Editor } from './editor.svelte'
  import type { Item } from './types'

  let { editor }: { editor: Editor } = $props()

  const MIN_Z = 0.2
  const MAX_Z = 4
  const MIN_SIZE = 24
  const MAX_SIZE = 2400

  let zoom = $state(1)
  let panX = $state(0)
  let panY = $state(0)
  let viewport = $state<HTMLDivElement | null>(null)
  let stageEl = $state<HTMLDivElement | null>(null)

  type Mode = 'idle' | 'move' | 'scale' | 'rotate' | 'pan' | 'pinch'
  let mode: Mode = $state('idle')
  const pts = new Map<number, { x: number; y: number }>()

  let d = {
    id: '',
    px: 0,
    py: 0,
    x0: 0,
    y0: 0,
    w0: 0,
    h0: 0,
    rot0: 0,
    cx: 0,
    cy: 0,
    v0: 1,
    a0: 0,
    panX0: 0,
    panY0: 0,
    zoom0: 1,
    dist0: 1,
    midX0: 0,
    midY0: 0,
  }

  function clamp(v: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, v))
  }

  function toPage(cx: number, cy: number) {
    const el = stageEl
    if (!el) return { x: 0, y: 0 }
    const r = el.getBoundingClientRect()
    return { x: (cx - r.left) / zoom, y: (cy - r.top) / zoom }
  }

  function hit(p: { x: number; y: number }): Item | null {
    const items = [...editor.page.items].sort((a, b) => b.z - a.z)
    for (const it of items) {
      const dx = p.x - it.x
      const dy = p.y - it.y
      const a = (-it.rot * Math.PI) / 180
      const lx = dx * Math.cos(a) - dy * Math.sin(a)
      const ly = dx * Math.sin(a) + dy * Math.cos(a)
      if (Math.abs(lx) <= it.w / 2 && Math.abs(ly) <= it.h / 2) return it
    }
    return null
  }

  export function fit() {
    const el = viewport
    if (!el) return
    const vw = el.clientWidth
    const vh = el.clientHeight
    const pw = editor.page.width
    const ph = editor.page.height
    const z = clamp(Math.min((vw - 40) / pw, (vh - 40) / ph), MIN_Z, MAX_Z)
    zoom = z
    panX = (vw - pw * z) / 2
    panY = (vh - ph * z) / 2
  }

  $effect(() => {
    const el = viewport
    if (!el) return
    fit()
    const ro = new ResizeObserver(() => fit())
    ro.observe(el)
    return () => ro.disconnect()
  })

  function mid() {
    const list = [...pts.values()]
    const a = list[0]
    const b = list[1]
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }

  function dist() {
    const list = [...pts.values()]
    const a = list[0]
    const b = list[1]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function onDown(e: PointerEvent) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return
    e.preventDefault()
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pts.size === 2) {
      const m = mid()
      d.zoom0 = zoom
      d.panX0 = panX
      d.panY0 = panY
      d.dist0 = Math.max(1, dist())
      d.midX0 = m.x
      d.midY0 = m.y
      mode = 'pinch'
      return
    }
    if (pts.size > 2) return

    const p = toPage(e.clientX, e.clientY)
    const it = hit(p)
    if (it) {
      editor.selected = it.id
      mode = 'move'
      d.id = it.id
      d.px = p.x
      d.py = p.y
      d.x0 = it.x
      d.y0 = it.y
    } else {
      editor.selected = null
      mode = 'pan'
      d.px = e.clientX
      d.py = e.clientY
      d.panX0 = panX
      d.panY0 = panY
    }
  }

  function onScaleDown(e: PointerEvent) {
    e.stopPropagation()
    e.preventDefault()
    const it = editor.selectedItem
    if (!it) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const p = toPage(e.clientX, e.clientY)
    const dx = p.x - it.x
    const dy = p.y - it.y
    d.id = it.id
    d.w0 = it.w
    d.h0 = it.h
    d.cx = it.x
    d.cy = it.y
    d.v0 = Math.max(1, Math.hypot(dx, dy))
    mode = 'scale'
    editor.mark()
  }

  function onRotateDown(e: PointerEvent) {
    e.stopPropagation()
    e.preventDefault()
    const it = editor.selectedItem
    if (!it) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const p = toPage(e.clientX, e.clientY)
    d.id = it.id
    d.cx = it.x
    d.cy = it.y
    d.rot0 = it.rot
    d.a0 = (Math.atan2(p.y - it.y, p.x - it.x) * 180) / Math.PI
    mode = 'rotate'
    editor.mark()
  }

  function onMove(e: PointerEvent) {
    if (!pts.has(e.pointerId)) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (mode === 'pinch' && pts.size >= 2) {
      const f = dist() / d.dist0
      const z = clamp(d.zoom0 * f, MIN_Z, MAX_Z)
      const m = mid()
      zoom = z
      panX = m.x - (d.midX0 - d.panX0) * (z / d.zoom0)
      panY = m.y - (d.midY0 - d.panY0) * (z / d.zoom0)
      return
    }

    if (mode === 'pan') {
      panX = d.panX0 + (e.clientX - d.px)
      panY = d.panY0 + (e.clientY - d.py)
      return
    }

    const it = editor.page.items.find((i) => i.id === d.id)
    if (!it) return
    const p = toPage(e.clientX, e.clientY)

    if (mode === 'move') {
      it.x = d.x0 + (p.x - d.px)
      it.y = d.y0 + (p.y - d.py)
    } else if (mode === 'scale') {
      const v = Math.hypot(p.x - d.cx, p.y - d.cy)
      const f = v / d.v0
      it.w = clamp(d.w0 * f, MIN_SIZE, MAX_SIZE)
      it.h = clamp(d.h0 * f, MIN_SIZE, MAX_SIZE)
    } else if (mode === 'rotate') {
      const a = (Math.atan2(p.y - d.cy, p.x - d.cx) * 180) / Math.PI
      it.rot = Math.round(d.rot0 + (a - d.a0))
    }
  }

  function onUp(e: PointerEvent) {
    if (!pts.has(e.pointerId)) return
    pts.delete(e.pointerId)
    if (pts.size === 0) {
      if (mode !== 'idle') editor.save()
      mode = 'idle'
    } else if (pts.size === 1) {
      const last = [...pts.values()][0]
      d.px = last.x
      d.py = last.y
      d.panX0 = panX
      d.panY0 = panY
      mode = 'pan'
    }
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const el = viewport
    if (!el) return
    const r = el.getBoundingClientRect()
    const mx = e.clientX - r.left
    const my = e.clientY - r.top
    const z = clamp(zoom * (e.deltaY < 0 ? 1.08 : 0.93), MIN_Z, MAX_Z)
    panX = mx - (mx - panX) * (z / zoom)
    panY = my - (my - panY) * (z / zoom)
    zoom = z
  }

  const sel = $derived(editor.selectedItem)
  const hs = $derived(Math.round(16 / Math.max(zoom, 0.3)))
</script>

<svelte:window on:pointermove={onMove} on:pointerup={onUp} on:pointercancel={onUp} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="viewport" bind:this={viewport} onwheel={onWheel}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="stage"
    bind:this={stageEl}
    onpointerdown={onDown}
    style="width:{editor.page.width}px; height:{editor.page.height}px; background:{editor.page
      .bg.color}; transform: translate({panX}px, {panY}px) scale({zoom});"
  >
    {#if editor.page.bg.type === 'dots'}
      <div class="bg bg-dots"></div>
    {:else if editor.page.bg.type === 'grid'}
      <div class="bg bg-grid"></div>
    {:else if editor.page.bg.type === 'lined'}
      <div class="bg bg-lined"></div>
    {/if}

    {#each editor.page.items as item (item.id)}
      <img
        class="item"
        src={assetUrl(ASSET_MAP[item.asset])}
        alt=""
        draggable="false"
        style="left:{item.x}px; top:{item.y}px; width:{item.w}px; height:{item.h}px; opacity:{item
          .opacity ?? 1}; z-index:{item.z}; transform: translate(-50%, -50%) rotate({item.rot}deg) scaleX({item
          .flip
          ? -1
          : 1});"
      />
    {/each}

    {#if sel}
      <div
        class="sel-box"
        style="left:{sel.x}px; top:{sel.y}px; width:{sel.w}px; height:{sel.h}px; transform: translate(-50%, -50%) rotate({sel
          .rot}deg); z-index:{sel.z + 1}; border-width:{Math.max(1, 1.5 / zoom)}px;"
      >
        <button
          class="handle rotate"
          aria-label="旋转"
          style="width:{hs}px; height:{hs}px; top:{-hs}px; left:calc(50% - {hs / 2}px); transform: rotate({-sel
            .rot}deg);"
          onpointerdown={onRotateDown}
        ></button>
        <button
          class="handle scale"
          aria-label="缩放"
          style="width:{hs}px; height:{hs}px; right:{-hs / 2}px; bottom:{-hs / 2}px; transform: rotate({-sel
            .rot}deg);"
          onpointerdown={onScaleDown}
        ></button>
      </div>
    {/if}
  </div>
</div>

<style>
  .viewport {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    touch-action: none;
    background: var(--paper-3);
  }

  .stage {
    position: absolute;
    left: 0;
    top: 0;
    transform-origin: 0 0;
    box-shadow: var(--shadow-md);
    border-radius: 4px;
    overflow: hidden;
    will-change: transform;
  }

  .bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .bg-dots {
    background-image: radial-gradient(#d6cbb8 1.6px, transparent 1.6px);
    background-size: 32px 32px;
    background-position: 8px 8px;
  }

  .bg-grid {
    background-image: linear-gradient(#d6cbb8 1px, transparent 1px),
      linear-gradient(90deg, #d6cbb8 1px, transparent 1px);
    background-size: 32px 32px;
  }

  .bg-lined {
    background-image: linear-gradient(#d6cbb8 1px, transparent 1px);
    background-size: 100% 36px;
    background-position: 0 48px;
  }

  .item {
    position: absolute;
    pointer-events: none;
    user-select: none;
    -webkit-user-drag: none;
  }

  .sel-box {
    position: absolute;
    border: 1.5px dashed var(--terra);
    pointer-events: none;
  }

  .handle {
    position: absolute;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--terra);
    pointer-events: auto;
    touch-action: none;
    box-shadow: 0 1px 4px rgba(58, 51, 44, 0.2);
  }

  .handle.rotate {
    border-color: var(--sage);
  }
</style>
