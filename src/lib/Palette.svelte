<script lang="ts">
  import { onMount } from 'svelte'
  import { ASSETS, CATEGORIES, assetUrl, type AssetDef, type CatId } from './assets'
  import {
    userAssets,
    importFiles,
    replaceUserAsset,
    removeUserAsset,
    loadUserAssets,
    type UserAsset,
  } from './user-assets.svelte'
  import CropDialog from './CropDialog.svelte'
  import type { Editor } from './editor.svelte'

  let { editor }: { editor: Editor } = $props()

  type TabId = CatId | 'mine'

  let cat = $state<TabId>('pro')
  let tip = $state('')
  let busy = $state(false)
  let fileEl = $state<HTMLInputElement | null>(null)
  let cropId = $state<string | null>(null)

  /** 手指 / 鼠标移动超过这个距离才算拖拽 */
  const DRAG_THRESHOLD = 6

  interface Gesture {
    pointerId: number
    sx: number
    sy: number
    assetId: string
    name: string
    src: string
    isUser: boolean
    w: number
    h: number
    el: HTMLElement
    decided: boolean
    dragging: boolean
  }

  let gesture: Gesture | null = null
  let dragId = $state<string | null>(null)
  let swallowClick = false

  const builtin = $derived(cat === 'mine' ? [] : ASSETS.filter((a) => a.cat === cat))
  /** 素材包按子目录分组展示，其余分类照旧平铺 */
  const packGroups = $derived.by(() => {
    const groups: { name: string; items: AssetDef[] }[] = []
    for (const a of ASSETS) {
      if (a.cat !== 'pack') continue
      const name = a.group ?? '素材包'
      let g = groups.find((x) => x.name === name)
      if (!g) {
        g = { name, items: [] }
        groups.push(g)
      }
      g.items.push(a)
    }
    return groups
  })
  const mine = $derived([...userAssets.entries()] as [string, UserAsset][])
  const cropSrc = $derived(cropId ? (userAssets.get(cropId)?.src ?? null) : null)

  onMount(() => {
    void loadUserAssets()
  })

  function flash(text: string) {
    tip = text
    setTimeout(() => {
      if (tip === text) tip = ''
    }, 1800)
  }

  function add(id: string, name: string) {
    editor.add(id)
    flash(`已加入：${name}`)
  }

  function addMine(id: string, a: UserAsset) {
    editor.addUser(id, a.w, a.h)
    flash('已加入：我的素材')
  }

  function commitGesture(g: Gesture) {
    if (g.isUser) addMine(g.assetId, { src: g.src, w: g.w, h: g.h })
    else add(g.assetId, g.name)
  }

  function beginGesture(
    e: PointerEvent,
    data: { assetId: string; name: string; src: string; isUser: boolean; w: number; h: number },
  ) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    swallowClick = false
    gesture = {
      pointerId: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      el: e.currentTarget as HTMLElement,
      decided: false,
      dragging: false,
      ...data,
    }
  }

  function onGlobalTouchMove(e: TouchEvent) {
    if (gesture?.dragging) e.preventDefault()
  }

  function onGlobalMove(e: PointerEvent) {
    const g = gesture
    if (!g || e.pointerId !== g.pointerId) return
    const dx = e.clientX - g.sx
    const dy = e.clientY - g.sy

    if (!g.decided) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
      g.decided = true
      // 触摸端：纯横向滑动交给素材栏自己滚，纵向 / 斜向才进入拖拽
      if (e.pointerType !== 'mouse' && Math.abs(dx) > Math.abs(dy)) {
        gesture = null
        return
      }
      g.dragging = true
      swallowClick = true
      dragId = g.assetId
      try {
        g.el.setPointerCapture(g.pointerId)
      } catch {
        /* 个别浏览器不支持指针捕获，退化成全局监听即可 */
      }
      window.addEventListener('touchmove', onGlobalTouchMove, { passive: false })
      editor.beginDrag({
        assetId: g.assetId,
        name: g.name,
        src: g.src,
        isUser: g.isUser,
        w: g.w,
        h: g.h,
        clientX: e.clientX,
        clientY: e.clientY,
      })
      return
    }

    if (g.dragging) {
      // 拖拽期间别让页面跟着滚
      if (e.cancelable) e.preventDefault()
      editor.updateDrag(e.clientX, e.clientY)
    }
  }

  function endGesture(e: PointerEvent, cancelled: boolean) {
    const g = gesture
    if (!g || e.pointerId !== g.pointerId) return
    gesture = null
    window.removeEventListener('touchmove', onGlobalTouchMove)
    dragId = null
    if (g.dragging) {
      if (cancelled) editor.cancelDrag()
      else editor.dropDrag()
      return
    }
    // 没移动够阈值 = 点一下，走原来的「加到纸面中间」
    if (!g.decided && !cancelled) {
      swallowClick = true
      commitGesture(g)
    }
  }

  function onClickCell(fn: () => void) {
    if (swallowClick) {
      swallowClick = false
      return
    }
    fn()
  }

  function beginBuiltin(e: PointerEvent, a: AssetDef) {
    beginGesture(e, {
      assetId: a.id,
      name: a.name,
      src: assetUrl(a),
      isUser: false,
      w: a.w,
      h: a.h,
    })
  }

  function beginMine(e: PointerEvent, id: string, a: UserAsset) {
    beginGesture(e, {
      assetId: id,
      name: '我的素材',
      src: a.src,
      isUser: true,
      w: a.w,
      h: a.h,
    })
  }

  async function onPick(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const files = input.files
    if (!files || files.length === 0) return
    busy = true
    try {
      const ids = await importFiles(files)
      if (ids.length === 0) {
        flash('没有可导入的图片')
      } else if (ids.length === 1) {
        cropId = ids[0]
      } else {
        flash(`已导入 ${ids.length} 张`)
      }
    } catch {
      flash('导入失败')
    } finally {
      busy = false
      input.value = ''
    }
  }

  async function onCropDone(out: { src: string; w: number; h: number }) {
    const id = cropId
    cropId = null
    if (!id) return
    await replaceUserAsset(id, out)
    flash('已裁剪')
  }
</script>

<svelte:window
  onpointermove={onGlobalMove}
  onpointerup={(e) => endGesture(e, false)}
  onpointercancel={(e) => endGesture(e, true)}
/>

<aside class="palette">
  <div class="tabs">
    {#each CATEGORIES as c (c.id)}
      <button class="tab" class:on={cat === c.id} onclick={() => (cat = c.id)}>{c.name}</button>
    {/each}
    <button class="tab" class:on={cat === 'mine'} onclick={() => (cat = 'mine')}>我的</button>
  </div>

  {#if cat === 'mine'}
    <div class="bar">
      <button class="imp" disabled={busy} onclick={() => fileEl?.click()}>
        {busy ? '处理中…' : '导入图片'}
      </button>
      <span class="hint">只存在本地，不上传</span>
    </div>
  {/if}

  <input
    class="filehide"
    type="file"
    accept="image/*"
    multiple
    aria-label="导入图片"
    bind:this={fileEl}
    onchange={onPick}
  />

  {#snippet cellBtn(a: AssetDef)}
    <button
      class="cell"
      class:paper={a.paper === true}
      class:dragging={dragId === a.id}
      title={a.name}
      onpointerdown={(e) => beginBuiltin(e, a)}
      onclick={() => onClickCell(() => add(a.id, a.name))}
    >
      <img src={assetUrl(a)} alt={a.name} draggable="false" />
      <span>{a.name}</span>
    </button>
  {/snippet}

  <div class="grid scroll">
    {#if cat === 'mine'}
      {#if mine.length === 0}
        <p class="empty">
          还没有自己的图片。点上面「导入图片」，把收藏的手帐图、贴纸、照片加进来。单张导入会先让你裁剪，只留想用的那一块；之后随时点缩略图右下角的剪刀重新裁。图片只保存在你这台设备里，不会上传到服务器。
        </p>
      {:else}
        {#each mine as [id, a] (id)}
          <div class="cell mine" class:dragging={dragId === id}>
            <button
              class="thumb"
              title="按住拖到纸上，或点一下加到中间"
              onpointerdown={(e) => beginMine(e, id, a)}
              onclick={() => onClickCell(() => addMine(id, a))}
            >
              <img src={a.src} alt="" draggable="false" />
            </button>
            <button class="cut" title="裁剪" onclick={() => (cropId = id)}>✂</button>
            <button class="del" title="删除" onclick={() => void removeUserAsset(id)}>×</button>
          </div>
        {/each}
      {/if}
    {:else}
      {#if cat === 'pack'}
        {#each packGroups as g (g.name)}
          <h4 class="group">{g.name}</h4>
          {#each g.items as a (a.id)}
            {@render cellBtn(a)}
          {/each}
        {/each}
        <p class="credit">素材来自 The Met / Cleveland Museum of Art / ambientCG，授权 CC0。</p>
      {:else}
        {#each builtin as a (a.id)}
          {@render cellBtn(a)}
        {/each}
      {/if}
    {/if}
  </div>

  {#if tip}
    <div class="tip">{tip}</div>
  {/if}

  {#if editor.drag}
    <div class="ghost" style="left:{editor.drag.clientX}px; top:{editor.drag.clientY}px;">
      <img src={editor.drag.src} alt="" draggable="false" />
    </div>
  {/if}
</aside>

{#if cropSrc}
  <CropDialog src={cropSrc} onconfirm={onCropDone} oncancel={() => (cropId = null)} />
{/if}

<style>
  .palette {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: #fffdfa;
    border-left: 1px solid var(--line);
  }

  .tabs {
    display: flex;
    gap: 6px;
    padding: 10px;
    overflow-x: auto;
    scrollbar-width: none;
    border-bottom: 1px solid var(--line);
  }

  .tabs::-webkit-scrollbar {
    display: none;
  }

  .tab {
    flex: none;
    height: 28px;
    padding: 0 10px;
    border-radius: 8px;
    font-size: 13px;
    color: var(--ink-soft);
    border: 1px solid transparent;
    white-space: nowrap;
  }

  .tab.on {
    background: var(--paper-2);
    color: var(--ink);
    border-color: var(--line);
  }

  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 10px 10px;
  }

  .imp {
    height: 32px;
    padding: 0 14px;
    border-radius: 9px;
    background: var(--ink);
    color: #fff;
    font-size: 13px;
  }

  .imp:disabled {
    opacity: 0.55;
  }

  .hint {
    font-size: 11px;
    color: var(--ink-soft);
  }

  .filehide {
    display: none;
  }

  .grid {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 10px;
  }

  .empty {
    grid-column: 1 / -1;
    margin: 0;
    padding: 4px 2px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--ink-soft);
  }

  .cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 4px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--paper);
    transition: transform 0.08s ease;
  }

  .cell:active {
    transform: scale(0.95);
  }

  .cell.dragging,
  .cell.dragging:active {
    transform: none;
    border-color: var(--terra);
    background: var(--paper-2);
    box-shadow: 0 0 0 2px rgba(201, 123, 99, 0.28);
  }

  .ghost {
    position: fixed;
    width: 78px;
    height: 78px;
    transform: translate(-50%, -50%) scale(0.9);
    opacity: 0.9;
    pointer-events: none;
    z-index: 999;
  }

  .ghost img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 6px 12px rgba(58, 51, 44, 0.28));
  }

  .cell img {
    width: 100%;
    height: 46px;
    object-fit: contain;
    pointer-events: none;
  }

  .cell span {
    font-size: 11px;
    color: var(--ink-soft);
    line-height: 1;
  }

  .cell.paper img {
    padding: 3px;
    background: #fff;
    border-radius: 5px;
  }

  .group {
    grid-column: 1 / -1;
    margin: 4px 0 0;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--ink-soft);
  }

  .credit {
    grid-column: 1 / -1;
    margin: 2px 0 0;
    font-size: 10px;
    line-height: 1.5;
    color: var(--ink-soft);
  }

  .cell.mine {
    position: relative;
    padding: 6px;
  }

  .thumb {
    display: block;
    width: 100%;
    height: 62px;
    border-radius: 6px;
    overflow: hidden;
    background: repeating-conic-gradient(#efe9df 0% 25%, #fbf7f0 0% 50%) 50% / 12px 12px;
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }

  .cut {
    position: absolute;
    top: 2px;
    right: 26px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    color: var(--ink);
    font-size: 11px;
    line-height: 1;
    border: 1px solid var(--line);
  }

  .del {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    color: #b4483c;
    font-size: 14px;
    line-height: 1;
    border: 1px solid var(--line);
  }

  .tip {
    position: absolute;
    left: 12px;
    bottom: 12px;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--ink);
    color: #fff;
    font-size: 12px;
    pointer-events: none;
  }

  @media (max-width: 860px) {
    .palette {
      border-left: 0;
      border-top: 1px solid var(--line);
      max-height: 42vh;
    }

    /* 移动端素材栏改成单行横向滚动：横向留给滚动，纵向 / 斜向留给拖拽 */
    .grid {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      overflow-y: hidden;
      touch-action: pan-x;
    }

    .grid > .cell {
      flex: 0 0 auto;
      width: 78px;
    }

    .grid > .empty {
      flex: 1 1 auto;
      min-width: 200px;
    }

    .grid > .group {
      flex: 0 0 auto;
      align-self: center;
      padding: 0 2px;
    }

    .grid > .credit {
      flex: 0 0 auto;
      width: 200px;
    }
  }
</style>
