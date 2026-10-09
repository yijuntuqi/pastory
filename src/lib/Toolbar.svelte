<script lang="ts">
  import { BGS, type BgDef, type Editor } from './editor.svelte'
  import { TEMPLATES } from './templates'
  import { stickerOn } from './sticker'
  import { downloadBlob, exportPNG } from './exporter'
  import { settings } from './settings.svelte'
  import { PACK_TEXTURES } from './pack-assets'
  import { LOOP_NAMES, type LoopId } from './look'

  let { editor, onFit }: { editor: Editor; onFit?: () => void } = $props()

  let panel = $state('')
  let scale = $state(2)
  let busy = $state(false)
  let msg = $state('')

  const sel = $derived(editor.selectedItem)

  function toggle(p: string) {
    panel = panel === p ? '' : p
  }

  function onName(e: Event) {
    editor.rename((e.currentTarget as HTMLInputElement).value)
  }

  async function doExport() {
    busy = true
    msg = ''
    try {
      const blob = await exportPNG(editor.page, scale)
      const stamp = new Date().toISOString().slice(0, 10)
      downloadBlob(blob, `${editor.page.name || 'pastory'}-${stamp}.png`)
      msg = '已导出图片'
    } catch (err) {
      msg = err instanceof Error ? err.message : '导出失败'
    } finally {
      busy = false
      setTimeout(() => (msg = ''), 2400)
    }
  }
</script>

<header class="bar">
  <div class="left">
    <span class="brand">Pastory</span>
    <input class="title" value={editor.page.name} aria-label="手帐名称" oninput={onName} />
  </div>

  <div class="mid">
    <button class="icon-btn" title="撤销" disabled={!editor.canUndo} onclick={() => editor.undo()}><span class="arw undo"></span></button>
    <button class="icon-btn" title="重做" disabled={!editor.canRedo} onclick={() => editor.redo()}><span class="arw redo"></span></button>
    <button class="btn" class:on={panel === 'tpl'} onclick={() => toggle('tpl')}>模板</button>
    <button class="btn" class:on={panel === 'bg'} onclick={() => toggle('bg')}>纸面</button>
    <button class="btn ghost" title="回到整页" onclick={() => onFit?.()}>整页</button>
    <button
      class="btn ghost"
      class:on={settings.depth}
      title="立体效果：纸张厚度与投影，关掉导出更干净"
      onclick={() => settings.toggleDepth()}>立体</button>
    <button
      class="btn ghost"
      class:on={settings.motion}
      title="动效：弹入、循环、淡出"
      onclick={() => settings.toggleMotion()}>动效</button>
    <button
      class="btn ghost"
      class:on={settings.tilt}
      title="整页 3D 透视倾斜（默认关闭）"
      onclick={() => settings.toggleTilt()}>3D</button>
  </div>

  <div class="right">
    <select bind:value={scale} aria-label="导出倍数">
      <option value={1}>1x</option>
      <option value={2}>2x</option>
      <option value={3}>3x</option>
    </select>
    <button class="btn primary" disabled={busy} onclick={doExport}>{busy ? '导出中' : '导出图片'}</button>
  </div>

  {#if sel}
    <div class="selbar">
      <span class="dot"></span>
      <button class="btn ghost" onclick={() => editor.duplicate()}>复制</button>
      <button class="btn ghost" onclick={() => editor.flip()}>翻转</button>
      <button
        class="btn ghost"
        class:on={stickerOn(sel)}
        title="贴纸白边与投影"
        onclick={() => editor.toggleSticker()}>贴纸感</button>
      <select
        class="loopsel"
        aria-label="循环动效"
        disabled={!settings.motion}
        value={sel.loop ?? ''}
        onchange={(e) => editor.setLoop((e.currentTarget as HTMLSelectElement).value as LoopId | '')}
      >
        {#each LOOP_NAMES as l (l.id)}
          <option value={l.id}>{l.id ? '动效：' + l.name : '动效：无'}</option>
        {/each}
      </select>
      <button class="btn ghost" onclick={() => editor.toFront()}>置顶</button>
      <button class="btn ghost" onclick={() => editor.toBack()}>置底</button>
      <button class="btn ghost danger" onclick={() => editor.remove()}>删除</button>
    </div>
  {/if}

  {#if panel === 'tpl'}
    <div class="pop">
      {#each TEMPLATES as t (t.id)}
        <button class="opt" onclick={() => { editor.applyTemplate(t.id); panel = ''; onFit?.() }}>
          <strong>{t.name}</strong>
          <em>{t.hint}</em>
        </button>
      {/each}
      <button class="opt danger" onclick={() => { editor.clearItems(); panel = '' }}>
        <strong>清空贴纸</strong>
        <em>只留纸面</em>
      </button>
    </div>
  {/if}

  {#if panel === 'bg'}
    <div class="pop grid">
      {#each BGS as b, i (b.name + i)}
        <button class="swatch" title={b.name} style="background:{b.color}" onclick={() => { editor.setBg(b as BgDef); panel = '' }}>
          <span class="sw-name">{b.name}</span>
          <span class="sw-pat {b.type}"></span>
        </button>
      {/each}
      <button
        class="swatch tex-off"
        class:on={!editor.page.bg.tex}
        title="不用底纹"
        onclick={() => { editor.setBgTex(null); panel = '' }}>
        <span class="sw-name">无底纹</span>
      </button>
      {#each PACK_TEXTURES as t (t.id)}
        <button
          class="swatch"
          class:on={editor.page.bg.tex === t.src}
          title={t.name}
          style="background-image:url('{t.src}')"
          onclick={() => { editor.setBgTex(t.src); panel = '' }}>
          <span class="sw-name">{t.name}</span>
        </button>
      {/each}
      <p class="credit">纸纹与素材来自 The Met / Cleveland Museum of Art / ambientCG，授权 CC0。</p>
    </div>
  {/if}

  {#if msg}
    <div class="toast">{msg}</div>
  {/if}
</header>

<style>
  .bar {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 8px 12px;
    background: #fffdfa;
    border-bottom: 1px solid var(--line);
    z-index: 20;
  }

  .left,
  .mid,
  .right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .brand {
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .title {
    width: 132px;
    height: 30px;
    padding: 0 8px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: var(--paper);
    font: inherit;
    color: var(--ink);
  }

  .right {
    margin-left: auto;
  }

  select {
    height: 34px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: #fff;
    font: inherit;
    padding: 0 6px;
    margin-right: 6px;
  }

  .btn.on {
    background: var(--paper-2);
    color: var(--ink);
  }

  .arw {
    display: block;
    width: 8px;
    height: 8px;
  }

  .arw.undo {
    border-left: 2px solid var(--ink);
    border-bottom: 2px solid var(--ink);
    transform: rotate(45deg) translate(1px, -1px);
  }

  .arw.redo {
    border-right: 2px solid var(--ink);
    border-top: 2px solid var(--ink);
    transform: rotate(45deg) translate(-1px, 1px);
  }

  .selbar {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding-top: 4px;
    border-top: 1px dashed var(--line);
  }

  .selbar .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--terra);
    margin: 0 6px;
  }

  .btn.danger {
    color: #b4483c;
  }

  .pop {
    position: absolute;
    top: 100%;
    left: 12px;
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    box-shadow: var(--shadow-md);
    z-index: 30;
  }

  .pop.grid {
    flex-direction: row;
    flex-wrap: wrap;
    max-width: 320px;
    max-height: 62vh;
    overflow-y: auto;
  }

  .opt {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 8px 14px 8px 10px;
    border-radius: 10px;
    border: 1px solid transparent;
    text-align: left;
  }

  .opt:hover {
    background: var(--paper);
    border-color: var(--line);
  }

  .opt strong {
    font-size: 13px;
    font-weight: 600;
  }

  .opt em {
    font-size: 11px;
    font-style: normal;
    color: var(--ink-soft);
  }

  .opt.danger strong {
    color: #b4483c;
  }

  .swatch {
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: 10px;
    border: 1px solid var(--line);
    overflow: hidden;
    background-size: cover;
    background-position: center;
  }

  .swatch.on {
    outline: 2px solid var(--terra);
    outline-offset: -2px;
  }

  .swatch.tex-off {
    background: var(--paper);
  }

  .credit {
    flex: 1 0 100%;
    margin: 2px 0 0;
    font-size: 10px;
    line-height: 1.5;
    color: var(--ink-soft);
  }

  .loopsel {
    height: 30px;
    margin: 0 4px 0 0;
    font-size: 12px;
  }

  .sw-name {
    position: absolute;
    left: 4px;
    bottom: 3px;
    font-size: 10px;
    color: var(--ink-soft);
  }

  .sw-pat {
    position: absolute;
    inset: 6px 6px 16px 6px;
  }

  .sw-pat.dots {
    background-image: radial-gradient(#d6cbb8 1.4px, transparent 1.4px);
    background-size: 12px 12px;
  }

  .sw-pat.grid {
    background-image: linear-gradient(#d6cbb8 1px, transparent 1px),
      linear-gradient(90deg, #d6cbb8 1px, transparent 1px);
    background-size: 11px 11px;
  }

  .sw-pat.lined {
    background-image: linear-gradient(#d6cbb8 1px, transparent 1px);
    background-size: 100% 11px;
  }

  .toast {
    position: absolute;
    right: 14px;
    top: 100%;
    margin-top: 8px;
    padding: 7px 12px;
    border-radius: 10px;
    background: var(--ink);
    color: #fff;
    font-size: 12px;
    z-index: 40;
  }
</style>
