// The cast (blocky chibi people): every named character as a spec (body + outfit + hair + face), trainers in their partner
// Tokonmon's colours, plus a seeded generator for the city's passers-by.
//   spec: { sex: 'm' | 'f', age: 'kid' | 'teen' | 'adult' | 'elder', H, build, belly, skin,
//     hair: { style, col, volume, ahoge, ribbon, clip, ears, part, grey },
//     face: { iris, blush, deco: [{ kind, at, col }], mustache }, glasses: { kind, col }, hat: { kind, col, col2 },
//     outfit: { top: { kind, color, color2, inner, stripe, sleeve }, bottom: { kind, color, color2, cut, length, plaid, pleats, belt },
//       legs: 'kneesocks' | 'socks' | undefined, socks, tights, gloves, shoes: { kind, color, sole, accent }, acc: [{ kind, color, charm, side }] },
//     walk: { style } }
export const TOON_CAST = {
  hero: {   // Ren: partner Chilichick (hot-sauce red / orange / flame yellow)
    sex: 'm', age: 'teen', H: 1.66, skin: '#e2b28c',
    hair: { style: 'messy', col: '#2a1e1a', ahoge: 1 },
    face: { iris: '#6a3a1e', deco: [{ kind: 'bandaid', at: 'cheekR' }] },
    outfit: { top: { kind: 'jacket', color: '#e8603a', inner: '#f4efe6', stripe: '#ffd040' }, bottom: { kind: 'jeans', color: '#2e3a5e' }, legs: 'socks', shoes: { kind: 'sneakers', color: '#f2f0ea', accent: '#e8603a' }, acc: [{ kind: 'backpack', color: '#2e6a8a', charm: '#ffd040' }] },
  },
  heroine: {   // the player as a girl, in the partner's colours (hot-sauce red / orange / flame yellow)
    sex: 'f', age: 'teen', H: 1.58, skin: '#f4d6bc',
    hair: { style: 'ponytail', col: '#4a2a20', volume: 1.1, ribbon: '#ffd040', ahoge: 1 },
    face: { iris: '#a0522a', blush: 0.4, deco: [{ kind: 'bandaid', at: 'cheekR' }] },
    outfit: { top: { kind: 'jacket', color: '#e8603a', inner: '#f4efe6', stripe: '#ffd040' }, bottom: { kind: 'shorts', color: '#2e3a5e' }, legs: 'kneesocks', socks: '#f4f0ea', shoes: { kind: 'sneakers', color: '#f2f0ea', accent: '#e8603a' }, acc: [{ kind: 'backpack', color: '#2e6a8a', charm: '#ffd040' }] },
  },
  yumi: {   // partner Creepetal (periwinkle petals, blond fringe, green stem)
    sex: 'f', age: 'teen', H: 1.56, skin: '#f2cdb0',
    hair: { style: 'twintails', col: '#e8d08a', volume: 1.15, ribbon: '#8a8ad8', clip: '#5aa86a', ahoge: 1 },
    face: { iris: '#5a5ab8', blush: 0.5, deco: [{ kind: 'star', at: 'cheekL', col: '#ffd84a' }, { kind: 'hatch' }] },
    glasses: { kind: 'round', col: '#c87896' },
    outfit: { top: { kind: 'cardigan', color: '#8a8ad8', inner: '#f4ecd8' }, bottom: { kind: 'skirt', color: '#3a6a4a', plaid: '#f4ecd8' }, legs: 'kneesocks', socks: '#f4f0ea', shoes: { kind: 'sneakers', color: '#f2f0ea', accent: '#8a8ad8' }, acc: [{ kind: 'backpack', color: '#3a6a4a', charm: '#e86aa0' }] },
    walk: { style: 'young' },
  },
  mika: {   // cool kid: pale, blond, cat-eared, frayed white crop top, baggy grey cargo pants
    sex: 'f', age: 'teen', H: 1.6, skin: '#f8eee4',
    hair: { style: 'long', col: '#ead6a2', volume: 1.15, ears: 'cat' },
    face: { iris: '#7d8a96', blush: 0.2 },
    outfit: { top: { kind: 'crop', color: '#f4f1ea', sleeve: 'none' }, bottom: { kind: 'cargo', color: '#8c8c88' }, shoes: { kind: 'sneakers', color: '#e8e6e0', accent: '#9a9a96' } },
  },
  aoi: {   // league official, navy + gold
    sex: 'f', age: 'adult', H: 1.64, skin: '#f2cdb0',
    hair: { style: 'ponytail', col: '#2a1e2a', ribbon: '#e8b43a' },
    face: { iris: '#4a2a4a', deco: [{ kind: 'mole', at: 'mouthL' }] }, glasses: { kind: 'rect', col: '#28222a' },
    outfit: { top: { kind: 'blazer', color: '#2e3a5a', inner: '#f6f4ee' }, bottom: { kind: 'skirt', cut: 'pencil', color: '#2e3a5a' }, tights: '#c8a088', shoes: { kind: 'pumps', color: '#1e1a22' }, acc: [{ kind: 'tote', color: '#e8b43a', side: 1 }] },
  },
  grandma: {
    sex: 'f', age: 'elder', H: 1.5, skin: '#e2b896',
    hair: { style: 'bun', col: '#e8e4e0', grey: 1 }, face: { deco: [{ kind: 'hatch' }] }, glasses: { kind: 'round', col: '#a08250' },
    outfit: { top: { kind: 'cardigan', color: '#7a3a4a', inner: '#f0e8e0' }, bottom: { kind: 'skirt', cut: 'long', color: '#5a4a4a' }, tights: '#d8b8a0', shoes: { kind: 'pumps', color: '#3a2a2a' }, acc: [{ kind: 'handbag', color: '#c8a050', side: 1 }] },
  },
  coach: {  // Gonda: partner Kanizumo (crab red, sumo gold, turquoise)
    sex: 'm', age: 'adult', H: 1.84, build: 1.25, belly: 0.6, skin: '#c48a62',
    hair: { style: 'buzz', col: '#2a2422' }, face: { iris: '#2a2018', deco: [{ kind: 'scar', at: 'browL' }] }, hat: { kind: 'headband', col: '#28bcc0' },
    outfit: { top: { kind: 'jacket', color: '#c8362f', inner: '#ffd8a6', stripe: '#ffcc2e' }, bottom: { kind: 'track', color: '#a82a2a', color2: '#ffcc2e' }, shoes: { kind: 'sneakers', color: '#f2f0ea', accent: '#28bcc0' } },
    walk: { style: 'heavy' },
  },
  kaito: {  // rival: silver hair, black + crimson
    sex: 'm', age: 'teen', H: 1.74, build: 0.96, skin: '#e6b890',
    hair: { style: 'sidepart', col: '#d8d0c4', part: -1, volume: 1.2 }, face: { iris: '#3a5a8a', deco: [{ kind: 'paint', at: 'cheekL', col: '#a82e3a' }] },
    outfit: { top: { kind: 'jacket', color: '#1e1e26', inner: '#a82e3a' }, bottom: { kind: 'slacks', color: '#2a2a34' }, shoes: { kind: 'boots', color: '#1a1a20' } },
    walk: { style: 'brisk' },
  },
  spike: {  // punk: partner Dreadrake (green head, chestnut, blue)
    sex: 'm', age: 'teen', H: 1.8, skin: '#e6b890',
    hair: { style: 'mohawk', col: '#1e8a4a' }, face: { iris: '#c88a1e', deco: [{ kind: 'paint', at: 'eyeL', col: '#1e1a22' }, { kind: 'bandaid', at: 'nose' }] },
    outfit: { top: { kind: 'jacket', color: '#6a3a1e', inner: '#f2f0ea' }, bottom: { kind: 'jeans', color: '#2a2a30' }, shoes: { kind: 'boots', color: '#141216' } },
    walk: { style: 'slouch' },
  },
  riff: { sex: 'm', age: 'adult', H: 1.86, skin: '#e0b08c', hair: { style: 'mohawk', col: '#c8303a' }, face: { deco: [{ kind: 'paint', at: 'eyeR', col: '#1e1a22' }] }, outfit: { top: { kind: 'jacket', color: '#4a5a7a', inner: '#1e1e24' }, bottom: { kind: 'jeans', color: '#2a2a30' }, shoes: { kind: 'boots', color: '#1a1618' } }, walk: { style: 'slouch' } },
  moshi: { sex: 'm', age: 'adult', H: 1.84, build: 1.3, belly: 0.5, skin: '#8a5a3e', hair: { style: 'perm', col: '#1e1614', volume: 1.5 }, outfit: { top: { kind: 'tee', color: '#3a3a42', stripe: '#ffd040' }, bottom: { kind: 'jeans', color: '#34303a' }, shoes: { kind: 'boots', color: '#2a2220' } } },
  taro: { sex: 'm', age: 'kid', H: 1.24, skin: '#e8b48c', hair: { style: 'bowl', col: '#3a2a20' }, face: { deco: [{ kind: 'bandaid', at: 'cheekL' }] }, glasses: { kind: 'round', col: '#28221e' }, outfit: { top: { kind: 'tee', color: '#f0c840', stripe: '#3a6ab0' }, bottom: { kind: 'shorts', color: '#3a5a8a' }, legs: 'socks', shoes: { kind: 'sneakers', color: '#e84a3a', accent: '#f4f0ea' }, acc: [{ kind: 'backpack', color: '#5a9a5a' }] } },
  reporter: { sex: 'f', age: 'adult', H: 1.62, skin: '#f0c8a8', hair: { style: 'bob', col: '#3a2a22' }, outfit: { top: { kind: 'blazer', color: '#8a3a3a', inner: '#f6f4ee' }, bottom: { kind: 'skirt', cut: 'pencil', color: '#3a3238' }, tights: '#c8a088', shoes: { kind: 'pumps', color: '#2a2224' }, acc: [{ kind: 'bag', color: '#2a2622', side: 1 }] } },
  chef: { sex: 'm', age: 'adult', H: 1.76, build: 1.25, belly: 0.8, skin: '#e6b48e', hair: { style: 'buzz', col: '#2a2422' }, face: { mustache: true }, hat: { kind: 'headband', col: '#c83a3a' }, outfit: { top: { kind: 'shirt', color: '#f2f0ea', sleeve: 'short' }, bottom: { kind: 'slacks', color: '#2a2a30' }, shoes: { kind: 'boots', color: '#2a2224' }, acc: [{ kind: 'apron', color: '#c83a3a' }] } },
  lau: { sex: 'm', age: 'elder', H: 1.6, skin: '#e2b896', hair: { style: 'bald', col: '#e8e4e0', grey: 1 }, face: { mustache: true }, glasses: { kind: 'round', col: '#28221e' }, outfit: { top: { kind: 'jacket', color: '#5a6a5a', inner: '#e8e4dc' }, bottom: { kind: 'slacks', color: '#3a3a3e' }, shoes: { kind: 'pumps', color: '#2a2224' }, acc: [{ kind: 'cane', color: '#5a3a22' }] } },
  driver: { sex: 'm', age: 'adult', H: 1.82, build: 1.2, skin: '#c48a62', hair: { style: 'buzz', col: '#2a2422' }, face: { iris: '#c89a1e' }, hat: { kind: 'cap', col: '#b82a2a', col2: '#e8b43a' }, outfit: { top: { kind: 'jacket', color: '#2a2a32', inner: '#b82a2a', stripe: '#e8b43a' }, bottom: { kind: 'slacks', color: '#2a2a32' }, shoes: { kind: 'boots', color: '#1e1a1e' } } },
  chess: { sex: 'm', age: 'elder', H: 1.62, skin: '#d6a882', hair: { style: 'bald', col: '#d8d4d0', grey: 1 }, face: { mustache: true }, glasses: { kind: 'rect', col: '#967846' }, hat: { kind: 'flatcap', col: '#6a5a48' }, outfit: { top: { kind: 'cardigan', color: '#6a5a4a', inner: '#e8e2d4' }, bottom: { kind: 'slacks', color: '#4a4440' }, shoes: { kind: 'pumps', color: '#3a2a22' } } },
  mom: { sex: 'f', age: 'adult', H: 1.6, skin: '#f0c8a8', hair: { style: 'ponytail', col: '#4a3226', ribbon: '#e8603a' }, face: { blush: 0.3 }, outfit: { top: { kind: 'knit', color: '#7a9a80' }, bottom: { kind: 'skirt', cut: 'long', color: '#5a4a44' }, shoes: { kind: 'pumps', color: '#6a4a3a' }, acc: [{ kind: 'apron', color: '#f4a0a8' }] } },
};

// ---------------------------------------------------------------- passers-by
function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const SKIN = ['#f6dcc8', '#f0c8a8', '#e8b896', '#d8a27a', '#c48a62', '#a8704c', '#8a5a3e', '#6a4430'];
const HAIR = ['#1e1614', '#2a1e1a', '#3a2a22', '#4a3226', '#6a4a30', '#8a5a34', '#c89a5a', '#e8d08a', '#2a2a3a', '#c8303a', '#e88aa8', '#5a7ac8', '#e8e4e0'];
const TOPS = ['#e8603a', '#3a6ab0', '#5aa86a', '#e8b43a', '#8a8ad8', '#e84a6a', '#2a2a32', '#f2f0ea', '#7a3a4a', '#28bcc0', '#c8a080', '#6a7a8a', '#f4a0a8', '#3a4a3a'];
const BOTS = ['#2e3a5e', '#2a2a30', '#4a4440', '#6a5a4a', '#3a5a8a', '#c8b898', '#2e2e3a', '#5a3a3a', '#3a6a4a'];
const SHOES = ['#f2f0ea', '#2a2224', '#e84a3a', '#3a6ab0', '#c8a050', '#1e1a1e', '#e8b43a'];
export function passerby(seed) {
  const r = rng(seed), pick = (a) => a[Math.floor(r() * a.length)], u = r();
  const age = u < 0.08 ? 'kid' : u < 0.2 ? 'elder' : u < 0.55 ? 'teen' : 'adult', sex = r() < 0.5 ? 'f' : 'm', f = sex === 'f';
  const H = age === 'kid' ? 1.15 + r() * 0.2 : f ? 1.52 + r() * 0.14 : 1.64 + r() * 0.18;
  const hairCol = age === 'elder' ? pick(['#e8e4e0', '#c8c4c0', '#a8a4a0']) : pick(HAIR);
  const style = f ? pick(age === 'elder' ? ['bun', 'bob', 'perm'] : ['long', 'bob', 'ponytail', 'twintails', 'bun', 'long', 'ponytail']) : pick(age === 'elder' ? ['bald', 'short', 'buzz'] : ['short', 'messy', 'sidepart', 'buzz', 'perm', 'short', 'messy']);
  const topKind = pick(age === 'elder' ? ['cardigan', 'knit', 'jacket'] : ['hoodie', 'tee', 'jacket', 'blouse', 'knit', 'hoodie', 'tee', 'coat', 'cardigan']);
  const skirt = f && r() < 0.5, botKind = skirt ? 'skirt' : pick(['jeans', 'pants', 'slacks', 'shorts', 'jeans', 'track']);
  const top = pick(TOPS);
  return {
    id: 'passerby' + seed, sex, age, H, build: 0.9 + r() * 0.3, belly: age === 'adult' || age === 'elder' ? Math.max(0, r() - 0.6) : 0, skin: pick(SKIN),
    hair: { style, col: hairCol, grey: age === 'elder' ? 1 : 0, volume: 0.95 + r() * 0.3, ribbon: f && r() < 0.35 ? pick(TOPS) : 0, clip: f && r() < 0.25 ? pick(TOPS) : 0, ahoge: r() < 0.25 ? 1 : 0 },
    face: { iris: pick(['#6a3a1e', '#3a5a8a', '#4a6a3a', '#5a3a6a', '#2a2018', '#8a4a1e']), blush: f ? 0.3 : 0.1, deco: r() < 0.2 ? [{ kind: pick(['star', 'heart', 'bandaid', 'mole', 'hatch']), at: pick(['cheekL', 'cheekR', 'eyeL', 'eyeR']) }] : [] },
    glasses: r() < (age === 'elder' ? 0.6 : 0.18) ? { kind: pick(['round', 'rect']), col: pick(['#28222a', '#a08250', '#c87896']) } : null,
    hat: r() < 0.14 ? { kind: pick(['cap', 'beanie', 'headband']), col: pick(TOPS), col2: pick(TOPS) } : null,
    outfit: {
      top: { kind: topKind, color: top, inner: pick(['#f4efe6', '#2a2a32', pick(TOPS)]), stripe: r() < 0.3 ? pick(TOPS) : null },
      bottom: { kind: botKind, color: pick(BOTS), cut: skirt ? pick(['pleated', 'mini', 'long', 'pencil']) : undefined, plaid: skirt && r() < 0.3 ? pick(['#f4ecd8', '#c83a3a', '#2a2a32']) : null, color2: botKind === 'track' ? pick(TOPS) : undefined },
      legs: botKind === 'skirt' || botKind === 'shorts' ? pick(['kneesocks', 'socks', undefined]) : 'socks', tights: botKind === 'skirt' && r() < 0.3 ? pick(['#2a2a32', '#c8a088']) : null,
      shoes: { kind: f && r() < 0.3 ? pick(['boots', 'pumps']) : pick(['sneakers', 'sneakers', 'boots']), color: pick(SHOES), accent: pick(TOPS) },
      acc: [r() < 0.25 ? { kind: 'backpack', color: pick(TOPS) } : null, r() < 0.2 ? { kind: 'bag', color: pick(TOPS), side: r() < 0.5 ? 1 : -1 } : null].filter(Boolean),
    },
    walk: { style: age === 'elder' ? 'slow' : pick(['young', 'brisk', 'young', 'slouch']) },
  };
}
