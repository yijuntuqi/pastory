import type { AssetDef, CatId } from './assets'

const NS = 'xmlns="http://www.w3.org/2000/svg"'

function def(id: string, name: string, w: number, h: number, body: string): AssetDef {
  return { id, name, cat: 'pro' as CatId, w, h, svg: `<svg ${NS} viewBox="0 0 ${w} ${h}">${body}</svg>` }
}

/*
 * 场景模板补充素材（第三批）。
 * 风格跟前面两批一致：细线手绘、低饱和、不描粗色块，颜色取自同一套色板。
 */

const shell = def(
  'd3-shell',
  '贝壳',
  130,
  110,
  `<path d="M65 102 C30 94 12 66 20 36 C26 18 44 10 65 10 C86 10 104 18 110 36 C118 66 100 94 65 102 Z" fill="#EFE0CE" stroke="#C9AE85" stroke-width="1.4"/>` +
    `<g fill="none" stroke="#D9C3A0" stroke-width="1.2" stroke-linecap="round">` +
    `<path d="M65 98 C61 70 59 42 62 14"/>` +
    `<path d="M40 94 C42 68 47 42 56 16"/>` +
    `<path d="M90 94 C88 68 83 42 74 16"/>` +
    `<path d="M24 74 C35 56 46 38 54 20"/>` +
    `<path d="M106 74 C95 56 84 38 76 20"/>` +
    `</g>` +
    `<path d="M46 102 Q65 110 84 102" fill="none" stroke="#C9AE85" stroke-width="1.6" stroke-linecap="round"/>`,
)

const palm = def(
  'd3-palm',
  '棕榈叶',
  170,
  200,
  `<path d="M84 194 C82 150 80 100 76 40" fill="none" stroke="#8FA98F" stroke-width="2.2" stroke-linecap="round"/>` +
    `<g fill="#A8BCA4" opacity="0.92">` +
    `<path d="M76 44 q-40 -6 -56 -28 q36 -4 56 28 z"/>` +
    `<path d="M78 46 q40 -6 56 -28 q-36 -4 -56 28 z"/>` +
    `<path d="M77 74 q-42 -4 -60 -24 q38 -6 60 24 z"/>` +
    `<path d="M79 76 q42 -4 60 -24 q-38 -6 -60 24 z"/>` +
    `<path d="M78 104 q-40 -2 -56 -20 q36 -8 56 20 z"/>` +
    `<path d="M80 106 q40 -2 56 -20 q-36 -8 -56 20 z"/>` +
    `</g>` +
    `<g fill="#8FA98F" opacity="0.85">` +
    `<path d="M79 130 q-30 2 -44 -12 q28 -8 44 12 z"/>` +
    `<path d="M81 132 q30 2 44 -12 q-28 -8 -44 12 z"/>` +
    `</g>`,
)

const wave = def(
  'd3-wave',
  '海浪',
  520,
  120,
  `<g fill="none" stroke-linecap="round">` +
    `<path d="M18 74 q28 -26 58 0 t58 0 t58 0 t58 0 t58 0 t58 0 t58 0 t58 0" stroke="#8FA9C4" stroke-width="3"/>` +
    `<path d="M18 98 q28 -26 58 0 t58 0 t58 0 t58 0 t58 0 t58 0 t58 0 t58 0" stroke="#A8BED6" stroke-width="2.4" opacity="0.9"/>` +
    `<path d="M150 42 q22 -22 44 -4 q-20 16 -44 4 z" fill="#C6D6E6" stroke="#8FA9C4" stroke-width="1.4"/>` +
    `<path d="M330 26 q22 -22 44 -4 q-20 16 -44 4 z" fill="#C6D6E6" stroke="#8FA9C4" stroke-width="1.4"/>` +
    `</g>`,
)

const starfish = def(
  'd3-starfish',
  '海星',
  130,
  130,
  `<path d="M65 12 C72 40 78 48 106 52 C80 60 74 66 70 96 C62 70 56 62 26 58 C54 48 60 42 65 12 Z" fill="#EFD9C4" stroke="#D9B79A" stroke-width="1.4"/>` +
    `<g fill="#E4C4A8" opacity="0.8">` +
    `<circle cx="52" cy="44" r="3"/><circle cx="78" cy="46" r="3"/><circle cx="65" cy="66" r="3"/>` +
    `<circle cx="46" cy="72" r="3"/><circle cx="84" cy="70" r="3"/>` +
    `</g>`,
)

const moon = def(
  'd3-moon',
  '弯月',
  170,
  170,
  `<path d="M112 20 C68 26 34 54 34 90 C34 126 68 152 112 158 C74 134 62 114 62 90 C62 64 76 44 112 20 Z" fill="#F2E5C0" stroke="#D9C08A" stroke-width="1.6"/>`,
)

const stars = def(
  'd3-stars',
  '星座',
  320,
  220,
  `<g fill="none" stroke="#C9D3E8" stroke-width="1.1" opacity="0.75">` +
    `<path d="M40 168 L96 108 L150 140 L206 66 L268 96"/>` +
    `<path d="M150 140 L170 190 L232 176"/>` +
    `</g>` +
    `<g fill="#F2E5C0">` +
    `<circle cx="40" cy="168" r="4"/><circle cx="96" cy="108" r="5.5"/><circle cx="150" cy="140" r="4.5"/>` +
    `<circle cx="206" cy="66" r="6"/><circle cx="268" cy="96" r="4"/><circle cx="170" cy="190" r="3.6"/>` +
    `<circle cx="232" cy="176" r="3.2"/>` +
    `</g>`,
)

const meteor = def(
  'd3-meteor',
  '流星',
  210,
  120,
  `<path d="M8 112 C70 82 118 58 178 26" fill="none" stroke="#DDE4F2" stroke-width="3" stroke-linecap="round" opacity="0.55"/>` +
    `<path d="M60 92 C104 70 138 50 178 26" fill="none" stroke="#F2E5C0" stroke-width="2" stroke-linecap="round" opacity="0.8"/>` +
    `<circle cx="182" cy="24" r="7" fill="#FBFAF4"/>` +
    `<g fill="none" stroke="#F2E5C0" stroke-width="1.2" stroke-linecap="round" opacity="0.8">` +
    `<path d="M192 10 L200 4"/><path d="M196 26 L206 26"/><path d="M190 38 L198 44"/>` +
    `</g>`,
)

const pencil = def(
  'd3-pencil',
  '铅笔',
  150,
  150,
  `<g transform="rotate(45 75 75)">` +
    `<rect x="52" y="16" width="46" height="86" fill="#F3E7CE" stroke="#D9C3A0" stroke-width="1.4"/>` +
    `<rect x="52" y="16" width="46" height="14" fill="#E7AFB0" stroke="#D9C3A0" stroke-width="1.4"/>` +
    `<path d="M52 102 H98 L75 132 Z" fill="#EFE0CE" stroke="#D9C3A0" stroke-width="1.4"/>` +
    `<path d="M70 124 L75 132 L80 124 Z" fill="#3A332C"/>` +
    `<path d="M52 48 H98 M52 84 H98" stroke="#E4DACA" stroke-width="1"/>` +
    `</g>`,
)

const ruler = def(
  'd3-ruler',
  '直尺',
  220,
  60,
  `<rect x="6" y="14" width="208" height="34" rx="4" fill="#F3E7CE" stroke="#D9C3A0" stroke-width="1.4"/>` +
    `<g stroke="#C9AE85" stroke-width="1.2" stroke-linecap="round">` +
    Array.from({ length: 11 }, (_, i) => {
      const x = 16 + i * 19
      const long = i % 2 === 0
      return `<path d="M${x} 14 V${long ? 26 : 21}"/>`
    }).join('') +
    `</g>`,
)

const timetable = def(
  'd3-timetable',
  '课程表',
  430,
  300,
  `<rect x="8" y="8" width="414" height="284" rx="8" fill="#FFFDF7" stroke="#E4DACA" stroke-width="1.6"/>` +
    `<path d="M8 16 H422" stroke="#E4DACA" stroke-width="1.4" opacity="0"/>` +
    `<rect x="8" y="8" width="414" height="40" rx="8" fill="#F3E7CE"/>` +
    `<path d="M8 48 H422" stroke="#E4DACA" stroke-width="1.4"/>` +
    `<g stroke="#EDE6D8" stroke-width="1.2">` +
    `<path d="M90 48 V292 M166 48 V292 M242 48 V292 M318 48 V292"/>` +
    `<path d="M8 100 H422 M8 152 H422 M8 204 H422 M8 256 H422"/>` +
    `</g>` +
    `<g fill="#C9AE85" opacity="0.55">` +
    `<rect x="26" y="24" width="44" height="8" rx="4"/><rect x="104" y="24" width="44" height="8" rx="4"/>` +
    `<rect x="180" y="24" width="44" height="8" rx="4"/><rect x="256" y="24" width="44" height="8" rx="4"/>` +
    `<rect x="332" y="24" width="44" height="8" rx="4"/>` +
    `</g>`,
)

const cup = def(
  'd3-cup',
  '咖啡杯',
  170,
  140,
  `<path d="M34 44 H118 V96 C118 116 102 128 76 128 C50 128 34 116 34 96 Z" fill="#FFFDF7" stroke="#C9AE85" stroke-width="1.6"/>` +
    `<ellipse cx="76" cy="45" rx="42" ry="7" fill="#8C6A4A" opacity="0.75"/>` +
    `<path d="M118 58 C142 58 150 70 148 82 C146 94 134 100 118 100" fill="none" stroke="#C9AE85" stroke-width="1.6"/>` +
    `<g fill="none" stroke="#C9AE85" stroke-width="1.3" stroke-linecap="round" opacity="0.7">` +
    `<path d="M64 26 q6 -10 0 -18"/><path d="M80 26 q6 -10 0 -18"/><path d="M96 26 q6 -10 0 -18"/>` +
    `</g>` +
    `<path d="M22 130 H130" stroke="#E4DACA" stroke-width="2" stroke-linecap="round"/>`,
)

const beans = def(
  'd3-beans',
  '咖啡豆',
  120,
  120,
  `<g fill="#C8A583" stroke="#A98563" stroke-width="1.2">` +
    `<ellipse cx="42" cy="44" rx="20" ry="26" transform="rotate(-22 42 44)"/>` +
    `<ellipse cx="80" cy="60" rx="19" ry="25" transform="rotate(18 80 60)"/>` +
    `<ellipse cx="48" cy="88" rx="18" ry="24" transform="rotate(-8 48 88)"/>` +
    `</g>` +
    `<g fill="none" stroke="#8C6A4A" stroke-width="1.4" stroke-linecap="round">` +
    `<path d="M34 30 C44 42 44 50 36 60"/>` +
    `<path d="M72 44 C82 56 82 66 74 76"/>` +
    `<path d="M42 74 C52 86 52 94 44 102"/>` +
    `</g>`,
)

const tent = def(
  'd3-tent',
  '帐篷',
  230,
  180,
  `<path d="M115 22 L206 158 H24 Z" fill="#EEF4EC" stroke="#8FA98F" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<path d="M115 22 L138 158 H92 Z" fill="#E4ECDF" stroke="#8FA98F" stroke-width="1.6"/>` +
    `<path d="M115 62 L132 158 H98 Z" fill="#DCE7D6" stroke="#8FA98F" stroke-width="1.2"/>` +
    `<path d="M115 22 V10" stroke="#B09A6E" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M18 158 H212" stroke="#B09A6E" stroke-width="2" stroke-linecap="round"/>`,
)

const mountain = def(
  'd3-mountain',
  '远山',
  470,
  200,
  `<path d="M8 186 L118 58 L188 132 L268 30 L372 152 L462 74 V186 Z" fill="#E4ECDF" stroke="#8FA98F" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<path d="M118 58 L146 90 L90 90 Z" fill="#FFFDF7" opacity="0.85"/>` +
    `<path d="M268 30 L296 64 L240 64 Z" fill="#FFFDF7" opacity="0.85"/>` +
    `<path d="M10 186 H462" stroke="#B09A6E" stroke-width="1.8" stroke-linecap="round"/>`,
)

const cake = def(
  'd3-cake',
  '蛋糕',
  250,
  190,
  `<rect x="30" y="86" width="190" height="76" rx="10" fill="#F3E0DA" stroke="#D9AE9E" stroke-width="1.6"/>` +
    `<rect x="30" y="86" width="190" height="18" rx="9" fill="#E7AFB0"/>` +
    `<rect x="56" y="42" width="138" height="58" rx="10" fill="#F7EAE4" stroke="#D9AE9E" stroke-width="1.6"/>` +
    `<rect x="56" y="42" width="138" height="16" rx="8" fill="#E7AFB0"/>` +
    `<g fill="#F0C36D" stroke="#D9A441" stroke-width="1">` +
    `<circle cx="72" cy="76" r="4"/><circle cx="100" cy="80" r="4"/><circle cx="128" cy="76" r="4"/>` +
    `<circle cx="156" cy="80" r="4"/><circle cx="178" cy="76" r="4"/>` +
    `</g>` +
    `<g fill="#F0C36D" stroke="#D9A441" stroke-width="1">` +
    `<circle cx="52" cy="122" r="4"/><circle cx="86" cy="128" r="4"/><circle cx="120" cy="122" r="4"/>` +
    `<circle cx="154" cy="128" r="4"/><circle cx="188" cy="122" r="4"/><circle cx="206" cy="128" r="4"/>` +
    `</g>` +
    `<path d="M20 166 H230" stroke="#E4DACA" stroke-width="2" stroke-linecap="round"/>`,
)

const candle = def(
  'd3-candle',
  '蜡烛',
  110,
  150,
  `<rect x="38" y="56" width="34" height="76" rx="6" fill="#F7EAE4" stroke="#D9AE9E" stroke-width="1.4"/>` +
    `<path d="M55 56 C44 44 44 34 55 22 C66 34 66 44 55 56 Z" fill="#F0C36D" stroke="#D9A441" stroke-width="1.2"/>` +
    `<rect x="28" y="130" width="54" height="10" rx="4" fill="#EFE0CE" stroke="#D9C3A0" stroke-width="1.2"/>`,
)

const books = def(
  'd3-books',
  '书堆',
  180,
  150,
  `<g stroke="#C9AE85" stroke-width="1.3">` +
    `<rect x="18" y="108" width="140" height="22" rx="4" fill="#DCE9DA"/>` +
    `<rect x="26" y="86" width="126" height="22" rx="4" fill="#EFE0CE"/>` +
    `<rect x="16" y="64" width="146" height="22" rx="4" fill="#E7D3B0"/>` +
    `<rect x="30" y="42" width="118" height="22" rx="4" fill="#F3E0DA"/>` +
    `</g>` +
    `<g stroke="#C9AE85" stroke-width="1.1" opacity="0.7">` +
    `<path d="M34 112 V126 M146 90 V104 M30 68 V82 M40 46 V60"/>` +
    `</g>`,
)

const glasses = def(
  'd3-glasses',
  '眼镜',
  170,
  70,
  `<g fill="#DDE4EC" opacity="0.45">` +
    `<circle cx="46" cy="40" r="19"/><circle cx="124" cy="40" r="19"/>` +
    `</g>` +
    `<g fill="none" stroke="#3A332C" stroke-width="1.8" opacity="0.6" stroke-linecap="round">` +
    `<circle cx="46" cy="40" r="22"/>` +
    `<circle cx="124" cy="40" r="22"/>` +
    `<path d="M68 36 Q85 26 102 36"/>` +
    `<path d="M24 32 L4 22"/>` +
    `<path d="M146 32 L166 22"/>` +
    `</g>`,
)

const checklist = def(
  'd3-checklist',
  '待办清单',
  440,
  300,
  `<rect x="8" y="8" width="424" height="284" rx="10" fill="#FFFDF7" stroke="#E4DACA" stroke-width="1.6"/>` +
    `<rect x="8" y="8" width="424" height="14" rx="7" fill="#DCE9DA"/>` +
    `<g stroke="#E4DACA" stroke-width="1.4">` +
    `<path d="M40 92 H400 M40 148 H400 M40 204 H400 M40 260 H400"/>` +
    `</g>` +
    `<g fill="#DCE9DA" stroke="#8FA98F" stroke-width="1.3">` +
    `<rect x="40" y="56" width="22" height="22" rx="5"/>` +
    `<rect x="40" y="112" width="22" height="22" rx="5"/>` +
    `<rect x="40" y="168" width="22" height="22" rx="5"/>` +
    `<rect x="40" y="224" width="22" height="22" rx="5"/>` +
    `</g>` +
    `<path d="M46 67 L52 74 L60 60" fill="none" stroke="#3A332C" stroke-width="1.8" stroke-linecap="round" opacity="0.5"/>` +
    `<g fill="#EDE6D8">` +
    `<rect x="84" y="62" width="180" height="10" rx="5"/>` +
    `<rect x="84" y="118" width="230" height="10" rx="5"/>` +
    `<rect x="84" y="174" width="150" height="10" rx="5"/>` +
    `<rect x="84" y="230" width="210" height="10" rx="5"/>` +
    `</g>`,
)

/* ---- 第二批场景素材：日常记录类模板用（学习 / 追剧 / 美食 / 宠物 / 购物 / 健身 / 节日 / 纪念） ---- */

const popcorn = def(
  'd3-popcorn',
  '爆米花',
  150,
  160,
  `<path d="M28 96 H122 L112 150 H38 Z" fill="#FFFDF7" stroke="#C9AE85" stroke-width="1.6"/>` +
    `<path d="M28 96 H122" stroke="#D9A441" stroke-width="2" stroke-dasharray="6 5"/>` +
    `<g fill="#F3E7CE" stroke="#D9C3A0" stroke-width="1.2">` +
    `<circle cx="48" cy="72" r="15"/><circle cx="74" cy="58" r="17"/><circle cx="100" cy="72" r="15"/>` +
    `<circle cx="60" cy="48" r="13"/><circle cx="90" cy="46" r="12"/>` +
    `</g>` +
    `<path d="M44 112 H106 M42 128 H108" stroke="#E4DACA" stroke-width="3" stroke-linecap="round"/>`,
)

const paw = def(
  'd3-paw',
  '爪印',
  140,
  140,
  `<g fill="#D9C3A0" stroke="#C9AE85" stroke-width="1.3">` +
    `<ellipse cx="70" cy="92" rx="26" ry="22"/>` +
    `<ellipse cx="34" cy="62" rx="11" ry="14" transform="rotate(-18 34 62)"/>` +
    `<ellipse cx="58" cy="46" rx="11" ry="15"/>` +
    `<ellipse cx="86" cy="46" rx="11" ry="15"/>` +
    `<ellipse cx="108" cy="62" rx="11" ry="14" transform="rotate(18 108 62)"/>` +
    `</g>` +
    `<circle cx="70" cy="92" r="7" fill="#C9AE85" opacity="0.5"/>`,
)

const cart = def(
  'd3-cart',
  '购物车',
  170,
  150,
  `<path d="M14 22 H34 L52 96 H134 L150 42 H44" fill="none" stroke="#8FA9C4" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="62" cy="118" r="11" fill="#DCE9DA" stroke="#8FA9C4" stroke-width="2"/>` +
    `<circle cx="120" cy="118" r="11" fill="#DCE9DA" stroke="#8FA9C4" stroke-width="2"/>` +
    `<path d="M70 58 H130 M74 74 H126" stroke="#E4DACA" stroke-width="3" stroke-linecap="round"/>`,
)

const dumbbell = def(
  'd3-dumbbell',
  '哑铃',
  180,
  110,
  `<rect x="78" y="50" width="24" height="10" rx="5" fill="#C9AE85"/>` +
    `<g fill="#DCE9DA" stroke="#8FA98F" stroke-width="1.6">` +
    `<rect x="18" y="34" width="14" height="42" rx="5"/><rect x="36" y="26" width="16" height="58" rx="6"/>` +
    `<rect x="128" y="26" width="16" height="58" rx="6"/><rect x="148" y="34" width="14" height="42" rx="5"/>` +
    `</g>`,
)

const bowl = def(
  'd3-bowl',
  '面碗',
  170,
  140,
  `<path d="M26 62 H144 C144 104 116 126 85 126 C54 126 26 104 26 62 Z" fill="#FFFDF7" stroke="#C9AE85" stroke-width="1.6"/>` +
    `<path d="M26 62 H144" stroke="#D9A441" stroke-width="2.4"/>` +
    `<path d="M50 50 q10 -18 24 -8 q4 -16 22 -8 q12 -14 26 -2 q16 -6 20 12" fill="none" stroke="#E4DACA" stroke-width="2.6" stroke-linecap="round"/>` +
    `<g fill="none" stroke="#C9AE85" stroke-width="1.4" stroke-linecap="round" opacity="0.75">` +
    `<path d="M62 22 q6 -10 0 -16"/><path d="M86 20 q6 -10 0 -16"/><path d="M110 22 q6 -10 0 -16"/>` +
    `</g>`,
)

const gift = def(
  'd3-gift',
  '礼物盒',
  160,
  160,
  `<rect x="20" y="62" width="120" height="84" rx="6" fill="#FBEFF0" stroke="#D98C8C" stroke-width="1.6"/>` +
    `<rect x="10" y="40" width="140" height="30" rx="6" fill="#F6E0DE" stroke="#D98C8C" stroke-width="1.6"/>` +
    `<path d="M80 40 V146" stroke="#D98C8C" stroke-width="2.4"/>` +
    `<path d="M80 40 C60 40 46 22 58 14 C70 6 78 24 80 40 Z" fill="#E7AFB0" stroke="#D98C8C" stroke-width="1.3"/>` +
    `<path d="M80 40 C100 40 114 22 102 14 C90 6 82 24 80 40 Z" fill="#E7AFB0" stroke="#D98C8C" stroke-width="1.3"/>`,
)

const snow = def(
  'd3-snow',
  '雪花',
  140,
  140,
  `<g stroke="#8FA9C4" stroke-width="2.2" stroke-linecap="round">` +
    `<path d="M70 14 V126"/><path d="M22 42 L118 98"/><path d="M118 42 L22 98"/>` +
    `</g>` +
    `<g stroke="#A8BED6" stroke-width="1.6" stroke-linecap="round">` +
    `<path d="M70 34 L56 24 M70 34 L84 24 M70 106 L56 116 M70 106 L84 116"/>` +
    `<path d="M40 56 L26 54 M44 82 L30 88 M100 56 L114 54 M96 82 L110 88"/>` +
    `</g>`,
)

const firework = def(
  'd3-firework',
  '烟花',
  170,
  170,
  `<g stroke="#D9A441" stroke-width="2.2" stroke-linecap="round" opacity="0.9">` +
    Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2
      const x1 = 85 + Math.cos(a) * 22
      const y1 = 85 + Math.sin(a) * 22
      const x2 = 85 + Math.cos(a) * 62
      const y2 = 85 + Math.sin(a) * 62
      return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`
    }).join('') +
    `</g>` +
    `<g fill="#E7AFB0"><circle cx="85" cy="85" r="9"/></g>` +
    `<g fill="#C97B63" opacity="0.85"><circle cx="85" cy="16" r="4"/><circle cx="85" cy="154" r="4"/><circle cx="16" cy="85" r="4"/><circle cx="154" cy="85" r="4"/></g>`,
)

const controller = def(
  'd3-controller',
  '手柄',
  190,
  130,
  `<path d="M52 34 H138 C166 34 180 56 176 84 C172 112 156 118 140 100 L130 88 H60 L50 100 C34 118 18 112 14 84 C10 56 24 34 52 34 Z" fill="#EFE7DA" stroke="#C9AE85" stroke-width="1.6"/>` +
    `<circle cx="58" cy="62" r="8" fill="#8FA98F"/><circle cx="76" cy="80" r="8" fill="#8FA98F"/>` +
    `<circle cx="132" cy="60" r="7" fill="#C97B63"/><circle cx="150" cy="78" r="7" fill="#D9A441"/>`,
)

const boba = def(
  'd3-boba',
  '奶茶',
  130,
  170,
  `<path d="M28 44 H102 L94 156 H36 Z" fill="#FFFDF7" stroke="#C9AE85" stroke-width="1.6"/>` +
    `<path d="M32 110 H98 L94 156 H36 Z" fill="#E7D3B0" opacity="0.85"/>` +
    `<path d="M26 44 H104" stroke="#D9A441" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M52 34 L44 8" stroke="#C97B63" stroke-width="4" stroke-linecap="round"/>` +
    `<g fill="#8C6A4A"><circle cx="50" cy="128" r="6"/><circle cx="68" cy="140" r="6"/><circle cx="84" cy="126" r="6"/></g>`,
)

const pressed = def(
  'd3-pressed',
  '植物标本',
  200,
  260,
  `<rect x="10" y="10" width="180" height="240" rx="6" fill="#FFFDF7" stroke="#D9C3A0" stroke-width="1.6"/>` +
    `<rect x="20" y="20" width="160" height="220" rx="4" fill="none" stroke="#E4DACA" stroke-width="1"/>` +
    `<path d="M100 224 C96 176 92 128 88 58" fill="none" stroke="#8FA98F" stroke-width="2"/>` +
    `<g fill="#A8BCA4">` +
    Array.from({ length: 7 }, (_, i) => {
      const y = 60 + i * 24
      return `<path d="M${90 - i} ${y} q-30 -8 -40 -26 q30 -2 40 26 Z"/><path d="M${92 - i} ${y + 10} q30 -8 40 -26 q-30 -2 -40 26 Z"/>`
    }).join('') +
    `</g>` +
    `<g fill="#D98C8C" opacity="0.9"><circle cx="150" cy="60" r="9"/><circle cx="150" cy="80" r="7"/></g>` +
    `<path d="M30 232 H170" stroke="#E4DACA" stroke-width="1.5"/>`,
)

const magazine = def(
  'd3-magazine',
  '复古报刊',
  320,
  220,
  `<rect x="8" y="8" width="304" height="204" rx="4" fill="#F5EFE1" stroke="#C9AE85" stroke-width="1.6"/>` +
    `<path d="M8 44 H312" stroke="#8C6A4A" stroke-width="2.4"/>` +
    `<path d="M8 50 H312" stroke="#C9AE85" stroke-width="1"/>` +
    `<g fill="#8C6A4A" opacity="0.85">` +
    `<rect x="24" y="20" width="120" height="12" rx="3"/>` +
    `<rect x="252" y="22" width="44" height="8" rx="3"/>` +
    `</g>` +
    `<g stroke="#C9AE85" stroke-width="1.2" opacity="0.9">` +
    `<path d="M160 56 V204"/>` +
    `<path d="M24 74 H146 M24 88 H146 M24 102 H146 M24 116 H146 M24 130 H146"/>` +
    `<path d="M176 74 H296 M176 88 H296 M176 102 H296 M176 116 H296 M176 130 H296 M176 144 H296 M176 158 H296"/>` +
    `</g>` +
    `<rect x="24" y="146" width="122" height="58" fill="#E4DACA" stroke="#C9AE85" stroke-width="1.2"/>` +
    `<path d="M24 186 L58 162 L82 180 L104 158 L146 190 L146 204 L24 204 Z" fill="#D8E0D4"/>`,
)

const framedeco = def(
  'd3-frame',
  '复古边框',
  340,
  260,
  `<rect x="6" y="6" width="328" height="248" rx="4" fill="none" stroke="#B08A5A" stroke-width="3"/>` +
    `<rect x="16" y="16" width="308" height="228" rx="3" fill="none" stroke="#D9C3A0" stroke-width="1.4"/>` +
    `<g fill="none" stroke="#B08A5A" stroke-width="2" stroke-linecap="round">` +
    `<path d="M6 34 V6 H34"/><path d="M306 6 H334 V34"/><path d="M334 226 V254 H306"/><path d="M34 254 H6 V226"/>` +
    `</g>` +
    `<g stroke="#D9C3A0" stroke-width="1.2" opacity="0.8">` +
    `<path d="M170 6 V16 M170 244 V254 M6 130 H16 M324 130 H334"/>` +
    `</g>`,
)

const heartline = def(
  'd3-heartline',
  '心率线',
  220,
  100,
  `<path d="M12 60 H52 L64 60 L74 26 L86 92 L98 44 L108 60 H132 L144 60 L154 34 L164 84 L174 60 H208" fill="none" stroke="#C97B63" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<g stroke="#E4DACA" stroke-width="1.2"><path d="M12 84 H208"/></g>`,
)


export const PRO_ASSETS_3: AssetDef[] = [
  shell,
  palm,
  wave,
  starfish,
  moon,
  stars,
  meteor,
  pencil,
  ruler,
  timetable,
  cup,
  beans,
  tent,
  mountain,
  cake,
  candle,
  books,
  glasses,
  checklist,
  popcorn,
  paw,
  cart,
  dumbbell,
  bowl,
  gift,
  snow,
  firework,
  controller,
  boba,
  pressed,
  magazine,
  framedeco,
  heartline,
]
