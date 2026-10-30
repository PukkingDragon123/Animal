// The toon people's heads in the hand-painted PS1 anime style:
//  - a low-poly, flat-shaded head (big round cranium, small pointed chin, a nose ridge that splits the
//    face into two lit planes) with ONE pixel face texture (128²) projected from the front
//  - the face is painted texel by texel and repainted when the expression changes: inked upper lashes
//    with a flick and stray wisps, glassy irises (dark top, light bottom, two catchlights), spiky lower
//    lashes, a small smirk, blush hatching, stickers, painted glasses
//  - chunky hair: a scalp shell plus wide, pointed, faceted locks with a painted strand texture (bangs
//    to the eyelids, long side locks, back fan, spikes, tails on the spring bones, fluffy animal ears)
// Everything rides the head bone (tails on the tail bones), so animation, look-at and springs apply.
import * as THREE from '../../../../vendor/three.module.js';
import { Buf, hash, rgb, mix, shade } from './raster.js';

const cl = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
const INK = [34, 26, 32];
const FT = 128;                                   // face texture size

// head profile from chin (t 0) to crown (t 1): [t, rx (× hw), rz (× hd), centre z offset (× hd)]
const PROF = [[0, 0.14, 0.14, 0.56], [0.1, 0.52, 0.48, 0.36], [0.24, 0.86, 0.8, 0.15], [0.4, 0.99, 0.94, 0.04], [0.56, 1, 1, 0], [0.72, 0.98, 1, -0.03], [0.86, 0.86, 0.9, -0.05], [0.96, 0.52, 0.58, -0.05]];
function prof(t) { t = cl(t, 0, 0.999); for (let i = 1; i < PROF.length; i++) if (t <= PROF[i][0]) { const a = PROF[i - 1], b = PROF[i], k = sstep(0, 1, (t - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)]; } const a = PROF[PROF.length - 1], k = (t - a[0]) / (1 - a[0]); return [a[1] * (1 - k), a[2] * (1 - k), a[3]]; }
const SE = 2.2, sp = (v) => Math.sign(v) * Math.pow(Math.abs(v), 2 / SE);

/** flip triangles (from index i0 on) whose normal points toward the centroid of their vertices (convex pieces) */
function orientOut(P, I, i0) {
  const used = new Set(I.slice(i0)); let cx = 0, cy = 0, cz = 0; for (const v of used) { cx += P[v * 3]; cy += P[v * 3 + 1]; cz += P[v * 3 + 2]; } const n = used.size || 1; cx /= n; cy /= n; cz /= n;
  for (let t = i0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3, e1 = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]], e2 = [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
    const mx = (P[a] + P[b] + P[c]) / 3 - cx, my = (P[a + 1] + P[b + 1] + P[c + 1]) / 3 - cy, mz = (P[a + 2] + P[b + 2] + P[c + 2]) / 3 - cz;
    if (nx * mx + ny * my + nz * mz < 0) { const tmp = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = tmp; }
  }
}
/** soft, bright, flat-shaded material (a little self-light scaled by the texture so colours stay clean) */
export function softMat(o = {}) {
  const m = new THREE.MeshLambertMaterial({ map: o.map || null, color: o.color !== undefined ? new THREE.Color().setRGB(...rgb(o.color).map((v) => Math.pow(v / 255, 2.2))) : 0xffffff, flatShading: true, side: o.side || THREE.FrontSide });
  m.emissive.setRGB(0.5, 0.5, 0.5); if (o.map) m.emissiveMap = o.map; else m.emissive.copy(m.color).multiplyScalar(0.5);
  m.userData.keep = true;                         // the stage's cel pass leaves these alone
  return m;
}

export class ToonHead {
  constructor(h) {
    this.h = h; const P = h.P, J = h.J, spec = h.spec, F = spec.face || {}, H = spec.hair || {};
    this.P = P; this.fem = P.f; this.kid = P.kid; this.hu = P.hu; this.hw = P.hw; this.hd = P.hd; this.chin = P.chin; this.hcz = P.hcz;
    this.W = this.hw * 1.08;                      // half-width the face texture spans
    const root = this.root = new THREE.Group(); root.position.set(-J.head[0], -J.head[1], -J.head[2]); h.b.head.add(root);
    this.skin = rgb(spec.skin || '#f0c8a8'); this.hairC = rgb(H.col || '#2a1e1a');
    this.hairHi = H.grey ? [250, 250, 248] : this.hairC[0] + this.hairC[1] + this.hairC[2] < 240 ? mix(this.hairC, [176, 180, 214], 0.6) : mix(this.hairC, [255, 248, 230], 0.5);
    this.iris = rgb(F.iris || '#6a4a3a'); this.F = F; this.G = spec.glasses || null;
    this.seed = Math.round(P.H * 977) + (spec.id || '').length * 13;
    // the face texture: a static layer (skin, stickers, glasses) and the live one (+ eyes, mouth, blush)
    this.base = new Buf(FT, FT); this.face = new Buf(FT, FT); this.paintBase();
    this.faceTex = this.face.texture();
    this.mats = { face: softMat({ map: this.faceTex }) };
    this.buildHead();
    this.buildHair();
    root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
    this.key = ''; this.paintFace({ eye: 'open', mouth: 'neutral', look: 0, blush: 1 });
  }
  // ---------------------------------------------------------------- geometry helpers
  X(x) { return (x / this.W * 0.5 + 0.5) * FT; }
  Y(y) { return ((y - this.chin) / this.hu) * FT; }
  yAt(t) { return this.chin + t * this.hu; }
  /** the head surface: z of the front at (x, y) (absolute rest coordinates) */
  surfZ(x, y, grow = 1) {
    const t = (y - this.chin) / this.hu, [px, pz, pc] = prof(t), rx = px * this.hw * grow, rz = pz * this.hd * grow, cz = this.hcz + pc * this.hd;
    if (rx < 1e-4) return cz;
    const u = Math.min(1, Math.abs(x) / rx);
    return cz + rz * Math.pow(Math.max(0, 1 - Math.pow(u, SE)), 1 / SE);
  }
  scalp(a, t, g) { const [px, pz, pc] = prof(t), rx = px * this.hw * g, rz = pz * this.hd * g, cz = this.hcz + pc * this.hd; return [rx * sp(Math.sin(a)), this.yAt(t), cz + rz * sp(Math.cos(a))]; }
  // ---------------------------------------------------------------- the head mesh
  buildHead() {
    const N = 10, rings = [0.03, 0.1, 0.24, 0.4, 0.56, 0.72, 0.86, 0.96], pos = [], uv = [], idx = [], hu = this.hu;
    for (const t of rings) {
      const [px, pz, pc] = prof(t), y = this.yAt(t), rx = px * this.hw, rz = pz * this.hd, cz = this.hcz + pc * this.hd;
      // the nose ridge: the front vertex juts out between the eyes and the mouth
      const ridge = t > 0.15 && t < 0.45 ? Math.sin(((t - 0.15) / 0.3) * Math.PI) * this.hd * 0.07 : 0;
      for (let k = 0; k <= N; k++) {
        const a = -Math.PI + (k / N) * TAU, x = rx * sp(Math.sin(a)), z = cz + rz * sp(Math.cos(a)) + (k === N / 2 ? ridge : 0);
        pos.push(x, y, z);
        const back = Math.abs(a) > Math.PI / 2 + 0.01;
        uv.push(back ? (a > 0 ? 0.985 : 0.015) : cl(this.X(x) / FT, 0.015, 0.985), cl(this.Y(y) / FT, 0.005, 0.995));
      }
    }
    const R = rings.length, row = N + 1;
    for (let j = 0; j < R - 1; j++) for (let k = 0; k < N; k++) { const a = j * row + k, b = a + 1, c = a + row, d = c + 1; idx.push(a, b, d, a, d, c); }
    // chin point and crown
    const chinI = pos.length / 3; pos.push(0, this.chin, this.hcz + this.hd * 0.6); uv.push(0.5, 0.01);
    const topI = pos.length / 3; pos.push(0, this.yAt(1), this.hcz - this.hd * 0.05); uv.push(0.015, 0.99);
    for (let k = 0; k < N; k++) { idx.push(chinI, k + 1, k); idx.push(topI, (R - 1) * row + k, (R - 1) * row + k + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, this.mats.face); this.root.add(m); this.headMesh = m;
    // ears: little skin wedges (mostly under the hair)
    const earMat = softMat({ color: this.skin });
    for (const s of [1, -1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(hu * 0.07, hu * 0.16, 4), earMat); e.rotation.z = s * -1.9; e.position.set(s * this.hw * 0.98, this.yAt(0.4), this.hcz - this.hd * 0.08); this.root.add(e); }
    this.earMat = earMat;
  }
  // ---------------------------------------------------------------- the painted face
  paintBase() {
    const B = this.base, sk = this.skin, F = this.F;
    B.rect(0, 0, FT, FT, sk);
    // a soft cheek shade low on the face and a faint jaw line (painted, like the reference)
    for (let j = 0; j < FT; j++) for (let i = 0; i < FT; i++) { const x = (i - 64) / 64, y = j / FT; if (y < 0.12 && Math.abs(x) > 0.25) B.set(i, j, shade(sk, 0.94)); }
    // stickers and painted extras (in the static layer)
    for (const d of F.deco || []) this.paintDeco(B, d);
    if (F.mustache) { const c = mix(this.hairC, INK, 0.3), y = 30; B.fillPoly([[52, y], [64, y + 4], [76, y], [72, y + 3], [64, y + 6], [56, y + 3]], c); }
    if (this.G) this.paintGlasses(B, this.G);
  }
  eyeGeom() { const f = this.fem, k = this.kid; return { EX: f || k ? 29 : 27, EY: f ? 49 : 51, ew: f || k ? 18.5 : 14, eh: f ? 13.5 : k ? 12.5 : 8.5 }; }
  paintDeco(B, d) {
    const at = d.at || 'cheekL', s = /L$/.test(at) ? 1 : /R$/.test(at) ? -1 : 0, base = at.replace(/[LR]$/, ''), E = this.eyeGeom();
    const A = { cheek: [64 + s * 38, 34], eye: [64 + s * (E.EX + E.ew + 2), E.EY - E.eh - 3], brow: [64 + s * E.EX, E.EY + E.eh + 9], nose: [64, 34], mouth: [64 + s * 11, 24], forehead: [64 + s * 18, 96] }[base] || [64, 36];
    const [ax, ay] = A, r = 5 * (d.size || 1), col = d.col !== undefined ? rgb(d.col) : null;
    switch (d.kind) {
      case 'star': { const p = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r; p.push([ax + Math.cos(a) * rr, ay + Math.sin(a) * rr]); } B.fillPoly(p, col || [255, 214, 74]); break; }
      case 'heart': { const p = []; for (let i = 0; i < 24; i++) { const t = (i / 24) * TAU; p.push([ax + r * 0.07 * 16 * Math.pow(Math.sin(t), 3), ay + r * 0.07 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); } B.fillPoly(p, col || [244, 92, 138]); break; }
      case 'bandaid': { const w = r * 1.5, hh = r * 0.5, a = s ? -s * 0.45 : 0.1, c = Math.cos(a), sn = Math.sin(a), R2 = (x, y) => [ax + x * c - y * sn, ay + x * sn + y * c]; B.fillPoly([R2(-w, -hh), R2(w, -hh), R2(w, hh), R2(-w, hh)], [238, 200, 168]); B.fillPoly([R2(-w * 0.32, -hh * 0.8), R2(w * 0.32, -hh * 0.8), R2(w * 0.32, hh * 0.8), R2(-w * 0.32, hh * 0.8)], [220, 168, 140]); break; }
      case 'gems': for (const [dx, dy, k] of [[0, 0, 1], [s * 4, 4, 0.75], [s * 7, 8, 0.55]]) { const x = ax + dx, y = ay + dy, g = 2.6 * k; B.fillPoly([[x, y + g], [x + g, y], [x, y - g], [x - g, y]], col || [150, 220, 255]); B.set(x - 1, y + 1, [255, 255, 255]); } break;
      case 'mole': B.rect(ax, ay, 2, 2, [70, 40, 38]); break;
      case 'hatch': for (const sd of [1, -1]) for (const o of [-4, 0, 4]) B.line(64 + sd * 38 + o - 1.5, 32, 64 + sd * 38 + o + 1.5, 37, [226, 104, 118]); break;
      case 'paint': for (const o of [0, 4]) B.line(ax - s * 6, ay - o, ax + s * 6, ay - o + s * 1, col || [30, 24, 30], 2); break;
      case 'scar': B.line(ax - 3, ay + 5, ax + 3, ay - 5, [236, 190, 172], 2); break;
      case 'tear': B.ell(ax, ay, 2, 3, col || [128, 200, 248]); break;
      default: break;
    }
  }
  paintGlasses(B, G) {
    const E = this.eyeGeom(), c = rgb(G.col || '#28222a'), round = G.kind !== 'rect';
    for (const s of [1, -1]) {
      const cx = 64 + s * E.EX, cy = E.EY, rx = E.ew + 4, ry = Math.max(E.eh + 4, 11);
      if (round) { for (let k = 0; k < 40; k++) { const a = (k / 40) * TAU; B.rect(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 2, 2, c); } }
      else { B.line(cx - rx, cy + ry, cx + rx, cy + ry, c, 2); B.line(cx - rx, cy - ry * 0.8, cx + rx, cy - ry * 0.8, c, 2); B.line(cx - rx, cy - ry * 0.8, cx - rx, cy + ry, c, 2); B.line(cx + rx, cy - ry * 0.8, cx + rx, cy + ry, c, 2); }
      B.line(cx + s * rx, cy + 2, s > 0 ? FT - 1 : 0, cy + 4, c, 2);
    }
    B.line(64 - (E.EX - E.ew - 4), E.EY + 3, 64 + (E.EX - E.ew - 4), E.EY + 3, c, 2);
  }
  /** st: { eye: open|half|closed|happy|wide|angry|sad, mouth: neutral|smile|small|open|grin|O|frown|duck, look: -2..2, blush: 0..2 } */
  paintFace(st) {
    const key = st.eye + st.mouth + st.look + st.blush; if (key === this.key) return; this.key = key;
    const B = this.face.copy(this.base), E = this.eyeGeom(), f = this.fem || this.kid, sk = this.skin;
    // blush
    if (st.blush > 0 || f) { const a = f ? [0.22, 0.38, 0.6][st.blush] : [0, 0.2, 0.45][st.blush]; for (const s of [1, -1]) B.ell(64 + s * 37, 36, 9, 4, [244, 134, 148], a); }
    // eyes
    for (const s of [1, -1]) this.paintEye(B, s, E, st);
    // brows (on top of the forehead; long bangs hide a girl's)
    if (!f || !this.h.spec.hair || ['bald', 'buzz', 'mohawk'].includes(this.h.spec.hair.style)) for (const s of [1, -1]) {
      const cx = 64 + s * E.EX, y0 = E.EY + E.eh + (f ? 9 : 6), tilt = st.eye === 'angry' ? -3 : st.eye === 'sad' ? 3 : st.eye === 'wide' ? 2 : 0, c = mix(this.hairC, INK, 0.5);
      const inner = [cx - s * 10, y0 + tilt + (st.eye === 'wide' ? 2 : 0)], outer = [cx + s * 11, y0 + 1 + (st.eye === 'wide' ? 2 : 0)];
      B.line(...inner, cx, y0 + 2 + (st.eye === 'wide' ? 2 : 0), c, f ? 1 : 2.5); B.line(cx, y0 + 2 + (st.eye === 'wide' ? 2 : 0), ...outer, c, f ? 1 : 2.5);
    }
    // mouth
    this.paintMouth(B, st.mouth, sk);
    this.faceTex.needsUpdate = true;
  }
  paintEye(B, s, E, st) {
    const f = this.fem || this.kid, cx = 64 + s * E.EX, wide = st.eye === 'wide', ew = E.ew, eh = E.eh * (wide ? 1.12 : 1), EY = E.EY;
    const X = (u) => cx + s * u * ew;
    const yTop = (u) => EY + eh * (0.9 * Math.sqrt(Math.max(0, 1 - u * u)) + 0.14 * u);
    const yBot = (u) => EY - eh * (0.7 * Math.sqrt(Math.max(0, 1 - u * u))) + eh * 0.06 * u;
    const lash = INK, lid = mix(this.skin, [120, 70, 80], 0.35);
    if (st.eye === 'closed' || st.eye === 'happy') {
      const up = st.eye === 'happy', pts = [];
      for (let k = 0; k <= 12; k++) { const u = -1 + (2 * k) / 12; pts.push([X(u), EY - eh * 0.1 + (up ? 1 : -1) * eh * 0.42 * Math.pow(1 - u * u, 0.8)]); }
      B.poly(pts, lash, f ? 2 : 1.6);
      if (f && !up) { B.line(X(0.9), EY - eh * 0.2, X(1.2), EY - eh * 0.5, lash); B.line(X(0.6), EY - eh * 0.4, X(0.75), EY - eh * 0.7, lash); }
      return;
    }
    // where the upper lid sits for this state
    const lidY = (u) => { const t = yTop(u); if (st.eye === 'half') return lerp(yBot(u), t, 0.5); if (st.eye === 'angry') return t - eh * 0.4 * (1 - u) / 2; if (st.eye === 'sad') return t - eh * 0.32 * (1 + u) / 2; return t; };
    // the white
    const iris = this.iris, ix = cx + cl(st.look, -2, 2) * 1.6, iy = EY - eh * 0.06, ry = (f ? eh * 0.98 : eh * 0.9) * (wide ? 0.72 : 1), rx = (f ? ry * 0.8 : ry * 0.85);
    for (let j = Math.floor(EY - eh - 1); j <= Math.ceil(EY + eh + 1); j++) for (let i = Math.floor(cx - ew - 1); i <= Math.ceil(cx + ew + 1); i++) {
      const u = (s * (i + 0.5 - cx)) / ew, y = j + 0.5; if (Math.abs(u) > 1) continue;
      const top = lidY(u), bot = yBot(u); if (y < bot || y > top) continue;
      // the iris: an upright oval, dark top, glowing bottom, a ring and a pupil
      const dx = (i + 0.5 - ix) / rx, dy = (y - iy) / ry, r2 = dx * dx + dy * dy;
      let c = [250, 248, 252];
      if (y > top - 1.2) c = [196, 190, 206];                       // the lash's shadow on the white
      if (r2 <= 1) {
        const v = cl((y - (iy - ry)) / (2 * ry));
        c = mix(shade(iris, 1.25), shade(iris, 0.5), sstep(0.25, 0.85, v));
        if (r2 > 0.72) c = shade(iris, 0.4);
        const pr = (dx / 0.42) ** 2 + ((y - iy + ry * 0.05) / (ry * 0.5)) ** 2; if (pr <= 1) c = shade(iris, 0.22);
        if (y > top - 1.2) c = shade(c, 0.7);
      }
      B.set(i, j, c);
    }
    // catchlights
    if (st.eye !== 'half') { B.ell(ix - s * rx * 0.28, iy + ry * 0.36, Math.max(1.4, rx * 0.26), Math.max(1.6, ry * 0.24), [255, 255, 255]); B.rect(ix + s * rx * 0.3, iy - ry * 0.5, 1, 1, [255, 255, 255]); }
    // the upper lash: a thick inked line along the lid, thicker toward the outer corner, flicking out
    for (let k = 0; k <= 40; k++) {
      const u = -0.98 + (k / 40) * 2.18, ext = u > 1, y = ext ? lidY(1) + (u - 1) * eh * 1.2 : lidY(u), th = f ? lerp(1.8, 3.8, cl((u + 1) / 2)) * (ext ? 1 - (u - 1) * 3.5 : 1) : lerp(1.2, 2, cl((u + 1) / 2)) * (ext ? 1 - (u - 1) * 5 : 1);
      if (th <= 0.3) continue;
      const x = X(ext ? 1 + (u - 1) * 0.9 : u);
      for (let q = 0; q < th; q += 0.5) B.set(x, y + q - 0.2, lash);
    }
    if (f) {
      // stray wisps above the lid and the lid crease
      for (const [u, l] of [[0.25, 3], [0.55, 4], [0.85, 5]]) { const x = X(u), y = lidY(u) + 2.6; B.line(x, y, x + s * l * 0.7, y + l * 0.8, lash); }
      for (let k = 0; k <= 10; k++) { const u = -0.3 + k * 0.11; B.set(X(u), lidY(u) + 5.2 + (k % 3 === 0 ? 0 : 0), lid); }
      // the spiky lower lash: little drips under the eye
      for (let k = 0; k <= 7; k++) { const u = -0.45 + k * 0.2, x = X(u), y = yBot(u) - 1.4; B.set(x, y, lash); if (k % 2 === 0 || u > 0.6) B.line(x, y, x + s * 0.4, y - (k % 3 === 0 ? 3 : 2), lash); }
      B.line(X(0.85), yBot(0.85), X(1.05), yBot(1.0) + 1.5, lash);
    } else {
      B.line(X(0.2), yBot(0.2) - 0.6, X(0.95), yBot(0.95) - 0.2, mix(this.skin, INK, 0.45));
    }
  }
  paintMouth(B, m, sk) {
    const MX = 64, MY = 23, ink = [74, 38, 44], dark = [96, 26, 38], tongue = [232, 112, 122], teeth = [252, 250, 246];
    const curve = (w, k, y0 = 0) => { const p = []; for (let i = 0; i <= 10; i++) { const u = -1 + i / 5; p.push([MX + u * w, MY + y0 + k * u * u]); } return p; };
    switch (m) {
      case 'smile': B.poly(curve(6, 2.4, -0.6), ink, 1.3); break;
      case 'frown': B.poly(curve(5, -2.2, 1.2), ink, 1.3); break;
      case 'small': B.ell(MX, MY - 0.5, 3, 2.2, dark); B.rect(MX - 2, MY - 2.5, 4, 1, tongue); break;
      case 'O': B.ell(MX, MY - 1, 2.6, 3.6, dark); B.rect(MX - 1, MY - 4, 3, 1, tongue); break;
      case 'duck': B.ell(MX, MY, 2.4, 2, [200, 96, 110]); B.ell(MX, MY, 1.2, 1, dark); break;
      case 'open': case 'grin': {
        const w = m === 'grin' ? 7 : 5.5, dep = m === 'grin' ? 4.5 : 5.5, pts = [];
        for (let i = 0; i <= 12; i++) { const u = -1 + i / 6; pts.push([MX + u * w, MY + 1.5 + (m === 'grin' ? 1.2 * u * u : 0)]); }
        for (let i = 12; i >= 0; i--) { const u = -1 + i / 6; pts.push([MX + u * w * 0.92, MY + 1.5 - dep * Math.sqrt(Math.max(0, 1 - u * u))]); }
        B.fillPoly(pts, dark); B.ell(MX, MY - dep + 2.2, w * 0.5, 1.6, tongue);
        if (m === 'grin') B.rect(MX - w + 1.5, MY + 0.5, (w - 1.5) * 2, 1.5, teeth); else B.rect(MX - 3, MY + 0.6, 6, 1, teeth);
        break;
      }
      default: {   // the little smirk: a short line with a cat-like dip
        B.poly([[MX - 6, MY + 0.6], [MX - 2, MY], [MX + 0.5, MY - 1.6], [MX + 2.5, MY], [MX + 6, MY + 0.9]], ink, 1.1);
      }
    }
    void sk;
  }
  // ---------------------------------------------------------------- hair
  hairTexture() {
    const B = new Buf(32, 64), c = this.hairC, hi = this.hairHi, dk = shade(c, 0.7), seed = this.seed;
    B.fill(0, 0, 32, 64, (i, j) => {
      const v = j / 63, strand = hash(i, 3, seed) < 0.2 && hash(i, j >> 4, seed) > 0.3, sheen = v > 0.08 && v < 0.2 && hash(i >> 2, 9, seed) < 0.7;
      let k = c;
      if (strand) k = dk; else if (sheen) k = mix(c, hi, 0.45); else if (v > 0.2 && v < 0.24 && hash(i >> 2, 9, seed) < 0.7) k = mix(c, hi, 0.2);
      if (hash(i, j, seed + 3) < 0.04) k = mix(k, hi, 0.3);
      return k;
    });
    const t = B.texture(); t.wrapS = THREE.RepeatWrapping; return t;
  }
  buildHair() {
    const H = this.h.spec.hair || {}, st = H.style || 'short', P = this.P, hu = this.hu, J = this.h.J, fem = this.fem;
    if (st === 'none' || st === 'bald') return;
    const vol = H.volume || 1;
    this.hairTex = this.hairTexture(); this.mats.hair = softMat({ map: this.hairTex, side: THREE.DoubleSide });
    this.hairParts = new Map();
    const part = (name, bone) => { if (!this.hairParts.has(name)) { const grp = new THREE.Group(); const Bn = bone ? this.h.b[bone] : null; if (Bn) { grp.position.set(-J[bone][0], -J[bone][1], -J[bone][2]); Bn.add(grp); } else this.root.add(grp); this.hairParts.set(name, { grp, P: [], UV: [], I: [], bone }); } return this.hairParts.get(name); };
    const C0 = [0, this.yAt(0.55), this.hcz];
    // the scalp shell, down to a hairline (lower at the back and the temples)
    const cap = part('cap'), thin = st === 'buzz' || st === 'mohawk', grow = thin ? 1.035 : 1.08 + 0.025 * (vol - 1);
    const hl = (a) => { const f = Math.cos(a); return f > 0 ? lerp(0.62, 0.8, Math.pow(f, 2)) : lerp(0.62, 0.3, -f); };
    { const R = 5, N = 12, base = cap.P.length / 3;
      for (let j = 0; j <= R; j++) for (let i = 0; i <= N; i++) {
        const a = (i / N) * TAU, t = lerp(hl(a), 0.995, j / R), r = this.scalp(a, t, grow);
        cap.P.push(...r); cap.UV.push((i / N) * 3, (1 - j / R) * 0.4);
      }
      for (let j = 0; j < R; j++) for (let i = 0; i < N; i++) { const a = base + j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; cap.I.push(a, b, d, a, d, c); }
    }
    const scalp = (a, t, g = grow) => this.scalp(a, t, g);
    const lock = (name, root, tip, w, o = {}) => this.lock(part(name, o.bone), root, tip, w, { C0: o.C0 || C0, th: o.th ?? w * 0.32, bend: o.bend ?? 0.3, out: o.out ?? 0.25, n: o.n || 4, taper: o.taper });
    const front = (k, n, spread) => (k / (n - 1) - 0.5) * spread;
    // bangs: wide pointed clumps over the forehead, jagged lengths, down to the eyelids
    const bangs = (n, tipT, spread = 1.8, sweep = 0) => {
      for (let k = 0; k < n; k++) {
        const a = front(k, n, spread), f = a / (spread / 2), r = scalp(a * 0.75, 0.93, grow), jag = [0, 0.05, -0.025, 0.06, -0.01, 0.04, 0.02][k % 7];
        const ty = this.yAt(tipT + jag + f * f * 0.12), tx = f * this.hw * 0.84 + sweep * hu * 0.12;
        lock('cap', r, [tx, ty, this.surfZ(tx, ty) + hu * 0.04], hu * (0.32 + 0.03 * vol) * (1 - Math.abs(f) * 0.15), { th: hu * 0.05, out: 0.12, bend: 0.15, taper: 0.3, n: 5 });
      }
    };
    // side locks framing the face (long ones hang down in front of the shoulders)
    const sides = (tipY, w = 0.15, n = 2, fwd = 0) => { for (const s of [1, -1]) for (let k = 0; k < n; k++) { const a = s * (1.1 + k * 0.34), r = scalp(a, 0.74, grow); lock('cap', r, [s * this.hw * (1.02 + k * 0.12), tipY - k * hu * 0.1, r[2] + fwd - hu * 0.04 * k], hu * w * 1.25, { th: hu * 0.035, out: 0.22, n: 5 }); } };
    // the back fan
    const back = (tipY, n = 7, w = 0.22, name = 'cap') => { for (let k = 0; k < n; k++) { const a = Math.PI + (k / (n - 1) - 0.5) * 2.5, r = scalp(a, 0.74, grow); lock(name, r, [r[0] * 1.18, tipY - (k % 2) * hu * 0.08, r[2] - hu * 0.08], hu * w * vol, { th: hu * 0.07, out: 0.3, n: 5 }); } };
    // spikes all around (shonen hair)
    const spikes = (n, len) => { for (let k = 0; k < n; k++) { const a = (k / n) * TAU + 0.2, t = k % 2 ? 0.88 : 0.8, r = scalp(a, t, grow), d = [r[0] - C0[0], r[1] - C0[1], r[2] - C0[2]], l = Math.hypot(...d); const up = Math.cos(a) > 0.3 ? -0.25 : 0.4; lock('cap', r, [r[0] + (d[0] / l) * hu * len, r[1] + hu * len * up, r[2] + (d[2] / l) * hu * len * 0.8], hu * 0.22, { th: hu * 0.08, out: 0.15 }); } };
    const chestZ = P.td.chest + hu * 0.12;
    if (st === 'messy' || st === 'short' || st === 'sidepart' || st === 'bowl' || st === 'mushroom') {
      const bowl = st === 'bowl' || st === 'mushroom';
      bangs(bowl ? 7 : 5, bowl ? 0.56 : 0.6, 1.9, st === 'sidepart' ? (H.part || 1) * 0.7 : 0);
      sides(this.yAt(0.32), 0.13, 1); back(this.yAt(0.12), 7, 0.2);
      if (st === 'messy') spikes(9, 0.2);
    } else if (st === 'long' || st === 'bob' || st === 'ponytail' || st === 'twintails' || st === 'pigtails' || st === 'bun') {
      bangs(fem ? 6 : 5, 0.45, 2.0);
      if (st === 'long') { sides(this.chin - hu * 0.9, 0.2, 2, chestZ - this.hcz); this.sheet(part('long'), this.yAt(-1.45), grow); }
      else if (st === 'bob') { sides(this.yAt(0.04), 0.18, 2); this.sheet(cap, this.yAt(0.02), grow); }
      else { sides(st === 'bun' ? this.yAt(0.3) : this.chin - hu * 0.4, 0.14, 1, (chestZ - this.hcz) * 0.5); this.sheet(cap, this.yAt(0.18), grow); }
      // tails on the spring bones: three chunky locks each
      const bundle = (bone, len, w) => { const j = J[bone]; for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU + 0.5; this.lock(part('tail_' + bone, bone), [j[0] + Math.cos(a) * hu * 0.03, j[1], j[2] + Math.sin(a) * hu * 0.03], [j[0] + Math.cos(a) * hu * 0.07 + (j[0] ? Math.sign(j[0]) * hu * 0.1 : 0), j[1] - len * (0.9 + 0.1 * (k % 2)), j[2] - hu * 0.14 + Math.sin(a) * hu * 0.06], w, { C0: [j[0], j[1] + hu * 0.2, j[2] + hu * 0.1], th: w * 0.5, bend: 0.4, out: 0.32, n: 6 }); } };
      if (st === 'ponytail') bundle('tailL', P.H * 0.17 * vol, hu * 0.2);
      if (st === 'twintails' || st === 'pigtails') { const len = P.H * (st === 'pigtails' ? 0.09 : 0.18) * vol; bundle('tailL', len, hu * 0.18); bundle('tailR', len, hu * 0.18); }
      if (st === 'bun') { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(hu * 0.19, 0), this.mats.hair); b.position.set(0, this.yAt(0.9), this.hcz - this.hd * 1.05); this.root.add(b); }
    } else if (st === 'perm') {
      for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU * 2.3, t = 0.55 + (k / 24) * 0.42, r = scalp(a, t, grow * 1.06); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(hu * 0.12 * vol, 0), this.mats.hair); b.position.set(...r); b.rotation.set(k, k * 2, 0); this.root.add(b); }
    } else if (st === 'mohawk') {
      for (let k = 0; k < 6; k++) { const a = Math.PI * (k / 5) - 0.1, r = scalp(Math.min(Math.PI, a), 0.7 + k * 0.05); lock('cap', [0, r[1], r[2]], [0, r[1] + hu * 0.36 * vol, r[2] - hu * 0.14], hu * 0.22, { th: hu * 0.06, out: 0.1 }); }
    }
    if (H.ahoge) { const r = scalp(0.2, 0.99); this.lock(part('ahoge', 'ahoge'), r, [r[0] + hu * 0.06, r[1] + hu * 0.24, r[2] + hu * 0.12], hu * 0.08, { C0: [0, r[1] - hu * 0.2, r[2] - hu * 0.2], th: hu * 0.03, bend: 0.8, out: 0.2, n: 5 }); }
    // fluffy animal ears sticking out from the hair (cat / fox)
    if (H.ears) for (const s of [1, -1]) this.ear(s, H.ears === 'fox' ? 1.3 : 1);
    for (const [name, Pt] of this.hairParts) {
      if (!Pt.P.length) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(Pt.P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(Pt.UV, 2)); g.setIndex(Pt.I); g.computeVertexNormals();
      const m = new THREE.Mesh(g, this.mats.hair); m.castShadow = true; Pt.grp.add(m);
      if (name === 'long') { const piv = new THREE.Group(), y0 = this.yAt(0.5), z0 = this.hcz - this.hd * 0.6; piv.position.set(0, y0, z0); Pt.grp.position.set(0, -y0, -z0); this.root.remove(Pt.grp); piv.add(Pt.grp); this.root.add(piv); this.longPivot = piv; }
    }
  }
  /** a curtain of hair hanging from the back of the head to tipY: a curved sheet with a jagged hem (covers the ears and nape) */
  sheet(Pt, tipY, grow) {
    const N = 10, R = 4, base = Pt.P.length / 3, hu = this.hu, t0 = 0.74, top = this.scalp(Math.PI, t0, grow);
    for (let i = 0; i <= N; i++) {
      const a = Math.PI + (i / N - 0.5) * 3.5, edge = Math.abs(i / N - 0.5) * 2, jag = (i % 2 ? 0.1 : 0) + hash(i, 5, this.seed) * 0.08;
      for (let j = 0; j <= R; j++) {
        const v = j / R, r = this.scalp(a, t0 - v * 0.1, grow * (1 + 0.1 * Math.sin(v * Math.PI) + v * 0.06));
        const y = lerp(r[1], tipY + jag * hu - edge * edge * hu * 0.25, v);
        Pt.P.push(r[0] * (1 + v * 0.12), j === 0 ? r[1] : y, r[2] - v * hu * 0.08 + (1 - edge) * 0); Pt.UV.push(i / N, 0.25 + v * 0.74);
      }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < R; j++) { const a = base + i * (R + 1) + j, b = a + R + 1, c = a + 1, d = b + 1; Pt.I.push(a, b, d, a, d, c); }
    void top;
  }
  /** a fluffy ear: a low-poly wedge leaning outward, its inner face a darker tuft */
  ear(s, len) {
    const hu = this.hu, r = this.scalp(s * 0.95, 0.86, 1.06), out = [s * 0.82, 0.5, 0.05], L = hu * 0.34 * len, w = hu * 0.15;
    const tip = [r[0] + out[0] * L, r[1] + out[1] * L, r[2] + out[2] * L];
    const a = [r[0] - s * w * 0.2, r[1] + w * 0.9, r[2] - w * 0.15], b = [r[0] + s * w * 0.3, r[1] - w * 0.6, r[2] + w * 0.25], c = [r[0], r[1], r[2] - w * 0.75], f = [r[0] + s * w * 0.1, r[1] + w * 0.1, r[2] + w * 0.6];
    const pos = [...a, ...b, ...c, ...f, ...tip], uv = [0, 0.1, 1, 0.1, 0.5, 0.2, 0.5, 0.05, 0.5, 0.9];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const ei = [0, 4, 2, 2, 4, 1, 3, 4, 0, 1, 4, 3, 0, 2, 1, 0, 1, 3]; orientOut(pos, ei, 0);
    g.setIndex(ei); g.computeVertexNormals();
    this.root.add(new THREE.Mesh(g, this.mats.hair));
    // the inner tuft: a smaller, darker wedge on the front face
    const k = 0.62, inner = [f, a, b].map((p) => [lerp(p[0], tip[0], 0.12) + (f[0] - r[0]) * 0.1, lerp(p[1], tip[1], 0.12), lerp(p[2], tip[2], 0.12) + hu * 0.012]);
    const t2 = [lerp(r[0], tip[0], k), lerp(r[1], tip[1], k), lerp(r[2], tip[2], k) + hu * 0.02];
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute([...inner[0], ...inner[1], ...inner[2], ...t2], 3)); g2.setIndex([0, 3, 1, 2, 3, 0]); g2.computeVertexNormals();
    if (!this.mats.earIn) this.mats.earIn = softMat({ color: mix(shade(this.hairC, 0.7), [230, 160, 160], 0.25), side: THREE.DoubleSide });
    this.root.add(new THREE.Mesh(g2, this.mats.earIn));
  }
  /** a chunky lock: wide, pointed, ridged (a flat diamond cross-section), bowing outward from C0 */
  lock(Pt, root, tip, w, o) {
    const n = o.n || 4, base = Pt.P.length / 3, C0 = o.C0;
    const mid = [(root[0] + tip[0]) / 2, (root[1] + tip[1]) / 2, (root[2] + tip[2]) / 2];
    const md = [mid[0] - C0[0], mid[1] - C0[1], mid[2] - C0[2]], ml = Math.hypot(...md) || 1, L = Math.hypot(tip[0] - root[0], tip[1] - root[1], tip[2] - root[2]);
    const ctrl = [mid[0] + (md[0] / ml) * L * o.out, mid[1] + (md[1] / ml) * L * o.out * 0.5 + L * o.bend * 0.15, mid[2] + (md[2] / ml) * L * o.out];
    const at = (s) => { const a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s; return [a * root[0] + b * ctrl[0] + c * tip[0], a * root[1] + b * ctrl[1] + c * tip[1], a * root[2] + b * ctrl[2] + c * tip[2]]; };
    const u0 = hash(base, 1, this.seed) * 0.6;
    for (let i = 0; i <= n; i++) {
      const s = i / n, p = at(s), q = at(Math.min(1, s + 0.02)), r0 = at(Math.max(0, s - 0.02)), T = [q[0] - r0[0], q[1] - r0[1], q[2] - r0[2]], tl = Math.hypot(...T) || 1;
      let N = [p[0] - C0[0], p[1] - C0[1], p[2] - C0[2]]; const d = (N[0] * T[0] + N[1] * T[1] + N[2] * T[2]) / tl; N = [N[0] - (T[0] / tl) * d, N[1] - (T[1] / tl) * d, N[2] - (T[2] / tl) * d]; const nl = Math.hypot(...N) || 1; N = N.map((v) => v / nl);
      const B = [(T[1] * N[2] - T[2] * N[1]) / tl, (T[2] * N[0] - T[0] * N[2]) / tl, (T[0] * N[1] - T[1] * N[0]) / tl];
      const ww = w * Math.pow(1 - s, o.taper ?? 0.8) * (0.9 + 0.25 * Math.sin(s * Math.PI)), th = o.th * Math.pow(1 - s, 0.8);
      const ring = [[p[0] - B[0] * ww, p[1] - B[1] * ww, p[2] - B[2] * ww], [p[0] + N[0] * th, p[1] + N[1] * th, p[2] + N[2] * th], [p[0] + B[0] * ww, p[1] + B[1] * ww, p[2] + B[2] * ww], [p[0] - N[0] * th * 0.3, p[1] - N[1] * th * 0.3, p[2] - N[2] * th * 0.3]];
      const us = [u0, u0 + 0.2, u0 + 0.4, u0 + 0.2];
      for (let k = 0; k < 4; k++) { Pt.P.push(...ring[k]); Pt.UV.push(us[k], 0.25 + s * 0.74); }
    }
    const I0 = Pt.I.length;
    for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { const a = base + i * 4 + k, b = base + i * 4 + ((k + 1) % 4), c = a + 4, d = b + 4; Pt.I.push(a, b, d, a, d, c); }
    Pt.I.push(base, base + 2, base + 1, base, base + 3, base + 2);
    orientOut(Pt.P, Pt.I, I0);
  }
  // ---------------------------------------------------------------- per frame
  update(E) {
    const blink = E.blink || 0, happyShut = (E.cheek || 0) >= 0.95 && (E.upper ?? 1) < 0.9, up = E.upper ?? 1, inn = E.inner || 0;
    let eye = 'open';
    if (blink > 0.5) eye = 'closed'; else if (happyShut) eye = 'happy'; else if (up < 0.15) eye = 'closed'; else if (up < 0.6) eye = 'half'; else if (up > 1.2) eye = 'wide'; else if (inn > 1) eye = 'sad'; else if (inn < -1) eye = 'angry';
    const o = E.open || 0, r = E.round || 0, c = E.corner || 0;
    let mouth = 'neutral';
    if (r > 0.95 && o < 2) mouth = 'duck'; else if (o > 3 && r > 0.5) mouth = 'O'; else if (o > 1.8) mouth = E.teeth > 0.5 && c > 1.8 ? 'grin' : 'open'; else if (o > 0.7) mouth = (E.teeth > 0.5 ? 'grin' : 'small'); else if (c > 1.1) mouth = 'smile'; else if (c < -0.5) mouth = 'frown';
    const blush = (E.cheek || 0) > 0.9 ? 2 : (E.cheek || 0) > 0.4 ? 1 : this.fem ? 1 : 0;
    this.paintFace({ eye, mouth, look: Math.round(cl(E.lookX || 0, -2, 2)), blush });
    // long hair sways with the body's spring (the tails' spring is reused)
    if (this.longPivot) { const T = this.h.tails[0]; this.longPivot.rotation.x = T.x * 0.35 + 0.05; this.longPivot.rotation.z = T.z * 0.3; }
  }
  dispose() { this.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); for (const m of Object.values(this.mats)) { m.dispose(); } this.faceTex.dispose(); if (this.hairTex) this.hairTex.dispose(); this.earMat.dispose(); }
}
