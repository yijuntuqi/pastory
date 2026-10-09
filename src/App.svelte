<script lang="ts">
  import Page from './lib/Page.svelte'
  import Palette from './lib/Palette.svelte'
  import Toolbar from './lib/Toolbar.svelte'
  import { createEditor } from './lib/editor.svelte'

  const editor = createEditor()

  let pageRef = $state<{ fit: () => void } | null>(null)

  function fit() {
    pageRef?.fit()
  }
</script>

<div class="app">
  <Toolbar {editor} onFit={fit} />
  <div class="body">
    <Page bind:this={pageRef} {editor} />
    <Palette {editor} />
  </div>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .body {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: stretch;
  }

  .body :global(.palette) {
    flex: 0 0 240px;
  }

  @media (max-width: 860px) {
    .body {
      flex-direction: column;
    }

    .body :global(.palette) {
      flex: 0 0 auto;
    }
  }
</style>
