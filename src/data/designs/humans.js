// Elemon — parametric chibi humans (3D pixel art). See docs/MODELING.md.
//
//   humanDesign(look) → voxel DSL design (arch 'biped') for the player, NPCs and townsfolk.
//   CHARACTERS        → named looks (player presets, Coach Gonda, Mika, Kaito, Team Metallica…)
//   randomLook(seed)  → deterministic townsfolk (salaryman, student, tourist, granny, kid, worker…)
//   DESIGNS           → ready-built designs for every named character (+ a few townsfolk)
//
// Model space: metres, +y up, +z = front, model's left = +x. Internally every
// coordinate is written in VOXEL UNITS (1 = design.vs): voxel cell (i,j,k) is
// centred on (i,j,k)·vs, so faces, seams and trims land crisply on the lattice.
// The skull is always 9 voxels wide (i −4..4) with a flat face plane at
// z = 4.5 (+hunch) so eye / mouth decals sit exactly on it (snap:false).
//
// look = {
//   build: 'kid'|'teen'|'adult'|'big'|'old',   height: 0.92–1.08 (optional scale)
//   skin: '#hex',
//   hair:  { style (HAIR_STYLES), color, color2? (tips/streaks/ties) },
//   eyes:  { style: 'anime'|'big'|'round'|'sharp'|'fierce'|'sleepy'|'bead'|'dot'|'tall'|'star', iris, lashes?, liner? },
//   face:  { brows, browColor, mouth, blush, nose, freckles, stubble, beard, mustache, facial (colour), paint, scar, wrinkles },
//   top:   { style (TOP_STYLES), color, color2, color3, graphic?, ears? },
//   bottom:{ style (BOTTOM_STYLES), color, color2, ripped? },
//   shoes: { style (SHOE_STYLES), color, color2, glow? } | '#hex',
//   acc:   ['bracelet', 'watch', { type: 'earrings', style: 'hoops', color: '#ffd23a' }, …],
//   cosmetics: { stone: { color, shape }, watch: 'gold', earrings: 'hoops', hairclip: 'star', grillz: true, badge: '#hex', … },
//   anim:  { quirk: [...] }  (optional override)
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
  kid: { vs: 0.04, hip: 9, torso: 8, cw: 3, cd: 2, armW: 2, legW: 2, skullH: 9, neck: 0, bounce: 1.4, gait: 1.15, maxSpeed: 3.6 },
  teen: { vs: 0.047, hip: 12, torso: 9, cw: 3, cd: 2, armW: 2, legW: 2, skullH: 10, neck: 1, bounce: 1.1, gait: 1, maxSpeed: 4.6 },
  adult: { vs: 0.049, hip: 12, torso: 10, cw: 3, cd: 2, armW: 2, legW: 2, skullH: 10, neck: 1, bounce: 1, gait: 1, maxSpeed: 4.6 },
  big: { vs: 0.05, hip: 14, torso: 14, cw: 5, cd: 3, armW: 3, legW: 3, skullH: 10, neck: 1, bounce: 0.8, gait: 0.9, maxSpeed: 4.2 },
  old: { vs: 0.046, hip: 11, torso: 9, cw: 3, cd: 2, armW: 2, legW: 2, skullH: 10, neck: 0, hunch: 1, bounce: 0.6, gait: 0.75, maxSpeed: 2.6 },
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
  D.eyeY = D.J0 + (sh >= 10 ? 3.9 : 3.45);
  D.eyeX = 2.2;
  D.mouthY = D.J0 + (sh >= 10 ? 1.45 : 1.2);
  D.browY = D.J0 + (sh >= 10 ? 6.15 : 5.6);
  D.hairline = D.J0 + (sh >= 10 ? 7 : 6);      // first row of forehead hair
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
    const len = Math.max(3, Math.round(D.torso * 0.42));
    Bd.push(C.cap([0, hip + 1.5, -0.2], [0, hip - len + 0.2, -0.2], cw + 0.2, cw + 1.6, 'b', { stripes: L.bottom.pleats === false ? undefined : { axis: 'x', p: 2, w: 1, col: 'B' } }));
    Bd.push(C.vb(-cw - 2, cw + 2, hip - len, hip - len, -cd - 2, cd + 2, 'b2', { paint: 1 }));
    Bd.push(C.vb(-cw - 2, cw + 2, hip - len - 1, hip - len - 1, -cd - 2, cd + 2, 'b', { sub: 1 }));
  }
  if (st === 'long_skirt') {
    C.legWear = 'hidden';
    Bd.push(C.cap([0, hip + 1.5, -0.2], [0, 3.6, -0.2], cw + 0.2, cw + 1.3, 'b', { stripes: { axis: 'x', p: 2, w: 1, col: 'B' } }));
    Bd.push(C.vb(-cw - 2, cw + 2, 2, 2, -cd - 2, cd + 2, 'b2', { paint: 1 }));
  }
  if (st === 'hakama') {
    C.legWear = 'hidden';
    Bd.push(C.cap([0, hip + 1.6, -0.2], [0, 2.6, -0.2], cw + 0.4, cw + 1.9, 'b', { stripes: { axis: 'x', p: 2, w: 1, col: 'B' } }));
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
  const sh = [];
  if (D.hunch) {
    sh.push(C.vbr ? null : null);
    sh.push(C.box([0, (j0 + j1 - 3) / 2, 0], [cw + 0.45, (j1 - 3 - j0) / 2 + 0.45, cd + 0.45], col, { round: 1.5 }));
    sh.push(C.box([0, j1 - 1.5, 0.5], [cw + 0.45, 1.95, cd + 0.45], col, { round: 1.5 }));
  } else {
    sh.push(C.box([0, (j0 + j1) / 2, 0], [cw + 0.45, (j1 - j0) / 2 + 0.45, cd + 0.45], col, { round: o.round ?? 1.6 }));
  }
  return sh.filter(Boolean);
}

function buildTop(C) {
  const { D, L } = C, Bd = C.parts.body, st = L.top.style, cw = D.cw, cd = D.cd, hip = D.hipJ, sh = D.shJ;
  const fz = cd + (D.hunch ? 0 : 0);           // front surface row k
  const add = (...s) => Bd.push(...s);
  const front = (i0, i1, j0, j1, col, o) => add(C.vb(i0, i1, j0, j1, fz, fz + (D.hunch && j0 >= sh - 3 ? 1 : 0), col, Object.assign({ paint: 1 }, o)));
  const back = (i0, i1, j0, j1, col, o) => add(C.vb(i0, i1, j0, j1, -cd, -cd, col, Object.assign({ paint: 1 }, o)));
  const hem = (col) => add(C.vb(-cw - 1, cw + 1, hip + 2, hip + 2, -cd - 1, cd + 1, col, { paint: 1 }));
  C.sleeve = 'long';
  const neckline = () => front(-1, 1, sh, sh, 's');    // skin V at the collar
  switch (st) {
    case 'hoodie': {
      add(...torso(C, 't', { j0: hip + 1 }));
      hem('T');
      front(-2, 2, hip + 3, hip + 5, 'T');                       // kangaroo pocket
      front(-1, 1, hip + 4, hip + 4, 't');
      // hood bunched behind the neck
      add(C.ell([0, sh + 0.6, -cd - 0.6 + D.hz], [cw - 0.3, 1.9, 1.7], 't', { belly: 'T' }));
      add(C.ell([0, sh + 1.0, -cd - 0.2 + D.hz], [cw - 1.5, 1.2, 1.0], 'T', { paint: 1 }));
      if (L.top.ears === 'panda') add(C.sph([2.3, sh + 2.6, -cd - 1.2 + D.hz], 1.0, '#1f1d24', { m: 1 }));
      if (L.top.ears === 'cat') add(C.cap([2.2, sh + 2, -cd - 1.2 + D.hz], [2.6, sh + 3.6, -cd - 1.4 + D.hz], 1.1, 0.3, 't', { m: 1 }));
      // drawstrings
      C.decal('body', [0.0, sh - 1.2, cd + 0.5], [0, 0, 1], ['w.w', 'w.w', 'w.w', '...', 'w.w'], { w: L.top.strings || '#f4f4f4' }, 0.45, { snap: false, lift: 0.05 });
      if (L.top.graphic) chestGraphic(C, L.top.graphic, sh - 3.4);
      break;
    }
    case 'jacket': { // 2050 techwear trainer jacket: colour-blocked yoke, neon piping, high collar
      add(...torso(C, 't'));
      front(-1, 1, hip + 2, sh, 't3');                           // inner tee
      front(-2, -2, hip + 2, sh - 1, L.top.glow || 'g', { glow: L.top.glow ? 2 : 0 });
      front(2, 2, hip + 2, sh - 1, 't2');                        // zipper flap
      add(C.vb(-cw - 1, cw + 1, sh - 1, sh, -cd - 1, cd + 1, 't2', { paint: 1 }));   // yoke
      hem('t2');
      add(C.vb(-2, 2, sh + 1, sh + 1, -2 + D.hz, 1 + D.hz, 't2'));                   // high collar
      add(C.vb(-1, 1, sh + 1, sh + 1, 1 + D.hz, 1 + D.hz, 't3', { paint: 1 }));
      if (L.top.glow) add(C.vb(-cw - 1, cw + 1, sh - 2, sh - 2, -cd - 1, cd + 1, L.top.glow, { paint: 1, glow: 2, side: L.top.glow, sideT: 0.3, front: 't', frontT: 0.6 }));
      // back emblem
      const em = L.top.emblem || 'bolt';
      backEmblem(C, em, sh - 3.5, L.top.glow || '#5ff6ff');
      break;
    }
    case 'tracksuit': {
      add(...torso(C, 't'));
      front(0, 0, hip + 2, sh, 't2');                            // zip
      add(C.vb(-cw - 1, cw + 1, hip + 2, hip + 2, -cd - 1, cd + 1, 't2', { paint: 1 }));
      add(C.vb(-2, 2, sh + 1, sh + 1, -2 + D.hz, 1 + D.hz, 't'));                    // collar
      add(C.vb(-2, 2, sh + 1, sh + 1, -2 + D.hz, 1 + D.hz, 't2', { paint: 1, top: 't2' }));
      add(C.vb(-cw, -cw, hip + 2, sh - 1, -cd, cd, 't2', { paint: 1, side: 't2', sideT: 0.5 }));
      add(C.vb(cw, cw, hip + 2, sh - 1, -cd, cd, 't2', { paint: 1, side: 't2', sideT: 0.5 }));
      C.flags.armStripe = L.top.color2 || '#f4f4f4';
      if (L.top.emblem) backEmblem(C, L.top.emblem, sh - 3.5, L.top.color2 || '#fff');
      break;
    }
    case 'leather': { // studded biker jacket over a tee, back patch
      add(...torso(C, 't'));
      front(-1, 1, sh - 3, sh, 't3');                            // inner tee V
      front(0, 0, sh - 3, sh - 3, 't');
      front(-cw, -2, sh - 1, sh, 'T'); front(2, cw, sh - 1, sh, 'T');               // lapels
      front(1, 1, hip + 2, sh - 4, '#c9ccd6');                   // offset zip
      hem('T');
      // studs on the shoulders
      for (const x of [-cw, -cw + 2, cw - 2, cw]) add(C.vb(x, x, sh + 1, sh + 1, 0, 0, '#d9dde6'));
      if (L.top.patch !== false) backPatch(C, sh - 3.5);
      break;
    }
    case 'vest': { // sleeveless denim vest with patches
      C.sleeve = 'none';
      add(...torso(C, 't'));
      front(-1, 1, hip + 2, sh, 't2');                           // tee underneath
      front(-cw, -2, sh - 1, sh, 'T'); front(2, cw, sh - 1, sh, 'T');
      hem('T');
      add(C.vb(-cw - 1, cw + 1, sh - 3, sh, -cd - 1, cd + 1, 'tl', { paint: 1, side: 'tl', sideT: 0.7 }));
      // patches
      C.decal('body', [-2.2, sh - 3.5, cd + 0.5], [0, 0, 1], ['rrr', 'ryr', 'rrr'], { r: '#e8434f', y: '#ffd33b' }, 0.5, { snap: false, lift: 0.05 });
      C.decal('body', [2.3, hip + 4, cd + 0.5], [0, 0, 1], ['kkkk', 'kwwk', 'kkkk'], { k: '#1d1a24', w: '#62d36b' }, 0.45, { snap: false, lift: 0.05 });
      backPatch(C, sh - 3.5, 'riff');
      break;
    }
    case 'tank': {
      C.sleeve = 'none';
      add(...torso(C, 't'));
      front(-1, 1, sh, sh, 's');
      back(-1, 1, sh, sh, 's');
      add(C.vb(-cw, -cw + 1, sh - 1, sh, -cd, cd, 's', { paint: 1 })); add(C.vb(cw - 1, cw, sh - 1, sh, -cd, cd, 's', { paint: 1 }));
      break;
    }
    case 'labcoat': {
      add(...torso(C, 't'));
      front(-1, 1, sh - 3, sh, 't2');                            // shirt + tie
      front(0, 0, sh - 4, sh - 1, 't3');
      front(-2, -2, hip + 2, sh, 'T'); front(2, 2, hip + 2, sh, 'T');               // lapel edges
      front(-cw, -cw + 1, hip + 4, hip + 4, 'T'); front(cw - 1, cw, sh - 3, sh - 3, 'T');
      front(cw - 1, cw - 1, sh - 2, sh - 2, '#3a8bff');          // pen
      // coat tails (open at the front)
      const tl = Math.round(D.torso * 0.55);
      add(C.vb(-cw, cw, hip - tl, hip + 1, -cd, cd, 't'));
      add(C.vb(-1, 1, hip - tl, hip + 1, 1, cd, 'b', { sub: 1 }));
      add(C.vb(-cw, cw, hip - tl, hip - tl, -cd, cd, 'T', { paint: 1 }));
      C.flags.coat = tl;
      break;
    }
    case 'apron': {
      add(...torso(C, 't2'));
      C.sleeve = 'short';
      C.flags.apron = { color: 't', len: Math.round(D.torso * 0.4) };
      break;
    }
    case 'suit': {
      add(...torso(C, 't'));
      front(-1, 1, sh - 4, sh, 't2');                            // shirt V
      front(0, 0, sh - 5, sh - 1, 't3');                         // tie
      front(0, 0, sh, sh, 't3');
      front(-2, -2, sh - 4, sh, 'T'); front(2, 2, sh - 4, sh, 'T');                 // lapels
      front(0, 0, hip + 3, hip + 3, '#20202a');                  // button
      add(C.vb(-1, 1, sh + 1, sh + 1, -1 + D.hz, 1 + D.hz, 't2'));                    // shirt collar
      C.flags.cuff = 't2';
      break;
    }
    case 'happi': { // festival coat: contrasting collar band, obi, wide sleeves
      add(...torso(C, 't'));
      front(-1, 1, hip + 3, sh, L.top.inner || 's');
      front(-2, -2, hip + 2, sh, 't2'); front(2, 2, hip + 2, sh, 't2');
      add(C.vb(-2, 2, sh, sh, -cd, cd, 't2', { paint: 1, top: 't2' }));
      add(C.vb(-cw - 1, cw + 1, hip + 2, hip + 3, -cd - 1, cd + 1, 't3', { paint: 1 }));                          // obi
      C.decal('body', [-2, sh - 2.5, cd + 0.5], [0, 0, 1], ['w', '.', 'w', 'w', '.', 'w'], { w: '#fbfbf6' }, 0.4, { snap: false, lift: 0.05 });
      C.decal('body', [2, sh - 2.5, cd + 0.5], [0, 0, 1], ['w', 'w', '.', 'w', '.', 'w'], { w: '#fbfbf6' }, 0.4, { snap: false, lift: 0.05 });
      backEmblem(C, 'matsuri', sh - 3.5, L.top.color2 || '#fff');
      C.sleeve = 'wide';
      break;
    }
    case 'uniform': { // staff polo: collar, placket, name tag
      add(...torso(C, 't'));
      add(C.vb(-2, 2, sh, sh + 1, -2 + D.hz, 1 + D.hz, 't2'));
      add(C.vb(-1, 1, sh + 1, sh + 1, -1 + D.hz, 0 + D.hz, 't2', { sub: 1 }));
      front(0, 0, sh - 3, sh - 1, 't2');
      hem('T');
      if (!L.acc.badge) C.decal('body', [2.1, sh - 2.5, cd + 0.5], [0, 0, 1], ['wwww', 'wkkw', 'wwww'], { w: '#fbfbf6', k: '#5a6170' }, 0.45, { snap: false, lift: 0.05 });
      C.sleeve = 'short';
      break;
    }
    case 'sailor': {
      add(...torso(C, 't'));
      add(C.vb(-cw - 1, cw + 1, sh - 1, sh, -cd - 1, cd + 1, 't2', { paint: 1 }));
      back(-cw, cw, sh - 3, sh, 't2');
      front(-1, 1, sh - 2, sh - 2, 't3'); front(0, 0, sh - 3, sh - 3, 't3');         // scarf
      add(C.vb(-cw - 1, cw + 1, sh - 2, sh - 2, -cd - 1, -cd, 'w', { paint: 1 }));
      break;
    }
    case 'gakuran': {
      add(...torso(C, 't'));
      add(C.vb(-2, 2, sh + 1, sh + 1, -2 + D.hz, 1 + D.hz, 't'));
      for (let j = hip + 3; j <= sh - 1; j += 2) front(0, 0, j, j, '#e7c35a');
      hem('T');
      break;
    }
    case 'kimono': case 'gi': {
      add(...torso(C, 't'));
      // crossover collar (left over right): diagonal lining bands
      for (let n = 0; n < 4; n++) { front(-1 + n - 1, -1 + n - 1, sh - n, sh - n, 't2'); front(1 - n + 1, 1 - n + 1, sh - n, sh - n, 't2'); }
      front(0, 0, sh - 3, sh, 's'); front(-1, 1, sh, sh, 's');
      add(C.vb(-cw - 1, cw + 1, hip + 2, hip + 3, -cd - 1, cd + 1, 't3', { paint: 1 }));                           // obi / belt
      if (st === 'kimono') {
        add(C.box([0, hip + 3, -cd - 1.2], [2.2, 1.6, 1.0], 't3', { round: 0.8 }));                                // obi bow
        C.sleeve = 'wide';
        if (L.bottom.style !== 'hakama') { C.legWear = 'hidden'; add(C.cap([0, hip + 2, -0.2], [0, 2.4, -0.1], cw + 0.6, cw + 0.9, 't')); add(C.vb(-cw - 2, cw + 2, 2, 2, -cd - 2, cd + 2, 't2', { paint: 1 })); front(0, 0, 3, hip + 1, 't2'); }
      } else C.sleeve = 'gi';
      break;
    }
    case 'field': { // khaki field shirt: collar, flap pockets, rolled sleeves
      add(...torso(C, 't'));
      add(C.vb(-2, 2, sh, sh + 1, -2 + D.hz, 1 + D.hz, 'T'));
      add(C.vb(-1, 1, sh + 1, sh + 1, -1 + D.hz, 0 + D.hz, 'T', { sub: 1 }));
      front(-1, 1, sh, sh, 's'); front(0, 0, sh - 1, sh - 1, 's');
      front(-2, -1, sh - 3, sh - 2, 'T'); front(1, 2, sh - 3, sh - 2, 'T');
      front(-2, -1, sh - 2, sh - 2, 't2'); front(1, 2, sh - 2, sh - 2, 't2');
      front(0, 0, hip + 2, sh - 2, 'T');
      if (L.top.patch) C.decal('armL', [D.armI1 + 0.5, sh - 2.5, -0.5], [1, 0, 0], ['.gg.', 'gyyg', 'gyyg', '.gg.'], { g: L.top.patch, y: '#ffd33b' }, 0.45, { lift: 0.3 });
      C.sleeve = 'rolled';
      break;
    }
    case 'cardigan': {
      add(...torso(C, 't', {}));
      add(C.vb(-cw - 1, cw + 1, hip + 2, sh, -cd - 1, cd + 1, 't', { paint: 1, dither: { col: 'tl', amt: 0.25 } }));
      front(-1, 1, sh - 3, sh, 't2');
      front(-2, -2, hip + 2, sh, 'T'); front(2, 2, hip + 2, sh, 'T');
      for (let j = hip + 3; j <= sh - 3; j += 2) front(-2, -2, j, j, '#e7d9b8');
      hem('T');
      break;
    }
    case 'sweater': {
      add(...torso(C, 't'));
      add(C.vb(-cw - 1, cw + 1, hip + 2, sh, -cd - 1, cd + 1, 't', { paint: 1, stripes: L.top.stripes ? { axis: 'y', p: 2, w: 1, col: 't2', o: 0.5 } : undefined }));
      add(C.vb(-2, 2, sh + 1, sh + 1, -2 + D.hz, 1 + D.hz, 'T'));
      hem('T');
      break;
    }
    case 'hawaiian': {
      add(...torso(C, 't'));
      add(C.vb(-cw - 1, cw + 1, hip + 2, sh, -cd - 1, cd + 1, 't', { paint: 1, spots: { col: 't2', d: 0.32, s: 1.1, seed: 3 } }));
      front(-1, 1, sh - 1, sh, 's'); front(0, 0, sh - 2, sh - 2, 's');
      front(-2, -2, sh - 2, sh, 'T'); front(2, 2, sh - 2, sh, 'T');
      C.sleeve = 'short';
      break;
    }
    case 'hivis': {
      add(...torso(C, 't2'));
      add(C.vb(-cw - 1, cw + 1, hip + 2, sh, -cd - 1, cd + 1, 't', { paint: 1 }));
      add(C.vb(-cw - 1, cw + 1, hip + 4, hip + 4, -cd - 1, cd + 1, '#e8eef2', { paint: 1, glow: 1 }));
      front(-1, 1, sh - 2, sh, 't2');
      C.sleeve = 'short';
      break;
    }
    case 'dress': { // idol dress: bodice + bow + frills
      add(...torso(C, 't'));
      front(-1, 1, sh, sh, 's');
      add(C.vb(-cw - 1, cw + 1, sh, sh, -cd - 1, cd + 1, 'w', { paint: 1, top: 'w' }));
      add(C.box([0, sh - 1.2, cd + 0.9], [1.6, 0.7, 0.5], 't2'));                     // bow
      add(C.vb(0, 0, sh - 1, sh - 1, cd + 1, cd + 1, 't3'));
      add(C.vb(-cw - 1, cw + 1, hip + 2, hip + 2, -cd - 1, cd + 1, 't2', { paint: 1 }));
      C.sleeve = 'puff';
      break;
    }
    case 'tee': default: {
      add(...torso(C, 't'));
      neckline();
      add(C.vb(-1, 1, sh, sh, -cd, -cd + 1, 'T', { paint: 1 }));
      C.sleeve = L.top.sleeves || 'short';
      if (L.top.graphic) chestGraphic(C, L.top.graphic, sh - 3);
      break;
    }
  }
  if (C.flags.overalls) {
    front(-2, 2, hip + 2, sh - 2, 'b'); front(-2, 2, hip + 2, sh - 2, 'b');
    add(C.vb(-2, 2, hip + 2, sh - 2, cd, cd, 'b'));
    front(-2, -2, sh - 1, sh, 'b'); front(2, 2, sh - 1, sh, 'b');
    back(-2, -2, hip + 2, sh, 'b'); back(2, 2, hip + 2, sh, 'b');
    front(-2, -2, sh - 2, sh - 2, '#e7c35a'); front(2, 2, sh - 2, sh - 2, '#e7c35a');
    front(-1, 1, sh - 4, sh - 4, 'B');
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
};
function chestGraphic(C, g, y) {
  const rows = GRAPHICS[g] || GRAPHICS.star;
  C.decal('body', [0, y, C.D.cd + 0.5], [0, 0, 1], rows, { p: '#ff5d7c', y: '#ffd33b', o: '#d78a3c', b: '#5a2e1c', k: '#1d1a24', c: '#38f0ff', w: '#ffffff' }, 0.5, { snap: false, lift: 0.05 });
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
  const { D, L } = C, sl = C.sleeve;
  const handCol = L.acc.gloves ? (L.acc.gloves.color || '#2b2b33') : 's';
  for (const s of [1, -1]) {
    const A = C.arm(s);
    const i0 = s * D.armI0, i1 = s * D.armI1, io = s > 0 ? Math.max(i0, i1) : Math.min(i0, i1), ii = s > 0 ? Math.min(i0, i1) : Math.max(i0, i1);
    const k0 = D.armK0 + (D.hunch ? 0 : 0), k1 = D.armK1;
    const top = D.shJ - 1, wr = D.handJ1 + 1, h0 = D.handJ0, h1 = D.handJ1;
    // sleeve / skin
    A.push(C.vb(i0, i1, wr, top, k0, k1, 's'));
    if (sl === 'long' || sl === 'wide' || sl === 'gi') A.push(C.vb(i0, i1, wr, top, k0, k1, 't', { paint: 1 }));
    if (sl === 'long') A.push(C.vb(i0, i1, wr, wr, k0, k1, C.flags.cuff || 'T', { paint: 1 }));
    if (sl === 'short' || sl === 'puff') A.push(C.vb(i0, i1, top - 2, top, k0, k1, 't', { paint: 1 }));
    if (sl === 'puff') A.push(C.vb(i0, io, top - 2, top - 1, k0 - 1, k1 + 1, 't'), C.vb(io + s, io + s, top - 2, top - 1, k0, k1, 't'), C.vb(i0, io + s, top - 2, top - 2, k0 - 1, k1 + 1, 'w', { paint: 1 }));
    if (sl === 'rolled') A.push(C.vb(i0, i1, top - 4, top, k0, k1, 't', { paint: 1 }), C.vb(i0, i1, top - 4, top - 4, k0, k1, 'tl', { paint: 1 }));
    if (sl === 'gi') A.push(C.vb(i0, i1, wr, wr + 2, k0, k1, 's', { paint: 1 }));
    if (sl === 'wide') { // hanging kimono / happi sleeve
      A.push(C.vb(i0, io + s, wr, wr + 3, k0 - 1, k1 + 1, 't'));
      A.push(C.vb(i0, io + s, wr, wr, k0 - 1, k1 + 1, 't2', { paint: 1 }));
    }
    if (C.flags.armStripe && (sl === 'long')) A.push(C.vb(io, io, wr + 1, top, k0, k1, C.flags.armStripe, { paint: 1 }));
    // hand
    A.push(C.vb(i0, i1, h0, h1, k0, k1, handCol));
    if (L.acc.gloves && L.acc.gloves.style === 'fingerless') A.push(C.vb(i0, i1, h0, h0, k0, k1, 's', { paint: 1 }));
    // tattoos (paint stripes on bare upper arms)
    if (L.face.tattoo && sl !== 'long') A.push(C.vb(i0, i1, top - 6, top - 1, k0, k1, L.face.tattoo, { paint: 1, stripes: { axis: 'y', p: 2, w: 1, col: L.face.tattoo }, dither: { col: 's', amt: 0.35 } }));
  }
}

// ============================================================ head & hair
function headGeo(C) {
  const D = C.D;
  return { J0: D.J0, J1: D.J1, z: D.hz, fz: D.faceZ, c: (D.J0 + D.J1) / 2, hl: D.hairline, eyeTop: D.eyeY + 1.6, small: D.skullH < 10 };
}

// hair helmet around the skull (before the skull is added); ext = thickness
function shell(C, G, o = {}) {
  const ext = o.ext ?? 1, bot = o.bot ?? G.J0, top = G.J1 + ext + (o.lift || 0);
  const cy = (bot + top) / 2, hy = (top - bot) / 2 + 0.45;
  return C.box([0, cy, G.z - 0.3 - (o.back || 0) * 0.5], [4.45 + ext + (o.wide || 0), hy, 4.4 + ext + (o.back || 0) * 0.5], 'h',
    Object.assign({ round: o.round ?? 2.2, belly: 'H', bellyT: 0.5, noise: o.noise, noiseScale: o.noiseScale ?? 1.6 }, o.opts));
}
// remove hair in front of the face below the hairline (cols −w..w)
const faceWindow = (C, G, w = 4, hl = G.hl) => C.vb(-w, w, G.J0 - 3, hl - 1, 1 + G.z, 9 + G.z, 'h', { sub: 1 });
// open the shell around the ears (short styles)
const earCut = (C, G, j1 = G.J0 + 4) => C.vb(5, 6, G.J0 - 2, j1, -2 + G.z, 1 + G.z, 'h', { sub: 1, m: 1 });
// fringe of downward spikes at the front (z = face + 1): xs = tip x, len = rows below the hairline
function fringe(C, G, tips, o = {}) {
  const out = [], zf = G.fz + 0.5 + (o.dz || 0);
  for (const [x, low, w] of tips) {
    const ww = w ?? 1.5, top = G.J1 + 0.5;
    out.push(C.poly([0, 0, zf], [[x - ww, top], [x + ww, top], [x + (o.lean || 0), low]], 0.45, 'h', { plane: 'xy', belly: 'H', bellyT: 0.5 }));
  }
  return out;
}
const fringeBlock = (C, G, low, w = 4) => C.vb(-w, w, low, G.J1, Math.round(G.fz + 0.5), Math.round(G.fz + 0.5), 'h', { belly: 'H', bellyT: 0.6 });
const spike = (C, a, b, r0, r1 = 0.3, o = {}) => C.cap(a, b, r0, r1, 'h', Object.assign({ belly: 'H', bellyT: 0.5 }, o));

const HAIR = {
  spiky(C, G, pre, post, top) {
    pre.push(shell(C, G, { ext: 1 }), faceWindow(C, G, 4), earCut(C, G));
    const z = G.z, J1 = G.J1, c = G.c, tip = C.L.hair.color2 ? { tip: 'h2', tipT: 0.55 } : {};
    top(spike(C, [0, J1 - 0.5, z - 0.5], [0.3, J1 + 3.6, z - 2.8], 2.1, 0.3, tip));
    top(spike(C, [2.6, J1 - 0.8, z - 0.2], [4.6, J1 + 2.6, z - 2.2], 1.8, 0.3, tip));
    top(spike(C, [-2.6, J1 - 0.8, z - 0.2], [-4.4, J1 + 2.8, z - 2.4], 1.8, 0.3, tip));
    top(spike(C, [1.2, J1 - 0.5, z + 2.2], [2.2, J1 + 2.4, z + 4.0], 1.6, 0.3, tip));
    top(spike(C, [-1.6, J1 - 0.5, z + 2.0], [-2.6, J1 + 2.2, z + 3.6], 1.5, 0.3, tip));
    post.push(spike(C, [4.2, c + 2.5, z - 1.5], [7.4, c + 3.2, z - 3.2], 1.6, 0.3, tip));
    post.push(spike(C, [-4.2, c + 2.5, z - 1.5], [-7.4, c + 2.8, z - 3.0], 1.6, 0.3, tip));
    post.push(spike(C, [0, c + 1.5, z - 4.2], [0.3, c + 1.0, z - 7.6], 1.9, 0.3, tip));
    post.push(spike(C, [3.0, c - 1, z - 4.0], [4.6, c - 2.6, z - 6.6], 1.6, 0.3, tip));
    post.push(spike(C, [-3.0, c - 1, z - 4.0], [-4.6, c - 2.4, z - 6.4], 1.6, 0.3, tip));
    post.push(spike(C, [4.6, G.J0 + 4.5, z + 1.5], [5.3, G.J0 + 1.4, z + 2.4], 1.2, 0.3));        // sideburn spikes
    post.push(spike(C, [-4.6, G.J0 + 4.5, z + 1.5], [-5.3, G.J0 + 1.4, z + 2.4], 1.2, 0.3));
    post.push(...fringe(C, G, [[-3.3, G.hl - 1.8, 1.6], [-0.9, G.hl - 2.6, 1.7], [1.7, G.hl - 2.2, 1.7], [3.7, G.hl - 1.4, 1.3]]));
  },
  messy(C, G, pre, post, top) {
    pre.push(shell(C, G, { ext: 1, noise: 0.45 }), faceWindow(C, G, 4), earCut(C, G));
    const z = G.z, J1 = G.J1;
    top(spike(C, [1, J1, z - 1], [1.8, J1 + 2.2, z - 2.6], 1.6, 0.5));
    top(spike(C, [-1.6, J1, z], [-2.8, J1 + 1.8, z - 1], 1.5, 0.5));
    top(spike(C, [3, J1 - 1, z + 1], [4.6, J1 + 0.8, z + 2], 1.3, 0.5));
    post.push(spike(C, [0, G.c, z - 4.5], [0.6, G.c - 1.6, z - 6.6], 1.5, 0.5));
    post.push(spike(C, [3.6, G.c - 1.5, z - 3.5], [5.4, G.c - 3, z - 4.6], 1.3, 0.4));
    post.push(spike(C, [-3.6, G.c - 1.5, z - 3.5], [-5.4, G.c - 2.6, z - 4.8], 1.3, 0.4));
    post.push(...fringe(C, G, [[-3.2, G.hl - 1.6, 1.5], [-1.2, G.hl - 2.4, 1.4], [0.8, G.hl - 1.8, 1.3], [2.8, G.hl - 2.5, 1.6]], { lean: 0.6 }));
  },
  bob(C, G, pre, post) {
    C.earsVisible = false;
    pre.push(shell(C, G, { ext: 1, bot: G.J0 - 1, round: 1.8, wide: 0.3 }), faceWindow(C, G, 4));
    post.push(fringeBlock(C, G, G.hl - 1, 4));
    post.push(C.vb(-5, 5, G.J0 - 1, G.J0 - 1, -5 + G.z, 4 + G.z, 'H', { paint: 1 }));
    post.push(C.vb(-1, -1, G.hl - 1, G.hl - 1, Math.round(G.fz + 0.5), Math.round(G.fz + 0.5), 'h', { sub: 1 }));
  },
  ponytail(C, G, pre, post) {
    pre.push(shell(C, G, { ext: 1 }), faceWindow(C, G, 4), earCut(C, G));
    post.push(...fringe(C, G, [[-3.4, G.hl - 1.4, 1.6], [-1.6, G.hl - 2.0, 1.6], [3.0, G.hl - 2.6, 2.4]], { lean: -0.8 }));
    post.push(spike(C, [-4.6, G.J0 + 5, G.z + 1.5], [-5.0, G.J0 + 0.8, G.z + 2.0], 1.1, 0.4), spike(C, [4.6, G.J0 + 5, G.z + 1.5], [5.0, G.J0 + 0.8, G.z + 2.0], 1.1, 0.4));
    const piv = [0, G.c + 2.5, G.z - 5.6];
    C.extra.push({ n: 'hairTail', parent: 'head', p: C.P(...piv), sway: { axis: 'z', amp: 0.1, freq: 1.3, move: 1.5 }, s: [
      C.sph([0, G.c + 2.5, G.z - 5.6], 1.1, 'h2'),
      spike(C, [0, G.c + 2.5, G.z - 6.4], [0, G.c + 0.8, G.z - 8.2], 1.8, 1.6),
      spike(C, [0, G.c + 0.8, G.z - 8.2], [0, G.c - 4.0, G.z - 8.0], 1.6, 0.5),
    ] });
  },
  twin_buns(C, G, pre, post, top) {
    pre.push(shell(C, G, { ext: 1 }), faceWindow(C, G, 4), earCut(C, G));
    post.push(...fringe(C, G, [[-3.2, G.hl - 1.8, 1.6], [-1.0, G.hl - 2.4, 1.6], [1.2, G.hl - 2.2, 1.6], [3.3, G.hl - 1.6, 1.5]]));
    post.push(spike(C, [-4.6, G.J0 + 5, G.z + 1.6], [-5.0, G.J0 + 0.6, G.z + 2.2], 1.1, 0.4), spike(C, [4.6, G.J0 + 5, G.z + 1.6], [5.0, G.J0 + 0.6, G.z + 2.2], 1.1, 0.4));
    top(C.sph([3.6, G.J1 + 1.4, G.z - 1.2], 2.5, 'h', { m: 1, belly: 'H', bellyT: 0.4, stripes: { axis: 'y', p: 1.6, w: 0.5, col: 'H', o: 0.3 } }));
    top(C.tor([3.3, G.J1 - 0.3, G.z - 1.1], 1.7, 0.7, 'h2', { m: 1, rot: [0, 0, -20] }));
  },
  twin_tails(C, G, pre, post) {
    pre.push(shell(C, G, { ext: 1 }), faceWindow(C, G, 4), earCut(C, G));
    post.push(...fringe(C, G, [[-3.4, G.hl - 1.6, 1.4], [-1.4, G.hl - 2.4, 1.5], [0.8, G.hl - 2.2, 1.5], [3.0, G.hl - 1.8, 1.6]]));
    post.push(spike(C, [-4.6, G.J0 + 5, G.z + 1.6], [-5.0, G.J0 + 0.6, G.z + 2.2], 1.1, 0.4), spike(C, [4.6, G.J0 + 5, G.z + 1.6], [5.0, G.J0 + 0.6, G.z + 2.2], 1.1, 0.4));
    for (const s of [1, -1]) {
      const piv = [s * 5.2, G.J1 - 0.5, G.z - 1.5];
      C.extra.push({ n: s > 0 ? 'hairL' : 'hairR', parent: 'head', p: C.P(...piv), sway: { axis: 'z', amp: 0.09, freq: 1.4, move: 1.5, phase: s > 0 ? 0 : 1.2 }, s: [
        C.sph(piv, 1.1, 'h2'),
        spike(C, [s * 5.8, G.J1 - 0.6, G.z - 1.6], [s * 7.4, G.c - 1, G.z - 2.0], 1.8, 1.7),
        spike(C, [s * 7.4, G.c - 1, G.z - 2.0], [s * 6.8, G.J0 - 5.5, G.z - 2.2], 1.7, 0.5),
      ] });
    }
  },
  long(C, G, pre, post) {
    C.earsVisible = false;
    pre.push(shell(C, G, { ext: 1, bot: G.J0 - 1, wide: 0.2 }), faceWindow(C, G, 4));
    post.push(...fringe(C, G, [[-3.2, G.hl - 1.8, 1.7], [-0.6, G.hl - 2.5, 1.8], [2.0, G.hl - 2.0, 1.8], [3.8, G.hl - 1.4, 1.2]]));
    // back curtain down to the shoulder blades + front side locks
    post.push(C.box([0, G.J0 - 2.5, G.z - 4.2], [5.2, 3.6, 1.4], 'h', { round: 1.2, belly: 'H', bellyT: 0.4 }));
    post.push(C.vb(-5, 5, G.J0 - 6, G.J0 - 6, -6 + G.z, -3 + G.z, 'h', { sub: 1, m: 0 }));
    post.push(spike(C, [4.8, G.J0 + 4, G.z + 1.2], [5.0, G.J0 - 3.5, G.z + 1.0], 1.2, 0.8), spike(C, [-4.8, G.J0 + 4, G.z + 1.2], [-5.0, G.J0 - 3.5, G.z + 1.0], 1.2, 0.8));
  },
  hime(C, G, pre, post) {
    C.earsVisible = false;
    pre.push(shell(C, G, { ext: 1, bot: G.J0 - 1, round: 1.6, wide: 0.2 }), faceWindow(C, G, 4));
    post.push(fringeBlock(C, G, G.hl - 1, 4));
    post.push(C.vb(-5, -4, G.J0 - 1, G.J0 + 5, 1 + G.z, 5 + G.z, 'h'), C.vb(4, 5, G.J0 - 1, G.J0 + 5, 1 + G.z, 5 + G.z, 'h'));
    post.push(C.box([0, G.J0 - 3, G.z - 4.0], [5.2, 4.2, 1.5], 'h', { round: 0.8, belly: 'H', bellyT: 0.4 }));
  },
  mohawk(C, G, pre, post) {
    // shaved sides (stubble paint is applied after the skull) + tall crest
    C.flags.shaved = true;
    const z = G.z, J1 = G.J1, tipc = C.L.hair.color2 ? { grad: { axis: 'y', to: 'h2', a: J1 + 2, b: J1 + 7 } } : { grad: { axis: 'y', to: 'hl', a: J1 + 3, b: J1 + 7 } };
    const pts = [[4.2, J1 - 1.5], [5.6, J1 + 2.5], [3.4, J1 + 1.2], [3.2, J1 + 6.8], [1.2, J1 + 1.6], [0, J1 + 7.6], [-1.4, J1 + 1.6], [-2.6, J1 + 6.8], [-3.6, J1 + 1.0], [-6.4, J1 + 4.6], [-5.0, J1 - 1.0], [-5.6, G.c], [-4.6, G.c - 1]];
    post.push(C.poly([0, 0, 0], pts.map(([zz, y]) => [zz + z, y]), 1.0, 'h', Object.assign({ plane: 'zy' }, tipc)));
  },
  buzz(C, G, pre, post) { C.flags.buzz = true; },
  bald() { },
  side_part(C, G, pre, post) {
    pre.push(shell(C, G, { ext: 1, round: 2.6 }), faceWindow(C, G, 4), earCut(C, G));
    const zf = G.fz + 0.5;
    post.push(C.poly([0, 0, zf], [[-4.6, G.J1 + 0.5], [4.6, G.J1 + 0.5], [4.6, G.hl - 0.5], [1.5, G.hl - 1.5], [-0.8, G.hl + 0.6], [-4.6, G.hl]], 0.45, 'h', { plane: 'xy', belly: 'H', bellyT: 0.5 }));
    post.push(C.vb(-2, -2, G.J1, G.J1 + 1, -3 + G.z, 3 + G.z, 'H', { paint: 1, top: 'H' }));
    post.push(C.box([0.8, G.J1 + 1, G.z + 1.5], [3.4, 0.8, 2.6], 'h', { round: 0.8 }));
  },
  slick(C, G, pre, post) {
    pre.push(shell(C, G, { ext: 1, round: 2.6 }), faceWindow(C, G, 4, G.hl + 1), earCut(C, G));
    post.push(C.vb(-5, 5, G.c, G.J1 + 1, -6 + G.z, 6 + G.z, 'h', { paint: 1, stripes: { axis: 'x', p: 2, w: 1, col: 'hl' }, top: 'h' }));
    post.push(C.box([0, G.J1 + 0.8, G.z + 2.5], [3.6, 1.0, 2.2], 'h', { round: 0.9, stripes: { axis: 'x', p: 2, w: 1, col: 'hl' } }));
  },
  pixie(C, G, pre, post, top) {
    pre.push(shell(C, G, { ext: 1, noise: 0.25 }), faceWindow(C, G, 4), earCut(C, G));
    post.push(C.poly([0, 0, G.fz + 0.5], [[-4.6, G.J1 + 0.5], [4.6, G.J1 + 0.5], [4.6, G.hl], [2.6, G.hl - 2.0], [0.4, G.hl - 1.0], [-1.8, G.hl - 2.6], [-4.6, G.hl - 0.5]], 0.45, 'h', { plane: 'xy', belly: 'H', bellyT: 0.5 }));
    top(spike(C, [0.6, G.J1, G.z - 1], [1.2, G.J1 + 1.8, G.z - 2.6], 1.5, 0.5));
  },
  afro(C, G, pre, post) {
    C.earsVisible = false;
    pre.push(C.sph([0, G.c + 2.4, G.z - 1.2], 7.4, 'h', { noise: 0.6, noiseScale: 1.5, belly: 'H', bellyT: 0.45 }), faceWindow(C, G, 4, G.hl + 0.5));
  },
  curly(C, G, pre, post) {
    pre.push(C.ell([0, G.c + 1.4, G.z - 0.8], [6.0, 6.0, 6.0], 'h', { noise: 0.75, noiseScale: 1.1, belly: 'H', bellyT: 0.45, dither: { col: 'hl', amt: 0.18 } }), faceWindow(C, G, 4, G.hl), earCut(C, G, G.J0 + 3));
    post.push(C.sph([-2.6, G.hl + 0.4, G.fz + 0.2], 1.6, 'h', { noise: 0.4, noiseScale: 1 }), C.sph([0.4, G.hl + 0.8, G.fz + 0.3], 1.6, 'h', { noise: 0.4, noiseScale: 1 }), C.sph([3.0, G.hl + 0.3, G.fz + 0.1], 1.5, 'h', { noise: 0.4, noiseScale: 1 }));
  },
  braid(C, G, pre, post) {
    pre.push(shell(C, G, { ext: 1 }), faceWindow(C, G, 4), earCut(C, G));
    post.push(...fringe(C, G, [[-3.2, G.hl - 2.0, 1.8], [-0.6, G.hl - 1.4, 1.7], [1.8, G.hl - 2.4, 1.9], [3.8, G.hl - 1.2, 1.1]]));
    const piv = [0, G.J0 + 2, G.z - 5.2];
    const s = [];
    for (let n = 0; n < 6; n++) s.push(C.sph([0, G.J0 + 1.4 - n * 1.5, G.z - 5.6 - Math.min(n, 2) * 0.3], n % 2 ? 1.15 : 1.45, n % 2 ? 'H' : 'h'));
    s.push(C.sph([0, G.J0 - 8, G.z - 6.2], 0.9, 'h2'), C.cap([0, G.J0 - 8.3, G.z - 6.2], [0, G.J0 - 10, G.z - 6.3], 1.1, 0.5, 'h'));
    C.extra.push({ n: 'hairTail', parent: 'head', p: C.P(...piv), sway: { axis: 'z', amp: 0.08, freq: 1.2, move: 1.4 }, s });
  },
  cap(C, G, pre, post) {
    pre.push(shell(C, G, { ext: 1, noise: 0.3 }), faceWindow(C, G, 4), earCut(C, G));
    post.push(...fringe(C, G, [[-3.0, G.hl - 1.6, 1.5], [-0.8, G.hl - 2.2, 1.5], [1.4, G.hl - 1.8, 1.5], [3.4, G.hl - 1.4, 1.3]]));
    post.push(spike(C, [3.6, G.J0 + 3, G.z - 3.6], [5.0, G.J0 + 0.8, G.z - 4.4], 1.1, 0.4), spike(C, [-3.6, G.J0 + 3, G.z - 3.6], [-5.0, G.J0 + 0.8, G.z - 4.4], 1.1, 0.4));
    if (!C.L.acc.cap && !C.hat) C.hatAuto = 'cap';
  },
  bun(C, G, pre, post, top) {
    pre.push(shell(C, G, { ext: 1, round: 2.6 }), faceWindow(C, G, 4, G.hl + 0.5), earCut(C, G));
    post.push(C.poly([0, 0, G.fz + 0.5], [[-4.6, G.J1 + 0.5], [4.6, G.J1 + 0.5], [4.6, G.hl - 1], [0.5, G.hl + 0.4], [-0.5, G.hl + 0.4], [-4.6, G.hl - 1]], 0.45, 'h', { plane: 'xy', belly: 'H', bellyT: 0.5 }));
    top(C.sph([0, G.J1 + 1.2, G.z - 2.6], 2.3, 'h', { belly: 'H', bellyT: 0.4, stripes: { axis: 'y', p: 1.5, w: 0.5, col: 'H' } }));
    top(C.tor([0, G.J1 + 0.4, G.z - 2.2], 1.5, 0.6, 'h2', { rot: [-35, 0, 0] }));
  },
  topknot(C, G, pre, post, top) {
    // bald crown with a ring of hair at the back/sides and a tiny knot
    pre.push(shell(C, G, { ext: 1, bot: G.J0 + 1 }), faceWindow(C, G, 4, G.hl + 2), earCut(C, G));
    pre.push(C.vb(-6, 6, G.J1 - 1, G.J1 + 3, -2 + G.z, 7 + G.z, 'h', { sub: 1 }));
    C.flags.crownShine = true;
    top(C.sph([0, G.J1 + 1.6, G.z - 2.5], 1.3, 'h'));
    top(C.cap([0, G.J1 + 1.2, G.z - 2.9], [0, G.J1 + 0.4, G.z - 4.2], 0.7, 0.6, 'h2'));
  },
};

function buildHead(C) {
  const { D, L } = C, Hd = C.parts.head, G = headGeo(C), z = G.z;
  const style = L.hair.style;
  const pre = C.hairPre, post = C.hairPost;
  const hatTop = C.hat ? (C.hatLine ?? G.J1 - 1) : Infinity;
  // shapes that would poke through a hat are skipped when one is worn
  const top = (sh) => { if (!C.hat) post.push(sh); };
  (HAIR[style] || HAIR.messy)(C, G, pre, post, top);
  if (C.hatAuto && !C.hat) { C.hat = C.hatAuto; }
  // neck
  if (D.neck) Hd.push(C.vb(-1, 1, D.shJ + 1, D.J0, -1 + z, 0 + z, 'S'));
  else Hd.push(C.vb(-1, 1, D.shJ + 1, D.J0, -1 + z, 0 + z, 'S'));
  Hd.push(...pre);
  // skull: rounded block, chin narrows one row
  Hd.push(C.box([0, G.c, z], [4.45, (G.J1 - G.J0) / 2 + 0.45, 4.45], 's', { round: 1.25 }));
  Hd.push(C.vb(4, 4, G.J0, G.J0, 1 + z, 4 + z, 's', { sub: 1, m: 1 }));
  Hd.push(C.vb(-4, 4, G.J0, G.J0, -4 + z, 4 + z, 'S', { paint: 1, belly: 'S', bellyT: 0.5, front: 's', frontT: 0.6 }));
  // ears
  if (C.earsVisible) Hd.push(C.vb(5, 5, D.J0 + 2, D.J0 + 4, -1 + z, 0 + z, 's', { m: 1 }), C.vb(5, 5, D.J0 + 3, D.J0 + 3, 0 + z, 0 + z, 'S', { m: 1, paint: 1 }));
  // shaved / buzz / bald scalp treatments
  if (C.flags.shaved) Hd.push(C.vb(-5, 5, G.J0 + 4, G.J1 + 1, -6 + z, 3 + z, 'm', { paint: 1, dither: { col: 's', amt: 0.45 } }));
  if (C.flags.buzz) {
    Hd.push(C.box([0, G.c + 0.5, z - 0.2], [4.6, (G.J1 - G.J0) / 2 + 0.6, 4.6], 'h', { round: 1.3, under: 1 }));
    Hd.push(C.vb(-5, 5, G.J0 + 4, G.J1 + 1, -6 + z, 6 + z, 'h', { paint: 1, dither: { col: 'H', amt: 0.35 } }));
    Hd.push(faceWindow(C, G, 4, G.hl + 1));
    Hd.push(C.box([0, G.c, z], [4.45, (G.J1 - G.J0) / 2 + 0.45, 4.45], 's', { round: 1.25, under: 1 }));
    Hd.push(C.vb(-5, 5, G.J0, G.hl, 1 + z, 6 + z, 's', { paint: 1 }));
    if (C.earsVisible) Hd.push(C.vb(5, 5, D.J0 + 2, D.J0 + 4, -1 + z, 0 + z, 's', { m: 1 }));
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
  C.eyes = { part: 'head', at: C.P(ex, ey, fz), dir: [0, 0, 1], style: es, iris: L.eyes.iris, px, snap: false, lift: 0.08 * C.u, cmap: L.eyes.cmap };
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
  if (f.stubble) Hd.push(C.vb(-4, 4, G.J0, G.J0 + 2, 0 + z, 4 + z, fc, { paint: 1, dither: { col: 's', amt: 0.55 }, jit: 0.03 }), C.vb(-4, 4, G.J0 + 3, G.J0 + 3, 2 + z, 4 + z, 's', { paint: 1 }), C.vb(-4, -4, G.J0 + 1, G.J0 + 4, -1 + z, 4 + z, fc, { paint: 1, m: 1, dither: { col: 's', amt: 0.5 } }));
  if (f.beard === 'full') Hd.push(C.vb(-4, 4, G.J0 - 1, G.J0 + 1, 1 + z, 5 + z, fc), C.vb(-4, -4, G.J0, G.J0 + 4, -1 + z, 4 + z, fc, { m: 1, paint: 1 }), C.vb(-2, 2, G.J0 + 1, G.J0 + 1, 5 + z, 5 + z, 's', { sub: 1 }));
  if (f.beard === 'goatee') Hd.push(C.vb(-1, 1, G.J0 - 1, G.J0, 3 + z, 5 + z, fc));
  if (f.beard === 'long') {
    Hd.push(C.cap([0, G.J0 + 0.5, z + 4.2], [0, G.J0 - 6, z + 4.2], 3.6, 1.4, fc, { noise: 0.25, noiseScale: 1.2, dither: { col: shade(C.pal.m, 0.9), amt: 0.2 } }));
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
  // ---------------------------------------------------------------- hats
  if (C.hat === 'cap') {
    const o = a.cap || {}, col = o.color || L.hair.capColor || '#e8434f', col2 = o.color2 || shade(col, 0.75);
    const back = o.style === 'back';
    Hd.push(C.box([0, G.J1 - 0.2, z - 0.2], [5.5, 2.5, 5.45], col, { round: 2.0, belly: shade(col, 0.8) }));
    Hd.push(C.vb(-6, 6, G.J1 - 3, G.J1 - 2, -7 + z, 7 + z, col, { sub: 1 }));
    Hd.push(C.vb(-5, 5, G.J1 - 1, G.J1 - 1, -6 + z, 6 + z, col2, { paint: 1 }));
    Hd.push(C.vb(0, 0, G.J1 + 2, G.J1 + 2, -1 + z, 1 + z, col2));
    if (back) Hd.push(C.box([0, G.J1 - 1, z - 6.4], [3.4, 0.45, 1.6], col2, { round: 0.4 }));
    else Hd.push(C.box([0, G.J1 - 1.15, z + 6.2], [3.8, 0.45, 2.0], col2, { round: 0.5, rot: [-6, 0, 0] }));
    const em = o.emblem || L.hair.capEmblem;
    if (em && !back) C.decal('head', [0, G.J1 + 0.6, G.fz + 1], [0, 0.25, 1], (GRAPHICS[em] || GRAPHICS.star), { p: '#ff5d7c', y: '#ffd33b', o: '#d78a3c', b: '#5a2e1c', k: '#1d1a24', c: '#38f0ff', w: '#ffffff' }, 0.42, { lift: 0.3 });
  }
  if (C.hat === 'safari_hat' || C.hat === 'straw_hat') {
    const straw = C.hat === 'straw_hat', o = a[C.hat] || {};
    const col = o.color || (straw ? '#e9c873' : '#c9b083'), band = o.color2 || (straw ? '#d2453a' : '#6b5232');
    const yb = G.J1 - 1.2, R = straw ? 8.6 : 7.2;
    Hd.push(C.box([0, G.J1 + 0.4, z - 0.2], [5.4, 2.5, 5.4], col, { round: 2.6, dither: straw ? { col: shade(col, 0.82), amt: 0.3 } : undefined }));
    Hd.push(C.cyl([0, yb - 0.2, z], [0, yb + 0.2, z], R, col, { dither: straw ? { col: shade(col, 0.82), amt: 0.3 } : undefined, belly: shade(col, 0.75) }));
    Hd.push(C.vb(-6, 6, yb + 1, yb + 1, -6 + z, 6 + z, band, { paint: 1 }));
    Hd.push(C.vb(-5, 5, G.J1 + 1, G.J1 + 3, 5 + z, 9 + z, col, { sub: 1 }));
  }
  if (C.hat === 'hard_hat') {
    const col = (a.hard_hat || {}).color || '#ffc928';
    Hd.push(C.box([0, G.J1 + 0.2, z - 0.1], [5.4, 2.6, 5.4], col, { round: 2.6 }));
    Hd.push(C.vb(-6, 6, G.J1 - 3, G.J1 - 2, -7 + z, 7 + z, col, { sub: 1 }));
    Hd.push(C.box([0, G.J1 - 1.2, z + 5.8], [4.4, 0.45, 1.2], col));
    Hd.push(C.vb(0, 0, G.J1 + 1, G.J1 + 3, -5 + z, 5 + z, shade(col, 0.85)));
  }
  if (C.hat === 'beanie') {
    const col = (a.beanie || {}).color || '#3a4a6a';
    Hd.push(C.box([0, G.J1 + 0.2, z - 0.2], [5.5, 2.7, 5.5], col, { round: 2.6, stripes: { axis: 'x', p: 2, w: 1, col: shade(col, 0.85) } }));
    Hd.push(C.vb(-6, 6, G.J1 - 3, G.J1 - 3, -7 + z, 7 + z, col, { sub: 1 }));
    Hd.push(C.vb(-6, 6, G.J1 - 2, G.J1 - 1, -6 + z, 6 + z, shade(col, 0.8), { paint: 1 }));
    Hd.push(C.sph([0, G.J1 + 3.2, z - 0.5], 1.2, '#f4f1ea'));
  }
  if (C.hat === 'bandana') {
    const col = (a.bandana || {}).color || '#d6334a';
    Hd.push(C.box([0, G.J1 - 0.4, z - 0.4], [5.5, 2.4, 5.4], col, { round: 2.2, spots: { col: '#fbfbf6', d: 0.18, s: 0.8, seed: 7 } }));
    Hd.push(C.vb(-6, 6, G.J1 - 4, G.J1 - 3, -7 + z, 7 + z, col, { sub: 1 }));
    Hd.push(C.cap([0, G.c, z - 5.6], [0.8, G.c - 3, z - 6.4], 1.0, 0.4, col), C.cap([0, G.c, z - 5.6], [-1.2, G.c - 2.6, z - 6.2], 1.0, 0.4, col));
  }
  // ---------------------------------------------------------------- forehead / face
  if (a.headband) {
    const o = a.headband, hachi = o.style === 'hachimaki', col = o.color || (hachi ? '#fbfbf6' : '#fbfbf6'), col2 = o.color2 || '#e8434f';
    const y = G.hl + (hachi ? 0.5 : 0.2);
    Hd.push(C.box([0, y, z - 0.3], [5.5, 0.95, 5.35], col, { round: 0.8 }));
    if (!hachi) Hd.push(C.vb(-6, 6, Math.round(y), Math.round(y), -7 + z, 7 + z, col2, { paint: 1, front: col2, side: col2, back: col2, top: col, belly: col }));
    if (hachi) {
      C.decal('head', [0, y, G.fz + 1], [0, 0, 1], ['.rr.', 'rrrr', '.rr.'], { r: col2 }, 0.45, { lift: 0.3 });
      Hd.push(C.sph([0, y, z - 6.1], 0.9, col), C.cap([0, y, z - 6.2], [1.6, y - 2.4, z - 6.8], 0.8, 0.5, col), C.cap([0, y, z - 6.2], [-1.0, y - 2.8, z - 6.6], 0.8, 0.5, col));
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
    const rows = st === 'hoops' ? ['.yy.', 'y..y', 'y..y', '.yy.'] : st === 'lightning' ? ['.y', 'yy', 'y.', '.y'] : ['y'];
    const glow = st === 'lightning' ? 2 : st === 'studs' && o.gem ? 2 : 0;
    C.decal('head', [5.2, G.J0 + (st === 'studs' ? 2.1 : 1.0), z - 0.5], [1, 0, 0.15], rows, { y: glow ? { c: col, glow } : col }, st === 'studs' ? 0.55 : 0.42, { mirror: true, lift: 0.25 });
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
  const band = o.color || '#262a36', neon = o.glow || '#38f0ff';
  const st = o.stone || {}, sc = st.color || '#38f0ff', shape = STONE_ROWS[st.shape] ? st.shape : 'round';
  A.push(C.vb(i0 - 0, i1 + 1, wr, wr + 1, k0 - 1, k1 + 1, band));                 // chunky band
  A.push(C.vb(i0, i1 + 1, wr + 1, wr + 1, k0 - 1, k1 + 1, neon, { paint: 1, glow: 2, belly: band, top: band }));
  A.push(C.vb(i1 + 1, i1 + 1, wr, wr + 1, k1 + 1, k1 + 1, sc, { glow: 2 }));     // gem socket (front-outer corner)
  const gx = i1 + 1.5, gz = k1 + 1.5, gy = wr + 0.5;
  const cm = shape === 'skull' ? { w: { c: '#f2efe6', glow: 1 }, g: { c: sc, glow: 3 } } : { g: { c: sc, glow: 2 }, w: { c: lite(sc, 0.75), glow: 3 } };
  C.decal('armL', [gx, gy, gz], [0.7071, 0, 0.7071], STONE_ROWS[shape], cm, 0.36, { snap: false, lift: 0.08, depth: 1 });
  C.fx.push({ part: 'armL', at: C.P(gx + 0.3, gy, gz + 0.3), type: 'gem', rate: 0.35, scale: 0.5, color: sc });
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
  const headY = (D.J0 + D.J1) / 2 * u;
  return {
    id, vs: u, arch: 'biped', pal, anim,
    parts,
    eyes: C.eyes, mouth: C.mouth, decals: C.decals, fx: C.fx,
    // framing hint for dialogue portraits (PortraitView.show frame)
    portrait: { y: headY - 0.03, dist: 1.45 + (D.J1 - D.J0) * u * 0.6, yaw: 0.3 },
    look: L,
  };
}
