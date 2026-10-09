# Pastory

用贴纸和印章拼出一页好看的手帐。Web / PWA，手机、平板、桌面浏览器都能开。

## 本地跑起来

```
npm install
npm run dev
```

命令会给一个 http://localhost:5173 的地址，浏览器打开就能用。

## 在 iPad / 手机上打开（同一个 Wi-Fi）

```
npm run dev -- --host
```

看命令输出的 Network 地址，形如 http://192.168.x.x:5173，在平板浏览器里输进去。
Safari 里建议再点「分享 → 添加到主屏幕」，之后就是全屏、没地址栏的样子，
而且能绕开 Safari 自动清理七天本地数据的问题。

## 打包和预览

```
npm run build
npm run preview
```

## 目录结构

```
src/App.svelte            外壳，把三块拼起来
src/lib/Page.svelte       画布：拖动 / 缩放 / 旋转 / 双指缩放平移
src/lib/Palette.svelte    右侧素材面板
src/lib/Toolbar.svelte    顶部工具条：撤销、模板、纸面、导出
src/lib/editor.svelte.ts  状态、撤销重做、本地自动保存
src/lib/assets.ts         26 个手绘 SVG 素材（胶带 / 便签 / 印章 / 植物 / 装饰 / 边框）
src/lib/templates.ts      4 套模板：空白 / 日常 / 周计划 / 旅行
src/lib/exporter.ts       导出 PNG（1x / 2x / 3x，自动避开 iOS 画布上限）
```

## 怎么用

1. 右侧面板点一下素材，它就加到页面中间。
2. 在画布上拖到想放的位置；选中后右下角圆点缩放，上方圆点旋转。
3. 想换纸面：顶部「纸面」；想换一套排版：顶部「模板」。
4. 顶部「导出图片」存成 PNG，可直接发小红书 / 朋友圈。
5. 画布缩放：鼠标滚轮，或平板双指捧合；顶部「整页」一键回到全景。

## 部署成网址（Netlify）

在 Netlify 里 Import 这个 GitHub 仓库，填：

```
Build command:    npm run build
Publish directory: dist
```

以后每次 push，网站自动重新发布。URL 可以在 Site settings 里改成 pastory.netlify.app。
