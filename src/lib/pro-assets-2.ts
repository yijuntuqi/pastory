import type { AssetDef, CatId } from './assets'

const NS = 'xmlns="http://www.w3.org/2000/svg"'
const SERIF = "Georgia, 'Times New Roman', serif"
const PAPER = '#F4ECDF'
const PAPER2 = '#EFE2CE'
const KRAFT = '#D9C3A0'
const EDGE = 'rgba(58,46,30,0.22)'
const EDGE2 = 'rgba(58,46,30,0.12)'

function def(id: string, name: string, cat: CatId, w: number, h: number, body: string): AssetDef {
  return { id, name, cat, w, h, svg: `<svg ${NS} viewBox="0 0 ${w} ${h}">${body}</svg>` }
}

function list(n: number, fn: (i: number) => string): string {
  return Array.from({ length: n }, (_, i) => fn(i)).join('')
}

function perf(n: number, fn: (i: number) => string): string {
  return list(n, fn)
}

function zig(from: number, to: number, y: number, amp: number, step: number): string {
  const dir = to < from ? -1 : 1
  let d = ''
  let i = 0
  for (let x = from; dir < 0 ? x >= to : x <= to; x += dir * step) {
    d += ` L${Math.round(x)} ${i % 2 === 0 ? y + amp : y - amp}`
    i += 1
  }
  return d
}

const stampMaskPerf =
  perf(8, (i) => `<circle cx="${10 + i * 23}" cy="10" r="6" fill="#000"/>`) +
  perf(8, (i) => `<circle cx="${10 + i * 23}" cy="190" r="6" fill="#000"/>`) +
  perf(8, (i) => `<circle cx="10" cy="${10 + i * 23}" r="6" fill="#000"/>`) +
  perf(8, (i) => `<circle cx="170" cy="${10 + i * 23}" r="6" fill="#000"/>`)

const arch = def(
  'cut-arch',
  '拱形开窗',
  'cut',
  200,
  260,
  `<path fill-rule="evenodd" d="M8 252 V100 A92 92 0 0 1 192 100 V252 Z M32 228 V100 A68 68 0 0 1 168 100 V228 Z" fill="${PAPER}"/>` +
    `<path d="M8 252 V100 A92 92 0 0 1 192 100 V252" fill="none" stroke="${EDGE}" stroke-width="1.2"/>` +
    `<path d="M32 228 V100 A68 68 0 0 1 168 100 V228" fill="none" stroke="${EDGE}" stroke-width="3"/>` +
    `<path d="M44 100 A56 56 0 0 1 156 100" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="5" stroke-linecap="round"/>`,
)

const rectWind = def(
  'cut-rect',
  '方框开窗',
  'cut',
  220,
  180,
  `<path fill-rule="evenodd" d="M10 10 H210 V170 H10 Z M34 34 H186 V146 H34 Z" fill="${PAPER}"/>` +
    `<path d="M10 10 H210 V170 H10 Z" fill="none" stroke="${EDGE}" stroke-width="1.2"/>` +
    `<path d="M34 34 H186 V146 H34 Z" fill="none" stroke="${EDGE}" stroke-width="3"/>` +
    `<path d="M20 22 H200 M20 158 H200" stroke="rgba(255,255,255,0.62)" stroke-width="4" stroke-linecap="round"/>`,
)

const circleWind = def(
  'cut-circle',
  '圆窗',
  'cut',
  200,
  200,
  `<mask id="p-cw"><rect width="200" height="200" fill="#fff"/><circle cx="100" cy="100" r="74" fill="#000"/></mask>` +
    `<circle cx="100" cy="100" r="94" fill="${PAPER}" mask="url(#p-cw)"/>` +
    `<circle cx="100" cy="100" r="94" fill="none" stroke="${EDGE}" stroke-width="1.2"/>` +
    `<circle cx="100" cy="100" r="74" fill="none" stroke="${EDGE}" stroke-width="3"/>` +
    `<circle cx="100" cy="100" r="86" fill="none" stroke="${EDGE2}" stroke-width="1.4" stroke-dasharray="2 7"/>`,
)

const blobWind = def(
  'cut-blob',
  '花边开窗',
  'cut',
  220,
  240,
  `<path fill-rule="evenodd" d="M12 118 C 12 46, 62 12, 116 16 C 176 20, 210 58, 206 116 C 202 184, 166 228, 106 226 C 46 224, 12 190, 12 118 Z M42 118 C 42 66, 80 44, 116 47 C 158 50, 180 76, 177 116 C 174 166, 148 196, 106 195 C 64 194, 42 170, 42 118 Z" fill="${PAPER}"/>` +
    `<path d="M12 118 C 12 46, 62 12, 116 16 C 176 20, 210 58, 206 116 C 202 184, 166 228, 106 226 C 46 224, 12 190, 12 118 Z" fill="none" stroke="${EDGE}" stroke-width="1.2"/>` +
    `<path d="M42 118 C 42 66, 80 44, 116 47 C 158 50, 180 76, 177 116 C 174 166, 148 196, 106 195 C 64 194, 42 170, 42 118 Z" fill="none" stroke="${EDGE}" stroke-width="3"/>`,
)

const filmWind = def(
  'cut-film',
  '胶片开窗',
  'cut',
  240,
  160,
  `<mask id="p-fw"><rect width="240" height="160" fill="#fff"/><rect x="36" y="48" width="168" height="64" rx="3" fill="#000"/>${perf(
    9,
    (i) => `<rect x="${22 + i * 23}" y="30" width="13" height="11" rx="2" fill="#000"/>`,
  )}${perf(9, (i) => `<rect x="${22 + i * 23}" y="119" width="13" height="11" rx="2" fill="#000"/>`)}</mask>` +
    `<g mask="url(#p-fw)">` +
    `<rect x="12" y="22" width="216" height="116" rx="8" fill="#33302C"/>` +
    `</g>` +
    `<rect x="12" y="22" width="216" height="116" rx="8" fill="none" stroke="${EDGE}" stroke-width="1"/>` +
    `<rect x="36" y="48" width="168" height="64" rx="3" fill="none" stroke="rgba(255,255,255,0.34)" stroke-width="1.5"/>`,
)

const duoWind = def(
  'cut-duo',
  '双圆开窗',
  'cut',
  240,
  150,
  `<mask id="p-dw"><rect width="240" height="150" fill="#fff"/><circle cx="72" cy="75" r="52" fill="#000"/><circle cx="168" cy="75" r="52" fill="#000"/></mask>` +
    `<g mask="url(#p-dw)"><rect x="12" y="15" width="216" height="120" rx="60" fill="${PAPER}"/></g>` +
    `<rect x="12" y="15" width="216" height="120" rx="60" fill="none" stroke="${EDGE}" stroke-width="1.2"/>` +
    `<circle cx="72" cy="75" r="52" fill="none" stroke="${EDGE}" stroke-width="3"/>` +
    `<circle cx="168" cy="75" r="52" fill="none" stroke="${EDGE}" stroke-width="3"/>`,
)

const stampWind = def(
  'cut-stamp',
  '邮票开窗',
  'cut',
  180,
  200,
  `<mask id="p-sw"><rect width="180" height="200" fill="#fff"/><rect x="30" y="30" width="120" height="140" fill="#000"/>${stampMaskPerf}</mask>` +
    `<g mask="url(#p-sw)"><rect width="180" height="200" fill="${PAPER}"/></g>` +
    `<path d="M0 0 H180 V200 H0 Z" fill="none" stroke="${EDGE}" stroke-width="1"/>` +
    `<rect x="30" y="30" width="120" height="140" fill="none" stroke="${EDGE}" stroke-width="3"/>`,
)

const fern = def(
  'p2-fern',
  '蕨叶',
  'plant',
  200,
  220,
  `<path d="M100 212 C 94 152, 98 92, 110 14" fill="none" stroke="#7C9079" stroke-width="1.6" stroke-linecap="round"/>` +
    `<g fill="#9CAF9A" opacity="0.9">${list(13, (i) => {
      const y = 198 - i * 14
      const len = 56 - i * 3.4
      const x = 100 + i * 0.7
      return (
        `<path d="M${x} ${y} q ${-len * 0.55} -13 ${-len} -5 q ${len * 0.35} 10 ${len} 5 z"/>` +
        `<path d="M${x} ${y} q ${len * 0.55} -13 ${len} -5 q ${-len * 0.35} 10 ${-len} 5 z"/>`
      )
    })}</g>`,
)

const olive = def(
  'p2-olive',
  '橄榄枝',
  'plant',
  240,
  120,
  `<path d="M14 106 C 74 96, 168 62, 228 16" fill="none" stroke="#88997F" stroke-width="1.8" stroke-linecap="round"/>` +
    `<g fill="#A7B79C" opacity="0.92">${list(9, (i) => {
      const t = i / 8
      const x = 24 + t * 196
      const y = 100 - Math.pow(t, 1.25) * 80
      const dx = (i % 2 ? 1 : -1) * 26
      const cx = x + dx
      const cy = y - 8
      return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="17" ry="7.5" transform="rotate(${i % 2 ? -28 : 28},${cx.toFixed(1)},${cy.toFixed(1)})"/>`
    })}</g>` +
    `<g fill="#6F7E66"><circle cx="86" cy="70" r="6"/><circle cx="152" cy="42" r="5.4"/></g>`,
)

const dandelion = def(
  'p2-dandelion',
  '蒲公英',
  'plant',
  200,
  220,
  `<g stroke="#B7AE9C" stroke-width="0.9">${list(24, (i) => {
    const a = i * ((Math.PI * 2) / 24)
    const x = (100 + Math.cos(a) * 48).toFixed(1)
    const y = (62 + Math.sin(a) * 48).toFixed(1)
    return `<path d="M100 62 L${x} ${y}"/>`
  })}</g>` +
    `<g fill="#CBC3B1">${list(24, (i) => {
      const a = i * ((Math.PI * 2) / 24)
      const x = (100 + Math.cos(a) * 48).toFixed(1)
      const y = (62 + Math.sin(a) * 48).toFixed(1)
      return `<circle cx="${x}" cy="${y}" r="1.5"/>`
    })}</g>` +
    `<circle cx="100" cy="62" r="5" fill="#CFC7B6"/>` +
    `<path d="M100 68 C 99 130, 101 176, 100 212" fill="none" stroke="#A8B39C" stroke-width="1.6"/>` +
    `<g stroke="#CBC3B1" stroke-width="0.9" fill="none"><path d="M152 40 L162 28"/><path d="M162 28 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0"/></g>`,
)

const lavender = def(
  'p2-lavender',
  '薰衣草',
  'plant',
  150,
  230,
  `<path d="M75 226 C 73 176, 74 130, 78 78" fill="none" stroke="#8C9A82" stroke-width="1.6"/>` +
    `<g fill="#9E9BC0" opacity="0.92">${list(16, (i) => {
      const y = 84 + i * 8.6
      const w = 7 - Math.abs(i - 8) * 0.22
      const dx = (i % 2 ? 1 : -1) * 3.2
      return `<ellipse cx="${(76 + dx).toFixed(1)}" cy="${y.toFixed(1)}" rx="${Math.max(2.4, w).toFixed(1)}" ry="${Math.max(2.6, w * 0.85).toFixed(1)}"/>`
    })}</g>` +
    `<g stroke="#8C9A82" stroke-width="1.1" fill="none"><path d="M76 150 C 58 148, 44 138, 38 124"/><path d="M76 176 C 94 174, 108 164, 112 152"/></g>`,
)

const postmark = def(
  'p2-postmark',
  '邮戳',
  'stamp',
  180,
  180,
  `<circle cx="90" cy="90" r="76" fill="none" stroke="#8A7A6A" stroke-width="3" opacity="0.85"/>` +
    `<circle cx="90" cy="90" r="70" fill="none" stroke="#8A7A6A" stroke-width="1" stroke-dasharray="2 6" opacity="0.7"/>` +
    `<circle cx="90" cy="90" r="62" fill="none" stroke="#8A7A6A" stroke-width="1.1" opacity="0.8"/>` +
    `<text x="90" y="82" text-anchor="middle" font-family="${SERIF}" font-size="16" letter-spacing="1.5" fill="#8A7A6A">ZHUHAI</text>` +
    `<text x="90" y="104" text-anchor="middle" font-family="${SERIF}" font-size="12" letter-spacing="1.5" fill="#8A7A6A" opacity="0.88">2026.10.09</text>` +
    `<path d="M30 122 H150 M30 132 H116" stroke="#8A7A6A" stroke-width="2" opacity="0.45" stroke-linecap="round"/>`,
)

const airmail = def(
  'p2-airmail',
  '航空邮票',
  'stamp',
  180,
  200,
  `<mask id="p-am"><rect width="180" height="200" fill="#fff"/>${stampMaskPerf}</mask>` +
    `<g mask="url(#p-am)"><rect width="180" height="200" fill="#FBF6EC"/></g>` +
    `<g fill="none" stroke-width="3" opacity="0.7"><path d="M14 26 H166" stroke="#4A6E9E"/><path d="M14 36 H166" stroke="#C0503E"/></g>` +
    `<path d="M52 112 L134 76 L104 150 L96 118 Z" fill="none" stroke="#5B6B7C" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<path d="M96 118 L134 76" stroke="#5B6B7C" stroke-width="2.2"/>` +
    `<text x="90" y="178" text-anchor="middle" font-family="${SERIF}" font-size="13" letter-spacing="3" fill="#6B6157">AIR MAIL</text>`,
)

const dater = def(
  'p2-dater',
  '日期章',
  'stamp',
  170,
  150,
  `<rect x="8" y="8" width="154" height="134" rx="8" fill="${PAPER2}"/>` +
    `<rect x="8" y="8" width="154" height="134" rx="8" fill="none" stroke="${EDGE}" stroke-width="1.5"/>` +
    `<rect x="22" y="22" width="126" height="106" rx="4" fill="none" stroke="${EDGE}" stroke-width="1.2" stroke-dasharray="5 4"/>` +
    `<text x="85" y="68" text-anchor="middle" font-family="${SERIF}" font-size="22" letter-spacing="2" fill="#6B6157">OCT 09</text>` +
    `<text x="85" y="98" text-anchor="middle" font-family="${SERIF}" font-size="17" letter-spacing="4" fill="#8A7A6A">2026</text>` +
    `<path d="M40 116 H130" stroke="${EDGE}" stroke-width="1.2"/>`,
)

const receipt = def(
  'p2-receipt',
  '购物小票',
  'note',
  180,
  300,
  `<path d="M16 8 H164 V264${zig(164, 16, 264, 9, 13)} Z" fill="#FCF9F2"/>` +
    `<path d="M16 8 H164 V264${zig(164, 16, 264, 9, 13)} Z" fill="none" stroke="${EDGE}" stroke-width="1"/>` +
    `<text x="90" y="44" text-anchor="middle" font-family="${SERIF}" font-size="14" letter-spacing="3" fill="#6B6157">RECEIPT</text>` +
    `<path d="M32 58 H148" stroke="${EDGE}" stroke-width="1" stroke-dasharray="4 4"/>` +
    `${list(7, (i) => `<path d="M32 ${80 + i * 22} H${120 - (i % 3) * 18}" stroke="rgba(58,46,30,0.3)" stroke-width="2" stroke-linecap="round"/>`)}` +
    `<path d="M32 244 H148" stroke="${EDGE}" stroke-width="1" stroke-dasharray="4 4"/>` +
    `<text x="90" y="262" text-anchor="middle" font-family="${SERIF}" font-size="12" letter-spacing="2" fill="#6B6157">THANK YOU</text>`,
)

const ticket = def(
  'p2-ticket',
  '票根',
  'note',
  270,
  120,
  `<mask id="p-tk"><rect width="270" height="120" fill="#fff"/><circle cx="8" cy="60" r="9" fill="#000"/><circle cx="262" cy="60" r="9" fill="#000"/></mask>` +
    `<g mask="url(#p-tk)"><rect x="8" y="10" width="254" height="100" rx="10" fill="#FBF4E6"/></g>` +
    `<rect x="8" y="10" width="254" height="100" rx="10" fill="none" stroke="${EDGE}" stroke-width="1.4"/>` +
    `<path d="M196 22 V98" stroke="${EDGE}" stroke-width="1.4" stroke-dasharray="6 5"/>` +
    `<text x="86" y="54" text-anchor="middle" font-family="${SERIF}" font-size="15" letter-spacing="3" fill="#6B6157">ADMIT ONE</text>` +
    `<text x="86" y="78" text-anchor="middle" font-family="${SERIF}" font-size="11" letter-spacing="2" fill="#8A7A6A">ROW 12 · SEAT 06</text>` +
    `<text x="228" y="70" text-anchor="middle" font-family="${SERIF}" font-size="20" fill="#8A7A6A" opacity="0.8">07</text>`,
)

const label = def(
  'p2-label',
  '牛皮纸标签',
  'note',
  210,
  140,
  `<g transform="rotate(-6 105 70)">` +
    `<rect x="16" y="24" width="180" height="92" rx="10" fill="${KRAFT}"/>` +
    `<rect x="16" y="24" width="180" height="92" rx="10" fill="none" stroke="rgba(90,70,45,0.35)" stroke-width="1.2"/>` +
    `<circle cx="46" cy="70" r="8" fill="none" stroke="rgba(90,70,45,0.5)" stroke-width="2"/>` +
    `<path d="M46 62 C 30 44, 18 42, 8 36" fill="none" stroke="rgba(90,70,45,0.45)" stroke-width="2"/>` +
    `<path d="M74 52 H170 M74 70 H150 M74 88 H164" stroke="rgba(90,70,45,0.4)" stroke-width="2" stroke-linecap="round"/>` +
    `</g>`,
)

const clip = def(
  'p2-clip',
  '长尾夹',
  'deco',
  150,
  170,
  `<path d="M40 96 V58 a35 35 0 0 1 70 0 V96" fill="none" stroke="#9A8A6E" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M30 96 H120 V140 a8 8 0 0 1 -8 8 H38 a8 8 0 0 1 -8 -8 Z" fill="#C3B393"/>` +
    `<path d="M30 96 H120 V140 a8 8 0 0 1 -8 8 H38 a8 8 0 0 1 -8 -8 Z" fill="none" stroke="#9A8A6E" stroke-width="2.4"/>` +
    `<rect x="34" y="100" width="82" height="9" rx="3" fill="#E0D2B4" opacity="0.9"/>` +
    `<path d="M52 124 H98" stroke="#A9997A" stroke-width="2.2" stroke-linecap="round"/>`,
)

const wax = def(
  'p2-wax',
  '蜡封',
  'deco',
  170,
  170,
  `<path d="M85 12 C 108 12, 120 26, 132 34 C 148 44, 158 60, 154 78 C 150 96, 158 110, 146 126 C 134 142, 116 158, 96 156 C 76 154, 62 164, 48 152 C 34 140, 20 128, 22 108 C 24 88, 12 76, 22 60 C 32 44, 46 34, 58 26 C 68 20, 70 12, 85 12 Z" fill="#B4645C"/>` +
    `<path d="M85 36 C 102 36, 112 46, 122 52 C 134 60, 138 70, 135 82 C 132 94, 136 102, 128 112 C 120 122, 108 132, 94 131 C 80 130, 70 136, 60 128 C 50 120, 42 110, 43 96 C 44 82, 38 74, 45 64 C 52 54, 60 46, 70 41 C 77 37, 78 36, 85 36 Z" fill="#A2554F" opacity="0.5"/>` +
    `<text x="85" y="100" text-anchor="middle" font-family="${SERIF}" font-size="44" fill="rgba(255,240,235,0.82)">Y</text>`,
)

const key = def(
  'p2-key',
  '古董钥匙',
  'deco',
  240,
  110,
  `<g fill="none" stroke="#B39A6A" stroke-width="4" stroke-linecap="round">` +
    `<circle cx="42" cy="55" r="24"/>` +
    `<path d="M66 55 H208"/>` +
    `<path d="M176 55 V78 M192 55 V72"/>` +
    `</g>` +
    `<circle cx="42" cy="55" r="9" fill="none" stroke="#B39A6A" stroke-width="3"/>` +
    `<path d="M20 40 a30 30 0 0 0 0 30" fill="none" stroke="#CDB782" stroke-width="2" opacity="0.8"/>`,
)

const pin = def(
  'p2-pin',
  '大头针',
  'deco',
  130,
  130,
  `<ellipse cx="66" cy="118" rx="16" ry="4" fill="rgba(58,46,30,0.14)"/>` +
    `<path d="M65 30 L64 112" stroke="#9A9384" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="65" cy="26" r="17" fill="#C98F8A"/>` +
    `<circle cx="59" cy="20" r="5" fill="rgba(255,255,255,0.55)"/>`,
)

const twine = def(
  'p2-twine',
  '麻绳结',
  'deco',
  200,
  200,
  `<path d="M100 30 C 52 30, 30 62, 30 100 C 30 142, 60 172, 100 172 C 140 172, 170 142, 170 100 C 170 62, 148 30, 100 30 Z" fill="none" stroke="#C2A87C" stroke-width="9" stroke-linecap="round"/>` +
    `<path d="M100 30 C 52 30, 30 62, 30 100 C 30 142, 60 172, 100 172 C 140 172, 170 142, 170 100 C 170 62, 148 30, 100 30 Z" fill="none" stroke="#B09566" stroke-width="2" stroke-dasharray="3 6" opacity="0.7"/>` +
    `<path d="M84 96 C 96 84, 116 88, 122 104 C 128 120, 112 132, 98 124 C 84 116, 88 100, 100 96" fill="none" stroke="#C2A87C" stroke-width="9" stroke-linecap="round"/>`,
)

export const PRO_ASSETS_2: AssetDef[] = [
  arch,
  rectWind,
  circleWind,
  blobWind,
  filmWind,
  duoWind,
  stampWind,
  fern,
  olive,
  dandelion,
  lavender,
  postmark,
  airmail,
  dater,
  receipt,
  ticket,
  label,
  clip,
  wax,
  key,
  pin,
  twine,
]
