import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

// PWA：注册 Service Worker，让首屏外壳离线可用（开发环境注册会带来困扰，只在生产注册）
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* 注册不上就还按普通网页用 */
    })
  })
}

export default app
