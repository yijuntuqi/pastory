<script lang="ts">
  import { BGS, TEXT_COLORS, type BgDef, type Editor } from './editor.svelte'
  import { PAGE_H, PAGE_W, SCENES, type SceneDef } from './templates'
import { itemSrc } from './user-assets.svelte'
  import { stickerOn } from './sticker'
  import { downloadBlob, exportPNG } from './exporter'
  import { settings } from './settings.svelte'
  import { BRUSHES, INK_COLORS } from './ink'
  import { PACK_TEXTURES } from './pack-assets'
  import { thumbUrl } from './thumbs'
  import { LOOP_NAMES, type LoopId } from './look'
  import { ensureFont, FONTS, FONT_TIERS, fontFamily, tierName, type FontId } from './fonts'
  import { SUBSET_CHARS } from './font-subset'
  import { withBase } from './base'
  import { LAYOUT_OPS } from './layout'
  import { exportVideo, pickVideoMime, videoExtOf } from './export-video'
  import { missingChars } from './text'
  import { isText } from './types'
  import { TEMPLATE_TAGS, tagOf } from './templates'

  let { editor, onFit }: { editor: Editor; onFit?: () => void } = $props()

  let panel = $state('')
  let scale = $state(2)
  let busy = $state(false)
  let msg = $state('')
  /** 笔迹手感面板：默认收起 */
  let feelOpen = $state(false)
  /** 模板面板的分类筛选 */
  let tplTag = $state('全部')
  /** 字体预览加载进度（只用来触发重渲染） */
  let fontsReady = $state(0)
  /** 文字样式细调区：默认收起 */
  let textMore = $state(false)
  /** 导出面板：静态 PNG 还是动效视频 */
  let exportMode = $state<'png' | 'video'>('png')
  /** 动效视频时长（秒） */
  let videoSecs = $state(4)
  /** 动效导出进度 0..1 */
  let progress = $state(0)

  const videoMime = $derived(pickVideoMime())

  const sel = $derived(editor.selectedItem)
  const selText = $derived(sel && isText(sel) ? sel : null)
  const outsideChars = $derived(
    selText ? missingChars(selText.text ?? '', SUBSET_CHARS) : [],
  )
  const tplList = $derived(
    tplTag === '全部' ? SCENES : SCENES.filter((t) => tagOf(t) === tplTag),
  )

  /** 打开字体面板时按顺序把预览字体拉下来（首屏不加载任何字体） */
  async function openFontPanel() {
    const open = panel !== 'font'
    panel = open ? 'font' : ''
    if (!open) return
    for (const f of FONTS) {
      await ensureFont(f.id as FontId)
      fontsReady += 1
    }
  }

  function setFont(id: FontId) {
    if (!selText) return
    void ensureFont(id)
    editor.patchText(selText.id, { font: id })
  }

  function alignIcon(a: string): string {
    return a === 'left' ? '左' : a === 'center' ? '中' : '右'
  }

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

  function stamp() {
    return new Date().toISOString().slice(0, 10)
  }

  function flashMsg(text: string) {
    msg = text
    setTimeout(() => {
      if (msg === text) msg = ''
    }, 3600)
  }

  async function doExportPNG() {
    busy = true
    msg = ''
    try {
      const blob = await exportPNG(editor.page, scale)
      downloadBlob(blob, `${editor.page.name || 'pastory'}-${stamp()}.png`)
      flashMsg('已导出静态图片 PNG')
    } catch (err) {
      flashMsg(err instanceof Error ? err.message : '导出失败')
    } finally {
      busy = false
    }
  }

  async function doExportVideo() {
    busy = true
    msg = ''
    progress = 0
    try {
      const r = await exportVideo(editor.page, {
        duration: videoSecs,
        scale: 1,
        onProgress: (p) => (progress = p),
      })
      downloadBlob(r.blob, `${editor.page.name || 'pastory'}-动效-${stamp()}.${r.ext}`)
      flashMsg(
        r.ext === 'mp4'
          ? `已导出 MP4 动效（${videoSecs} 秒，可循环）`
          : '这个浏览器只支持 WebM 录制，已导出 WebM（同样能动；想要 MP4 请用 Chrome / Edge / Safari）',
      )
    } catch (err) {
      flashMsg(err instanceof Error ? err.message : '导出失败')
    } finally {
      busy = false
      progress = 0
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
      class:on={editor.textMode}
      title="文字：点纸面空白处新建文字框，点已有文字直接改；双击也能进编辑"
      onclick={() => editor.toggleText()}>文字</button>
    <button
      class="btn ghost"
      class:on={editor.writeMode}
      title="手写：用 Apple Pencil 在纸面上写字涂鸦，手指仍可平移缩放"
      onclick={() => editor.toggleWrite()}>手写</button>
    <button
      class="btn ghost"
      class:on={editor.multiMode}
      title="多选：打开后点元素是加进 / 移出选区（电脑上按住 Shift 点也一样），选够两个就能排布"
      onclick={() => editor.toggleMulti()}>多选</button>
    <button
      class="btn ghost"
      class:on={panel === 'pages'}
      title="页面：新增 / 切换 / 删除 / 调整页序"
      onclick={() => toggle('pages')}>页面 · {editor.pageCount}</button>
  </div>

  <div class="right">
    <button
      class="btn primary"
      class:on={panel === 'export'}
      disabled={busy}
      onclick={() => toggle('export')}>{busy ? '导出中…' : '导出'}</button>
  </div>

  {#if sel}
    <div class="selbar">
      <span class="dot"></span>
      <button class="btn ghost" onclick={() => editor.duplicate()}>复制</button>
      {#if !selText}
        <button class="btn ghost" onclick={() => editor.flip()}>翻转</button>
        <button
          class="btn ghost"
          class:on={stickerOn(sel)}
          title="贴纸白边与投影"
          onclick={() => editor.toggleSticker()}>贴纸感</button>
      {:else}
        <button class="btn ghost" onclick={() => editor.beginEdit(selText.id)}>改文字</button>
      {/if}
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

  {#if editor.multiMode || editor.selectedIds.length >= 2}
    <div class="layoutbar">
      <span class="laylabel">
        {editor.selectedIds.length >= 2 ? `排布 ${editor.selectedIds.length} 个元素` : '多选：点元素加进选区'}
      </span>
      {#each LAYOUT_OPS as o (o.op)}
        <button
          class="btn ghost"
          disabled={editor.selectedIds.length < 2 && o.op !== 'grid'}
          title={o.hint}
          onclick={() => editor.arrange(o.op)}>{o.name}</button>
      {/each}
      <button
        class="btn ghost"
        title="选中这一页上的全部元素（贴纸 + 文字）"
        onclick={() => editor.selectAll()}>全选</button>
      <button class="btn ghost" title="取消多选" onclick={() => editor.toggleMulti()}>退出多选</button>
    </div>
  {/if}

  {#if selText}
    <div class="textbar">
      <button class="btn ghost" class:on={panel === 'font'} onclick={openFontPanel}>
        字体 · {FONTS.find((f) => f.id === selText.font)?.name ?? '默认'}
      </button>
      <label class="mini">
        <span>字号 {Math.round(selText.size ?? 44)}</span>
        <input
          type="range"
          min="14"
          max="140"
          step="1"
          value={selText.size ?? 44}
          aria-label="字号"
          oninput={(e) => editor.patchText(selText.id, { size: Number((e.currentTarget as HTMLInputElement).value) })}
        />
      </label>
      {#each TEXT_COLORS as c (c)}
        <button
          class="ink-dot"
          class:on={(selText.color ?? '#3A332C') === c}
          style="background:{c}"
          title={'字色 ' + c}
          aria-label={'字色 ' + c}
          onclick={() => editor.patchText(selText.id, { color: c })}></button>
      {/each}
      <span class="bar-sep"></span>
      <button
        class="btn ghost bold"
        class:on={selText.bold === true}
        title="加粗"
        onclick={() => editor.patchText(selText.id, { bold: !selText.bold })}>粗</button>
      <button
        class="btn ghost italic"
        class:on={selText.italic === true}
        title="斜体"
        onclick={() => editor.patchText(selText.id, { italic: !selText.italic })}>斜</button>
      {#each ['left', 'center', 'right'] as a (a)}
        <button
          class="btn ghost"
          class:on={(selText.align ?? 'left') === a}
          title={'对齐：' + a}
          onclick={() => editor.patchText(selText.id, { align: a as 'left' | 'center' | 'right' })}>
          {alignIcon(a)}
        </button>
      {/each}
      <span class="bar-sep"></span>
      <button class="btn ghost" class:on={textMore} onclick={() => (textMore = !textMore)}>
        字距 / 行距 / 描边
      </button>
      <button
        class="btn ghost"
        class:on={selText.shadow === true}
        title="文字投影"
        onclick={() => editor.patchText(selText.id, { shadow: !selText.shadow })}>阴影</button>
      <button
        class="btn ghost"
        class:on={!!selText.bgColor}
        title="给文字加一块底色"
        onclick={() =>
          editor.patchText(selText.id, { bgColor: selText.bgColor ? null : '#FFFDF7' })}>底色</button>
      {#if outsideChars.length > 0}
        <span class="outside" title={'这些字不在内置字体子集里：' + outsideChars.join(' ')}>
          {outsideChars.length} 个字超出字体子集，会用系统字体显示
        </span>
      {/if}
      {#if textMore}
        <div class="morebar">
          <label class="mini">
            <span>字距 {(selText.letter ?? 0).toFixed(1)}</span>
            <input
              type="range"
              min="-3"
              max="12"
              step="0.5"
              value={selText.letter ?? 0}
              aria-label="字距"
              oninput={(e) => editor.patchText(selText.id, { letter: Number((e.currentTarget as HTMLInputElement).value) })}
            />
          </label>
          <label class="mini">
            <span>行距 {(selText.lineH ?? 1.4).toFixed(2)}</span>
            <input
              type="range"
              min="0.9"
              max="2.6"
              step="0.05"
              value={selText.lineH ?? 1.4}
              aria-label="行距"
              oninput={(e) => editor.patchText(selText.id, { lineH: Number((e.currentTarget as HTMLInputElement).value) })}
            />
          </label>
          <label class="mini">
            <span>描边 {(selText.strokeWidth ?? 0).toFixed(1)}</span>
            <input
              type="range"
              min="0"
              max="8"
              step="0.5"
              value={selText.strokeWidth ?? 0}
              aria-label="描边宽度"
              oninput={(e) =>
                editor.patchText(selText.id, {
                  strokeWidth: Number((e.currentTarget as HTMLInputElement).value),
                  strokeColor: selText.strokeColor ?? '#FFFFFF',
                })}
            />
          </label>
          <span class="morelabel">描边色</span>
          {#each TEXT_COLORS as c (c)}
            <button
              class="ink-dot"
              class:on={(selText.strokeColor ?? '#FFFFFF') === c}
              style="background:{c}"
              title={'描边 ' + c}
              aria-label={'描边 ' + c}
              onclick={() => editor.patchText(selText.id, { strokeColor: c })}></button>
          {/each}
          {#if selText.bgColor}
            <span class="morelabel">底色</span>
            {#each TEXT_COLORS.concat(['#FFFDF7', '#EFE7DA']) as c (c)}
              <button
                class="ink-dot"
                class:on={selText.bgColor === c}
                style="background:{c}"
                title={'底色 ' + c}
                aria-label={'底色 ' + c}
                onclick={() => editor.patchText(selText.id, { bgColor: c })}></button>
            {/each}
          {/if}
        </div>
      {/if}
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

  {#if panel === 'font'}
    <div class="pop fonts">
      <p class="credit">
        全部为 SIL OFL 1.1，允许免费商用、网页嵌入与随包分发。每个字体都裁过子集（常用汉字 + 标点 + 数字 + 字母），
        用到才下载；子集外的字会自动退回系统字体。
      </p>
      {#each FONT_TIERS as tier (tier.id)}
        <h4 class="tier">{tier.name}</h4>
        {#each FONTS.filter((f) => f.tier === tier.id) as f (f.id)}
          <button
            class="fontcard"
            class:on={selText?.font === f.id}
            onclick={() => {
              setFont(f.id)
              panel = ''
            }}
          >
            <span class="fname" style="font-family:{fontFamily(f.id)}">
              {f.name}　手帐文字 Aa 123 你好
            </span>
            <span class="fmeta">{tierName(f.tier)} · {f.license} · {f.source}</span>
            <span class="fmeta">{f.note}</span>
          </button>
        {/each}
      {/each}
    </div>
  {/if}

  {#if panel === 'tpl'}
    <div class="pop tpl">
      <div class="tplfilter">
        {#each ['全部', ...TEMPLATE_TAGS] as tag (tag)}
          <button class="chip" class:on={tplTag === tag} onclick={() => (tplTag = tag)}>{tag}</button>
        {/each}
        <span class="tplcount">共 {SCENES.length} 套</span>
      </div>
      {#each tplList as t (t.id)}
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
          style="background-image:url('{thumbUrl(t.src) ?? withBase(t.src)}')"
          onclick={() => { editor.setBgTex(t.src); panel = '' }}>
          <span class="sw-name">{t.name}</span>
        </button>
      {/each}
      <p class="credit">纸纹与素材来自 The Met / Cleveland Museum of Art / ambientCG，授权 CC0。</p>
    </div>
  {/if}

  {#if panel === 'export'}
    <div class="pop export">
      <div class="modes">
        <button
          class="mode"
          class:on={exportMode === 'png'}
          onclick={() => (exportMode = 'png')}>
          <strong>静态图片</strong>
          <em>PNG，清晰、体积小，发小红书 / 朋友圈最合适</em>
        </button>
        <button
          class="mode"
          class:on={exportMode === 'video'}
          onclick={() => (exportMode = 'video')}>
          <strong>动效视频</strong>
          <em>MP4，元素自带的呼吸 / 摇摆 / 漂浮会动起来，可无缝循环</em>
        </button>
      </div>

      {#if exportMode === 'png'}
        <div class="exportrow">
          <span class="laylabel">清晰度</span>
          <select bind:value={scale} aria-label="导出倍数">
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={3}>3x</option>
          </select>
          <button class="btn primary" disabled={busy} onclick={doExportPNG}>
            {busy ? '导出中…' : '导出 PNG'}
          </button>
        </div>
        <p class="credit">导出前会自动等所有用到的字体和素材加载完，看到的和存下来的一致。</p>
      {:else}
        <div class="exportrow">
          <span class="laylabel">时长</span>
          <select bind:value={videoSecs} aria-label="动效时长">
            <option value={3}>3 秒</option>
            <option value={4}>4 秒</option>
            <option value={5}>5 秒</option>
          </select>
          <button class="btn primary" disabled={busy || !videoMime} onclick={doExportVideo}>
            {busy ? '录制中…' : '导出 MP4'}
          </button>
        </div>
        {#if busy}
          <div class="progress"><span style="width:{Math.round(progress * 100)}%"></span></div>
          <p class="credit">正在录制 {Math.round(progress * 100)}%（录制期间请把页面留在前台）</p>
        {:else}
          <p class="credit">
            {#if videoMime}
              录制格式：{videoExtOf(videoMime) === 'mp4' ? 'MP4' : 'WebM（这个浏览器没给 MP4 编码器，视频一样能动）'}；
              时长 {videoSecs} 秒，首尾相接可循环。元素要先在右侧「动效」里挑一个循环效果才会动。
            {:else}
              这个浏览器不支持视频录制，导出 MP4 需要 Chrome / Edge / Safari 的较新版本。
            {/if}
          </p>
        {/if}
        <p class="credit">动态 WebP 这一版没做：WebCodecs 至今没有动效 WebP 的编码器（只有视频编码），等浏览器支持了再补。GIF 也不做。</p>
      {/if}
    </div>
  {/if}

  {#if panel === 'pages'}
    <div class="pop pages">
      {#each editor.pages as p, i (p.id)}
        <div class="pagerow" class:on={i === editor.pageIndex}>
          <button class="pname" title="切到这一页" onclick={() => { editor.switchPage(i); panel = '' }}>
            <span class="pidx">{i + 1}</span>
            <span class="ptitle">{p.name}</span>
            <em>{p.items.length} 个元素</em>
          </button>
          <button class="pact" aria-label="上移" disabled={i === 0} onclick={() => editor.movePage(i, i - 1)}>↑</button>
          <button
            class="pact"
            aria-label="下移"
            disabled={i === editor.pages.length - 1}
            onclick={() => editor.movePage(i, i + 1)}>↓</button>
          <button
            class="pact danger"
            aria-label="删除这一页"
            disabled={editor.pages.length <= 1}
            onclick={() => editor.removePage(i)}>×</button>
        </div>
      {/each}
      <button class="opt" onclick={() => { editor.addPage(); panel = '' }}>
        <strong>新增一页</strong>
        <em>加一张空白页插在当前页后面</em>
      </button>
      <p class="credit">页序用 ↑ ↓ 调整；封面页、整本套模板这一版不做。</p>
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

  /* ---- 文字属性面板 ---- */
  .textbar {
    flex-basis: 100%;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 8px;
    padding: 6px 0 2px;
    border-top: 1px dashed var(--line);
  }

  .mini {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--ink-soft);
    white-space: nowrap;
  }

  .mini input[type='range'] {
    width: 84px;
    accent-color: var(--terra);
  }

  .bold {
    font-weight: 700;
  }

  .italic {
    font-style: italic;
  }

  .outside {
    font-size: 11px;
    color: var(--terra);
  }

  .morebar {
    flex-basis: 100%;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 4px 0 2px;
  }

  .morelabel {
    font-size: 11px;
    color: var(--ink-soft);
  }

  /* ---- 字体面板 ---- */
  .pop.fonts {
    width: min(460px, calc(100vw - 40px));
    max-height: 68vh;
    overflow-y: auto;
  }

  .tier {
    margin: 6px 0 0;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--ink-soft);
  }

  .fontcard {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--paper);
    text-align: left;
  }

  .fontcard:hover {
    background: #fff;
  }

  .fontcard.on {
    border-color: var(--terra);
    box-shadow: 0 0 0 2px rgba(201, 123, 99, 0.22);
  }

  .fname {
    font-size: 16px;
    line-height: 1.5;
  }

  .fmeta {
    font-size: 10px;
    line-height: 1.4;
    color: var(--ink-soft);
  }

  /* ---- 模板分类筛选 ---- */
  .tplfilter {
    flex: 1 0 100%;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding-bottom: 4px;
    border-bottom: 1px dashed var(--line);
  }

  .chip {
    height: 24px;
    padding: 0 10px;
    border-radius: 8px;
    border: 1px solid var(--line);
    font-size: 12px;
    color: var(--ink-soft);
  }

  .chip.on {
    background: var(--paper-2);
    color: var(--ink);
    border-color: var(--terra);
  }

  .tplcount {
    margin-left: auto;
    font-size: 11px;
    color: var(--ink-soft);
  }

  /* ---- 排布条 ---- */
  .layoutbar {
    flex: 1 0 100%;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding-bottom: 4px;
    border-bottom: 1px dashed var(--line);
  }

  .laylabel {
    font-size: 12px;
    color: var(--ink-soft);
    margin-right: 2px;
  }

  /* ---- 导出面板 ---- */
  .pop.export {
    flex-direction: column;
  }

  .modes {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .mode {
    flex: 1 1 220px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    text-align: left;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--paper);
  }

  .mode.on {
    border-color: var(--terra);
    background: var(--paper-2);
  }

  .mode strong {
    font-size: 13px;
    color: var(--ink);
  }

  .mode em {
    font-style: normal;
    font-size: 11px;
    line-height: 1.5;
    color: var(--ink-soft);
  }

  .exportrow {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .progress {
    height: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }

  .progress span {
    display: block;
    height: 100%;
    background: var(--terra);
    transition: width 0.1s linear;
  }

  /* ---- 页面面板 ---- */
  .pop.pages {
    flex-direction: column;
    gap: 6px;
  }

  .pagerow {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: var(--paper);
  }

  .pagerow.on {
    border-color: var(--terra);
    background: var(--paper-2);
  }

  .pname {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    text-align: left;
    padding: 4px 6px;
    color: var(--ink);
    font-size: 13px;
  }

  .pname .pidx {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    border-radius: 6px;
    background: var(--paper-2);
    font-size: 11px;
    color: var(--ink-soft);
  }

  .pname .ptitle {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pname em {
    margin-left: auto;
    font-style: normal;
    font-size: 11px;
    color: var(--ink-soft);
  }

  .pact {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    font-size: 13px;
    line-height: 1;
  }

  .pact:disabled {
    opacity: 0.35;
  }

  .pact.danger {
    color: var(--terra);
  }
</style>
