import type { AssetDef, CatId } from './assets'

const NS = 'xmlns="http://www.w3.org/2000/svg"'
const SERIF = "Georgia, 'Times New Roman', serif"
const SCRIPT = "'Snell Roundhand', 'Bradley Hand', 'Segoe Script', Georgia, serif"

function pro(id: string, name: string, w: number, h: number, body: string): AssetDef {
  return { id, name, cat: 'pro' as CatId, w, h, svg: `<svg ${NS} viewBox="0 0 ${w} ${h}">${body}</svg>` }
}

const branch = pro(
  'pro-branch',
  '手绘枝',
  240,
  120,
  `<g fill="none" stroke="#6E8B7B" stroke-width="1.5" stroke-linecap="round"><path d="M12 106 C 82 98, 152 70, 228 18"/></g>` +
    `<g fill="#9CAF9A" opacity="0.88">` +
    `<path d="M46 96 q 16 -24 38 -17 q -15 24 -38 17 z"/>` +
    `<path d="M98 78 q 16 -24 38 -17 q -15 24 -38 17 z" opacity="0.92"/>` +
    `<path d="M150 56 q 16 -24 38 -17 q -15 24 -38 17 z" opacity="0.85"/>` +
    `<path d="M196 34 q 14 -22 34 -15 q -13 22 -34 15 z" opacity="0.8"/>` +
    `</g>` +
    `<g fill="#BBC9B2" opacity="0.7">` +
    `<path d="M72 88 q -9 -22 -29 -24 q 10 22 29 24 z"/>` +
    `<path d="M124 68 q -9 -22 -29 -24 q 10 22 29 24 z"/>` +
    `<path d="M174 46 q -8 -20 -26 -22 q 9 20 26 22 z"/>` +
    `</g>`,
)

const wreath = pro(
  'pro-wreath',
  '小叶环',
  200,
  200,
  `<circle cx="100" cy="100" r="70" fill="none" stroke="#B7C4AE" stroke-width="1" opacity="0.6"/>` +
    Array.from({ length: 14 }, (_, i) => {
      const a = (360 / 14) * i
      const c = i % 2 ? '#AFC0A6' : '#8CA084'
      return `<g transform="rotate(${a} 100 100)"><path d="M100 24 q 14 13 0 28 q -14 -15 0 -28 z" fill="${c}" opacity="0.9"/></g>`
    }).join('') +
    `<g fill="none" stroke="#6E8B7B" stroke-width="1.4" stroke-linecap="round"><path d="M100 16 v10"/><path d="M100 174 v10"/><path d="M16 100 h10"/><path d="M174 100 h10"/></g>`,
)

const dried = pro(
  'pro-dried',
  '干花束',
  170,
  230,
  `<g fill="none" stroke="#8C9070" stroke-width="1.3" stroke-linecap="round">` +
    `<path d="M84 220 C 82 180, 78 140, 70 96"/>` +
    `<path d="M86 220 C 90 178, 96 140, 104 100"/>` +
    `<path d="M85 220 C 85 176, 85 130, 86 84"/>` +
    `</g>` +
    `<g fill="#A9AE8A" opacity="0.85">` +
    `<ellipse cx="66" cy="84" rx="7" ry="11"/>` +
    `<ellipse cx="72" cy="64" rx="6.5" ry="10" opacity="0.9"/>` +
    `<ellipse cx="78" cy="46" rx="6" ry="9" opacity="0.85"/>` +
    `<ellipse cx="86" cy="30" rx="5.5" ry="8.5" opacity="0.8"/>` +
    `<ellipse cx="106" cy="88" rx="7" ry="11" opacity="0.9"/>` +
    `<ellipse cx="100" cy="68" rx="6.5" ry="10" opacity="0.85"/>` +
    `<ellipse cx="94" cy="50" rx="6" ry="9" opacity="0.8"/>` +
    `</g>` +
    `<g stroke="#C6B99B" stroke-width="1.1" fill="none">` +
    `<path d="M40 214 q 44 -12 92 0"/>` +
    `<path d="M40 208 q 44 -12 92 0"/>` +
    `</g>`,
)

function label(id: string, name: string, text: string): AssetDef {
  return pro(
    id,
    name,
    200,
    64,
    `<rect x="2" y="2" width="196" height="60" rx="10" fill="#FBF7F0" stroke="#D8CDBB" stroke-width="1"/>` +
      `<rect x="7" y="7" width="186" height="50" rx="7" fill="none" stroke="#E4DACA" stroke-width="0.8"/>` +
      `<text x="100" y="40" text-anchor="middle" font-family="${SCRIPT}" font-size="24" fill="#6B6661">${text}</text>` +
      `<path d="M54 50 q 46 8 92 0" fill="none" stroke="#C9A96E" stroke-width="1.2" stroke-linecap="round"/>`,
  )
}

const labels = [
  label('pro-label-love', '标签·with love', 'with love'),
  label('pro-label-notes', '标签·notes', 'notes'),
  label('pro-label-day', '标签·happy day', 'happy day'),
]

const stamp = pro(
  'pro-stamp',
  '复古邮票',
  140,
  170,
  `<rect x="1" y="1" width="138" height="168" fill="#F7F3EC"/>` +
    `<rect x="4" y="4" width="132" height="162" fill="none" stroke="#CBB79A" stroke-width="5" stroke-dasharray="1.5 6" opacity="0.9"/>` +
    `<rect x="20" y="24" width="100" height="112" fill="#EEF1EC" stroke="#A8BCC7" stroke-width="0.8"/>` +
    `<g fill="none" stroke="#8CA084" stroke-width="1.2" stroke-linecap="round"><path d="M40 120 C 58 96, 78 84, 100 66"/></g>` +
    `<path d="M62 112 q 12 -16 28 -11 q -11 16 -28 11 z" fill="#9CAF9A" opacity="0.85"/>` +
    `<path d="M84 92 q 12 -16 28 -11 q -11 16 -28 11 z" fill="#9CAF9A" opacity="0.75"/>` +
    `<text x="70" y="156" text-anchor="middle" font-family="${SERIF}" font-size="9" letter-spacing="2.4" fill="#6B6661">PAR AVION</text>`,
)

const postmark = pro(
  'pro-postmark',
  '邮戳',
  150,
  150,
  `<circle cx="60" cy="75" r="46" fill="none" stroke="#7E97A6" stroke-width="1.6" opacity="0.85"/>` +
    `<circle cx="60" cy="75" r="36" fill="none" stroke="#7E97A6" stroke-width="0.9" opacity="0.7"/>` +
    `<text x="60" y="72" text-anchor="middle" font-family="${SERIF}" font-size="11" letter-spacing="1.4" fill="#7E97A6">POST</text>` +
    `<text x="60" y="88" text-anchor="middle" font-family="${SERIF}" font-size="9" letter-spacing="1.2" fill="#7E97A6">2026</text>` +
    `<g fill="none" stroke="#7E97A6" stroke-width="1.3" opacity="0.8">` +
    `<path d="M104 62 q 10 -8 20 0 q 10 8 20 0"/>` +
    `<path d="M104 76 q 10 -8 20 0 q 10 8 20 0"/>` +
    `<path d="M104 90 q 10 -8 20 0 q 10 8 20 0"/>` +
    `</g>`,
)

const ticket = pro(
  'pro-ticket',
  '票根',
  240,
  100,
  `<rect x="2" y="2" width="236" height="96" rx="6" fill="#F3E7D8" stroke="#CBB79A" stroke-width="1"/>` +
    `<line x1="168" y1="6" x2="168" y2="94" stroke="#CBB79A" stroke-width="1.2" stroke-dasharray="5 5"/>` +
    `<text x="86" y="44" text-anchor="middle" font-family="${SERIF}" font-size="15" letter-spacing="3" fill="#6B6661">ADMIT</text>` +
    `<text x="86" y="66" text-anchor="middle" font-family="${SERIF}" font-size="15" letter-spacing="3" fill="#6B6661">ONE</text>` +
    `<circle cx="204" cy="50" r="20" fill="none" stroke="#C08A72" stroke-width="1.2"/>` +
    `<path d="M204 34 l 5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1 z" fill="#C08A72" opacity="0.6"/>`,
)

const oldpaper = pro(
  'pro-oldpaper',
  '旧纸片',
  200,
  150,
  `<path d="M6 12 L46 6 L88 14 L132 5 L176 13 L194 8 V138 L156 144 L114 136 L70 145 L28 137 L6 142 Z" fill="#F0E7D6" opacity="0.95"/>` +
    `<g stroke="#D3C4AA" stroke-width="1" opacity="0.8">` +
    Array.from({ length: 6 }, (_, i) => {
      return `<line x1="24" y1="${44 + i * 15}" x2="${176 - (i % 3) * 24}" y2="${44 + i * 15}"/>`
    }).join('') +
    `</g>` +
    `<path d="M6 12 L46 6 L88 14 L132 5 L176 13 L194 8" fill="none" stroke="#C4B296" stroke-width="0.8"/>`,
)

const foldnote = pro(
  'pro-foldnote',
  '折角便签',
  160,
  150,
  `<path d="M8 6 H132 L152 26 V144 H8 Z" fill="#FBF3E4" stroke="#E0D3BB" stroke-width="1"/>` +
    `<path d="M132 6 L152 26 H132 Z" fill="#EFE3CC" stroke="#E0D3BB" stroke-width="1"/>` +
    `<g stroke="#E4D7C0" stroke-width="0.9" opacity="0.9">` +
    `<line x1="22" y1="46" x2="138" y2="46"/>` +
    `<line x1="22" y1="66" x2="138" y2="66"/>` +
    `<line x1="22" y1="86" x2="122" y2="86"/>` +
    `</g>`,
)

const pearl = pro(
  'pro-pearl',
  '珍珠链',
  240,
  56,
  `<defs><radialGradient id="pr" cx="35%" cy="30%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="#EFEAE2"/><stop offset="1" stop-color="#D6CEC2"/></radialGradient></defs>` +
    Array.from({ length: 11 }, (_, i) => {
      const cy = 28 + Math.sin(i * 1.1) * 3
      return `<circle cx="${18 + i * 20}" cy="${cy.toFixed(1)}" r="8" fill="url(#pr)"/>`
    }).join(''),
)

const bow = pro(
  'pro-bow',
  '缎带结',
  170,
  120,
  `<g fill="none" stroke="#C08A72" stroke-width="2" stroke-linecap="round">` +
    `<path d="M85 58 C 60 26, 22 30, 24 52 C 26 74, 62 74, 85 58 Z" fill="#E4B7A4" fill-opacity="0.55"/>` +
    `<path d="M85 58 C 110 26, 148 30, 146 52 C 144 74, 108 74, 85 58 Z" fill="#E4B7A4" fill-opacity="0.55"/>` +
    `<path d="M85 60 C 78 82, 66 100, 52 112"/>` +
    `<path d="M85 60 C 92 82, 104 100, 118 112"/>` +
    `</g>` +
    `<circle cx="85" cy="58" r="6" fill="#C08A72"/>`,
)

const sparkle = pro(
  'pro-sparkle',
  '闪光',
  120,
  120,
  `<path d="M60 14 C 66 44, 76 54, 106 60 C 76 66, 66 76, 60 106 C 54 76, 44 66, 14 60 C 44 54, 54 44, 60 14 Z" fill="#E8D6A8" stroke="#C9A96E" stroke-width="1"/>` +
    `<circle cx="96" cy="26" r="3" fill="#C9A96E" opacity="0.6"/>` +
    `<circle cx="26" cy="96" r="2" fill="#C9A96E" opacity="0.5"/>`,
)

const clip = pro(
  'pro-clip',
  '回形针',
  70,
  150,
  `<path d="M24 44 V118 a12 12 0 0 0 24 0 V34 a8 8 0 0 0 -16 0 V112" fill="none" stroke="#9AA3A8" stroke-width="5" stroke-linecap="round"/>`,
)

const staple = pro(
  'pro-staple',
  '订书钉',
  70,
  40,
  `<path d="M14 30 V14 H56 V30" fill="none" stroke="#9AA3A8" stroke-width="5" stroke-linecap="round"/>`,
)

const lace = pro(
  'pro-lace',
  '蕾丝边',
  200,
  44,
  `<rect x="0" y="4" width="200" height="12" fill="#F7F3EC"/>` +
    Array.from({ length: 13 }, (_, i) => {
      return `<circle cx="${8 + i * 15.4}" cy="18" r="7.4" fill="#F7F3EC" stroke="#E2D9CB" stroke-width="0.8"/>`
    }).join('') +
    `<g fill="#D9CFC0">` +
    Array.from({ length: 13 }, (_, i) => {
      return `<circle cx="${8 + i * 15.4}" cy="19" r="1.1"/>`
    }).join('') +
    `</g>`,
)

const film = pro(
  'pro-film',
  '胶卷条',
  200,
  72,
  `<rect x="0" y="6" width="200" height="60" rx="3" fill="#4A4744"/>` +
    Array.from({ length: 9 }, (_, i) => {
      return `<rect x="${6 + i * 21}" y="1" width="12" height="9" rx="2" fill="#F7F3EC" opacity="0.85"/>`
    }).join('') +
    Array.from({ length: 9 }, (_, i) => {
      return `<rect x="${6 + i * 21}" y="62" width="12" height="9" rx="2" fill="#F7F3EC" opacity="0.85"/>`
    }).join('') +
    `<g fill="#8A8378" opacity="0.5">` +
    Array.from({ length: 4 }, (_, i) => {
      return `<rect x="${8 + i * 48}" y="16" width="40" height="40" rx="2"/>`
    }).join('') +
    `</g>`,
)

const polaroid = pro(
  'pro-polaroid',
  '拍立得',
  170,
  200,
  `<rect x="4" y="4" width="162" height="192" rx="3" fill="#FFFFFF" stroke="#E4DACA" stroke-width="1"/>` +
    `<rect x="16" y="16" width="138" height="130" fill="#EDE7DC"/>` +
    `<text x="85" y="176" text-anchor="middle" font-family="${SCRIPT}" font-size="18" fill="#8A8378">memory</text>`,
)

const linen = pro(
  'pro-tape-linen',
  '亚麻胶带',
  200,
  60,
  `<path d="M4 6 L8 13 L3 20 L9 27 L4 34 L8 41 L3 48 L7 54 H193 L197 48 L192 41 L196 34 L191 27 L197 20 L192 13 L196 6 Z" fill="#E7E0D2" opacity="0.95"/>` +
    `<g fill="#C7BBA4" opacity="0.7">` +
    Array.from({ length: 60 }, (_, i) => {
      const cx = 10 + (i % 20) * 9.6
      const cy = 14 + Math.floor(i / 20) * 14
      return `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="1"/>`
    }).join('') +
    `</g>`,
)

const arch = pro(
  'pro-frame-arch',
  '拱形细框',
  200,
  260,
  `<path d="M14 246 V104 A86 86 0 0 1 186 104 V246" fill="none" stroke="#B8A98F" stroke-width="1.6"/>` +
    `<path d="M24 240 V106 A76 76 0 0 1 176 106 V240" fill="none" stroke="#D6CBB6" stroke-width="0.9"/>`,
)

export const PRO_ASSETS: AssetDef[] = [
  branch,
  wreath,
  dried,
  ...labels,
  stamp,
  postmark,
  ticket,
  oldpaper,
  foldnote,
  pearl,
  bow,
  sparkle,
  clip,
  staple,
  lace,
  film,
  polaroid,
  linen,
  arch,
]
