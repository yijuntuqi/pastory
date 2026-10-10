// 本文件由 scripts/make-thumbs.mjs 生成，请勿手改。
// 它记录「public/手账素材包/thumbs/ 下真实存在哪些缩略图」。
// 前端只在清单里查得到时才用缩略图，查不到就退回原图，不会出现「以为有、其实 404」。
// 跑一次 npm run thumbs（或任意一次 npm run build / npm run dev，pre* 钩子会自动跑）即可刷新。

export interface ThumbGroup {
  name: string
  count: number
}

/** 每个子目录各有几张缩略图 */
export const THUMB_GROUPS: ThumbGroup[] = [
  { name: "植物", count: 16 },
  { name: "邮票邮戳", count: 18 },
  { name: "票据票根", count: 13 },
  { name: "旧纸片", count: 9 },
  { name: "花边装饰", count: 7 },
  { name: "纸纹理", count: 10 },
]

/** 缩略图总数 */
export const THUMB_COUNT = 73

/** 缩略图的站内路径（解码后的中文，以 / 开头的 POSIX 形式） */
export const THUMBS: ReadonlySet<string> = new Set<string>([
  "/手账素材包/thumbs/植物/met_264582.png",
  "/手账素材包/thumbs/植物/met_264586.png",
  "/手账素材包/thumbs/植物/met_264587.png",
  "/手账素材包/thumbs/植物/met_264591.png",
  "/手账素材包/thumbs/植物/met_283063.png",
  "/手账素材包/thumbs/植物/met_285149.png",
  "/手账素材包/thumbs/植物/met_287790.png",
  "/手账素材包/thumbs/植物/met_287841.png",
  "/手账素材包/thumbs/植物/met_287842.png",
  "/手账素材包/thumbs/植物/met_287858.png",
  "/手账素材包/thumbs/植物/met_360446.png",
  "/手账素材包/thumbs/植物/met_362545.png",
  "/手账素材包/thumbs/植物/met_362554.png",
  "/手账素材包/thumbs/植物/met_362627.png",
  "/手账素材包/thumbs/植物/met_707883.png",
  "/手账素材包/thumbs/植物/met_707885.png",
  "/手账素材包/thumbs/邮票邮戳/met_1062.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_1063.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_211414.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_211421.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_211423.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_211425.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_211478.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_211479.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_212143.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_212144.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_212145.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_212146.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_212147.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_212148.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_212149.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_212150.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_212157.jpg",
  "/手账素材包/thumbs/邮票邮戳/met_730698.jpg",
  "/手账素材包/thumbs/票据票根/met_345220.jpg",
  "/手账素材包/thumbs/票据票根/met_812835.jpg",
  "/手账素材包/thumbs/票据票根/met_812853.jpg",
  "/手账素材包/thumbs/票据票根/met_812868.jpg",
  "/手账素材包/thumbs/票据票根/met_815781.jpg",
  "/手账素材包/thumbs/票据票根/met_815801.jpg",
  "/手账素材包/thumbs/票据票根/met_817334.jpg",
  "/手账素材包/thumbs/票据票根/met_819539.jpg",
  "/手账素材包/thumbs/票据票根/met_819595.jpg",
  "/手账素材包/thumbs/票据票根/met_819607.jpg",
  "/手账素材包/thumbs/票据票根/met_819619.jpg",
  "/手账素材包/thumbs/票据票根/met_819626.jpg",
  "/手账素材包/thumbs/票据票根/met_819643.jpg",
  "/手账素材包/thumbs/旧纸片/met_208146.jpg",
  "/手账素材包/thumbs/旧纸片/met_9658.jpg",
  "/手账素材包/thumbs/旧纸片/met_9663.jpg",
  "/手账素材包/thumbs/旧纸片/met_9665.jpg",
  "/手账素材包/thumbs/旧纸片/met_9666.jpg",
  "/手账素材包/thumbs/旧纸片/met_9668.jpg",
  "/手账素材包/thumbs/旧纸片/met_9669.jpg",
  "/手账素材包/thumbs/旧纸片/met_9681.jpg",
  "/手账素材包/thumbs/旧纸片/met_9682.jpg",
  "/手账素材包/thumbs/花边装饰/met_12960.jpg",
  "/手账素材包/thumbs/花边装饰/met_207710.jpg",
  "/手账素材包/thumbs/花边装饰/met_323807.jpg",
  "/手账素材包/thumbs/花边装饰/met_326082.jpg",
  "/手账素材包/thumbs/花边装饰/met_33288.jpg",
  "/手账素材包/thumbs/花边装饰/met_386687.jpg",
  "/手账素材包/thumbs/花边装饰/met_446775.jpg",
  "/手账素材包/thumbs/纸纹理/ambientcg_Cardboard001.jpg",
  "/手账素材包/thumbs/纸纹理/ambientcg_Cardboard002.jpg",
  "/手账素材包/thumbs/纸纹理/ambientcg_Cardboard003.jpg",
  "/手账素材包/thumbs/纸纹理/ambientcg_Cardboard004.jpg",
  "/手账素材包/thumbs/纸纹理/ambientcg_Paper001.jpg",
  "/手账素材包/thumbs/纸纹理/ambientcg_Paper002.jpg",
  "/手账素材包/thumbs/纸纹理/ambientcg_Paper003.jpg",
  "/手账素材包/thumbs/纸纹理/ambientcg_Paper004.jpg",
  "/手账素材包/thumbs/纸纹理/ambientcg_Paper005.jpg",
  "/手账素材包/thumbs/纸纹理/ambientcg_Paper006.jpg",
])
