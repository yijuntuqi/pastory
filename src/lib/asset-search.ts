/**
 * 素材检索用的标签。
 *
 * 素材有一百多个，光靠分类翻很累，所以这里给每个素材算出一组标签
 * （分类 / 用途 / 题材 / 颜色气质），搜索时「名称 + 标签」一起匹配中文关键词。
 * 标签是按规则算出来的，不写进素材数据里，因此不用手改生成文件。
 */
import { ASSETS, type AssetDef } from './assets'

const CAT_TAGS: Record<string, string[]> = {
  tape: ['胶带', '拼贴', '装饰', '日常'],
  note: ['便签', '备忘', '纸', '日常'],
  stamp: ['印章', '戳', '复古', '装饰'],
  plant: ['植物', '花草', '自然', '清新'],
  deco: ['装饰', '可爱', '贴纸'],
  frame: ['边框', '相框', '排版'],
  pro: ['精选', '拼贴', '手绘', '低饱和'],
  cut: ['开窗', '镂空', '纸'],
  pack: ['素材包', '实物', '扫描', '复古'],
}

const GROUP_TAGS: Record<string, string[]> = {
  植物: ['植物', '花草', '写实', '自然'],
  邮票邮戳: ['邮票', '邮戳', '复古', '集邮'],
  票据票根: ['票据', '票根', '收据', '电影票', '复古'],
  旧纸片: ['旧纸', '做旧', '底纹', '背景', '复古'],
  花边装饰: ['花边', '蕾丝', '复古', '装饰'],
  纸纹理: ['纸纹', '纹理', '底纹', '背景'],
}

/** 关键词 -> 标签；对 id 和名称一起匹配 */
const KEYWORDS: [string, string[]][] = [
  ['tape', ['胶带', '拼贴', '装饰']],
  ['note', ['便签', '备忘', '纸']],
  ['stamp', ['印章', '戳', '复古']],
  ['plant', ['植物', '花草']],
  ['deco', ['装饰', '可爱']],
  ['frame', ['边框', '相框', '排版']],
  ['lace', ['花边', '蕾丝', '复古']],
  ['paper', ['旧纸', '做旧', '背景']],
  ['tex', ['纸纹', '纹理', '背景']],
  ['receipt', ['票据', '票根', '收据', '复古']],
  ['post', ['邮票', '邮戳', '复古']],
  ['polaroid', ['拍立得', '照片', '相框']],
  ['film', ['胶片', '电影', '复古']],
  ['ticket', ['票', '电影票', '车票']],
  ['pencil', ['铅笔', '文具', '学习']],
  ['ruler', ['直尺', '文具', '学习']],
  ['books', ['书', '阅读', '学习']],
  ['glasses', ['眼镜', '阅读']],
  ['timetable', ['课程表', '学习', '计划']],
  ['checklist', ['清单', '待办', '计划', '打勾']],
  ['cup', ['咖啡', '杯子', '饮品']],
  ['beans', ['咖啡豆', '咖啡']],
  ['cake', ['蛋糕', '生日', '甜品']],
  ['candle', ['蜡烛', '生日']],
  ['boba', ['奶茶', '饮品', '甜品']],
  ['bowl', ['面', '美食', '吃']],
  ['popcorn', ['爆米花', '电影', '追剧']],
  ['controller', ['手柄', '游戏', '追剧']],
  ['paw', ['爪印', '宠物', '猫', '狗']],
  ['cart', ['购物车', '购物', '买东西']],
  ['dumbbell', ['哑铃', '健身', '运动']],
  ['heartline', ['心率', '健身', '运动']],
  ['gift', ['礼物', '圣诞', '节日']],
  ['snow', ['雪花', '圣诞', '冬天']],
  ['firework', ['烟花', '新年', '节日']],
  ['wreath', ['花环', '圣诞', '节日']],
  ['moon', ['月亮', '夜晚', '情绪']],
  ['star', ['星星', '夜空', '装饰']],
  ['meteor', ['流星', '夜空']],
  ['shell', ['贝壳', '海边']],
  ['starfish', ['海星', '海边']],
  ['wave', ['海浪', '海边', '夏天']],
  ['palm', ['棕榈', '海边', '夏天']],
  ['tent', ['帐篷', '露营']],
  ['mountain', ['山', '露营', '户外']],
  ['pressed', ['标本', '植物', '压花']],
  ['magazine', ['报刊', '杂志', '复古']],
  ['postmark', ['邮戳', '复古']],
  ['dater', ['日期', '打卡']],
  ['wax', ['蜡封', '复古', '信封']],
  ['clip', ['回形针', '文具']],
  ['staple', ['订书钉', '文具']],
  ['twine', ['麻绳', '手工', '复古']],
  ['pearl', ['珍珠', '装饰']],
  ['bow', ['蝴蝶结', '装饰', '可爱']],
  ['sparkle', ['闪光', '装饰']],
  ['heart', ['爱心', '喜欢', '恋爱']],
  ['sun', ['太阳', '夏天', '装饰']],
  ['arrow', ['箭头', '手绘', '指示']],
  ['clover', ['四叶草', '幸运', '植物']],
  ['euca', ['尤加利', '植物', '清新']],
  ['branch', ['枝叶', '植物']],
  ['flower', ['花', '植物']],
  ['berry', ['浆果', '植物']],
  ['fern', ['蕨', '植物']],
  ['lavender', ['薰衣草', '植物']],
  ['olive', ['橄榄', '植物']],
  ['dandelion', ['蒲公英', '植物']],
  ['oldpaper', ['旧纸', '做旧', '背景']],
  ['foldnote', ['折纸', '便签']],
  ['torn', ['撕纸', '便签']],
  ['kraft', ['牛皮纸', '便签']],
  ['plain', ['素色', '纯色']],
  ['lined', ['横线']],
  ['grid', ['方格', '格纹']],
  ['dot', ['圆点', '波点']],
  ['stripe', ['斜条', '条纹']],
  ['airmail', ['航空', '信封', '复古']],
  ['key', ['钥匙', '复古']],
  ['label', ['标签', '标注']],
  ['pin', ['图钉', '固定']],
  ['arch', ['拱形', '相框']],
  ['corner', ['角花', '边框']],
  ['dried', ['干花', '植物', '复古']],
]

const cache = new Map<string, string[]>()

export function tagsOf(a: AssetDef): string[] {
  const hit = cache.get(a.id)
  if (hit) return hit
  const tags = new Set<string>()
  for (const t of CAT_TAGS[a.cat] ?? []) tags.add(t)
  if (a.group) for (const t of GROUP_TAGS[a.group] ?? []) tags.add(t)
  const key = (a.id + ' ' + a.name).toLowerCase()
  for (const [word, list] of KEYWORDS) {
    if (key.includes(word)) for (const t of list) tags.add(t)
  }
  if (a.cat === 'pack') tags.add('实拍')
  if (a.cat === 'pro' || a.id.startsWith('d3-') || a.id.startsWith('p2-')) tags.add('手绘')
  const out = [...tags]
  cache.set(a.id, out)
  return out
}

/** 搜索：按名称 + 标签匹配，多个词之间是「都要命中」 */
export function searchAssets(query: string, pool: AssetDef[] = ASSETS): AssetDef[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/).filter(Boolean)
  return pool.filter((a) => {
    const hay = (a.name + ' ' + tagsOf(a).join(' ')).toLowerCase()
    return terms.every((t) => hay.includes(t))
  })
}
