// Elemon — parametric chibi humans (3D pixel art). See docs/MODELING.md.
//
//   humanDesign(look)      → voxel DSL design (arch 'biped': body/head/armL/armR/legL/legR [+ hair parts])
//   CHARACTERS / CHAR_LORE → named looks + story metadata (name, role, dialogue voice)
//   randomLook(seed, role?)→ deterministic townsfolk (salaryman, student, tourist, granny, kid, worker…)
//   withCosmetics(look, c) → equip/unequip cosmetics; characterDesign(key, cosmetics?)
//   DESIGNS                → ready-built designs for every named character + 12 townsfolk
//   catalogues for the character creator: SKIN_TONES, HAIR_COLORS, HAIR_STYLES, EYE_STYLES, IRIS_COLORS,
//   MOUTH_STYLES, BROW_STYLES, TOP_STYLES, BOTTOM_STYLES, SHOE_STYLES, STONE_SHAPES, ACCESSORIES
//
// Model space: metres, +y up, +z = front, model's left = +x. Internally every
// coordinate is written in VOXEL UNITS (1 = design.vs): voxel cell (i,j,k) is
// centred on (i,j,k)·vs, so faces, seams and trims land crisply on the lattice.
// The skull is always 9 voxels wide (i −4..4) with a flat face plane at
// z = 4.5 (+1 for the elderly stoop) so eye / mouth decals sit exactly on it
// (snap:false). Legs hang from the root (not the body) so 'bow' bends at the hips.
// design.portrait = { y, dist, yaw } is a head-and-shoulders framing hint for
// PortraitView.show(); design.look is the normalised look.
//
// look = {
//   build: 'kid'|'teen'|'adult'|'big'|'old',   height: 0.85–1.15 (uniform scale)
//   skin: '#hex',
//   hair:  { style (HAIR_STYLES, aliases like 'twin buns'/'side-part' ok), color, color2 (tips/streaks/ties) },
//   eyes:  { style (EYE_STYLES), iris, lashes?, liner? (punk eyeliner wings) },
//   face:  { brows (BROW_STYLES), browColor, mouth (MOUTH_STYLES), blush: true|'lines'|'#hex', nose: false|'big',
//            freckles, stubble, beard: 'full'|'goatee'|'long', mustache: 'thin'|'thick'|'walrus', facial (colour),
//            paint (cheek paint colour), scar, wrinkles, tattoo (arm-sleeve colour), scalp (head-stripe colour) },
//   top:   { style (TOP_STYLES), color, color2, color3, glow (neon trim), emblem (back), graphic (chest), ears ('panda'|'cat' hood),
//            pattern ('leopard'), sleeves ('long' tee), patch, inner },
//   bottom:{ style (BOTTOM_STYLES), color, color2, ripped, socks: 'high', tights, pleats: false, belt },
//   shoes: { style (SHOE_STYLES), color, color2, glow } | '#hex',
//   acc:   ['bracelet', 'watch', { type: 'earrings', style: 'hoops', color: '#ffd23a' }, …]   (see ACCESSORIES)
//   cosmetics: { stone: { color, shape }, watch: 'gold', earrings: 'hoops', hairclip: 'star', grillz: true,
//                badge: '#hex', <any accessory>: true | false (unequip) | 'style' | '#colour' | {style, color…} },
//   anim:  { quirk: [...] }  (optional animator overrides)
// }
import { mulberry32, hashStr } from '../../core/rng.js';

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
const dark = (c, a = 0.3) => mix(c, '#2a1d3d', a);     // anime shadow: cool indigo shift
const lite = (c, a = 0.35) => mix(c, '#fff6e8', a);

// ============================================================ catalogues (character creator)
export const SKIN_TONES = ['#ffe6d5', '#fbd5bb', '#f3c29f', '#e4a97f', '#cc8d62', '#ad6e47', '#8a5233', '#5e3722'];
export const HAIR_COLORS = ['#1e1b26', '#3d2b25', '#6e4431', '#a8693d', '#e9c47c', '#f4ecdc', '#c8cbd6', '#ff5d7c',
  '#ffa3c9', '#62d36b', '#3ac6ff', '#7b5cff', '#ff4b37', '#ffd33b'];
export const IRIS_COLORS = ['#5a3420', '#2b1d18', '#2f6fd6', '#2aa86a', '#d23a3a', '#e89a1e', '#8a4fe0', '#16b3c4', '#ff5fa2'];
export const HAIR_STYLES = ['spiky', 'messy', 'bob', 'ponytail', 'twin_buns', 'twin_tails', 'long', 'mohawk', 'buzz', 'bald',
  'side_part', 'afro', 'braid', 'cap', 'bun', 'topknot', 'curly', 'slick', 'hime', 'pixie'];
export const EYE_STYLES = ['anime', 'big', 'round', 'sharp', 'fierce', 'sleepy', 'bead', 'dot', 'tall', 'star'];
export const MOUTH_STYLES = ['smile', 'line', 'grin', 'cat', 'tiny', 'w', 'fang', 'lips'];
export const BROW_STYLES = ['soft', 'thin', 'thick', 'sharp', 'angry', 'worried', 'bushy', 'none'];
export const TOP_STYLES = ['hoodie', 'jacket', 'tracksuit', 'leather', 'labcoat', 'apron', 'suit', 'tee', 'happi', 'uniform',
  'kimono', 'gi', 'vest', 'tank', 'field', 'cardigan', 'dress', 'sailor', 'gakuran', 'hawaiian', 'sweater', 'hivis'];
export const BOTTOM_STYLES = ['pants', 'jeans', 'shorts', 'skirt', 'long_skirt', 'hakama', 'cargo', 'track', 'overalls'];
export const SHOE_STYLES = ['sneakers', 'hightops', 'boots', 'loafers', 'sandals', 'rainboots', 'idol'];
export const STONE_SHAPES = ['round', 'heart', 'star', 'diamond', 'skull'];
// Equippable accessories / cosmetics: slot (one per slot is sensible) and styles.
export const ACCESSORIES = {
  bracelet: { slot: 'wristL', styles: ['tech'], note: 'soul-stone tech band — always on the player; cosmetics.stone = {color, shape}' },
  watch: { slot: 'wristR', styles: ['digital', 'gold', 'smart'] },
  earrings: { slot: 'ears', styles: ['studs', 'hoops', 'lightning'] },
  hairclip: { slot: 'hairclip', styles: ['star', 'heart', 'bolt', 'flower'] },
  grillz: { slot: 'mouth', styles: ['gold', 'silver', 'diamond'] },
  badge: { slot: 'chest', styles: ['round', 'star', 'heart', 'tag'] },
  cap: { slot: 'hat', styles: ['forward', 'back'] },
  safari_hat: { slot: 'hat', styles: ['safari'] },
  straw_hat: { slot: 'hat', styles: ['straw'] },
  hard_hat: { slot: 'hat', styles: ['hard'] },
  beanie: { slot: 'hat', styles: ['beanie'] },
  headband: { slot: 'forehead', styles: ['sport', 'hachimaki'] },
  bandana: { slot: 'head', styles: ['head', 'neck'] },
  glasses: { slot: 'eyes', styles: ['round', 'square', 'half'] },
  sunglasses: { slot: 'eyes', styles: ['shades', 'visor', 'heart'] },
  mask: { slot: 'face', styles: ['surgical'] },
  headset: { slot: 'ears', styles: ['headset'] },
  chain: { slot: 'neck', styles: ['gold', 'silver', 'wallet'] },
  whistle: { slot: 'neck', styles: ['whistle'] },
  scarf: { slot: 'neck', styles: ['scarf'] },
  backpack: { slot: 'back', styles: ['pack'] },
  satchel: { slot: 'hip', styles: ['satchel'] },
  apron: { slot: 'over', styles: ['apron'] },
  gloves: { slot: 'hands', styles: ['full', 'fingerless'] },
  wristbands: { slot: 'wrists', styles: ['plain', 'spiked'] },
};

// ============================================================ builds (voxel units)
//  hip: leg pivot row · torso: torso rows (= arm length) · cw/cd: torso half width/depth
//  armW/legW: limb thickness · skullH: skull rows · neck: neck rows · hunch: elderly stoop
const BUILDS = {
  kid: { vs: 0.04, hip: 8, torso: 8, cw: 3, cd: 2, armW: 2, legW: 2, skullH: 9, neck: 0, bounce: 1.4, gait: 1.15, maxSpeed: 3.6 },
  teen: { vs: 0.048, hip: 11, torso: 9, cw: 3, cd: 2, armW: 2, legW: 2, skullH: 10, neck: 0, bounce: 1.1, gait: 1, maxSpeed: 4.6 },
  adult: { vs: 0.05, hip: 11, torso: 10, cw: 3, cd: 2, armW: 2, legW: 2, skullH: 10, neck: 0, bounce: 1, gait: 1, maxSpeed: 4.6 },
  big: { vs: 0.055, hip: 11, torso: 12, cw: 4, cd: 3, armW: 3, legW: 3, skullH: 10, neck: 0, bounce: 0.8, gait: 0.9, maxSpeed: 4.2 },
  old: { vs: 0.046, hip: 10, torso: 9, cw: 3, cd: 2, armW: 2, legW: 2, skullH: 10, neck: 0, hunch: 1, bounce: 0.6, gait: 0.75, maxSpeed: 2.6 },
};

function dims(B) {
  const D = Object.assign({}, B);
  D.hipJ = B.hip;
  D.shJ = B.hip + B.torso - 1;                 // top torso row (shoulders)
  D.J0 = D.shJ + 1 + B.neck;                   // skull rows J0..J1
  D.J1 = D.J0 + B.skullH - 1;
  D.hz = B.hunch ? 1 : 0;                      // head / upper-body forward offset
  D.faceZ = 4.5 + D.hz;                        // face plane
  D.armI0 = B.cw + 1; D.armI1 = B.cw + B.armW; // arm columns (left side)
  D.armK0 = B.armW === 3 ? -1 : -1; D.armK1 = B.armW === 3 ? 1 : 0;
  D.handJ0 = D.shJ - B.torso;                  // hand rows
  D.handJ1 = D.handJ0 + (B.armW === 3 ? 2 : 1);
  D.legI0 = 1; D.legI1 = B.legW;               // leg columns (left side)
  D.legK0 = -1; D.legK1 = B.legW === 3 ? 1 : 0;
  const sh = B.skullH;
  D.eyeY = D.J0 + (sh >= 10 ? 3.7 : 3.3);      // eye centre (eyes ~3 voxels tall)
  D.eyeX = 2.2;
  D.mouthY = D.J0 + (sh >= 10 ? 1.35 : 1.15);
  D.browY = D.J0 + (sh >= 10 ? 5.85 : 5.35);
  D.hairline = D.J0 + (sh >= 10 ? 7 : 6);      // first row of forehead hair (fringe-less styles)
  return D;
}

// ============================================================ build context
class Ctx {
  constructor(L, D, pal) {
    this.L = L; this.D = D; this.pal = pal; this.u = D.vs;
    this.parts = { head: [], body: [], armL: [], armR: [], legL: [], legR: [] };
    this.hairPre = []; this.hairPost = []; this.extra = []; this.decals = []; this.fx = [];
    this.sleeve = 'long'; this.legWear = 'long';
    this.hat = null; this.earsVisible = true; this.mouthStyle = null; this.mouthCmap = null;
    this.flags = {};
  }
  P(x, y, z) { const u = this.u; return [x * u, y * u, z * u]; }
  O(o) {
    if (!o) return {};
    const u = this.u, r = Object.assign({}, o);
    for (const k of ['round', 'noise', 'noiseScale', 'fat', 'thr']) if (r[k] != null) r[k] *= u;
    if (r.stripes) r.stripes = Object.assign({}, r.stripes, { p: r.stripes.p * u, w: r.stripes.w * u, o: (r.stripes.o || 0) * u });
    if (r.spots) r.spots = Object.assign({}, r.spots, { s: (r.spots.s ?? 1.2) * u });
    if (r.grad) r.grad = Object.assign({}, r.grad, { a: r.grad.a * u, b: r.grad.b * u });
    return r;
  }
  // voxel-index box: exactly the cells i0..i1 × j0..j1 × k0..k1
  vb(i0, i1, j0, j1, k0, k1, col, o) {
    const u = this.u;
    if (i0 > i1) [i0, i1] = [i1, i0];
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
  // static pixel decal; at in voxel units; px multiple of vs; lift in voxel units
  decal(part, at, dir, rows, cmap, px, extra = {}) {
    const d = Object.assign({ part, at: this.P(...at), dir, rows, cmap, px }, extra);
    if (extra.lift != null) d.lift = extra.lift * this.u;
    this.decals.push(d);
  }
}

// ============================================================ look normalisation
const norm = (s) => String(s || '').toLowerCase().replace(/[\s-]+/g, '_');
const asObj = (v, key) => (v == null ? {} : typeof v === 'string' ? { [key]: v } : Object.assign({}, v));
const HAT_ACC = ['cap', 'safari_hat', 'straw_hat', 'hard_hat', 'beanie'];

export function normalizeLook(look = {}) {
  const L = {};
  L.build = BUILDS[look.build] ? look.build : 'adult';
  L.height = Math.max(0.85, Math.min(1.15, +look.height || 1));
  L.skin = look.skin || SKIN_TONES[2];
  L.hair = Object.assign({ style: 'messy', color: HAIR_COLORS[1] }, asObj(look.hair, 'style'));
  L.hair.style = norm(L.hair.style);
  if (!HAIR_STYLES.includes(L.hair.style)) L.hair.style = 'messy';
  L.eyes = Object.assign({ style: 'anime', iris: IRIS_COLORS[0] }, asObj(look.eyes, 'style'));
  L.face = Object.assign({}, look.face);
  L.top = Object.assign({ style: 'tee', color: '#f2f2f2' }, asObj(look.top, 'style'));
  L.top.style = norm(L.top.style);
  L.bottom = Object.assign({ style: 'pants', color: '#2f3a52' }, asObj(look.bottom, 'style'));
  L.bottom.style = norm(L.bottom.style);
  L.shoes = typeof look.shoes === 'string' ? { style: 'sneakers', color: look.shoes } : Object.assign({ style: 'sneakers', color: '#f4f4f4' }, look.shoes);
  L.shoes.style = norm(L.shoes.style);
  L.anim = look.anim || null;
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
  const t2 = L.top.color2 || (lum(t) > 0.6 ? '#2b2f3c' : '#f4f1ea');
  const t3 = L.top.color3 || mix(t2, t, 0.25);
  const f = L.shoes.color || '#f4f4f4';
  return {
    s, S: mix(s, '#b4505a', 0.24), sl: lite(s, 0.25),
    h, H: dark(h, 0.32), hl: lite(h, 0.4), h2: L.hair.color2 || lite(h, 0.55),
    t, T: dark(t, 0.28), tl: lite(t, 0.3), t2, T2: dark(t2, 0.25), t3,
    b, B: dark(b, 0.3), bl: lite(b, 0.25), b2: L.bottom.color2 || dark(b, 0.45),
    f, F: L.shoes.color2 || (lum(f) > 0.7 ? '#e8434f' : '#f2f2f2'), fs: L.shoes.sole || (L.shoes.style === 'boots' || L.shoes.style === 'rainboots' ? '#1d1b22' : '#fbfbf6'),
    k: '#1d1a24', w: '#fbfbf6', sock: L.bottom.sock || '#f5f5f5', g: '#ffd23a', si: '#c9d1dc',
    m: L.face.facial || dark(h, 0.35),
    st: L.face.facial || mix(s, '#3e4a6a', 0.42), sv: mix(s, dark(h, 0.55), 0.22), bp: mix(b, '#1d1a2a', 0.18),
  };
}

// ============================================================ legs & shoes
function buildLegs(C) {
  const { D, L } = C, st = L.shoes.style, wear = C.legWear;
  for (const s of [1, -1]) {
    const G = C.leg(s);
    const i0 = s * D.legI0, i1 = s * D.legI1, k0 = D.legK0, k1 = D.legK1, top = D.hipJ + 1;
    const io = s > 0 ? Math.max(i0, i1) : Math.min(i0, i1);   // outer column
    // leg column (skin underneath; clothing painted over)
    G.push(C.vb(i0, i1, 2, top, k0, k1, 's'));
    if (wear === 'long' || wear === 'hidden') G.push(C.vb(i0, i1, 2, top, k0, k1, 'b', { paint: 1 }));
    else if (wear === 'shorts') G.push(C.vb(i0, i1, D.hipJ - Math.round(D.torso * 0.35), top, k0, k1, 'b', { paint: 1 }));
    else if (wear === 'tights') G.push(C.vb(i0, i1, 2, top, k0, k1, 'b2', { paint: 1 }));
    // socks for bare legs
    if (wear === 'shorts' || wear === 'bare') G.push(C.vb(i0, i1, 2, 3, k0, k1, 'sock', { paint: 1 }));
    // knee-high socks (kids / idol)
    if (L.bottom.socks === 'high' && wear !== 'long') G.push(C.vb(i0, i1, 2, 5, k0, k1, 'sock', { paint: 1 }));
    // ripped jeans: skin at the knees
    if (L.bottom.ripped && wear === 'long') {
      const kn = Math.round(D.hipJ * 0.5);
      G.push(C.vb(io, io, kn, kn, k1, k1, 's', { paint: 1 }));
      G.push(C.vb(i0, i0, kn - 2, kn - 2, k1, k1, mix(L.bottom.color, '#ffffff', 0.5), { paint: 1 }));
    }
    // outer side stripes (track pants)
    if (L.bottom.stripe) G.push(C.vb(io, io, 2, top, k0, k1, L.bottom.stripe, { paint: 1, side: L.bottom.stripe, sideT: 0.5 }));
    // ---- shoes (rows 0..1, extend forward)
    const fk1 = k1 + (D.legW === 3 ? 2 : 2);
    if (st === 'sandals') {
      G.push(C.vb(i0, i1, 0, 1, k0, fk1, 's'));
      G.push(C.vb(i0, i1, 0, 0, k0, fk1, '#8a5a32'));
      G.push(C.vb(i0, i1, 1, 1, fk1 - 1, fk1 - 1, 'F', { paint: 1 }));
    } else if (st === 'rainboots' || st === 'boots' || st === 'idol') {
      const hi = st === 'rainboots' ? 6 : st === 'idol' ? 5 : 3;
      G.push(C.vb(i0, i1, 0, 1, k0, fk1, 'f'));
      G.push(C.vb(i0, i1, 2, hi, k0, k1, 'f', { paint: 1 }));
      G.push(C.vb(i0, i1, 0, 0, k0, fk1, 'fs'));
      if (st === 'boots') { G.push(C.vb(i0, i1, 2, 2, k0, k1, 'F', { paint: 1 })); G.push(C.vb(io, io, 1, 1, fk1 - 1, fk1 - 1, '#c9ccd6', { paint: 1 })); }
      if (st === 'idol') G.push(C.vb(i0, i1, hi, hi, k0, k1, 'F', { paint: 1 }));
      if (st === 'rainboots') G.push(C.vb(i0, i1, hi, hi, k0, k1, 'F', { paint: 1 }));
    } else if (st === 'loafers') {
      G.push(C.vb(i0, i1, 0, 1, k0, fk1, 'f'));
      G.push(C.vb(i0, i1, 0, 0, k0, fk1, 'fs'));
      G.push(C.vb(i0, i1, 1, 1, fk1, fk1, shade(L.shoes.color, 1.25), { paint: 1 }));
    } else { // sneakers / hightops: chunky white sole, coloured upper, accent swoosh
      G.push(C.vb(i0, i1, 0, 1, k0, fk1, 'f'));
      G.push(C.vb(i0, i1, 0, 0, k0, fk1, 'fs'));
      G.push(C.vb(io, io, 1, 1, k0 + 1, fk1 - 1, 'F', { paint: 1 }));
      G.push(C.vb(i0, i1, 1, 1, fk1, fk1, 'w', { paint: 1 }));
      if (st === 'hightops') G.push(C.vb(i0, i1, 2, 3, k0, k1, 'f', { paint: 1 }), C.vb(i0, i1, 3, 3, k0, k1, 'F', { paint: 1 }));
      if (L.shoes.glow) G.push(C.vb(i0, i1, 0, 0, k0, fk1, L.shoes.glow, { paint: 1, glow: 2, side: L.shoes.glow, sideT: 0.5 }));
    }
  }
}

// ============================================================ body: bottoms
function buildBottom(C) {
  const { D, L } = C, Bd = C.parts.body, st = L.bottom.style, cw = D.cw, cd = D.cd, hip = D.hipJ;
  // pelvis (2 rows) — always present; tops cover from hip+2 up
  Bd.push(C.vb(-cw, cw, hip, hip + 1, -cd, cd, 'b'));
  C.legWear = 'long';
  if (st === 'shorts') C.legWear = 'shorts';
  if (st === 'skirt') {
    C.legWear = L.bottom.tights ? 'tights' : 'bare';
    const len = Math.max(3, Math.round(D.torso * 0.36));
    Bd.push(C.cap([0, hip + 1.5, -0.3], [0, hip - len + 0.3, -0.3], cw + 0.25, cw + 1.15, 'b', { stripes: L.bottom.pleats === false ? undefined : { axis: 'x', p: 2, w: 1, col: 'bp' } }));
    Bd.push(C.vb(-cw - 2, cw + 2, hip - len, hip - len, -cd - 2, cd + 2, 'b2', { paint: 1 }));
    Bd.push(C.vb(-cw - 2, cw + 2, hip - len - 1, hip - len - 1, -cd - 2, cd + 2, 'b', { sub: 1 }));
  }
  if (st === 'long_skirt') {
    C.legWear = 'hidden';
    Bd.push(C.cap([0, hip + 1.5, -0.2], [0, 3.6, -0.2], cw + 0.2, cw + 1.3, 'b', { stripes: { axis: 'x', p: 2, w: 1, col: 'bp' } }));
    Bd.push(C.vb(-cw - 2, cw + 2, 2, 2, -cd - 2, cd + 2, 'b2', { paint: 1 }));
  }
  if (st === 'hakama') {
    C.legWear = 'hidden';
    Bd.push(C.cap([0, hip + 1.6, -0.2], [0, 2.6, -0.2], cw + 0.4, cw + 1.9, 'b', { stripes: { axis: 'x', p: 2, w: 1, col: 'bp' } }));
  }
  if (st === 'overalls') {
    // bib + straps drawn in buildTop (needs the torso)
    C.flags.overalls = true;
  }
  if (st === 'cargo') C.flags.cargo = true;
  if (st === 'track') L.bottom.stripe = L.bottom.stripe || L.bottom.color2 || '#f4f4f4';
  if (st === 'jeans') { C.flags.jeans = true; }
  // belt / waistband
  if (!['skirt', 'long_skirt', 'hakama', 'overalls', 'track'].includes(st)) Bd.push(C.vb(-cw, cw, hip + 1, hip + 1, -cd, cd, L.bottom.belt || 'B', { paint: 1 }));
  if (L.bottom.belt) Bd.push(C.vb(0, 0, hip + 1, hip + 1, cd, cd, '#e7c35a', { paint: 1 }));
}

// ============================================================ body: tops
function torso(C, col, o = {}) {
  const { D } = C, cw = D.cw + (o.wide || 0), cd = D.cd + (o.deep || 0);
  const j0 = o.j0 ?? D.hipJ + 2, j1 = D.shJ;
  const out = D.hunch
    ? [C.box([0, (j0 + j1 - 3) / 2, 0], [cw + 0.45, (j1 - 3 - j0) / 2 + 0.45, cd + 0.45], col, { round: 1.5 }),
      C.box([0, j1 - 1.5, 1], [cw + 0.45, 1.95, cd + 0.45], col, { round: 1.5 })]
    : [C.box([0, (j0 + j1) / 2, 0], [cw + 0.45, (j1 - j0) / 2 + 0.45, cd + 0.45], col, { round: o.round ?? 1.6 })];
  // sloped shoulders: drop the top outer column
  out.push(C.vb(cw, cw, j1, j1, -cd - 1, cd + 2, col, { sub: 1, m: 1 }));
  return out;
}

function buildTop(C) {
  const { D, L } = C, Bd = C.parts.body, st = L.top.style, cw = D.cw, cd = D.cd, hip = D.hipJ, sh = D.shJ, hk = D.hz;
  const add = (...s) => Bd.push(...s);
  // paint helpers on the torso's front / back / all-around surfaces (handles the elderly stoop)
  const front = (i0, i1, j0, j1, col, o) => add(C.vb(i0, i1, j0, j1, cd, cd + hk, col, Object.assign({ paint: 1 }, o)));
  const back = (i0, i1, j0, j1, col, o) => add(C.vb(i0, i1, j0, j1, -cd, -cd + hk, col, Object.assign({ paint: 1 }, o)));
  const ring = (j0, j1, col, o) => add(C.vb(-cw - 1, cw + 1, j0, j1, -cd - 1, cd + 2, col, Object.assign({ paint: 1 }, o)));
  const sides = (j0, j1, col, o) => add(C.vb(cw, cw, j0, j1, -cd, cd + hk, col, Object.assign({ paint: 1, m: 1 }, o)));
  const neck = () => front(-1, 1, sh, sh, 's');
  const glow = L.top.glow;
  C.sleeve = 'long';
  switch (st) {
    case 'hoodie': {
      add(...torso(C, 't', { j0: hip + 1 }));
      ring(hip + 1, hip + 1, 'T');                                // ribbed hem
      front(-2, 2, hip + 2, hip + 3, 'T');                        // kangaroo pocket
      front(-1, 1, sh, sh, 'T');                                  // neck opening
      // hood bunched behind the shoulders
      add(C.ell([0, sh - 1.6, -cd - 1.6], [cw - 0.3, 2.1, 1.6], 't', { belly: 'T', bellyT: 0.3 }));
      add(C.ell([0, sh - 0.8, -cd - 2.4], [cw - 1.4, 1.1, 0.9], 'T', { paint: 1 }));
      if (L.top.ears === 'panda') add(C.sph([2.3, sh - 0.6, -cd - 3.2], 1.05, '#1f1d24', { m: 1 }));
      if (L.top.ears === 'cat') add(C.cap([2.2, sh - 1, -cd - 2.8], [2.6, sh + 0.8, -cd - 3.4], 1.1, 0.3, 't', { m: 1 }));
      C.decal('body', [0, sh - 1.3, cd + 0.5 + hk], [0, 0, 1], ['w.w', 'w.w', 'w.w', 'w.w'], { w: L.top.strings || '#fbfbf6' }, 0.42, { snap: false, lift: 0.04 });
      if (L.top.graphic) chestGraphic(C, L.top.graphic, sh - 3.6);
      break;
    }
    case 'jacket': { // 2050 trainer jacket: colour-blocked yoke + side panels, V inner, neon zip, glowing back emblem
      add(...torso(C, 't'));
      ring(sh - 1, sh, 't2');                                     // yoke
      sides(hip + 2, sh - 2, 't2');                               // side panels
      ring(hip + 2, hip + 2, 't2');                               // hem band
      front(-1, 1, sh - 1, sh, 't3'); front(0, 0, sh - 2, sh - 2, 't3');            // inner tee V
      front(0, 0, hip + 2, sh - 3, glow || 'w', { glow: glow ? 1 : 0 });             // zip line
      front(-2, -2, hip + 3, hip + 4, 'T'); front(2, 2, hip + 3, hip + 4, 'T');       // pockets
      backEmblem(C, L.top.emblem || 'bolt', sh - 3.6, glow || L.top.color2 || '#fff');
      C.flags.cuff = 't2'; C.flags.cuffGlow = glow;
      break;
    }
    case 'tracksuit': {
      add(...torso(C, 't'));
      front(0, 0, hip + 2, sh, 't2');                             // zip
      ring(sh, sh, 't2');                                         // collar
      front(-1, 1, sh, sh, 't');
      sides(hip + 2, sh - 1, 't2');                               // side stripes
      ring(hip + 2, hip + 2, 't2');
      C.flags.armStripe = L.top.color2 || '#fbfbf6';
      if (L.top.emblem) backEmblem(C, L.top.emblem, sh - 3.6, L.top.color2 || '#fbfbf6');
      break;
    }
    case 'leather': { // studded biker jacket over a tee, back patch
      add(...torso(C, 't'));
      front(-1, 1, sh - 1, sh, 't3'); front(0, 0, sh - 2, sh - 2, 't3');            // tee V
      front(-3, -2, sh - 2, sh, 'tl'); front(2, 3, sh - 2, sh, 'tl');                 // lapels
      front(-3, -3, sh, sh, 'si'); front(3, 3, sh, sh, 'si'); front(-2, -2, sh - 2, sh - 2, 'si'); front(2, 2, sh - 2, sh - 2, 'si');
      for (let j = hip + 2; j <= sh - 3; j++) front(1, 1, j, j, 'si');              // offset zip
      ring(hip + 2, hip + 2, 'T');
      front(-1, -1, hip + 2, hip + 2, 'si');
      if (L.top.patch !== false) backPatch(C, sh - 3.8);
      C.flags.studs = true;
      break;
    }
    case 'vest': { // sleeveless denim vest over a tee, patches
      C.sleeve = 'none';
      add(...torso(C, 't'));
      front(-1, 1, hip + 2, sh, 't2');                            // tee underneath
      front(-2, -2, hip + 2, sh, 'tl'); front(2, 2, hip + 2, sh, 'tl');
      ring(hip + 2, hip + 2, 'tl', { dither: { col: 'w', amt: 0.3 } });
      sides(sh - 1, sh, 'tl', { dither: { col: 'w', amt: 0.35 } });
      C.decal('body', [-2.6, sh - 3.2, cd + 0.5], [0, 0, 1], ['rrrr', 'ryyr', 'rrrr'], { r: '#e8434f', y: '#ffd33b' }, 0.42, { snap: false, lift: 0.04 });
      C.decal('body', [2.7, hip + 3.6, cd + 0.5], [0, 0, 1], ['kkk', 'kgk', 'kkk'], { k: '#1d1a24', g: '#62d36b' }, 0.42, { snap: false, lift: 0.04 });
      backPatch(C, sh - 3.6, 'riff');
      break;
    }
    case 'tank': {
      C.sleeve = 'none';
      add(...torso(C, 't'));
      front(-1, 1, sh, sh, 's'); back(-1, 1, sh, sh, 's');
      sides(sh - 1, sh, 's'); add(C.vb(cw - 1, cw - 1, sh, sh, -cd, cd, 's', { paint: 1, m: 1 }));
      break;
    }
    case 'labcoat': {
      add(...torso(C, 't'));
      front(-1, 1, sh - 3, sh, 't2'); front(0, 0, sh - 4, sh - 1, 't3');            // shirt + tie
      front(-2, -2, hip + 2, sh, 'T'); front(2, 2, hip + 2, sh, 'T');                 // lapel edges
      front(-3, -3, hip + 4, hip + 4, 'T'); front(3, 3, sh - 3, sh - 3, 'T');
      front(3, 3, sh - 2, sh - 2, '#3a8bff');                     // pen
      const tl = Math.round(D.torso * 0.6);
      add(C.vb(-cw, cw, hip - tl, hip + 1, -cd, cd, 't'));          // coat tails, open at the front
      add(C.vb(-1, 1, hip - tl, hip + 1, 1, cd, 'b', { sub: 1 }));
      add(C.vb(-cw, cw, hip - tl, hip - tl, -cd, cd, 'T', { paint: 1 }));
      add(C.vb(0, 0, hip - tl, hip - 2, -cd, -cd, 'T', { paint: 1 }));
      break;
    }
    case 'apron': {
      add(...torso(C, 't2'));
      neck();
      C.sleeve = 'short';
      C.flags.apron = { color: 't', len: Math.round(D.torso * 0.45) };
      break;
    }
    case 'suit': {
      add(...torso(C, 't'));
      front(-1, 1, sh - 3, sh, 't2');                             // shirt V
      front(0, 0, sh - 4, sh - 1, 't3');                          // tie
      front(-2, -2, sh - 3, sh, 'T'); front(2, 2, sh - 3, sh, 'T');                   // lapels
      front(0, 0, hip + 3, hip + 3, '#20202a');
      C.flags.cuff = 't2';
      break;
    }
    case 'happi': { // festival coat: contrasting collar band, obi, wide sleeves, crest on the back
      add(...torso(C, 't'));
      front(-1, 1, hip + 3, sh, L.top.inner || 's');
      front(-2, -2, hip + 2, sh, 't2'); front(2, 2, hip + 2, sh, 't2'); back(-2, 2, sh, sh, 't2');
      ring(hip + 2, hip + 3, 't3');                               // obi
      C.decal('body', [-2, sh - 2.4, cd + 0.5 + hk], [0, 0, 1], ['w', '.', 'w', 'w'], { w: '#fbfbf6' }, 0.36, { snap: false, lift: 0.04 });
      C.decal('body', [2, sh - 2.4, cd + 0.5 + hk], [0, 0, 1], ['w', 'w', '.', 'w'], { w: '#fbfbf6' }, 0.36, { snap: false, lift: 0.04 });
      backEmblem(C, 'matsuri', sh - 3.6, L.top.color2 || '#fbfbf6');
      C.sleeve = 'wide';
      break;
    }
    case 'uniform': { // staff polo: collar, placket, name tag
      add(...torso(C, 't'));
      front(-2, 2, sh, sh, 't2'); back(-2, 2, sh, sh, 't2'); front(0, 0, sh, sh, 's');
      front(0, 0, sh - 3, sh - 1, 't2');
      ring(hip + 2, hip + 2, 'T');
      if (!L.acc.badge && L.top.tag !== false) C.decal('body', [2.1, sh - 2.4, cd + 0.5 + hk], [0, 0, 1], ['wwww', 'wkkw', 'wwww'], { w: '#fbfbf6', k: '#5a6170' }, 0.42, { snap: false, lift: 0.04 });
      C.sleeve = 'short'; C.flags.cuff = 't2';
      break;
    }
    case 'sailor': {
      add(...torso(C, 't'));
      ring(sh - 1, sh, 't2'); back(-cw, cw, sh - 3, sh, 't2'); back(-cw + 1, cw - 1, sh - 3, sh - 3, 'w');
      front(-1, 1, sh, sh, 's'); front(0, 0, sh - 1, sh - 1, 's');
      front(-1, 1, sh - 2, sh - 2, 't3'); front(0, 0, sh - 3, sh - 3, 't3');         // scarf knot
      C.flags.cuff = 't2';
      break;
    }
    case 'gakuran': {
      add(...torso(C, 't'));
      front(-2, 2, sh, sh, 'T'); back(-2, 2, sh, sh, 'T');
      for (let j = hip + 3; j <= sh - 1; j += 2) front(0, 0, j, j, '#e7c35a');
      ring(hip + 2, hip + 2, 'T');
      break;
    }
    case 'kimono': case 'gi': {
      add(...torso(C, 't'));
      // crossover collar (left over right) — lining band + skin V
      front(-1, 1, sh, sh, 's'); front(0, 0, sh - 1, sh - 1, 's');
      front(-2, -2, sh, sh, 't2'); front(2, 2, sh, sh, 't2'); front(-1, -1, sh - 1, sh - 1, 't2'); front(1, 1, sh - 1, sh - 1, 't2');
      for (let n = 0; n <= 3; n++) front(n, n, sh - 2 - n, sh - 2 - n, 't2');
      back(-2, 2, sh, sh, 't2');
      if (st === 'kimono') {
        ring(hip + 2, hip + 4, 't3');                             // wide obi
        ring(hip + 3, hip + 3, L.top.obiCord || '#ffd33b');
        add(C.box([0, hip + 3.5, -cd - 1.1], [2.4, 1.5, 0.9], 't3', { round: 0.7 }));   // obi bow
        C.sleeve = 'wide';
        if (L.bottom.style !== 'hakama') {
          C.legWear = 'hidden';
          add(C.cap([0, hip + 2, -0.2], [0, 2.3, -0.1], cw + 0.5, cw + 0.9, 't'));
          add(C.vb(-cw - 2, cw + 2, 2, 2, -cd - 2, cd + 2, 't2', { paint: 1 }));
          add(C.vb(1, 1, 2, hip + 1, cd, cd + 2, 't2', { paint: 1 }));
        }
      } else { ring(hip + 2, hip + 2, 't3'); front(-1, -1, hip + 1, hip + 1, 't3'); C.sleeve = 'gi'; }
      break;
    }
    case 'field': { // khaki field shirt: collar, flap pockets, rolled sleeves
      add(...torso(C, 't'));
      front(-2, 2, sh, sh, 'T'); back(-2, 2, sh, sh, 'T'); front(-1, 1, sh, sh, 's'); front(0, 0, sh - 1, sh - 1, 's');
      front(-2, -1, sh - 3, sh - 2, 'T'); front(1, 2, sh - 3, sh - 2, 'T');
      front(-2, -1, sh - 2, sh - 2, 't2'); front(1, 2, sh - 2, sh - 2, 't2');
      front(0, 0, hip + 2, sh - 2, 'T');
      ring(hip + 2, hip + 2, 'T');
      if (L.top.patch) C.decal('armL', [D.armI1 + 0.5, sh - 2.5, -0.5], [1, 0, 0], ['.gg.', 'gyyg', 'gyyg', '.gg.'], { g: L.top.patch, y: '#ffd33b' }, 0.4, { lift: 0.3 });
      C.sleeve = 'rolled';
      break;
    }
    case 'cardigan': {
      add(...torso(C, 't'));
      ring(hip + 2, sh, 't', { dither: { col: 'tl', amt: 0.22 } });
      front(-1, 1, sh - 2, sh, 't2'); front(0, 0, sh, sh, 's');
      front(-2, -2, hip + 2, sh, 'T'); front(2, 2, hip + 2, sh, 'T');
      for (let j = hip + 3; j <= sh - 3; j += 2) front(-2, -2, j, j, '#efe2c2');
      ring(hip + 2, hip + 2, 'T');
      break;
    }
    case 'sweater': {
      add(...torso(C, 't'));
      if (L.top.stripes) ring(hip + 2, sh, 't', { stripes: { axis: 'y', p: 2, w: 1, col: 't2', o: 0.5 } });
      front(-2, 2, sh, sh, 'T'); back(-2, 2, sh, sh, 'T');
      ring(hip + 2, hip + 2, 'T');
      if (L.top.graphic) chestGraphic(C, L.top.graphic, sh - 3.4);
      break;
    }
    case 'hawaiian': {
      add(...torso(C, 't'));
      ring(hip + 2, sh, 't', { spots: L.top.pattern === 'leopard' ? { col: 't2', d: 0.42, s: 0.62, seed: 5 } : { col: 't2', d: 0.34, s: 1.0, seed: 3 } });
      front(-1, 1, sh - 1, sh, 's'); front(0, 0, sh - 2, sh - 2, 's');
      front(-2, -2, sh - 2, sh, 'T'); front(2, 2, sh - 2, sh, 'T');
      C.sleeve = 'short';
      break;
    }
    case 'hivis': {
      add(...torso(C, 't2'));
      ring(hip + 2, sh, 't');
      ring(hip + 4, hip + 4, '#eef4f6', { glow: 1 });
      front(-1, 1, sh - 1, sh, 't2'); front(0, 0, sh - 2, sh - 2, 't2');
      C.sleeve = 'short'; C.flags.sleeveCol = 't2';
      break;
    }
    case 'dress': { // idol dress: bodice, white frill collar, chest bow
      add(...torso(C, 't'));
      ring(sh, sh, 'w'); front(-1, 1, sh, sh, 's');
      add(C.box([0, sh - 1.5, cd + 0.8 + hk], [1.6, 0.7, 0.45], 't2'));                // bow
      add(C.vb(0, 0, sh - 1, sh - 2, cd + 1 + hk, cd + 1 + hk, 't3'));
      ring(hip + 2, hip + 2, 't2');
      C.sleeve = 'puff';
      break;
    }
    case 'tee': default: {
      add(...torso(C, 't'));
      neck(); back(-1, 1, sh, sh, 'T');
      C.sleeve = L.top.sleeves || 'short';
      if (L.top.graphic) chestGraphic(C, L.top.graphic, sh - 3.2);
      break;
    }
  }
  if (C.flags.overalls) {
    front(-2, 2, hip + 2, sh - 3, 'b'); front(-2, -2, sh - 2, sh, 'b'); front(2, 2, sh - 2, sh, 'b');
    back(-2, -2, hip + 2, sh, 'b'); back(2, 2, hip + 2, sh, 'b');
    front(-2, -2, sh - 3, sh - 3, '#e7c35a'); front(2, 2, sh - 3, sh - 3, '#e7c35a');
    front(-1, 1, hip + 3, hip + 4, 'B');
  }
}

// chest graphic decals (tees / hoodies)
const GRAPHICS = {
  heart: ['.p.p.', 'ppppp', 'ppppp', '.ppp.', '..p..'],
  star: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.'],
  bolt: ['..yy', '.yy.', 'yyyy', '.yy.', 'yy..'],
  takoyaki: ['.ooo.', 'obobo', 'ooooo', 'obobo', '.ooo.'],
  smile: ['.yyy.', 'ykyky', 'yyyyy', 'ykkky', '.yyy.'],
  stone: ['..c..', '.ccc.', 'cwccc', '.ccc.', '..c..'],
  beetle: ['k....', '.k.b.', '.bbbb', 'bbobb', '.b.b.'],
};
const GRAPHIC_CMAP = { p: '#ff5d7c', y: '#ffd33b', o: '#d78a3c', b: '#5a2e1c', k: '#1d1a24', c: '#38f0ff', w: '#ffffff' };
function chestGraphic(C, g, y) {
  const rows = GRAPHICS[g] || GRAPHICS.star;
  C.decal('body', [0, y, C.D.cd + 0.5 + C.D.hz], [0, 0, 1], rows, GRAPHIC_CMAP, 0.5, { snap: false, lift: 0.05 });
}
// glowing back emblems
const EMBLEMS = {
  bolt: ['....gg', '...gg.', '..gg..', '.ggggg', '...gg.', '..gg..', '.gg...', 'gg....'],
  stone: ['...g...', '..ggg..', '.gg.gg.', 'gg...gg', '.gg.gg.', '..ggg..', '...g...'],
  wing: ['g.....g', 'gg...gg', 'ggg.ggg', '.ggggg.', '..ggg..', '...g...'],
  matsuri: ['.ggggg.', 'g.....g', 'g.ggg.g', 'g.g.g.g', 'g.ggg.g', 'g.....g', '.ggggg.'],
  whistle: ['ggggg', 'g...g', 'g.g.g', 'g...g', 'ggggg'],
};
function backEmblem(C, e, y, col) {
  const rows = EMBLEMS[e] || EMBLEMS.bolt;
  const glow = /^#/.test(col) && lum(col) > 0.5 && e !== 'matsuri' ? 2 : 0;
  C.decal('body', [0, y, -C.D.cd - 0.5], [0, 0, -1], rows, { g: glow ? { c: col, glow } : col }, 0.5, { snap: false, lift: 0.05 });
}
// punk back patch: skull + lightning
function backPatch(C, y, kind) {
  const rows = kind === 'riff'
    ? ['kkkkkkk', 'kwwwwwk', 'kwkwkwk', 'kwwwwwk', 'kkwwwkk', 'krkrkrk', 'kkkkkkk']
    : ['kkkkkkkkk', 'kkwwwwwkk', 'kwwwwwwwk', 'kwkkwkkwk', 'kwkkwkkwk', 'kwwwywwwk', 'kkwyyywkk', 'kkwywywkk', 'kkkkykkkk', 'kkkykkkkk', 'kkkkkkkkk'];
  C.decal('body', [0, y - (kind === 'riff' ? 0 : 0.6), -C.D.cd - 0.5], [0, 0, -1], rows,
    { k: '#1d1a24', w: '#f2efe6', y: { c: '#ffd33b', glow: 2 }, r: '#e8434f' }, 0.5, { snap: false, lift: 0.05 });
}

// ============================================================ arms
function buildArms(C) {
  const { D, L } = C, sl = C.sleeve, sc = C.flags.sleeveCol || 't';
  const handCol = L.acc.gloves ? (L.acc.gloves.color || '#2b2b33') : 's';
  for (const s of [1, -1]) {
    const A = C.arm(s);
    const i0 = s * D.armI0, i1 = s * D.armI1, io = s > 0 ? D.armI1 : -D.armI1;
    const k0 = D.armK0, k1 = D.armK1;
    const top = D.shJ - 1, wr = D.handJ1 + 1, h0 = D.handJ0, h1 = D.handJ1;
    A.push(C.vb(i0, i1, wr, top, k0, k1, 's'));
    if (sl === 'long' || sl === 'wide' || sl === 'gi') A.push(C.vb(i0, i1, wr, top, k0, k1, sc, { paint: 1 }));
    if (sl === 'long') A.push(C.vb(i0, i1, wr, wr, k0, k1, C.flags.cuffGlow || C.flags.cuff || 'T', { paint: 1, glow: C.flags.cuffGlow ? 1 : 0 }));
    if (sl === 'short' || sl === 'puff') A.push(C.vb(i0, i1, top - 2, top, k0, k1, sc, { paint: 1 }));
    if (sl === 'short' && C.flags.cuff) A.push(C.vb(i0, i1, top - 2, top - 2, k0, k1, C.flags.cuff, { paint: 1 }));
    if (sl === 'puff') A.push(C.vb(i0, i1 + s, top - 2, top - 1, k0 - 1, k1 + 1, 't'), C.vb(i0, i1 + s, top - 2, top - 2, k0 - 1, k1 + 1, 'w', { paint: 1 }));
    if (sl === 'rolled') A.push(C.vb(i0, i1, top - 4, top, k0, k1, sc, { paint: 1 }), C.vb(i0, i1, top - 4, top - 4, k0, k1, 'tl', { paint: 1 }));
    if (sl === 'gi') A.push(C.vb(i0, i1, wr, wr + 2, k0, k1, 's', { paint: 1 }));
    if (sl === 'wide') { // hanging kimono / happi sleeve
      A.push(C.vb(i0, i1 + s, wr, wr + 3, k0 - 1, k1 + 1, sc));
      A.push(C.vb(i0, i1 + s, wr, wr, k0 - 1, k1 + 1, 't2', { paint: 1 }));
    }
    if (C.flags.armStripe && sl === 'long') A.push(C.vb(io, io, wr + 1, top, k0, k1, C.flags.armStripe, { paint: 1, side: C.flags.armStripe, sideT: 0.5, front: sc, back: sc }));
    if (C.flags.studs) for (const k of [k0, k1]) A.push(C.vb(io, io, top + 1, top + 1, k, k, 'si'));
    // hand
    A.push(C.vb(i0, i1, h0, h1, k0, k1, handCol));
    if (L.acc.gloves && L.acc.gloves.style === 'fingerless') A.push(C.vb(i0, i1, h0, h0, k0, k1, 's', { paint: 1 }));
    // tattoo sleeves on bare upper arms
    if (L.face.tattoo && sl !== 'long') A.push(C.vb(i0, i1, top - 6, top - 1, k0, k1, L.face.tattoo, { paint: 1, stripes: { axis: 'y', p: 2, w: 1, col: L.face.tattoo }, dither: { col: 's', amt: 0.3 } }));
  }
}

// ============================================================ head & hair
function headGeo(C) {
  const D = C.D;
  const G = { J0: D.J0, J1: D.J1, z: D.hz, fz: D.faceZ, c: (D.J0 + D.J1) / 2, small: D.skullH < 10 };
  G.lo = D.browY + 0.5;              // lowest a fringe may hang over the brows
  G.win = D.J1 - 1;                  // face window carved up to this row (fringe styles)
  G.hl = D.hairline;                 // hairline for fringe-less styles
  G.kf = Math.round(G.fz + 0.5);     // voxel layer just in front of the face
  return G;
}

// rounded hair helmet around the skull (added BEFORE the skull); ext = thickness, lift = extra volume on top
function shell(C, G, o = {}) {
  const ext = o.ext ?? 1, bot = o.bot ?? G.J0, top = G.J1 + ext + (o.lift ?? 1);
  const back = o.back || 0, wide = o.wide || 0;
  return C.box([0, (bot + top) / 2, G.z - 0.3 - back * 0.5], [4.45 + ext + wide, (top - bot) / 2 + 0.45, 4.4 + ext + back * 0.5], 'h',
    Object.assign({ round: o.round ?? 2.8, belly: 'H', bellyT: 0.45, noise: o.noise, noiseScale: o.noiseScale ?? 1.6 }, o.opts));
}
// carve the hair in front of the face (cols −w..w) up to row `top`
const faceWindow = (C, G, top = G.win, w = 4) => C.vb(-w, w, G.J0 - 3, top, 1 + G.z, 10 + G.z, 'h', { sub: 1 });
// open the shell exactly where the ears go (short styles)
const earCut = (C, G) => C.vb(5, 7, G.J0 + 1, G.J0 + 4, -1 + G.z, 0 + G.z, 'h', { sub: 1, m: 1 });
// fringe: one voxel layer in front of the forehead; edge = jagged bottom outline from x=+5 to x=−5
function bangs(C, G, edge, o = {}) {
  const top = G.J1 + 1.5, pts = [[-5.0, top], [5.0, top], ...edge];
  return C.poly([0, 0, G.kf + (o.dz || 0)], pts, 0.45 + (o.thick || 0), 'h', { plane: 'xy', belly: 'H', bellyT: 0.5 });
}
const spike = (C, a, b, r0, r1 = 0.35, o = {}) => C.cap(a, b, r0, Math.max(r1, 0.55), 'h', Object.assign({ belly: 'H', bellyT: 0.45 }, o));
const tipOpt = (C) => (C.L.hair.color2 ? { tip: 'h2', tipT: 0.5 } : {});
// side locks hanging in front of the ears
const sideLocks = (C, G, low = G.J0 + 1, r = 1.25) => [spike(C, [4.9, G.J0 + 5.5, G.z + 2], [5.2, low, G.z + 2.6], r, 0.45), spike(C, [-4.9, G.J0 + 5.5, G.z + 2], [-5.2, low, G.z + 2.6], r, 0.45)];

// fringe outlines (x from +5 → −5); y relative to G.lo (lowest-over-brows) unless absolute
const FRINGE = {
  spiky: (G) => { const l = G.lo; return [[5, l - 2.4], [4.1, l + 0.4], [3.2, l], [2.4, l + 1.0], [1.5, l - 0.1], [0.7, l + 1.0], [0, l - 1.6], [-0.7, l + 0.9], [-1.6, l], [-2.5, l + 1.1], [-3.4, l + 0.05], [-4.2, l + 0.6], [-5, l - 2.2]]; },
  messy: (G) => { const l = G.lo; return [[5, l - 1.6], [3.9, l + 0.3], [2.9, l - 0.1], [1.8, l + 0.9], [0.5, l - 0.7], [-0.7, l + 0.7], [-2.0, l - 0.1], [-3.2, l + 0.8], [-4.2, l - 0.2], [-5, l - 1.4]]; },
  blunt: (G) => [[5, G.lo - 0.1], [-5, G.lo - 0.1]],
  curtain: (G) => { const l = G.lo; return [[5, l - 3.0], [3.6, l + 0.2], [1.6, l + 1.2], [0.5, G.J1 - 0.5], [-0.5, G.J1 - 0.5], [-1.6, l + 1.2], [-3.6, l + 0.2], [-5, l - 3.0]]; },
  swoop: (G) => { const l = G.lo; return [[5, l + 2.2], [3.2, l + 1.7], [1.2, l + 0.9], [-0.8, l + 0.1], [-2.6, l - 0.1], [-3.9, l - 0.6], [-5, l - 2.6]]; },
  wispy: (G) => { const l = G.lo; return [[5, l - 2.0], [3.6, l + 0.2], [2.4, l - 0.1], [1.2, l + 0.8], [0, l - 0.4], [-1.2, l + 0.8], [-2.4, l - 0.1], [-3.6, l + 0.2], [-5, l - 2.0]]; },
};

const HAIR = {
  spiky(C, G, pre, post, top) {
    pre.push(shell(C, G), faceWindow(C, G), earCut(C, G));
    const z = G.z, J1 = G.J1, c = G.c, t = tipOpt(C);
    top(spike(C, [0, J1 + 1, z - 0.8], [0.4, J1 + 5.2, z - 3.6], 2.7, 0.35, t));
    top(spike(C, [2.8, J1 + 0.6, z - 0.4], [5.4, J1 + 3.6, z - 2.6], 2.4, 0.35, t));
    top(spike(C, [-2.8, J1 + 0.6, z - 0.4], [-5.2, J1 + 3.9, z - 2.9], 2.4, 0.35, t));
    top(spike(C, [1.6, J1 + 1, z + 2.4], [2.8, J1 + 3.6, z + 4.4], 2.1, 0.35, t));
    top(spike(C, [-1.8, J1 + 1, z + 2.2], [-3.0, J1 + 3.3, z + 4.0], 2.0, 0.35, t));
    post.push(spike(C, [4.4, c + 2.5, z - 1.5], [8.2, c + 3.4, z - 3.6], 2.0, 0.35, t));
    post.push(spike(C, [-4.4, c + 2.5, z - 1.5], [-8.2, c + 3.0, z - 3.4], 2.0, 0.35, t));
    post.push(spike(C, [0, c + 1.5, z - 4.4], [0.4, c + 0.6, z - 8.6], 2.4, 0.35, t));
    post.push(spike(C, [3.0, c - 1.2, z - 4.2], [5.0, c - 3.2, z - 7.4], 2.0, 0.35, t));
    post.push(spike(C, [-3.0, c - 1.2, z - 4.2], [-5.0, c - 3.0, z - 7.2], 2.0, 0.35, t));
    post.push(...sideLocks(C, G, G.J0 + 1.5, 1.3));
    post.push(bangs(C, G, FRINGE.spiky(G)));
  },
  messy(C, G, pre, post, top) {
    pre.push(shell(C, G, { noise: 0.28, noiseScale: 1.5 }), faceWindow(C, G), earCut(C, G));
    const z = G.z, J1 = G.J1;
    top(spike(C, [1, J1 + 1, z - 1], [1.9, J1 + 3.6, z - 2.8], 2.0, 0.5));
    top(spike(C, [-1.8, J1 + 1, z], [-3.2, J1 + 3.0, z - 1.2], 1.9, 0.5));
    top(spike(C, [3, J1, z + 1.2], [4.8, J1 + 1.8, z + 2.4], 1.6, 0.5));
    post.push(spike(C, [0, G.c, z - 4.6], [0.6, G.c - 1.8, z - 7.0], 1.9, 0.5));
    post.push(spike(C, [3.6, G.c - 1.5, z - 3.6], [5.8, G.c - 3.2, z - 5.0], 1.6, 0.4));
    post.push(spike(C, [-3.6, G.c - 1.5, z - 3.6], [-5.8, G.c - 2.8, z - 5.2], 1.6, 0.4));
    post.push(...sideLocks(C, G, G.J0 + 1.5));
    post.push(bangs(C, G, FRINGE.messy(G)));
  },
  bob(C, G, pre, post) {
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.J0 - 1, round: 2.2, wide: 0.4 }), faceWindow(C, G));
    pre.push(C.vb(-6, 6, G.J0 - 1, G.J0 - 1, -7 + G.z, 6 + G.z, 'H', { paint: 1 }));
    post.push(bangs(C, G, FRINGE.blunt(G)));
  },
  hime(C, G, pre, post) {
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.J0 - 1, round: 2.0, wide: 0.3 }), faceWindow(C, G));
    post.push(bangs(C, G, FRINGE.blunt(G)));
    post.push(C.vb(4, 5, G.J0 - 1, G.J0 + 5, 1 + G.z, G.kf, 'h', { m: 1, belly: 'H' }));          // straight side locks
    post.push(C.box([0, G.J0 - 3.5, G.z - 4.1], [5.4, 4.2, 1.5], 'h', { round: 0.9, belly: 'H', bellyT: 0.4 }));
  },
  long(C, G, pre, post) {
    C.earsVisible = false;
    pre.push(shell(C, G, { bot: G.J0 - 1, wide: 0.3 }), faceWindow(C, G));
    post.push(bangs(C, G, FRINGE.curtain(G)));
    post.push(C.box([0, G.J0 - 3.0, G.z - 4.1], [5.4, 4.0, 1.5], 'h', { round: 1.3, belly: 'H', bellyT: 0.4 }));
    post.push(spike(C, [4.8, G.J0 + 4.5, G.z + 1.4], [5.1, G.J0 - 4.2, G.z + 1.2], 1.4, 0.8), spike(C, [-4.8, G.J0 + 4.5, G.z + 1.4], [-5.1, G.J0 - 4.2, G.z + 1.2], 1.4, 0.8));
  },
  ponytail(C, G, pre, post) {
    pre.push(shell(C, G, { lift: 0.5 }), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.swoop(G)));
    post.push(...sideLocks(C, G, G.J0 + 1, 1.1));
    const piv = [0, G.J1 - 0.5, G.z - 5.4];
    C.extra.push({ n: 'hairTail', parent: 'head', p: C.P(...piv), sway: { axis: 'z', amp: 0.12, freq: 1.3, move: 1.5 }, s: [
      C.sph([0, G.J1 - 0.5, G.z - 5.6], 1.3, 'h2'),
      spike(C, [0, G.J1, G.z - 6.4], [0, G.J1 - 0.5, G.z - 9.4], 2.3, 2.3),
      spike(C, [0, G.J1 - 0.5, G.z - 9.4], [0, G.c - 2.5, G.z - 9.8], 2.3, 1.7),
      spike(C, [0, G.c - 2.5, G.z - 9.8], [0, G.J0 - 4.5, G.z - 8.6], 1.7, 0.6),
    ] });
  },
  twin_buns(C, G, pre, post, top) {
    pre.push(shell(C, G, { lift: 0.5 }), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.wispy(G)));
    post.push(...sideLocks(C, G, G.J0 + 0.5, 1.15));
    top(C.sph([3.7, G.J1 + 1.8, G.z - 1.2], 2.6, 'h', { m: 1, belly: 'H', bellyT: 0.35 }));
    top(C.tor([3.2, G.J1 + 0.1, G.z - 1.0], 1.8, 0.7, 'h2', { m: 1, rot: [0, 0, -22] }));
  },
  twin_tails(C, G, pre, post) {
    pre.push(shell(C, G, { lift: 0.5 }), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.wispy(G)));
    post.push(...sideLocks(C, G, G.J0 + 0.5, 1.15));
    for (const s of [1, -1]) {
      const piv = [s * 5.4, G.J1 - 0.5, G.z - 1.6];
      C.extra.push({ n: s > 0 ? 'hairL' : 'hairR', parent: 'head', p: C.P(...piv), sway: { axis: 'z', amp: 0.1, freq: 1.4, move: 1.5 }, s: [
        C.sph(piv, 1.2, 'h2'),
        spike(C, [s * 6.0, G.J1 - 0.6, G.z - 1.7], [s * 7.8, G.c - 1, G.z - 2.0], 2.1, 1.9),
        spike(C, [s * 7.8, G.c - 1, G.z - 2.0], [s * 7.0, G.J0 - 6, G.z - 2.2], 1.9, 0.6),
      ] });
    }
  },
  braid(C, G, pre, post) {
    pre.push(shell(C, G), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.messy(G)));
    post.push(...sideLocks(C, G, G.J0 + 1, 1.1));
    const piv = [0, G.J0 + 2, G.z - 5.2], s = [];
    for (let n = 0; n < 6; n++) s.push(C.sph([0, G.J0 + 1.4 - n * 1.6, G.z - 5.7 - Math.min(n, 2) * 0.35], n % 2 ? 1.2 : 1.55, n % 2 ? 'H' : 'h'));
    s.push(C.sph([0, G.J0 - 8.4, G.z - 6.4], 0.95, 'h2'), C.cap([0, G.J0 - 8.8, G.z - 6.4], [0, G.J0 - 10.6, G.z - 6.5], 1.2, 0.5, 'h'));
    C.extra.push({ n: 'hairTail', parent: 'head', p: C.P(...piv), sway: { axis: 'z', amp: 0.09, freq: 1.2, move: 1.4 }, s });
  },
  mohawk(C, G, pre, post) {
    C.flags.shaved = true;
    const z = G.z, J1 = G.J1, c = G.c;
    const g = { grad: { axis: 'y', to: C.L.hair.color2 ? 'h2' : 'hl', a: J1 + 2, b: J1 + 8 } };
    post.push(C.vb(-1, 1, G.c + 1, J1 + 1, -5 + z, 4 + z, 'h', { belly: 'H' }));                    // shaved-strip base
    post.push(spike(C, [0, J1, z + 3.2], [0, J1 + 5.2, z + 6.4], 1.6, 0.45, g));
    post.push(spike(C, [0, J1 + 0.5, z + 1.2], [0, J1 + 8.0, z + 2.4], 1.8, 0.45, g));
    post.push(spike(C, [0, J1 + 0.5, z - 1.2], [0, J1 + 8.6, z - 1.0], 1.8, 0.45, g));
    post.push(spike(C, [0, J1, z - 3.4], [0, J1 + 7.2, z - 5.0], 1.7, 0.45, g));
    post.push(spike(C, [0, c + 1.5, z - 5.0], [0, c + 4.0, z - 9.4], 1.6, 0.45, g));
  },
  buzz(C) { C.flags.buzz = true; },
  bald() { },
  side_part(C, G, pre, post) {
    pre.push(shell(C, G, { round: 3.0, lift: 1.2 }), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.swoop(G), { thick: 0.0 }));
    post.push(C.vb(2, 2, G.J1 + 1, G.J1 + 2, -4 + G.z, 3 + G.z, 'H', { paint: 1 }));              // the part line
    post.push(C.box([-0.8, G.J1 + 1.6, G.z + 1.8], [3.6, 1.0, 2.8], 'h', { round: 0.9, belly: 'H' })); // swoop volume
  },
  slick(C, G, pre, post) {
    pre.push(shell(C, G, { round: 3.0, lift: 0.8 }), faceWindow(C, G, G.hl + 1), earCut(C, G));
    post.push(C.vb(-6, 6, G.c, G.J1 + 2, -7 + G.z, 7 + G.z, 'h', { paint: 1, stripes: { axis: 'x', p: 2, w: 1, col: 'H', o: 0.5 }, top: 'h', topT: 0.8 }));
  },
  pixie(C, G, pre, post, top) {
    pre.push(shell(C, G, { noise: 0.12, lift: 0.2, round: 3.2 }), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.swoop(G).map(([x, y]) => [-x, y]).reverse()));
    top(spike(C, [0.6, G.J1 + 1, G.z - 1], [1.2, G.J1 + 3, G.z - 2.8], 1.7, 0.5));
    post.push(...sideLocks(C, G, G.J0 + 2, 1.1));
  },
  afro(C, G, pre) {
    C.earsVisible = false;
    pre.push(C.sph([0, G.c + 2.6, G.z - 1.2], 7.6, 'h', { noise: 0.6, noiseScale: 1.5, belly: 'H', bellyT: 0.45 }), faceWindow(C, G, G.hl));
  },
  curly(C, G, pre, post) {
    pre.push(shell(C, G, { lift: 0.5 }), C.ell([0, G.c + 1.6, G.z - 0.8], [6.1, 6.1, 6.1], 'h', { noise: 0.8, noiseScale: 1.1, belly: 'H', bellyT: 0.45, dither: { col: 'H', amt: 0.2 } }), faceWindow(C, G, G.hl), earCut(C, G));
    post.push(C.sph([-2.6, G.hl + 0.6, G.fz], 1.7, 'h', { noise: 0.4, noiseScale: 1 }), C.sph([0.4, G.hl + 1.0, G.fz + 0.1], 1.7, 'h', { noise: 0.4, noiseScale: 1 }), C.sph([3.0, G.hl + 0.5, G.fz], 1.6, 'h', { noise: 0.4, noiseScale: 1 }));
  },
  cap(C, G, pre, post) {
    pre.push(shell(C, G, { noise: 0.3 }), faceWindow(C, G), earCut(C, G));
    post.push(bangs(C, G, FRINGE.messy(G)));
    post.push(spike(C, [3.6, G.J0 + 3, G.z - 3.8], [5.2, G.J0 + 0.6, G.z - 4.6], 1.3, 0.4), spike(C, [-3.6, G.J0 + 3, G.z - 3.8], [-5.2, G.J0 + 0.6, G.z - 4.6], 1.3, 0.4));
  },
  bun(C, G, pre, post, top) {
    pre.push(shell(C, G, { round: 3.0, lift: 0.6 }), faceWindow(C, G, G.hl), earCut(C, G));
    post.push(C.poly([0, 0, G.kf], [[-5, G.J1 + 1.5], [5, G.J1 + 1.5], [5, G.hl - 1.5], [0.6, G.hl + 0.6], [-0.6, G.hl + 0.6], [-5, G.hl - 1.5]], 0.45, 'h', { plane: 'xy', belly: 'H', bellyT: 0.5 }));
    top(C.sph([0, G.J1 + 0.6, G.z - 5.6], 2.3, 'h', { belly: 'H', bellyT: 0.4, stripes: { axis: 'y', p: 1.5, w: 0.5, col: 'H' } }));
    top(C.tor([0, G.J1 + 0.1, G.z - 4.3], 1.5, 0.65, 'h2', { rot: [-70, 0, 0] }));
  },
  topknot(C, G, pre, post, top) {
    // bald crown, ring of hair at the back and sides, tiny knot
    pre.push(shell(C, G, { bot: G.J0 + 1, lift: 0 }), faceWindow(C, G, G.hl + 2), earCut(C, G));
    pre.push(C.vb(-7, 7, G.J1 - 1, G.J1 + 3, -3 + G.z, 8 + G.z, 'h', { sub: 1 }));
    C.flags.crownShine = true;
    top(C.sph([0, G.J1 + 1.3, G.z - 2.6], 1.3, 'h'));
    top(C.cap([0, G.J1 + 1.0, G.z - 3.0], [0, G.J1 + 0.4, G.z - 4.4], 0.75, 0.6, 'h2'));
  },
};

function buildHead(C) {
  const { L } = C, Hd = C.parts.head, G = headGeo(C), z = G.z;
  const style = L.hair.style;
  const pre = C.hairPre, post = C.hairPost;
  const top = (sh) => { if (!C.hat) post.push(sh); };   // features that would poke through a hat
  (HAIR[style] || HAIR.messy)(C, G, pre, post, top);
  Hd.push(...pre);
  // skull: rounded block; chin narrows one row; underside shaded
  Hd.push(C.box([0, G.c, z], [4.45, (G.J1 - G.J0) / 2 + 0.45, 4.45], 's', { round: 1.25 }));
  Hd.push(C.vb(4, 4, G.J0, G.J0, 1 + z, 4 + z, 's', { sub: 1, m: 1 }));
  Hd.push(C.vb(-4, 4, G.J0, G.J0, -4 + z, 4 + z, 'S', { paint: 1, belly: 'S', bellyT: 0.5, front: 's', frontT: 0.6 }));
  // ears
  if (C.earsVisible) Hd.push(C.vb(5, 5, G.J0 + 2, G.J0 + 4, -1 + z, 0 + z, 's', { m: 1 }), C.vb(5, 5, G.J0 + 3, G.J0 + 3, 0 + z, 0 + z, 'S', { m: 1, paint: 1 }));
  // scalp treatments
  if (C.flags.shaved) Hd.push(C.vb(-5, 5, G.J0 + 4, G.J1 + 1, -6 + z, 3 + z, 'sv', { paint: 1, dither: { col: mix(C.pal.s, C.pal.h, 0.3), amt: 0.2 } }));
  if (L.face.scalp) Hd.push(C.vb(-5, 5, G.J0 + 4, G.J1 + 1, -6 + z, 3 + z, L.face.scalp, { paint: 1, stripes: { axis: 'z', p: 3, w: 1, col: L.face.scalp, o: 0.5 }, dither: { col: 'h', amt: 0.0 } }));
  if (C.flags.buzz) {
    Hd.push(C.vb(-5, 5, G.J0 + 1, G.J1 + 1, -6 + z, 6 + z, 'h', { paint: 1, dither: { col: 'H', amt: 0.14 } }));
    Hd.push(C.vb(-4, 4, G.J0, G.hl - 1, 1 + z, 6 + z, 's', { paint: 1 }));                      // face
    Hd.push(C.vb(-5, 5, G.J0, G.J0 + 1, -6 + z, -1 + z, 's', { paint: 1, dither: { col: 'h', amt: 0.25 } })); // fade at the nape
    if (C.earsVisible) Hd.push(C.vb(5, 5, G.J0 + 2, G.J0 + 4, -1 + z, 0 + z, 's', { m: 1, paint: 1 }));
  }
  if (style === 'bald' || C.flags.crownShine) Hd.push(C.vb(1, 2, G.J1, G.J1, 0 + z, 1 + z, 'sl', { paint: 1 }));
  Hd.push(...post);
}

// ============================================================ face
const EYE_PX = { anime: 0.6, big: 0.55, round: 0.72, sharp: 0.62, fierce: 0.62, sleepy: 0.62, bead: 0.8, dot: 0.9, tall: 0.75, star: 0.6, cyclops: 0.45, visor: 0.6, goggle: 0.7 };
const EYE_W = { anime: 5, big: 6, round: 4, sharp: 5, fierce: 5, sleepy: 5, bead: 2, dot: 1, tall: 2, star: 5 };
const EYE_H = { anime: 5, big: 6, round: 4, sharp: 3, fierce: 4, sleepy: 3, bead: 2, dot: 1, tall: 4, star: 5 };
const BROWS = {
  soft: ['.kkk', 'k...'], thin: ['kkkk'], thick: ['kkkkk', 'kkkk.'], sharp: ['...kk', 'kkk..'],
  angry: ['...kk', '.kkk.', 'kk...'], worried: ['kk...', '.kkkk'], bushy: ['.kkkk.', 'kkkkkk', '....kk'],
};

function buildFace(C) {
  const { D, L } = C, f = L.face, G = headGeo(C), z = G.z, fz = G.fz;
  const es = L.eyes.style in EYE_PX ? L.eyes.style : 'anime';
  const px = L.eyes.px || EYE_PX[es], ew = (EYE_W[es] || 5) * px, eh = (EYE_H[es] || 5) * px;
  const ex = D.eyeX + (es === 'big' ? 0.15 : 0), ey = D.eyeY;
  let iris = L.eyes.iris;
  if ((es === 'sleepy' || es === 'round' || es === 'sharp' || es === 'fierce') && lum(iris) < 0.3) iris = mix(iris, '#c98a4a', 0.45);
  C.eyes = { part: 'head', at: C.P(ex, ey, fz), dir: [0, 0, 1], style: es, iris, px, snap: false, lift: 0.08 * C.u, cmap: L.eyes.cmap };
  const eTop = ey + eh / 2, eBot = ey - eh / 2, eOut = ex + ew / 2;
  // lashes / eyeliner flicks at the outer-top corner
  if (L.eyes.lashes || L.eyes.liner) {
    const rows = L.eyes.liner ? ['..kk', 'kkk.'] : ['.k', 'k.'];
    C.decal('head', [eOut + (L.eyes.liner ? 0.6 : 0.3), eTop - 0.05, fz], [0, 0, 1], rows, { k: '#16111c' }, 0.5, { mirror: true, snap: false, lift: 0.12 });
  }
  // brows (snap: they may sit on the fringe)
  const bs = f.brows === undefined ? 'soft' : f.brows;
  if (bs && bs !== 'none' && BROWS[bs]) {
    const bc = f.browColor || shade(L.hair.color, lum(L.hair.color) > 0.75 ? 0.92 : 0.62);
    const by = Math.max(D.browY, eTop + 0.9) + (bs === 'bushy' ? 0.2 : 0);
    C.decal('head', [ex + 0.15, by, fz], [0, 0, 1], BROWS[bs], { k: bc }, bs === 'thick' || bs === 'bushy' ? 0.55 : 0.5, { mirror: true, lift: 0.45 });
  }
  // blush
  if (f.blush) {
    const bc = typeof f.blush === 'string' ? f.blush : mix(L.skin, '#ff5f7e', 0.42);
    C.decal('head', [ex + 0.55, eBot - 0.55, fz], [0, 0, 1], f.blush === 'lines' ? ['b.b.b', '.b.b.'] : ['bbbb'], { b: f.blush === 'lines' ? mix(L.skin, '#ff5f7e', 0.55) : bc }, 0.42, { mirror: true, snap: false, lift: 0.1 });
  }
  // nose hint
  if (f.nose !== false) C.decal('head', [0.25, eBot - 0.35, fz], [0, 0, 1], f.nose === 'big' ? ['n.', 'nn'] : ['n'], { n: mix(L.skin, '#9a4a46', 0.45) }, 0.5, { snap: false, lift: 0.1 });
  if (f.freckles) C.decal('head', [ex - 0.1, eBot - 0.6, fz], [0, 0, 1], ['n.n', '.n.'], { n: mix(L.skin, '#8a4a2e', 0.45) }, 0.4, { mirror: true, snap: false, lift: 0.1 });
  if (f.scar) C.decal('head', [ex + 0.5, ey + 0.3, fz], [0, 0, 1], ['..n', '.n.', 'n..', '.n.'], { n: mix(L.skin, '#b0505a', 0.55) }, 0.45, { snap: false, lift: 0.14 });
  if (f.wrinkles) C.decal('head', [ex + ew / 2 + 0.35, ey - 0.2, fz], [0, 0, 1], ['n', '.', 'n'], { n: mix(L.skin, '#7a4a3e', 0.4) }, 0.4, { mirror: true, snap: false, lift: 0.1 });
  if (f.paint) C.decal('head', [ex + 0.3, eBot - 0.9, fz], [0, 0, 1], ['pp', 'pp', 'pp'], { p: f.paint }, 0.42, { mirror: true, snap: false, lift: 0.1 });
  // mouth
  let ms = C.mouthStyle || f.mouth || 'smile';
  let mcmap = C.mouthCmap || null;
  const g = L.acc.grillz;
  if (g) {
    ms = 'grin';
    const gc = g.style === 'silver' ? '#dfe6ef' : g.style === 'diamond' ? { c: '#bff6ff', glow: 1 } : (g.color || '#ffcf3a');
    mcmap = Object.assign({}, mcmap, { w: gc });
  }
  const Hd = C.parts.head;
  // facial hair (voxels / paint)
  const fc = 'm';
  if (f.stubble) Hd.push(C.vb(-4, 4, G.J0, G.J0 + 1, 0 + z, 4 + z, 'st', { paint: 1, dither: { col: 's', amt: 0.3 }, jit: 0.03 }), C.vb(-4, -4, G.J0 + 1, G.J0 + 3, -1 + z, 4 + z, 'st', { paint: 1, m: 1, dither: { col: 's', amt: 0.35 } }));
  if (f.beard === 'full') Hd.push(C.vb(-4, 4, G.J0 - 1, G.J0 + 1, 1 + z, 5 + z, fc), C.vb(-4, -4, G.J0, G.J0 + 4, -1 + z, 4 + z, fc, { m: 1, paint: 1 }), C.vb(-2, 2, G.J0 + 1, G.J0 + 1, 5 + z, 5 + z, 's', { sub: 1 }));
  if (f.beard === 'goatee') Hd.push(C.vb(-1, 1, G.J0 - 1, G.J0, 3 + z, 5 + z, fc));
  if (f.beard === 'long') {
    Hd.push(C.cap([0, G.J0 - 0.6, z + 4.0], [0, G.J0 - 6.5, z + 4.6], 3.0, 1.2, fc, { noise: 0.2, noiseScale: 1.2, dither: { col: shade(C.pal.m, 0.9), amt: 0.2 } }));
    Hd.push(C.vb(-4, -4, G.J0, G.J0 + 4, -1 + z, 4 + z, fc, { m: 1, paint: 1 }));
  }
  if (f.mustache === 'thick' || f.mustache === 'walrus') {
    const w = f.mustache === 'walrus' ? 3 : 2;
    Hd.push(C.vb(-w, w, Math.round(D.mouthY) + 1, Math.round(D.mouthY) + 1, Math.round(fz + 0.5), Math.round(fz + 0.5), fc));
    if (f.mustache === 'walrus') Hd.push(C.vb(-w, -w, Math.round(D.mouthY), Math.round(D.mouthY), Math.round(fz + 0.5), Math.round(fz + 0.5), fc, { m: 1 }));
  }
  if (f.mustache === 'thin') C.decal('head', [0, D.mouthY + 0.9, fz], [0, 0, 1], ['.kkk.kkk.', 'kk.....kk'], { k: C.pal.m }, 0.4, { snap: false, lift: 0.12 });
  // mouth decal (snaps onto a beard / mustache front when present)
  if (C.flags.masked) ms = 'none';
  const mY = f.beard === 'long' ? D.mouthY - 0.2 : f.mustache === 'thick' || f.mustache === 'walrus' ? D.mouthY - 0.5 : D.mouthY;
  C.mouth = { part: 'head', at: C.P(0, mY, fz), dir: [0, 0, 1], style: ms, px: ms === 'grin' ? 0.52 : 0.5, snap: !!(f.beard === 'full' || f.beard === 'long' || f.beard === 'goatee'), lift: (f.beard ? 0.45 : 0.08) * C.u, cmap: mcmap || undefined };
}

// ============================================================ accessories
const STONE_ROWS = {
  round: ['.ggg.', 'gwggg', 'ggggg', 'ggggg', '.ggg.'],
  heart: ['gg.gg', 'gwggg', 'ggggg', '.ggg.', '..g..'],
  star: ['..g..', '.ggg.', 'ggwgg', '.ggg.', 'g...g'],
  diamond: ['..g..', '.gwg.', 'ggggg', '.ggg.', '..g..'],
  skull: ['.www.', 'wwwww', 'wgwgw', 'wwwww', '.w.w.'],
};
const CLIP_ROWS = {
  star: [['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.'], '#ffd33b'],
  heart: [['pp.pp', 'ppppp', 'ppppp', '.ppp.', '..p..'], '#ff5d8f'],
  bolt: [['..yy', '.yy.', 'yyyy', '.yy.', 'yy..'], '#ffe23b'],
  flower: [['.p.p.', 'ppypp', '.ppp.', 'p.p.p'], '#ff9ec7'],
};

function buildHats(C) {
  // decide the hat before hair is built (hair top features are skipped under hats)
  const a = C.L.acc;
  for (const h of HAT_ACC) if (a[h]) { C.hat = h; break; }
  if (!C.hat && a.bandana && (a.bandana.style || 'head') === 'head') C.hat = 'bandana';
  if (C.L.hair.style === 'cap' && !C.hat) C.hat = 'cap';
}

function buildAccessories(C) {
  const { D, L } = C, a = L.acc, Hd = C.parts.head, Bd = C.parts.body, G = headGeo(C), z = G.z, cd = D.cd, sh = D.shJ, hip = D.hipJ;
  const wrist = D.handJ1 + 1;
  // ---------------------------------------------------------------- hats (domes sit on rows J1-1.., never carve the hair)
  const dome = (b, t, col, o = {}) => C.box([0, (b + t) / 2, z - 0.25], [5.45 + (o.w || 0), (t - b) / 2 + 0.45, 5.45 + (o.w || 0)], col, Object.assign({ round: o.round ?? 2.4 }, o.opts));
  const capB = G.J1 - 1;
  if (C.hat === 'cap') {
    const o = a.cap || {}, col = o.color || L.hair.capColor || '#e8434f', col2 = o.color2 || shade(col, 0.75);
    const back = o.style === 'back';
    Hd.push(dome(capB, G.J1 + 2, col, { opts: { belly: shade(col, 0.8) } }));
    Hd.push(C.vb(-6, 6, capB, capB, -7 + z, 7 + z, col2, { paint: 1 }));
    Hd.push(C.vb(0, 0, G.J1 + 3, G.J1 + 3, -1 + z, 0 + z, col2));
    if (back) Hd.push(C.box([0, capB, z - 6.6], [3.4, 0.45, 1.6], col2, { round: 0.4 }));
    else Hd.push(C.box([0, capB, z + 6.6], [3.9, 0.45, 1.7], col2, { round: 0.5 }));
    const em = o.emblem || L.hair.capEmblem;
    if (em && !back) C.decal('head', [0, capB + 1.8, z + 5.5], [0, 0, 1], (GRAPHICS[em] || GRAPHICS.star), GRAPHIC_CMAP, 0.36, { lift: 0.35 });
  }
  if (C.hat === 'safari_hat' || C.hat === 'straw_hat') {
    const straw = C.hat === 'straw_hat', o = a[C.hat] || {};
    const col = o.color || (straw ? '#e9c873' : '#c9b083'), band = o.color2 || (straw ? '#d2453a' : '#6b5232');
    const yb = capB, R = straw ? 8.6 : 7.3, tex = straw ? { dither: { col: shade(col, 0.82), amt: 0.3 } } : {};
    Hd.push(dome(capB, G.J1 + 3, col, { round: 2.6, opts: tex }));
    Hd.push(C.cyl([0, yb - 0.4, z - 0.2], [0, yb + 0.4, z - 0.2], R, col, Object.assign({ belly: shade(col, 0.72) }, tex)));
    Hd.push(C.vb(-6, 6, yb + 1, yb + 1, -7 + z, 7 + z, band, { paint: 1 }));
  }
  if (C.hat === 'hard_hat') {
    const col = (a.hard_hat || {}).color || '#ffc928';
    Hd.push(dome(capB, G.J1 + 3, col, { round: 2.8 }));
    Hd.push(C.box([0, capB, z + 6.0], [4.4, 0.45, 1.2], col));
    Hd.push(C.vb(0, 0, G.J1 + 3, G.J1 + 4, -5 + z, 5 + z, shade(col, 0.85)));
  }
  if (C.hat === 'beanie') {
    const col = (a.beanie || {}).color || '#3a4a6a';
    Hd.push(dome(capB - 1, G.J1 + 3, col, { round: 2.8, opts: { stripes: { axis: 'x', p: 2, w: 1, col: shade(col, 0.86) } } }));
    Hd.push(C.vb(-6, 6, capB - 1, capB, -7 + z, 7 + z, shade(col, 0.8), { paint: 1 }));
    Hd.push(C.sph([0, G.J1 + 4.2, z - 0.4], 1.3, '#f4f1ea'));
  }
  if (C.hat === 'bandana') {
    const col = (a.bandana || {}).color || '#d6334a';
    Hd.push(dome(capB, G.J1 + 2, col, { opts: { spots: { col: '#fbfbf6', d: 0.18, s: 0.8, seed: 7 } } }));
    Hd.push(C.sph([0, capB + 0.5, z - 6.0], 1.0, col), C.cap([0, capB, z - 6.0], [1.0, capB - 3, z - 6.6], 0.9, 0.4, col), C.cap([0, capB, z - 6.0], [-1.2, capB - 2.6, z - 6.4], 0.9, 0.4, col));
  }
  // ---------------------------------------------------------------- forehead / face
  if (a.headband) {
    const o = a.headband, hachi = o.style === 'hachimaki', col = o.color || '#fbfbf6', col2 = o.color2 || '#e8434f';
    const shelled = !['buzz', 'bald', 'mohawk'].includes(L.hair.style);
    const y = shelled ? G.J1 - 0.6 : G.J0 + 7, hw = shelled ? 5.95 : 4.95;
    Hd.push(C.box([0, y, z - 0.25], [hw, 0.45, hw], col, { round: 1.6 }));
    if (!hachi) Hd.push(C.vb(-7, 7, Math.round(y), Math.round(y), -7 + z, 7 + z, col2, { paint: 1, front: col, frontT: 0.9, side: col2, sideT: 0.5 }));
    if (hachi) {
      C.decal('head', [0, y, z + hw - 0.4], [0, 0, 1], ['.rr.', 'rrrr', '.rr.'], { r: col2 }, 0.42, { lift: 0.35 });
      Hd.push(C.sph([0, y, z - hw - 0.6], 0.95, col), C.cap([0, y - 0.3, z - hw - 0.8], [1.5, y - 2.6, z - hw - 1.4], 0.8, 0.45, col), C.cap([0, y - 0.3, z - hw - 0.8], [-0.9, y - 2.9, z - hw - 1.2], 0.8, 0.45, col));
    }
  }
  if (a.mask) {
    const col = a.mask.color || '#eef3f8';
    Hd.push(C.vb(-3, 3, G.J0, G.J0 + 2, Math.round(G.fz + 0.5), Math.round(G.fz + 0.5), col));
    Hd.push(C.vb(-3, 3, G.J0 + 1, G.J0 + 1, Math.round(G.fz + 0.5), Math.round(G.fz + 0.5), shade(col, 0.9), { paint: 1 }));
    Hd.push(C.vb(4, 4, G.J0 + 2, G.J0 + 2, z - 1, z + 4, col, { paint: 1, m: 1 }));
    C.flags.masked = true;
  }
  if (a.glasses || a.sunglasses) glasses(C, a.glasses ? 'glasses' : 'sunglasses', a.glasses || a.sunglasses);
  if (a.earrings) {
    const o = a.earrings, st = o.style || 'studs', col = o.color || (st === 'lightning' ? '#ffe23b' : '#ffcf3a');
    const rows = st === 'hoops' ? ['.yy.', 'y..y', 'y..y', '.yy.'] : st === 'lightning' ? ['..y', '.yy', 'yyy', 'yy.', 'y..'] : ['yw', 'yy'];
    const glow = st === 'lightning' ? 2 : st === 'studs' && o.gem ? 2 : 0;
    C.decal('head', [5.2, G.J0 + (st === 'studs' ? 1.6 : 0.6), z - 0.4], [1, 0, 0.2], rows, { y: glow ? { c: col, glow } : col, w: lite(col, 0.7) }, st === 'studs' ? 0.45 : 0.42, { mirror: true, lift: 0.3 });
  }
  if (a.hairclip) {
    const o = a.hairclip, [rows, col] = CLIP_ROWS[o.style || 'star'] || CLIP_ROWS.star;
    const c2 = o.color || col;
    C.decal('head', [-3.0, G.hl + 0.9, G.fz + 0.5], [-0.25, 0.15, 1], rows, { y: c2, p: c2 === col ? col : c2 }, 0.4, { lift: 0.35 });
  }
  if (a.headset) {
    const col = a.headset.color || '#2b2f3a';
    Hd.push(C.vb(5, 6, G.J0 + 2, G.J0 + 4, -1 + z, 1 + z, col, { m: 1 }));
    Hd.push(C.vb(-5, 5, G.J1 + 1, G.J1 + 1, -1 + z, -1 + z, col, { paint: 1 }), C.vb(5, 5, G.J0 + 5, G.J1, -1 + z, -1 + z, col, { m: 1, paint: 1 }));
    C.decal('head', [-6.5, G.J0 + 3, z], [-1, 0, 0], ['g'], { g: { c: a.headset.glow || '#5ff6ff', glow: 2 } }, 0.6, { lift: 0.2 });
    C.decal('head', [-3.5, G.J0 + 1.2, G.fz], [0, 0, 1], ['kkkkg'], { k: col, g: { c: '#3a3f4a' } }, 0.42, { snap: false, lift: 0.15 });
  }
  // ---------------------------------------------------------------- neck & chest
  if (a.scarf) {
    const col = a.scarf.color || '#e8434f';
    Bd.push(C.vb(-3, 3, sh, sh + 1, -3 + D.hz, 2 + D.hz, col, { stripes: { axis: 'x', p: 2, w: 1, col: shade(col, 0.82) } }));
    Bd.push(C.vb(1, 2, sh - 4, sh - 1, cd + 1, cd + 1, col), C.vb(1, 2, sh - 4, sh - 4, cd + 1, cd + 1, shade(col, 0.82), { paint: 1 }));
  }
  if (a.bandana && a.bandana.style === 'neck') {
    const col = a.bandana.color || '#d6334a';
    Bd.push(C.vb(-2, 2, sh, sh, cd, cd + 1, col), C.vb(-1, 1, sh - 1, sh - 1, cd + 1, cd + 1, col), C.vb(0, 0, sh - 2, sh - 2, cd + 1, cd + 1, col));
  }
  if (a.chain && a.chain.style !== 'wallet') {
    const col = a.chain.color || (a.chain.style === 'silver' ? '#dfe6ef' : '#ffcf3a');
    C.decal('body', [0, sh - 1.6, cd + 0.5], [0, 0, 1], ['y.....y', '.y...y.', '..yyy..', '...Y...'], { y: col, Y: { c: col, glow: 1 } }, 0.5, { snap: false, lift: 0.06 });
  }
  if (a.chain && a.chain.style === 'wallet') C.decal('body', [-D.cw - 0.5, hip, 0.5], [-1, 0, 0], ['y...', '.y..', '..yy'], { y: '#dfe6ef' }, 0.5, { lift: 0.2 });
  if (a.whistle) {
    const col = a.whistle.color || '#3a7bff';
    C.decal('body', [0, sh - 1.3, cd + 0.5], [0, 0, 1], ['c.....c', '.c...c.', '..c.c..', '...c...'], { c: col }, 0.5, { snap: false, lift: 0.06 });
    Bd.push(C.vb(0, 0, sh - 3, sh - 3, cd + 1, cd + 1, '#dfe6ef'));
  }
  if (a.badge) {
    const o = a.badge, col = o.color || '#ffcf3a', st = o.style || 'round';
    const rows = st === 'star' ? ['.c.', 'ccc', 'c.c'] : st === 'heart' ? ['c.c', 'ccc', '.c.'] : st === 'tag' ? ['wwww', 'wkkw', 'wwww'] : ['.cc.', 'cwcc', 'cccc', '.cc.'];
    C.decal('body', [2.0, sh - 2.4, cd + 0.5], [0, 0, 1], rows, { c: col, w: st === 'tag' ? '#fbfbf6' : lite(col, 0.6), k: '#5a6170' }, 0.42, { snap: false, lift: 0.07 });
  }
  if (C.flags.apron || a.apron) {
    const o = a.apron || {}, col = o.color || (C.flags.apron ? 't' : '#f4f1ea'), len = (C.flags.apron && C.flags.apron.len) || Math.round(D.torso * 0.4);
    Bd.push(C.vb(-2, 2, hip - len, sh - 2, cd + 1, cd + 1, col));
    Bd.push(C.vb(-1, 1, hip - len + 1, hip - 1, cd + 1, cd + 1, typeof col === 'string' && col[0] === '#' ? shade(col, 0.88) : 'T', { paint: 1 }));
    Bd.push(C.vb(-D.cw, D.cw, hip + 2, hip + 2, -cd, cd, typeof col === 'string' && col[0] === '#' ? col : 't', { paint: 1 }));
    Bd.push(C.vb(-1, 1, sh - 1, sh, cd, cd, col, { paint: 1 }));
    Bd.push(C.box([0, hip + 2, -cd - 0.9], [1.6, 0.6, 0.6], col));
  }
  if (C.flags.cargo) for (const s of [1, -1]) C.leg(s).push(C.vb(s * D.legI1, s * D.legI1, hip - 5, hip - 3, D.legK0, D.legK1, 'B', { paint: 1 }));
  // ---------------------------------------------------------------- back
  if (a.backpack) {
    const col = a.backpack.color || '#ff8a3a', col2 = a.backpack.color2 || shade(col, 0.72);
    const w = Math.min(D.cw, 3), y0 = hip + 2, y1 = sh - 1;
    Bd.push(C.box([0, (y0 + y1) / 2, -cd - 1.6], [w + 0.45, (y1 - y0) / 2 + 0.45, 1.2], col, { round: 0.9 }));
    Bd.push(C.box([0, y0 + 1.5, -cd - 2.8], [w - 0.55, 1.4, 0.5], col2, { round: 0.5 }));
    Bd.push(C.vb(-w, w, y1, y1, -cd - 2, -cd - 1, col2, { paint: 1 }));
    for (const x of [-2, 2]) Bd.push(C.vb(x, x, hip + 2, sh, cd, cd, col2, { paint: 1 }), C.vb(x, x, sh, sh, -cd, cd, col2, { paint: 1 }));
  }
  if (a.satchel) {
    const col = a.satchel.color || '#8a5a32';
    Bd.push(C.box([-D.cw - 0.4, hip + 0.5, -cd + 0.6], [1.0, 1.6, 1.4], col, { round: 0.6 }));
    for (let n = 0; n <= sh - hip - 1; n++) { const x = Math.round(D.cw - (n * 2 * D.cw) / (sh - hip)); Bd.push(C.vb(x, x, sh - n, sh - n, cd, cd, shade(col, 0.85), { paint: 1 })); }
  }
  // ---------------------------------------------------------------- wrists
  if (a.bracelet) bracelet(C, a.bracelet);
  if (a.watch) watch(C, a.watch);
  if (a.wristbands) {
    const o = a.wristbands, col = o.color || '#1d1a24';
    for (const s of [1, -1]) {
      const A = C.arm(s), i0 = s * D.armI0, i1 = s * D.armI1, io = s > 0 ? D.armI1 + 1 : -D.armI1 - 1;
      if ((s > 0 && a.bracelet) || (s < 0 && a.watch)) continue;
      A.push(C.vb(i0 - (s > 0 ? 0 : 0), i1, wrist, wrist + 1, D.armK0 - 1, D.armK1 + 1, col));
      if (o.style === 'spiked') A.push(C.vb(io, io, wrist, wrist + 1, D.armK0, D.armK1, '#dfe6ef'), C.vb(i0, i1, wrist, wrist + 1, D.armK1 + 2, D.armK1 + 2, '#dfe6ef', {}));
    }
  }
}

function bracelet(C, o) {
  const { D } = C, A = C.parts.armL, wr = D.handJ1 + 1, i0 = D.armI0, i1 = D.armI1, k0 = D.armK0, k1 = D.armK1;
  const band = o.color || '#2a2e3a', neon = o.glow || '#38f0ff';
  const st = o.stone || {}, sc = st.color || '#38f0ff', shape = STONE_ROWS[st.shape] ? st.shape : 'round';
  A.push(C.vb(i0, i1 + 1, wr, wr, k0, k1 + 1, band));                              // band (1 row, bulges front/outer)
  A.push(C.vb(i0, i1 + 1, wr, wr, k0, k0, neon, { paint: 1, glow: 1 }));           // neon trim at the back edge
  A.push(C.vb(i1 + 1, i1 + 1, wr, wr, k1 + 1, k1 + 1, sc, { glow: 1 }));           // gem socket (front-outer corner)
  const gx = i1 + 1.5, gz = k1 + 1.5, gy = wr;
  const cm = shape === 'skull' ? { w: { c: '#f2efe6', glow: 1 }, g: { c: sc, glow: 2 } } : { g: { c: sc, glow: 1 }, w: { c: lite(sc, 0.7), glow: 2 } };
  C.decal('armL', [gx, gy, gz], [0.7071, 0, 0.7071], STONE_ROWS[shape], cm, 0.3, { snap: false, lift: 0.06, depth: 1 });
  C.fx.push({ part: 'armL', at: C.P(gx + 0.3, gy, gz + 0.3), type: 'gem', rate: 0.3, scale: 0.45, color: sc });
}

function watch(C, o) {
  const { D } = C, A = C.parts.armR, wr = D.handJ1 + 1, i0 = -D.armI1, i1 = -D.armI0, k0 = D.armK0, k1 = D.armK1;
  const st = o.style || 'digital';
  const band = o.color || (st === 'gold' ? '#e8b93a' : '#24262e');
  A.push(C.vb(i0 - 1, i1, wr + 1, wr + 1, k0, k1, band));
  A.push(C.vb(i0 - 1, i0 - 1, wr + 1, wr + 1, k0, k1, st === 'gold' ? '#ffd860' : '#3a3f4a'));
  const scr = st === 'gold' ? { rows: ['wkw', 'w.w', 'wkw'], cm: { w: '#fff4d6', k: '#7a5a1a', '.': null } }
    : st === 'smart' ? { rows: ['ccc', 'cpc', 'ccc'], cm: { c: { c: o.glow || '#5ff6ff', glow: 2 }, p: { c: '#ff6ad5', glow: 2 } } }
      : { rows: ['g.g', '...', 'ggg'], cm: { g: { c: o.glow || '#7dff8a', glow: 2 } } };
  C.decal('armR', [i0 - 1.5, wr + 1, (k0 + k1) / 2], [-1, 0, 0], scr.rows, scr.cm, 0.3, { snap: false, lift: 0.06 });
}

function glasses(C, kind, o) {
  const { D } = C, G = headGeo(C), st = o.style || (kind === 'sunglasses' ? 'shades' : 'round');
  const px = 0.5, fz = G.fz;
  const col = o.color || (kind === 'sunglasses' ? '#1d1a24' : '#3a2a22');
  const lens = o.lens || (kind === 'sunglasses' ? '#20202c' : null);
  // build rows programmatically: two lenses centred on the eyes
  const ex = D.eyeX / px;                     // eye centre in pixel units
  const W = Math.round(ex * 2 + 8), H = st === 'visor' ? 4 : 6, cx = (W - 1) / 2;
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const lensCh = lens ? 'l' : '.';
  for (const s of [-1, 1]) {
    const c0 = Math.round(cx + s * ex - 3.5), c1 = c0 + 7;
    for (let r = 0; r < H; r++) for (let c = c0; c <= c1 && c < W; c++) {
      if (c < 0) continue;
      const edgeR = r === 0 || r === H - 1, edgeC = c === c0 || c === c1;
      const corner = (r === 0 || r === H - 1) && (c === c0 || c === c1);
      if (st === 'round' && corner) continue;
      if (st === 'heart') {
        if ((r === 0 && (c === c0 || c === c1 || c === c0 + 3 || c === c0 + 4)) || (r >= H - 2 && (c <= c0 + 1 + (r - H + 2) || c >= c1 - 1 - (r - H + 2)))) continue;
      }
      if (st === 'half' && r === 0) { g[r][c] = 'k'; continue; }
      g[r][c] = edgeR || edgeC ? 'k' : (st === 'half' ? (r === H - 1 ? 'k' : '.') : lensCh);
    }
    if (lens) { g[1][Math.round(cx + s * ex - 2)] = 'h'; }
  }
  if (st === 'visor') for (let r = 0; r < H; r++) for (let c = 1; c < W - 1; c++) g[r][c] = r === 0 || r === H - 1 ? 'k' : 'v';
  const bridgeR = st === 'visor' ? 0 : 1;
  for (let c = Math.round(cx - 1); c <= Math.round(cx + 1); c++) if (g[bridgeR][c] === '.') g[bridgeR][c] = 'k';
  const rows = g.map((r) => r.join(''));
  const cm = { k: col, l: lens, h: '#9aa6c2', v: { c: o.glow || '#ff3df2', glow: 2 } };
  C.decal('head', [0, D.eyeY + 0.1, fz], [0, 0, 1], rows, cm, px, { snap: false, lift: 0.28, depth: 1 });
  // temples along the sides
  C.parts.head.push(C.vb(5, 5, Math.round(D.eyeY + 0.6), Math.round(D.eyeY + 0.6), -1 + G.z, 4 + G.z, col, { paint: 1, m: 1 }));
}

// ============================================================ assemble
const QUIRKS = {
  kid: ['hop', 'spin', 'happy'], teen: ['stretch', 'nod', 'sway'], adult: ['stretch', 'nod', 'scratch'],
  big: ['flex', 'stretch', 'nod'], old: ['nod', 'scratch'],
};

export function humanDesign(look = {}) {
  const L = normalizeLook(look);
  const B = BUILDS[L.build];
  const D = dims(Object.assign({}, B, { vs: +(B.vs * L.height).toFixed(4) }));
  const pal = makePalette(L);
  const C = new Ctx(L, D, pal);
  buildHats(C);
  buildBottom(C);
  buildTop(C);
  buildLegs(C);
  buildArms(C);
  buildHead(C);
  buildFace(C);
  buildAccessories(C);
  const u = D.vs, P = (x, y, z) => [x * u, y * u, z * u];
  const legP = (s) => P(s * (D.legI0 + D.legI1) / 2, D.hipJ - 0.5, (D.legK0 + D.legK1) / 2);
  const armP = (s) => P(s * (D.armI0 + D.armI1) / 2, D.shJ - 0.5, (D.armK0 + D.armK1) / 2);
  const parts = [
    { n: 'head', parent: 'body', p: P(0, D.shJ + 0.5, D.hz), s: C.parts.head },
    { n: 'body', p: P(0, D.hipJ, 0), s: C.parts.body },
    { n: 'armL', parent: 'body', p: armP(1), s: C.parts.armL, keep: true },
    { n: 'armR', parent: 'body', p: armP(-1), s: C.parts.armR, keep: true },
    { n: 'legL', p: legP(1), s: C.parts.legL, keep: true },
    { n: 'legR', p: legP(-1), s: C.parts.legR, keep: true },
    ...C.extra,
  ];
  const id = 'human_' + hashStr(JSON.stringify(look)).toString(36);
  const anim = Object.assign({ quirk: QUIRKS[L.build], bounce: B.bounce, gait: B.gait, stride: 1, maxSpeed: B.maxSpeed }, L.anim || {});
  return {
    id, vs: u, arch: 'biped', pal, anim,
    parts,
    eyes: C.eyes, mouth: C.mouth, decals: C.decals, fx: C.fx,
    // framing hint for dialogue portraits (PortraitView.show frame)
    portrait: { y: (D.J0 + 3) * u, dist: 42 * u, yaw: 0.3 },
    look: L,
  };
}


// Equip / unequip cosmetics on a look (returns a new look; false removes an item).
//   withCosmetics(CHARACTERS.player_a, { watch: 'gold', grillz: true, stone: { color: '#ff4f9a', shape: 'heart' } })
export function withCosmetics(look, cosmetics = {}) {
  return Object.assign({}, look, { cosmetics: Object.assign({}, look.cosmetics, cosmetics) });
}
export function characterDesign(key, cosmetics) {
  const look = CHARACTERS[key];
  if (!look) return null;
  return cosmetics ? humanDesign(withCosmetics(look, cosmetics)) : DESIGNS[key];
}

// ============================================================ named characters
const STONE = { color: '#38f0ff', shape: 'round' };
export const CHARACTERS = {
  // ---- player presets (the bracelet + soul stone is always worn on the left wrist)
  player_a: { build: 'teen', skin: SKIN_TONES[2], hair: { style: 'spiky', color: '#2b2540', color2: '#4a6bff' },
    eyes: { style: 'big', iris: '#e89a1e' }, face: { brows: 'sharp', mouth: 'smile' },
    top: { style: 'jacket', color: '#25304f', color2: '#ff7a2f', color3: '#f4f1ea', glow: '#38f0ff', emblem: 'bolt' },
    bottom: { style: 'cargo', color: '#1f222b' }, shoes: { style: 'hightops', color: '#f4f4f4', color2: '#ff7a2f', glow: '#38f0ff' },
    acc: ['bracelet'], cosmetics: { stone: STONE } },
  player_b: { build: 'teen', skin: SKIN_TONES[1], hair: { style: 'ponytail', color: '#e8587c', color2: '#ffd33b' },
    eyes: { style: 'big', iris: '#8a4fe0', lashes: true }, face: { brows: 'soft', mouth: 'cat', blush: true },
    top: { style: 'jacket', color: '#f2eff6', color2: '#7b5cff', color3: '#1f1d2b', glow: '#ff4fd8', emblem: 'wing' },
    bottom: { style: 'skirt', color: '#4b3f8a', socks: 'high' }, shoes: { style: 'hightops', color: '#7b5cff', color2: '#f4f4f4', glow: '#ff4fd8' },
    acc: ['bracelet', { type: 'hairclip', style: 'star' }], cosmetics: { stone: { color: '#ff4fd8', shape: 'heart' } } },
  player_c: { build: 'teen', skin: SKIN_TONES[4], hair: { style: 'pixie', color: '#a9a2e8', color2: '#62e0c8' },
    eyes: { style: 'anime', iris: '#16b3c4' }, face: { brows: 'soft', mouth: 'smile' },
    top: { style: 'jacket', color: '#2fbf9a', color2: '#1d2230', color3: '#f4f1ea', glow: '#c8ff3a', emblem: 'stone' },
    bottom: { style: 'pants', color: '#2c3140' }, shoes: { style: 'sneakers', color: '#1d2230', color2: '#c8ff3a', glow: '#c8ff3a' },
    acc: ['bracelet', { type: 'earrings', style: 'studs', color: '#c8ff3a' }], cosmetics: { stone: { color: '#c8ff3a', shape: 'star' } } },
  // ---- story cast
  coach: { build: 'big', height: 1.08, skin: SKIN_TONES[3], hair: { style: 'buzz', color: '#2a211d' },
    eyes: { style: 'round', iris: '#3a2418' }, face: { brows: 'thick', mouth: 'grin', stubble: true, nose: 'big' },
    top: { style: 'tracksuit', color: '#e0322e', color2: '#fbfbf6', emblem: 'whistle' }, bottom: { style: 'track', color: '#e0322e', color2: '#fbfbf6' },
    shoes: { style: 'sneakers', color: '#fbfbf6', color2: '#e0322e' },
    acc: [{ type: 'headband', style: 'sport', color: '#fbfbf6', color2: '#e0322e' }, { type: 'whistle', color: '#ffd33b' }, { type: 'watch', style: 'digital' }],
    anim: { quirk: ['flex', 'stretch', 'laugh'] } },
  mika: { build: 'teen', skin: SKIN_TONES[1], hair: { style: 'twin_buns', color: '#7a4a32', color2: '#ff5d7c' },
    eyes: { style: 'big', iris: '#2aa86a', lashes: true }, face: { brows: 'soft', mouth: 'cat', blush: 'lines' },
    top: { style: 'hoodie', color: '#ffcf2e', color2: '#1f1d24', ears: 'panda', graphic: 'smile' }, bottom: { style: 'shorts', color: '#3d6fd6', socks: 'high' },
    shoes: { style: 'sneakers', color: '#fbfbf6', color2: '#ff5d7c' }, acc: [{ type: 'hairclip', style: 'heart' }],
    anim: { quirk: ['hop', 'happy', 'sway'], bounce: 1.4 } },
  kaito: { build: 'teen', skin: SKIN_TONES[1], hair: { style: 'spiky', color: '#17151f', color2: '#e8233a' },
    eyes: { style: 'sharp', iris: '#e8233a' }, face: { brows: 'sharp', mouth: 'line' },
    top: { style: 'jacket', color: '#17161d', color2: '#e8233a', color3: '#2b2a33', glow: '#ff2a3c', emblem: 'wing' },
    bottom: { style: 'pants', color: '#1d1c24' }, shoes: { style: 'boots', color: '#1d1c24', color2: '#e8233a' },
    acc: [{ type: 'gloves', style: 'fingerless', color: '#22212a' }, { type: 'earrings', style: 'studs', color: '#e8233a' }],
    anim: { quirk: ['shrug', 'stretch'] } },
  taro: { build: 'kid', skin: SKIN_TONES[3], hair: { style: 'cap', color: '#2d2220' },
    eyes: { style: 'big', iris: '#4a2a1a' }, face: { brows: 'soft', mouth: 'w', freckles: true, blush: true },
    top: { style: 'tee', color: '#fbfbf6', graphic: 'beetle' }, bottom: { style: 'shorts', color: '#d78a3c' },
    shoes: { style: 'sneakers', color: '#3fae4a', color2: '#fbfbf6' },
    acc: [{ type: 'cap', color: '#3fae4a', color2: '#ffd33b', emblem: 'beetle' }, { type: 'backpack', color: '#ffb02e' }],
    anim: { quirk: ['hop', 'spin', 'cheer'] } },
  thrash: { build: 'adult', height: 1.04, skin: '#f3d2bd', hair: { style: 'mohawk', color: '#33d65a', color2: '#d8ff3a' },
    eyes: { style: 'fierce', iris: '#ffd33b', liner: true }, face: { brows: 'angry', browColor: '#22301f', mouth: 'grin' },
    top: { style: 'leather', color: '#1b1a20', color3: '#e8233a' }, bottom: { style: 'jeans', color: '#3a3d48', ripped: true },
    shoes: { style: 'boots', color: '#1b1a20', color2: '#c9ccd6' },
    acc: [{ type: 'chain', style: 'gold' }, { type: 'chain', style: 'wallet' }, { type: 'earrings', style: 'hoops', color: '#dfe6ef' }, { type: 'wristbands', style: 'spiked' }],
    cosmetics: { grillz: { style: 'gold' } }, anim: { quirk: ['headbang', 'flex', 'laugh'] } },
  riff: { build: 'teen', skin: SKIN_TONES[2], hair: { style: 'spiky', color: '#f1e9d2', color2: '#ffb3d0' },
    eyes: { style: 'sharp', iris: '#3a7bff' }, face: { brows: 'angry', mouth: 'fang' },
    top: { style: 'vest', color: '#4a6fb0', color2: '#1d1c24' }, bottom: { style: 'pants', color: '#1d1c24' },
    shoes: { style: 'boots', color: '#2a2a33' }, acc: [{ type: 'sunglasses', style: 'shades' }, { type: 'earrings', style: 'lightning' }],
    anim: { quirk: ['headbang', 'shrug'] } },
  moshi: { build: 'big', skin: SKIN_TONES[5], hair: { style: 'buzz', color: '#1d1a20' },
    eyes: { style: 'sleepy', iris: '#2b1d18' }, face: { brows: 'thick', mouth: 'line', tattoo: '#2a3f6a', scalp: '#2a3f6a' },
    top: { style: 'tank', color: '#1d1c24' }, bottom: { style: 'cargo', color: '#3a4030' }, shoes: { style: 'boots', color: '#1d1c24' },
    acc: [{ type: 'wristbands', style: 'spiked' }, { type: 'chain', style: 'silver' }], anim: { quirk: ['flex', 'headbang'] } },
  hoshino: { build: 'old', skin: SKIN_TONES[2], hair: { style: 'side_part', color: '#c7c9d1' },
    eyes: { style: 'round', iris: '#5a3420' }, face: { brows: 'soft', mouth: 'smile', mustache: 'thin', wrinkles: true },
    top: { style: 'field', color: '#c9b083', color2: '#a68c5e' }, bottom: { style: 'cargo', color: '#8a7a5a' }, shoes: { style: 'boots', color: '#6b4a2e' },
    acc: [{ type: 'safari_hat' }, { type: 'glasses', style: 'round', color: '#6b4a2e' }, { type: 'satchel', color: '#8a5a32' }],
    anim: { quirk: ['think', 'nod'] } },
  vendor: { build: 'adult', skin: SKIN_TONES[3], hair: { style: 'buzz', color: '#2a2220' },
    eyes: { style: 'sleepy', iris: '#2b1d18' }, face: { brows: 'thick', mouth: 'grin', mustache: 'thick' },
    top: { style: 'apron', color: '#2a3e7a', color2: '#fbfbf6' }, bottom: { style: 'pants', color: '#3a3d48' }, shoes: { style: 'sandals', color: '#8a5a32', color2: '#2a2a33' },
    acc: [{ type: 'headband', style: 'hachimaki', color: '#fbfbf6', color2: '#e0322e' }], anim: { quirk: ['laugh', 'nod'] } },
  clerk: { build: 'teen', skin: SKIN_TONES[0], hair: { style: 'bob', color: '#ff9ec7' },
    eyes: { style: 'anime', iris: '#e0567a', lashes: true }, face: { brows: 'soft', mouth: 'smile', blush: true },
    top: { style: 'uniform', color: '#bff0e0', color2: '#ffb3cf' }, bottom: { style: 'skirt', color: '#ffb3cf', socks: 'high' }, shoes: { style: 'loafers', color: '#6b4a3a' },
    acc: [{ type: 'cap', color: '#bff0e0', color2: '#ffb3cf', emblem: 'heart' }] },
  farmer: { build: 'old', skin: SKIN_TONES[4], hair: { style: 'buzz', color: '#b9bcc4' },
    eyes: { style: 'sleepy', iris: '#2b1d18' }, face: { brows: 'bushy', browColor: '#d9dbe0', mouth: 'smile', wrinkles: true },
    top: { style: 'tee', color: '#6e8a5a', sleeves: 'long' }, bottom: { style: 'overalls', color: '#4a5f8a' }, shoes: { style: 'rainboots', color: '#2f4a32' },
    acc: [{ type: 'straw_hat' }, { type: 'scarf', color: '#fbfbf6' }], anim: { quirk: ['nod', 'stretch'] } },
  receptionist: { build: 'adult', skin: SKIN_TONES[1], hair: { style: 'bun', color: '#3d2b25', color2: '#2a3e7a' },
    eyes: { style: 'anime', iris: '#5a3420', lashes: true }, face: { brows: 'soft', mouth: 'smile' },
    top: { style: 'suit', color: '#2a3e7a', color2: '#fbfbf6', color3: '#e0322e' }, bottom: { style: 'skirt', color: '#2a3e7a', pleats: false, tights: true, color2: '#e2c4ae' },
    shoes: { style: 'loafers', color: '#1d1c24' }, acc: ['headset', { type: 'badge', style: 'tag' }], anim: { quirk: ['bow', 'nod'] } },
  idol: { build: 'teen', skin: SKIN_TONES[0], hair: { style: 'twin_tails', color: '#b46bff', color2: '#ff6ad5' },
    eyes: { style: 'big', iris: '#ff4fb8', lashes: true }, face: { brows: 'soft', mouth: 'cat', blush: 'lines' },
    top: { style: 'dress', color: '#ff8ac6', color2: '#fbfbf6', color3: '#ffd33b' }, bottom: { style: 'skirt', color: '#ff8ac6', color2: '#fbfbf6', socks: 'high' },
    shoes: { style: 'idol', color: '#fbfbf6', color2: '#ff6ad5' }, acc: [{ type: 'hairclip', style: 'heart' }, { type: 'earrings', style: 'studs', color: '#ff6ad5', gem: true }],
    anim: { quirk: ['sway', 'cheer', 'spin'] } },
  salaryman: { build: 'adult', skin: SKIN_TONES[2], hair: { style: 'side_part', color: '#1e1b26' },
    eyes: { style: 'sleepy', iris: '#2b1d18' }, face: { brows: 'worried', mouth: 'line' },
    top: { style: 'suit', color: '#3a4152', color2: '#fbfbf6', color3: '#2f6fd6' }, bottom: { style: 'pants', color: '#3a4152' },
    shoes: { style: 'loafers', color: '#2a1d18' }, acc: [{ type: 'glasses', style: 'square', color: '#1d1c24' }], anim: { quirk: ['scratch', 'stretch'] } },
  granny: { build: 'old', height: 0.95, skin: SKIN_TONES[1], hair: { style: 'bun', color: '#d9dbe2', color2: '#8a6bd6' },
    eyes: { style: 'dot', iris: '#2b1d18' }, face: { brows: 'soft', browColor: '#b9bcc4', mouth: 'smile', blush: true, wrinkles: true },
    top: { style: 'cardigan', color: '#a48bd6', color2: '#fbfbf6' }, bottom: { style: 'long_skirt', color: '#6b5a8a' },
    shoes: { style: 'loafers', color: '#6b4a3a' }, acc: [{ type: 'glasses', style: 'half', color: '#b08a3a' }], anim: { quirk: ['nod'] } },
  dojo_master: { build: 'old', skin: SKIN_TONES[3], hair: { style: 'topknot', color: '#f1f1ee', color2: '#2a2a33' },
    eyes: { style: 'sleepy', iris: '#2b1d18' }, face: { brows: 'bushy', browColor: '#f4f4f0', mouth: 'smile', beard: 'long', mustache: 'walrus', facial: '#f1f1ee', wrinkles: true },
    top: { style: 'gi', color: '#f4f1ea', color2: '#d9d4c6', color3: '#1d1c24' }, bottom: { style: 'hakama', color: '#2a3550' },
    shoes: { style: 'sandals', color: '#7a5232', color2: '#1d1c24' }, anim: { quirk: ['nod', 'think'] } },
  shopkeeper: { build: 'adult', height: 0.95, skin: SKIN_TONES[2], hair: { style: 'curly', color: '#8a4fbf' },
    eyes: { style: 'anime', iris: '#5a3420', lashes: true }, face: { brows: 'thin', mouth: 'lips', blush: true },
    top: { style: 'hawaiian', color: '#e8b04a', color2: '#3a2216', pattern: 'leopard' }, bottom: { style: 'pants', color: '#2a2a33' }, shoes: { style: 'sandals', color: '#e0322e', color2: '#e0322e' },
    acc: [{ type: 'earrings', style: 'hoops', color: '#ffcf3a' }, { type: 'apron', color: '#ff7aa8' }], anim: { quirk: ['laugh', 'nod'] } },
  ranger: { build: 'adult', skin: SKIN_TONES[4], hair: { style: 'messy', color: '#3d2b25' },
    eyes: { style: 'anime', iris: '#2aa86a' }, face: { brows: 'thick', mouth: 'smile' },
    top: { style: 'field', color: '#4f7a45', color2: '#3d6036', patch: '#ffcf3a' }, bottom: { style: 'cargo', color: '#a6946a' }, shoes: { style: 'boots', color: '#5a3e26' },
    acc: [{ type: 'cap', color: '#3d6036', color2: '#2f4a2a', emblem: 'star' }, { type: 'badge', style: 'star', color: '#ffcf3a' }, 'watch'], anim: { quirk: ['stretch', 'nod'] } },
};

// story metadata: display name, role, dialogue voice (beep pitch / speed)
export const CHAR_LORE = {
  player_a: { name: 'You', role: 'Rookie trainer', voice: { pitch: 1.05, speed: 1.05 } },
  player_b: { name: 'You', role: 'Rookie trainer', voice: { pitch: 1.25, speed: 1.05 } },
  player_c: { name: 'You', role: 'Rookie trainer', voice: { pitch: 1.12, speed: 1.0 } },
  coach: { name: 'Coach Gonda', role: 'Ex-pro trainer, your mentor', voice: { pitch: 0.7, speed: 1 },
    bio: 'A 1.95 m wall of red tracksuit. Former league semi-finalist turned coach; cracks Osaka-ben jokes nobody asked for, cries at every graduation.', dialect: 'osaka' },
  mika: { name: 'Mika', role: 'Best friend', voice: { pitch: 1.35, speed: 1.2 },
    bio: 'Runs on takoyaki and pure enthusiasm. Will hug your Elemon before asking its name.' },
  kaito: { name: 'Kaito', role: 'Rival', voice: { pitch: 0.95, speed: 0.95 },
    bio: 'Top of the academy and never lets you forget it. Secretly trains at dawn so nobody sees him try.' },
  taro: { name: 'Taro', role: 'Bug-catching kid, beetle Elemon owner', voice: { pitch: 1.55, speed: 1.25 },
    bio: 'Knows every beetle in Osaka by name. His backpack is 40% snacks, 60% bug jars.' },
  thrash: { name: 'Thrash', role: 'Team Metallica leader', voice: { pitch: 0.8, speed: 1.1 },
    bio: 'Self-proclaimed king of the Dotonbori underground. Gold grin, louder amp, zero chill.' },
  riff: { name: 'Riff', role: 'Team Metallica punk', voice: { pitch: 1.1, speed: 1.2 }, bio: 'Thrash\'s hype-man. Has never once taken off the shades.' },
  moshi: { name: 'Moshi', role: 'Team Metallica bruiser', voice: { pitch: 0.6, speed: 0.85 }, bio: 'Speaks rarely, headbangs constantly. Secretly feeds stray cats.' },
  hoshino: { name: 'Dr. Hoshino', role: 'Archaeologist, soul-stone researcher', voice: { pitch: 0.85, speed: 0.9 },
    bio: 'Has dug up half of Kansai looking for the origin of the soul stones. Kind, absent-minded, always dusty.' },
  vendor: { name: 'Takoyaki Taisho', role: 'Takoyaki vendor', voice: { pitch: 0.8, speed: 1.15 }, dialect: 'osaka', bio: 'Eight balls a box, one free for good kids.' },
  clerk: { name: 'Yuzu', role: 'Ice-cream shop clerk', voice: { pitch: 1.3, speed: 1.1 } },
  farmer: { name: 'Old Man Kubo', role: 'Farmer', voice: { pitch: 0.75, speed: 0.8 } },
  receptionist: { name: 'Ms. Aoi', role: 'Elemon League receptionist', voice: { pitch: 1.2, speed: 1.0 } },
  idol: { name: 'Lumi★', role: 'Pop idol', voice: { pitch: 1.45, speed: 1.15 } },
  salaryman: { name: 'Mr. Tanaka', role: 'Salaryman', voice: { pitch: 0.9, speed: 1.05 } },
  granny: { name: 'Granny Fuku', role: 'Neighbour', voice: { pitch: 1.1, speed: 0.75 } },
  dojo_master: { name: 'Master Genryu', role: 'Dojo master', voice: { pitch: 0.65, speed: 0.75 } },
  shopkeeper: { name: 'Auntie Kazu', role: 'Shopkeeper', voice: { pitch: 1.15, speed: 1.3 }, dialect: 'osaka' },
  ranger: { name: 'Ranger Sora', role: 'Safari ranger', voice: { pitch: 0.95, speed: 1.0 } },
};

// ============================================================ townsfolk
const pick = (r, a) => a[Math.floor(r() * a.length)];
const TOWN_ROLES = ['salaryman', 'office', 'student', 'student_sailor', 'tourist', 'grandma', 'grandpa', 'kid', 'worker', 'jogger', 'punk', 'shopper', 'chef', 'artist'];
export function randomLook(seed = 1, role) {
  const r = mulberry32((typeof seed === 'string' ? hashStr(seed) : seed) >>> 0);
  role = role || pick(r, TOWN_ROLES);
  const skin = pick(r, SKIN_TONES.slice(0, 7));
  const dark = pick(r, ['#1e1b26', '#2b2220', '#3d2b25', '#5a3a2a']);
  const anyHair = pick(r, [dark, dark, '#6e4431', '#a8693d', '#e9c47c', '#ff5d7c', '#3ac6ff', '#7b5cff']);
  const iris = role === 'punk' || role === 'artist' ? pick(r, IRIS_COLORS) : pick(r, ['#5a3420', '#2b1d18', '#6a4a2a', '#2f6fd6', '#2aa86a', '#e89a1e', '#4a6a8a']);
  const pastel = pick(r, ['#ffd1dc', '#c9f0ff', '#d6f5c9', '#fff1b8', '#e3d4ff', '#ffe0c2']);
  const vivid = pick(r, ['#e8434f', '#2f6fd6', '#2fbf9a', '#ffb02e', '#7b5cff', '#ff6ad5', '#3fae4a', '#1d2230']);
  const neutral = pick(r, ['#3a4152', '#2a2a33', '#5a5f6e', '#6b4a3a', '#d9d4c6', '#f4f1ea']);
  const eyes = { style: pick(r, ['anime', 'anime', 'big', 'round', 'sleepy', 'bead']), iris };
  const face = { brows: pick(r, ['soft', 'soft', 'thin', 'thick', 'worried']), mouth: pick(r, ['smile', 'smile', 'line', 'cat', 'tiny', 'w']), blush: r() < 0.3 };
  const fem = r() < 0.5;
  const L = { skin, eyes, face, acc: [] };
  switch (role) {
    case 'salaryman': case 'office':
      Object.assign(L, { build: 'adult', hair: { style: role === 'office' ? pick(r, ['bob', 'bun', 'ponytail', 'hime']) : pick(r, ['side_part', 'slick', 'messy']), color: dark },
        top: { style: 'suit', color: pick(r, ['#3a4152', '#2a2a33', '#4a4f5e', '#2a3e7a']), color2: '#fbfbf6', color3: pick(r, ['#e0322e', '#2f6fd6', '#3fae4a', '#7b5cff']) },
        bottom: role === 'office' && r() < 0.6 ? { style: 'skirt', color: '#3a4152', pleats: false, tights: true, color2: '#e2c4ae' } : { style: 'pants', color: '#3a4152' }, shoes: { style: 'loafers', color: '#2a1d18' } });
      if (r() < 0.4) L.acc.push({ type: 'glasses', style: pick(r, ['square', 'half']) });
      if (r() < 0.3) L.acc.push({ type: 'mask' });
      if (r() < 0.3) L.acc.push('watch');
      break;
    case 'student': case 'student_sailor':
      Object.assign(L, { build: 'teen', hair: { style: pick(r, fem ? ['ponytail', 'twin_tails', 'bob', 'long', 'hime', 'twin_buns'] : ['spiky', 'messy', 'pixie', 'side_part']), color: anyHair },
        top: role === 'student_sailor' ? { style: 'sailor', color: '#fbfbf6', color2: '#2a3550', color3: '#e0322e' } : { style: pick(r, ['gakuran', 'hoodie', 'sweater']), color: pick(r, ['#1d1c24', vivid, pastel]), color2: '#fbfbf6' },
        bottom: role === 'student_sailor' ? { style: 'skirt', color: '#2a3550', socks: 'high' } : { style: 'pants', color: '#1d1c24' }, shoes: { style: 'loafers', color: '#3a2a22' } });
      if (r() < 0.4) L.acc.push({ type: 'backpack', color: vivid });
      if (r() < 0.25) L.acc.push({ type: 'hairclip', style: pick(r, ['star', 'heart', 'flower', 'bolt']) });
      break;
    case 'tourist':
      Object.assign(L, { build: pick(r, ['adult', 'adult', 'big']), hair: { style: pick(r, ['messy', 'ponytail', 'bob', 'buzz', 'curly']), color: pick(r, ['#e9c47c', '#a8693d', '#6e4431', dark]) },
        top: { style: 'hawaiian', color: pick(r, ['#2fbf9a', '#ffb02e', '#3ac6ff', '#ff6ad5']), color2: '#fbfbf6' }, bottom: { style: 'shorts', color: pick(r, ['#c9b083', '#d9d4c6', '#4a6fb0']) },
        shoes: { style: 'sandals', color: '#6b4a3a', color2: '#2a2a33' } });
      L.acc.push(r() < 0.5 ? { type: 'safari_hat', color: '#e9e2cf' } : { type: 'cap', color: vivid });
      if (r() < 0.5) L.acc.push({ type: 'sunglasses', style: 'shades' });
      if (r() < 0.5) L.acc.push({ type: 'backpack', color: neutral });
      break;
    case 'grandma': case 'grandpa': {
      const g = role === 'grandma';
      Object.assign(L, { build: 'old', hair: { style: g ? pick(r, ['bun', 'curly', 'bob']) : pick(r, ['buzz', 'side_part', 'topknot', 'bald']), color: pick(r, ['#d9dbe2', '#c8cbd6', '#b9bcc4', '#8a6bd6']) },
        top: { style: g ? pick(r, ['cardigan', 'kimono']) : pick(r, ['cardigan', 'sweater', 'field']), color: g ? pick(r, ['#a48bd6', '#d67a8a', '#6b8ad6', '#8a6b4a']) : pick(r, ['#6b6e5a', '#8a6b4a', '#4a5a7a']), color2: '#fbfbf6', color3: '#6b2a3a' },
        bottom: g ? { style: 'long_skirt', color: '#5a4a6a' } : { style: 'pants', color: '#5a5f6e' }, shoes: { style: 'loafers', color: '#6b4a3a' } });
      L.eyes.style = pick(r, ['sleepy', 'dot', 'bead']);
      L.face = Object.assign(L.face, { wrinkles: true, browColor: '#c9ccd4', mouth: 'smile' });
      if (!g && r() < 0.5) L.face.mustache = 'thin';
      if (r() < 0.5) L.acc.push({ type: 'glasses', style: pick(r, ['round', 'half']) });
      break;
    }
    case 'kid':
      Object.assign(L, { build: 'kid', hair: { style: pick(r, ['spiky', 'messy', 'bob', 'twin_tails', 'twin_buns', 'cap', 'ponytail']), color: anyHair, capColor: vivid },
        top: { style: pick(r, ['tee', 'tee', 'hoodie']), color: pick(r, [vivid, pastel]), graphic: pick(r, ['star', 'heart', 'bolt', 'takoyaki', 'smile']) },
        bottom: { style: pick(r, ['shorts', 'shorts', 'skirt']), color: pick(r, ['#4a6fb0', '#d78a3c', '#3a4152', '#ff8ac6']) }, shoes: { style: 'sneakers', color: vivid } });
      L.eyes.style = 'big'; L.face.blush = true;
      if (r() < 0.4) L.acc.push({ type: 'backpack', color: pick(r, ['#ffb02e', '#e8434f', '#3ac6ff']) });
      break;
    case 'worker':
      Object.assign(L, { build: pick(r, ['adult', 'big']), hair: { style: pick(r, ['buzz', 'messy', 'side_part']), color: dark },
        top: { style: 'hivis', color: '#d8ff3a', color2: pick(r, ['#3a4152', '#5a5f6e', '#2f6fd6']) }, bottom: { style: 'cargo', color: '#3a4152' }, shoes: { style: 'boots', color: '#5a3e26' } });
      L.acc.push({ type: 'hard_hat', color: pick(r, ['#ffc928', '#fbfbf6', '#ff7a2f']) });
      if (r() < 0.4) L.face.stubble = true;
      break;
    case 'jogger':
      Object.assign(L, { build: pick(r, ['teen', 'adult']), hair: { style: pick(r, ['ponytail', 'buzz', 'messy', 'pixie']), color: anyHair },
        top: { style: 'tracksuit', color: vivid, color2: '#fbfbf6' }, bottom: { style: 'track', color: vivid, color2: '#fbfbf6' }, shoes: { style: 'sneakers', color: '#fbfbf6', color2: vivid } });
      L.acc.push({ type: 'headband', color: '#fbfbf6', color2: vivid });
      if (r() < 0.5) L.acc.push({ type: 'watch', style: 'smart' });
      break;
    case 'punk':
      Object.assign(L, { build: pick(r, ['teen', 'adult']), hair: { style: pick(r, ['mohawk', 'spiky', 'messy']), color: pick(r, ['#33d65a', '#ff5d7c', '#3ac6ff', '#f1e9d2', '#1e1b26']) },
        top: { style: pick(r, ['leather', 'vest']), color: pick(r, ['#1b1a20', '#4a6fb0']), color2: '#1d1c24', color3: '#e8233a', patch: r() < 0.5 },
        bottom: { style: 'jeans', color: '#3a3d48', ripped: true }, shoes: { style: 'boots', color: '#1b1a20' } });
      L.eyes.style = pick(r, ['fierce', 'sharp']); L.face.brows = 'angry';
      if (r() < 0.5) L.acc.push({ type: 'chain', style: 'wallet' });
      if (r() < 0.5) L.acc.push({ type: 'earrings', style: pick(r, ['hoops', 'studs']) });
      break;
    case 'chef':
      Object.assign(L, { build: pick(r, ['adult', 'big']), hair: { style: pick(r, ['buzz', 'messy']), color: dark },
        top: { style: 'apron', color: pick(r, ['#2a3e7a', '#fbfbf6', '#3a2a22']), color2: '#fbfbf6' }, bottom: { style: 'pants', color: '#3a3d48' }, shoes: { style: 'sandals', color: '#6b4a3a' } });
      L.acc.push({ type: 'headband', style: 'hachimaki', color2: pick(r, ['#e0322e', '#2a3e7a']) });
      if (r() < 0.5) L.face.mustache = 'thick';
      break;
    case 'artist':
      Object.assign(L, { build: pick(r, ['teen', 'adult']), hair: { style: pick(r, ['bob', 'pixie', 'curly', 'long', 'braid']), color: anyHair },
        top: { style: 'sweater', color: pastel, color2: vivid, stripes: r() < 0.5 }, bottom: { style: pick(r, ['jeans', 'skirt', 'cargo']), color: pick(r, ['#4a6fb0', '#3a4152', '#c9b083']) }, shoes: { style: 'hightops', color: vivid } });
      L.acc.push({ type: 'beanie', color: vivid });
      if (r() < 0.5) L.acc.push({ type: 'glasses', style: 'round' });
      break;
    case 'shopper': default:
      Object.assign(L, { build: pick(r, ['teen', 'adult', 'adult']), hair: { style: pick(r, fem ? ['long', 'bob', 'ponytail', 'twin_tails', 'hime', 'curly'] : ['messy', 'spiky', 'side_part', 'afro', 'buzz']), color: anyHair },
        top: { style: pick(r, ['tee', 'hoodie', 'jacket', 'sweater']), color: pick(r, [vivid, pastel, neutral]), color2: pick(r, [vivid, '#fbfbf6', '#1d1c24']), graphic: pick(r, [undefined, 'heart', 'star', 'takoyaki']) },
        bottom: { style: pick(r, ['jeans', 'pants', 'skirt', 'shorts', 'cargo']), color: pick(r, ['#4a6fb0', '#3a4152', '#2a2a33', '#c9b083', '#ff8ac6']) }, shoes: { style: pick(r, ['sneakers', 'hightops', 'loafers']), color: pick(r, ['#fbfbf6', vivid, neutral]) } });
      if (r() < 0.25) L.acc.push({ type: 'scarf', color: vivid });
      if (r() < 0.25) L.acc.push({ type: 'earrings', style: pick(r, ['studs', 'hoops']) });
      if (r() < 0.2) L.acc.push({ type: 'mask' });
      break;
  }
  L.role = role;
  return L;
}

// ============================================================ ready-built designs (viewer + game)
export const DESIGNS = {};
for (const [k, look] of Object.entries(CHARACTERS)) DESIGNS[k] = Object.assign(humanDesign(look), { id: 'human_' + k });
['salaryman', 'student_sailor', 'tourist', 'grandma', 'kid', 'worker', 'punk', 'office', 'jogger', 'grandpa', 'chef', 'artist']
  .forEach((role, n) => { DESIGNS['town' + (n + 1)] = Object.assign(humanDesign(randomLook(1000 + n * 7919, role)), { id: 'human_town' + (n + 1) }); });
