// Tokonmon — parametric anime-chibi humans. Every human in the game is generated here as a small 3D
// chibi (SDF parts on a 1-art-pixel voxel lattice) that src/gfx/bake.js renders into 2D pixel sprites
// (64×64 cells, 32 px/m) and 96×96 dialogue portraits; the same design also works as a 3D actor.
// Spec, catalogues, cast table and review commands: docs/CHARACTERS.md. Look study: docs/refs/characters.md.
//
//   humanDesign(look)       → design (arch 'biped': head/body/armL/armR/legL/legR [+ hair/coat/prop parts])
//   chibiDesign             → alias of humanDesign (src/data/designs/chibi.js re-exports this module)
//   CHARACTERS / CHAR_LORE  → named looks + story metadata (name, role, voice {pitch, speed}, bio)
//   randomLook(seed, role?) → deterministic townsfolk / crowd / reporter / bully looks
//   withCosmetics(look, c), characterDesign(key, cosmetics?), normalizeLook(look)
//   DESIGNS                 → ready-built designs for every named character + sample townsfolk
//   catalogues: SKIN_TONES, HAIR_COLORS, HAIR_STYLES, EYE_STYLES, IRIS_COLORS, MOUTH_STYLES, BROW_STYLES,
//               TOP_STYLES, BOTTOM_STYLES, SHOE_STYLES, STONE_SHAPES, ACCESSORIES, EXPRESSIONS
//
// Pixel discipline: design.vs = 1/32 m, so one voxel = one art pixel of the sprite. Every coordinate in
// this file is written in those PIXEL UNITS (+y up, +z = front, model's left = +x) and converted once.
// The face (brows, eyes, blush, nose, mouth) is ONE pixel decal per expression (design.eyes with
// mirror:false + hand-built variants), so brows and mouths change with the expression; the talking mouth is
// design.mouth (open frame only). Side views get a static profile-eye decal on each side of the head.
//
// look = {
//   build: 'kid'|'teen'|'adult'|'big'|'old',  height: 0.85–1.15 (adds/removes whole pixels of leg/torso)
//   skin: '#hex',
//   hair:  { style (HAIR_STYLES; aliases like 'twin buns' ok), color, color2 (tips / streak / ties), color3 },
//   eyes:  { style (EYE_STYLES), iris, lashes, liner (eyeliner flick), shadow ('#hex' eye shadow), lift },
//   face:  { brows (BROW_STYLES), browColor, mouth (MOUTH_STYLES), blush: true|'lines'|'#hex', nose, freckles,
//            stubble, beard: 'full'|'goatee'|'long'|'short'|'chops', mustache: 'thin'|'thick'|'walrus'|'pencil',
//            facial ('#hex' facial-hair colour), paint ('#hex' cheek paint), corpse: 'thorn'|'moon' (kid-friendly
//            corpse paint), lipstick ('#hex'), scar, wrinkles, bandage, tattoo (arm colour), under (face drawn
//            under the fringe: hair can hide the eyes), plaster },
//   top:   { style (TOP_STYLES), color, color2, color3, glow (neon trim), emblem (back), graphic (chest),
//            ears ('panda'|'cat' hood), pattern ('leopard'|'plaid'|'zebra'|'stars'|'sashiko'|'floral'|'sequin'),
//            sleeves ('long'|'short'|'none'|'rolled'|'pushed'), patch, inner, crop, open, tails, collar },
//   bottom:{ style (BOTTOM_STYLES), color, color2, ripped, socks: 'high'|'#hex', tights, pleats, belt, stripe, pattern },
//   shoes: { style (SHOE_STYLES), color, color2, glow } | '#hex',
//   acc:   ['bracelet', 'watch', { type: 'earrings', style: 'hoops', color: '#ffd23a' }, …]   (see ACCESSORIES)
//   cosmetics: { stone: { color, shape }, watch: 'gold', …, <any accessory>: true | false | 'style' | '#hex' | {…} },
//   anim:  { quirk: [...] }, portrait: { y, size, yaw } overrides
// }
import { mulberry32, hashStr } from '../../core/rng.js';

export const PX = 1 / 32;                     // one art pixel at the sprite density (32 px per metre)
const FACE_PX = 1 / Math.cos(0.3);            // face decal pixel: exactly 1 screen px wide in the 0.3 rad front view

// ============================================================ colour helpers
function rgbOf(c) {
  if (typeof c === 'number') return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  let s = String(c || '#ff00ff').trim();
  if (s[0] === '#') s = s.slice(1);
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  const v = parseInt(s, 16);
  return Number.isFinite(v) ? [(v >> 16) & 255, (v >> 8) & 255, v & 255] : [255, 0, 255];
}
const h2 = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
export function shade(c, f) { const [r, g, b] = rgbOf(c); return '#' + h2(r * f) + h2(g * f) + h2(b * f); }
export function mix(a, b, t) { const A = rgbOf(a), B = rgbOf(b); return '#' + h2(A[0] + (B[0] - A[0]) * t) + h2(A[1] + (B[1] - A[1]) * t) + h2(A[2] + (B[2] - A[2]) * t); }
const lum = (c) => { const [r, g, b] = rgbOf(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const dark = (c, a = 0.3) => mix(c, '#2a1d3d', a);   // hue-shifted shadow (toward indigo), never grey
const lite = (c, a = 0.35) => mix(c, '#fff6e0', a);  // warm highlight
const isHex = (c) => typeof c === 'string' && c[0] === '#';
const INK = '#1e1830';                                // global violet-black (lashes, pupils, lines)

// ============================================================ catalogues (character creator + cast)
// skin ramps (base) — SK1 fair … SK4 deep from docs/refs/characters.md §9.4, plus in-betweens
export const SKIN_TONES = ['#fde2cf', '#f9cfb0', '#f3c29f', '#eeb68e', '#d39566', '#b97a52', '#9a6340', '#73472e'];
export const HAIR_COLORS = ['#2b2838', '#1a1620', '#4a3022', '#6e4431', '#a8693d', '#fbb954', '#e8ecf6', '#c7dcd0',
  '#ed8099', '#c9a7ff', '#30e1b9', '#4d65b4', '#e83b3b', '#91db69'];
export const IRIS_COLORS = ['#7a4a2a', '#3a2418', '#2f6fd6', '#2aa86a', '#e23a3a', '#f29a2e', '#8a4fe0', '#3fd0c9', '#ff4fa8', '#ffd23a'];
// the first 14 are offered in the character creator (src/ui/screens.js)
export const HAIR_STYLES = ['short', 'spiky', 'messy', 'bob', 'ponytail', 'twin_braids', 'long', 'twin_buns', 'twin_tails',
  'pixie', 'side_part', 'bun', 'curly', 'mohawk',
  'buzz', 'bald', 'afro', 'braid', 'cap', 'topknot', 'slick', 'hime', 'mop', 'curtains', 'swept', 'sidemop', 'feather',
  'cloud', 'teased', 'liberty', 'dreads', 'mullet', 'perm', 'veil', 'asym', 'pompadour', 'swirl', 'cape', 'wavy', 'shag'];
export const EYE_STYLES = ['anime', 'big', 'round', 'calm', 'sharp', 'fierce', 'sleepy', 'bead', 'dot', 'tall', 'star', 'arc', 'gentle', 'visor', 'hidden'];
export const MOUTH_STYLES = ['smile', 'line', 'grin', 'cat', 'tiny', 'w', 'fang', 'lips', 'smirk', 'frown', 'beam', 'gap', 'none'];
export const BROW_STYLES = ['soft', 'thin', 'thick', 'sharp', 'angry', 'worried', 'bushy', 'arched', 'wing', 'none'];
export const EXPRESSIONS = ['normal', 'happy', 'closed', 'sad', 'angry', 'surprised', 'shocked', 'hurt', 'ko', 'smirk', 'wink', 'think'];
export const TOP_STYLES = ['hoodie', 'jacket', 'tracksuit', 'leather', 'labcoat', 'apron', 'suit', 'tee', 'happi', 'uniform',
  'kimono', 'gi', 'vest', 'tank', 'field', 'cardigan', 'dress', 'sailor', 'gakuran', 'hawaiian', 'sweater', 'hivis',
  'band_jacket', 'battle_vest', 'coat', 'blazer', 'jumpsuit', 'robe', 'cape_top', 'gown', 'sequin', 'bodysuit', 'flannel',
  'turtleneck', 'jersey', 'techwear', 'chef', 'noragi', 'smock', 'puffer'];
export const BOTTOM_STYLES = ['pants', 'jeans', 'shorts', 'skirt', 'long_skirt', 'hakama', 'cargo', 'track', 'overalls',
  'flares', 'baggy', 'tartan', 'spandex', 'slacks', 'skort', 'bike'];
export const SHOE_STYLES = ['sneakers', 'hightops', 'boots', 'loafers', 'sandals', 'rainboots', 'idol', 'platform', 'geta',
  'clogs', 'beatle', 'skates', 'heels', 'tabi', 'barefoot', 'maryjane'];
export const STONE_SHAPES = ['round', 'heart', 'star', 'diamond', 'skull'];
// Equippable accessories / cosmetics: slot (one per slot is sensible) and styles.
export const ACCESSORIES = {
  bracelet: { slot: 'wristL', styles: ['tech'], note: 'soul-stone tech band — always on trainers; cosmetics.stone = {color, shape}' },
  watch: { slot: 'wristR', styles: ['digital', 'gold', 'smart'] },
  earrings: { slot: 'ears', styles: ['studs', 'hoops', 'lightning'] },
  hairclip: { slot: 'hairclip', styles: ['star', 'heart', 'bolt', 'flower', 'leaf', 'cat'] },
  grillz: { slot: 'mouth', styles: ['gold', 'silver', 'diamond'] },
  badge: { slot: 'chest', styles: ['round', 'star', 'heart', 'tag', 'medal'] },
  cap: { slot: 'hat', styles: ['forward', 'back'] },
  safari_hat: { slot: 'hat', styles: ['safari', 'campaign'] },
  straw_hat: { slot: 'hat', styles: ['straw', 'farmer'] },
  hard_hat: { slot: 'hat', styles: ['hard'] },
  beanie: { slot: 'hat', styles: ['beanie', 'cat'] },
  crown: { slot: 'hat', styles: ['crown'] },
  pillbox: { slot: 'hat', styles: ['pillbox', 'bellhop', 'porthole'] },
  captain: { slot: 'hat', styles: ['captain'] },
  mortarboard: { slot: 'hat', styles: ['grad'] },
  chef_hat: { slot: 'hat', styles: ['toque', 'paper'] },
  helmet: { slot: 'hat', styles: ['robot', 'bike'] },
  pointed_hat: { slot: 'hat', styles: ['clown'] },
  headband: { slot: 'forehead', styles: ['sport', 'hachimaki', 'glam', 'tenugui'] },
  bandana: { slot: 'head', styles: ['head', 'neck'] },
  goggles: { slot: 'forehead', styles: ['field', 'led'] },
  visor: { slot: 'forehead', styles: ['sun', 'shades', 'tech'] },
  glasses: { slot: 'eyes', styles: ['round', 'square', 'half', 'oval'] },
  sunglasses: { slot: 'eyes', styles: ['shades', 'visor', 'heart', 'aviator', 'shutter', 'wrap'] },
  monocle: { slot: 'eyes', styles: ['holo'] },
  mask: { slot: 'face', styles: ['surgical'] },
  headset: { slot: 'ears', styles: ['headset', 'phones', 'earpiece'] },
  chain: { slot: 'neck', styles: ['gold', 'silver', 'wallet', 'cross'] },
  whistle: { slot: 'neck', styles: ['whistle'] },
  pendant: { slot: 'neck', styles: ['sun', 'stone', 'locket', 'pick', 'diamond', 'paw'] },
  scarf: { slot: 'neck', styles: ['scarf', 'long', 'neckerchief', 'stars', 'tenugui'] },
  bowtie: { slot: 'neck', styles: ['bow'] },
  collar: { slot: 'neck', styles: ['studded'] },
  lanyard: { slot: 'neck', styles: ['id'] },
  backpack: { slot: 'back', styles: ['pack', 'bear', 'randoseru'] },
  satchel: { slot: 'hip', styles: ['satchel', 'scrolls'] },
  apron: { slot: 'over', styles: ['apron', 'stripe', 'splat'] },
  cape: { slot: 'back', styles: ['cape', 'royal', 'stars'] },
  gloves: { slot: 'hands', styles: ['full', 'fingerless', 'white'] },
  wristbands: { slot: 'wrists', styles: ['plain', 'spiked', 'sweat'] },
  gauntlets: { slot: 'arms', styles: ['spiked'] },
  shoulder: { slot: 'shoulders', styles: ['spikes', 'chrome', 'epaulettes'] },
  rings: { slot: 'fingers', styles: ['gold'] },
  belt: { slot: 'waist', styles: ['picks', 'studded', 'chain'] },
  prop: { slot: 'hand', styles: ['guitar', 'bass', 'violin_bass', 'hollow', 'drumsticks', 'mic', 'micstand', 'net', 'cone', 'picks',
    'spatulas', 'strainer', 'camera', 'mic_flag', 'tablet', 'briefcase', 'cane', 'hoe', 'lemon', 'pompoms', 'tambourine', 'keytar',
    'spyglass', 'bell', 'calculator', 'teacup', 'radio', 'coin', 'jar', 'foam_finger', 'penlight', 'towel', 'flag', 'clipboard',
    'hairspray', 'binoculars', 'cage', 'flying_v'] },
  back_prop: { slot: 'back', styles: ['flying_v', 'guitar', 'bass', 'drum'] },
};

// ============================================================ builds (pixel units)
//  leg: hip-joint height (legs 0..leg) · torso: hip → shoulder top · head: skull rows · hw/hd: skull half width/depth
//  cw/cwB/cd: torso half width at shoulders / waist, half depth · arm: arm thickness · armLen: shoulder→wrist
//  legW/gap: leg thickness and the gap between legs · hunch: forward stoop of the upper body (elders)
const BUILDS = {
  kid: { leg: 10, torso: 9, head: 16, hw: 7.5, hd: 7, cw: 4.4, cwB: 4.0, cd: 3.2, arm: 2.6, armLen: 7, hand: 2.6, legW: 3.4, gap: 1.6, foot: 2.6, bounce: 1.4, gait: 1.15, maxSpeed: 3.6 },
  teen: { leg: 14, torso: 11, head: 17, hw: 8, hd: 7.5, cw: 5.4, cwB: 4.6, cd: 3.7, arm: 3, armLen: 9, hand: 3, legW: 3.8, gap: 2, foot: 3, bounce: 1.1, gait: 1, maxSpeed: 4.6 },
  adult: { leg: 16, torso: 13, head: 17, hw: 8, hd: 7.5, cw: 6, cwB: 5, cd: 4.1, arm: 3.2, armLen: 11, hand: 3, legW: 4.2, gap: 2, foot: 3.2, bounce: 1, gait: 1, maxSpeed: 4.6 },
  big: { leg: 15, torso: 17, head: 17, hw: 8.5, hd: 8, cw: 10, cwB: 9.4, cd: 6.6, arm: 4.6, armLen: 13, hand: 4, legW: 6, gap: 2.2, foot: 4, bounce: 0.8, gait: 0.9, maxSpeed: 4.2 },
  old: { leg: 12, torso: 11, head: 16, hw: 8, hd: 7.5, cw: 5.4, cwB: 5, cd: 4, arm: 3, armLen: 9, hand: 3, legW: 3.8, gap: 2, foot: 3, hunch: 2, bounce: 0.6, gait: 0.75, maxSpeed: 2.6 },
};

function dims(B, L) {
  const D = Object.assign({}, B);
  // height: whole pixels added to (or removed from) legs and torso — the head never scales
  const extra = Math.round((L.height - 1) * (B.leg + B.torso + B.head));
  const dl = Math.round(extra * 0.6);
  D.leg = B.leg + dl; D.torso = B.torso + (extra - dl);
  if (L.wide) { D.cw += L.wide; D.cwB += L.wide; D.cd += L.wide * 0.6; }
  D.hip = D.leg;                                  // leg pivot (top of the legs)
  D.sh = D.leg + D.torso;                         // shoulder top (y of the torso's top surface)
  D.hz = B.hunch || 0;                            // head / upper-body forward offset (stoop)
  D.chin = D.sh - 1;                              // lattice row of the chin (skull's lowest row)
  D.yb = D.chin - 0.5; D.yt = D.yb + D.head;      // skull bottom / top surfaces
  D.top = D.chin + D.head - 1;                    // skull's top lattice row
  D.cy = (D.yb + D.yt) / 2;
  D.FZ = D.hz + D.hd;                             // face plane
  // face rows (lattice) — measured up from the chin, identical for every build
  D.mouthY = D.chin + 2; D.blushY = D.chin + 4; D.eyeB = D.chin + 5; D.eyeT = D.chin + 8; D.browY = D.chin + 10;
  D.armX = D.cw + D.arm / 2 - 0.4;                // arm centre line (x)
  D.legX = D.gap / 2 + D.legW / 2;                // leg centre line (x)
  D.wrist = D.sh - 1.5 - D.armLen;                // wrist height
  return D;
}

// ============================================================ build context
class Ctx {
  constructor(L, D, pal) {
    this.L = L; this.D = D; this.pal = pal; this.u = PX;
    this.parts = { head: [], body: [], armL: [], armR: [], legL: [], legR: [] };
    this.hairPre = []; this.hairPost = []; this.extra = []; this.decals = []; this.fx = [];
    this.sleeve = 'long'; this.legWear = 'long';
    this.hat = null; this.earsVisible = true; this.flags = {};
    this.hairTop = D.yt + 1.5;                    // highest point of hair/hat (portrait framing)
  }
  P(x, y, z) { const u = this.u; return [x * u, y * u, z * u]; }
  O(o) {
    const u = this.u, r = Object.assign({ jit: 0 }, o);
    for (const k of ['round', 'noise', 'noiseScale', 'fat', 'thr', 'blend']) if (r[k] != null) r[k] *= u;
    if (r.stripes) r.stripes = Object.assign({}, r.stripes, { p: r.stripes.p * u, w: r.stripes.w * u, o: (r.stripes.o || 0) * u });
    if (r.spots) r.spots = Object.assign({}, r.spots, { s: (r.spots.s ?? 1.2) * u });
    if (r.grad) r.grad = Object.assign({}, r.grad, { a: r.grad.a * u, b: r.grad.b * u });
    return r;
  }
  // lattice box: exactly the voxels i0..i1 × j0..j1 × k0..k1 (paint regions, trims)
  vb(i0, i1, j0, j1, k0, k1, col, o) {
    const u = this.u;
    if (i0 > i1) [i0, i1] = [i1, i0];
    if (j0 > j1) [j0, j1] = [j1, j0];
    if (k0 > k1) [k0, k1] = [k1, k0];
    return ['box', [(i0 + i1) / 2 * u, (j0 + j1) / 2 * u, (k0 + k1) / 2 * u], [((i1 - i0) / 2 + 0.45) * u, ((j1 - j0) / 2 + 0.45) * u, ((k1 - k0) / 2 + 0.45) * u], col, this.O(o)];
  }
  box(c, h, col, o) { return ['box', this.P(...c), h.map((v) => v * this.u), col, this.O(o)]; }
  ell(c, r, col, o) { return ['ell', this.P(...c), r.map((v) => v * this.u), col, this.O(o)]; }
  sph(c, r, col, o) { return ['sph', this.P(...c), r * this.u, col, this.O(o)]; }
  cap(a, b, r0, r1, col, o) { return ['cap', this.P(...a), this.P(...b), r0 * this.u, r1 * this.u, col, this.O(o)]; }
  cyl(a, b, r, col, o) { return ['cyl', this.P(...a), this.P(...b), r * this.u, col, this.O(o)]; }
  tor(c, R, r, col, o) { return ['tor', this.P(...c), R * this.u, r * this.u, col, this.O(o)]; }
  poly(c, pts, h, col, o) { return ['poly', this.P(...c), pts.map(([a, b]) => [a * this.u, b * this.u]), h * this.u, col, this.O(o)]; }
  arm(s) { return s > 0 ? this.parts.armL : this.parts.armR; }
  leg(s) { return s > 0 ? this.parts.legL : this.parts.legR; }
  // static pixel decal; at in pixel units; px multiple of vs; lift in pixel units
  decal(part, at, dir, rows, cmap, px = 1, extra = {}) {
    const d = Object.assign({ part, at: this.P(...at), dir, rows, cmap, px, snap: false }, extra);
    d.lift = (extra.lift ?? 0.2) * this.u;
    this.decals.push(d);
  }
}

// ============================================================ look normalisation
const norm = (s) => String(s || '').toLowerCase().replace(/[\s-]+/g, '_');
const asObj = (v, key) => (v == null ? {} : typeof v === 'string' ? { [key]: v } : Object.assign({}, v));
const HAIR_ALIAS = { twin_bun: 'twin_buns', buns: 'twin_buns', pigtails: 'twin_tails', crop: 'short', short_crop: 'short', messy_spikes: 'spiky',
  high_ponytail: 'ponytail', braids: 'twin_braids', straight: 'long', mop_top: 'mop', curls: 'curly', perm_cloud: 'perm', quiff: 'pompadour' };
const HAT_ACC = ['crown', 'helmet', 'cap', 'safari_hat', 'straw_hat', 'hard_hat', 'beanie', 'pillbox', 'captain', 'mortarboard', 'chef_hat', 'pointed_hat'];

export function normalizeLook(look = {}) {
  const L = {};
  L.build = BUILDS[look.build] ? look.build : 'adult';
  L.height = Math.max(0.85, Math.min(1.15, +look.height || 1));
  L.wide = Math.max(0, Math.min(3, +look.wide || 0));
  L.skin = look.skin || SKIN_TONES[2];
  L.hair = Object.assign({ style: 'messy', color: HAIR_COLORS[2] }, asObj(look.hair, 'style'));
  L.hair.style = norm(L.hair.style);
  L.hair.style = HAIR_ALIAS[L.hair.style] || L.hair.style;
  if (!HAIR_STYLES.includes(L.hair.style)) L.hair.style = 'messy';
  L.eyes = Object.assign({ style: 'anime', iris: IRIS_COLORS[0] }, asObj(look.eyes, 'style'));
  if (!EYE_STYLES.includes(L.eyes.style)) L.eyes.style = 'anime';
  L.face = Object.assign({}, look.face);
  L.top = Object.assign({ style: 'tee', color: '#f2efe6' }, asObj(look.top, 'style'));
  L.top.style = norm(L.top.style);
  if (!TOP_STYLES.includes(L.top.style)) L.top.style = 'tee';
  L.bottom = Object.assign({ style: 'pants', color: '#3a3f52' }, asObj(look.bottom, 'style'));
  L.bottom.style = norm(L.bottom.style);
  if (!BOTTOM_STYLES.includes(L.bottom.style)) L.bottom.style = 'pants';
  L.shoes = typeof look.shoes === 'string' ? { style: 'sneakers', color: look.shoes } : Object.assign({ style: 'sneakers', color: '#f4f2ee' }, look.shoes);
  L.shoes.style = norm(L.shoes.style);
  if (!SHOE_STYLES.includes(L.shoes.style)) L.shoes.style = 'sneakers';
  L.anim = look.anim || null;
  L.portrait = look.portrait || null;
  // accessories: list entries (string | {type|id|name, ...}) merged with cosmetics (name → true|false|style|{...})
  const acc = {};
  for (const a of look.acc || []) {
    if (!a) continue;
    if (typeof a === 'string') acc[norm(a)] = Object.assign({}, acc[norm(a)]);
    else { const n = norm(a.type || a.id || a.name); if (n) acc[n] = Object.assign({}, acc[n], a); }
  }
  const cos = look.cosmetics || {};
  for (const [k0, v] of Object.entries(cos)) {
    const k = norm(k0);
    if (k === 'stone') continue;
    if (v === false || v == null) { delete acc[k]; continue; }
    acc[k] = Object.assign({}, acc[k], v === true ? {} : typeof v === 'string' ? (v[0] === '#' ? { color: v } : { style: v }) : v);
  }
  if (cos.stone) acc.bracelet = Object.assign({}, acc.bracelet, { stone: cos.stone });
  if (acc.bracelet) acc.bracelet.stone = Object.assign({ color: '#38f0ff', shape: 'round' }, acc.bracelet.stone);
  L.acc = acc;
  L.cosmetics = cos;
  return L;
}

// ============================================================ palette
function makePalette(L) {
  const s = L.skin, h = L.hair.color, t = L.top.color, b = L.bottom.color;
  const t2 = L.top.color2 || (lum(t) > 0.6 ? '#2b2f3c' : '#f2efe6');
  const t3 = L.top.color3 || mix(t2, t, 0.25);
  const f = L.shoes.color || '#f4f2ee';
  const hairDark = lum(h) < 0.18;
  return {
    s, S: mix(s, '#b4505a', 0.22), sl: lite(s, 0.3), sd: mix(s, '#7a3045', 0.42),
    h, H: hairDark ? mix(h, '#0e0a16', 0.45) : dark(h, 0.3), hl: hairDark ? mix(h, '#8a8ec8', 0.42) : lite(h, 0.42), h2: L.hair.color2 || lite(h, 0.55),
    h3: L.hair.color3 || L.hair.color2 || dark(h, 0.5),
    t, T: dark(t, 0.26), tl: lite(t, 0.28), t2, T2: dark(t2, 0.24), t3,
    b, B: dark(b, 0.26), bl: lite(b, 0.25), b2: L.bottom.color2 || dark(b, 0.42),
    f, F: L.shoes.color2 || (lum(f) > 0.7 ? '#e8434f' : '#f2efe6'), fs: L.shoes.sole || (['boots', 'rainboots', 'beatle', 'heels', 'loafers', 'maryjane', 'tabi'].includes(L.shoes.style) ? '#2a2632' : '#f4f2ee'),
    k: INK, w: '#f6f3ec', W: '#ffffff', sock: (isHex(L.bottom.socks) && L.bottom.socks) || L.bottom.sock || '#f4f2ee',
    g: '#f4c542', G: '#b8862a', gl: '#ffe27a', si: '#d8dee8', SI: '#8a94a8',
    m: L.face.facial || (hairDark ? mix(h, '#3a3046', 0.3) : dark(h, 0.25)),
    st: mix(s, '#56607e', 0.3),
  };
}


// ============================================================ torso geometry (+ paint helpers shared by bottoms/tops)
function buildTorso(C) {
  const { D } = C, Bd = C.parts.body, hip = D.hip, sh = D.sh, zc = D.hz * 0.5;
  const chestH = Math.max(5, Math.round(D.torso * 0.62));
  const waistTop = sh - chestH + 1.5;
  // chest / shoulders block and a slightly narrower waist block, smooth-joined (no seam)
  Bd.push(C.box([0, sh - chestH / 2, zc], [D.cw, chestH / 2, D.cd], 't', { round: Math.min(2.2, D.cd - 0.4) }));
  Bd.push(C.box([0, (hip - 1.6 + waistTop) / 2, 0], [D.cwB, (waistTop - hip + 1.6) / 2, D.cd - 0.25], 't', { round: 1.6, blend: 1.4 }));
  const xs = Math.floor(D.cw - 0.05), fk = Math.floor(D.cd + zc - 0.05), bk = -Math.floor(D.cd - zc - 0.05);
  const H = C.T = {
    xs, fk, bk, hip, sh, zc,
    front: (i0, i1, j0, j1, col, o) => Bd.push(C.vb(i0, i1, j0, j1, fk - 1, fk + 3, col, Object.assign({ paint: 1 }, o))),
    back: (i0, i1, j0, j1, col, o) => Bd.push(C.vb(i0, i1, j0, j1, bk - 3, bk + 1, col, Object.assign({ paint: 1 }, o))),
    ring: (j0, j1, col, o) => Bd.push(C.vb(-xs - 3, xs + 3, j0, j1, bk - 3, fk + 3, col, Object.assign({ paint: 1 }, o))),
    sides: (j0, j1, col, o) => Bd.push(C.vb(xs, xs + 3, j0, j1, bk - 3, fk + 3, col, Object.assign({ paint: 1, m: 1 }, o))),
    side1: (s, j0, j1, col, o) => Bd.push(C.vb(s * xs, s * (xs + 3), j0, j1, bk - 3, fk + 3, col, Object.assign({ paint: 1 }, o))),
  };
  return H;
}

// ============================================================ legs & shoes
function buildLegs(C) {
  const { D, L } = C, st = L.shoes.style, wear = C.legWear, bst = L.bottom.style;
  const baggy = bst === 'baggy', flares = bst === 'flares' || C.flags.flares;
  const lw = D.legW / 2 + (baggy ? 0.7 : 0), ld = D.legW * 0.47 + (baggy ? 0.5 : 0);
  const pants = wear === 'long' || wear === 'hidden';
  for (const s of [1, -1]) {
    const G = C.leg(s), x = s * D.legX;
    const i0 = s * Math.round(D.gap / 2 + 0.5), i1 = s * Math.round(D.gap / 2 + D.legW + (baggy ? 1 : 0));
    const io = s > 0 ? Math.max(i0, i1) : Math.min(i0, i1);
    const legCol = wear === 'tights' ? 'b2' : pants ? 'b' : 's';
    // leg column: ground → 1 px above the hip joint
    G.push(C.box([x, (D.hip + 1) / 2, 0], [lw, (D.hip + 1) / 2 + 0.2, ld], legCol, { round: Math.min(1.3, lw) }));
    if (flares && pants) G.push(C.cap([x, 5, 0], [x + s * 0.3, 1.2, 0.2], lw - 0.2, lw + 1.1, 'b'));
    const K = [-4, 4];
    const paintRows = (j0, j1, col, o) => G.push(C.vb(i0, i1, j0, j1, K[0], K[1], col, Object.assign({ paint: 1 }, o)));
    if (wear === 'shorts') { paintRows(0, D.hip + 1, 's'); paintRows(D.hip - C.flags.shortsLen, D.hip + 1, 'b'); }
    if (wear === 'bike') { paintRows(0, D.hip + 1, 's'); paintRows(D.hip - Math.round(D.leg * 0.45), D.hip + 1, 'b2'); }
    // socks on bare legs
    const bare = !pants && wear !== 'tights';
    if (bare) paintRows(2, 3, 'sock');
    if (bare && L.bottom.socks === 'high') paintRows(2, Math.max(4, Math.round(D.leg * 0.45)), 'sock');
    if (bare && isHex(L.bottom.socks)) paintRows(2, Math.max(4, Math.round(D.leg * 0.45)), 'sock');
    // inner column a step darker: separates the legs (front) and the far leg (side view)
    G.push(C.vb(i0, i0, 3, D.hip, K[0], K[1], pants ? 'B' : wear === 'tights' ? mix(C.pal.b2, '#1e1830', 0.3) : 'S', { paint: 1 }));
    if (pants && L.bottom.ripped) {
      const kn = Math.round(D.leg * 0.5);
      G.push(C.vb(i0 + s, io - s, kn, kn + 1, 1, 4, 's', { paint: 1 }));
      G.push(C.vb(i0 + s, io - s, kn + 2, kn + 2, 1, 4, 'bl', { paint: 1 }));
    }
    if (pants && L.bottom.stripe) G.push(C.vb(io, io, 3, D.hip + 1, K[0], K[1], L.bottom.stripe, { paint: 1 }));
    if (pants && C.flags.cargo) G.push(C.vb(io, io + s, Math.round(D.leg * 0.45), Math.round(D.leg * 0.45) + 2, -2, 2, 'B', { paint: 1 }));
    if (pants && bst === 'jeans') G.push(C.vb(io, io, 3, D.hip, 1, 4, 'bl', { paint: 1 }));
    if (pants && bst === 'slacks') G.push(C.vb(x - s * 0.2, x - s * 0.2, 4, D.hip - 1, 1, 4, 'B', { paint: 1 }));
    if (bst === 'tartan' && pants) {
      G.push(C.vb(i0, i1, 3, D.hip + 1, K[0], K[1], 'b2', { paint: 1, stripes: { axis: 'y', p: 4, w: 1, col: 'b2' } }));
      G.push(C.vb(i0, i1, 3, D.hip + 1, K[0], K[1], 'b', { paint: 1, stripes: { axis: 'y', p: 4, w: 3, col: 'b', o: 1 } }));
      G.push(C.vb(x, x, 3, D.hip + 1, K[0], K[1], L.bottom.color3 || '#ffd23a', { paint: 1 }));
      G.push(C.vb(i0, i1, Math.round(D.leg * 0.55), Math.round(D.leg * 0.55), K[0], K[1], '#2a2632', { paint: 1 }));   // bondage strap
    }
    if (bst === 'spandex' && L.bottom.pattern) patternPaint(C, G, L.bottom.pattern, [i0, i1], [3, D.hip + 1], [K[0], K[1]], 'b', 'b2');
    if (pants && !['spandex', 'tartan'].includes(bst) && !flares && !baggy) G.push(C.vb(i0, i1, 2, 2, K[0], K[1], 'B', { paint: 1 }));   // hem
    shoe(C, G, s, x, i0, i1, io, lw, ld, st);
  }
}

function shoe(C, G, s, x, i0, i1, io, lw, ld, st) {
  const { L, D } = C, fw = Math.max(lw, D.legW / 2) + 0.35, fl = ld + 1.1;
  const sole = (o = {}) => G.push(C.vb(i0 - s * (o.wide ? 1 : 0), i1 + s * (o.wide ? 1 : 0), 0, o.rows ?? 0, -5, 6, o.col || 'fs', { paint: 1 }));
  const foot = (col, y1 = 2.4, fwd = 1.1, o = {}) => G.push(C.box([x, y1 / 2 - 0.1, fwd * 0.75], [fw, y1 / 2 + 0.15, ld + fwd * 0.75], col, Object.assign({ round: 1.05 }, o)));
  switch (st) {
    case 'sandals': case 'geta': {
      foot('s', 2.2);
      if (st === 'geta') { G.push(C.box([x, 0.3, 0.8], [fw, 0.7, fl], 'f', { round: 0.3 })); sole({ col: 'f', rows: 0 }); }
      else sole({ col: 'f' });
      G.push(C.vb(i0, i1, 1, 1, 1, 3, 'F', { paint: 1 }));
      break;
    }
    case 'barefoot': foot('s', 2); G.push(C.vb(i0, i1, 0, 0, 2, 4, 'S', { paint: 1 })); break;
    case 'boots': case 'rainboots': case 'tabi': case 'beatle': {
      const hi = st === 'rainboots' ? 6 : st === 'tabi' ? 4 : 4;
      G.push(C.box([x, (hi + 0.4) / 2, 0], [lw + 0.4, (hi + 0.4) / 2, ld + 0.35], 'f', { round: 1 }));
      foot('f', 2.4, st === 'beatle' ? 1.8 : 1.2);
      if (st === 'beatle') G.push(C.cap([x, 1.1, ld + 1], [x, 0.9, ld + 2.6], 1.2, 0.6, 'f'));
      sole();
      if (st === 'boots') G.push(C.vb(i0, i1, hi, hi, -5, 5, 'F', { paint: 1 }), C.vb(io, io, 1, 1, ld, ld + 2, 'F', { paint: 1 }));
      if (st === 'rainboots') G.push(C.vb(i0, i1, hi, hi, -5, 5, 'F', { paint: 1 }));
      if (st === 'tabi') G.push(C.vb(x, x, 0, 1, 2, 4, 'fs', { paint: 1 }));
      break;
    }
    case 'idol': case 'platform': case 'skates': {
      const hi = st === 'idol' ? 6 : st === 'platform' ? 7 : 5;
      G.push(C.box([x, (hi + 0.4) / 2, 0], [lw + 0.4, (hi + 0.4) / 2, ld + 0.35], 'f', { round: 1 }));
      foot('f', 3.2, 1.2);
      G.push(C.vb(i0, i1, 0, st === 'platform' ? 2 : 1, -5, 6, 'fs', { paint: 1 }));
      G.push(C.vb(i0, i1, hi, hi, -5, 5, 'F', { paint: 1 }));
      if (st === 'skates') for (const z of [-1.5, 2]) G.push(C.sph([x, 0.4, z], 1.0, 'F'));
      break;
    }
    case 'heels': case 'loafers': case 'maryjane': {
      foot('f', 2.1, 1.0);
      sole();
      if (st === 'heels') G.push(C.vb(i0, i1, 0, 0, -3, -2, 'fs', { paint: 1 }), C.vb(i0, i1, 0, 0, 0, 5, 'f', { paint: 1 }));
      if (st === 'maryjane') G.push(C.vb(i0, i1, 2, 2, 0, 3, 'F', { paint: 1 }));
      if (st === 'loafers') G.push(C.vb(i0, i1, 1, 1, ld + 1, ld + 2, shade(L.shoes.color, 1.35), { paint: 1 }));
      break;
    }
    case 'clogs': foot('f', 2.4, 1.2); sole({ rows: 1 }); if (L.shoes.glow) G.push(C.vb(i0, i1, 0, 0, -5, 6, L.shoes.glow, { paint: 1, glow: 2 })); break;
    default: { // sneakers / hightops: chunky light sole, coloured upper, side flash, toe cap
      const hi = st === 'hightops' ? 4.4 : 2.6;
      if (st === 'hightops') G.push(C.box([x, hi / 2, 0], [lw + 0.4, hi / 2, ld + 0.35], 'f', { round: 1 }));
      foot('f', 2.7, 1.25);
      sole();
      G.push(C.vb(io, io, 1, 1, -1, 3, 'F', { paint: 1 }));
      G.push(C.vb(i0, i1, 1, 2, ld + 1, ld + 2, 'fs', { paint: 1 }));
      if (st === 'hightops') G.push(C.vb(i0, i1, 4, 4, -5, 5, 'F', { paint: 1 }));
      if (L.shoes.glow) G.push(C.vb(i0, i1, 0, 0, -5, 6, L.shoes.glow, { paint: 1, glow: 2 }));
    }
  }
}

// repeatable surface patterns (paint passes) for tops / bottoms / capes
function patternPaint(C, G, kind, [i0, i1], [j0, j1], [k0, k1], base, c2, c3) {
  const P = (col, o) => G.push(C.vb(i0, i1, j0, j1, k0, k1, col, Object.assign({ paint: 1 }, o)));
  switch (kind) {
    case 'leopard': P(c2, { spots: { col: c2, d: 0.3, s: 1.1, seed: 5 } }); P(c3 || '#3a2418', { spots: { col: c3 || '#3a2418', d: 0.12, s: 0.9, seed: 9 } }); break;
    case 'zebra': P(c2, { stripes: { axis: 'y', p: 3, w: 1, col: c2 } }); break;
    case 'plaid': P(c2, { stripes: { axis: 'y', p: 4, w: 1, col: c2 } }); P(c2, { stripes: { axis: 'x', p: 4, w: 1, col: c2 } }); break;
    case 'stripes': P(c2, { stripes: { axis: 'y', p: 2, w: 1, col: c2 } }); break;
    case 'vstripes': P(c2, { stripes: { axis: 'x', p: 3, w: 1, col: c2 } }); break;
    case 'stars': case 'sequin': case 'sashiko': case 'floral': case 'dots':
      P(c2, { spots: { col: c2, d: kind === 'sequin' ? 0.22 : 0.16, s: 0.7, seed: kind.length } }); break;
    default: break;
  }
}

// ============================================================ bottoms (pelvis paint + skirt volumes)
function buildBottom(C) {
  const { D, L } = C, Bd = C.parts.body, T = C.T, st = L.bottom.style, hip = D.hip, xs = T.xs;
  C.legWear = 'long';
  C.flags.shortsLen = Math.max(3, Math.round(D.leg * 0.32));
  T.ring(hip - 3, hip + 1, 'b');                                         // pelvis
  const skirtLike = (len, r0, r1, pleats = true) => {
    Bd.push(C.cap([0, hip + 1.6, 0], [0, hip - len + 0.4, 0], r0, r1, 'b', { round: 0 }));
    if (pleats && L.bottom.pleats !== false) Bd.push(C.vb(-xs - 3, xs + 3, hip - len + 1, hip, -9, 9, 'B', { paint: 1, stripes: { axis: 'x', p: 3, w: 1, col: 'B', o: 1 } }));
    Bd.push(C.vb(-xs - 4, xs + 4, hip - len, hip - len + 1, -9, 9, 'b2', { paint: 1 }));
  };
  switch (st) {
    case 'shorts': C.legWear = 'shorts'; break;
    case 'bike': C.legWear = 'bike'; break;
    case 'skirt': case 'skort': {
      C.legWear = L.bottom.tights ? 'tights' : st === 'skort' ? 'shorts' : 'bare';
      if (st === 'skort') C.flags.shortsLen = 2;
      skirtLike(Math.max(3, Math.round(D.leg * 0.36)), D.cwB + 0.4, D.cwB + 1.6);
      if (L.bottom.hem === 'zigzag') Bd.push(C.vb(-xs - 4, xs + 4, hip - Math.round(D.leg * 0.36), hip - Math.round(D.leg * 0.36), -9, 9, 'b2', { paint: 1, stripes: { axis: 'x', p: 2, w: 1, col: 'b' } }));
      break;
    }
    case 'long_skirt': C.legWear = 'hidden'; skirtLike(D.leg - 2, D.cwB + 0.3, D.cwB + 1.8); break;
    case 'hakama': C.legWear = 'hidden'; skirtLike(D.leg - 1.5, D.cwB + 0.6, D.cwB + 2.6); break;
    case 'overalls': C.flags.overalls = true; break;
    case 'cargo': C.flags.cargo = true; break;
    case 'track': L.bottom.stripe = L.bottom.stripe || L.bottom.color2 || '#f4f2ee'; break;
    default: break;
  }
  // waistband / belt
  if (!['skirt', 'skort', 'long_skirt', 'hakama', 'overalls', 'track', 'spandex', 'bike'].includes(st)) T.ring(hip + 1, hip + 1, L.bottom.belt || 'B');
  if (L.bottom.belt) T.front(0, 0, hip + 1, hip + 1, isHex(L.bottom.buckle) ? L.bottom.buckle : 'g');
}

// ============================================================ tops
// back emblems (glowing when the colour is bright) and chest graphics
const GRAPHICS = {
  heart: ['.p.p.', 'ppppp', '.ppp.', '..p..'],
  star: ['..y..', 'yyyyy', '.yyy.', '.y.y.'],
  bolt: ['..y', '.y.', 'yyy', '.y.', 'y..'],
  takoyaki: ['.oo.', 'obbo', 'oooo', '.oo.'],
  smile: ['.yyy.', 'ykyky', 'yyyyy', 'ykkky', '.yyy.'],
  stone: ['.c.', 'cwc', '.c.'],
  beetle: ['k.k', '.b.', 'bbb', '.b.'],
  skull: ['.www.', 'wkwkw', 'wwwww', '.w.w.'],
  bolt_skull: ['.www.', 'wkwkw', 'wwyww', '.wyw.'],
  octopus: ['.ooo.', 'ooooo', 'o.o.o'],
  sun: ['y.y.y', '.yyy.', 'yyyyy', '.yyy.', 'y.y.y'],
  lemon: ['.yy.', 'yyyy', '.yy.'],
  note: ['..kk', '..k.', '.kk.', 'kkk.'],
  anarchy_heart: ['.p.p.', 'ppppp', 'pkpkp', '.ppp.', '..p..'],
  bear: ['b.b', 'bbb', '.b.'],
  wave: ['p.t.o', '.p.t.', 'o.p.t'],
};
const GRAPHIC_CMAP = { p: '#ff5d7c', y: '#ffd33b', o: '#d78a3c', b: '#6a3a22', k: '#1e1830', c: '#38f0ff', w: '#f4f2ee', t: '#3ad6c8' };
function chestGraphic(C, g, y, cmap) {
  const rows = GRAPHICS[g] || GRAPHICS.star;
  C.decal('body', [0, y, C.D.cd + C.T.zc], [0, 0, 1], rows, Object.assign({}, GRAPHIC_CMAP, cmap), 1, { lift: 0.25 });
}
const EMBLEMS = {
  bolt: ['...gg', '..gg.', '.gggg', '..gg.', '.gg..', 'gg...'],
  stone: ['..g..', '.ggg.', 'gg.gg', '.ggg.', '..g..'],
  wing: ['g...g', 'gg.gg', '.ggg.', '..g..'],
  matsuri: ['ggggg', 'g...g', 'g.g.g', 'g...g', 'ggggg'],
  octopus: ['.ggg.', 'ggggg', 'g.g.g', 'g.g.g'],
  whistle: ['ggggg', 'g...g', 'ggggg'],
  league: ['.g.g.', 'ggggg', 'gg.gg', '.ggg.', '..g..'],
  star: ['..g..', 'ggggg', '.ggg.', '.g.g.'],
  crest: ['g.g.g', 'ggggg', 'g...g', '.ggg.'],
};
function backEmblem(C, e, y, col) {
  const rows = EMBLEMS[e] || EMBLEMS.bolt;
  const glow = isHex(col) && lum(col) > 0.55 && e !== 'matsuri' && e !== 'octopus' ? 2 : 0;
  C.decal('body', [0, y, -C.D.cd + C.T.zc], [0, 0, -1], rows, { g: glow ? { c: col, glow } : col }, 1, { lift: 0.25 });
}
// Team Metallica back patch: spiked guitar-pick shield, crossed lightning, jagged lettering band (original mark)
function backPatch(C, y, kind) {
  const team = ['.kkkkkkk.', 'kwwwwwwwk', 'kwykwkywk', 'kwwykywwk', 'kwkyyykwk', '.kwwywwk.', '..kwwwk..', '...kwk...', '....k....'];
  const rand = ['kkkkk', 'krrrk', 'kwkwk', 'krrrk', 'kkkkk'];
  C.decal('body', [0, y, -C.D.cd + C.T.zc], [0, 0, -1], kind === 'team' ? team : rand,
    { k: '#1e1830', w: '#f2efe6', y: { c: '#ffd33b', glow: kind === 'team' ? 1 : 0 }, r: '#e0303a' }, 1, { lift: 0.25 });
}
// small sew-on patches for vests (front)
function frontPatch(C, x, y, rows, cmap) { C.decal('body', [x, y, C.D.cd + C.T.zc], [0, 0, 1], rows, cmap, 1, { lift: 0.25 }); }

function buildTop(C) {
  const { D, L } = C, Bd = C.parts.body, T = C.T, st = L.top.style, hip = D.hip, sh = D.sh, xs = T.xs;
  const add = (...s) => Bd.push(...s);
  const { front, back, ring, sides } = T;
  const glow = L.top.glow;
  const neckV = (col = 's') => { front(-1, 1, sh - 1, sh, col); front(0, 0, sh - 2, sh - 2, col); };
  const hem = (j = hip + 2, col = 'T') => ring(j, j, col);
  C.sleeve = L.top.sleeves || 'long';
  // tops cover the torso from the waistband up (the bottom painted the pelvis)
  ring(hip + 2, sh + 1, 't');
  switch (st) {
    case 'hoodie': {
      ring(hip + 1, hip + 2, 'T');                                       // ribbed hem
      front(-2, 2, hip + 3, hip + 4, 'T');                                // kangaroo pocket
      front(-1, 1, sh, sh, 'T');                                          // neck opening
      front(-1, -1, sh - 4, sh - 2, L.top.strings || 'w'); front(1, 1, sh - 4, sh - 2, L.top.strings || 'w');
      add(C.ell([0, sh - 1.2, -D.cd - 1.2 + T.zc], [D.cw - 1.2, 2.2, 1.8], 't', { belly: 'T', bellyT: 0.3 }));   // hood bunched at the back
      add(C.vb(-2, 2, sh - 1, sh, Math.round(-D.cd - 2 + T.zc), Math.round(-D.cd - 1 + T.zc), 'T', { paint: 1 }));
      if (L.top.ears === 'panda') add(C.sph([2.6, sh + 0.6, -D.cd - 1.6 + T.zc], 1.3, '#26222e', { m: 1 }));
      if (L.top.ears === 'cat') add(C.cap([2.4, sh, -D.cd - 1.4 + T.zc], [2.8, sh + 2, -D.cd - 1.8 + T.zc], 1.2, 0.4, 't', { m: 1 }));
      if (L.top.graphic) chestGraphic(C, L.top.graphic, sh - 5);
      C.flags.cuff = 'T';
      break;
    }
    case 'jacket': { // 2050 trainer jacket: colour-blocked yoke, side panels, V inner, neon zip, glowing back emblem
      ring(sh - 1, sh + 1, 't2');
      sides(hip + 2, sh - 2, 't2');
      hem(hip + 2, 't2');
      front(-1, 1, sh - 1, sh + 1, 't3'); front(0, 0, sh - 2, sh - 2, 't3');
      front(0, 0, hip + 2, sh - 3, glow || 'T', { glow: glow ? 1 : 0 });
      backEmblem(C, L.top.emblem || 'bolt', sh - 5, glow || L.top.color2 || '#fff');
      C.flags.cuff = 't2'; C.flags.cuffGlow = glow;
      break;
    }
    case 'techwear': { // cropped shell jacket: high collar, 1-px neon seam, inner layer under the cropped hem
      C.flags.highCollar = 't';
      front(0, 0, hip + 4, sh, 'T');
      for (let j = hip + 4; j <= sh - 1; j++) front(Math.round((j - hip - 4) * 0.55) - 3, Math.round((j - hip - 4) * 0.55) - 3, j, j, glow || 'tl', { glow: glow ? 1 : 0 });
      ring(hip + 1, hip + 3, 't3');
      ring(hip + 4, hip + 4, 'T');
      backEmblem(C, L.top.emblem || 'stone', sh - 5, glow || '#fff');
      C.flags.cuff = 'T'; C.flags.cuffGlow = glow;
      break;
    }
    case 'tracksuit': {
      front(0, 0, hip + 2, sh, 't2');
      ring(sh, sh + 1, 't2');
      front(-1, 1, sh - 1, sh + 1, 't');
      sides(hip + 2, sh - 1, 't2');
      hem(hip + 2, 't2');
      C.flags.armStripe = L.top.color2 || '#f4f2ee';
      if (L.top.emblem) backEmblem(C, L.top.emblem, sh - 5, L.top.color2 || '#f4f2ee');
      if (L.top.inner) { front(-1, 1, sh - 3, sh + 1, L.top.inner); front(0, 0, hip + 2, sh - 4, 't2'); }
      break;
    }
    case 'leather': { // studded biker jacket over a tee
      front(-1, 1, sh - 3, sh + 1, 't3'); front(0, 0, hip + 2, sh - 4, 't3');
      front(-3, -2, sh - 3, sh + 1, 'tl'); front(2, 3, sh - 3, sh + 1, 'tl');
      for (const x of [-3, 3]) front(x, x, sh, sh, 'si');
      for (let j = hip + 2; j <= sh - 3; j++) front(-2, -2, j, j, 'T');
      hem(hip + 2, 'T');
      if (L.top.patch !== false) backPatch(C, sh - 4, L.top.patch === 'team' ? 'team' : 'rand');
      if (L.top.pins) for (const [x, y] of [[-3, sh - 5], [3, sh - 7], [4, hip + 4]]) front(x, x, y, y, 'si');
      C.flags.studs = true; C.flags.cuff = 'T';
      break;
    }
    case 'vest': case 'battle_vest': { // sleeveless denim vest (kutte) over a tee / hoodie
      C.sleeve = L.top.sleeves || (L.top.inner ? 'long' : 'short');
      C.flags.sleeveCol = 't3';
      ring(hip + 2, sh + 1, 't3');                                        // the shirt underneath
      if (L.top.graphic) chestGraphic(C, L.top.graphic, sh - 5, { w: '#f2efe6' });
      // vest panels: front halves, back, shoulders
      front(-xs - 2, -2, hip + 2, sh + 1, 't'); front(2, xs + 2, hip + 2, sh + 1, 't');
      back(-xs - 2, xs + 2, hip + 2, sh + 1, 't');
      sides(hip + 2, sh + 1, 't');
      front(-2, -2, hip + 2, sh + 1, 'tl'); front(2, 2, hip + 2, sh + 1, 'tl');
      hem(hip + 2, 'tl');
      if (st === 'battle_vest') {
        for (let j = hip + 3; j <= sh - 1; j += 2) { front(-2, -2, j, j, 'si'); front(2, 2, j, j, 'si'); }
        frontPatch(C, -3.6, sh - 4, ['rrr', 'ryr'], { r: '#e0303a', y: '#ffd33b' });
        frontPatch(C, 3.6, hip + 5, ['kk', 'kg'], { k: '#2a2632', g: '#91db69' });
        frontPatch(C, 3.6, sh - 3, ['w.', 'ww'], { w: '#f2efe6' });
      } else frontPatch(C, -3.6, sh - 4, ['rrr', 'ryr'], { r: '#e0303a', y: '#ffd33b' });
      backPatch(C, sh - 4, L.top.patch === 'team' ? 'team' : 'rand');
      if (L.top.catPatch) frontPatch(C, 3.4, hip + 5, ['p.p', 'ppp'], { p: '#ff9ab0' });
      break;
    }
    case 'tank': {
      C.sleeve = 'none';
      front(-1, 1, sh - 1, sh + 1, 's'); front(0, 0, sh - 2, sh - 2, 's'); back(-1, 1, sh, sh + 1, 's');
      sides(sh - 1, sh + 1, 's'); add(C.vb(xs - 1, xs - 1, sh, sh + 1, T.bk, T.fk, 's', { paint: 1, m: 1 }));
      if (L.top.graphic) chestGraphic(C, L.top.graphic, sh - 5);
      break;
    }
    case 'labcoat': case 'coat': case 'gown': {
      const inner = L.top.inner || 't3';
      const tl = L.top.tails ?? Math.round(D.leg * (st === 'gown' ? 0.75 : st === 'labcoat' ? 0.55 : 0.7));
      front(-2, 2, hip + 1, sh + 1, inner); neckV(L.top.innerNeck || inner);
      if (L.top.graphic) chestGraphic(C, L.top.graphic, sh - 5, {});
      front(-3, -3, hip + 1, sh, 'T'); front(3, 3, hip + 1, sh, 'T');                         // lapel edges
      front(-3, -2, sh - 1, sh + 1, L.top.collar || 't2'); front(2, 3, sh - 1, sh + 1, L.top.collar || 't2');
      if (st === 'labcoat') front(3, 3, sh - 4, sh - 3, '#3a8bff');
      // tails: a back-half shell that flares from the waist to the knees (split at the back for long coats)
      add(C.box([0, (hip + 1 - tl) / 2 + 0.6, -0.9], [D.cwB + 1.0, (tl + 1) / 2, D.cd - 0.3], 't', { round: 1 }));
      add(C.box([0, (hip + 1 - tl) / 2 + 0.2, D.cd + 1], [1.4 + (st === 'gown' ? 1 : 0), (tl + 2) / 2, 2.6], 't', { sub: 1 }));
      add(C.vb(-xs - 3, xs + 3, hip + 1 - tl, hip + 1 - tl, -9, 9, 'T', { paint: 1 }));
      if (st === 'coat') add(C.vb(0, 0, hip + 1 - tl, hip - 2, -9, -1, 'T', { paint: 1 }));
      if (L.top.belted) ring(hip + 2, hip + 2, 'T');
      if (L.top.pattern) patternPaint(C, Bd, L.top.pattern, [-xs - 3, xs + 3], [hip - tl, sh + 1], [-9, 9], 't', L.top.color3 || 'tl');
      if (glow) { for (let j = hip + 1 - tl; j <= sh - 1; j += 1) { front(-3, -3, j, j, glow, { glow: 1 }); } }
      C.flags.cuff = L.top.cuff || 'T';
      if (st === 'gown') { C.sleeve = 'wide'; C.flags.sleeveCol = 't'; }
      break;
    }
    case 'apron': case 'chef': case 'smock': {
      if (st === 'chef') {
        front(-1, 1, sh, sh + 1, 'T'); ring(sh, sh + 1, 'w');
        for (let j = hip + 4; j <= sh - 2; j += 2) { front(-2, -2, j, j, 'T'); front(2, 2, j, j, 'T'); }
        front(-xs, -3, hip + 2, sh - 1, 'tl');
        C.flags.cuff = 'T';
      } else if (st === 'smock') {
        neckV('t2'); C.sleeve = 'puff';
        if (L.top.pattern) patternPaint(C, Bd, L.top.pattern, [-xs - 3, xs + 3], [hip - 2, sh + 1], [-9, 9], 't', L.top.color3 || '#ff9ab0');
      } else { ring(hip + 2, sh + 1, 't2'); neckV(); C.sleeve = L.top.sleeves || 'short'; C.flags.sleeveCol = 't2'; }
      if (st !== 'chef') C.flags.apron = { color: 't', len: Math.round(D.leg * 0.45) };
      if (st === 'smock') C.flags.apron = null;
      break;
    }
    case 'suit': case 'blazer': case 'sequin': {
      front(-1, 1, sh - 4, sh + 1, 't2'); front(0, 0, sh - 5, sh - 5, 't2');
      if (!L.top.noTie) front(0, 0, sh - 5, sh - 1, 't3');
      front(-2, -2, sh - 4, sh + 1, 'T'); front(2, 2, sh - 4, sh + 1, 'T');
      front(0, 0, hip + 3, hip + 3, 'T');
      if (st === 'blazer') { front(-xs, -xs + 1, sh - 4, sh - 4, 'w'); front(3, 4, hip + 3, hip + 3, 'T'); }
      if (st === 'sequin') { patternPaint(C, Bd, 'sequin', [-xs - 3, xs + 3], [hip + 2, sh + 1], [-9, 9], 't', 'tl'); front(-1, 1, sh - 4, sh + 1, 't2'); }
      if (L.top.crop) ring(hip + 1, hip + 3, L.top.inner || 't2');
      C.flags.cuff = st === 'sequin' ? 'tl' : 't2';
      break;
    }
    case 'happi': case 'noragi': case 'kimono': case 'gi': {
      // crossover collar (left over right): a lining band down to the obi
      front(-1, 1, sh - 1, sh + 1, L.top.inner || 's'); front(0, 0, sh - 2, sh - 2, L.top.inner || 's');
      for (let n = 0; n <= 4; n++) { front(n - 2, n - 1, sh - n, sh - n, 't2'); }
      front(-2, -2, sh - 3, sh, 't2');
      back(-2, 2, sh, sh + 1, 't2');
      if (st === 'kimono') {
        ring(hip + 2, hip + 4, 't3'); ring(hip + 3, hip + 3, L.top.obiCord || '#ffd33b');
        add(C.box([0, hip + 3.5, -D.cd - 1.0 + T.zc], [2.4, 1.6, 0.9], 't3', { round: 0.7 }));
        C.sleeve = 'wide';
        if (!['hakama', 'long_skirt'].includes(L.bottom.style)) {
          C.legWear = 'hidden';
          add(C.cap([0, hip + 2, 0], [0, 2.4, 0], D.cwB + 0.6, D.cwB + 1.0, 't'));
          add(C.vb(-xs - 3, xs + 3, 2, 2, -9, 9, 't2', { paint: 1 }));
        }
      } else if (st === 'gi') { ring(hip + 2, hip + 2, 't3'); front(-1, -1, hip + 1, hip + 1, 't3'); C.sleeve = 'gi'; }
      else if (st === 'happi') {
        ring(hip + 2, hip + 3, 't3'); C.sleeve = 'wide';
        backEmblem(C, L.top.emblem || 'matsuri', sh - 5, L.top.color2 || '#f4f2ee');
        if (L.top.tasuki) { for (let n = 0; n < 6; n++) { front(-3 + n, -3 + n, sh - 1 - n, sh - 1 - n, L.top.tasuki); back(-3 + n, -3 + n, sh - 1 - n, sh - 1 - n, L.top.tasuki); } }
      } else { // noragi: indigo work coat, sashiko dots
        ring(hip + 2, hip + 2, 't3');
        patternPaint(C, Bd, 'sashiko', [-xs - 3, xs + 3], [hip + 3, sh - 2], [-9, 9], 't', L.top.color3 || '#c8d0e8');
        C.sleeve = L.top.sleeves || 'long';
      }
      break;
    }
    case 'uniform': { // staff / receptionist uniform: collar, placket, side panels, piping, name tag
      if (L.top.collar === 'high') C.flags.highCollar = 't';
      else { front(-2, 2, sh, sh + 1, 't2'); back(-2, 2, sh, sh + 1, 't2'); front(0, 0, sh, sh, 's'); }
      front(0, 0, hip + 2, sh - 1, L.top.piping || 't2');
      if (L.top.panels) { sides(hip + 2, sh, L.top.panels); }
      if (L.top.piping) { ring(hip + 2, hip + 2, L.top.piping); }
      else hem(hip + 2, 'T');
      if (!L.acc.badge && L.top.tag !== false) C.decal('body', [2.6, sh - 3, D.cd + T.zc], [0, 0, 1], ['www', 'wkw'], { w: '#f4f2ee', k: '#5a6170' }, 1, { lift: 0.25 });
      C.sleeve = L.top.sleeves || 'short'; C.flags.cuff = L.top.piping || 't2';
      break;
    }
    case 'band_jacket': { // satin bandsman tunic: gold frogging, high collar, buttons, epaulettes, cuffs
      const rope = L.top.rope || 'g';
      C.flags.highCollar = L.top.collarCol || 't2';
      for (const j of [sh - 3, sh - 5, sh - 7]) { if (j <= hip + 2) continue; front(-xs + 1, xs - 1, j, j, rope); }
      front(0, 0, hip + 2, sh - 1, 'g');
      hem(hip + 2, L.top.hemCol || 't2');
      if (L.top.crop) { ring(hip + 1, hip + 3, L.top.inner || 't3'); }
      if (L.top.buckles) for (const j of [sh - 3, sh - 5, sh - 7]) { front(-2, -2, j, j, 'g'); front(2, 2, j, j, 'g'); }
      C.flags.epaulettes = L.top.epaulettes !== false ? 'g' : null;
      C.flags.cuff = L.top.cuffCol || 'g';
      if (L.top.chevrons) C.flags.chevrons = L.top.chevrons;
      if (L.top.sash) for (let n = 0; n < 7; n++) front(-3 + n, -3 + n, sh - 1 - n, sh - 1 - n, L.top.sash);
      break;
    }
    case 'cape_top': { // pleated winged top (pleats as vertical light/shadow lines) — wings live on the arms
      front(-xs, xs, hip + 2, sh + 1, 't', { stripes: { axis: 'x', p: 2, w: 1, col: 'tl' } });
      neckV();
      C.flags.wings = { col: 't', lining: L.top.color2 || '#2a2a5a', stars: L.top.color3 || '#ffe27a' };
      C.sleeve = 'long';
      break;
    }
    case 'jumpsuit': case 'bodysuit': {
      C.flags.jumpsuit = true;
      front(0, 0, hip + 2, sh - 1, L.top.zip || 'T');
      neckV(L.top.neck || 's');
      if (L.top.pattern) patternPaint(C, Bd, L.top.pattern, [-xs - 3, xs + 3], [hip - 3, sh + 1], [-9, 9], 't', L.top.color2 || 'tl', L.top.color3);
      if (st === 'bodysuit') C.flags.oneLeg = L.top.leg || '#c8d0dc';
      if (L.top.belt) ring(hip + 1, hip + 1, L.top.belt);
      break;
    }
    case 'sailor': {
      ring(sh - 1, sh + 1, 't2'); back(-xs, xs, sh - 4, sh + 1, 't2'); back(-xs + 1, xs - 1, sh - 4, sh - 4, 'w');
      front(-1, 1, sh, sh + 1, 's'); front(0, 0, sh - 1, sh - 1, 's');
      front(-1, 1, sh - 2, sh - 2, 't3'); front(0, 0, sh - 3, sh - 3, 't3');
      C.flags.cuff = 't2';
      break;
    }
    case 'gakuran': {
      C.flags.highCollar = 'T';
      for (let j = hip + 3; j <= sh - 1; j += 2) front(0, 0, j, j, 'g');
      hem(hip + 2, 'T');
      break;
    }
    case 'field': { // khaki field shirt: collar, flap pockets, placket, rolled sleeves
      front(-2, 2, sh, sh + 1, 'T'); back(-2, 2, sh, sh + 1, 'T'); front(-1, 1, sh, sh + 1, 's'); front(0, 0, sh - 1, sh - 1, 's');
      front(-3, -2, sh - 4, sh - 3, 'T'); front(2, 3, sh - 4, sh - 3, 'T');
      front(-3, -2, sh - 3, sh - 3, 't2'); front(2, 3, sh - 3, sh - 3, 't2');
      front(0, 0, hip + 2, sh - 2, 'T');
      hem(hip + 2, 'T');
      if (L.top.patch) C.decal('armR', [-D.armX - D.arm / 2, sh - 4, 0], [-1, 0, 0], ['.gg.', 'gyyg', '.gg.'], { g: L.top.patch, y: '#ffd33b' }, 1, { lift: 0.25 });
      C.sleeve = L.top.sleeves || 'rolled';
      break;
    }
    case 'cardigan': case 'flannel': case 'turtleneck': case 'sweater': case 'puffer': case 'jersey': {
      if (st === 'cardigan' || st === 'flannel') {
        front(-1, 1, hip + 2, sh + 1, L.top.inner || 't2'); front(0, 0, sh, sh + 1, 's');
        if (L.top.innerPattern) patternPaint(C, Bd, L.top.innerPattern, [-1, 1], [hip + 2, sh], [T.fk - 1, T.fk + 3], 't2', L.top.color3 || '#22202a');
        front(-2, -2, hip + 2, sh + 1, 'T'); front(2, 2, hip + 2, sh + 1, 'T');
        if (st === 'cardigan') for (let j = hip + 3; j <= sh - 3; j += 2) front(-2, -2, j, j, L.top.buttons || '#efe2c2');
        if (st === 'flannel') patternPaint(C, Bd, 'plaid', [-xs - 3, xs + 3], [hip + 2, sh + 1], [-9, 9], 't', L.top.color3 || 'T');
      } else if (st === 'turtleneck') C.flags.highCollar = 't';
      else if (st === 'puffer') { ring(hip + 2, sh, 'T', { stripes: { axis: 'y', p: 3, w: 1, col: 'T' } }); C.flags.highCollar = 't'; }
      else if (st === 'jersey') { neckV(); front(-1, 1, sh, sh + 1, 't2'); hem(hip + 2, 't2'); C.sleeve = 'short'; C.flags.cuff = 't2'; C.flags.sleeveStripe = 't2';
        C.decal('body', [0, sh - 5, -D.cd + T.zc], [0, 0, -1], NUMERALS[L.top.number ?? 7] || NUMERALS[7], { n: L.top.color2 || '#f4f2ee' }, 1, { lift: 0.25 }); }
      else { front(-2, 2, sh, sh + 1, 'T'); back(-2, 2, sh, sh + 1, 'T'); neckV(); if (L.top.stripes) ring(hip + 2, sh - 1, 't', { stripes: { axis: 'y', p: 2, w: 1, col: 't2', o: 0.5 } }); }
      if (st !== 'jersey' && st !== 'flannel') hem(hip + 2, 'T');
      if (L.top.graphic && st !== 'cardigan') chestGraphic(C, L.top.graphic, sh - 5);
      break;
    }
    case 'hawaiian': {
      patternPaint(C, Bd, L.top.pattern || 'floral', [-xs - 3, xs + 3], [hip + 2, sh + 1], [-9, 9], 't', 't2', L.top.color3);
      neckV(); front(-2, -2, sh - 2, sh + 1, 'T'); front(2, 2, sh - 2, sh + 1, 'T');
      C.sleeve = L.top.sleeves || 'short';
      break;
    }
    case 'hivis': {
      ring(hip + 2, sh + 1, 't2'); ring(hip + 2, sh - 1, 't');
      ring(hip + 4, hip + 4, '#eef4f6', { glow: 1 });
      neckV('t2');
      C.sleeve = 'short'; C.flags.sleeveCol = 't2';
      break;
    }
    case 'dress': { // idol / shop dress: bodice, frill collar, chest bow; the skirt comes from the bottom
      ring(sh, sh + 1, L.top.collar || 'w'); front(-1, 1, sh, sh + 1, 's');
      add(C.box([0, sh - 2.2, D.cd + 0.7 + T.zc], [2.0, 0.9, 0.6], 't2', { round: 0.4 }));
      add(C.vb(0, 0, sh - 4, sh - 3, Math.round(D.cd + 1 + T.zc), Math.round(D.cd + 1 + T.zc), 't3'));
      ring(hip + 2, hip + 2, 't2');
      if (L.top.sailor) { back(-xs, xs, sh - 4, sh + 1, L.top.sailor); front(-xs, -2, sh - 1, sh + 1, L.top.sailor); front(2, xs, sh - 1, sh + 1, L.top.sailor); }
      C.sleeve = L.top.sleeves || 'puff';
      break;
    }
    case 'robe': { // long ceremonial robe to the ankles (kimono cut, no obi bow)
      C.legWear = 'hidden';
      add(C.cap([0, hip + 2, 0], [0, 2.2, 0], D.cwB + 0.8, D.cwB + 2.0, 't'));
      add(C.vb(-xs - 4, xs + 4, 2, 3, -9, 9, 't2', { paint: 1 }));
      front(0, 0, 2, sh + 1, 't2'); neckV();
      C.sleeve = 'wide';
      break;
    }
    case 'tee': default: {
      neckV(); back(-1, 1, sh, sh + 1, 'T');
      if (L.top.graphic) chestGraphic(C, L.top.graphic, sh - 5);
      C.sleeve = L.top.sleeves || 'short';
      if (L.top.stripes) ring(hip + 2, sh - 1, 't', { stripes: { axis: 'y', p: 2, w: 1, col: 't2', o: 0.5 } });
      break;
    }
  }
  if (L.top.pattern && !['coat', 'labcoat', 'gown', 'hawaiian', 'jumpsuit', 'bodysuit', 'smock'].includes(st))
    patternPaint(C, Bd, L.top.pattern, [-xs - 3, xs + 3], [hip + 2, sh + 1], [-9, 9], 't', L.top.color3 || 't2', L.top.color4);
  if (C.flags.highCollar) { // a 2-px standing collar ring around the neck
    add(C.box([0, sh + 0.8, -0.3 + T.zc], [3.3, 1.3, 3.0], C.flags.highCollar, { round: 1.0 }));
    add(C.box([0, sh + 0.8, 2.4 + T.zc], [1.1, 2, 1.6], C.flags.highCollar, { sub: 1 }));
  }
  if (C.flags.overalls) {
    front(-3, 3, hip + 2, sh - 4, 'b'); front(-3, -3, sh - 3, sh + 1, 'b'); front(3, 3, sh - 3, sh + 1, 'b');
    back(-3, -3, hip + 2, sh + 1, 'b'); back(3, 3, hip + 2, sh + 1, 'b');
    front(-3, -3, sh - 4, sh - 4, 'g'); front(3, 3, sh - 4, sh - 4, 'g');
    front(-1, 1, hip + 3, hip + 4, 'B');
  }
  if (C.flags.jumpsuit) { L.bottom.color = L.top.color; C.pal.b = C.pal.t; C.pal.B = C.pal.T; C.pal.bl = C.pal.tl; T.ring(hip - 3, hip + 1, 't'); }
}
const NUMERALS = {
  7: ['nnn', '..n', '.n.', '.n.'], 1: ['.n', 'nn', '.n', '.n'], 4: ['n.n', 'nnn', '..n', '..n'], 9: ['nnn', 'nnn', '..n', 'nn.'],
  0: ['nnn', 'n.n', 'n.n', 'nnn'], 2: ['nn.', '..n', '.n.', 'nnn'], 3: ['nnn', '.nn', '..n', 'nnn'], 5: ['nnn', 'n..', '.nn', 'nn.'],
};

// ============================================================ arms & hands
function buildArms(C) {
  const { D, L } = C, sl = C.sleeve, sc = C.flags.sleeveCol || 't';
  const gl = L.acc.gloves, handCol = gl ? (gl.color || (gl.style === 'white' ? '#f4f2ee' : '#2b2b33')) : 's';
  const top = D.sh - 1.6, wr = D.wrist, r0 = D.arm / 2 + 0.15, r1 = D.arm / 2 - 0.05;
  for (const s of [1, -1]) {
    const A = C.arm(s), x = s * D.armX;
    const iIn = s * Math.round(D.armX - D.arm / 2 + 0.6), iOut = s * Math.round(D.armX + D.arm / 2 - 0.4);
    const K = [-4, 4];
    const rows = (j0, j1, col, o) => A.push(C.vb(iIn, iOut + s, j0, j1, K[0], K[1], col, Object.assign({ paint: 1 }, o)));
    A.push(C.cap([x, top, 0], [x + s * 0.2, wr + 0.6, 0.1], r0, r1, 's'));
    const j1 = Math.round(top + 1), elbow = Math.round((top + wr) / 2), jw = Math.round(wr + 1);
    if (['long', 'wide', 'gi', 'bell', 'pushed'].includes(sl)) rows(jw, j1, sc);
    if (sl === 'pushed') { rows(jw, elbow - 1, 's'); rows(elbow, elbow, C.flags.cuff || 'T'); }
    if (sl === 'long') rows(jw, jw, C.flags.cuffGlow || C.flags.cuff || 'T', { glow: C.flags.cuffGlow ? 1 : 0 });
    if (sl === 'short' || sl === 'puff') { rows(j1 - 3, j1, sc); if (C.flags.cuff) rows(j1 - 3, j1 - 3, C.flags.cuff); }
    if (sl === 'puff') A.push(C.ell([x + s * 0.3, top - 0.8, 0], [r0 + 0.9, 2.0, r0 + 0.8], sc), C.vb(iIn, iOut + s, j1 - 3, j1 - 3, -4, 4, 'w', { paint: 1 }));
    if (sl === 'rolled') { rows(elbow - 1, j1, sc); rows(elbow - 1, elbow, 'tl'); }
    if (sl === 'gi') rows(jw, jw + 2, 's');
    if (sl === 'wide' || sl === 'bell') { // hanging kimono / happi / gown sleeve
      A.push(C.cap([x + s * 0.4, elbow, 0], [x + s * 0.6, wr + 0.6, 0], r0 + 0.4, r0 + 1.3, sc));
      A.push(C.vb(iIn - s, iOut + 2 * s, jw, jw, -5, 5, sl === 'bell' ? 'T' : 't2', { paint: 1 }));
    }
    if (C.flags.chevrons && sl !== 'none') for (const j of [elbow, elbow - 2]) A.push(C.vb(iIn, iOut + s, j, j, 0, 4, C.flags.chevrons, { paint: 1 }));
    if (C.flags.armStripe && sl === 'long') A.push(C.vb(iOut, iOut + s, jw + 1, j1, -4, 4, C.flags.armStripe, { paint: 1 }));
    if (C.flags.sleeveStripe) A.push(C.vb(iIn, iOut + s, j1 - 2, j1 - 2, -4, 4, C.flags.sleeveStripe, { paint: 1 }));
    // inner column a step darker (separates the arm from the torso in front and the far arm in profile)
    const bare = sl === 'none' || ((sl === 'short' || sl === 'puff') && true);
    A.push(C.vb(iIn, iIn, jw, j1 - (bare ? 4 : 0), K[0], K[1], ['long', 'wide', 'gi', 'bell'].includes(sl) ? (sc === 't' ? 'T' : sc === 't2' ? 'T2' : dark(C.pal[sc] || sc, 0.25)) : 'S', { paint: 1 }));
    if (C.flags.studs) for (const k of [-1, 1]) A.push(C.vb(iOut, iOut, j1 - 1, j1 - 1, k, k, 'si'));
    if (L.face.tattoo && (sl === 'none' || sl === 'short')) A.push(C.vb(iIn, iOut + s, elbow - 1, j1 - 4, K[0], K[1], L.face.tattoo, { paint: 1, stripes: { axis: 'y', p: 2, w: 1, col: L.face.tattoo } }));
    // hand: a round mitten (fingers only as 1-px notches in emotes)
    A.push(C.ell([x + s * 0.2, wr - D.hand / 2 + 0.6, 0.3], [D.hand / 2, D.hand / 2 + 0.15, D.hand / 2], handCol));
    if (gl && gl.style === 'fingerless') A.push(C.vb(iIn, iOut + s, Math.round(wr - D.hand + 0.6), Math.round(wr - D.hand + 1), -3, 3, 's', { paint: 1 }));
    if (L.acc.rings) A.push(C.vb(iIn, iOut + s, Math.round(wr - D.hand / 2), Math.round(wr - D.hand / 2), 1, 3, 'g', { paint: 1 }));
    // shoulder pieces
    if (C.flags.epaulettes) { A.push(C.box([x + s * 0.4, top + 0.6, 0], [r0 + 0.7, 0.8, r0 + 0.5], C.flags.epaulettes, { round: 0.4 })); A.push(C.vb(iOut + s, iOut + s, Math.round(top - 1), Math.round(top), -2, 2, C.flags.epaulettes, { paint: 1 })); }
    const shd = L.acc.shoulder;
    if (shd) {
      if (shd.style === 'spikes') for (const z of [-1, 1]) A.push(C.cap([x + s * 0.8, top + 0.6, z], [x + s * 2.6, top + 2.2, z], 0.9, 0.5, '#d8dee8'));
      else if (shd.style === 'chrome') A.push(C.ell([x + s * 0.6, top + 0.3, 0], [r0 + 1.1, 1.6, r0 + 1.0], shd.color || '#dfe6f0'));
      else A.push(C.box([x + s * 0.4, top + 0.6, 0], [r0 + 0.7, 0.8, r0 + 0.5], shd.color || 'g', { round: 0.4 }));
    }
    // Brian-style pleated wings hang from the arm (spread when the arms rise)
    if (C.flags.wings) {
      const wg = C.flags.wings;
      A.push(C.poly([x + s * (r0 + 0.6), 0, -0.6], [[0, top + 0.5], [s * 1.6, top - 1], [s * 3.2, wr - 1], [s * 0.4, wr + 0.5]].map(([u, v]) => [u, v]), 0.7, wg.col, { plane: 'xy' }));
      A.push(C.vb(Math.round(x + s * (r0 + 0.6)), Math.round(x + s * (r0 + 3.6)), Math.round(wr - 1), Math.round(top), -2, -1, wg.lining, { paint: 1 }));
      A.push(C.vb(Math.round(x + s * (r0 + 0.6)), Math.round(x + s * (r0 + 3.6)), Math.round(wr - 1), Math.round(top), -2, -1, wg.stars, { paint: 1, spots: { col: wg.stars, d: 0.18, s: 0.6, seed: 4 } }));
      A.push(C.vb(Math.round(x + s * (r0 + 0.6)), Math.round(x + s * (r0 + 3.6)), Math.round(wr - 1), Math.round(top), 0, 1, 'tl', { paint: 1, stripes: { axis: 'y', p: 2, w: 1, col: 'tl' } }));
    }
  }
}

// ============================================================ head & hair
function headGeo(C) {
  const D = C.D;
  return { yb: D.yb, yt: D.yt, top: D.top, chin: D.chin, cy: D.cy, hw: D.hw, hd: D.hd, z0: D.hz, FZ: D.FZ,
    browY: D.browY, eyeT: D.eyeT, eyeB: D.eyeB, mouthY: D.mouthY, lo: D.browY - 0.6, kf: D.FZ + 0.55 };
}
// rounded helmet of hair around the skull (added BEFORE the skull so the skull keeps its colour inside)
function shell(C, G, o = {}) {
  const ext = o.ext ?? 1.3, lift = o.lift ?? 1.4, bot = o.bot ?? G.eyeB - 1.5, back = o.back ?? 0, wide = o.wide ?? 0;
  const top = G.yt + lift, X = G.hw + ext + wide, zf = G.FZ + ext * 0.4, zb = G.z0 - G.hd - ext - back;
  const H2 = (top - bot) / 2, Z2 = (zf - zb) / 2;
  C.hairTop = Math.max(C.hairTop, top);
  return C.box([0, (bot + top) / 2, (zf + zb) / 2], [X, H2, Z2], 'h', { round: Math.min(o.round ?? 4.8, X, H2, Z2), belly: 'H', bellyT: o.bellyT ?? 0.55, noise: o.noise, noiseScale: o.noiseScale });
}
// back-of-head hair down to the nape
const nape = (C, G, bot = G.yb + 2.5, o = {}) => C.box([0, (bot + G.cy + 2) / 2, G.z0 - G.hd + 2.2 - (o.back || 0) / 2], [G.hw + (o.ext ?? 1.0) + (o.wide || 0), (G.cy + 2 - bot) / 2, 3.4 + (o.back || 0) / 2], 'h', { round: 2.2, belly: 'H', bellyT: 0.5 });
// carve the hair in front of the face (|x| < w) up to `top`
const faceWindow = (C, G, top = G.yt - 0.8, w = G.hw - 0.4) => C.box([0, (G.yb - 8 + top) / 2, G.FZ + 4.1], [w, (top - G.yb + 8) / 2, 5.0], 'h', { sub: 1 });
// open the shell at the ears (short styles)
const earCut = (C, G) => C.box([G.hw + 1.4, G.eyeB - 1.2, G.z0 + 0.4], [1.6, 1.9, 1.7], 'h', { sub: 1, m: 1 });
// keep the profile eye visible: no side hair in front of it at eye level
const profileCut = (C, G) => C.box([G.hw + 1.8, (G.eyeB - 2 + G.browY) / 2, G.FZ + 0.5], [2.6, (G.browY - G.eyeB + 2) / 2, 4.0], 'h', { sub: 1, m: 1 });
// fringe: one sheet in front of the forehead; edge = jagged bottom outline from x=+hw to x=−hw
function bangs(C, G, edge, o = {}) {
  const top = G.yt + (o.top ?? 1.2), w = G.hw + (o.w ?? 0.9);
  const pts = [[-w, top], [w, top], ...edge];
  return C.poly([0, 0, G.kf + (o.dz || 0)], pts, 0.8 + (o.thick || 0), 'h', { plane: 'xy', belly: 'H', bellyT: 0.45 });
}
const spike = (C, a, b, r0, r1 = 0.4, o = {}) => C.cap(a, b, r0, Math.max(r1, 0.6), o.col || 'h', Object.assign({ belly: 'H', bellyT: 0.45 }, o));
const tipOpt = (C, t = 0.55) => (C.L.hair.color2 ? { tip: 'h2', tipT: t } : {});
// strands hanging beside the face (behind the profile eye)
const sideLocks = (C, G, low = G.mouthY, r = 1.3, z = G.FZ - 4.4, x = G.hw + 0.5) => [
  spike(C, [x, G.browY + 1, z], [x + 0.3, low, z + 0.6], r, 0.6), spike(C, [-x, G.browY + 1, z], [-x - 0.3, low, z + 0.6], r, 0.6)];

// fringe outlines (x from +hw → −hw); y relative to G.lo (fringe tip line, just over the brows)
const FRINGE = {
  short: (G) => { const l = G.lo + 2.4, w = G.hw + 0.9; return [[w, l + 3], [6.2, l + 0.4], [4.6, l + 1.4], [2.8, l], [1.0, l + 1.2], [-0.8, l], [-2.6, l + 1.2], [-4.4, l], [-6.2, l + 1.4], [-w, l + 3]]; },
  spiky: (G) => { const l = G.lo, w = G.hw + 0.9; return [[w, l + 4], [7.0, l + 0.6], [5.6, l + 2.6], [3.9, l - 0.6], [2.4, l + 2.0], [0.8, l - 1.0], [-0.9, l + 2.0], [-2.6, l - 0.8], [-4.2, l + 2.2], [-5.9, l - 0.2], [-7.2, l + 2.0], [-w, l + 4]]; },
  messy: (G) => { const l = G.lo + 0.4, w = G.hw + 0.9; return [[w, l + 3.5], [6.4, l], [5.0, l + 1.8], [3.2, l - 0.4], [1.6, l + 1.6], [0, l - 0.6], [-1.8, l + 1.4], [-3.4, l - 0.2], [-5.0, l + 1.6], [-6.6, l + 0.2], [-w, l + 3.5]]; },
  blunt: (G) => { const l = G.lo + 0.2, w = G.hw + 0.9; return [[w, l - 1.6], [w - 1.2, l], [-w + 1.2, l], [-w, l - 1.6]]; },
  round3: (G) => { const l = G.lo + 0.2, w = G.hw + 0.9; return [[w, l + 1], [5.6, l], [4.4, l + 0.2], [2.6, l + 1.4], [1.4, l + 0.2], [0, l], [-1.4, l + 0.2], [-2.6, l + 1.4], [-4.4, l + 0.2], [-5.6, l], [-w, l + 1]]; },
  curtain: (G) => { const l = G.lo, w = G.hw + 0.9; return [[w, l - 3.4], [5.4, l - 0.4], [3.0, l + 0.8], [1.0, G.yt - 1.4], [-1.0, G.yt - 1.4], [-3.0, l + 0.8], [-5.4, l - 0.4], [-w, l - 3.4]]; },
  parted: (G) => { const l = G.lo + 0.4, w = G.hw + 0.9; return [[w, l - 2.2], [4.6, l], [3.0, l + 1.0], [1.6, l + 0.2], [0.4, l + 3.4], [-0.6, l + 0.6], [-2.4, l + 1.0], [-4.2, l], [-w, l - 2.2]]; },
  swoop: (G) => { const l = G.lo, w = G.hw + 0.9; return [[w, l + 3.6], [5.6, l + 3.0], [3.4, l + 2.0], [1.0, l + 0.9], [-1.4, l + 0.1], [-3.6, l - 0.4], [-5.6, l - 0.2], [-w, l - 2.0]]; },
  wispy: (G) => { const l = G.lo + 0.4, w = G.hw + 0.9; return [[w, l - 1.6], [6.4, l + 0.2], [5.0, l + 1.4], [3.6, l - 0.2], [2.2, l + 1.4], [0.6, l - 0.2], [-1.0, l + 1.4], [-2.6, l - 0.2], [-4.0, l + 1.4], [-5.4, l + 0.2], [-6.8, l + 1.2], [-w, l - 1.6]]; },
  veil: (G) => { const l = G.eyeB - 0.6, w = G.hw + 0.9; return [[w, l + 2], [5.6, l - 0.6], [3.8, l + 1.2], [1.8, l - 1.4], [0, l + 0.6], [-1.8, l - 1.2], [-3.8, l + 1.0], [-5.6, l - 0.6], [-w, l + 2]]; },
  oneEye: (G) => { const l = G.lo, w = G.hw + 0.9; return [[w, l + 1.0], [6.0, l - 0.4], [4.4, l + 1.6], [2.8, l + 0.2], [1.2, l + 1.4], [-0.6, l], [-2.4, l - 2.2], [-4.2, G.eyeB - 0.8], [-6.0, G.eyeB - 1.6], [-w, l - 1.0]]; },
};

// hair highlight band ("angel ring"): broken dashes across the crown, never on the skin
function angelRing(C, G, row) {
  const H = C.hairPost;
  H.push(C.vb(-(G.hw + 4), G.hw + 4, row, row, Math.round(G.z0 - G.hd - 6), Math.round(G.FZ - 1.8), 'hl', { paint: 1, stripes: { axis: 'x', p: 5, w: 1, col: 'h', o: 2 } }));
  H.push(C.vb(-(G.hw + 4), G.hw + 4, row, row, Math.round(G.FZ + 0.6), Math.round(G.FZ + 3), 'hl', { paint: 1, stripes: { axis: 'x', p: 5, w: 1, col: 'h', o: 2 } }));
}

const HAIR = {
  short(C, G, pre, post) {
    pre.push(shell(C, G, { ext: 1.1, lift: 1.3 }), nape(C, G), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.short(G)));
    C.ringRow = G.top - 1;
  },
  spiky(C, G, pre, post, top) {
    pre.push(shell(C, G, { lift: 1.6 }), nape(C, G), faceWindow(C, G), earCut(C, G));
    const z = G.z0, Y = G.yt, t = tipOpt(C);
    top(spike(C, [0, Y + 0.6, z - 1.2], [0.6, Y + 5.0, z - 3.8], 2.8, 0.4, t));
    top(spike(C, [3.4, Y, z - 0.6], [6.6, Y + 3.0, z - 2.8], 2.5, 0.4, t));
    top(spike(C, [-3.4, Y, z - 0.6], [-6.4, Y + 3.4, z - 3.2], 2.5, 0.4, t));
    top(spike(C, [1.8, Y + 0.6, z + 3.0], [3.0, Y + 3.4, z + 5.2], 2.1, 0.4, t));
    top(spike(C, [-2.0, Y + 0.6, z + 2.8], [-3.4, Y + 3.0, z + 4.8], 2.0, 0.4, t));
    post.push(spike(C, [5.4, G.cy + 3.6, z - 2.4], [9.8, G.cy + 4.4, z - 4.8], 2.0, 0.4, t), spike(C, [-5.4, G.cy + 3.6, z - 2.4], [-9.8, G.cy + 4.0, z - 4.6], 2.0, 0.4, t));
    post.push(spike(C, [0, G.cy + 2, z - 5.4], [0.4, G.cy + 0.8, z - 10.4], 2.6, 0.4, t));
    post.push(spike(C, [3.4, G.cy - 1.4, z - 5.0], [5.6, G.cy - 3.6, z - 9.0], 2.0, 0.4, t), spike(C, [-3.4, G.cy - 1.4, z - 5.0], [-5.6, G.cy - 3.4, z - 8.8], 2.0, 0.4, t));
    post.push(...sideLocks(C, G, G.mouthY + 1, 1.3));
    post.push(bangs(C, G, FRINGE.spiky(G), { top: 1.6 }));
    C.hairTop = Math.max(C.hairTop, Y + 5);
    C.ringRow = G.top - 1;
  },
  messy(C, G, pre, post, top) {
    pre.push(shell(C, G, { lift: 1.5 }), nape(C, G), faceWindow(C, G), earCut(C, G));
    const z = G.z0, Y = G.yt;
    top(spike(C, [1, Y + 0.6, z - 1], [2.2, Y + 3.4, z - 3.0], 2.2, 0.5));
    top(spike(C, [-2.2, Y + 0.6, z], [-3.8, Y + 2.8, z - 1.6], 2.0, 0.5));
    post.push(spike(C, [0, G.cy + 1, z - 5.6], [0.6, G.cy - 1.4, z - 8.6], 2.0, 0.5));
    post.push(spike(C, [4.6, G.cy - 1.4, z - 4.2], [7.0, G.cy - 3.4, z - 6.0], 1.7, 0.5), spike(C, [-4.6, G.cy - 1.4, z - 4.2], [-7.0, G.cy - 3.0, z - 6.2], 1.7, 0.5));
    post.push(...sideLocks(C, G, G.mouthY + 1.5, 1.2));
    post.push(bangs(C, G, FRINGE.messy(G), { top: 1.5 }));
    C.ringRow = G.top - 1;
  },
  bob(C, G, pre, post) {
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb + 1.2, wide: 0.5, round: 4.4 }), nape(C, G, G.yb + 0.6, { wide: 0.4 }), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, (C.L.hair.fringe && FRINGE[C.L.hair.fringe] || FRINGE.blunt)(G)));
    post.push(C.vb(-(G.hw + 3), G.hw + 3, Math.round(G.yb + 1), Math.round(G.yb + 1), -12, 12, 'H', { paint: 1 }));
    C.ringRow = G.top - 1;
  },
  hime(C, G, pre, post) {
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb + 0.5, wide: 0.3 }), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, FRINGE.blunt(G)));
    post.push(C.box([G.hw + 0.6, G.yb + 3.4, G.FZ - 4.6], [1.0, 4.4, 0.9], 'h', { m: 1, belly: 'H' }));
    post.push(backMass(C, G, C.D.sh - 7));
    C.ringRow = G.top - 1;
  },
  long(C, G, pre, post) {
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb + 0.6, wide: 0.4 }), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, (C.L.hair.fringe && FRINGE[C.L.hair.fringe] || FRINGE.curtain)(G)));
    post.push(backMass(C, G, C.L.hair.len ?? C.D.sh - 8));
    post.push(spike(C, [G.hw + 0.6, G.browY, G.FZ - 4.6], [G.hw + 0.9, G.yb - 3.5, G.FZ - 4.4], 1.4, 1.0), spike(C, [-G.hw - 0.6, G.browY, G.FZ - 4.6], [-G.hw - 0.9, G.yb - 3.5, G.FZ - 4.4], 1.4, 1.0));
    C.ringRow = G.top - 1;
  },
  cape(C, G, pre, post) { // waist-length straight "hair cape" (Thrash); bangs over the eyes
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb + 0.4, wide: 0.6, lift: 1.2 }), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, FRINGE.spiky(G).map(([x, y]) => [x, y - 1.6])));
    C.extra.push({ n: 'hairBack', parent: 'head', p: C.P(0, G.yt - 2, G.z0 - G.hd - 1), sway: { axis: 'x', amp: 0.05, freq: 1.2, move: 2.0 },
      s: [C.box([0, (G.yt - 1 + C.D.hip + 2) / 2, G.z0 - G.hd - 1.0], [G.hw + 1.6, (G.yt - 1 - C.D.hip - 2) / 2, 2.0], 'h', { round: 1.6, belly: 'H', bellyT: 0.4 }),
        C.vb(-(G.hw + 2), G.hw + 2, C.D.hip + 1, C.D.hip + 2, -20, 0, 'H', { paint: 1, stripes: { axis: 'x', p: 2, w: 1, col: 'h' } })] });
    post.push(spike(C, [G.hw + 0.8, G.browY, G.FZ - 4.6], [G.hw + 1.6, C.D.sh - 4, G.FZ - 5.2], 1.6, 1.2), spike(C, [-G.hw - 0.8, G.browY, G.FZ - 4.6], [-G.hw - 1.6, C.D.sh - 4, G.FZ - 5.2], 1.6, 1.2));
    C.ringRow = G.top - 1;
  },
  ponytail(C, G, pre, post) {
    pre.push(shell(C, G, { lift: 1.0 }), nape(C, G), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.swoop(G)));
    post.push(...sideLocks(C, G, G.mouthY, 1.1));
    const piv = [0, G.yt - 0.5, G.z0 - G.hd - 1.2], len = C.L.hair.len ?? 13;
    post.push(C.sph([0, G.yt - 0.6, G.z0 - G.hd - 0.8], 1.3, 'h2'));
    C.extra.push({ n: 'hairTail', parent: 'head', p: C.P(...piv), sway: { axis: 'z', amp: 0.12, freq: 1.3, move: 1.5 }, s: [
      spike(C, [0, G.yt + 0.4, G.z0 - G.hd - 2.0], [0, G.yt - 2.5, G.z0 - G.hd - 4.6], 2.4, 2.4),
      spike(C, [0, G.yt - 2.5, G.z0 - G.hd - 4.6], [0, G.yt - len * 0.6, G.z0 - G.hd - 5.2], 2.4, 1.8),
      spike(C, [0, G.yt - len * 0.6, G.z0 - G.hd - 5.2], [0, G.yt - len, G.z0 - G.hd - 3.8], 1.8, 0.6, tipOpt(C, 0.6)),
    ] });
    C.ringRow = G.top - 1;
  },
  twin_buns(C, G, pre, post, top) {
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb + 1.5, wide: 0.4, lift: 0.9 }), nape(C, G, G.yb + 1), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, FRINGE.round3(G)));
    top(C.sph([4.9, G.yt + 1.4, G.z0 - 0.6], 2.9, 'h', { m: 1, belly: 'H', bellyT: 0.4 }));
    top(C.tor([4.4, G.yt - 0.2, G.z0 - 0.6], 2.0, 0.65, 'h2', { m: 1, rot: [0, 0, -20] }));
    C.hairTop = Math.max(C.hairTop, G.yt + 4.3);
    C.ringRow = G.top - 1;
  },
  swirl(C, G, pre, post, top) { // bob + soft-serve swirl bun (cream tiers on yellow hair)
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb + 1.6, wide: 0.4, lift: 0.9 }), nape(C, G, G.yb + 1), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, FRINGE.round3(G)));
    const cream = C.L.hair.color2 || '#fff4dc', z = G.z0 - 1.2;
    top(C.ell([0, G.yt + 1.6, z], [3.6, 1.6, 3.4], cream, { belly: shade(cream, 0.86) }));
    top(C.ell([0, G.yt + 3.6, z], [2.6, 1.3, 2.5], cream, { belly: shade(cream, 0.86) }));
    top(C.ell([0, G.yt + 5.2, z], [1.5, 1.0, 1.4], cream));
    top(C.cap([0, G.yt + 5.6, z], [0.5, G.yt + 7.0, z - 0.4], 0.8, 0.4, cream));
    C.hairTop = Math.max(C.hairTop, G.yt + 7.4);
    C.ringRow = G.top - 1;
  },
  twin_tails(C, G, pre, post) {
    pre.push(shell(C, G, { lift: 1.0 }), nape(C, G), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.wispy(G)));
    post.push(...sideLocks(C, G, G.mouthY, 1.1));
    const low = C.L.hair.len != null ? G.yt - C.L.hair.len : 3;
    for (const s of [1, -1]) {
      const piv = [s * (G.hw + 0.8), G.yt - 1.5, G.z0 - 1.8];
      C.extra.push({ n: s > 0 ? 'hairL' : 'hairR', parent: 'head', p: C.P(...piv), sway: { axis: 'z', amp: 0.08, freq: 1.4, move: 1.5, phase: s > 0 ? 0 : 1 }, s: [
        C.sph(piv, 1.5, 'h3'),
        spike(C, [s * (G.hw + 1.5), G.yt - 1.6, G.z0 - 2.0], [s * (G.hw + 4.2), G.cy - 3, G.z0 - 2.4], 2.6, 2.6),
        spike(C, [s * (G.hw + 4.2), G.cy - 3, G.z0 - 2.4], [s * (G.hw + 4.6), (G.cy - 3 + low) / 2, G.z0 - 2.4], 2.6, 2.2, tipOpt(C, 0.75)),
        spike(C, [s * (G.hw + 4.6), (G.cy - 3 + low) / 2, G.z0 - 2.4], [s * (G.hw + 3.6), low, G.z0 - 2.0], 2.2, 0.8, C.L.hair.color2 ? { tip: 'h2', tipT: 0.2 } : {}),
      ] });
    }
    C.ringRow = G.top - 1;
  },
  twin_braids(C, G, pre, post) {
    pre.push(shell(C, G, { lift: 0.9 }), nape(C, G), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.parted(G)));
    for (const s of [1, -1]) {
      const sp = [];
      for (let n = 0; n < 5; n++) sp.push(C.sph([s * (G.hw - 0.4), G.yb - 0.4 - n * 1.9, G.z0 + 1.8 + Math.min(n, 2) * 0.6], n % 2 ? 1.25 : 1.6, n % 2 ? 'H' : 'h'));
      sp.push(C.sph([s * (G.hw - 0.4), G.yb - 10.2, G.z0 + 3.0], 1.0, 'h2'), C.cap([s * (G.hw - 0.4), G.yb - 10.8, G.z0 + 3], [s * (G.hw - 0.2), G.yb - 12.6, G.z0 + 3.2], 1.2, 0.6, 'h'));
      post.push(spike(C, [s * (G.hw + 0.4), G.eyeB, G.z0 + 0.6], [s * (G.hw - 0.4), G.yb - 0.4, G.z0 + 1.8], 1.6, 1.5));
      C.extra.push({ n: s > 0 ? 'hairL' : 'hairR', parent: 'head', p: C.P(s * (G.hw - 0.4), G.yb, G.z0 + 1.8), sway: { axis: 'x', amp: 0.05, freq: 1.2, move: 1.4 }, s: sp });
    }
    C.ringRow = G.top - 1;
  },
  braid(C, G, pre, post) {
    pre.push(shell(C, G), nape(C, G), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.messy(G)));
    post.push(...sideLocks(C, G, G.mouthY, 1.1));
    const s = [];
    for (let n = 0; n < 6; n++) s.push(C.sph([0, G.cy - 1 - n * 2, G.z0 - G.hd - 1.6 - Math.min(n, 2) * 0.4], n % 2 ? 1.3 : 1.7, n % 2 ? 'H' : 'h'));
    s.push(C.sph([0, G.cy - 13.4, G.z0 - G.hd - 2.6], 1.0, 'h2'), C.cap([0, G.cy - 14, G.z0 - G.hd - 2.6], [0, G.cy - 16, G.z0 - G.hd - 2.4], 1.3, 0.6, 'h'));
    C.extra.push({ n: 'hairTail', parent: 'head', p: C.P(0, G.cy, G.z0 - G.hd - 1.6), sway: { axis: 'z', amp: 0.08, freq: 1.2, move: 1.4 }, s });
    C.ringRow = G.top - 1;
  },
  pixie(C, G, pre, post, top) {
    pre.push(shell(C, G, { ext: 1.1, lift: 1.2 }), nape(C, G), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.swoop(G).map(([x, y]) => [-x, y]).reverse()));
    top(spike(C, [0.8, G.yt + 0.6, G.z0 - 1.2], [1.6, G.yt + 2.8, G.z0 - 3.2], 1.8, 0.5));
    post.push(...sideLocks(C, G, G.mouthY + 2, 1.1));
    C.ringRow = G.top - 1;
  },
  side_part(C, G, pre, post) {
    pre.push(shell(C, G, { lift: 1.9, ext: 1.1 }), nape(C, G), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.swoop(G), { top: 1.9 }));
    post.push(C.box([-1.0, G.yt + 1.4, G.FZ - 1.0], [4.4, 1.3, 3.4], 'h', { round: 1.1, belly: 'H' }));
    post.push(C.vb(3, 3, Math.round(G.yt), Math.round(G.yt + 2), Math.round(G.z0 - 4), Math.round(G.FZ + 1), 'H', { paint: 1 }));
    if (C.L.hair.color2) post.push(C.vb(-(G.hw + 3), G.hw + 3, Math.round(G.eyeB), Math.round(G.browY + 1), -12, 2, 'h2', { paint: 1 }));   // grey temples
    C.ringRow = G.top;
  },
  slick(C, G, pre, post) { // short slicked-back (comb lines), forehead visible
    pre.push(shell(C, G, { ext: 0.9, lift: 0.9, round: 4.8 }), nape(C, G), faceWindow(C, G, G.yt - 3.4), earCut(C, G));
    post.push(C.vb(-(G.hw + 3), G.hw + 3, Math.round(G.yt - 3), Math.round(G.yt + 2), -12, 12, 'H', { paint: 1, stripes: { axis: 'x', p: 3, w: 1, col: 'H' } }));
    post.push(C.box([0, G.yt - 2.6, G.FZ - 0.4], [G.hw - 1.2, 0.8, 0.9], 'h', { round: 0.6 }));
    C.ringRow = G.top;
  },
  pompadour(C, G, pre, post, top) { // slicked sides + a big forward quiff
    pre.push(shell(C, G, { ext: 0.9, lift: 1.0 }), nape(C, G), faceWindow(C, G, G.yt - 2.8), earCut(C, G));
    top(C.ell([0, G.yt + 1.6, G.FZ - 1.4], [G.hw - 1.6, 2.8, 4.4], 'h', { belly: 'H', bellyT: 0.35 }));
    top(C.ell([0.6, G.yt + 2.4, G.FZ + 1.2], [G.hw - 3.0, 2.2, 2.4], 'h', { belly: 'H', bellyT: 0.35 }));
    post.push(C.vb(-(G.hw + 3), G.hw + 3, Math.round(G.cy), Math.round(G.yt), -14, 0, 'H', { paint: 1, stripes: { axis: 'y', p: 2, w: 1, col: 'H' } }));
    C.hairTop = Math.max(C.hairTop, G.yt + 4.6);
    C.ringRow = G.top + 2;
  },
  bun(C, G, pre, post, top) {
    pre.push(shell(C, G, { lift: 0.8, round: 5 }), nape(C, G), faceWindow(C, G, G.yt - 2.0), earCut(C, G));
    post.push(C.poly([0, 0, G.kf], [[-G.hw - 0.9, G.yt + 1], [G.hw + 0.9, G.yt + 1], [G.hw + 0.9, G.yt - 3.6], [1.0, G.yt - 1.6], [-1.0, G.yt - 1.6], [-G.hw - 0.9, G.yt - 3.6]], 0.8, 'h', { plane: 'xy', belly: 'H', bellyT: 0.5 }));
    if (C.L.hair.strands !== false) post.push(...sideLocks(C, G, G.mouthY + 1, 1.0));
    const bz = G.z0 - G.hd + 0.4;
    top(C.sph([0, G.yt + 1.6, bz], 2.9, 'h', { belly: 'H', bellyT: 0.4, stripes: { axis: 'y', p: 2, w: 1, col: 'H' } }));
    top(C.tor([0, G.yt + 0.2, bz + 0.8], 1.8, 0.6, 'h2', { rot: [-60, 0, 0] }));
    if (C.L.hair.pencils) { top(C.cap([-2.6, G.yt + 4.6, bz - 1], [2.2, G.yt + 0.4, bz + 1.2], 0.6, 0.6, '#ffd33b')); top(C.cap([2.8, G.yt + 4.4, bz - 0.6], [-1.6, G.yt + 0.6, bz + 1.4], 0.6, 0.6, '#5fc2ff')); }
    C.hairTop = Math.max(C.hairTop, G.yt + 4.6);
    C.ringRow = G.top - 1;
  },
  topknot(C, G, pre, post, top) { // bald crown, hair ring at the back and sides, small white knot
    pre.push(shell(C, G, { lift: 0, ext: 1.0 }), nape(C, G), faceWindow(C, G, G.yt - 3), earCut(C, G));
    pre.push(C.box([0, G.yt + 1, G.z0 + 1.8], [G.hw + 3, 4.2, G.hd + 0.6], 'h', { sub: 1 }));
    C.flags.crownShine = true;
    top(C.sph([0, G.yt + 1.0, G.z0 - 2.6], 1.5, 'h'));
    top(C.cap([0, G.yt + 1.2, G.z0 - 3.0], [0, G.yt + 2.6, G.z0 - 4.4], 0.9, 0.7, 'h2'));
    C.ringRow = null;
  },
  mop(C, G, pre, post) { // rounded dome mop-top, full straight bangs to the brows, covers the ears
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb + 2.4, wide: 0.9, lift: 1.8, round: 5.4, ext: 1.4 }), nape(C, G, G.yb + 0.6, { wide: 0.6 }), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, FRINGE.blunt(G).map(([x, y]) => [x, y + 0.4]), { top: 1.8, w: 1.6 }));
    C.ringRow = G.top;
  },
  sidemop(C, G, pre, post) { // side-swept mop with a fringe
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb + 2.6, wide: 0.7, lift: 1.6, round: 5.2 }), nape(C, G, G.yb + 0.6), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, FRINGE.swoop(G).map(([x, y]) => [-x, y + 0.6]).reverse(), { top: 1.6, w: 1.4 }));
    C.ringRow = G.top;
  },
  curtains(C, G, pre, post) { // centre-parted straight hair to the jaw, framing the face like curtains
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb - 0.4, wide: 0.6, lift: 1.4 }), nape(C, G, G.yb - 1.0, { wide: 0.5 }), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, FRINGE.curtain(G)));
    post.push(C.box([G.hw + 0.6, (G.yb - 1 + G.browY) / 2, G.FZ - 4.8], [1.1, (G.browY - G.yb + 1) / 2, 0.9], 'h', { m: 1, belly: 'H', round: 0.6 }));
    post.push(C.vb(0, 0, Math.round(G.yt - 1), Math.round(G.yt + 1.6), Math.round(G.z0 - 3), Math.round(G.FZ + 1), 'H', { paint: 1 }));
    C.ringRow = G.top;
  },
  swept(C, G, pre, post) { // thick swept longer hair to the collar + full sideburns
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb + 0.4, wide: 0.6, lift: 2.4, back: 0.8, round: 5 }), nape(C, G, G.yb - 1.6, { back: 1, wide: 0.6 }), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, FRINGE.swoop(G).map(([x, y]) => [x, y + 0.8]), { top: 2.4, thick: 0.3 }));
    post.push(C.box([G.hw - 0.2, G.yb + 3.2, G.FZ - 2.4], [0.9, 2.6, 1.6], 'h', { m: 1, round: 0.5 }));
    C.hairTop = Math.max(C.hairTop, G.yt + 2.4);
    C.ringRow = G.top + 1;
  },
  shag(C, G, pre, post) { // messy layered to the jaw (grunge)
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb, wide: 0.5, lift: 1.4 }), nape(C, G, G.yb - 1.6, { wide: 0.5 }), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, FRINGE.messy(G).map(([x, y]) => [x, y - 0.8])));
    for (const s of [1, -1]) post.push(spike(C, [s * (G.hw + 0.6), G.browY, G.FZ - 4.8], [s * (G.hw + 1.4), G.yb - 1.8, G.FZ - 4.4], 1.5, 0.7), spike(C, [s * (G.hw - 1), G.cy, G.z0 - G.hd], [s * (G.hw + 0.4), G.yb - 2.2, G.z0 - G.hd + 0.4], 1.5, 0.6));
    C.ringRow = G.top - 1;
  },
  feather(C, G, pre, post) { // blond feathered "wings" flicked back at the sides
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb + 0.6, wide: 0.6, lift: 1.6 }), nape(C, G, G.yb - 1.0, { wide: 0.6 }), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, FRINGE.curtain(G).map(([x, y]) => [x, y + 0.6])));
    for (const s of [1, -1]) {
      post.push(spike(C, [s * (G.hw + 0.4), G.browY + 0.6, G.FZ - 4.4], [s * (G.hw + 3.0), G.eyeB, G.z0 - 2.6], 1.9, 0.7));
      post.push(spike(C, [s * (G.hw + 0.4), G.eyeB, G.FZ - 4.8], [s * (G.hw + 3.0), G.yb + 0.6, G.z0 - 3.0], 1.7, 0.6));
    }
    C.ringRow = G.top;
  },
  wavy(C, G, pre, post) { // big soft shoulder-length perm (city pop)
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb - 3.0, wide: 1.4, lift: 2.0, round: 5.4, ext: 1.6 }), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, FRINGE.swoop(G).map(([x, y]) => [x, y + 0.6]), { top: 2.0, w: 1.6 }));
    for (const s of [1, -1]) for (const [y, z, r] of [[G.yb - 2.4, G.z0 - 1.4, 2.4], [G.yb - 1.6, G.z0 - 5.0, 2.6], [G.eyeB - 1.6, G.z0 - 4.0, 2.4]])
      post.push(C.sph([s * (G.hw + 1.6), y, z], r, 'h', { belly: 'H', bellyT: 0.35 }));
    C.hairTop = Math.max(C.hairTop, G.yt + 2);
    C.ringRow = G.top;
  },
  curly(C, G, pre, post) { // big round curl poof (Riff); curls as lumps with highlight hooks
    C.earsVisible = false;
    pre.push(shell(C, G, { lift: 1.2 }), faceWindow(C, G, G.yt - 2));
    const r = C.L.hair.size ?? 1;
    pre.push(C.ell([0, G.cy + 2.6, G.z0 - 1.0], [(G.hw + 3.4) * r, 9.0 * r, (G.hd + 2.8) * r], 'h', { noise: 0.9, noiseScale: 1.6, belly: 'H', bellyT: 0.45 }));
    pre.push(faceWindow(C, G, G.lo + 1.6, G.hw - 0.4), profileCut(C, G));
    for (const [x, y] of [[-4.6, 0.6], [-1.6, 1.4], [1.6, 1.0], [4.6, 0.4]]) post.push(C.sph([x, G.lo + 2.4 + y, G.kf - 0.3], 1.9, 'h', { belly: 'H', bellyT: 0.4 }));
    post.push(C.vb(-(G.hw + 6), G.hw + 6, Math.round(G.cy - 4), Math.round(G.yt + 6), -16, 16, 'hl', { paint: 1, spots: { col: 'hl', d: 0.12, s: 0.9, seed: 3 } }));
    C.hairTop = Math.max(C.hairTop, G.cy + 2.6 + 9 * r);
    C.ringRow = null;
  },
  cloud(C, G, pre, post) { // the huge curl cloud (as wide as Gonda's shoulders)
    C.earsVisible = false;
    pre.push(shell(C, G, { lift: 1.2, bot: G.yb }), faceWindow(C, G, G.yt - 2));
    pre.push(C.ell([0, G.cy + 1.4, G.z0 - 1.2], [G.hw + 5.4, 11.6, G.hd + 4.0], 'h', { noise: 1.1, noiseScale: 1.7, belly: 'H', bellyT: 0.4 }));
    pre.push(faceWindow(C, G, G.lo + 1.4, G.hw - 0.6), profileCut(C, G));
    for (const [x, y] of [[-5, 0.4], [-2, 1.2], [1.2, 1.0], [4.2, 0.2], [6.6, -1.2], [-7.2, -1.4]]) post.push(C.sph([x, G.lo + 2.2 + y, G.kf - 0.4], 1.9, 'h', { belly: 'H', bellyT: 0.4 }));
    post.push(C.vb(-(G.hw + 8), G.hw + 8, Math.round(G.cy - 10), Math.round(G.yt + 8), -18, 18, 'hl', { paint: 1, spots: { col: 'hl', d: 0.13, s: 0.9, seed: 7 } }));
    C.hairTop = Math.max(C.hairTop, G.cy + 13);
    C.ringRow = null;
  },
  perm(C, G, pre, post) { // tight perm cloud (granny lilac / auntie purple)
    C.earsVisible = false;
    pre.push(shell(C, G, { lift: 1.0, bot: G.eyeB - 0.5 }), faceWindow(C, G, G.yt - 2.4));
    const pts = [[0, 4.6, -1], [-4.4, 3.6, -0.6], [4.4, 3.6, -0.6], [-6.8, 0.6, -1.6], [6.8, 0.6, -1.6], [-2.4, 4.4, -4.6], [2.4, 4.4, -4.6], [0, 2.6, -7.0], [-5.4, 0.4, -5.6], [5.4, 0.4, -5.6], [-2.2, 3.0, 2.4], [2.2, 3.0, 2.4]];
    for (const [x, y, z] of pts) pre.push(C.sph([x, G.cy + y, G.z0 + z], 3.0, 'h', { belly: 'H', bellyT: 0.35 }));
    pre.push(faceWindow(C, G, G.lo + 2.0, G.hw - 0.8), profileCut(C, G));
    for (const [x, y, z] of pts) post.push(C.vb(Math.round(x - 1), Math.round(x - 1), Math.round(G.cy + y + 2), Math.round(G.cy + y + 2), -16, 16, 'hl', { paint: 1 }));
    C.hairTop = Math.max(C.hairTop, G.cy + 8);
    C.ringRow = null;
  },
  afro(C, G, pre) {
    C.earsVisible = false;
    pre.push(C.sph([0, G.cy + 3, G.z0 - 1.2], 11.2, 'h', { noise: 0.8, noiseScale: 1.6, belly: 'H', bellyT: 0.45 }), faceWindow(C, G, G.lo + 1.8, G.hw - 0.6), profileCut(C, G));
    C.hairTop = Math.max(C.hairTop, G.cy + 14);
    C.ringRow = null;
  },
  teased(C, G, pre, post) { // glam: huge teased hair (+8 px of volume)
    C.earsVisible = false;
    pre.push(shell(C, G, { lift: 2 }), faceWindow(C, G, G.yt - 2));
    pre.push(C.ell([0, G.cy + 4.4, G.z0 - 1.4], [G.hw + 5.0, 12.4, G.hd + 3.4], 'h', { noise: 1.6, noiseScale: 1.8, belly: 'H', bellyT: 0.4 }));
    pre.push(faceWindow(C, G, G.lo + 1.0, G.hw - 0.6), profileCut(C, G));
    post.push(bangs(C, G, FRINGE.spiky(G).map(([x, y]) => [x * 1.05, y + 0.6]), { top: 4 }));
    post.push(C.vb(-(G.hw + 8), G.hw + 8, Math.round(G.cy - 6), Math.round(G.yt + 10), -18, 18, 'h2', { paint: 1, spots: { col: 'h2', d: 0.14, s: 1.1, seed: 11 } }));
    C.hairTop = Math.max(C.hairTop, G.cy + 16.5);
    C.ringRow = null;
  },
  mohawk(C, G, pre, post) {
    C.flags.shaved = true;
    const z = G.z0, Y = G.yt, g = C.L.hair.color2 ? { grad: { axis: 'y', to: 'h2', a: Y + 1, b: Y + 7 } } : {};
    post.push(C.box([0, Y - 1.8, z - 0.6], [1.6, 3.0, G.hd + 0.4], 'h', { round: 1.4, belly: 'H' }));
    post.push(spike(C, [0, Y, z + 4.8], [0, Y + 4.4, z + 7.6], 1.7, 0.5, g));
    post.push(spike(C, [0, Y + 0.5, z + 1.8], [0, Y + 7.4, z + 3.2], 1.9, 0.5, g));
    post.push(spike(C, [0, Y + 0.5, z - 1.4], [0, Y + 8.0, z - 1.2], 1.9, 0.5, g));
    post.push(spike(C, [0, Y, z - 4.4], [0, Y + 6.4, z - 6.4], 1.8, 0.5, g));
    post.push(spike(C, [0, G.cy + 2, z - 6.2], [0, G.cy + 4, z - 10.6], 1.7, 0.5, g));
    C.hairTop = Math.max(C.hairTop, Y + 8);
    C.ringRow = null;
  },
  liberty(C, G, pre, post) { // liberty-spike mohawk: 5 long spikes fanning from the crown (punk)
    C.flags.shaved = true;
    const z = G.z0, Y = G.yt, g = C.L.hair.color2 ? { grad: { axis: 'y', to: 'h2', a: Y + 2, b: Y + 9 } } : {};
    post.push(C.box([0, Y - 1.8, z - 0.6], [1.8, 3.0, G.hd + 0.4], 'h', { round: 1.4, belly: 'H' }));
    for (const [a, l] of [[-50, 7], [-24, 9], [0, 10], [24, 9], [50, 7]]) {
      const r = a * Math.PI / 180;
      post.push(spike(C, [0, Y - 0.4, z - 0.6 + Math.sin(r) * 2], [0, Y - 0.4 + Math.cos(r) * l, z - 0.6 + Math.sin(r) * (l + 2)], 2.0, 0.5, g));
    }
    C.hairTop = Math.max(C.hairTop, Y + 9.6);
    C.ringRow = null;
  },
  dreads(C, G, pre, post) {
    C.earsVisible = false;
    pre.push(shell(C, G, { lift: 1.4, bot: G.eyeB }), nape(C, G), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, FRINGE.short(G).map(([x, y]) => [x, y + 0.6])));
    let n = 0;
    for (const s of [1, -1]) for (const [x, z] of [[G.hw + 0.6, -4.6], [G.hw - 0.4, -7.2], [G.hw - 3.6, -8.8], [G.hw - 6.4, -9.2]]) {
      post.push(C.cap([s * x, G.cy + 1, G.z0 + z + 1.4], [s * (x + 0.6), G.yb - 4.6 - (n % 3), G.z0 + z], 1.1, 0.9, n % 2 ? 'h' : 'H'));
      if (C.L.hair.color2) post.push(C.sph([s * (x + 0.5), G.yb - 3.6 - (n % 3), G.z0 + z + 0.2], 0.9, 'h2'));
      n++;
    }
    C.ringRow = G.top - 1;
  },
  mullet(C, G, pre, post, top) { // spiky top + long back to the shoulders (glam)
    pre.push(shell(C, G, { lift: 1.8 }), nape(C, G), faceWindow(C, G), earCut(C, G));
    const z = G.z0, Y = G.yt, t = tipOpt(C, 0.6);
    for (const [x, zz, h] of [[0, -1, 5], [3.6, 0, 4], [-3.6, 0, 4], [2, 3, 3.6], [-2, 3, 3.6]]) top(spike(C, [x, Y + 0.4, z + zz], [x * 1.4, Y + h, z + zz - 2.4], 2.3, 0.5, t));
    post.push(bangs(C, G, FRINGE.spiky(G).map(([x, y]) => [x, y + 1.0]), { top: 1.8 }));
    post.push(C.box([0, (G.cy + C.D.sh - 6) / 2, G.z0 - G.hd - 1.0], [G.hw + 0.8, (G.cy - C.D.sh + 6) / 2, 2.2], 'h', { round: 1.6, belly: 'H', bellyT: 0.4 }));
    for (const s of [1, -1]) post.push(spike(C, [s * (G.hw + 0.6), G.eyeB, G.z0 - 3.6], [s * (G.hw + 1.6), C.D.sh - 5, G.z0 - 3.0], 1.5, 0.7));
    C.hairTop = Math.max(C.hairTop, Y + 5);
    C.ringRow = G.top - 1;
  },
  veil(C, G, pre, post) { // long bangs that hide the eyes (shy / brooding)
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb + 0.6, wide: 0.5, lift: 1.4 }), nape(C, G, G.yb - 1.0, { wide: 0.4 }), faceWindow(C, G));
    post.push(bangs(C, G, FRINGE.veil(G), { thick: 0.1 }));
    for (const s of [1, -1]) post.push(spike(C, [s * (G.hw + 0.6), G.browY, G.FZ - 3.6], [s * (G.hw + 1.0), G.yb - 2.2, G.FZ - 3.4], 1.5, 0.8));
    C.flags.eyesHidden = true;
    C.ringRow = G.top - 1;
  },
  asym(C, G, pre, post) { // visual-kei: chin-length on one side, waist-length on the other, bangs over one eye
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.yb, wide: 0.6, lift: 1.8 }), nape(C, G, G.yb - 1), faceWindow(C, G), profileCut(C, G));
    post.push(bangs(C, G, FRINGE.oneEye(G), { top: 1.8 }));
    post.push(spike(C, [-(G.hw + 0.6), G.browY, G.FZ - 4.2], [-(G.hw + 1.4), G.yb - 2.6, G.FZ - 4.2], 1.6, 1.0, tipOpt(C, 0.7)));
    post.push(spike(C, [G.hw + 0.8, G.browY, G.FZ - 4.4], [G.hw + 2.2, C.D.hip + 3, G.z0 - 1.6], 2.2, 1.2, tipOpt(C, 0.75)));
    post.push(spike(C, [G.hw - 1.0, G.cy, G.z0 - G.hd - 0.8], [G.hw + 0.6, C.D.hip + 4, G.z0 - G.hd - 0.6], 2.2, 1.0, tipOpt(C, 0.75)));
    C.flags.eyeHiddenR = true;
    C.ringRow = G.top;
  },
  cap(C, G, pre, post) { // hair under a cap (default cap if no hat accessory)
    pre.push(shell(C, G, { lift: 0.6 }), nape(C, G), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.messy(G), { top: 0.4 }));
    post.push(spike(C, [4.2, G.eyeB + 1.6, G.z0 - 4.0], [6.6, G.eyeB - 1.2, G.z0 - 5.0], 1.4, 0.4), spike(C, [-4.2, G.eyeB + 1.6, G.z0 - 4.0], [-6.6, G.eyeB - 1.2, G.z0 - 5.0], 1.4, 0.4));
    C.ringRow = null;
  },
  buzz(C) { C.flags.buzz = true; C.ringRow = null; },
  bald(C) { C.ringRow = null; },
};

// long straight back mass (hangs behind the shoulders)
function backMass(C, G, low) {
  return C.box([0, (G.cy + low) / 2, G.z0 - G.hd - 0.3], [G.hw + 1.2, (G.cy - low) / 2, 2.1], 'h', { round: 1.8, belly: 'H', bellyT: 0.4 });
}

function buildHead(C) {
  const { L, D } = C, Hd = C.parts.head, G = headGeo(C), z = G.z0;
  const style = L.hair.style;
  const pre = C.hairPre, post = C.hairPost;
  const top = (sh) => { if (!C.hat || C.hatLow) post.push(sh); };   // features that would poke through a hat
  C.ringRow = G.top - 1;
  (HAIR[style] || HAIR.messy)(C, G, pre, post, top);
  Hd.push(...pre);
  // skull: wide rounded cranium + a narrower rounded jaw, smooth-joined (chibi head, flat face plane)
  Hd.push(C.box([0, (G.yb + 1.4 + G.yt) / 2, z], [G.hw, (G.yt - G.yb - 1.4) / 2, G.hd], 's', { round: 3.6 }));
  Hd.push(C.box([0, G.yb + 3.1, z + 0.3], [G.hw - 1.1, 3.1, G.hd - 0.5], 's', { round: 2.6, blend: 1.6 }));
  // ears (small; most hair covers them)
  if (C.earsVisible) Hd.push(C.ell([G.hw + 0.1, G.eyeB - 0.4, z + 0.4], [1.0, 1.8, 1.3], 's', { m: 1 }), C.vb(Math.round(G.hw + 1), Math.round(G.hw + 1), Math.round(G.eyeB - 1), Math.round(G.eyeB), Math.round(z), Math.round(z + 1), 'S', { m: 1, paint: 1 }));
  // nose: a 1-px bump (reads in profile; gives a tiny cel shadow from the front)
  Hd.push(C.ell([0, D.chin + 3.6, G.FZ + 0.05], [0.7, 0.9, 0.8], 's'));
  // under-chin shade on the throat side
  Hd.push(C.vb(-(G.hw), G.hw, D.chin, D.chin, Math.round(z - G.hd), Math.round(G.FZ - 2), 'S', { paint: 1 }));
  // scalp treatments
  if (C.flags.shaved) Hd.push(C.vb(-(G.hw + 1), G.hw + 1, Math.round(G.eyeB + 1), Math.round(G.yt + 0.5), Math.round(z - G.hd - 1), Math.round(G.FZ - 2.5), mix(C.pal.s, C.pal.h, 0.35), { paint: 1 }));
  if (L.face.scalp) Hd.push(C.vb(-(G.hw + 1), G.hw + 1, Math.round(G.eyeB + 1), Math.round(G.yt + 0.5), Math.round(z - G.hd - 1), Math.round(G.FZ - 2.5), L.face.scalp, { paint: 1, stripes: { axis: 'z', p: 3, w: 1, col: L.face.scalp } }));
  if (C.flags.buzz) {
    Hd.push(C.vb(-(G.hw + 1), G.hw + 1, Math.round(G.eyeB + 1), Math.round(G.yt + 0.5), Math.round(z - G.hd - 1), Math.round(z + G.hd + 1), 'h', { paint: 1 }));
    Hd.push(C.vb(-(G.hw - 1), G.hw - 1, Math.round(G.eyeB - 2), Math.round(G.yt - 2.5), Math.round(G.FZ - 1.4), Math.round(G.FZ + 1), 's', { paint: 1 }));
    Hd.push(C.vb(-(G.hw + 1), G.hw + 1, Math.round(G.yb + 1), Math.round(G.eyeB), Math.round(z - G.hd - 1), Math.round(z - 2), 'h', { paint: 1 }));
    if (L.hair.knot) { Hd.push(C.sph([0, G.yt + 0.6, z - 2.4], 1.3, 'h'), C.cap([0, G.yt + 0.8, z - 2.6], [0, G.yt + 2.2, z - 3.4], 0.8, 0.6, 'h')); Hd.push(C.vb(-1, 1, Math.round(G.yt + 0.6), Math.round(G.yt + 0.6), Math.round(z - 4), Math.round(z - 1), '#f4f2ee', { paint: 1 })); }
  }
  if (style === 'bald' || C.flags.crownShine) Hd.push(C.vb(-2, -1, Math.round(G.yt - 0.6), Math.round(G.yt - 0.6), Math.round(z), Math.round(z + 2), 'sl', { paint: 1 }));
  Hd.push(...post);
  if (C.ringRow != null && !C.hat) angelRing(C, G, C.ringRow);
  Hd.push(...C.hairPost.splice(post.length));
}
