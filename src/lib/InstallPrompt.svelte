<script lang="ts">
  /**
   * 「添加到主屏幕」提示条。
   * - Android / Chrome：接管 beforeinstallprompt，点「安装」直接调系统的安装入口；
   * - iOS Safari：没有安装 API，改成一步步的文字指引（分享 → 添加到主屏幕）；
   * - 关掉之后记住状态，不再反复弹。
   */
  import { onMount } from 'svelte'

  const KEY = 'pastory.a2hs.closed.v1'

  let visible = $state(false)
  let mode = $state<'android' | 'ios'>('android')
  let deferred = $state<{ prompt: () => Promise<void> } | null>(null)

  function isStandalone(): boolean {
    const nav = navigator as Navigator & { standalone?: boolean }
    return (
      window.matchMedia?.('(display-mode: standalone)').matches === true ||
      nav.standalone === true
    )
  }

  function isIos(): boolean {
    const ua = navigator.userAgent
    return /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream
  }

  function closed(): boolean {
    try {
      return localStorage.getItem(KEY) === '1'
    } catch {
      return true
    }
  }

  function close() {
    visible = false
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* 记不住就这次先关掉 */
    }
  }

  async function install() {
    const d = deferred
    if (!d) return
    try {
      await d.prompt()
    } finally {
      deferred = null
      close()
    }
  }

  onMount(() => {
    if (isStandalone() || closed()) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      deferred = e as unknown as { prompt: () => Promise<void> }
      mode = 'android'
      visible = true
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    let timer = 0
    if (isIos()) {
      mode = 'ios'
      timer = window.setTimeout(() => {
        if (!closed()) visible = true
      }, 6000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      if (timer) window.clearTimeout(timer)
    }
  })
</script>

{#if visible}
  <div class="a2hs">
    {#if mode === 'android'}
      <span class="txt">把 Pastory 装到桌面，打开就是全屏，没地址栏。</span>
      <button class="go" onclick={install}>安装</button>
    {:else}
      <span class="txt">
        iPhone / iPad 上：点底部的「分享」，选「添加到主屏幕」，用起来更顺手、也不容易丢数据。
      </span>
    {/if}
    <button class="no" title="关闭" aria-label="关闭" onclick={close}>×</button>
  </div>
{/if}

<style>
  .a2hs {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 900;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: #fffdfa;
    border: 1px solid var(--line);
    box-shadow: var(--shadow-md);
  }

  .txt {
    flex: 1;
    font-size: 12px;
    line-height: 1.6;
    color: var(--ink);
  }

  .go {
    flex: none;
    height: 30px;
    padding: 0 14px;
    border-radius: 9px;
    background: var(--ink);
    color: #fff;
    font-size: 12px;
  }

  .no {
    flex: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    font-size: 16px;
    line-height: 1;
    color: var(--ink-soft);
  }
</style>
