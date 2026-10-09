<script lang="ts">
  import { itemSrc } from './user-assets.svelte'
  import { itemFilter, paperOn } from './sticker'
  import { settings } from './settings.svelte'
  import { PAPER_TEX_ALPHA, paperClip, paperEdge } from './look'
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

  // 把屏幕坐标换算成画布坐标（复用本组件的 zoom / pan，不另建一套状态），
  // 注册给 editor，供素材栏拖拽时判断落点。
  $effect(() => {
    const el = stageEl
    if (!el) return
    editor.setDropResolver((cx, cy) => {
      const r = el.getBoundingClientRect()
      const x = (cx - r.left) / zoom
      const y = (cy - r.top) / zoom
      if (x < 0 || y < 0 || x > editor.page.width || y > editor.page.height) return null
      return { x, y }
    })
    return () => editor.setDropResolver(null)
  })

  // ---- 动效：全在单个素材元素上做，不动画布容器 ----
  /** 刚刚落下的素材：播一次弹入 */
  let popId = $state<string | null>(null)
  /** 被删掉 / 撤销掉的素材：淡出一下再移除 */
  let ghosts = $state<{ key: string; item: Item }[]>([])
  let ghostSeq = 0
  let prevItems: Item[] = []

  function loopClass(item: Item): string {
    if (!settings.motion || !item.loop) return ''
    return 'm-' + item.loop
  }

  $effect(() => {
    const id = editor.lastAdded
    if (!id || !settings.motion) return
    popId = id
    const t = setTimeout(() => {
      if (popId === id) popId = null
    }, 240)
    return () => clearTimeout(t)
  })

  $effect(() => {
    const current = editor.page.items
    const ids = new Set(current.map((i) => i.id))
    const prev = prevItems
    prevItems = current.map((i) => ({ ...i }) as Item)
    if (!settings.motion) {
      if (ghosts.length) ghosts = []
      return
    }
    for (const old of prev) {
      if (ids.has(old.id)) continue
      ghostSeq += 1
      const key = 'g' + ghostSeq
      ghosts.push({ key, item: old })
      setTimeout(() => {
        ghosts = ghosts.filter((g) => g.key !== key)
      }, 260)
    }
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

{#snippet visual(item: Item, cls: string, active: boolean)}
  <div class="looper {cls}" style="filter:{itemFilter(item, { depth: settings.depth, active })};">
    {#if paperOn(item)}
      <div
        class="paper"
        style="clip-path:{paperClip(item.id)}; padding:{paperEdge(item.w, item.h)}px;"
      >
        <img class="photo" src={itemSrc(item.asset)} alt="" draggable="false" />
        <span class="sheen"></span>
      </div>
    {:else}
      <img class="plain" src={itemSrc(item.asset)} alt="" draggable="false" />
    {/if}
  </div>
{/snippet}

<svelte:window on:pointermove={onMove} on:pointerup={onUp} on:pointercancel={onUp} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="viewport" class:tilt={settings.tilt} bind:this={viewport} onwheel={onWheel}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="stage"
    class:dropping={!!editor.drag?.over}
    class:no-motion={!settings.motion}
    bind:this={stageEl}
    onpointerdown={onDown}
    style="width:{editor.page.width}px; height:{editor.page.height}px; background:{editor.page
      .bg.color}; transform: translate({panX}px, {panY}px) scale({zoom}){settings.tilt
      ? ' translate(50%, 50%) rotateX(7deg) rotateY(-4deg) translate(-50%, -50%)'
      : ''};"
  >
    {#if editor.page.bg.tex}
      <div
        class="bg bg-tex"
        style="background-image:url('{editor.page.bg.tex}'); opacity:{PAPER_TEX_ALPHA};"
      ></div>
    {/if}

    {#if editor.page.bg.type === 'dots'}
      <div class="bg bg-dots"></div>
    {:else if editor.page.bg.type === 'grid'}
      <div class="bg bg-grid"></div>
    {:else if editor.page.bg.type === 'lined'}
      <div class="bg bg-lined"></div>
    {/if}

    <div class="grain"></div>

    {#each editor.page.items as item (item.id)}
      <div
        class="item"
        style="left:{item.x}px; top:{item.y}px; width:{item.w}px; height:{item.h}px; opacity:{item
          .opacity ?? 1}; z-index:{item.z}; transform: translate(-50%, -50%) rotate({item.rot}deg) scaleX({item
          .flip ? -1 : 1}) scale({editor.selected === item.id ? 1.04 : 1});"
      >
        <div class="pop" class:on={popId === item.id}>
          {@render visual(item, loopClass(item), editor.selected === item.id)}
        </div>
      </div>
    {/each}

    {#each ghosts as g (g.key)}
      <div
        class="item gone"
        style="left:{g.item.x}px; top:{g.item.y}px; width:{g.item.w}px; height:{g.item.h}px; opacity:{g
          .item.opacity ?? 1}; z-index:{g.item.z}; transform: translate(-50%, -50%) rotate({g.item
          .rot}deg) scaleX({g.item.flip ? -1 : 1});"
      >
        {@render visual(g.item, '', false)}
      </div>
    {/each}

    {#if editor.drag?.over}
      <div class="drop-hint" style="left:{editor.drag.pageX}px; top:{editor.drag.pageY}px;"></div>
    {/if}

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

  /* 整页 3D 透视：默认关闭，开着会影响导出观感 */
  .viewport.tilt {
    perspective: 1400px;
    perspective-origin: 50% 40%;
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

  /* 拖拽悬停时给纸面描边高亮 */
  .stage.dropping {
    box-shadow: var(--shadow-md), 0 0 0 3px var(--terra);
  }

  .bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .bg-tex {
    background-size: cover;
    background-position: center;
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
    transition: transform 0.16s ease;
  }

  .pop,
  .looper,
  .paper,
  .plain {
    width: 100%;
    height: 100%;
  }

  .pop {
    position: relative;
  }

  /* 落下时的弹入：啪地贴上去，约 200ms */
  .pop.on {
    animation: pop-in 200ms cubic-bezier(0.2, 1.4, 0.5, 1);
  }

  .looper {
    position: relative;
    transition: filter 0.16s ease;
  }

  .plain {
    display: block;
    object-fit: contain;
  }

  /* 位图贴纸的纸片外观：白边是 padding 撑出来的，剪边靠上面的 clip-path */
  .paper {
    position: relative;
    background: #fff;
  }

  .photo {
    display: block;
    object-fit: cover;
  }

  .sheen {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.28),
      rgba(255, 255, 255, 0) 42%,
      rgba(58, 51, 44, 0.1)
    );
  }

  /* 循环动效：只动 transform，不碰会触发重排的属性 */
  .looper.m-breath {
    animation: loop-breath 3.2s ease-in-out infinite;
  }

  .looper.m-sway {
    animation: loop-sway 2.6s ease-in-out infinite;
  }

  .looper.m-float {
    animation: loop-float 3.6s ease-in-out infinite;
  }

  @keyframes pop-in {
    0% {
      transform: scale(1.16);
      opacity: 0.45;
    }

    60% {
      transform: scale(0.975);
      opacity: 1;
    }

    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes loop-breath {
    0%,
    100% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.04);
    }
  }

  @keyframes loop-sway {
    0%,
    100% {
      transform: rotate(-2.5deg);
    }

    50% {
      transform: rotate(2.5deg);
    }
  }

  @keyframes loop-float {
    0%,
    100% {
      transform: translateY(-2.5px);
    }

    50% {
      transform: translateY(2.5px);
    }
  }

  /* 删除 / 撤销时的淡出 */
  .item.gone {
    animation: ghost-out 220ms ease forwards;
  }

  @keyframes ghost-out {
    from {
      opacity: 1;
    }

    to {
      opacity: 0;
    }
  }

  /* 动效总开关：立刻安静 */
  .stage.no-motion .item,
  .stage.no-motion .pop,
  .stage.no-motion .looper {
    animation: none !important;
    transition: none !important;
  }

  /* 落点提示：拖拽经过画布时显示十字定位点 */
  .drop-hint {
    position: absolute;
    width: 34px;
    height: 34px;
    margin: -17px 0 0 -17px;
    pointer-events: none;
    z-index: 99999;
    border-radius: 50%;
    border: 1px dashed var(--terra);
    background: rgba(201, 123, 99, 0.14);
  }

  .drop-hint::before,
  .drop-hint::after {
    content: '';
    position: absolute;
    background: var(--terra);
  }

  .drop-hint::before {
    left: 50%;
    top: 5px;
    bottom: 5px;
    width: 1px;
    margin-left: -0.5px;
  }

  .drop-hint::after {
    top: 50%;
    left: 5px;
    right: 5px;
    height: 1px;
    margin-top: -0.5px;
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

  .grain {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image: radial-gradient(rgba(60, 48, 32, 0.05) 1px, transparent 1px);
    background-size: 3px 3px;
  }
</style>
