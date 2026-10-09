export type CatId = 'tape' | 'note' | 'stamp' | 'plant' | 'deco' | 'frame'

export interface AssetDef {
  id: string
  name: string
  cat: CatId
  w: number
  h: number
  svg: string
}

export const CATEGORIES: { id: CatId; name: string }[] = [
  { id: 'tape', name: '纸胶带' },
  { id: 'note', name: '便签' },
  { id: 'stamp', name: '印章' },
  { id: 'plant', name: '植物' },
  { id: 'deco', name: '装饰' },
  { id: 'frame', name: '边框' },
]

const NS = 'xmlns="http://www.w3.org/2000/svg"'

function tape(id: string, name: string, base: string, over: string) {
  const svg =
    `<svg ${NS} viewBox="0 0 200 60">` +
    `<path d="M5 7 L8 14 L4 21 L9 28 L5 35 L8 42 L4 49 L7 55 H193 L196 49 L192 42 L195 35 L191 28 L196 21 L192 14 L195 7 Z" fill="${base}" opacity="0.93"/>` +
    over +
    '</svg>'
  return { id, name, cat: 'tape' as CatId, w: 200, h: 60, svg }
}

const tapes = [
  tape(
    'tape-grid',
    '格纹胶带',
    '#F0DCB0',
    `<defs><pattern id="pg" width="13" height="13" patternUnits="userSpaceOnUse"><path d="M13 0 H0 V13" fill="none" stroke="#C9A227" stroke-width="1.6" opacity="0.5"/></pattern></defs><rect x="5" y="7" width="190" height="48" fill="url(#pg)"/>`,
  ),
  tape(
    'tape-stripe',
    '斜条胶带',
    '#D8E4EA',
    `<defs><pattern id="ps" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="7" height="16" fill="#8FA9C4" opacity="0.55"/></pattern></defs><rect x="5" y="7" width="190" height="48" fill="url(#ps)"/>`,
  ),
  tape(
    'tape-dot',
    '圆点胶带',
    '#F6E0DE',
    `<defs><pattern id="pd" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="2.6" fill="#D98C8C" opacity="0.75"/></pattern></defs><rect x="5" y="7" width="190" height="48" fill="url(#pd)"/>`,
  ),
  tape(
    'tape-wave',
    '波浪胶带',
    '#DCE9DA',
    `<defs><pattern id="pw" width="18" height="14" patternUnits="userSpaceOnUse"><path d="M0 7 Q4.5 1 9 7 Q13.5 13 18 7" fill="none" stroke="#8FA98F" stroke-width="1.8" opacity="0.7"/></pattern></defs><rect x="5" y="7" width="190" height="48" fill="url(#pw)"/>`,
  ),
  tape('tape-plain', '素色胶带', '#F3E7CE', '<rect x="5" y="7" width="190" height="48" fill="#FFFDF8" opacity="0.35"/>'),
]

const notes = [
  {
    id: 'note-plain',
    name: '素色便签',
    cat: 'note' as CatId,
    w: 240,
    h: 200,
    svg: `<svg ${NS} viewBox="0 0 240 200"><rect x="6" y="6" width="228" height="188" rx="10" fill="#FFFCF3" stroke="#E4DACA" stroke-width="2"/><rect x="26" y="30" width="70" height="8" rx="4" fill="#D9A441" opacity="0.5"/></svg>`,
  },
  {
    id: 'note-lined',
    name: '横线便签',
    cat: 'note' as CatId,
    w: 240,
    h: 200,
    svg: `<svg ${NS} viewBox="0 0 240 200"><rect x="6" y="6" width="228" height="188" rx="10" fill="#FFFDF7" stroke="#E4DACA" stroke-width="2"/>${[52, 78, 104, 130, 156]
      .map((y) => `<path d="M28 ${y} H212" stroke="#E7DFD2" stroke-width="1.6" stroke-linecap="round"/>`)
      .join('')}</svg>`,
  },
  {
    id: 'note-kraft',
    name: '牛皮纸',
    cat: 'note' as CatId,
    w: 220,
    h: 160,
    svg: `<svg ${NS} viewBox="0 0 220 160"><rect x="6" y="6" width="208" height="148" rx="8" fill="#E7D3B0" stroke="#C9AE85" stroke-width="2"/><g opacity="0.35" stroke="#B99A6E" stroke-width="1.4">${[40, 70, 100, 130]
      .map((y) => `<path d="M28 ${y} H192"/>`)
      .join('')}</g></svg>`,
  },
  {
    id: 'note-torn',
    name: '撕裂纸片',
    cat: 'note' as CatId,
    w: 240,
    h: 120,
    svg: `<svg ${NS} viewBox="0 0 240 120"><path d="M8 14 L22 8 L38 15 L56 7 L74 14 L92 8 L112 15 L132 7 L152 14 L172 8 L192 15 L208 9 L226 16 L232 40 L228 62 L233 88 L230 110 L206 104 L186 111 L164 103 L142 110 L120 102 L98 110 L76 103 L54 111 L32 104 L14 110 L8 86 L12 62 L7 38 Z" fill="#FFFDF7" stroke="#E4DACA" stroke-width="1.6"/></svg>`,
  },
  {
    id: 'note-polaroid',
    name: '拍立得相框',
    cat: 'frame' as CatId,
    w: 200,
    h: 240,
    svg: `<svg ${NS} viewBox="0 0 200 240"><rect x="8" y="8" width="184" height="224" rx="4" fill="#FFFDFA" stroke="#E0D6C6" stroke-width="2"/><rect x="20" y="20" width="160" height="160" fill="#EFE7DA"/><path d="M20 160 L64 110 L96 148 L128 106 L180 168 L180 180 L20 180 Z" fill="#D8E0D4"/><circle cx="56" cy="56" r="13" fill="#F2E3C9"/><path d="M40 214 H120" stroke="#E7DFD2" stroke-width="6" stroke-linecap="round"/></svg>`,
  },
]

const stamps = [
  {
    id: 'stamp-date',
    name: '日期章',
    cat: 'stamp' as CatId,
    w: 140,
    h: 140,
    svg: `<svg ${NS} viewBox="0 0 140 140"><circle cx="70" cy="70" r="62" fill="none" stroke="#C97B63" stroke-width="3"/><circle cx="70" cy="70" r="54" fill="none" stroke="#C97B63" stroke-width="1.4" stroke-dasharray="3 4"/><path d="M70 34 V44 M70 96 V106 M34 70 H44 M96 70 H106" stroke="#C97B63" stroke-width="3" stroke-linecap="round"/><circle cx="70" cy="70" r="7" fill="#C97B63"/><path d="M70 78 V96" stroke="#C97B63" stroke-width="4" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'stamp-star',
    name: '星形章',
    cat: 'stamp' as CatId,
    w: 130,
    h: 130,
    svg: `<svg ${NS} viewBox="0 0 130 130"><path d="M65 12 L79 48 L118 50 L88 74 L98 112 L65 90 L32 112 L42 74 L12 50 L51 48 Z" fill="none" stroke="#D9A441" stroke-width="3.4" stroke-linejoin="round"/></svg>`,
  },
  {
    id: 'stamp-ok',
    name: 'OK 章',
    cat: 'stamp' as CatId,
    w: 130,
    h: 130,
    svg: `<svg ${NS} viewBox="0 0 130 130"><rect x="10" y="18" width="110" height="94" rx="10" fill="none" stroke="#8FA98F" stroke-width="3.6"/><path d="M30 66 L54 90 L100 40" fill="none" stroke="#8FA98F" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: 'stamp-wreath',
    name: '花环章',
    cat: 'stamp' as CatId,
    w: 150,
    h: 150,
    svg: `<svg ${NS} viewBox="0 0 150 150"><circle cx="75" cy="75" r="52" fill="none" stroke="#8FA98F" stroke-width="2"/><g fill="#8FA98F">${Array.from(
      { length: 12 },
      (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return `<ellipse cx="${(75 + Math.cos(a) * 52).toFixed(1)}" cy="${(75 + Math.sin(a) * 52).toFixed(1)}" rx="8" ry="5" transform="rotate(${((i / 12) * 360).toFixed(1)} ${(75 + Math.cos(a) * 52).toFixed(1)} ${(75 + Math.sin(a) * 52).toFixed(1)})"/>`
      },
    ).join('')}</g><circle cx="75" cy="75" r="30" fill="none" stroke="#C97B63" stroke-width="1.6"/></svg>`,
  },
  {
    id: 'stamp-post',
    name: '邮票',
    cat: 'stamp' as CatId,
    w: 150,
    h: 180,
    svg: `<svg ${NS} viewBox="0 0 150 180"><path d="M10 10 H140 V170 H10 Z" fill="#FFFCF3" stroke="#C9A227" stroke-width="2" stroke-dasharray="2 5"/><rect x="26" y="26" width="98" height="86" fill="#DCE9DA"/><path d="M26 112 L54 82 L74 104 L94 78 L124 108 L124 112 Z" fill="#8FA98F"/><circle cx="104" cy="52" r="9" fill="#F2E3C9"/><path d="M30 140 H120 M30 154 H96" stroke="#E0D6C6" stroke-width="4" stroke-linecap="round"/></svg>`,
  },
]

const plants = [
  {
    id: 'plant-euca',
    name: '尤加利叶',
    cat: 'plant' as CatId,
    w: 150,
    h: 210,
    svg: `<svg ${NS} viewBox="0 0 150 210"><path d="M75 202 C70 150 66 96 62 18" fill="none" stroke="#8FA98F" stroke-width="2.4"/><g fill="#A8BCA4">${Array.from(
      { length: 9 },
      (_, i) => {
        const y = 40 + i * 17
        return `<ellipse cx="${74 - i * 1.2}" cy="${y}" rx="21" ry="13" transform="rotate(-38 ${74 - i * 1.2} ${y})"/><ellipse cx="${76 - i * 1.2}" cy="${y + 8}" rx="21" ry="13" transform="rotate(38 ${76 - i * 1.2} ${y + 8})"/>`
      },
    ).join('')}</g></svg>`,
  },
  {
    id: 'plant-branch',
    name: '小叶枝',
    cat: 'plant' as CatId,
    w: 140,
    h: 190,
    svg: `<svg ${NS} viewBox="0 0 140 190"><path d="M70 182 C66 130 68 70 72 12" fill="none" stroke="#B09A6E" stroke-width="2"/><g fill="#8FA98F" opacity="0.9">${Array.from(
      { length: 8 },
      (_, i) => {
        const y = 30 + i * 18
        return `<path d="M${71 - i} ${y} q-26 -6 -34 -22 q26 -2 34 22 Z"/><path d="M${73 - i} ${y + 9} q26 -6 34 -22 q-26 -2 -34 22 Z"/>`
      },
    ).join('')}</g></svg>`,
  },
  {
    id: 'plant-flower',
    name: '小花',
    cat: 'plant' as CatId,
    w: 130,
    h: 130,
    svg: `<svg ${NS} viewBox="0 0 130 130"><g fill="#E7AFB0">${Array.from(
      { length: 6 },
      (_, i) => {
        const a = (i / 6) * Math.PI * 2
        return `<ellipse cx="${(65 + Math.cos(a) * 26).toFixed(1)}" cy="${(65 + Math.sin(a) * 26).toFixed(1)}" rx="17" ry="12" transform="rotate(${((i / 6) * 360).toFixed(1)} ${(65 + Math.cos(a) * 26).toFixed(1)} ${(65 + Math.sin(a) * 26).toFixed(1)})"/>`
      },
    ).join('')}</g><circle cx="65" cy="65" r="13" fill="#D9A441"/></svg>`,
  },
  {
    id: 'plant-clover',
    name: '四叶草',
    cat: 'plant' as CatId,
    w: 120,
    h: 120,
    svg: `<svg ${NS} viewBox="0 0 120 120"><g fill="#8FA98F"><circle cx="42" cy="42" r="20"/><circle cx="78" cy="42" r="20"/><circle cx="42" cy="78" r="20"/><circle cx="78" cy="78" r="20"/></g><circle cx="60" cy="60" r="7" fill="#FFFDF7"/><path d="M60 92 L60 112" stroke="#8FA98F" stroke-width="3" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'plant-berry',
    name: '小浆果',
    cat: 'plant' as CatId,
    w: 120,
    h: 150,
    svg: `<svg ${NS} viewBox="0 0 120 150"><path d="M60 142 C56 100 54 60 58 20" fill="none" stroke="#B09A6E" stroke-width="2"/><g fill="#D98C8C"><circle cx="40" cy="54" r="11"/><circle cx="80" cy="70" r="11"/><circle cx="46" cy="92" r="11"/><circle cx="78" cy="112" r="11"/></g>${Array.from(
      { length: 6 },
      (_, i) => `<path d="M56 ${24 + i * 18} q-20 -8 -26 -20 q20 0 26 20 Z" fill="#8FA98F" opacity="0.85"/>`,
    ).join('')}</svg>`,
  },
]

const decos = [
  {
    id: 'deco-heart',
    name: '爱心',
    cat: 'deco' as CatId,
    w: 110,
    h: 100,
    svg: `<svg ${NS} viewBox="0 0 110 100"><path d="M55 88 C20 66 10 46 16 32 C22 18 44 14 55 32 C66 14 88 18 94 32 C100 46 90 66 55 88 Z" fill="#E7AFB0"/></svg>`,
  },
  {
    id: 'deco-star',
    name: '星星',
    cat: 'deco' as CatId,
    w: 110,
    h: 110,
    svg: `<svg ${NS} viewBox="0 0 110 110"><path d="M55 8 L68 42 L104 45 L77 68 L86 103 L55 84 L24 103 L33 68 L6 45 L42 42 Z" fill="#F0D9A0" stroke="#D9A441" stroke-width="2"/></svg>`,
  },
  {
    id: 'deco-sparkle',
    name: '闪光',
    cat: 'deco' as CatId,
    w: 110,
    h: 110,
    svg: `<svg ${NS} viewBox="0 0 110 110"><g fill="#D9A441"><path d="M55 10 L62 48 L100 55 L62 62 L55 100 L48 62 L10 55 L48 48 Z"/><path d="M90 14 L93 24 L103 27 L93 30 L90 40 L87 30 L77 27 L87 24 Z" opacity="0.8"/></g></svg>`,
  },
  {
    id: 'deco-bow',
    name: '蝴蝶结',
    cat: 'deco' as CatId,
    w: 140,
    h: 110,
    svg: `<svg ${NS} viewBox="0 0 140 110"><g fill="#E7AFB0"><path d="M66 55 C40 22 12 26 12 55 C12 84 40 88 66 55 Z"/><path d="M74 55 C100 22 128 26 128 55 C128 84 100 88 74 55 Z"/></g><circle cx="70" cy="55" r="12" fill="#D98C8C"/><path d="M62 66 C58 82 50 92 42 98 M78 66 C82 82 90 92 98 98" fill="none" stroke="#E7AFB0" stroke-width="8" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'deco-arrow',
    name: '箭头',
    cat: 'deco' as CatId,
    w: 150,
    h: 90,
    svg: `<svg ${NS} viewBox="0 0 150 90"><path d="M12 70 C40 18 92 14 132 40" fill="none" stroke="#C97B63" stroke-width="3" stroke-linecap="round"/><path d="M118 26 L136 41 L114 50" fill="none" stroke="#C97B63" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: 'deco-sun',
    name: '小太阳',
    cat: 'deco' as CatId,
    w: 120,
    h: 120,
    svg: `<svg ${NS} viewBox="0 0 120 120"><circle cx="60" cy="60" r="22" fill="#F0C36D"/><g stroke="#D9A441" stroke-width="3.4" stroke-linecap="round">${Array.from(
      { length: 8 },
      (_, i) => {
        const a = (i / 8) * Math.PI * 2
        const x1 = 60 + Math.cos(a) * 30
        const y1 = 60 + Math.sin(a) * 30
        const x2 = 60 + Math.cos(a) * 44
        const y2 = 60 + Math.sin(a) * 44
        return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`
      },
    ).join('')}</g></svg>`,
  },
]

const frames = [
  {
    id: 'frame-arch',
    name: '拱形框',
    cat: 'frame' as CatId,
    w: 220,
    h: 260,
    svg: `<svg ${NS} viewBox="0 0 220 260"><path d="M14 246 V110 A96 96 0 0 1 206 110 V246 Z" fill="none" stroke="#C97B63" stroke-width="3"/><path d="M26 240 V112 A84 84 0 0 1 194 112 V240 Z" fill="none" stroke="#E7C4B8" stroke-width="1.4"/></svg>`,
  },
  {
    id: 'frame-line',
    name: '细线框',
    cat: 'frame' as CatId,
    w: 220,
    h: 200,
    svg: `<svg ${NS} viewBox="0 0 220 200"><rect x="10" y="10" width="200" height="180" rx="6" fill="none" stroke="#3A332C" stroke-width="2" opacity="0.55"/><rect x="18" y="18" width="184" height="164" rx="4" fill="none" stroke="#3A332C" stroke-width="1" opacity="0.3"/></svg>`,
  },
  {
    id: 'frame-corner',
    name: '四角装饰',
    cat: 'frame' as CatId,
    w: 220,
    h: 200,
    svg: `<svg ${NS} viewBox="0 0 220 200"><g fill="none" stroke="#8FA98F" stroke-width="3" stroke-linecap="round"><path d="M14 44 V16 H42"/><path d="M178 16 H206 V44"/><path d="M206 156 V184 H178"/><path d="M42 184 H14 V156"/></g></svg>`,
  },
]

export const ASSETS: AssetDef[] = [...tapes, ...notes, ...stamps, ...plants, ...decos, ...frames]

export const ASSET_MAP: Record<string, AssetDef> = Object.fromEntries(
  ASSETS.map((a) => [a.id, a]),
)

export function assetUrl(a: AssetDef): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(a.svg)
}
