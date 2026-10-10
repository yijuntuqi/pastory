<script lang="ts">
  import { BGS, type BgDef, type Editor } from './editor.svelte'
  import { PAGE_H, PAGE_W, SCENES, type SceneDef } from './templates'
import { itemSrc } from './user-assets.svelte'
  import { stickerOn } from './sticker'
  import { downloadBlob, exportPNG } from './exporter'
  import { settings } from './settings.svelte'
  import { BRUSHES, INK_COLORS } from './ink'
  import { PACK_TEXTURES } from './pack-assets'
  import { thumbUrl } from './thumbs'
  import { LOOP_NAMES, type LoopId } from './look'

  let { editor, onFit }: { editor: Editor; onFit?: () => void } = $props()

  let panel = $state('')
  let scale = $state(2)
  let busy = $state(false)
  let msg = $state('')
  /** 笔迹手感面板：默认收起 */
  let feelOpen = $state(false)

  const sel = $derived(editor.selectedItem)

  function toggle(p: string) {
    panel = panel === p ? '' : p
  }

  function onName(e: Event) {
    editor.rename((e.currentTarget as HTMLInputElement).value)
  }

  /** 模板预览：把场景的预置素材按页面比例缩成一张小图 */
  function previewItems(scene: SceneDef) {
    let z = 0
    return scene.seeds.map((s) => {
      z += 1
      return { key: 'pv' + z, asset: s.a, x: s.x, y: s.y, w: s.w, rot: s.rot ?? 0 }
    })
  }

  function pct(v: number, total: number): string {
    return ((v / total) * 100).toFixed(2) + '%'
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
    <button
      class="btn ghost"
      class:on={editor.writeMode}
      title="手写：用 Apple Pencil 在纸面上写字涂鸦，手指仍可平移缩放"
      onclick={() => editor.toggleWrite()}>手写</button>
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

  {#if editor.writeMode}
    <div class="inkbar">
      {#each BRUSHES as b (b.id)}
        <button class="btn ghost" class:on={settings.tool === b.id} onclick={() => settings.setTool(b.id)}>
          {b.name}
        </button>
      {/each}
      <button
        class="btn ghost"
        class:on={settings.tool === 'eraser'}
        title="整笔橡皮：点中哪一笔就擦掉哪一笔"
        onclick={() => settings.setTool('eraser')}>橡皮</button>
      <span class="bar-sep"></span>
      <input
        class="size"
        type="range"
        min="0.4"
        max="2.5"
        step="0.1"
        value={settings.inkSize}
        aria-label="笔刷粗细"
        oninput={(e) => settings.setInkSize(Number((e.currentTarget as HTMLInputElement).value))}
      />
      <span class="bar-sep"></span>
      {#each INK_COLORS as c (c)}
        <button
          class="ink-dot"
          class:on={settings.inkColor === c}
          style="background:{c}"
          title={c}
          aria-label={'墨色 ' + c}
          onclick={() => settings.setInkColor(c)}></button>
      {/each}
      <span class="bar-sep"></span>
      <button class="btn ghost" class:on={editor.page.inkTop === true} onclick={() => editor.toggleInkTop()}>
        墨迹置顶
      </button>
      <button
        class="btn ghost"
        class:on={settings.fingerDraw}
        title="默认只有笔能画，防止手掌误触；打开后手指也能画"
        onclick={() => settings.toggleFinger()}>手指可画</button>
      <button
        class="btn ghost"
        class:on={feelOpen}
        title="笔迹手感：平滑、速度影响、手抖幅度、笔锋角度"
        onclick={() => (feelOpen = !feelOpen)}>笔迹手感</button>
      {#if feelOpen}
        <div class="feelbar">
          <label class="feel">
            <span>平滑 {settings.smooth}</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={settings.smooth}
              aria-label="平滑强度"
              oninput={(e) => settings.setSmooth(Number((e.currentTarget as HTMLInputElement).value))}
            />
          </label>
          <label class="feel">
            <span>速度影响 {settings.speedInfluence}</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={settings.speedInfluence}
              aria-label="速度影响强度"
              oninput={(e) => settings.setSpeedInfluence(Number((e.currentTarget as HTMLInputElement).value))}
            />
          </label>
          <label class="feel">
            <span>手抖幅度 {settings.jitter}</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={settings.jitter}
              aria-label="手抖幅度"
              oninput={(e) => settings.setJitter(Number((e.currentTarget as HTMLInputElement).value))}
            />
          </label>
          <label class="feel">
            <span>笔锋角度 {settings.nib}</span>
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              value={settings.nib}
              aria-label="笔锋倾斜角度"
              oninput={(e) => settings.setNib(Number((e.currentTarget as HTMLInputElement).value))}
            />
          </label>
          <button class="btn ghost" onclick={() => settings.resetFeel()}>复位</button>
        </div>
      {/if}
    </div>
  {/if}

  {#if panel === 'tpl'}
    <div class="pop tpl">
      {#each SCENES as t (t.id)}
        <button
          class="tpl-card"
          title={t.inkTip ? t.hint + ' · ' + t.inkTip : t.hint}
          onclick={() => {
            editor.applyTemplate(t.id)
            panel = ''
            onFit?.()
          }}
        >
          <span class="tpl-prev" style="background:{t.bg.color};">
            {#if t.bg.tex}
              <span class="tpl-tex" style="background-image:url('{thumbUrl(t.bg.tex) ?? t.bg.tex}')"></span>
            {/if}
            {#each previewItems(t) as it (it.key)}
              <img
                class="tpl-img"
                src={itemSrc(it.asset)}
                alt=""
                draggable="false"
                style="left:{pct(it.x, PAGE_W)}; top:{pct(it.y, PAGE_H)}; width:{pct(it.w, PAGE_W)}; transform:translate(-50%, -50%) rotate({it.rot}deg);"
              />
            {/each}
          </span>
          <span class="tpl-name">{t.name}</span>
          <span class="tpl-hint">{t.hint}</span>
          {#if t.inkTip}
            <span class="tpl-tip">{t.inkTip}</span>
          {/if}
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
          style="background-image:url('{thumbUrl(t.src) ?? t.src}')"
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

  /* 手写工具条：跟在标题栏下面自成一行 */
  .inkbar {
    flex-basis: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    padding: 6px 0 2px;
    border-top: 1px dashed var(--line);
  }

  .bar-sep {
    width: 1px;
    align-self: stretch;
    min-height: 18px;
    margin: 0 4px;
    background: var(--line);
  }

  .size {
    width: 92px;
    accent-color: var(--terra);
  }

  .ink-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.18);
    padding: 0;
    cursor: pointer;
  }

  .ink-dot.on {
    box-shadow: 0 0 0 2px var(--terra);
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

  .feelbar {
    flex-basis: 100%;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px 14px;
    padding: 6px 0 2px;
  }

  .feel {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--ink-soft);
  }

  .feel input[type='range'] {
    width: 96px;
    accent-color: var(--terra);
  }

  .pop.tpl {
    flex-direction: row;
    flex-wrap: wrap;
    max-width: 560px;
    max-height: 66vh;
    overflow-y: auto;
  }

  .tpl-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    width: 112px;
    padding: 6px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    text-align: left;
    cursor: pointer;
  }

  .tpl-card:hover {
    background: var(--paper);
    border-color: var(--line);
  }

  .tpl-prev {
    position: relative;
    display: block;
    width: 96px;
    height: 136px;
    border-radius: 8px;
    border: 1px solid var(--line);
    overflow: hidden;
  }

  .tpl-tex {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    opacity: 0.9;
  }

  .tpl-img {
    position: absolute;
    height: auto;
    pointer-events: none;
  }

  .tpl-name {
    font-size: 12px;
    font-weight: 600;
  }

  .tpl-hint {
    font-size: 10px;
    line-height: 1.35;
    color: var(--ink-soft);
  }

  .tpl-tip {
    font-size: 10px;
    line-height: 1.35;
    color: var(--terra);
  }
</style>
