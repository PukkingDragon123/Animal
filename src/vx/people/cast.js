// The cast as recipes. castVox(name) → a sculpted voxel person (voxperson.js);
// cast(name) → the older box-model person (person.js), kept for tooling.
// Shirt prints are functions of (x metres from the chest centre, fy 0..1 up the torso) → colour.
import { person } from './person.js';
import { VoxPerson } from './voxperson.js';

const disc = (x, fy, cy, r) => Math.hypot(x, (fy - cy) * 0.3) < r;
const PRINTS = {
  flame: (x, fy) => { if (!disc(x, fy, 0.6, 0.05)) return null; const t = (fy - 0.5) / 0.2, w = 0.028 * (1 - t) + 0.004; return Math.abs(x + Math.sin(t * 5) * 0.006) < w && t > 0 && t < 1 ? (t < 0.5 ? '#ffd040' : '#ff7a2a') : disc(x, fy, 0.6, 0.044) ? '#2a2a34' : '#f4efe6'; },
  star: (x, fy) => { if (Math.abs(x) > 0.05 || Math.abs(fy - 0.58) > 0.16) return null; const a = Math.atan2((fy - 0.58) * 0.3, x), r = Math.hypot(x, (fy - 0.58) * 0.3); return r < 0.03 * (0.55 + 0.45 * Math.abs(Math.cos(a * 2.5))) ? '#f8f4e8' : '#3a6ab0'; },
  bolt: (x, fy) => (Math.abs(fy - 0.6 - Math.sin(x * 90) * 0.05) < 0.03 && Math.abs(x) < 0.09 ? '#e8e4dc' : null),
  band: (x, fy) => (Math.abs(fy - 0.62) < 0.05 && Math.abs(x) < 0.1 ? (Math.round(x * 80) % 2 ? '#c83a3a' : '#f0e8dc') : null),
};
const R = {
  hero: { build: 'teen', skin: '#d8a27a', hair: { style: 'spiky', color: '#2a1e1a' }, eyes: { color: '#5a3a22', shape: 'sharp', thick: true }, top: { kind: 'hoodie', color: '#e8603a', color2: '#f4efe6', print: PRINTS.flame }, bottom: { kind: 'jeans', color: '#2e3a5e' }, shoes: { kind: 'sneakers', color: '#f2f0ea', stripe: '#e8603a', lace: '#e8603a' }, acc: ['phone', 'capsule', 'backpack', 'watch'], packColor: '#2e6a8a', mood: 'calm' },
  coach: { build: 'big', skin: '#c48a62', hair: { style: 'buzz', color: '#2a2422' }, beard: 'stubble', beardColor: '#3a3230', eyes: { color: '#2a2018', shape: 'narrow', thick: true }, top: { kind: 'jacket', color: '#2e4a8a', inner: '#f0ece4', stripe: '#f0c840' }, bottom: { kind: 'track', color: '#2e4a8a', color2: '#f0c840' }, shoes: { kind: 'sneakers', color: '#2a2a32', stripe: '#f0c840', sole: '#e8e4dc' }, acc: ['watch', 'capsule', 'chain'], mood: 'tough', idlePose: 'crossed', jaw: 0.6 },
  mika: { build: 'teen', skin: '#f0c8a8', hair: { style: 'bob', color: '#1e1a22' }, eyes: { color: '#6a3a5a', shape: 'sharp', lashes: true }, top: { kind: 'jacket', color: '#d8d0c4', inner: '#e84a6a' }, bottom: { kind: 'skirt', color: '#2e2e3a' }, shoes: { kind: 'boots', color: '#2a2224', sock: '#2a2a32' }, acc: ['headphones', 'capsule', 'bag'], bagColor: '#e84a6a', phoneColor: '#e84a6a', mood: 'cool' },
  kaito: { build: 'teen', skin: '#e6b890', hair: { style: 'slick', color: '#d8d0c4' }, eyes: { color: '#3a5a8a', shape: 'narrow', thick: true }, top: { kind: 'jacket', color: '#1e1e26', inner: '#a82e3a' }, bottom: { kind: 'slacks', color: '#2a2a34' }, shoes: { kind: 'boots', color: '#1a1a20' }, acc: ['earring', 'capsule', 'gloves'], gloveColor: '#1a1a20', mood: 'cool', idlePose: 'pockets' },
  taro: { build: 'kid', skin: '#e8b48c', hair: { style: 'bob', color: '#3a2a20', bangs: 'straight' }, eyes: { color: '#4a3424', shape: 'round' }, top: { kind: 'tee', color: '#f0c840', print: PRINTS.star }, bottom: { kind: 'shorts', color: '#3a5a8a' }, shoes: { kind: 'sneakers', color: '#e84a3a', sock: '#f4f0ea' }, acc: ['glasses', 'backpack'], packColor: '#5a9a5a', mood: 'happy', freckles: true },
  riff: { build: 'tall', skin: '#e0b08c', hair: { style: 'mohawk', color: '#c8303a' }, eyes: { color: '#6a2a2a', shape: 'narrow', thick: true }, top: { kind: 'vest', color: '#4a5a7a', color2: '#3a4a6a', inner: '#1e1e24' }, bottom: { kind: 'jeans', color: '#2a2a30' }, shoes: { kind: 'boots', color: '#1a1618' }, acc: ['chain', 'earring', 'capsule', 'gloves'], gloveColor: '#2a1e1e', mood: 'tough' },
  moshi: { build: 'big', skin: '#8a5a3e', hair: { style: 'afro', color: '#1e1614' }, eyes: { color: '#3a2418', shape: 'round' }, top: { kind: 'tank', color: '#3a3a42', print: PRINTS.bolt }, bottom: { kind: 'jeans', color: '#34303a' }, shoes: { kind: 'boots', color: '#2a2220' }, acc: ['chain', 'capsule'], mood: 'happy' },
  aoi: { build: 'adult', skin: '#f2cdb0', hair: { style: 'ponytail', color: '#2a1e2a' }, eyes: { color: '#4a2a4a', shape: 'sharp', lashes: true }, top: { kind: 'suit', color: '#2e3a5a', tie: '#e8b43a' }, bottom: { kind: 'skirt', color: '#2e3a5a' }, shoes: { kind: 'dress', color: '#1e1a22', sock: '#d8c0b0' }, acc: ['glasses'], mood: 'calm' },
  reporter: { build: 'adult', skin: '#d29a72', hair: { style: 'slick', color: '#3a2a22' }, eyes: { color: '#3a2a1e' }, top: { kind: 'suit', color: '#8a3a3a', tie: '#2a2a32' }, bottom: { kind: 'slacks', color: '#3a3238' }, shoes: { kind: 'dress', color: '#2a2220' }, mood: 'happy' },
  grandma: { build: 'old', skin: '#e2b896', hair: { style: 'bun', color: '#e8e4e0' }, eyes: { color: '#3a2a22', shape: 'narrow' }, top: { kind: 'coat', color: '#7a3a4a' }, bottom: { kind: 'slacks', color: '#3a3438' }, shoes: { kind: 'dress', color: '#3a2a26' }, acc: ['glasses', 'bag'], bagColor: '#c8a050', mood: 'happy', energy: 0.6 },
  chef: { build: 'big', skin: '#e6b48e', hair: { style: 'buzz', color: '#2a2422' }, eyes: { color: '#2a2018' }, top: { kind: 'apron', color: '#f2f0ea', color2: '#c83a3a' }, bottom: { kind: 'slacks', color: '#2a2a30' }, shoes: { kind: 'dress', color: '#1e1a1a' }, acc: ['headband'], bandColor: '#c83a3a', mood: 'happy', idlePose: 'hips' },
  chess: { build: 'old', skin: '#d6a882', hair: { style: 'bald', color: '#d8d4d0' }, beard: 'full', beardColor: '#e8e4e0', eyes: { color: '#2a2018', shape: 'narrow' }, top: { kind: 'vest', color: '#e8e2d4', color2: '#6a5a4a', inner: '#e8e2d4' }, bottom: { kind: 'slacks', color: '#5a5048' }, shoes: { kind: 'dress', color: '#2a2220' }, acc: ['glasses'], mood: 'calm', energy: 0.5 },
};
const cache = {};
export const CAST_NAMES = Object.keys(R);
export const RECIPES = R;
export function cast(name) { if (!cache[name]) cache[name] = person({ name, ...R[name], top: { ...R[name].top, print: null } }); return cache[name]; }
// a sculpted voxel person (a Model-compatible instance for the Animator)
export function castVox(name, extra = {}) { return new VoxPerson({ name, ...R[name], ...extra }); }
