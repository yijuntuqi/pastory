<script lang="ts">
  import { onMount } from 'svelte'
  import { ASSETS, CATEGORIES, assetUrl, type CatId } from './assets'
  import {
    userAssets,
    importFiles,
    removeUserAsset,
    loadUserAssets,
    type UserAsset,
  } from './user-assets.svelte'
  import type { Editor } from './editor.svelte'

  let { editor }: { editor: Editor } = $props()

  type TabId = CatId | 'mine'

  let cat = $state<TabId>('pro')
  let tip = $state('')
  let busy = $state(false)
  let fileEl = $state<HTMLInputElement | null>(null)

  const builtin = $derived(cat === 'mine' ? [] : ASSETS.filter((a) => a.cat === cat))
  const mine = $derived([...userAssets.entries()] as [string, UserAsset][])

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

  async function onPick(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const files = input.files
    if (!files || files.length === 0) return
    busy = true
    try {
      const n = await importFiles(files)
      flash(n > 0 ? `已导入 ${n} 张` : '没有可导入的图片')
    } catch {
      flash('导入失败')
    } finally {
      busy = false
      input.value = ''
    }
  }
</script>

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

  <div class="grid scroll">
    {#if cat === 'mine'}
      {#if mine.length === 0}
        <p class="empty">
          还没有自己的图片。点上面「导入图片」，把收藏的手帐图、贴纸、照片加进来，就能直接放到手帐上。图片只保存在你这台设备里，不会上传到服务器。
        </p>
      {:else}
        {#each mine as [id, a] (id)}
          <div class="cell mine">
            <button class="thumb" title="加入手帐" onclick={() => addMine(id, a)}>
              <img src={a.src} alt="" draggable="false" />
            </button>
            <button class="del" title="删除" onclick={() => void removeUserAsset(id)}>×</button>
          </div>
        {/each}
      {/if}
    {:else}
      {#each builtin as a (a.id)}
        <button class="cell" title={a.name} onclick={() => add(a.id, a.name)}>
          <img src={assetUrl(a)} alt={a.name} draggable="false" />
          <span>{a.name}</span>
        </button>
      {/each}
    {/if}
  </div>

  {#if tip}
    <div class="tip">{tip}</div>
  {/if}
</aside>

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

    .grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
</style>
