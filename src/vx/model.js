// Box models in the Cobblemon / Minecraft-mod style: a rig of bones, each holding
// boxes ("cubes") and flat cut-out planes, textured with pixel art painted in code.
//   · units: 16 units = 1 block; textures are painted at `ppu` texels per unit
//     (default 4 — four times Minecraft's density, for HD detail),
//   · every cube gets a Minecraft-style box-UV island; faces are painted one by one
//     by small painter functions (fills with baked top-light shading, fur/feather
//     strokes, eyes, markings…), planes get a single double-sided texture,
//   · `glow` cubes are unlit (fire, eyes that shine) so they bloom,
//   · bones keep a rest pose; animations add rotations/offsets every frame.
// Facing: the model looks toward +z (south, toward the default camera).
import * as THREE from '../../vendor/three.module.js';
import { Pen, shift, mix, newSurf } from '../px/paint.js';

export const U = 1 / 16;               // world size of one model unit
const D2R = Math.PI / 180;

// ---------------------------------------------------------------- face painters
// a painter gets (p: Pen on the face, w, h, face, cube) — face ∈ south north east west up down plane
export const PAINT = {
  // shaded fill: lit from above, darker toward the bottom, subtle two-tone grain
  fill(c, o = {}) {
    return (p, w, h, face) => {
      const top = face === 'up', bot = face === 'down';
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let k = top ? 0.18 : bot ? -0.55 : 0.22 - (y / Math.max(1, h - 1)) * (o.grad ?? 0.55);
        if (!top && !bot && (face === 'east' || face === 'west')) k -= 0.08;
        const n = (((x * 7 + y * 13) ^ (x * y)) % 11) / 11;
        if (n < (o.grain ?? 0.12)) k -= 0.12; else if (n > 1 - (o.grain ?? 0.12) * 0.6) k += 0.1;
        p.px(x, y, shift(c, k));
      }
      if (o.rim !== false && !top && !bot) { for (let x = 0; x < w; x++) p.px(x, h - 1, shift(c, -0.7 + (top ? 0.3 : 0))); }
    };
  },
  // feathers: rows of scalloped feather tips over a fill
  feathers(c, o = {}) {
    const base = PAINT.fill(c, o);
    return (p, w, h, face, cube) => {
      base(p, w, h, face, cube);
      if (face === 'down') return;
      const s = o.size || 4;
      for (let row = 0; row * s < h + s; row++) for (let k = -1; k * s < w + s; k++) {
        const x0 = k * s + (row % 2) * (s >> 1), y0 = row * s;
        for (let i = 0; i < s; i++) { const yy = y0 + s - 1 - Math.round(Math.sin((i / (s - 1)) * Math.PI) * (s * 0.45)); if (x0 + i >= 0 && x0 + i < w && yy < h) p.px(x0 + i, yy, shift(c, -0.42 - (yy / h) * 0.3)); }
        if (x0 + 1 < w && x0 + 1 >= 0 && y0 + 1 < h) p.px(x0 + 1, y0 + 1, shift(c, 0.45));
      }
    };
  },
  // fur / wool: short strokes and curls
  fur(c, o = {}) {
    const base = PAINT.fill(c, o);
    return (p, w, h, face, cube) => {
      base(p, w, h, face, cube);
      const n = Math.round(w * h * (o.dens || 0.06));
      for (let k = 0; k < n; k++) { const x = p.ri(0, w - 1), y = p.ri(0, h - 1), l = p.ri(2, 4); for (let j = 0; j < l; j++) p.px(x + (j > 1 ? 1 : 0), y + j, shift(c, j === 0 ? 0.5 : -0.35)); }
    };
  },
  // wool curls (tight round tufts)
  curls(c, o = {}) {
    return (p, w, h, face) => {
      PAINT.fill(shift(c, -0.2), { grad: 0.3 })(p, w, h, face);
      const s = o.size || 5;
      for (let y = -1; y < h + s; y += s - 1) for (let x = -1; x < w + s; x += s - 1) {
        const cx = x + ((y / (s - 1)) % 2 ? (s >> 1) : 0) + p.ri(-1, 1), cy = y + p.ri(-1, 1);
        for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) { const d = Math.hypot(i - s / 2 + 0.5, j - s / 2 + 0.5) / (s / 2); if (d > 1) continue; const l = -((i - s / 2) + (j - s / 2)) / s; const X = cx + i, Y = cy + j; if (X >= 0 && Y >= 0 && X < w && Y < h) p.px(X, Y, d > 0.8 ? shift(c, -0.7) : l > 0.25 ? shift(c, 0.6) : c); }
      }
    };
  },
  // horizontal bands (stripes) — e.g. a zebra lionfish
  bands(a, b, o = {}) {
    return (p, w, h, face) => {
      const per = o.period || 6, wid = o.width || 3, along = o.along || 'x';
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const t = along === 'x' ? x + Math.round(Math.sin(y * 0.6) * (o.wave ?? 1)) : y + Math.round(Math.sin(x * 0.6) * (o.wave ?? 1));
        const c = ((t % per) + per) % per < wid ? a : b, k = face === 'up' ? 0.12 : face === 'down' ? -0.45 : 0.15 - (y / Math.max(1, h - 1)) * 0.45;
        p.px(x, y, shift(c, k));
      }
    };
  },
  // layer extra painting on top of a base painter
  over(base, ...fns) { return (p, w, h, face, cube) => { base(p, w, h, face, cube); for (const f of fns) f(p, w, h, face, cube); }; },
  // only on one face
  on(faceName, fn) { return (p, w, h, face, cube) => { if (face === faceName) fn(p, w, h, face, cube); }; },
  // stamp a pixel grid (rows of chars, map char → colour) at x, y (negative = from right/bottom)
  stamp(rows, map, x, y) { return (p, w, h) => { const X = x < 0 ? w + x - rows[0].length + 1 : x, Y = y < 0 ? h + y - rows.length + 1 : y; rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = map[r[i]]; if (c) p.px(X + i, Y + j, c); } }); }; },
};

// ---------------------------------------------------------------- building
// def: { name, ppu, bones: [{ name, parent, pivot, rot, cubes: [{ o, s, inflate, tex, faces, plane, glow, rot, pivot, mirror, hide }] }] }
const cache = new Map();
export function compile(def) {
  if (cache.has(def)) return cache.get(def);
  const ppu = def.ppu || 4;
  // 1) box-UV islands for every cube, shelf-packed
  const items = [];
  for (const b of def.bones) for (const c of b.cubes || []) {
    const [w, h, d] = c.s.map((v) => Math.max(0, Math.round(v * ppu)));
    if (c.plane) { const [pw, ph] = c.plane === 'x' ? [d, h] : c.plane === 'y' ? [w, d] : [w, h]; items.push({ c, b, pw: pw * 2 + 1, ph, w, h, d }); }
    else items.push({ c, b, pw: 2 * (w + d), ph: d + h, w, h, d });
  }
  items.sort((a, b) => b.ph - a.ph);
  let W = 128; const area = items.reduce((s, it) => s + (it.pw + 2) * (it.ph + 2), 0); while (W * W < area * 1.25) W *= 2;
  let x = 0, y = 0, rowH = 0;
  for (const it of items) { if (x + it.pw + 2 > W) { x = 0; y += rowH + 2; rowH = 0; } it.u = x + 1; it.v = y + 1; x += it.pw + 2; rowH = Math.max(rowH, it.ph); }
  let H = 64; while (H < y + rowH + 2) H *= 2;
  const atlas = newSurf(W, H);
  // 2) paint every face into its island
  let seed = 7;
  for (const it of items) {
    const { c, w, h, d } = it, tex = c.tex;
    const faceRects = c.plane ? { plane: [it.u, it.v, (it.pw - 1) / 2, it.ph] } : {
      up: [it.u + d, it.v, w, d], down: [it.u + d + w, it.v, w, d],
      west: [it.u, it.v + d, d, h], south: [it.u + d, it.v + d, w, h], east: [it.u + d + w, it.v + d, d, h], north: [it.u + 2 * d + w, it.v + d, w, h],
    };
    it.rects = faceRects;
    for (const [face, r] of Object.entries(faceRects)) {
      if (r[2] <= 0 || r[3] <= 0) continue;
      const fn = (c.faces && (c.faces[face] || (face === 'plane' && c.faces.south))) || tex;
      const s = newSurf(r[2], r[3]), p = new Pen(s, seed++);
      if (typeof fn === 'function') fn(p, r[2], r[3], face, c);
      else if (typeof fn === 'string') PAINT.fill(fn)(p, r[2], r[3], face, c);
      for (let j = 0; j < r[3]; j++) for (let i = 0; i < r[2]; i++) atlas.data[(r[1] + j) * W + r[0] + i] = s.data[j * r[2] + i];
      if (face === 'plane') for (let j = 0; j < r[3]; j++) for (let i = 0; i < r[2]; i++) atlas.data[(r[1] + j) * W + r[0] + r[2] + 1 + i] = s.data[j * r[2] + (r[2] - 1 - i)];   // mirrored back side
    }
  }
  atlas.touch && atlas.touch();
  const tex = new THREE.CanvasTexture(atlas.canvas());
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestMipmapLinearFilter; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const out = { def, items, W, H, tex, atlas,
    mats: {
      solid: new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5 }),
      plane: new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide }),
      glow: new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false }),
    } };
  cache.set(def, out);
  return out;
}

// geometry for one cube (positions relative to its bone pivot, in world units)
function cubeGeometry(it, comp, pivot) {
  const { c } = it, inf = c.inflate || 0, W = comp.W, H = comp.H;
  const [ox, oy, oz] = c.o, [sx, sy, sz] = c.s;
  const x0 = (ox - inf - pivot[0]) * U, y0 = (oy - inf - pivot[1]) * U, z0 = (oz - inf - pivot[2]) * U;
  const x1 = (ox + sx + inf - pivot[0]) * U, y1 = (oy + sy + inf - pivot[1]) * U, z1 = (oz + sz + inf - pivot[2]) * U;
  const P = [], N = [], UV = [], I = [];
  const quad = (corners, n, r, flip = false) => {
    const base = P.length / 3;
    for (const q of corners) P.push(...q);
    for (let k = 0; k < 4; k++) N.push(...n);
    let [u, v, w, h] = r; let ua = u / W, ub = (u + w) / W; if (flip) [ua, ub] = [ub, ua];
    const va = 1 - (v + h) / H, vb = 1 - v / H;
    UV.push(ua, va, ub, va, ub, vb, ua, vb);
    I.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const R = it.rects, m = !!c.mirror;
  if (c.plane) {
    const r = R.plane;
    if (c.plane === 'z') { const z = (z0 + z1) / 2; quad([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], [0, 0, 1], r, m); quad([[x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z]], [0, 0, -1], [r[0] + r[2] + 1, r[1], r[2], r[3]], m); }
    else if (c.plane === 'x') { const x = (x0 + x1) / 2; quad([[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]], [-1, 0, 0], r, m); quad([[x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1]], [1, 0, 0], [r[0] + r[2] + 1, r[1], r[2], r[3]], m); }
    else { const y = (y0 + y1) / 2; quad([[x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0]], [0, 1, 0], r, m); quad([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], [0, -1, 0], [r[0] + r[2] + 1, r[1], r[2], r[3]], m); }
  } else {
    // mirror swaps the east/west islands (left/right limbs share a painting)
    const E = m ? R.west : R.east, Wt = m ? R.east : R.west;
    quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], R.south, m);
    quad([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], R.north, m);
    quad([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], E, m);
    quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], Wt, m);
    quad([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], R.up, m);
    quad([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], R.down, m);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setIndex(I);
  return g;
}

// an instance: THREE.Group with named bones; an Animator (anim.js) poses it.
// parts: id → [meshes] (expressions toggle them); outline: inverted-hull edges.
export class Model {
  constructor(def) {
    const comp = this.comp = compile(def);
    this.def = def; this.group = new THREE.Group(); this.bones = {}; this.rest = {}; this.parts = {}; this.order = []; this.pivots = {};
    const byName = {}, ol = def.outline ? Object.assign({ color: '#1c1218', px: 1.6 }, def.outline === true ? {} : def.outline) : null;
    const olMat = ol ? hullMaterial(ol.color, ol.px) : null;
    for (const b of def.bones) {
      const o = new THREE.Group(); o.name = b.name;
      const parent = b.parent ? byName[b.parent] : null, pp = parent ? parent.def.pivot : [0, 0, 0];
      o.position.set((b.pivot[0] - pp[0]) * U, (b.pivot[1] - pp[1]) * U, (b.pivot[2] - pp[2]) * U);
      if (b.rot) o.rotation.set(b.rot[0] * D2R, b.rot[1] * D2R, b.rot[2] * D2R);
      (parent ? parent.obj : this.group).add(o);
      byName[b.name] = { obj: o, def: b };
      this.bones[b.name] = o; this.order.push(b.name); this.pivots[b.name] = b.pivot;
      this.rest[b.name] = { p: o.position.clone(), r: o.rotation.clone(), s: o.scale.clone() };
    }
    for (const it of comp.items) {
      const b = byName[it.b.name], c = it.c;
      const cp = c.pivot || null;
      const g = cubeGeometry(it, comp, cp || it.b.pivot);
      const mesh = new THREE.Mesh(g, c.glow ? comp.mats.glow : c.plane ? comp.mats.plane : comp.mats.solid);
      mesh.castShadow = !c.glow && c.shadow !== false; mesh.receiveShadow = !c.glow;
      let host = b.obj;
      if (cp) {   // a cube with its own rotation about its own pivot
        const holder = new THREE.Group(); holder.position.set((cp[0] - it.b.pivot[0]) * U, (cp[1] - it.b.pivot[1]) * U, (cp[2] - it.b.pivot[2]) * U);
        if (c.rot) holder.rotation.set(c.rot[0] * D2R, c.rot[1] * D2R, c.rot[2] * D2R);
        b.obj.add(holder); host = holder;
      }
      host.add(mesh);
      if (olMat && !c.plane && !c.glow && c.outline !== false) {     // inverted hull: a slightly larger back-face box in the line colour
        const hull = new THREE.Mesh(hullGeometry(c, cp || it.b.pivot), olMat);
        hull.castShadow = false; hull.receiveShadow = false; host.add(hull); mesh.userData.hull = hull;
      }
      if (c.id) (this.parts[c.id] || (this.parts[c.id] = [])).push(mesh);
      if (c.hide) { mesh.visible = false; if (mesh.userData.hull) mesh.userData.hull.visible = false; }
    }
    this.scale = def.scale || 1;
    this.group.scale.setScalar(this.scale);
  }
  show(id, v = true) { for (const m of this.parts[id] || []) { m.visible = v; if (m.userData.hull) m.userData.hull.visible = v; } }
  // appearance tier: 1 normal (one accessory), 2 dripped (two), 3 ultra dripped (three).
  // Accessory cubes carry id 'drip2' / 'drip3' (and start hidden); 'drip1' is always worn.
  // def.drip may list options per tier: [[{ id, name }, …], [...], [...]]; pick chooses one per tier
  // (an array of indices, or a number seed), so two Tokonmon of a species can wear different gear.
  drip(level = 1, pick = 0) {
    const D = this.def.drip; this.dripLevel = level;
    if (Array.isArray(D) && Array.isArray(D[0])) {
      this.dripPick = D.map((opts, i) => (Array.isArray(pick) ? pick[i] || 0 : Math.floor(Math.abs(pick) / 7 ** i)) % opts.length);
      D.forEach((opts, i) => opts.forEach((o, j) => this.show(o.id, i < level && j === this.dripPick[i])));
      return this;
    }
    this.show('drip2', level >= 2); this.show('drip3', level >= 3); return this;
  }
}
// outline hull: the cube itself, pushed outward in the vertex shader by a constant
// number of screen pixels (so lines stay crisp at any distance), back faces only
function hullGeometry(c, pivot) {
  const inf = c.inflate || 0, [ox, oy, oz] = c.o, [sx, sy, sz] = c.s;
  const g = new THREE.BoxGeometry((sx + inf * 2) * U, (sy + inf * 2) * U, (sz + inf * 2) * U);
  const cx = (ox + sx / 2 - pivot[0]) * U, cy = (oy + sy / 2 - pivot[1]) * U, cz = (oz + sz / 2 - pivot[2]) * U;
  g.translate(cx, cy, cz);
  const n = g.attributes.position.count, bc = new Float32Array(n * 3); for (let i = 0; i < n; i++) bc.set([cx, cy, cz], i * 3);
  g.setAttribute('bc', new THREE.BufferAttribute(bc, 3));
  return g;
}
export const OUTLINE = { uK: { value: 0.001 } };     // world size of one pixel at depth 1 (set by the stage each frame)
const hullMats = new Map();
function hullMaterial(color, px) {
  const key = color + px; if (hullMats.has(key)) return hullMats.get(key);
  const m = new THREE.ShaderMaterial({
    uniforms: { uK: OUTLINE.uK, uPx: { value: px }, uCol: { value: new THREE.Color(color) } },
    side: THREE.BackSide,
    vertexShader: `attribute vec3 bc; uniform float uK; uniform float uPx;
      void main() {
        vec4 mv0 = modelViewMatrix * vec4(position, 1.0);
        float sc = length(vec3(modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2]));
        float e = uPx * uK * max(0.5, -mv0.z) / max(1e-4, sc);
        vec3 d = sign(position - bc);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position + d * e, 1.0);
      }`,
    fragmentShader: 'uniform vec3 uCol; void main() { gl_FragColor = vec4(uCol, 1.0); }',
  });
  hullMats.set(key, m); return m;
}
export const rad = (d) => d * D2R;

// ---------------------------------------------------------------- the ultra-drip form
// An ultra-dripped Tokonmon wears its luxury form: warm colours turn to black lacquer,
// yellows and creams to gold, fire burns blue (and its sauce is truffle). It is a
// derived def whose painters draw through a recolouring pen, so every species gets it
// for free; a species can tune it with def.dripForm = { map(hex, glow) → hex, fx: { kind: kind } }.
const _hsl = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16), r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360;
  return { h, s, l };
};
const _hex = (h, s, l) => {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(1, v + m)) * 255).toString(16).padStart(2, '0')).join('');
};
export function blackGold(c, glow) {
  if (typeof c !== 'string' || c[0] !== '#' || c.length < 7) return c;
  const { h, s, l } = _hsl(c);
  if (glow) return s > 0.2 && (h < 75 || h > 320) ? _hex(200 + (h < 75 ? h * 0.35 : 0), Math.min(1, s * 1.05), Math.min(0.97, l * 1.02)) : c;   // fire burns blue
  if (s < 0.14) return c;                                                   // whites, greys, blacks (eyes, outlines) stay
  if (h >= 318 && h < 356 && l > 0.62) return c;                            // pale pinks (tongues) stay
  if (h >= 315 || h < 36) return _hex(255, 0.14, 0.05 + l * 0.24);         // reds, oranges, browns → black lacquer
  if (h < 72) return _hex(44, 0.88, 0.22 + l * 0.58);                       // yellows, creams → gold
  return _hex(44, 0.62, 0.16 + l * 0.46);                                   // everything else → antique gold
}
const COLOR_ARG = { px: 2, rect: 4, hl: 3, vl: 3, line: 4, ell: 4, poly: 1, blend: 2, wash: 4, speckle: 4, blots: 4, drips: 4, frame: 4 };
function recolorPen(p, map) {
  const proxy = new Proxy(p, {
    get(t, k) {
      const v = t[k]; if (typeof v !== 'function') return v;
      return (...a) => {
        if (COLOR_ARG[k] !== undefined && typeof a[COLOR_ARG[k]] === 'string') a[COLOR_ARG[k]] = map(a[COLOR_ARG[k]]);
        if (k === 'ditherRow') { a[3] = map(a[3]); a[4] = map(a[4]); }
        if (k === 'vgrad' && Array.isArray(a[4])) a[4] = a[4].map(map);
        const r = v.apply(t, a); return r === t ? proxy : r;
      };
    },
  });
  return proxy;
}
const FORMS = new WeakMap();
export function dripForm(def) {
  if (FORMS.has(def)) return FORMS.get(def);
  const F = def.dripForm || {}, map = F.map || blackGold;
  const wrap = (fn, glow) => (typeof fn === 'string' ? map(fn, glow) : typeof fn === 'function' ? (p, w, h, face, cube) => fn(recolorPen(p, (c) => map(c, glow)), w, h, face, cube) : fn);
  const d = {
    ...def, name: def.name + '-drip', form: 'drip',
    bones: def.bones.map((b) => ({ ...b, cubes: (b.cubes || []).map((c) => ({ ...c, tex: wrap(c.tex, c.glow), ...(c.faces ? { faces: Object.fromEntries(Object.entries(c.faces).map(([k, f]) => [k, wrap(f, c.glow)])) } : {}) })) })),
    fxMap: { fire: 'bluefire', breath: 'bluebreath', ember: 'blueember', ...(F.fx || {}) }, recolor: (c) => map(c, false),
  };
  FORMS.set(def, d); return d;
}
