// The cast as recipes. castVox(name) → a sculpted voxel person (voxperson.js);
// cast(name) → the older box-model person (person.js), kept for tooling.
// Shirt prints are functions of (x metres from the chest centre, fy 0..1 up the torso) → colour.
import { person } from './person.js';
import { VoxPerson } from './voxperson.js';
import { AnimePerson } from './anime.js';

const disc = (x, fy, cy, r) => Math.hypot(x, (fy - cy) * 0.3) < r;
const PRINTS = {
  flame: (x, fy) => { if (!disc(x, fy, 0.6, 0.05)) return null; const t = (fy - 0.5) / 0.2, w = 0.028 * (1 - t) + 0.004; return Math.abs(x + Math.sin(t * 5) * 0.006) < w && t > 0 && t < 1 ? (t < 0.5 ? '#ffd040' : '#ff7a2a') : disc(x, fy, 0.6, 0.044) ? '#2a2a34' : '#f4efe6'; },
  star: (x, fy) => { if (Math.abs(x) > 0.05 || Math.abs(fy - 0.58) > 0.16) return null; const a = Math.atan2((fy - 0.58) * 0.3, x), r = Math.hypot(x, (fy - 0.58) * 0.3); return r < 0.03 * (0.55 + 0.45 * Math.abs(Math.cos(a * 2.5))) ? '#f8f4e8' : '#3a6ab0'; },
  bolt: (x, fy) => (Math.abs(fy - 0.6 - Math.sin(x * 90) * 0.05) < 0.03 && Math.abs(x) < 0.09 ? '#e8e4dc' : null),
  band: (x, fy) => (Math.abs(fy - 0.62) < 0.05 && Math.abs(x) < 0.1 ? (Math.round(x * 80) % 2 ? '#c83a3a' : '#f0e8dc') : null),
};
const R = {
  hero: { build: 'teen', skin: '#d8a27a', hair: { style: 'spiky', color: '#2a1e1a' }, eyes: { color: '#5a3a22', shape: 'sharp', thick: true }, top: { kind: 'hoodie', color: '#e8603a', color2: '#f4efe6', print: PRINTS.flame }, bottom: { kind: 'jeans', color: '#2e3a5e' }, shoes: { kind: 'sneakers', color: '#f2f0ea', stripe: '#e8603a', lace: '#e8603a' }, acc: ['phone', 'capsule', 'backpack', 'watch'], packColor: '#2e6a8a', mood: 'calm' },
  coach: { build: 'big', skin: '#c48a62', hair: { style: 'buzz', color: '#2a2422' }, beard: 'stubble', beardColor: '#3a3230', eyes: { color: '#2a2018', shape: 'narrow', thick: true }, top: { kind: 'jacket', color: '#c8362f', inner: '#ffd8a6', stripe: '#ffcc2e' }, bottom: { kind: 'track', color: '#a82a2a', color2: '#ffcc2e' }, shoes: { kind: 'sneakers', color: '#f2f0ea', stripe: '#28bcc0', sole: '#e8e4dc' }, acc: ['watch', 'capsule', 'chain', 'headband'], bandColor: '#28bcc0', mood: 'tough', idlePose: 'crossed', jaw: 0.6 },   // partner: Kanizumo (crab red, sumo gold belt, turquoise)
  mika: { build: 'teen', skin: '#f0c8a8', hair: { style: 'bob', color: '#1e1a22' }, eyes: { color: '#6a3a5a', shape: 'sharp', lashes: true }, top: { kind: 'jacket', color: '#d8d0c4', inner: '#e84a6a' }, bottom: { kind: 'skirt', color: '#2e2e3a' }, shoes: { kind: 'boots', color: '#2a2224', sock: '#2a2a32' }, acc: ['headphones', 'capsule', 'bag'], bagColor: '#e84a6a', phoneColor: '#e84a6a', mood: 'cool' },
  kaito: { build: 'teen', skin: '#e6b890', hair: { style: 'slick', color: '#d8d0c4' }, eyes: { color: '#3a5a8a', shape: 'narrow', thick: true }, top: { kind: 'jacket', color: '#1e1e26', inner: '#a82e3a' }, bottom: { kind: 'slacks', color: '#2a2a34' }, shoes: { kind: 'boots', color: '#1a1a20' }, acc: ['earring', 'capsule', 'gloves'], gloveColor: '#1a1a20', mood: 'cool', idlePose: 'pockets' },
  taro: { build: 'kid', skin: '#e8b48c', hair: { style: 'bob', color: '#3a2a20', bangs: 'straight' }, eyes: { color: '#4a3424', shape: 'round' }, top: { kind: 'tee', color: '#f0c840', print: PRINTS.star }, bottom: { kind: 'shorts', color: '#3a5a8a' }, shoes: { kind: 'sneakers', color: '#e84a3a', sock: '#f4f0ea' }, acc: ['glasses', 'backpack'], packColor: '#5a9a5a', mood: 'happy', freckles: true },
  riff: { build: 'tall', skin: '#e0b08c', hair: { style: 'mohawk', color: '#c8303a' }, eyes: { color: '#6a2a2a', shape: 'narrow', thick: true }, top: { kind: 'vest', color: '#4a5a7a', color2: '#3a4a6a', inner: '#1e1e24' }, bottom: { kind: 'jeans', color: '#2a2a30' }, shoes: { kind: 'boots', color: '#1a1618' }, acc: ['chain', 'earring', 'capsule', 'gloves'], gloveColor: '#2a1e1e', mood: 'tough' },
  moshi: { build: 'big', skin: '#8a5a3e', hair: { style: 'afro', color: '#1e1614' }, eyes: { color: '#3a2418', shape: 'round' }, top: { kind: 'tank', color: '#3a3a42', print: PRINTS.bolt }, bottom: { kind: 'jeans', color: '#34303a' }, shoes: { kind: 'boots', color: '#2a2220' }, acc: ['chain', 'capsule'], mood: 'happy' },
  aoi: { build: 'adult', skin: '#f2cdb0', hair: { style: 'ponytail', color: '#2a1e2a' }, eyes: { color: '#4a2a4a', shape: 'sharp', lashes: true }, top: { kind: 'suit', color: '#2e3a5a', tie: '#e8b43a' }, bottom: { kind: 'skirt', color: '#2e3a5a' }, shoes: { kind: 'dress', color: '#1e1a22', sock: '#d8c0b0' }, acc: ['glasses'], mood: 'calm' },
  reporter: { build: 'adult', skin: '#d29a72', hair: { style: 'slick', color: '#3a2a22' }, eyes: { color: '#3a2a1e' }, top: { kind: 'suit', color: '#8a3a3a', tie: '#2a2a32' }, bottom: { kind: 'slacks', color: '#3a3238' }, shoes: { kind: 'dress', color: '#2a2220' }, mood: 'happy' },
  grandma: { build: 'old', skin: '#e2b896', hair: { style: 'bun', color: '#e8e4e0' }, eyes: { color: '#3a2a22', shape: 'narrow' }, top: { kind: 'coat', color: '#7a3a4a' }, bottom: { kind: 'slacks', color: '#3a3438' }, shoes: { kind: 'dress', color: '#3a2a26' }, acc: ['glasses', 'bag'], bagColor: '#c8a050', mood: 'happy', energy: 0.6 },
  chef: { build: 'big', skin: '#e6b48e', hair: { style: 'buzz', color: '#2a2422' }, eyes: { color: '#2a2018' }, top: { kind: 'apron', color: '#f2f0ea', color2: '#c83a3a' }, bottom: { kind: 'slacks', color: '#2a2a30' }, shoes: { kind: 'dress', color: '#1e1a1a' }, acc: ['headband'], bandColor: '#c83a3a', mood: 'happy', idlePose: 'hips' },
  // the opening's cast
  yumi: { build: 'teen', skin: '#f2cdb0', hair: { style: 'bun', color: '#e8d08a' }, eyes: { color: '#5a5ab8', shape: 'round', lashes: true }, top: { kind: 'hoodie', color: '#8a8ad8', color2: '#f4ecd8' }, bottom: { kind: 'skirt', color: '#3a6a4a', color2: '#f4ecd8' }, shoes: { kind: 'sneakers', color: '#f2f0ea', stripe: '#8a8ad8', sock: '#f4f0ea', socks: 'knee' }, acc: ['glasses', 'backpack', 'phone'], packColor: '#3a6a4a', mood: 'happy', freckles: true },   // partner: Creepetal (periwinkle petals, blond fringe, green stem)
  spike: { build: 'tall', skin: '#e6b890', hair: { style: 'mohawk', color: '#1e8a4a' }, eyes: { color: '#c88a1e', shape: 'narrow', thick: true }, top: { kind: 'vest', color: '#6a3a1e', color2: '#4a2814', inner: '#f2f0ea' }, bottom: { kind: 'jeans', color: '#2a2a30' }, shoes: { kind: 'boots', color: '#141216' }, acc: ['chain', 'earring', 'gloves'], gloveColor: '#2a4a8a', mood: 'tough' },   // partner: Dreadrake (green head, chestnut chest, white collar ring, blue speculum)
  lau: { build: 'old', skin: '#e2b896', hair: { style: 'bald', color: '#e8e4e0' }, beard: 'full', beardColor: '#e8e4e0', eyes: { color: '#3a2a22', shape: 'narrow' }, top: { kind: 'coat', color: '#5a6a5a' }, bottom: { kind: 'slacks', color: '#4a4440' }, shoes: { kind: 'dress', color: '#2a2220' }, acc: ['glasses', 'bag'], bagColor: '#8a6a4a', mood: 'tired', energy: 0.5 },
  driver: { build: 'big', skin: '#c48a62', hair: { style: 'buzz', color: '#2a2422' }, beard: 'stubble', beardColor: '#2a2422', eyes: { color: '#c89a1e', shape: 'narrow', thick: true }, top: { kind: 'jacket', color: '#2a2a32', inner: '#b82a2a', stripe: '#e8b43a' }, bottom: { kind: 'slacks', color: '#2a2a32' }, shoes: { kind: 'dress', color: '#1e1a1a' }, acc: ['cap'], capColor: '#b82a2a', mood: 'tough' },   // partner: Thundersabre (storm charcoal, gold bolts, crimson mane)
  chess: { build: 'old', skin: '#d6a882', hair: { style: 'bald', color: '#d8d4d0' }, beard: 'full', beardColor: '#e8e4e0', eyes: { color: '#2a2018', shape: 'narrow' }, top: { kind: 'vest', color: '#e8e2d4', color2: '#6a5a4a', inner: '#e8e2d4' }, bottom: { kind: 'slacks', color: '#5a5048' }, shoes: { kind: 'dress', color: '#2a2220' }, acc: ['glasses'], mood: 'calm', energy: 0.5 },
};
// random passers-by: a deterministic outfit from a seed
const SKINS = ['#f2cdb0', '#e6b48e', '#d29a72', '#c48a62', '#8a5a3e', '#6a4430', '#f0c8a8', '#d8a27a'];
const HAIRS = ['#1e1a22', '#2a1e1a', '#3a2a20', '#6a4a2a', '#a8763a', '#d8d0c4', '#c8303a', '#e8e4e0'];
const CLOTH = ['#3a6ab0', '#c83a3a', '#e8b43a', '#2e2e36', '#5a9a6a', '#e8e4dc', '#8a3a8a', '#e8603a', '#4a5a7a', '#2e4a8a', '#7a3a4a', '#d8d0c4'];
export function passerby(seed) {
  let x = (seed * 2654435761) >>> 0; const r = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const build = pick(['adult', 'adult', 'teen', 'tall', 'big', 'old', 'kid']);
  return {
    name: 'passerby' + seed, build, skin: pick(SKINS),
    hair: { style: pick(build === 'old' ? ['bald', 'bun', 'short', 'buzz'] : ['short', 'spiky', 'long', 'bob', 'ponytail', 'slick', 'buzz', 'afro', 'bun']), color: build === 'old' ? '#e8e4e0' : pick(HAIRS) },
    eyes: { color: pick(['#3a2a1e', '#4a3424', '#3a5a8a', '#2a4a2a']) },
    top: { kind: pick(['tee', 'hoodie', 'jacket', 'coat', 'tee', 'tank', 'suit']), color: pick(CLOTH), inner: pick(CLOTH) },
    bottom: { kind: pick(['jeans', 'jeans', 'slacks', 'shorts', 'skirt', 'track']), color: pick(['#2e3a5e', '#34406a', '#2a2a30', '#5a5048', '#3a3238', '#6a5a4a']) },
    shoes: { kind: pick(['sneakers', 'boots', 'dress']), color: pick(['#f2f0ea', '#2a2a32', '#5a3a2a', '#c83a3a']) },
    acc: [r() < 0.3 ? 'glasses' : null, r() < 0.15 ? 'cap' : null, r() < 0.2 ? 'backpack' : null, r() < 0.15 ? 'headphones' : null, r() < 0.2 ? 'bag' : null].filter(Boolean),
    capColor: pick(CLOTH), packColor: pick(CLOTH), bagColor: pick(CLOTH), mood: pick(['calm', 'happy', 'cool', 'tired']),
  };
}
const cache = {};
export const CAST_NAMES = Object.keys(R);
export const RECIPES = R;
export function cast(name) {
  if (!cache[name]) { const r = R[name] || (name.startsWith('passerby') ? passerby(+name.slice(8) || 1) : R.hero); cache[name] = person({ name, ...r, top: { ...r.top, print: null } }); }
  return cache[name];
}
// a sculpted voxel person (a Model-compatible instance for the Animator)
export function castVox(name, extra = {}) { return new VoxPerson({ name, ...R[name], ...extra }); }
// a low-poly anime person (anime.js): a cast name, a passer-by seed name or a recipe object
export function castAnime(who, extra = {}) {
  const r = typeof who === 'string' ? (R[who] || (who.startsWith('passerby') ? passerby(+who.slice(8) || 1) : R.hero)) : who;
  return new AnimePerson({ name: typeof who === 'string' ? who : r.name || 'person', ...r, ...extra });
}
