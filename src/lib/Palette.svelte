<script lang="ts">
  import { ASSETS, CATEGORIES, assetUrl, type CatId } from './assets'
  import type { Editor } from './editor.svelte'

  let { editor }: { editor: Editor } = $props()
  let cat = $state<CatId>('tape')
  let tip = $state('')

  const list = $derived(ASSETS.filter((a) => a.cat === cat))

  function add(id: string, name: string) {
    editor.add(id)
    tip = `已加入：${name}`
    setTimeout(() => {
      if (tip === `已加入：${name}`) tip = ''
    }, 1600)
  }
</script>

<aside class="palette">
  <div class="tabs">
    {#each CATEGORIES as c (c.id)}
      <button class="tab" class:on={cat === c.id} onclick={() => (cat = c.id)}>{c.name}</button>
    {/each}
  </div>

  <div class="grid scroll">
    {#each list as a (a.id)}
      <button class="cell" title={a.name} onclick={() => add(a.id, a.name)}>
        <img src={assetUrl(a)} alt={a.name} draggable="false" />
        <span>{a.name}</span>
      </button>
    {/each}
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

  .grid {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 10px;
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
