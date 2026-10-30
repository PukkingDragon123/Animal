// Anime heads in real 3D for the people (no painted 2D faces):
//  - a rounded anime head (big cranium, small pointed chin), smooth-shaded, cel-banded by the stage
//  - sculpted hair: a scalp shell plus tapered, ridged locks (bangs, side locks, back fan, spikes,
//    ponytail / twin-tail bundles on the spring bones), vertex-coloured with a shine band
//  - a face built from layered pieces projected onto the head's surface: eye whites, irises (dark
//    top, glowing bottom, pupil), two catchlights, a thick upper lash that flicks out, lower lash,
//    brows, a mouth rebuilt from the expression (closed curve / open with tongue), a tiny nose,
//    blush, 3D glasses and stickers
// Everything rides the head bone (tails on the tail bones), so animation, look-at and springs apply.
// update(E) drives blinks, glances and expressions from the Human's expression parameters.
import * as THREE from '../../../vendor/three.module.js';

const cl = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const c3 = (c) => (Array.isArray(c) ? c.map((v) => v / 255) : [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255]);
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const lin = (c) => c.map((v) => Math.pow(v, 2.2));
const INK = [0.09, 0.06, 0.08];

// head profile from chin (t 0) to crown (t 1): [t, rx (× hw), rz (× hd), centre z offset (× hd)]
const PROF = [[0, 0.06, 0.08, 0.66], [0.06, 0.32, 0.36, 0.5], [0.15, 0.6, 0.6, 0.3], [0.27, 0.82, 0.8, 0.14], [0.4, 0.95, 0.93, 0.05], [0.54, 1, 1, 0], [0.68, 1, 1.02, -0.02], [0.8, 0.94, 0.97, -0.04], [0.9, 0.78, 0.82, -0.05], [0.97, 0.48, 0.52, -0.05], [1, 0, 0, -0.05]];
function prof(t) { t = cl(t); for (let i = 1; i < PROF.length; i++) if (t <= PROF[i][0]) { const a = PROF[i - 1], b = PROF[i], k = sstep(0, 1, (t - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)]; } return [0, 0, -0.05]; }
const SE = 2.3;                     // superellipse exponent of the head's cross-section (a little boxy, anime)
const sp = (v) => Math.sign(v) * Math.pow(Math.abs(v), 2 / SE);

export class AnimeHead {
  constructor(h) {
    this.h = h; const P = h.P, J = h.J, spec = h.spec, F = spec.face || {}, hair = spec.hair || {};
    this.P = P; this.fem = P.f || P.kid; this.hu = P.hu; this.hw = P.hw * 1.04; this.hd = P.hd * 0.98; this.chin = P.chin; this.hcz = P.hcz;
    const root = this.root = new THREE.Group(); root.position.set(-J.head[0], -J.head[1], -J.head[2]); h.b.head.add(root);
    this.skin = lin(c3(spec.skin)); this.hairC = lin(c3(hair.col || [40, 30, 30])); this.hairHi = lin(c3(hair.hi || [200, 200, 220]));
    this.iris = lin(c3(F.iris || [80, 50, 40]));
    this.mats = {
      // a little self-light keeps anime skin and hair bright and soft under the cel bands
      skin: new THREE.MeshLambertMaterial({ color: new THREE.Color().setRGB(...this.skin), emissive: new THREE.Color().setRGB(...this.skin.map((v) => v * 0.32)) }),
      hair: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, emissive: new THREE.Color().setRGB(...this.hairC.map((v) => v * 0.25)) }),
      white: new THREE.MeshBasicMaterial({ color: 0xfaf7f2 }),
      vc: new THREE.MeshBasicMaterial({ vertexColors: true }),
      ink: new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...INK) }),
      brow: new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...mixc(this.hairC, INK, 0.45)) }),
      hi: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      blush: new THREE.MeshBasicMaterial({ color: 0xf07a8a, transparent: true, opacity: 0.32, depthWrite: false }),
      mouth: new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0.32, 0.05, 0.08) }),
      tongue: new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0.85, 0.32, 0.36) }),
      teeth: new THREE.MeshBasicMaterial({ color: 0xfcfaf6 }),
    };
    // feature layout (t above the chin)
    const big = this.fem ? 1 : 0;
    this.L = { eyeT: 0.4, eyeX: this.hw * 0.42, ew: this.hw * (0.25 + 0.03 * big), eh: this.hu * (0.13 + 0.06 * big), browT: 0.56, noseT: 0.27, mouthT: 0.155, mouthW: this.hw * (0.17 + 0.02 * (1 - big)) };
    this.buildHead();
    this.buildEyes(); this.buildBrows(); this.buildNose(); this.buildMouth(); this.buildCheeks();
    if (spec.glasses) this.buildGlasses(spec.glasses);
    for (const d of F.deco || []) this.buildDeco(d);
    if (F.mustache) this.buildMustache();
    this.buildHair();
    root.traverse((o) => { if (o.isMesh) { o.castShadow = o.material === this.mats.hair || o.material === this.mats.skin; o.receiveShadow = false; } });
    this.E = {}; this.mk = '';
  }
  // ---------------------------------------------------------------- geometry helpers
  /** the head surface: z of the front at (x, y) (absolute rest coordinates) */
  surfZ(x, y, grow = 1) {
    const t = (y - this.chin) / this.hu, [px, pz, pc] = prof(t), rx = px * this.hw * grow, rz = pz * this.hd * grow, cz = this.hcz + pc * this.hd;
    if (rx < 1e-4) return cz;
    const u = Math.min(1, Math.abs(x) / rx);
    return cz + rz * Math.pow(Math.max(0, 1 - Math.pow(u, SE)), 1 / SE);
  }
  yAt(t) { return this.chin + t * this.hu; }
  /** a flat 2D shape (array of [x, y] absolute) projected onto the face, lifted by off metres */
  shapeOn(pts, off, mat, o = {}) {
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ShapeGeometry(shape, 2), p = g.attributes.position;
    const pv = o.pivot || [0, 0, 0];
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setXYZ(i, x - pv[0], y - pv[1], this.surfZ(x, y) + off - pv[2]); }
    if (o.colors) { const C = []; for (let i = 0; i < p.count; i++) C.push(...o.colors(p.getX(i) + pv[0], p.getY(i) + pv[1])); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.renderOrder = o.order || 1; return m;
  }
  // ---------------------------------------------------------------- the head
  buildHead() {
    const R = 26, N = 24, pos = [], idx = [];
    for (let j = 0; j <= R; j++) {
      const t = j / R, y = this.yAt(t), [px, pz, pc] = prof(t), rx = px * this.hw, rz = pz * this.hd, cz = this.hcz + pc * this.hd;
      for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; pos.push(rx * sp(Math.sin(a)), y, cz + rz * sp(Math.cos(a))); }
    }
    for (let j = 0; j < R; j++) for (let i = 0; i < N; i++) { const a = j * N + i, b = j * N + ((i + 1) % N), c = a + N, d = b + N; idx.push(a, b, d, a, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    this.root.add(new THREE.Mesh(g, this.mats.skin));
    // ears (mostly under the hair)
    for (const s of [1, -1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), this.mats.skin); e.scale.set(this.hu * 0.04, this.hu * 0.1, this.hu * 0.06); e.position.set(s * this.hw * 0.99, this.yAt(0.38), this.hcz - this.hd * 0.05); this.root.add(e); }
  }
  // ---------------------------------------------------------------- eyes
  buildEyes() {
    const L = this.L; this.eyes = [];
    for (const s of [1, -1]) {
      const cx = s * L.eyeX, cy = this.yAt(L.eyeT), ew = L.ew, eh = L.eh, fem = this.fem;
      const top = (u) => cy + eh * (0.5 * Math.pow(Math.max(0, 1 - u * u), 0.42) + 0.1 * u), bot = (u) => cy - eh * (0.46 * Math.pow(Math.max(0, 1 - u * u), 0.7) - 0.05 * u);
      const X = (u) => cx + s * u * ew;
      const outline = []; for (let i = 0; i <= 14; i++) { const u = -1 + (2 * i) / 14; outline.push([X(u), top(u)]); } for (let i = 14; i >= 0; i--) { const u = -1 + (2 * i) / 14; outline.push([X(u), bot(u)]); }
      const pivot = [cx, cy - eh * 0.12, this.surfZ(cx, cy)];
      const eye = new THREE.Group(); eye.position.set(...pivot); this.root.add(eye);
      const open = new THREE.Group(); eye.add(open);
      open.add(this.shapeOn(s > 0 ? outline : outline.slice().reverse(), 0.0015, this.mats.white, { pivot }));
      // iris: dark under the lid, glowing toward the bottom, dark rim, pupil — one fan mesh with vertex colours
      const irisG = new THREE.Group(); open.add(irisG); const ir = ew * 0.56, irh = eh * 0.52;
      const ic = this.iris, ring = [[0, 0.32, mixc(ic, [0, 0, 0], 0.88)], [0.32, 0.4, mixc(ic, [0, 0, 0], 0.55)], [0.4, 0.8, ic], [0.8, 0.9, mixc(ic, [0, 0, 0], 0.5)], [0.9, 1, mixc(ic, [0, 0, 0], 0.75)]];
      for (const [r0, r1, col] of ring) {
        const pts = []; const n = 28;
        for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; pts.push([cx + Math.cos(a) * ir * r1, cy + Math.sin(a) * irh * r1]); }
        if (r0 > 0) for (let i = n; i >= 0; i--) { const a = (i / n) * Math.PI * 2; pts.push([cx + Math.cos(a) * ir * r0, cy + Math.sin(a) * irh * r0]); }
        const m = this.shapeOn(pts, 0.0025 + r1 * 0.0002, this.mats.vc, { pivot, colors: (x, y) => { const v = cl((y - (cy - irh)) / (2 * irh)); return mixc(col, mixc(col, [1, 0.95, 0.8], 0.45), r0 >= 0.4 && r1 <= 0.8 ? Math.pow(1 - v, 2) * 0.9 : 0).map((c, k) => c * (0.45 + 0.75 * (1 - v)) + (k === 2 ? 0 : 0)); }, order: 2 });
        irisG.add(m);
      }
      // catchlights
      const hl = (x, y, rx, ry, o) => { const pts = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; pts.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]); } return this.shapeOn(pts, o, this.mats.hi, { pivot, order: 3 }); };
      irisG.add(hl(cx + s * ir * -0.3, cy + irh * 0.38, ir * 0.3, irh * 0.26, 0.0034)); irisG.add(hl(cx + s * ir * 0.34, cy - irh * 0.42, ir * 0.13, irh * 0.1, 0.0034));
      // lower lash: a short tapering stroke on the outer half
      const lo = []; for (let i = 0; i <= 8; i++) { const u = 0.05 + (0.95 * i) / 8; lo.push([X(u), bot(u) - 0.0006]); } for (let i = 8; i >= 0; i--) { const u = 0.05 + (0.95 * i) / 8; lo.push([X(u), bot(u) - eh * (0.03 + 0.05 * u)]); }
      open.add(this.shapeOn(s > 0 ? lo : lo.slice().reverse(), 0.0036, this.mats.ink, { pivot, order: 4 }));
      // upper lash: thick, heavier at the outer end, flicking out past the corner (+ spikes for the girls)
      const lashG = new THREE.Group(); eye.add(lashG);
      const ut = (u) => eh * (0.07 + 0.12 * sstep(-0.6, 1, u) * (fem ? 1.25 : 0.85));
      const up = []; for (let i = 0; i <= 16; i++) { const u = -1.02 + (2.04 * i) / 16; up.push([X(u), top(u) + ut(u)]); }
      const flick = fem ? 0.32 : 0.18; up.push([X(1.02 + flick), top(1) + eh * (fem ? 0.0 : -0.05)]);
      for (let i = 16; i >= 0; i--) { const u = -1.02 + (2.04 * i) / 16; up.push([X(u), top(u) - eh * 0.03]); }
      lashG.add(this.shapeOn(s > 0 ? up : up.slice().reverse(), 0.004, this.mats.ink, { pivot, order: 5 }));
      if (fem) for (const u of [0.45, 0.72, 0.95]) { const bx = X(u), by = top(u) + ut(u) * 0.8, tx = X(u + 0.22), ty = by + eh * 0.24; const tri = s > 0 ? [[bx - s * ew * 0.06, by], [bx + s * ew * 0.08, by], [tx, ty]] : [[bx + s * ew * 0.08, by], [bx - s * ew * 0.06, by], [tx, ty]]; lashG.add(this.shapeOn(tri, 0.0041, this.mats.ink, { pivot, order: 5 })); }
      // closed lids: a soft ∪ (blink / sleepy) and a beaming ∩ (happy)
      const arc = (dir) => { const a = []; for (let i = 0; i <= 12; i++) { const u = -1 + (2 * i) / 12; a.push([X(u), cy - eh * 0.05 + dir * eh * 0.32 * (1 - u * u)]); } for (let i = 12; i >= 0; i--) { const u = -1 + (2 * i) / 12; a.push([X(u), cy - eh * 0.05 + dir * eh * 0.32 * (1 - u * u) - eh * (0.09 + 0.05 * (1 - u * u))]); } return this.shapeOn(s > 0 ? a : a.slice().reverse(), 0.004, this.mats.ink, { pivot, order: 5 }); };
      const shut = arc(-0.5), beam = arc(1); shut.visible = beam.visible = false; eye.add(shut, beam);
      this.eyes.push({ s, eye, open, irisG, lashG, shut, beam, eh, ew, ir, irh });
    }
  }
  buildBrows() {
    this.brows = [];
    for (const s of [1, -1]) {
      const L = this.L, cx = s * L.eyeX, cy = this.yAt(L.browT), w = L.ew * 1.0, th = this.hu * (this.fem ? 0.012 : 0.02);
      const pts = []; for (let i = 0; i <= 10; i++) { const u = -1 + (2 * i) / 10; pts.push([cx + s * u * w, cy + Math.sin((u + 1) * 1.4) * th * 0.9]); } for (let i = 10; i >= 0; i--) { const u = -1 + (2 * i) / 10; pts.push([cx + s * u * w, cy + Math.sin((u + 1) * 1.4) * th * 0.9 - th * (0.6 + 0.6 * (1 - Math.abs(u + 0.3)))]); }
      const pivot = [cx, cy, this.surfZ(cx, cy)], g = new THREE.Group(); g.position.set(...pivot); this.root.add(g);
      g.add(this.shapeOn(s > 0 ? pts : pts.slice().reverse(), 0.003, this.mats.brow, { pivot, order: 4 }));
      this.brows.push({ s, g, y0: pivot[1] });
    }
  }
  buildNose() {
    const y = this.yAt(this.L.noseT), z = this.surfZ(0, y), s = this.hu * 0.022;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, y + s * 1.6, z, -s * 0.7, y - s * 0.2, z + 0.002, s * 0.7, y - s * 0.2, z + 0.002, 0, y - s * 0.1, z + s * 0.7], 3));
    g.setIndex([0, 1, 3, 0, 3, 2, 1, 2, 3]); g.computeVertexNormals();
    this.root.add(new THREE.Mesh(g, this.mats.skin));
  }
  buildCheeks() {
    this.cheeks = [];
    for (const s of [1, -1]) { const cx = s * this.hw * 0.55, cy = this.yAt(0.29), pts = []; for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; pts.push([cx + Math.cos(a) * this.hw * 0.17, cy + Math.sin(a) * this.hu * 0.04]); } const m = this.shapeOn(pts, 0.0012, this.mats.blush, { order: 1 }); this.root.add(m); this.cheeks.push(m); }
    const b = (this.h.spec.face || {}).blush ?? 0.25; this.blush0 = this.fem ? Math.max(0.2, b) : b * 0.5;
  }
  // the mouth is rebuilt when the expression changes (a few dozen vertices)
  buildMouth() { this.mouthG = new THREE.Group(); this.root.add(this.mouthG); this.setMouth({ open: 0, corner: 0, round: 0, mouthW: 1, teeth: 0 }); }
  setMouth(E) {
    const key = [E.open, E.corner, E.round, E.mouthW, E.teeth].map((v) => Math.round((v || 0) * 10)).join(',');
    if (key === this.mk) return; this.mk = key;
    for (const c of this.mouthG.children.slice()) { c.geometry.dispose(); this.mouthG.remove(c); }
    const cy = this.yAt(this.L.mouthT), w = this.L.mouthW * (E.mouthW || 1) * (1 - (E.round || 0) * 0.45), cr = (E.corner || 0) * this.hu * 0.012, open = (E.open || 0) * this.hu * 0.018;
    if (open > this.hu * 0.012) {
      const pts = []; for (let i = 0; i <= 18; i++) { const a = Math.PI + (i / 18) * Math.PI; pts.push([Math.cos(a) * w, cy + Math.sin(a) * open + (1 - Math.abs(Math.cos(a))) * 0]); }
      for (let i = 0; i <= 8; i++) { const u = 1 - (2 * i) / 8; pts.push([u * w, cy + cr * (u * u) * 0.6 + open * 0.15]); }
      this.mouthG.add(this.shapeOn(pts, 0.0026, this.mats.mouth, { order: 4 }));
      const tg = []; for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; tg.push([Math.cos(a) * w * 0.6, cy - open * 0.55 + Math.sin(a) * open * 0.4]); } this.mouthG.add(this.shapeOn(tg, 0.0032, this.mats.tongue, { order: 5 }));
      if (E.teeth) this.mouthG.add(this.shapeOn([[-w * 0.8, cy + open * 0.12], [w * 0.8, cy + open * 0.12], [w * 0.7, cy - open * 0.2], [-w * 0.7, cy - open * 0.2]], 0.0033, this.mats.teeth, { order: 5 }));
    } else {
      // closed: a soft curve; smiling turns it into a little cat-mouth 'w'
      const pts = [], th = this.hu * 0.009, n = 14, cat = (E.corner || 0) > 1.2;
      const f = (u) => (cat ? cy + Math.abs(Math.sin(u * Math.PI)) * cr * 0.9 - cr * 0.3 : cy + cr * u * u - cr * 0.3);
      for (let i = 0; i <= n; i++) { const u = -1 + (2 * i) / n; pts.push([u * w, f(u) + th * 0.5 * (1 - u * u * 0.6)]); }
      for (let i = n; i >= 0; i--) { const u = -1 + (2 * i) / n; pts.push([u * w, f(u) - th * 0.5 * (1 - u * u * 0.6)]); }
      this.mouthG.add(this.shapeOn(pts, 0.0026, this.mats.mouth, { order: 4 }));
    }
  }
  buildGlasses(G) {
    const col = lin(c3(G.col || [40, 34, 40])), mat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...col) }), L = this.L, cy = this.yAt(L.eyeT) + L.eh * 0.05, round = G.kind === 'round';
    for (const s of [1, -1]) {
      const cx = s * L.eyeX, rx = L.ew * 1.25, ry = L.eh * (round ? 1.15 : 0.95), th = this.hu * 0.009, pts = [], n = 24;
      const P = (a, r) => (round ? [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r] : [cx + Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.3) * rx * r, cy + Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.3) * ry * r]);
      for (let i = 0; i <= n; i++) pts.push(P((i / n) * Math.PI * 2, 1)); for (let i = n; i >= 0; i--) pts.push(P((i / n) * Math.PI * 2, 1 - th / Math.min(rx, ry)));
      const m = this.shapeOn(pts, 0.012, mat, { order: 6 }); this.root.add(m);
      if (G.kind === 'sun') { const lens = []; for (let i = 0; i < n; i++) lens.push(P((i / n) * Math.PI * 2, 0.98)); this.root.add(this.shapeOn(lens, 0.011, new THREE.MeshBasicMaterial({ color: 0x1a1820 }), { order: 6 })); }
    }
    this.root.add(this.shapeOn([[-L.eyeX + L.ew * 1.2, cy + L.eh * 0.15], [L.eyeX - L.ew * 1.2, cy + L.eh * 0.15], [L.eyeX - L.ew * 1.2, cy + L.eh * 0.05], [-L.eyeX + L.ew * 1.2, cy + L.eh * 0.05]], 0.013, mat, { order: 6 }));
  }
  buildMustache() {
    const cy = this.yAt(this.L.mouthT + 0.06), w = this.L.mouthW * 1.4, pts = []; for (let i = 0; i <= 10; i++) { const u = -1 + (2 * i) / 10; pts.push([u * w, cy + this.hu * 0.02 * (1 - u * u)]); } for (let i = 10; i >= 0; i--) { const u = -1 + (2 * i) / 10; pts.push([u * w, cy - this.hu * 0.025 * (1 - Math.abs(u)) - this.hu * 0.012 * Math.abs(u)]); }
    this.root.add(this.shapeOn(pts, 0.006, new THREE.MeshLambertMaterial({ color: new THREE.Color().setRGB(...this.hairC) }), { order: 4 }));
  }
  /** little 3D stickers on the face: star, heart, plaster, gems, mole, blush hatching, face paint, scar */
  buildDeco(d) {
    const at = d.at || 'cheekL', s = /L$/.test(at) ? 1 : /R$/.test(at) ? -1 : 0, base = at.replace(/[LR]$/, ''), L = this.L;
    const A = { cheek: [s * this.hw * 0.58, this.yAt(0.27)], eye: [s * (L.eyeX + L.ew * 0.95), this.yAt(L.eyeT) - L.eh * 0.85], brow: [s * L.eyeX, this.yAt(L.browT)], nose: [0, this.yAt(0.33)], mouth: [s * L.mouthW * 1.6, this.yAt(L.mouthT)], forehead: [s * this.hw * 0.3, this.yAt(0.68)] }[base] || [0, this.yAt(0.3)];
    const [ax, ay] = A, r = this.hu * 0.045 * (d.size || 1), col = d.col !== undefined ? lin(c3(d.col)) : null;
    const mat = (c) => new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...c) });
    const poly = (pts, c, off = 0.005) => this.root.add(this.shapeOn(pts, off, mat(c), { order: 6 }));
    const circ = (x, y, rx, ry, n = 14) => { const p = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; p.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]); } return p; };
    switch (d.kind) {
      case 'star': { const p = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; p.push([ax + Math.cos(a) * rr, ay + Math.sin(a) * rr]); } poly(p, col || lin([1, 0.84, 0.29])); break; }
      case 'heart': { const p = []; for (let i = 0; i < 24; i++) { const t = (i / 24) * Math.PI * 2; p.push([ax + r * 0.06 * 16 * Math.pow(Math.sin(t), 3), ay + r * 0.06 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); } poly(p, col || lin([0.96, 0.36, 0.54])); break; }
      case 'bandaid': { const w = r * 1.5, hh = r * 0.42, a = s ? -s * 0.4 : 0.1, c = Math.cos(a), sn = Math.sin(a), R2 = (x, y) => [ax + x * c - y * sn, ay + x * sn + y * c]; poly([R2(-w, -hh), R2(w, -hh), R2(w, hh), R2(-w, hh)], lin([0.93, 0.78, 0.66])); poly([R2(-w * 0.32, -hh * 0.8), R2(w * 0.32, -hh * 0.8), R2(w * 0.32, hh * 0.8), R2(-w * 0.32, hh * 0.8)], lin([0.86, 0.66, 0.55]), 0.0055); break; }
      case 'gems': for (const [dx, dy, k] of [[0, 0, 1], [s * 0.9, 0.9, 0.75], [s * 1.6, 1.9, 0.55]]) { const x = ax + dx * r * 0.6, y = ay + dy * r * 0.6, g = r * 0.32 * k; poly([[x, y + g], [x + g, y], [x, y - g], [x - g, y]], col || lin([0.6, 0.86, 1])); poly(circ(x - g * 0.25, y + g * 0.25, g * 0.2, g * 0.2, 8), [1, 1, 1], 0.0058); } break;
      case 'mole': poly(circ(ax, ay, this.hu * 0.008, this.hu * 0.008), lin([0.28, 0.16, 0.15])); break;
      case 'hatch': for (const sd of [1, -1]) for (const o of [-1, 0, 1]) { const x = sd * this.hw * 0.58 + o * this.hw * 0.08, y = this.yAt(0.29); poly([[x - this.hw * 0.03, y - this.hu * 0.025], [x - this.hw * 0.005, y - this.hu * 0.025], [x + this.hw * 0.03, y + this.hu * 0.025], [x + this.hw * 0.005, y + this.hu * 0.025]], lin([0.9, 0.4, 0.46])); } break;
      case 'paint': for (const o of [0, 1]) { const y = ay - o * r * 0.7; poly([[ax - s * r * 1.1, y], [ax + s * r * 1.1, y + r * 0.15 * s], [ax + s * r * 1.1, y + r * 0.15 * s - r * 0.25], [ax - s * r * 1.1, y - r * 0.25]].map((p) => p), col || [0.1, 0.08, 0.1]); } break;
      case 'scar': poly([[ax - r * 0.6, ay + r], [ax - r * 0.45, ay + r], [ax + r * 0.6, ay - r], [ax + r * 0.45, ay - r]], lin([0.93, 0.75, 0.68])); break;
      case 'tear': poly(circ(ax, ay, r * 0.35, r * 0.55), col || lin([0.5, 0.78, 0.97])); break;
      default: break;
    }
  }
  // ---------------------------------------------------------------- hair
  buildHair() {
    const H = this.h.spec.hair || {}, st = H.style || 'short', P = this.P, hu = this.hu, J = this.h.J;
    if (st === 'none' || st === 'bald') return;
    const vol = H.volume || 1, fem = this.fem;
    this.hairParts = new Map();
    const part = (name, bone) => { if (!this.hairParts.has(name)) { const grp = new THREE.Group(); const B = bone ? this.h.b[bone] : null; if (B) { grp.position.set(-J[bone][0], -J[bone][1], -J[bone][2]); B.add(grp); } else this.root.add(grp); this.hairParts.set(name, { grp, P: [], C: [], I: [], bone }); } return this.hairParts.get(name); };
    const C0 = [0, this.yAt(0.55), this.hcz];   // the head's centre (locks fan out from it)
    // the scalp shell: covers the cranium down to a hairline (lower at the back and the temples)
    const cap = part('cap'), thin = st === 'buzz' || st === 'mohawk', grow = thin ? 1.03 : 1.075 + 0.02 * (vol - 1);
    const hl = (a) => { const f = Math.cos(a); return f > 0 ? lerp(0.6, 0.8, Math.pow(f, 2)) - (st === 'mohawk' || st === 'buzz' ? 0 : 0.0) : lerp(0.6, 0.36, -f); };
    { const R = 16, N = 28, base = cap.P.length / 3;
      for (let j = 0; j <= R; j++) for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2, t0 = hl(a), t = lerp(t0, 1, j / R), [px, pz, pc] = prof(t), y = this.yAt(t), rx = px * this.hw * grow, rz = pz * this.hd * grow, cz = this.hcz + pc * this.hd;
        cap.P.push(rx * sp(Math.sin(a)), y + (j === R ? 0 : 0) + (1 - j / R) * 0, cz + rz * sp(Math.cos(a)));
        cap.C.push(...this.hairCol(y, j / R));
      }
      for (let j = 0; j < R; j++) for (let i = 0; i < N; i++) { const a = base + j * N + i, b = base + j * N + ((i + 1) % N), c = a + N, d = b + N; cap.I.push(a, d, b, a, c, d); }
    }
    // a lock: root on the scalp at angle a (0 = front) and height t, flowing to a tip offset (dx, dy, dz) with a sideways sweep
    const scalp = (a, t, g = grow) => { const [px, pz, pc] = prof(t), rx = px * this.hw * g, rz = pz * this.hd * g, cz = this.hcz + pc * this.hd; return [rx * sp(Math.sin(a)), this.yAt(t), cz + rz * sp(Math.cos(a))]; };
    const lock = (name, root, tip, w, o = {}) => this.lock(part(name, o.bone), root, tip, w, { C0, th: o.th ?? w * 0.35, bend: o.bend ?? 0.3, out: o.out ?? 0.25, n: o.n || 7 });
    const front = (k, n, spread) => (k / (n - 1) - 0.5) * spread;     // angle across the front
    // bangs
    const bangs = (n, tipT, spread = 1.7, len = 1, sweep = 0) => { for (let k = 0; k < n; k++) { const a = front(k, n, spread), r = scalp(a, 0.82, grow), s = Math.sin(a); lock('cap', r, [r[0] + s * hu * 0.05 + sweep * hu * 0.12, this.yAt(tipT) - (k % 2) * hu * 0.03 * len, this.surfZ(r[0] * 0.9, this.yAt(tipT)) + hu * 0.03], hu * (0.16 + 0.03 * vol) * (1 - Math.abs(s) * 0.3), { th: hu * 0.04, out: 0.12, bend: 0.25 }); } };
    // side locks framing the face
    const sides = (tipT, w = 0.14, n = 2) => { for (const s of [1, -1]) for (let k = 0; k < n; k++) { const a = s * (1.2 + k * 0.35), r = scalp(a, 0.66, grow); lock('cap', r, [s * this.hw * (1.02 + k * 0.08), this.yAt(tipT - k * 0.05), r[2] - hu * 0.02 * k], hu * w, { th: hu * 0.05, out: 0.35 }); } };
    // the back fan
    const back = (tipY, n = 7, w = 0.2, name = 'cap', bone) => { for (let k = 0; k < n; k++) { const a = Math.PI + (k / (n - 1) - 0.5) * 2.4, r = scalp(a, 0.72, grow); lock(name, r, [r[0] * 1.15, tipY - (k % 2) * hu * 0.06, r[2] - hu * 0.06], hu * w * vol, { th: hu * 0.06, out: 0.3, bone }); } };
    // spikes all around (shonen hair)
    const spikes = (n, len) => { for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + 0.2, t = k % 2 ? 0.86 : 0.78, r = scalp(a, t, grow), d = [r[0] - C0[0], r[1] - C0[1], r[2] - C0[2]], l = Math.hypot(...d); const up = Math.cos(a) > 0.3 ? -0.3 : 0.35; lock('cap', r, [r[0] + (d[0] / l) * hu * len, r[1] + hu * len * up, r[2] + (d[2] / l) * hu * len * 0.8], hu * 0.2, { th: hu * 0.07, out: 0.2 }); } };
    if (st === 'messy' || st === 'short' || st === 'sidepart' || st === 'bowl' || st === 'mushroom') {
      bangs(st === 'bowl' || st === 'mushroom' ? 7 : 5, st === 'bowl' || st === 'mushroom' ? 0.56 : 0.6, 1.8, 1, st === 'sidepart' ? (H.part || 1) * 0.6 : 0);
      sides(0.34, 0.12, 1); back(this.yAt(0.12), 7, 0.18);
      if (st === 'messy') spikes(9, 0.18);
    } else if (st === 'long' || st === 'bob' || st === 'ponytail' || st === 'twintails' || st === 'pigtails' || st === 'bun') {
      bangs(fem ? 7 : 5, fem ? 0.52 : 0.58, 1.9);
      if (st === 'long') { sides(-0.45, 0.16, 2); back(this.yAt(-1.25) , 9, 0.24, 'long'); }
      else if (st === 'bob') { sides(0.08, 0.17, 2); back(this.yAt(0.02), 9, 0.22); }
      else { sides(st === 'bun' ? 0.3 : 0.05, 0.13, 1); back(this.yAt(0.15), 7, 0.18); }
      // tails on the spring bones
      const bundle = (bone, len, w) => { const j = J[bone]; for (let k = 0; k < 4; k++) { const a = k * 1.57; this.lock(part('tail_' + bone, bone), [j[0] + Math.cos(a) * hu * 0.03, j[1], j[2] + Math.sin(a) * hu * 0.03], [j[0] + Math.cos(a) * hu * 0.06 + (j[0] ? Math.sign(j[0]) * hu * 0.08 : 0), j[1] - len * (0.9 + 0.1 * (k % 2)), j[2] - hu * 0.12 + Math.sin(a) * hu * 0.05], w, { C0: [j[0], j[1] + hu * 0.2, j[2] + hu * 0.1], th: w * 0.6, bend: 0.4, out: 0.3, n: 8 }); } };
      if (st === 'ponytail') bundle('tailL', P.H * 0.16 * vol, hu * 0.16);
      if (st === 'twintails' || st === 'pigtails') { const len = P.H * (st === 'pigtails' ? 0.08 : 0.17) * vol; bundle('tailL', len, hu * 0.14); bundle('tailR', len, hu * 0.14); }
      if (st === 'bun') { const b = new THREE.Mesh(new THREE.SphereGeometry(hu * 0.17, 10, 8), this.mats.hair); const g = b.geometry, cs = []; for (let i = 0; i < g.attributes.position.count; i++) cs.push(...this.hairCol(this.yAt(0.9), 0.7)); g.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3)); b.position.set(0, this.yAt(0.92), this.hcz - this.hd * 1.05); this.root.add(b); }
    } else if (st === 'perm') {
      for (let k = 0; k < 26; k++) { const a = (k / 26) * Math.PI * 2 * 2.3, t = 0.55 + (k / 26) * 0.42, r = scalp(a, t, grow * 1.06); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(hu * 0.1 * vol, 0), this.mats.hair); const g = b.geometry, cs = []; for (let i = 0; i < g.attributes.position.count; i++) cs.push(...this.hairCol(r[1], 0.6)); g.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3)); b.position.set(...r); this.root.add(b); }
    } else if (st === 'mohawk') {
      for (let k = 0; k < 7; k++) { const t = 0.62 + k * 0.06, a = Math.PI * (k / 6) * 1.0 - 0.2, r = scalp(a > Math.PI ? Math.PI : a, Math.min(1, t)); lock('cap', [0, r[1], r[2]], [0, r[1] + hu * 0.32 * vol, r[2] - hu * 0.12], hu * 0.18, { th: hu * 0.05, out: 0.1 }); }
    } else if (st === 'buzz') { /* the shell alone */ }
    if (H.ahoge) { const r = scalp(0.2, 0.98); this.lock(part('ahoge', 'ahoge'), r, [r[0] + hu * 0.06, r[1] + hu * 0.22, r[2] + hu * 0.12], hu * 0.07, { C0: [0, r[1] - hu * 0.2, r[2] - hu * 0.2], th: hu * 0.03, bend: 0.8, out: 0.2, n: 8 }); }
    if (H.ears) for (const s of [1, -1]) { const r = scalp(s * 0.7, 0.92), e = new THREE.Mesh(new THREE.ConeGeometry(hu * 0.11, hu * (H.ears === 'fox' ? 0.34 : 0.26), 4), this.mats.hair); const g = e.geometry, cs = []; for (let i = 0; i < g.attributes.position.count; i++) cs.push(...this.hairCol(this.yAt(1), 0.8)); g.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3)); e.position.set(r[0] * 1.05, r[1] + hu * 0.1, r[2]); e.rotation.z = -s * 0.35; e.rotation.y = Math.PI / 4; this.root.add(e); }
    for (const [name, Pt] of this.hairParts) {
      if (!Pt.P.length) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(Pt.P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Pt.C, 3)); g.setIndex(Pt.I); g.computeVertexNormals();
      const m = new THREE.Mesh(g, this.mats.hair); m.castShadow = true; Pt.grp.add(m);
      if (name === 'long') { this.longHair = Pt.grp; const piv = new THREE.Group(), y0 = this.yAt(0.5), z0 = this.hcz - this.hd * 0.6; piv.position.set(0, y0, z0); Pt.grp.position.set(0, -y0, -z0); this.root.remove(Pt.grp); piv.add(Pt.grp); this.root.add(piv); this.longPivot = piv; }
    }
  }
  hairCol(y, k) {
    // darker at the roots and underside, a shine ring around the crown
    const t = (y - this.chin) / this.hu, shine = Math.exp(-Math.pow((t - 0.86) / 0.05, 2)) * 0.55;
    const c = mixc(mixc(this.hairC, [0, 0, 0], 0.18 * (1 - k)), this.hairHi, shine);
    return c;
  }
  /** a tapered, ridged lock from root to tip, bowing outward from C0 */
  lock(Pt, root, tip, w, o) {
    const n = o.n || 7, base = Pt.P.length / 3, C0 = o.C0;
    const mid = [(root[0] + tip[0]) / 2, (root[1] + tip[1]) / 2, (root[2] + tip[2]) / 2];
    const md = [mid[0] - C0[0], mid[1] - C0[1], mid[2] - C0[2]], ml = Math.hypot(...md) || 1, L = Math.hypot(tip[0] - root[0], tip[1] - root[1], tip[2] - root[2]);
    const ctrl = [mid[0] + (md[0] / ml) * L * o.out, mid[1] + (md[1] / ml) * L * o.out * 0.5 + L * o.bend * 0.15, mid[2] + (md[2] / ml) * L * o.out];
    const at = (s) => { const a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s; return [a * root[0] + b * ctrl[0] + c * tip[0], a * root[1] + b * ctrl[1] + c * tip[1], a * root[2] + b * ctrl[2] + c * tip[2]]; };
    for (let i = 0; i <= n; i++) {
      const s = i / n, p = at(s), q = at(Math.min(1, s + 0.02)), r0 = at(Math.max(0, s - 0.02)), T = [q[0] - r0[0], q[1] - r0[1], q[2] - r0[2]], tl = Math.hypot(...T) || 1;
      let N = [p[0] - C0[0], p[1] - C0[1], p[2] - C0[2]]; const d = (N[0] * T[0] + N[1] * T[1] + N[2] * T[2]) / tl; N = [N[0] - (T[0] / tl) * d, N[1] - (T[1] / tl) * d, N[2] - (T[2] / tl) * d]; const nl = Math.hypot(...N) || 1; N = N.map((v) => v / nl);
      const B = [(T[1] * N[2] - T[2] * N[1]) / tl, (T[2] * N[0] - T[0] * N[2]) / tl, (T[0] * N[1] - T[1] * N[0]) / tl];
      const ww = w * Math.pow(1 - s, 0.7) * (0.85 + 0.3 * Math.sin(s * Math.PI)), th = o.th * Math.pow(1 - s, 0.8);
      const ring = [[p[0] - B[0] * ww, p[1] - B[1] * ww, p[2] - B[2] * ww], [p[0] + N[0] * th, p[1] + N[1] * th, p[2] + N[2] * th], [p[0] + B[0] * ww, p[1] + B[1] * ww, p[2] + B[2] * ww], [p[0] - N[0] * th * 0.3, p[1] - N[1] * th * 0.3, p[2] - N[2] * th * 0.3]];
      for (let k = 0; k < 4; k++) { Pt.P.push(...ring[k]); const c = this.hairCol(ring[k][1], k === 1 ? 1 : k === 3 ? 0.2 : 0.7); Pt.C.push(...(k === 1 ? mixc(c, this.hairHi, 0.12 * (1 - s)) : c)); }
    }
    for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { const a = base + i * 4 + k, b = base + i * 4 + ((k + 1) % 4), c = a + 4, d = b + 4; Pt.I.push(a, b, d, a, d, c); }
    // root cap
    Pt.I.push(base, base + 2, base + 1, base, base + 3, base + 2);
  }
  // ---------------------------------------------------------------- per frame
  update(E, dt) {
    const blink = E.blink || 0, happyShut = (E.cheek || 0) >= 0.95 && (E.upper ?? 1) < 1, open = happyShut ? 0 : cl((E.upper ?? 1) * (1 - blink), 0, 1.4);
    const sur = (E.upper ?? 1) > 1.2, inn = E.inner || 0;
    for (const e of this.eyes) {
      const shut = open < 0.18;
      e.open.visible = !shut; e.lashG.visible = !shut; e.shut.visible = shut && !happyShut; e.beam.visible = happyShut;
      if (!shut) {
        const o = Math.min(1.25, open);
        e.open.scale.y = o; e.lashG.position.y = (o - 1) * e.eh * 0.62;
        e.irisG.position.x = cl((E.lookX || 0) * 0.16, -0.3, 0.3) * e.ew; e.irisG.position.y = -cl(E.lookY || 0, -1, 2) * 0.08 * e.eh;
        e.irisG.scale.setScalar(sur ? 0.72 : 1);
        e.lashG.rotation.z = e.s * (inn < 0 ? -inn * 0.06 : -inn * 0.05);
      }
    }
    for (const b of this.brows) { b.g.position.y = b.y0 + ((E.brow || 0) * 0.006 + (sur ? 0.012 : 0)) * this.hu; b.g.rotation.z = b.s * (inn > 0 ? inn * 0.12 : inn * 0.16); }
    this.setMouth(E);
    const bl = cl(this.blush0 + (E.cheek || 0) * 0.35);
    for (const c of this.cheeks) { c.visible = bl > 0.05; c.material.opacity = bl * 0.45; }
    // long hair sways with the body's spring (the twin tails' spring is reused)
    if (this.longPivot) { const T = this.h.tails[0]; this.longPivot.rotation.x = T.x * 0.35 + 0.05; this.longPivot.rotation.z = T.z * 0.3; }
  }
  dispose() { this.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); for (const m of Object.values(this.mats)) m.dispose(); }
}
