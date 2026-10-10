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

首次跑 `npm run dev` / `npm run build` 会自动执行一次 `npm run thumbs`（素材包缩略图），
所以不用手动记得这件事；也可以随时单独跑：

```
npm run thumbs         # 生成 public/手账素材包/thumbs/ 和 src/lib/thumbs-manifest.ts
npm run thumbs:check   # 只检查：有源图缺缩略图就以退出码 1 结束
npm run fonts          # 下载字体并裁子集（生成 public/fonts/*.woff2）
```

## 目录结构

```
src/App.svelte            外壳，把三块拼起来
src/lib/Page.svelte       画布：拖动 / 缩放 / 旋转 / 双指缩放平移
src/lib/Palette.svelte    右侧素材面板
src/lib/Toolbar.svelte    顶部工具条：撤销、模板、纸面、导出
src/lib/editor.svelte.ts  状态、撤销重做、本地自动保存
src/lib/doc-store.ts      文档落盘：localStorage 快照 + IndexedDB 矢量文档
src/lib/fonts.ts          文字工具可选字体（按需加载，子集 woff2）
src/lib/font-subset.ts    字体子集字符集（由 scripts/make-fonts.mjs 生成）
src/lib/text.ts           文字排版与绘制：屏幕和导出共用同一组断行结果
src/lib/asset-search.ts   素材标签与搜索
src/lib/asset-fav.svelte.ts    素材收藏（本地持久化）
src/lib/asset-recent.svelte.ts 最近使用（本地持久化）
src/lib/InstallPrompt.svelte   添加到主屏幕提示条
public/sw.js              离线用的 Service Worker
scripts/make-fonts.mjs    下载字体并裁子集（npm run fonts）
scripts/make-icons.mjs    生成 PWA 图标（npm run icons）
src/lib/assets.ts         手绘 SVG 素材库（胶带 / 便签 / 印章 / 植物 / 装饰 / 边框）
src/lib/pro-assets.ts     精选素材第一批（相框 / 花枝 / 标签 / 邮票 / 别针 / 蕾丝 …）
src/lib/pro-assets-2.ts   剪贴素材（拱形 / 圆形 / 胶片 / 邮票边 / 邮戳 / 蜡封 …）
src/lib/pro-assets-3.ts   场景素材（贝壳 / 棕榈 / 海浪 / 弯月 / 课程表 / 咖啡杯 / 帐篷 / 蛋糕 …）
src/lib/pack-assets.ts    素材包（植物 / 印章 / 收据 / 纸纹理 / 蕾丝）
src/lib/ink.ts            笔迹：宽度映射、平滑、收尖、手抖、墨迹图层
src/lib/templates.ts      28 套场景模板（见下）
src/lib/exporter.ts       导出 PNG（1x / 2x / 3x，自动避开 iOS 画布上限）
```

## 怎么用

1. 右侧面板点一下素材，它就加到页面中间。
2. 在画布上拖到想放的位置；选中后右下角圆点缩放，上方圆点旋转。
3. 想换纸面：顶部「纸面」；想换一套排版：顶部「模板」。
4. 顶部「导出图片」存成 PNG，可直接发小红书 / 朋友圈。
5. 画布缩放：鼠标滚轮，或平板双指捧合；顶部「整页」一键回到全景。

## 部署成网址

### 方式一：GitHub Pages（免费，但仓库必须是公开的）

仓库里已经带好工作流 `.github/workflows/pages.yml`，push 到 `main` 就自动发布，
不用在本地做任何打包动作。

1. push 代码到 GitHub 的 `main` 分支。
2. 打开仓库的 **Settings → Pages**，把 **Source** 选成 **GitHub Actions**（只挑一次，之后长期有效）。
3. 再 push 一次（或在 Actions 页面手动跑一次 Deploy to GitHub Pages），等它变绿。
4. 站点地址是 `https://<用户名>.github.io/<仓库名>/`。

两条要记住的限制：

- **免费账号的 GitHub Pages 只能给公开仓库开站点。** 私有仓库想用 Pages 得升到付费套餐。
- 项目站点跑在 `/<仓库名>/` 这个子路径下，所以 vite 的 base 不能写死成 `/`。
  工作流里用 `actions/configure-pages` 算出 `base_path`，再通过环境变量 `VITE_BASE` 传给
  `npm run build`；仓库改名也不用改代码。手动构建时同样可以指定：
  `VITE_BASE=/pastory/ npm run build`（默认是 `/`，也就是根路径）。

**不想把仓库公开？用下面的 Cloudflare Pages。**

### 方式二：Cloudflare Pages（免费，支持私有仓库）

Cloudflare Pages 的免费额度对个人项目够用，而且可以直接连私有仓库：

1. 打开 Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**。
2. 选这个仓库，构建设置填：

   ```
   Framework preset:  None
   Build command:     npm run build
   Build output dir:  dist
   ```

3. 环境变量不用加（默认根路径，base 就是 `/`）。保存后每次 push 自动发布。
4. 有自己的域名可以在 Pages 项目里绑定。

### 关于 Netlify

以前的 Netlify 站点已经不用了（免费额度 300 credits 用尽、部署被暂停，不打算付费）。
仓库里不再放 Netlify 的配置，也别再往那边部署。

## 本次升级

### 收尾基础版（2026-10-10）

1. **字体下载脚本修好了**：`npm run fonts` 不再走 jsdelivr 拉大字体（LXGW WenKai / Noto SC
   都接近或超过 20MB，超过 jsdelivr 单文件上限，它返回的是错误页而不是字体，脚本会误判成
   `Unrecognized font signature`）。现在按候选列表从各字体官方 Release 附件 / Google Fonts
   仓库直连下载，跟随重定向，带 GitHub 加速镜像；每个候选下载完先验字体文件头，不是字体就换下一个；
   单个字体失败不再打断整批，最后汇总打印成功和失败。
2. **素材包缩略图覆盖全了**：六个子目录 73 个文件全部有 160px 缩略图，并且生成时会写出
   `src/lib/thumbs-manifest.ts`，前端只在清单里查得到时才用缩略图，缺图自动回退原图；
   `npm run thumbs:check` 可以核对覆盖率，孤儿缩略图会被清理。
3. **部署换成 GitHub Pages**：`.github/workflows/pages.yml` push 到 main 自动发布，
   vite 的 base 用 `VITE_BASE` 环境变量控制（默认根路径，Actions 里是 `/<仓库名>/`）；
   PWA 的 manifest、start_url / scope、Service Worker 注册路径、站内素材地址全部按基路径拼。
4. **基础排布**：选够两个以上元素（打开「多选」，电脑上也可以 Shift 点选），工具条出现排布条，
   支持左 / 右 / 上 / 下对齐、水平居中、垂直居中、水平等距、垂直等距、网格对齐（20px），
   作用对象是贴纸和文字，一次操作只记一条撤销。
5. **动效导出**：导出面板里可以选「静态图片（PNG）」或「动效视频（MP4）」。
   动效用 `canvas.captureStream` + `MediaRecorder` 录 3 / 4 / 5 秒，录制时显示进度；
   元素的呼吸 / 摇摆 / 漂浮是周期函数，视频首尾相接可以无缝循环。
   浏览器没给 MP4 编码器时会退到 WebM 并如实提示。不做 GIF；动态 WebP 这一版也没做
   （WebCodecs 至今没有动效 WebP 编码器）。
6. **页管理**：新增 / 切换 / 删除 / 调整页序。封面页与「整本套模板」这一版不做。

### 笔迹手感

1. **半透明笔不留痕**：墨迹先画进离屏缓冲，一笔只合成一次，收笔不再叠出深色块。
2. **速度决定粗细**：慢写偏粗、快写偏细，映射按窗口平均加一阶滞后，滑杆「速度影响」可调。
3. **采样点平滑**：对轨迹做指数平滑，鼠标的锯齿和手抖被抹掉，滑杆「平滑」可调。
4. **笔锋倾斜**：带压感的笔按倾斜角参与宽度计算，斜着写更像真笔。
5. **起收笔收尖**：笔画两端自动收细，不再像被剪断。
6. **转折圆角**：折角处补圆，硬折线不再出现尖刺。
7. **低频手抖**：给笔画叠一层缓慢起伏，接近手写的自然抖动，滑杆「手抖幅度」可调。
8. **涂鸦笔**：新增画笔，线条更粗更随意。
9. **毛刺剔除**：单点或长度不足 3 像素的抖动笔画直接丢弃。
10. **手感调节区**：顶部「笔迹手感」展开四个滑杆（平滑 / 速度影响 / 手抖幅度 / 笔锋角度），带一键复位。

### 场景模板（第一批：12 套）

- 模板从 4 套扩到 **12 套**：空白 / 日常 / 周计划 / 旅行 / 海滩 / 星空 / 教室 / 考试周 / 咖啡店 / 露营 / 读书 / 生日。
- 模板面板改成**缩略图预览**：每套模板直接画出纸色、纸纹和预置素材的摆位，点一下套用。
- 模板是**数据驱动**的（`templates.ts` 里的 `SCENES`）：一个场景 = 底色 + 纸纹 + 一串素材种子，加模板不用改渲染逻辑。
- 为场景新增 **19 个同风格 SVG 素材**：贝壳、棕榈叶、海浪、海星、弯月、星座、流星、铅笔、直尺、课程表、咖啡杯、咖啡豆、帐篷、远山、蛋糕、蜡烛、书堆、眼镜、待办清单。
- 星空模板是深色纸面，面板上会提示把墨色换成白色或浅色。

### 文字与字体

- 顶部多了一个「文字」工具：点纸面空白处新建文字框，点已有文字直接改，双击也能进编辑。
- 编辑用的是叠在画布上的 `textarea`（**不参与画布的 scale 变换**，按 zoom / pan 手工换算位置和字号），
  所以缩放、平移时输入框不会和文字错位；这也是 iOS Safari 上最稳的做法。
- 属性面板：字体、字号、颜色、粗细、斜体、字距、行距、左中右对齐、描边、投影、底色块。
  旋转 / 缩放 / 移动 / 图层顺序 / 复制 / 删除 / 撤销全部复用贴纸那一套，文字和贴纸共用同一组图层。
- 文字以矢量数据（文字 + 样式字段）存进文档，导出 1x / 2x / 3x 都清晰；导出前会等字体加载完成。
- 撤销：一次编辑过程（从进入编辑到退出）只记一条，不是每敲一个字记一条。
- 字体 6 款，按用途分三档：手写（霞鹜文楷）、涂鸦（站酷快乐体）、宋体（思源宋体）、
  黑体（思源黑体）、标题（得意黑 / 站酷庆科黄油体）。全部 SIL OFL 1.1。
- 每个字体都裁成子集（GB2312 一级常用字 + 标点 + 数字 + 英文字母，约 3900 字），输出 woff2；
  **只有真正选到某个字体才下载**，首屏不加载任何字体。子集外的字自动退回系统字体，面板上会提示。

### 场景模板（28 套）

空白 / 日常一页 / 周计划 / 旅行手记 / 海滩假日 / 星空夜 / 教室笔记 / 考试周 / 咖啡店 / 露营山野 / 读书笔记 / 生日一页 /
学习计划 / 月度总览 / 周复盘 / 追剧手记 / 美食探店 / 宠物日常 / 购物清单 / 健身打卡 / 情绪日记 /
圣诞一页 / 新年一页 / 纪念日 / 毕业季 / 植物标本 / 复古报刊 / 极简留白 / 票据收藏

模板面板支持按「经典 / 计划 / 记录 / 主题 / 纪念 / 排版」筛选，卡片带缩略预览、面板可滚动。
新增模板只在 `templates.ts` 的 `SCENES` 里加数据，渲染逻辑不变；为场景新增 14 个同风格手绘 SVG。

### 素材栏检索与收藏

- 顶部搜索框：按**名称 + 标签**匹配（分类名、用途、题材、颜色气质都算标签），支持中文多词。
- 收藏：每个素材左上角星标，收藏的进「收藏」分区。
- 最近使用：按使用时间倒序，进「最近」分区。
- 收藏和最近都存在 localStorage，刷新不丢。

### PWA

- `manifest.webmanifest`：名称 Pastory、192 / 512 PNG 图标、theme_color、display standalone、start_url 根。
- `public/sw.js`：首屏外壳（index.html / 图标 / manifest）预缓存；导航请求网络优先、断网回落；
  其它同源资源缓存优先并**按需**缓存——字体、缩略图、以及用户真的用到的素材原图才会进缓存，
  不会一次把 20 多 MB 素材塞进去。
- 首次访问会给一条可关闭的「添加到主屏幕」提示：Android 走 Chrome 的安装入口，
  iOS 走「分享 → 添加到主屏幕」；关掉后记住状态，不再反复弹。

### 已知限制（没有真机实测）

- 本次没有触摸屏 / Apple Pencil / iPad 浏览器可用，手写与文字输入只在桌面浏览器上验证过；
  iPad 上的中文输入法与软键盘行为属于「按已知坑做了兜底」，需要真机再确认一次。
- 断网离线、添加到主屏幕的完整流程同样只在桌面做了逻辑验证。
