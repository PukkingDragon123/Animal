// Strawbaa — the grass starter. A stout, grizzled old ram whose fleece is a ripe strawberry:
// rose-red wool puffs studded with golden seeds, a leafy calyx cap with a curly stem, heavy
// spiral horns ringed with growth ridges (one tip snapped off long ago), a long craggy face,
// bushy white brows over heavy-lidded amber eyes, a notched ear and a great white beard.
// Gentle and sleepy — chews its cud, snorts at nothing — until a friend gets hurt.
import * as THREE from '../../../vendor/three.module.js';
import { E, seg, bump, wob, wave, key, bounce, lerp } from '../anim.js';
import { defineFx } from '../fx.js';
import { poly, ramp, shift, mix, h2 } from './kit.js';

const C = {
  ink: '#3a0f26',
  // strawberry fleece: a cool rose red
  wHi: '#ffb2be', w0: '#ff7d91', w1: '#f04c66', w2: '#d4304f', w3: '#a81d46', w4: '#72133a', w5: '#46092a',
  seed: '#ffd84a', seedHi: '#fff6b8', seedLo: '#c88a22', pit: '#7e1438',
  // calyx, stem, vines
  g0: '#c8f08c', g1: '#86d45e', g2: '#4ea846', g3: '#2c723e', g4: '#18442c',
  st0: '#7aa046', st1: '#55803a', st2: '#3a5c2c',
  // grizzled old face and legs
  s0: '#ece1d0', s1: '#cdbfac', s2: '#ab9b88', s3: '#857261', s4: '#5e4c46', s5: '#40323a',
  // weathered nose leather
  n0: '#d4b4b0', n1: '#ae8c8c', n2: '#7a5a60', n3: '#3e2632',
  // white wool: beard, brows, chops, fetlocks
  b0: '#ffffff', b1: '#f3eee6', b2: '#d8cfc4', b3: '#ada19a', b4: '#7c6e72',
  // horn: weathered ivory, dirtier toward the skull
  h0: '#f6e4bc', h1: '#e2c690', h2: '#c6a26a', h3: '#9e7a50', h4: '#70543c', h5: '#47342c',
  // hooves
  k0: '#6a5c68', k1: '#463a46', k2: '#2a212c',
  // mouth
  m0: '#8a2a3a', m1: '#5a1426', m2: '#360a18', tongue: '#d8607a', tooth: '#efe4c8',
  // eyes
  i0: '#ffd47a', i1: '#eea03a', i2: '#c06a1c', pupil: '#1c0c12',
  // blossoms
  p0: '#fffdf6', p1: '#f2e8dc', p2: '#e2c8cc', core: '#ffd23e',
};
const D2R = Math.PI / 180;

// ---------------------------------------------------------------- geometry helpers
const _m4 = new THREE.Matrix4(), _eu = new THREE.Euler();
// Euler XYZ (degrees) turning local +z toward `fwd`, local +x as close as it can to `side`
function aim(fwd, side = [1, 0, 0]) {
  const z = new THREE.Vector3(...fwd).normalize(), x = new THREE.Vector3(...side);
  x.addScaledVector(z, -x.dot(z)); if (x.lengthSq() < 1e-8) x.set(0, 1, 0).addScaledVector(z, -z.y);
  x.normalize();
  const y = new THREE.Vector3().crossVectors(z, x);
  _eu.setFromRotationMatrix(_m4.makeBasis(x, y, z), 'XYZ');
  return [_eu.x / D2R, _eu.y / D2R, _eu.z / D2R];
}
// boxes strung along a polyline (horns, stems, tendrils): size(i, n) → [width, thickness], tex(i, n) → painter
function chain(pts, size, tex, o = {}) {
  const n = pts.length - 1, out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[i + 1], d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]);
    const [w, t] = size(i, n), len = L + (o.over ?? Math.min(w, t) * 0.5), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    out.push({ o: [m[0] - w / 2, m[1] - t / 2, m[2] - len / 2], s: [w, t, len], pivot: m, rot: aim(d, o.side || [1, 0, 0]), tex: tex(i, n), ...(o.extra ? o.extra(i, n) : {}) });
  }
  return out;
}
// a flat cut-out leaf/petal plane ('y') hinged at `at`, pointing along yaw φ, drooping δ (degrees)
function leafAt(at, len, wid, phi, droop, tex, x = {}) {
  const f = phi * D2R, d = droop * D2R, dir = [Math.sin(f) * Math.cos(d), -Math.sin(d), Math.cos(f) * Math.cos(d)];
  return { o: [at[0] - wid / 2, at[1], at[2]], s: [wid, 0, len], plane: 'y', pivot: at, rot: aim(dir, [Math.cos(f), 0, -Math.sin(f)]), tex, ...x };
}

// ---------------------------------------------------------------- painters
const T01 = (y, h) => (h > 1 ? y / (h - 1) : 0.5);
// strawberry wool: rows of round puffs (lit upper-left, a shadowed rim underneath) shingled over a
// top-lit ramp, studded with golden seeds sitting in little dimples on a loose diagonal lattice
const W_LIT = [C.wHi, C.w0, C.w1, C.w2], W_MID = [C.w0, C.w1, C.w2, C.w3], W_RIM = [C.w2, C.w3, C.w4, C.w5];
function seedAt(p, x, y) {
  p.px(x, y - 1, C.pit); p.px(x + 1, y - 1, C.w3);
  p.px(x, y, C.seedHi); p.px(x + 1, y, C.seed); p.px(x, y + 1, C.seed); p.px(x + 1, y + 1, C.seedLo);
}
function wool(o = {}) {
  const S = o.size ?? 12, RH = o.row ?? 6;
  return (p, w, h, face, cube) => {
    const up = face === 'up', dn = face === 'down';
    const T = (y) => (up ? 0.0 : dn ? 0.85 : (o.t0 ?? 0.05) + (o.t1 ?? 0.5) * T01(y, h));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, ramp(W_RIM, T(y), x, y));
    const sd = Math.abs(Math.round(cube.o[0] * 7 + cube.o[1] * 3 + cube.o[2] * 13)) + face.length * 31;
    const rows = Math.ceil(h / RH) + 2, ox = sd % S;
    // rows shingle bottom-up, so each puff shows its lit crown under the shadowed rim of the puff above
    for (let r = rows; r >= -1; r--) {
      const cy = r * RH + (sd % 3), off = ((r & 1) ? S / 2 : 0) - ox;
      for (let k = -1; k * S + off < w + S; k++) {
        const cx = k * S + off + Math.round((h2(k, r, sd) - 0.5) * 3), rx = S * 0.56 + (h2(r, k, sd) > 0.6 ? 1 : 0), ry = RH * 0.86;
        for (let yy = Math.floor(-ry); yy <= Math.ceil(ry); yy++) for (let xx = Math.floor(-rx); xx <= Math.ceil(rx); xx++) {
          const d = (xx / rx) ** 2 + (yy / ry) ** 2; if (d > 1) continue;
          const X = Math.round(cx + xx), Y = Math.round(cy + yy); if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const t = T(Y);
          let col;
          if (yy > ry * 0.35 && d > 0.62) col = ramp(W_RIM, t + 0.1, X, Y);                   // shadowed underside
          else if (yy < ry * 0.1 && xx < rx * 0.3 && d < 0.62) col = ramp(W_LIT, t, X, Y);    // lit crown, upper left
          else col = ramp(W_MID, t, X, Y);
          p.px(X, Y, col);
        }
        // a pale glint on the crown of some puffs
        const gx = Math.round(cx - rx * 0.4), gy = Math.round(cy - ry * 0.25);
        if (gx >= 0 && gx < w - 1 && gy >= 0 && gy < h && h2(k, r, sd + 1) > 0.62) { p.px(gx, gy, C.wHi); p.px(gx + 1, gy, C.wHi); p.px(gx + 1, gy - 1, C.wHi); }
      }
    }
    if (o.seeds === 0 || dn) return;
    const SX = o.sx ?? 12, SY = o.sy ?? 9;
    for (let r = 0, y = 3 + (sd % 4); y < h - 2; y += SY, r++) for (let x = 2 + ((r & 1) ? SX >> 1 : 0) + (sd % 5); x < w - 2; x += SX) {
      if (h2(x, y, sd) > (o.seeds ?? 0.85)) continue;
      seedAt(p, x, y);
    }
  };
}
// white wool hanging in locks: wavy partings, a lit strand beside each, darker tips (beard, brows, chops)
function locks(o = {}) {
  const LW = o.lock ?? 3, cols = o.cols || [C.b0, C.b0, C.b1, C.b1, C.b2];
  return (p, w, h, face, cube) => {
    const up = face === 'up', dn = face === 'down';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, up ? cols[0] : dn ? C.b3 : ramp(cols, (o.t0 ?? 0) + (o.t1 ?? 0.9) * T01(y, h), x, y));
    if (up || dn) {
      for (let y = 1; y < h; y += 3) for (let x = (y % 2) * 2; x < w; x += 4) { p.px(x, y, dn ? C.b4 : C.b2); if (!dn) p.px(x + 1, y - 1, C.b0); }
      return;
    }
    const sd = Math.abs(Math.round(cube.o[0] * 5 + cube.o[2] * 3));
    for (let x0 = 1 + (sd % LW); x0 < w; x0 += LW) {
      const ph = h2(x0, 7, sd) * 6;
      for (let y = 1; y < h; y++) {
        if (h2(x0, (y + sd) >> 2, sd) < 0.2) continue;
        const X = x0 + Math.round(Math.sin(y * 0.55 + ph) * 0.7), t = (o.t0 ?? 0) + (o.t1 ?? 0.9) * T01(y, h);
        p.px(X, y, ramp([C.b2, C.b2, C.b3, C.b3], t, X, y));
        p.px(X - 1, y, ramp([C.b0, C.b0, C.b1, C.b2], t, X - 1, y));
      }
    }
    if (o.tips !== false) for (let x = 0; x < w; x++) { const k = (x + sd) % LW; if (k === 0) p.px(x, h - 1, C.b4); else if (k === 1) { p.px(x, h - 1, C.b3); p.px(x, h - 2, C.b2); } }
  };
}
// grizzled old skin: a top-lit grey-cream ramp with short pale and dark hair strokes on a loose grid
function skin(o = {}) {
  const cols = o.cols || [C.s0, C.s1, C.s1, C.s2];
  return (p, w, h, face, cube) => {
    const up = face === 'up', dn = face === 'down';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, up ? cols[0] : dn ? C.s3 : ramp(cols, T01(y, h) * (o.span ?? 1), x, y));
    const sd = Math.abs(Math.round(cube.o[0] * 3 + cube.o[2] * 7 + cube.o[1]));
    for (let y = 1; y < h - 1; y += 3) for (let x = ((y / 3) & 1) * 2; x < w; x += 4) {
      const k = h2(x, y, sd + face.length); if (k < 0.4) continue;
      const c = k > 0.72 ? '#fbf7f0' : shift(ramp(cols, T01(y, h), x, y), -0.9);
      p.px(x, y, c); p.px(x + (k > 0.86 ? -1 : 1), y + 1, c);
    }
    if (!up && !dn && o.rim !== false) for (let x = 0; x < w; x++) p.px(x, 0, shift(cols[0], 0.3));
  };
}
const skinP = skin(), skinDark = skin({ cols: [C.s1, C.s2, C.s2, C.s3] });

// the face: heavy brow hollows, bags under the eyes, crow's feet, a stern frown crease
const EYE_Y = [20.0, 22.4], EYE_X = [0.75, 4.05];   // |x| range of each eye on the skull front
function faceFront(p, w, h, face, cube) {
  skinP(p, w, h, face, cube);
  if (face !== 'south') return;
  const X = (mx) => Math.round((mx - cube.o[0]) * 3), Y = (my) => Math.round((cube.o[1] + cube.s[1] - my) * 3);
  for (const s of [-1, 1]) {
    const xa = X(s < 0 ? -EYE_X[1] : EYE_X[0]), xb = X(s < 0 ? -EYE_X[0] : EYE_X[1]) - 1, ya = Y(EYE_Y[1]), yb = Y(EYE_Y[0]) - 1;
    for (let y = ya - 2; y <= yb + 1; y++) for (let x = xa - 1; x <= xb + 1; x++) p.px(x, y, y < ya ? C.s3 : C.s2);
    // bags: two soft lines under the eye, the lower one shorter
    for (let x = xa; x <= xb; x++) { const u = (x - xa) / Math.max(1, xb - xa); p.px(x, yb + 2 + Math.round(Math.sin(u * Math.PI) * 0.6), C.s3); if (u > 0.2 && u < 0.8) p.px(x, yb + 4, shift(C.s2, -0.4)); }
    // crow's feet at the outer corner
    const ox = s < 0 ? xa - 2 : xb + 2, dx = s < 0 ? -1 : 1;
    p.px(ox, ya + 2, C.s3); p.px(ox + dx, ya + 1, C.s3); p.px(ox, yb, C.s3); p.px(ox + dx, yb + 1, C.s3); p.px(ox + dx, Math.round((ya + yb) / 2), C.s3);
  }
  // frown creases between the brows
  const cx = Math.round(w / 2) - 1;
  for (let y = 5; y < 12; y++) { p.px(cx - 1, y, C.s3); p.px(cx + 2, y + 1, C.s3); p.px(cx, y, C.s1); }
}
// the long roman-nosed muzzle in two steps. back: the wrinkled bridge with an old stitched scar; front: the snout,
// lip line turned down at the corner, the fold from nostril to mouth
function muzzleP(part) {
  return (p, w, h, face, cube) => {
    if (face === 'down') { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (y % 3 === 1) ? C.m0 : C.m1); return; }
    skinP(p, w, h, face, cube);
    const c = w / 2 - 0.5;
    if (face === 'up') {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.abs(x - c) < 1.4) p.px(x, y, Math.abs(x - c) < 0.6 ? '#f4ecdf' : C.s0);
      if (part === 'back') {
        for (const y of [1, 4]) for (let x = 1; x < w - 1; x++) p.px(x, y + Math.round(Math.abs(x - c) * 0.3), C.s3);
        for (let k = 0; k < 6; k++) { const x = 3 + k, y = 6 + (k >> 1); p.px(x, y, '#e6aaa8'); if (k % 2 === 0) { p.px(x, y - 1, C.s4); p.px(x, y + 1, C.s4); } }
      } else for (let y = h - 2; y < h; y++) for (let x = 1; x < w - 1; x++) p.px(x, y, y === h - 1 ? C.n1 : C.n0);
      return;
    }
    if (face === 'south') {
      if (part === 'back') { for (let x = 0; x < w; x++) p.px(x, h - 1, C.s3); return; }   // the step down to the snout
      for (let x = 0; x < w; x++) { const dn = x < 2 || x > w - 3 ? 1 : 0; p.px(x, h - 2 + dn, C.n3); p.px(x, h - 3 + dn, C.s2); }
      return;
    }
    if (face === 'east' || face === 'west') {
      const F = (d) => (face === 'west' ? w - 1 - d : d);   // d = distance back from the front of this box
      for (let d = 0; d < w; d++) { const y = h - 2 + (part === 'back' && d > w - 4 ? 1 : 0); p.px(F(d), y, C.n3); p.px(F(d), y - 1, C.s2); }
      if (part === 'front') {
        for (let d = 1; d < w; d++) p.px(F(d), Math.min(h - 3, Math.round(2 + d * 0.8)), C.s3);   // the fold from nostril to mouth
        for (let y = 1; y < h - 3; y++) { p.px(F(0), y, C.n1); p.px(F(1), y, C.n0); }
      } else for (const y of [3, 6]) for (let d = 2; d < w - 2; d++) if ((d + y) % 3) p.px(F(d), y, C.s3);
    }
  };
}
// broad weathered nose leather: two slanted nostrils, a philtrum groove, dry cracks
function noseP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'down' ? C.s3 : face === 'up' ? C.s1 : ramp([C.s1, C.s1, C.s2], T01(y, h), x, y));
  if (face !== 'south') return;
  const cx = w / 2 - 0.5, lh = Math.round(h * 0.62);
  for (let y = 0; y < lh; y++) { const half = (w / 2 - 0.5) * (1 - 0.35 * (y / lh) ** 2); for (let x = 0; x < w; x++) if (Math.abs(x - cx) <= half) p.px(x, y, y === 0 ? C.n0 : Math.abs(x - cx) > half - 1 ? C.n2 : C.n1); }
  for (const s of [-1, 1]) { const x0 = Math.round(cx + s * 2.2); p.px(x0, 1, C.n3); p.px(x0 + s, 2, C.n3); p.px(x0, 2, C.n3); p.px(x0 - s, 1, C.n0); }
  for (let y = 3; y < h; y++) p.px(Math.round(cx), y, y < lh ? C.n2 : C.s4);
}
// lower jaw: lip line on top, the mouth floor (tongue) on the up face
function jawP(p, w, h, face, cube) {
  if (face === 'up') {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, x === 0 || x === w - 1 ? C.m1 : C.m0);
    for (let y = 2; y < h - 2; y++) for (let x = 3; x < w - 3; x++) p.px(x, y, y === 2 || x === 3 ? '#f08aa0' : C.tongue);
    return;
  }
  skinDark(p, w, h, face, cube);
  if (face !== 'down') for (let x = 0; x < w; x++) p.px(x, 0, C.n2);
}
// lower teeth: four worn pegs and a gap where one was lost long ago
function teethP(p, w, h) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x % 3 === 2) ? '#b8a888' : y === 0 ? '#fff8e4' : C.tooth);
  for (let y = 0; y < h; y++) { p.px(Math.round(w * 0.62), y, C.m2); p.px(Math.round(w * 0.62) + 1, y, C.m2); }
}
const mouthP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? C.m1 : C.m2); };

// horn segment i of n: growth ridges across the horn, dirtier near the skull, a worn pale tip.
// faces: 'down' = outer curve, 'up' = inner curve, 'east' = outer side (the right horn is mirrored), 'west' = inner side
const HR = ['#fbe9c2', '#ebcd98', '#d0a76c', '#a2784a', '#704e34'];
function hornSeg(i, n, o = {}) {
  const u = i / Math.max(1, n - 1), dirt = u < 0.25 ? 1 : 0;
  return (p, w, h, face) => {
    const b0 = (face === 'down' ? 1 : face === 'east' ? 1 : face === 'up' ? 2 : face === 'west' ? 2 : 1) + dirt;
    const alongY = face === 'up' || face === 'down', L = alongY ? h : w, A = alongY ? w : h;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (face === 'north' || face === 'south') { const e = Math.min(x, y, w - 1 - x, h - 1 - y); p.px(x, y, e === 0 ? HR[3] : e % 2 ? HR[2] : HR[1]); continue; }
      const a0 = alongY ? y : x, a = face === 'down' || face === 'east' ? L - 1 - a0 : a0, c = alongY ? x : y, cc = c / Math.max(1, A - 1);
      // growth ridges every 3 texels straight across the horn: a lit lip, the ring itself, a crease
      const ring = Math.floor((a + i * 3) / 3), r = (a + i * 3) % 3, deep = h2(ring, i, 5) > 0.62 ? 1 : 0;
      let k = b0 + (r === 0 ? -1 : r === 2 ? 1 + deep : 0);
      if ((face === 'down' || face === 'east') && cc > 0.75) k -= 1;                  // the lit outer edge
      if ((face === 'up' || face === 'west') && cc < 0.25) k += 1;                    // shadow toward the skull
      p.px(x, y, HR[Math.max(0, Math.min(4, k))]);
    }
    // a chip knocked out of the outer edge, and a long weathering crack
    if (o.chip && (face === 'down' || face === 'east')) {
      const a0 = Math.floor(L * 0.35);
      for (let a = a0; a < a0 + 3; a++) for (let c = A - 3; c < A; c++) { const X = alongY ? c : a, Y = alongY ? a : c; p.px(X, Y, c === A - 3 || a === a0 ? HR[4] : '#fff8e8'); }
    }
    if (o.crack && face === 'down') for (let a = 1; a < L - 1; a++) { const c = Math.round(A * 0.3 + Math.sin(a * 0.9) * 0.6); if (a % 4 !== 3) p.px(alongY ? c : a, alongY ? a : c, HR[4]); }
  };
}
// the snapped-off tip of the right horn: a rough fracture across the end
function hornBreak(p, w, h, face) {
  hornSeg(10, 11)(p, w, h, face);
  if (face !== 'south') return;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const e = Math.min(x, y, w - 1 - x, h - 1 - y); p.px(x, y, e === 0 ? C.h4 : (x + y) % 3 === 0 ? C.h2 : C.h1); }
  p.px(1, 1, C.h5); p.px(2, 2, C.h5); p.px(w - 2, h - 2, C.h5);
}

// ears: long flaps, pink-grey inside with a darker crease, grizzled outside, a rounded tip (texture x = w - 1);
// the left one has a V bitten out of its tip from some long-ago scrap
function earP(notch) {
  return (p, w, h, face, cube) => {
    skinP(p, w, h, face, cube);
    const tipC = (x, y) => x >= w - 2 && (y === 0 || y === h - 1) && !(x === w - 2 && h > 3 && y === 0 && false);
    if (face === 'south') {
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const v = Math.abs(y - (h - 1) / 2) / ((h - 1) / 2); p.px(x, y, v < 0.25 ? '#a07478' : v < 0.7 ? '#d8aeac' : '#c49c9a'); }
    }
    if (face === 'south' || face === 'north') for (let y = 0; y < h; y++) for (let x = w - 2; x < w; x++) if (tipC(x, y)) p.px(x, y, C.s4);
    if (notch && (face === 'south' || face === 'north' || face === 'up' || face === 'down')) {
      const mid = Math.floor(h / 2), tx = face === 'north' ? 0 : w - 1, dx = face === 'north' ? 1 : -1;
      if (face === 'up' || face === 'down') { p.px(tx, 1, C.ink); p.px(tx + dx, 1, C.ink); }
      else { p.px(tx, mid, C.ink); p.px(tx, mid - 1, C.ink); p.px(tx + dx, mid, C.ink); p.px(tx + dx * 2, mid, C.s4); }
    }
  };
}
// hooves: dark, a lit rim, the cloven split down the front and back
function hoofP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.k0 : face === 'down' ? C.k2 : ramp([C.k0, C.k1, C.k1, C.k2], T01(y, h), x, y));
  if (face === 'south' || face === 'north') for (let y = 0; y < h; y++) p.px(Math.floor(w / 2), y, C.k2);
  if (face !== 'up' && face !== 'down') { for (let x = 0; x < w; x++) p.px(x, 0, '#8a7a88'); p.px(1, 1, '#7a6c7a'); }
}
// country red bandana: a deep red band with a white paisley-and-dot print and pale border lines
const BAND = ['#ee4a48', '#cc2230', '#9a1424', '#5e0a18'];
function bandanaP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? BAND[0] : face === 'down' ? BAND[3] : ramp(BAND.slice(0, 3), T01(y, h), x, y));
  if (face === 'up' || face === 'down') return;
  for (let x = 0; x < w; x++) { p.px(x, 0, '#f08888'); if (h > 3) p.px(x, h - 1, BAND[3]); }
  for (let y = 1; y < h - 1; y++) for (let x = (y % 2) * 3 + 1; x < w; x += 6) {
    if (((x / 6) | 0) % 2 === y % 2) { p.px(x, y, '#fff4ea'); p.px(x + 1, y, '#fff4ea'); p.px(x + 1, y - 1 < 1 ? y : y - 1, '#f6d0c8'); }   // paisley tear
    else p.px(x, y, '#ffe8e0');                                                                                                        // dot
  }
}
function knotP(p, w, h, face) { bandanaP(p, w, h, face); for (let y = 0; y < h; y++) p.px(Math.floor(w / 2), y, BAND[3]); }
// the knot's two loose ends: cloth corners that taper to a point, printed like the band
function tieTailP(p, w, h) {
  for (let y = 0; y < h; y++) {
    const v = T01(y, h), half = (1 - v * 0.75) * (w / 2);
    for (let x = 0; x < w; x++) {
      const dx = x - (w / 2 - 0.5); if (Math.abs(dx) > half) continue;
      let c = Math.abs(dx) > half - 1 ? BAND[2] : dx < 0 ? BAND[0] : BAND[1];
      if ((x + y * 2) % 5 === 0 && Math.abs(dx) < half - 1) c = '#fff4ea';
      p.px(x, y, c);
    }
  }
}
// braided white wool: a herringbone of plaits that alternate left and right, creases between them
function plaitP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.b0 : face === 'down' ? C.b3 : C.b1);
  if (face === 'up' || face === 'down') return;
  for (let y = 0; y < h; y++) {
    const r = Math.floor(y / 3), k = y % 3, left = r % 2 === 0;
    for (let x = 0; x < w; x++) {
      const u = w > 1 ? x / (w - 1) : 0.5, s2 = left ? u : 1 - u;
      if (k === 2 && s2 > 0.2) p.px(x, y, C.b3);                   // the crease under each plait
      else if (k === 0 && s2 < 0.7) p.px(x, y, C.b0);              // its lit top edge
      else if (k === 1 && s2 > 0.75) p.px(x, y, C.b2);
    }
  }
}
const tasselP = locks({ lock: 2, t0: 0.1, t1: 0.7 });
// the road-worn little guitar: spruce top with a sound hole, a pick-worn hole beside it,
// scratched-in signatures, a dark bridge; rosewood sides and back, a neck with frets and strings
const WOOD = { top: '#eab466', topHi: '#f8d290', topLo: '#c88a44', grain: '#d49a52', bind: '#4a2a18', side: '#8a4c28', sideLo: '#5e3018', neck: '#5a3420', fret: '#c8c0a8', string: '#f4f0e0', hole: '#1c1012' };
function guitarTop(hole, wear) {
  return (p, w, h, face) => {
    if (face !== 'up') {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'down' ? WOOD.sideLo : y === 0 ? WOOD.bind : ramp([WOOD.side, WOOD.side, WOOD.sideLo], T01(y, h), x, y));
      return;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const e = Math.min(x, y, w - 1 - x, h - 1 - y);
      p.px(x, y, e === 0 ? WOOD.bind : x % 3 === 1 ? WOOD.grain : x < w * 0.35 ? WOOD.topHi : WOOD.top);
    }
    const cx = w / 2 - 0.5;
    if (hole) {   // sound hole with a rosette ring, near the neck end (texture top = toward the neck)
      const cy = h * 0.42;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - cx, (y - cy) * 1.1); if (d < 2.1) p.px(x, y, WOOD.hole); else if (d < 3.0) p.px(x, y, (x + y) % 2 ? '#2e6a3a' : '#f2e2b0'); }
    }
    if (wear) {   // the famous worn-through patch below the sound hole, scuffs and scratched names
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (Math.hypot(x - 1.5, y - 1.5) < 2.1) p.px(Math.round(cx + 1 + x - 1.5), y + 1, x + y < 3 ? WOOD.topLo : WOOD.hole);
      for (let k = 0; k < 4; k++) p.px(2 + k, h - 3 - (k % 2), '#fff4dc');
      for (let k = 0; k < 3; k++) p.px(w - 4 + (k % 2), h - 5 + k, '#fff4dc');
      for (let x = Math.round(cx) - 2; x <= Math.round(cx) + 2; x++) { p.px(x, h - 4, '#3a2014'); p.px(x, h - 5, '#5a3420'); }   // the bridge
    }
  };
}
function neckP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? WOOD.neck : WOOD.sideLo);
  if (face !== 'up') return;
  for (let y = 0; y < h; y += 3) for (let x = 0; x < w; x++) p.px(x, y, WOOD.fret);
  for (let y = 0; y < h; y++) { p.px(0, y, WOOD.string); if (w > 2) p.px(w - 1, y, WOOD.string); }
}
function headstockP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? '#3e2416' : WOOD.sideLo);
  if (face === 'up' || face === 'east' || face === 'west') for (let y = 1; y < h - 1; y += 2) { p.px(0, y, '#f0e0a0'); p.px(w - 1, y, '#f0e0a0'); }
}
// the leather guitar strap: brown with pale stitching, a brass buckle
function strapP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, ramp(['#a8683a', '#8a5028', '#64381c'], face === 'up' ? 0 : T01(x, w), x, y));
  if (face === 'up' || face === 'down') return;
  if (w > 2) for (let y = 1; y < h - 1; y += 3) p.px(Math.floor(w / 2), y, '#d8b07a');
  if (h > 12) { const y0 = Math.floor(h * 0.45); for (let y = y0; y < y0 + 5; y++) for (let x = 0; x < w; x++) p.px(x, y, y === y0 || y === y0 + 4 || x === 0 || x === w - 1 ? '#ffd860' : y === y0 + 2 ? '#c89030' : '#6a4018'); }
}
const legP = skin({ cols: [C.s1, C.s2, C.s2, C.s3] });
const fetlockP = locks({ lock: 3, cols: [C.b1, C.b1, C.b2, C.b2, C.b3], t0: 0.1 });
const beardP = locks({ lock: 3 }), beardLow = locks({ lock: 3, t0: 0.3, t1: 0.7 });
function browP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.b0 : face === 'down' ? C.b3 : ramp([C.b0, C.b1, C.b2], T01(y, h), x, y));
  if (face === 'up' || face === 'down') return;
  for (let x0 = -h; x0 < w; x0 += 2) for (let k = 0; k < h; k++) { const x = x0 + k, y = k; if (x >= 0 && x < w && (x0 & 2)) p.px(x, y, y < h / 2 ? C.b1 : C.b2); }
  for (let x = 0; x < w; x++) { p.px(x, 0, C.b0); if (x % 2 === 0) p.px(x, h - 1, C.b3); }
}
const woolP = wool(), woolTop = wool({ t0: 0.0, t1: 0.3 }), woolLow = wool({ t0: 0.3, t1: 0.45 }), woolSmall = wool({ size: 9, row: 5, sx: 9, sy: 7 });

// calyx sepals: pointed leaves with a pale midrib (the glowing set is drawn brighter, for the heal).
// A sepal is two planes, a flat inner half and a drooping outer half: rows map to v0..v1 of the leaf.
function sepal(glow, v0 = 0, v1 = 1) {
  const lit = glow ? '#f4ffd0' : C.g1, mid = glow ? '#b8f07a' : C.g2, dark = glow ? '#6ad050' : C.g3, rib = glow ? '#ffffff' : C.g0;
  return (p, w, h) => {
    for (let y = 0; y < h; y++) {
      const v = v0 + (v1 - v0) * T01(y, h), half = (v < 0.3 ? 0.6 + 0.4 * (v / 0.3) : Math.pow(Math.max(0, 1 - (v - 0.3) / 0.7), 0.7)) * (w / 2);
      for (let x = 0; x < w; x++) {
        const dx = x - (w / 2 - 0.5); if (Math.abs(dx) > half + 0.15) continue;
        let c = dx < 0 ? lit : mid;
        if (Math.abs(dx) > half - 1) c = glow ? mid : C.g4;
        if (Math.abs(dx) < 0.6 && v < 0.88) c = rib;
        if (v > 0.93) c = dark;
        p.px(x, y, c);
      }
    }
  };
}
const stemP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' || face === 'east' ? C.st0 : face === 'down' || face === 'west' ? C.st2 : ramp([C.st0, C.st1, C.st2], T01(x, w), x, y)); };
const calyxCore = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? ((x + y) % 3 ? C.g2 : C.g3) : face === 'down' ? C.g4 : y === 0 ? C.g1 : C.g3); };
// strawberry blossom: five round white petals around a golden heart
function blossomP(p, w, h) {
  const c = (w - 1) / 2;
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2, px = c + Math.cos(a) * w * 0.27, py = c + Math.sin(a) * h * 0.27;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - px, y - py); if (d > w * 0.24) continue;
      p.px(x, y, d > w * 0.17 ? C.p2 : (x - px) + (y - py) < -0.5 ? C.p0 : C.p1);
    }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - c, y - c); if (d < w * 0.16) p.px(x, y, d < w * 0.09 ? '#fff2a0' : C.core); }
}
const coreP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? ((x + y) % 2 ? '#fff2a0' : C.core) : '#d8a020'); };
// healing vines: a twisting green runner, lighter along the top, with tiny thorn-buds
const vineP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' || face === 'east' ? (x + y) % 5 === 0 ? C.g0 : C.g1 : face === 'down' ? C.g3 : (x + y) % 4 === 0 ? C.g3 : (x === 0 ? C.g1 : C.g2)); };
function leafP(p, w, h) {   // a serrated strawberry leaflet
  for (let y = 0; y < h; y++) {
    const v = T01(y, h), half = Math.sin(Math.min(1, v * 1.15) * Math.PI) * (w / 2) + (y % 3 === 0 && v > 0.2 ? 0.6 : 0);
    for (let x = 0; x < w; x++) {
      const dx = x - (w / 2 - 0.5); if (Math.abs(dx) > half) continue;
      p.px(x, y, Math.abs(dx) < 0.6 ? C.g3 : Math.abs(dx) > half - 1 ? C.g3 : dx < 0 ? C.g1 : C.g2);
    }
  }
}
function berryP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.g2 : ramp([C.w0, C.w1, C.w2, C.w3], T01(y, h), x, y));
  if (face !== 'up' && face !== 'down') for (let y = 1; y < h - 1; y += 2) for (let x = (y >> 1) % 2; x < w; x += 2) p.px(x, y, C.seed);
}

// ---------------------------------------------------------------- eyes
// heavy-lidded, sheep-pupilled (a horizontal bar), amber. 10 × 7 texels; outer corner at x = 0.
const EW = 10, EH = 7;
function eyeShape(p, o) {
  for (let x = 0; x < EW; x++) {
    const u = x / (EW - 1), arc = Math.sin(u * Math.PI), mid = lerp(o.c0 ?? 3.6, o.c1 ?? 3.0, u);
    const top = mid - arc * (o.up ?? 2.6), bot = mid + arc * (o.dn ?? 2.4), lid = top + (bot - top) * (o.lid ?? 0.45) + (o.droop ?? 0.8) * (1 - u) * arc;
    for (let y = 0; y < EH; y++) {
      if (y < top - 0.5 || y > bot + 0.5) continue;
      let c;
      if (y < lid - 0.5) c = y < top + 0.5 ? C.s1 : C.s2;                 // the heavy upper lid
      else if (y < lid + 0.5) c = C.ink;                                   // lid line
      else if (y > bot - 0.5) c = C.s4;                                    // lower lid
      else {
        const v = (y - lid) / Math.max(1, bot - lid);
        c = v < 0.35 ? C.i2 : v < 0.7 ? C.i1 : C.i0;
        const px = (o.look ?? 0) + EW / 2 - 0.5;
        if (Math.abs(x - px) < (o.pw ?? 2.2) && y < lid + 1.6 + (o.ph ?? 0)) c = C.pupil;
      }
      p.px(x, y, c);
    }
  }
  if (o.glint !== false) p.px(Math.round(EW / 2 + (o.look ?? 0)) - 3, Math.round(lerp(o.c0 ?? 3.6, o.c1 ?? 3.0, 0.3) + 0.3), '#fff4e0');
}
const lineEye = (pts, c = C.ink, thick = 1) => (p) => { for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2; for (let k = 0; k <= n; k++) { const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n); p.px(x, y, c); if (thick > 1) p.px(x, y + 1, c); } } };
const EYES = {
  calm: (p) => eyeShape(p, {}),
  open: (p) => eyeShape(p, { lid: 0.22, droop: 0.3, up: 2.9 }),
  glare: (p) => eyeShape(p, { lid: 0.55, droop: -0.9, c0: 3.4, c1: 3.6, dn: 1.8, pw: 2.6 }),
  closed: (p) => { lineEye([[0, 4], [3, 4.6], [6, 4.4], [9, 3.4]], C.ink, 2)(p); lineEye([[1, 2.6], [5, 2.6], [8, 2.2]], C.s3)(p); },
  sleep: (p) => { lineEye([[0, 3.6], [3, 4.8], [6, 4.8], [9, 3.8]], C.ink, 2)(p); lineEye([[1, 2.4], [5, 2.6], [8, 2.2]], C.s3)(p); },
  happy: (p) => { lineEye([[0, 4.8], [2, 3.4], [5, 2.8], [8, 3.4], [9, 4.4]], C.ink, 2)(p); lineEye([[2, 6], [6, 6.2]], C.s3)(p); },
  squeeze: (p) => { lineEye([[0, 1.5], [5, 3.6], [9, 3.2]], C.ink, 2)(p); lineEye([[0, 5.8], [5, 4.4], [9, 4.6]], C.ink)(p); },
  swirl: (p) => { eyeShape(p, { lid: 0.15, droop: 0, glint: false }); for (let x = 1; x < EW - 1; x++) for (let y = 1; y < EH; y++) { const r = Math.hypot(x - 4.5, (y - 3.6) * 1.4); if (r < 3.6) p.px(x, y, '#fff2dc'); } for (let a = 0; a < 15; a += 0.2) { const r = a * 0.24, x = Math.round(4.5 + Math.cos(a) * r), y = Math.round(3.6 + Math.sin(a) * r * 0.7); if (r < 3.4) p.px(x, y, C.ink); } },
};

// ---------------------------------------------------------------- the model
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const MZ = { pivot: [0, 19.8, 11.0], rot: [18, 0, 0] };              // the long muzzle's nose-down tilt (the jaw shares it)
const mirrorX = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]] } : {}), ...(c.rot ? { rot: [c.rot[0], -c.rot[1], -c.rot[2]] } : {}), mirror: !c.mirror });
const both = (...cs) => cs.flatMap((c) => [c, mirrorX(c)]);
const add3 = (a, d) => [a[0] + d[0], a[1] + d[1], a[2] + d[2]];
// a rounded lump: three boxes, each full-size along one axis and inset by b along the other two
const lump = (c, s, b, tex) => [
  P([c[0] - s[0] / 2, c[1] - s[1] / 2 + b, c[2] - s[2] / 2 + b], [s[0], s[1] - 2 * b, s[2] - 2 * b], tex),
  P([c[0] - s[0] / 2 + b, c[1] - s[1] / 2, c[2] - s[2] / 2 + b], [s[0] - 2 * b, s[1], s[2] - 2 * b], tex),
  P([c[0] - s[0] / 2 + b, c[1] - s[1] / 2 + b, c[2] - s[2] / 2], [s[0] - 2 * b, s[1] - 2 * b, s[2]], tex),
];
// a box placed in a rotated local frame (origin at pivot `at`): lc = local centre
const inFrame = (at, rot, lc, s, tex, x = {}) => P([at[0] + lc[0] - s[0] / 2, at[1] + lc[1] - s[1] / 2, at[2] + lc[2] - s[2] / 2], s, tex, { pivot: at, rot, ...x });
// the head is authored around its own origin (skull front at z = 12.6) and carried forward of the shoulders by HEAD
const HEAD = [0, 1.4, 4.4];
const moved = (b) => ({ ...b, pivot: add3(b.pivot, HEAD), cubes: b.cubes.map((c) => ({ ...c, o: add3(c.o, HEAD), ...(c.pivot ? { pivot: add3(c.pivot, HEAD) } : {}) })) });
// the horn coil: grows out of the poll, sweeps back, down behind the ear and forward past the cheek
function hornPts(s) {
  const pts = [[s * 2.4, 22.8, 9.0]], N = 10, cy = 20.2, cz = 6.8;                 // the root, buried in the skull
  for (let i = 0; i <= N; i++) {
    const u = i / N, th = (72 + 296 * u) * D2R, r = 5.4 - 2.1 * u;
    const lat = 3.5 + 4.1 * (1 - (1 - u) ** 3) + 0.8 * Math.max(0, (u - 0.8) / 0.2) ** 2;
    pts.push([s * lat, cy + r * Math.sin(th), cz + r * Math.cos(th)]);
  }
  return pts;
}
const hornSize = (i, n) => { const u = Math.max(0, i - 1) / (n - 2); return [4.3 - 2.9 * u, 3.9 - 2.7 * u]; };
const hornL = chain(hornPts(1), hornSize, (i, n) => hornSeg(i, n, { chip: i === 4, crack: i === 6 }));
const hornR = chain(hornPts(-1), hornSize, (i, n) => (i === n - 1 ? hornBreak : hornSeg(i, n, { crack: i === 3 })), { extra: () => ({ mirror: true }) });
hornR[hornR.length - 1].s[2] *= 0.6;   // the snapped-off tip (the box keeps its base end)
// the calyx: five sepals, each a flat inner half and a drooping outer half, and the curly stem
const CX = [0, 28.05, 10.6];
function sepals(glow) {
  const out = [], x = { id: glow ? 'cx-glow' : 'cx', hide: !!glow, ...(glow ? { glow: true } : {}) };
  for (const [phi, li, lo, dr] of [[0, 3.0, 3.0, 62], [55, 2.9, 2.8, 64], [-55, 2.9, 2.8, 64], [125, 2.6, 2.4, 30], [-125, 2.6, 2.4, 30], [180, 2.8, 2.6, 34]]) {
    const f = phi * D2R, a = li / (li + lo), tip = [CX[0] + Math.sin(f) * li * Math.cos(5 * D2R), CX[1] - li * Math.sin(5 * D2R), CX[2] + Math.cos(f) * li * Math.cos(5 * D2R)];
    out.push(leafAt(CX, li, 3.2, phi, 5, sepal(glow, 0, a), x), leafAt(tip, lo, 3.2, phi, dr, sepal(glow, a, 1), x));
  }
  return out;
}
const stemPts = [[0, 28.1, 10.6], [0.1, 29.7, 10.5], [0.2, 31.0, 10.0], [0.3, 31.7, 9.0], [0.4, 31.5, 7.9], [0.5, 30.7, 7.4], [0.5, 30.0, 7.9], [0.5, 30.2, 8.7]];
const stem = chain(stemPts, (i, n) => [1.2 - 0.5 * i / n, 1.2 - 0.5 * i / n], () => stemP, { over: 0.5 });
// healing vines (hidden until the special): spiralling runners with leaflets, two carrying a berry
function vine(base, turn, hgt, berry) {
  const pts = [];
  for (let k = 0; k <= 7; k++) { const a = turn + k * 0.95, r = 1.7 - k * 0.14; pts.push([base[0] + Math.cos(a) * r, base[1] + k * hgt / 7, base[2] + Math.sin(a) * r]); }
  const cs = chain(pts, (i, n) => [1.4 - 0.6 * i / n, 1.4 - 0.6 * i / n], () => vineP, { over: 0.5, extra: () => ({ id: 'vine', hide: true }) });
  [2, 4, 6].forEach((k, j) => cs.push(leafAt(pts[k], 3.6, 2.6, (turn / D2R) + 70 + j * 140, -55, leafP, { id: 'vine', hide: true })));
  const t = pts[7];
  if (berry) cs.push(P([t[0] - 0.9, t[1] - 2.2, t[2] - 0.9], [1.8, 2.2, 1.8], berryP, { id: 'vine', hide: true }), leafAt([t[0], t[1], t[2]], 1.4, 1.6, 0, -10, sepal(false), { id: 'vine', hide: true }));
  else cs.push(P([t[0] - 1.6, t[1] + 0.3, t[2]], [3.2, 3.2, 0], blossomP, { plane: 'z', id: 'vine', hide: true }), P([t[0] - 0.45, t[1] + 1.45, t[2] - 0.3], [0.9, 0.9, 0.9], coreP, { id: 'vine', hide: true, outline: false }));
  return cs;
}
const bloom = (at, plane) => [
  P(plane === 'y' ? [at[0] - 1.5, at[1], at[2] - 1.5] : plane === 'x' ? [at[0], at[1] - 1.5, at[2] - 1.5] : [at[0] - 1.5, at[1] - 1.5, at[2]], plane === 'y' ? [3, 0, 3] : plane === 'x' ? [0, 3, 3] : [3, 3, 0], blossomP, { plane, id: 'bloom', hide: true }),
  P([at[0] - 0.45 + (plane === 'x' ? Math.sign(at[0]) * 0.3 : 0), at[1] - 0.45 + (plane === 'y' ? 0.3 : 0), at[2] - 0.45 + (plane === 'z' ? 0.3 : 0)], [0.9, 0.9, 0.9], coreP, { id: 'bloom', hide: true, outline: false }),
];
const eyeStates = (side) => Object.entries(EYES).map(([k, fn]) => P(side < 0 ? [-EYE_X[1], EYE_Y[0], 12.66] : [EYE_X[0], EYE_Y[0], 12.66], [EYE_X[1] - EYE_X[0], EYE_Y[1] - EYE_Y[0], 0], fn, { plane: 'z', mirror: side > 0, id: (side < 0 ? 'eyeR-' : 'eyeL-') + k, hide: k !== 'calm' }));
const BLOOMS = [['bloomA', [-1.0, 23.05, -0.2], 'y'], ['bloomB', [3.0, 20.65, -7.6], 'y'], ['bloomC', [-10.45, 13.0, 1.2], 'x'], ['bloomD', [10.45, 11.4, -0.6], 'x'], ['bloomE', [-9.05, 13.4, -9.0], 'x']];
const VINES = [['vineFR', [-11.5, 0, 6], 0.3, 14, true], ['vineFL', [11.5, 0, 5.5], 2.2, 12, false], ['vineBR', [-11.5, 0, -9.5], 4.0, 11, false], ['vineBL', [11.5, 0, -9], 5.4, 13.5, true]];
// long braids of white wool hanging under the horns, tied off in red, three links each on springs
const braid = (s) => [
  { name: 'braid' + (s < 0 ? 'R' : 'L') + '1', parent: 'head', pivot: [s * 5.6, 16.8, 9.8], cubes: [P([s * 5.6 - 1.1, 15.6, 8.6], [2.2, 2.6, 2.4], beardP), P([s * 5.6 - 0.75, 13.6, 9.05], [1.5, 3.4, 1.5], plaitP, { mirror: s > 0 })] },
  { name: 'braid' + (s < 0 ? 'R' : 'L') + '2', parent: 'braid' + (s < 0 ? 'R' : 'L') + '1', pivot: [s * 5.6, 13.8, 9.8], cubes: [P([s * 5.6 - 0.7, 10.8, 9.1], [1.4, 3.3, 1.4], plaitP, { mirror: s > 0 })] },
  { name: 'braid' + (s < 0 ? 'R' : 'L') + '3', parent: 'braid' + (s < 0 ? 'R' : 'L') + '2', pivot: [s * 5.6, 11.0, 9.8], cubes: [
    P([s * 5.6 - 0.65, 8.7, 9.15], [1.3, 2.5, 1.3], plaitP, { mirror: s > 0 }),
    P([s * 5.6 - 0.8, 8.1, 9.0], [1.6, 0.7, 1.6], bandanaP),
    P([s * 5.6 - 0.95, 6.5, 8.85], [1.9, 1.7, 1.9], tasselP),
  ] },
];
// the little road-worn guitar slung across its back (local frame: soundboard up, neck toward the tail)
const GT = [1.4, 21.4, -6.6], GR = [9, -16, -22];
const guitar = [
  inFrame(GT, GR, [0, 0.6, 1.9], [5.0, 1.2, 3.8], guitarTop(false, true)),
  inFrame(GT, GR, [0, 0.6, -0.4], [3.6, 1.2, 1.2], guitarTop(false, false)),
  inFrame(GT, GR, [0, 0.6, -2.1], [4.2, 1.2, 2.6], guitarTop(true, false)),
  inFrame(GT, GR, [0, 1.0, -6.4], [1.0, 0.6, 6.0], neckP),
  inFrame(GT, GR, [0, 0.95, -10.5], [1.6, 0.5, 2.4], headstockP),
];
const strap = (s) => [
  P([s > 0 ? 4.4 : -8.0, 20.35, -4.9], [3.6, 0.4, 1.0], strapP),
  ...chain([[s * 7.9, 20.55, -4.4], [s * 9.85, 18.6, -4.4]], () => [1.0, 0.4], () => strapP, { over: 0.3, side: [0, 0, 1] }),
  P([s > 0 ? 9.6 : -10.0, 8.6, -4.9], [0.4, 10.2, 1.0], strapP),
];

// head-group bones, authored in head space and moved by HEAD
const HEAD_BONES = [
  { name: 'head', parent: 'neck', pivot: [0, 18.5, 8], cubes: [
    P([-4.4, 16.6, 6.0], [8.8, 8.8, 6.6], skinP, { faces: { south: faceFront } }),
    P([-4.6, 15.4, 7.4], [9.2, 3.8, 4.4], skinP),                                // strong cheekbones and jaw muscles
    P([-2.4, 16.0, 11.0], [4.8, 3.8, 3.8], muzzleP('back'), MZ),
    P([-2.0, 16.0, 14.4], [4.0, 3.5, 3.4], muzzleP('front'), MZ),
    P([-1.75, 16.3, 17.6], [3.5, 2.9, 0.7], noseP, MZ),
    P([-1.7, 15.0, 11.2], [3.4, 1.1, 5.2], mouthP, { ...MZ, outline: false }),
    // the red topknot under the calyx, poking up out of the bandana
    P([-2.5, 25.0, 8.6], [5.0, 2.6, 4.2], woolSmall),
    P([-1.9, 27.4, 9.3], [3.8, 0.5, 2.8], woolSmall, { outline: false }),
    // the bandana tied across the brow, knotted at the back of the head
    P([-4.7, 23.7, 12.55], [9.4, 1.6, 0.55], bandanaP),
    ...both(P([-4.95, 23.7, 9.4], [0.55, 1.6, 3.7], bandanaP)),
    P([-2.6, 23.7, 5.45], [5.2, 1.6, 0.55], bandanaP),
    P([-1.0, 23.4, 4.6], [2.0, 2.0, 1.0], knotP),
    ...eyeStates(-1), ...eyeStates(1),
  ] },
  { name: 'hornR', parent: 'head', pivot: [-3.5, 24, 7.5], cubes: hornR },
  { name: 'hornL', parent: 'head', pivot: [3.5, 24, 7.5], cubes: hornL },
  { name: 'earR', parent: 'head', pivot: [-4.2, 20.6, 6.9], rot: [0, -8, 14], cubes: [P([-9.6, 19.4, 6.5], [5.4, 2.5, 0.8], earP(false), { mirror: true })] },
  { name: 'earL', parent: 'head', pivot: [4.2, 20.6, 6.9], rot: [0, 8, -14], cubes: [P([4.2, 19.4, 6.5], [5.4, 2.5, 0.8], earP(true))] },
  { name: 'browR', parent: 'head', pivot: [-1.3, 23.0, 12.8], rot: [0, 0, 8], cubes: [P([-4.9, 22.0, 11.6], [3.8, 2.0, 2.4], browP), P([-6.0, 21.4, 11.8], [1.5, 1.7, 1.8], browP)] },
  { name: 'browL', parent: 'head', pivot: [1.3, 23.0, 12.8], rot: [0, 0, -8], cubes: [P([1.1, 22.0, 11.6], [3.8, 2.0, 2.4], browP, { mirror: true }), P([4.5, 21.4, 11.8], [1.5, 1.7, 1.8], browP, { mirror: true })] },
  { name: 'tieA', parent: 'head', pivot: [0.4, 24.4, 4.9], rot: [58, 28, 0], cubes: [P([0.4, 19.8, 3.6], [0, 4.6, 2.6], tieTailP, { plane: 'x' })] },
  { name: 'tieB', parent: 'head', pivot: [-0.4, 24.2, 4.9], rot: [70, -24, 0], cubes: [P([-0.4, 20.4, 3.7], [0, 3.8, 2.4], tieTailP, { plane: 'x' })] },
  ...braid(-1), ...braid(1),
  { name: 'jaw', parent: 'head', pivot: [0, 16.1, 10.0], cubes: [
    P([-1.8, 14.8, 11.2], [3.6, 1.2, 6.2], jawP, MZ),
    P([-1.3, 16.0, 16.6], [2.6, 0.5, 0.5], teethP, { ...MZ, outline: false }),
  ] },
  { name: 'beard', parent: 'jaw', pivot: [0, 13.2, 12.6], cubes: [
    P([-4.2, 12.0, 9.0], [8.4, 2.8, 3.8], beardP),
    P([-3.2, 10.0, 10.4], [6.4, 3.4, 4.8], beardP),
  ] },
  { name: 'beardTip', parent: 'beard', pivot: [0, 10.2, 12.6], cubes: [
    P([-2.2, 8.0, 10.8], [4.4, 2.4, 3.8], beardLow),
    P([-1.2, 7.0, 11.4], [2.4, 1.4, 2.6], beardLow),
  ] },
  { name: 'cap', parent: 'head', pivot: [0, 27.8, 10.6], cubes: [
    P([-1.4, 27.4, 9.2], [2.8, 0.8, 2.8], calyxCore),
    ...sepals(false), ...sepals(true),
  ] },
  { name: 'stem', parent: 'cap', pivot: [0, 28.2, 10.6], cubes: stem },
].map(moved);

export const def = {
  name: 'strawbaa', ppu: 3, scale: 0.42, outline: { color: C.ink, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    // legs hang from the root so the hooves stay planted while the trunk heaves about
    ...[['legFR', -4.7, 2.4], ['legFL', 4.7, 2.4], ['legBR', -4.9, -8.6], ['legBL', 4.9, -8.6]].map(([name, x, z]) => ({ name, parent: 'root', pivot: [x, 10.5, z], cubes: [
      P([x - 1.6, 2.0, z - 1.7], [3.2, 9.0, 3.4], legP),
      P([x - 1.9, 1.5, z - 2.0], [3.8, 1.7, 4.0], fetlockP),
      P([x - 1.8, 0, z - 1.9], [3.6, 1.8, 3.8], hoofP),
    ] })),
    { name: 'trunk', parent: 'root', pivot: [0, 9, -8.6], cubes: [] },
    { name: 'body', parent: 'trunk', pivot: [0, 11, -2.5], cubes: [
      // the berry-shaped fleece: a big rounded mass at the shoulders, a smaller one tapering to the rump
      ...lump([0, 12.8, -0.4], [19.2, 15.4, 12.4], 1.8, woolP),
      ...lump([0, 12.2, -9.2], [16.4, 13.4, 10.4], 1.8, woolP),
      // lumps that break up the silhouette: crown, back, flanks, brisket and the berry's pointed end
      P([-5.4, 19.8, -4.4], [10.8, 2.0, 7.6], woolTop),
      P([-3.8, 21.0, 0.0], [5.2, 2.0, 4.2], woolSmall), P([-5.6, 19.0, -12.0], [4.0, 1.4, 4.2], woolSmall), P([-5.0, 18.6, -7.6], [3.6, 1.6, 3.6], woolSmall),
      ...both(P([-10.4, 9.0, -2.4], [1.2, 7.0, 5.6], woolP), P([-9.0, 6.4, -9.8], [1.0, 4.6, 5.0], woolLow), P([-8.6, 10.2, -12.2], [1.0, 5.0, 4.2], woolSmall)),
      P([-5.6, 7.0, 5.6], [11.2, 9.4, 1.8], woolP),
      P([-3.0, 9.4, -15.4], [6.0, 5.0, 1.4], woolSmall),
      ...strap(1), ...strap(-1),
    ] },
    { name: 'guitar', parent: 'body', pivot: GT, cubes: guitar },
    { name: 'tail', parent: 'body', pivot: [0, 13.4, -14.4], cubes: [P([-1.5, 11.0, -16.8], [3.0, 3.4, 2.6], woolSmall), P([-0.9, 10.2, -17.2], [1.8, 1.4, 1.6], woolSmall)] },
    ...BLOOMS.map(([name, at, plane]) => ({ name, parent: 'body', pivot: at, cubes: bloom(at, plane) })),
    { name: 'neck', parent: 'trunk', pivot: [0, 16, 6], cubes: [
      P([-4.6, 13.0, 4.0], [9.2, 10.4, 8.0], woolP),
      P([-3.8, 11.0, 9.6], [7.6, 4.2, 3.4], woolLow),
    ] },
    ...HEAD_BONES,
    ...VINES.map(([name, b, turn, hgt, berry]) => ({ name, parent: 'root', pivot: b, cubes: vine(b, turn, hgt, berry) })),
  ],
};

// ---------------------------------------------------------------- particles of its own
defineFx('seed', { w: 3, h: 4, paint: (p) => { p.px(1, 0, C.seedHi); p.px(0, 1, C.seedHi); p.px(1, 1, C.seed); p.px(2, 1, C.seed); p.px(1, 2, C.seed); p.px(1, 3, C.seedLo); }, glow: true, life: [0.5, 0.8], size: [0.045, 0.03], speed: [1.2, 2.4], grav: 5, drag: 1.2, spread: 1, spin: 6 });
defineFx('blossom', { w: 7, h: 7, paint: (p, w, h) => blossomP(p, w, h), life: [1.3, 1.9], size: [0.075, 0.075], speed: [0.5, 1.3], grav: 0.4, drag: 2, spread: 1, flutter: true });
defineFx('berry', { w: 6, h: 7, paint: (p) => { for (let y = 2; y < 7; y++) { const hw = y < 5 ? 3 : y === 5 ? 2 : 1; for (let x = 3 - hw; x < 3 + hw; x++) p.px(x, y, x < 3 - hw + 1 && y < 5 ? C.w0 : (x + y) % 3 === 0 ? C.seed : C.w2); } p.px(1, 1, C.g2); p.px(2, 1, C.g1); p.px(3, 1, C.g2); p.px(4, 1, C.g2); p.px(2, 0, C.g3); }, life: [0.9, 1.3], size: [0.07, 0.07], speed: [1.2, 2.2], grav: 5, drag: 0.8, spread: 0.9, spin: 5 });
defineFx('glint', { w: 15, h: 15, paint: (p, w, h) => { const c = 7; for (let i = 0; i < w; i++) { const d = Math.abs(i - c), col = d < 2 ? '#ffffff' : d < 5 ? '#fff6c8' : '#ffd860'; if (d < 7) { p.px(i, c, col); p.px(c, i, col); } if (d < 3) { p.px(i, c - 1, '#fff6c8'); p.px(i, c + 1, '#fff6c8'); p.px(c - 1, i, '#fff6c8'); p.px(c + 1, i, '#fff6c8'); } } for (let k = -2; k <= 2; k++) { p.px(c + k, c + k, '#ffffff'); p.px(c + k, c - k, '#ffffff'); } }, glow: true, life: [0.45, 0.45], size: [0.0, 0.22], speed: [0, 0], grav: 0, pop: true, spin: 1.5 });
defineFx('mote', { w: 5, h: 5, paint: (p) => { for (let i = 0; i < 5; i++) { p.px(2, i, i === 2 ? '#ffffff' : '#c8ff9a'); p.px(i, 2, i === 2 ? '#ffffff' : '#c8ff9a'); } }, glow: true, life: [0.8, 1.3], size: [0.06, 0.02], speed: [0.4, 0.9], grav: -1.4, drag: 1, spread: 0.8, wob: 1 });

// ---------------------------------------------------------------- animation
const TAU = Math.PI * 2;
const PIV = Object.fromEntries(def.bones.map((b) => [b.name, b.pivot]));
// a point on the muzzle (head space) → model space, so effects come out of the right place
const mzPt = (p) => { const r = MZ.rot[0] * D2R, y = p[1] - MZ.pivot[1], z = p[2] - MZ.pivot[2]; return add3([p[0], MZ.pivot[1] + y * Math.cos(r) - z * Math.sin(r), MZ.pivot[2] + y * Math.sin(r) + z * Math.cos(r)], HEAD); };
const NOSE_R = mzPt([-0.8, 18.6, 18.3]), NOSE_L = mzPt([0.8, 18.6, 18.3]), MOUTH = mzPt([0, 15.8, 17.6]);
const BROW = add3([0, 24.8, 13.8], HEAD), CROWN = add3([0, 30.5, 10.6], HEAD), ZZ = add3([3, 29, 12], HEAD);
const GLINT = add3(add3(hornPts(1)[3], HEAD), [1.6, 1.0, 0]);
const GHOLE = new THREE.Vector3(0, 1.4, -2.1).applyEuler(new THREE.Euler(...GR.map((v) => v * D2R))).add(new THREE.Vector3(...GT)).toArray();
const HOOF = { legFR: [-4.7, 0.3, 3.9], legFL: [4.7, 0.3, 3.9], legBR: [-4.9, 0.3, -7.1], legBL: [4.9, 0.3, -7.1] };
const T0 = PIV.trunk, HIP = 10.5;
// where a point riding on the trunk ends up when the trunk pitches by a° and shifts by (dy, dz)
function onTrunk(pt, a, dy = 0, dz = 0) {
  const r = a * D2R, y = pt[1] - T0[1], z = pt[2] - T0[2];
  return [pt[0], T0[1] + y * Math.cos(r) - z * Math.sin(r) + dy, T0[2] + y * Math.sin(r) + z * Math.cos(r) + dz];
}
// the trunk heaves, surges, pitches (− rears up) and rolls; carry > 0 makes the front legs ride along with it
function trunk(P, { dy = 0, dz = 0, a = 0, roll = 0, yaw = 0, carry = 0 } = {}) {
  P.pos('trunk', 0, dy, dz).rot('trunk', a, yaw, roll);
  if (carry) for (const leg of ['legFR', 'legFL']) {
    const p0 = PIV[leg], p1 = onTrunk(p0, a, dy, dz);
    P.pos(leg, 0, (p1[1] - p0[1]) * carry, (p1[2] - p0[2]) * carry).rot(leg, a * carry, 0, 0);
  }
}
// swing a leg about its hip; the hoof is dropped back to the ground (the leg is rigid), lift raises it
function stride(P, leg, ang, lift = 0) { P.rot(leg, ang).pos(leg, 0, lift - HIP * (1 - Math.cos(ang * D2R)), 0); }
// lying on its side (fainted): rolled over the right flank's edge
const SIDE = 10.4;   // half the fleece's width: rolling about a point this high lands it on its flank where it stood
function keel(P, th, hop = 0) { const r = th * D2R; P.rot('root', 0, 0, th).pos('root', SIDE * Math.sin(r), SIDE * (1 - Math.cos(r)) + hop, 0); }
const stiffLegs = (P, k) => { for (const [leg, sx] of [['legFR', -1], ['legFL', 1], ['legBR', -1], ['legBL', 1]]) P.rot(leg, (leg[3] === 'F' ? -16 : 16) * k, 0, sx * 12 * k); };
const snort = (P, t0, k = 1) => P.burst(t0, 'steam', 'head', NOSE_R, { n: 3, dir: [-0.3, -0.7, 1], speed: 1.3 * k, spread: 0.25, scale: 0.7 * k }).burst(t0, 'steam', 'head', NOSE_L, { n: 3, dir: [0.3, -0.7, 1], speed: 1.3 * k, spread: 0.25, scale: 0.7 * k });
const VN = VINES.map((v) => v[0]), BL = BLOOMS.map((b) => b[0]);

export const anim = {
  start: 'idle', seed: 5,
  breathe: { bone: 'body', amp: 0.01, per: 3.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.6], dur: 0.16 },
  look: { bone: 'head', yaw: 22, pitch: 10, speed: 3.2 },
  springs: [
    { bone: 'beard', tip: [0, -4, 1], k: 150, d: 8, gain: 0.9, max: 18, axes: [1, 0.4, 1] },
    { bone: 'beardTip', tip: [0, -4, 0.5], k: 120, d: 7, gain: 1.0, max: 22, axes: [1, 0.4, 1] },
    { bone: 'earR', tip: [-6, -1, 0], k: 150, d: 8, gain: 0.7, max: 16 },
    { bone: 'earL', tip: [6, -1, 0], k: 150, d: 8, gain: 0.7, max: 16 },
    { bone: 'stem', tip: [0, 3, -1.5], k: 120, d: 6, gain: 1.0, max: 26 },
    { bone: 'cap', tip: [0, 1.5, 0], k: 260, d: 12, gain: 0.5, max: 10 },
    { bone: 'tail', tip: [0, -1, -2.5], k: 170, d: 8, gain: 1.0, max: 26 },
    { bone: 'braidR1', tip: [0, -3.2, 0], k: 190, d: 11, gain: 0.45, max: 9, axes: [1, 0.2, 0.7] },
    { bone: 'braidR2', tip: [0, -3.2, 0], k: 160, d: 10, gain: 0.5, max: 11, axes: [1, 0.2, 0.7] },
    { bone: 'braidR3', tip: [0, -3.5, 0], k: 140, d: 9, gain: 0.55, max: 13, axes: [1, 0.2, 0.7] },
    { bone: 'braidL1', tip: [0, -3.2, 0], k: 190, d: 11, gain: 0.45, max: 9, axes: [1, 0.2, 0.7] },
    { bone: 'braidL2', tip: [0, -3.2, 0], k: 160, d: 10, gain: 0.5, max: 11, axes: [1, 0.2, 0.7] },
    { bone: 'braidL3', tip: [0, -3.5, 0], k: 140, d: 9, gain: 0.55, max: 13, axes: [1, 0.2, 0.7] },
    { bone: 'tieA', tip: [0, -3.2, -1.5], k: 90, d: 5, gain: 1.1, max: 30 },
    { bone: 'tieB', tip: [0, -2.8, -1.2], k: 100, d: 5, gain: 1.1, max: 30 },
    { bone: 'guitar', tip: [0, 2, -6], k: 320, d: 14, gain: 0.35, max: 6 },
  ],
  faces: {
    eyes: { default: 'calm', states: { ...Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eyeR-' + k, 'eyeL-' + k]])), wink: ['eyeR-calm', 'eyeL-happy'] } },
    calyx: { default: 'normal', states: { normal: ['cx'], glow: ['cx-glow'] } },
    vines: { default: 'off', states: { off: [], on: ['vine'] } },
    bloom: { default: 'off', states: { off: [], on: ['bloom'] } },
  },
  fidget: { every: [6, 10], clips: ['shake', 'yawn', 'graze'] },
  clips: {
    // slow heavy breathing, chewing the cud, ear flicks; then a grumpy snort and a stamp (or, every other
    // loop, a long contented sigh with the eyes drifting shut)
    idle: { len: 5, loop: true, f(P, t, c) {
      const br = Math.sin((t / 2.5) * TAU);
      trunk(P, { dy: 0.28 * br, roll: 0.9 * Math.sin((t / 5) * TAU) });
      P.sq('body', 0.022 * br).rot('neck', -1.5 * Math.sin((t / 2.5) * TAU - 0.9)).rot('head', 1.3 * Math.sin((t / 2.5) * TAU - 1.7));
      const chew = seg(t, 0.15, 0.45) * (1 - seg(t, 2.9, 3.2)), ph = t * 1.5 * TAU;
      P.rot('jaw', (2 + 4 * Math.max(0, Math.sin(ph))) * chew, 8 * Math.sin(ph) * chew, 0).rot('head', 0, 0, 1.4 * Math.sin(ph - 0.5) * chew);
      const fl = bump(t, 1.05, 1.3), fr = bump(t, 2.55, 2.78);
      P.rot('earL', -12 * fl, 0, 30 * fl).rot('earR', -12 * fr, 0, -30 * fr);
      P.rot('tail', 0, 22 * wave(t, 5.5) * bump(t, 1.9, 2.6), 0);
      if (c.loopN % 2 === 0) {
        const jerk = seg(t, 3.45, 3.55, E.out) * (1 - seg(t, 3.6, 4.1)), frown = bump(t, 3.2, 4.2);
        P.rot('head', -10 * jerk).rot('neck', -4 * jerk).sq('body', -0.05 * jerk);
        P.rot('browR', 0, 0, -14 * frown).rot('browL', 0, 0, 14 * frown);
        P.face('eyes', t > 3.3 && t < 4.0 ? 'glare' : undefined);
        snort(P, 3.5);
        P.burst(3.62, 'dust', 'root', [0, 0.4, 24], { n: 5, dir: [0, 0.5, 1], speed: 0.7, spread: 0.8, scale: 0.6 });
        const st = bump(t, 3.8, 4.1);
        P.rot('legFR', -12 * st).pos('legFR', 0, 2.0 * st, 0).sq('body', -0.03 * bump(t, 4.08, 4.3));
        P.burst(4.1, 'dust', 'legFR', HOOF.legFR, { n: 4, dir: [0, 0.3, 1], speed: 0.7, spread: 1, scale: 0.55 });
      } else {
        const sigh = bump(t, 3.1, 4.7);
        P.face('eyes', sigh > 0.45 ? 'closed' : undefined); P.blinkOK = sigh < 0.1;
        P.rot('head', 7 * sigh, 0, 5 * sigh).rot('earL', 0, 0, -12 * sigh).rot('earR', 0, 0, 12 * sigh);
        trunk(P, { dy: -0.6 * sigh }); P.sq('body', 0.03 * bump(t, 3.1, 3.7) - 0.03 * bump(t, 3.8, 4.6));
        P.burst(3.95, 'steam', 'head', MOUTH, { n: 3, dir: [0, -0.3, 1], speed: 0.5, scale: 0.6 });
      }
    } },
    // a heavy, bouncy trot: diagonal pairs, the body drops onto each step, the head nods a beat behind
    walk: { len: 0.8, loop: true, f(P, t) {
      const ph = (t / 0.8) * TAU, b = bounce(t, 0.4, { squash: 0.08, stretch: 0.035 }), dy = b.u * 1.0 - 0.25;
      trunk(P, { dy, a: -1 + 1.5 * Math.sin(ph * 2 + 0.6), roll: 2.4 * Math.sin(ph) });
      P.sq('body', b.sq);
      for (const [leg, off] of [['legFR', 0], ['legBL', 0.15], ['legFL', Math.PI], ['legBR', Math.PI + 0.15]]) {
        const q = ph + off;
        stride(P, leg, 24 * Math.cos(q), 2.2 * Math.max(0, Math.sin(q)) ** 1.4);
      }
      P.rot('neck', 2 + 3.5 * Math.sin(ph * 2 - 1.3)).rot('head', 2.5 * Math.sin(ph * 2 - 2.0), 3 * Math.sin(ph - 0.5), -2.5 * Math.sin(ph - 0.3));
      P.rot('tail', 0, 14 * Math.sin(ph - 1), 0).rot('jaw', 3);
      P.burst(0.02, 'dust', 'legFL', HOOF.legFL, { n: 1, speed: 0.4, scale: 0.45 }).burst(0.42, 'dust', 'legFR', HOOF.legFR, { n: 1, speed: 0.4, scale: 0.45 });
    } },
    // battle cry: gathers itself, rears up on its hind legs and bellows, wool puffed right up, then slams down
    cry: { len: 2.3, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.32, 0.45, E.out));
      const up = seg(t, 0.32, 0.6, E.back) * (1 - seg(t, 1.45, 1.72, E.in));
      const puff = seg(t, 0.4, 0.62, E.back) * (1 - seg(t, 1.5, 2.0, E.inout));
      trunk(P, { a: 3 * crouch - 30 * up, dy: -1.3 * crouch + 1.0 * up, dz: -0.8 * up, carry: 1 });
      const paw = Math.min(1, up * 1.6);
      P.rot('legFR', (22 + 20 * Math.sin(t * 8)) * paw).rot('legFL', (22 + 20 * Math.sin(t * 8 + 2.4)) * paw);
      P.rot('neck', 6 * crouch + 4 * up).rot('head', 12 * crouch + 2 * up + wave(t, 9) * 2 * up, 0, wave(t, 4.5) * 3 * up);
      P.rot('jaw', 4 * crouch + 34 * up + wave(t, 15) * 3 * up);
      P.scl('body', 1 + 0.11 * puff, 1 + 0.08 * puff, 1 + 0.11 * puff).scl('neck', 1 + 0.08 * puff);
      P.pos('browR', 0, 0.8 * up, 0).pos('browL', 0, 0.8 * up, 0).rot('browR', 0, 0, -12 * crouch).rot('browL', 0, 0, 12 * crouch);
      P.rot('earL', 0, 0, 26 * up).rot('earR', 0, 0, -26 * up);
      P.face('eyes', crouch > 0.3 ? 'glare' : up > 0.3 ? 'open' : undefined); P.blinkOK = up < 0.1;
      const land = t > 1.72 ? 1 : 0;
      P.sq('body', wob(t, 1.72, -0.14, 2.6, 6)).rot('head', wob(t, 1.72, 8, 2.6, 6));
      snort(P, 0.22, 0.8);
      for (const tt of [0.62, 0.9, 1.18]) P.burst(tt, 'ring', 'head', MOUTH, {});
      P.burst(0.66, 'note', 'head', MOUTH, { n: 3, dir: [0, 1, 0.5], speed: 1.2, spread: 0.6 });
      if (t > 0.6 && t < 1.4) P.stream('leaf', 'body', [0, 22, -2], { rate: 10, dir: [Math.cos(t * 9), 1, Math.sin(t * 9)], speed: 1.4, spread: 0.5 }).stream('petal', 'body', [0, 21, -4], { rate: 12, dir: [-Math.cos(t * 9), 1, -Math.sin(t * 9)], speed: 1.3, spread: 0.5 });
      if (land) P.burst(1.72, 'dust', 'legFR', HOOF.legFR, { n: 6, speed: 1.4, spread: 1, scale: 0.8 }).burst(1.72, 'dust', 'legFL', HOOF.legFL, { n: 6, speed: 1.4, spread: 1, scale: 0.8 }).burst(1.72, 'rock', 'root', [0, 1, 6], { n: 3 });
      snort(P, 2.02, 0.9);
    } },
    // headbutt: scrapes a hoof twice, lowers its horns, charges; a crash of dust, stars and a shockwave; it rebounds and shakes it off
    attack: { len: 1.75, next: 'idle', f(P, t) {
      const lower = seg(t, 0, 0.28, E.out) * (1 - seg(t, 1.0, 1.45, E.inout));
      const z = key([[0, 0], [0.42, -1.8], [0.54, -2.0], [0.72, 9.5, 'in3'], [0.84, 5.6, 'out'], [1.02, 6.4, 'inout'], [1.6, 0, 'inout']], t);
      const charge = seg(t, 0.54, 0.72, E.in) * (1 - seg(t, 0.72, 0.8)), imp = t > 0.72 ? Math.exp(-5 * (t - 0.72)) : 0;
      P.pos('root', 0, 0, z);
      trunk(P, { a: -4 * seg(t, 0.05, 0.45) * (1 - seg(t, 0.5, 0.6)) + 10 * charge - 7 * imp, dy: -0.8 * lower });
      P.sq('body', wob(t, 0.72, -0.15, 3, 6)).scl('body', 1, 1, 1 - 0.1 * imp);
      const shake = Math.sin((t - 0.95) * 26) * seg(t, 0.95, 1.0) * (1 - seg(t, 1.05, 1.45));
      P.rot('neck', 16 * lower).rot('head', 30 * lower - 14 * imp + wob(t, 0.72, -9, 3.5, 6), 12 * shake, 4 * shake);
      for (const t0 of [0.08, 0.28]) {
        const fw = seg(t, t0, t0 + 0.07, E.out) * (1 - seg(t, t0 + 0.08, t0 + 0.17, E.in));
        P.rot('legFR', -24 * fw).pos('legFR', 0, 1.3 * bump(t, t0, t0 + 0.09), 0);
        P.burst(t0 + 0.15, 'dust', 'legFR', HOOF.legFR, { n: 3, dir: [0, 0.4, -1], speed: 1.2, scale: 0.55 });
      }
      if (t > 0.5 && t < 0.78) for (const [leg, off] of [['legFR', 0], ['legFL', 0.7], ['legBR', 3.1], ['legBL', 3.8]]) stride(P, leg, 26 * Math.cos(t * 30 + off), 1.6 * Math.max(0, Math.sin(t * 30 + off)));
      P.face('eyes', t < 0.72 ? 'glare' : t < 0.95 ? 'squeeze' : t < 1.35 ? 'glare' : undefined); P.blinkOK = false;
      P.rot('browR', 0, 0, -16 * lower).rot('browL', 0, 0, 16 * lower);
      P.rot('earL', 0, -20 * charge, -24 * charge).rot('earR', 0, 20 * charge, 24 * charge);
      snort(P, 0.4, 0.8);
      if (t > 0.54 && t < 0.72) P.stream('dust', 'root', [0, 0.3, -8], { rate: 34, dir: [0, 0.4, -1], speed: 0.8, spread: 0.6, scale: 0.6 });
      P.burst(0.72, 'ring', 'head', BROW, {}).burst(0.72, 'spark', 'head', BROW, { n: 2 }).burst(0.72, 'star', 'head', BROW, { n: 6, speed: 1.4 })
        .burst(0.73, 'dust', 'root', [0, 0.5, 22], { n: 9, speed: 1.6, spread: 1, scale: 0.9 }).burst(0.73, 'rock', 'root', [0, 2, 22], { n: 4 })
        .burst(0.98, 'star', 'head', CROWN, { n: 3, speed: 0.5 });
    } },
    // healing: plants its hooves, the calyx glows, vines burst up out of the ground and blossoms open in its wool,
    // petals, leaves and hearts swirl upward; then it all sinks back
    special: { len: 2.8, next: 'idle', f(P, t) {
      const plant = seg(t, 0, 0.35, E.inout) * (1 - seg(t, 2.3, 2.75, E.inout)), lift = seg(t, 0.42, 0.7, E.back) * (1 - seg(t, 2.1, 2.6, E.inout));
      trunk(P, { dy: -1.1 * plant + 0.6 * lift, a: -5 * lift });
      for (const [leg, sx] of [['legFR', -1], ['legFL', 1], ['legBR', -1], ['legBL', 1]]) P.rot(leg, 0, 0, sx * 7 * plant);
      P.rot('neck', 10 * plant - 16 * lift).rot('head', 14 * plant - 16 * lift + wave(t, 0.8) * 3 * lift);
      P.face('eyes', t < 0.45 ? 'closed' : lift > 0.3 ? 'happy' : 'calm').face('calyx', t > 0.3 && t < 2.4 ? 'glow' : 'normal')
        .face('vines', t > 0.36 && t < 2.62 ? 'on' : 'off').face('bloom', t > 0.44 && t < 2.55 ? 'on' : 'off');
      P.blinkOK = false; P.lookW = 1 - lift;
      VN.forEach((v, i) => { const g = seg(t, 0.38 + i * 0.06, 0.7 + i * 0.06, E.back) * (1 - seg(t, 2.2 + i * 0.05, 2.6, E.in)); P.scl(v, Math.max(0.001, g)).rot(v, wave(t, 0.9, i) * 6 * g, wave(t, 0.5, i * 2) * 25 * g, wave(t, 0.7, i + 1) * 6 * g); });
      BL.forEach((b, i) => { const g = seg(t, 0.46 + i * 0.07, 0.72 + i * 0.07, E.back) * (1 - seg(t, 2.15 + i * 0.04, 2.5, E.in)); P.scl(b, Math.max(0.001, g)); });
      P.scl('body', 1 + 0.06 * lift).scl('cap', 1 + 0.22 * lift + 0.05 * wave(t, 2) * lift);
      P.burst(0.4, 'leaf', 'root', [0, 1, 0], { n: 16, dir: [0, 1, 0], speed: 2.4, spread: 0.9 }).burst(0.42, 'petal', 'root', [0, 1, 0], { n: 16, dir: [0, 1, 0], speed: 2.2, spread: 0.9 })
        .burst(0.62, 'sparkle', 'cap', CROWN, { n: 8, speed: 1 });
      if (t > 0.6 && t < 2.2) {
        const sw = t * 5;
        P.stream('heart', 'body', [0, 23, -2], { rate: 5, dir: [0, 1, 0], speed: 0.9, spread: 0.6 })
          .stream('petal', 'root', [Math.cos(sw) * 12, 2, Math.sin(sw) * 12 - 2], { rate: 14, dir: [-Math.sin(sw), 1.2, Math.cos(sw)], speed: 1.5, spread: 0.3 })
          .stream('leaf', 'root', [-Math.cos(sw) * 12, 2, -Math.sin(sw) * 12 - 2], { rate: 9, dir: [Math.sin(sw), 1.2, -Math.cos(sw)], speed: 1.5, spread: 0.3, key: 'b' })
          .stream('mote', 'root', [0, 3, -1], { rate: 10, spread: 1.2, speed: 1 })
          .stream('blossom', 'body', [0, 22, -2], { rate: 2.5, dir: [0, 1, 0], speed: 1.2, spread: 1 });
      }
      P.burst(2.2, 'petal', 'body', [0, 22, -2], { n: 10, speed: 1.5 });
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.18, 0.65, E.inout));
      trunk(P, { dz: -2.2 * k, a: -8 * k + wob(t, 0.18, 3, 3, 6), roll: 5 * k * wave(t, 9) });
      P.scl('body', 1 + 0.08 * k).rot('head', -14 * k, 0, 6 * k).rot('neck', -6 * k).rot('jaw', 22 * k);
      P.rot('earL', 0, 0, 30 * k).rot('earR', 0, 0, -30 * k).pos('browR', 0, 0.6 * k, 0).pos('browL', 0, 0.6 * k, 0);
      P.face('eyes', t < 0.42 ? 'squeeze' : undefined); P.blinkOK = false;
      P.burst(0.02, 'seed', 'body', [0, 21, -2], { n: 10, speed: 1.2 }).burst(0.02, 'spark', 'head', BROW, {}).burst(0.03, 'leaf', 'body', [0, 20, 0], { n: 3 });
    } },
    // dizzy, then the fainting-goat freeze: legs lock out stiff and over it goes onto its side
    faint: { len: 2.4, next: 'down', f(P, t) {
      const dz = seg(t, 0, 0.25) * (1 - seg(t, 0.95, 1.05)), stiff = seg(t, 0.95, 1.1, E.out), fall = seg(t, 1.15, 1.52, E.in);
      trunk(P, { roll: 6 * Math.sin(t * 2.2 * TAU) * dz, dy: -0.4 * dz });
      P.rot('head', 6 * Math.sin(t * 2.2 * TAU + 1) * dz, 12 * Math.sin(t * 1.6 * TAU) * dz, 8 * Math.sin(t * 2.2 * TAU + 2) * dz);
      stiffLegs(P, stiff);
      P.rot('root', wave(t, 16) * 1.4 * stiff * (1 - fall));
      keel(P, 90 * fall + (t > 1.52 ? wob(t, 1.52, 5, 3, 7) : 0), 2.2 * Math.sin(Math.PI * fall));
      P.rot('jaw', 20 * fall).rot('neck', 0, 0, -8 * fall).rot('head', 0, 0, -10 * fall);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 1 - dz;
      P.burst(0.25, 'star', 'head', CROWN, { n: 4, speed: 0.5 }).burst(1.52, 'dust', 'root', [-4, 0.5, 0], { n: 10, speed: 1.2, spread: 1, scale: 0.9 }).burst(1.55, 'star', 'head', CROWN, { n: 3, speed: 0.6 });
    } },
    down: { len: 3, loop: true, f(P, t) {
      const br = Math.sin((t / 3) * TAU);
      keel(P, 90); stiffLegs(P, 1);
      P.sq('body', 0.03 * br).rot('jaw', 20 + 2 * br).rot('neck', 0, 0, -8).rot('head', 0, 0, -10);
      P.rot('legFL', 14 * bump(t, 1.8, 2.0)).rot('legBL', -10 * bump(t, 1.9, 2.15));
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.3;
      P.burst(0.6, 'star', 'head', CROWN, { n: 2, speed: 0.3 });
    } },
    // victory: draws itself up, chest out; a two-step stomp with notes off the old guitar, a horn glint and a wink,
    // then a satisfied snort — on the road again
    win: { len: 2.8, next: 'idle', f(P, t) {
      const proud = seg(t, 0, 0.35, E.back) * (1 - seg(t, 2.3, 2.75, E.inout)), jig = seg(t, 0.3, 0.4) * (1 - seg(t, 1.62, 1.75));
      trunk(P, { dy: 1.0 * proud, a: -7 * proud });
      for (const [t0, leg] of [[0.5, 'legFR'], [0.85, 'legFL'], [1.2, 'legFR'], [1.55, 'legFL']]) {
        const k = bump(t, t0 - 0.17, t0), hit = t > t0 ? Math.exp(-9 * (t - t0)) : 0;
        P.rot(leg, -16 * k).pos(leg, 0, 2.4 * k, 0).sq('body', -0.05 * hit).pos('guitar', 0, 0.9 * hit, 0);
        P.burst(t0, 'dust', leg, HOOF[leg], { n: 3, speed: 0.6, scale: 0.5 }).burst(t0, 'note', 'guitar', GHOLE, { n: 1, speed: 0.9, dir: [0, 1, 0.3] });
      }
      const beat = Math.sin(((t - 0.5) / 0.35) * Math.PI) ** 2;
      P.rot('neck', -6 * proud).rot('head', -3 * proud + 6 * beat * jig, 0, 4 * Math.sin(((t - 0.5) / 0.7) * TAU) * jig);
      P.rot('tail', 0, 20 * Math.sin(t * 14) * jig, 0);
      P.face('eyes', t > 1.82 && t < 2.2 ? 'wink' : jig > 0.5 ? 'happy' : undefined); P.blinkOK = t < 1.7 || t > 2.3;
      P.burst(1.85, 'glint', 'hornL', GLINT, {}).burst(1.86, 'sparkle', 'hornL', GLINT, { n: 5, speed: 0.4 });
      snort(P, 2.25, 0.8);
      P.rot('head', 5 * bump(t, 2.15, 2.45));
    } },
    // asleep: lying down with its chin on its folded front hooves, beard spread out like a pillow, snoring
    sleep: { len: 4, loop: true, f(P, t) {
      const br = Math.sin((t / 4) * TAU);
      trunk(P, { dy: -5.0 + 0.3 * br });
      P.sq('body', -0.04 + 0.035 * br);
      for (const [leg, sx] of [['legFR', -1], ['legFL', 1]]) P.rot(leg, -86, 0, sx * 4).pos(leg, 0, -8.8, 1.0);
      for (const [leg, sx] of [['legBR', -1], ['legBL', 1]]) P.rot(leg, -80, sx * 20, -sx * 12).pos(leg, 0, -8.6, 0);
      P.rot('neck', 30 + 1.5 * br).rot('head', 8 - 2 * br, 0, 4).rot('jaw', 3 + 4 * Math.max(0, br));
      P.rot('beard', -55).rot('beardTip', -20).rot('braidR1', -40, 0, -20).rot('braidL1', -40, 0, 20);
      P.rot('earL', 0, 0, -16).rot('earR', 0, 0, 16);
      P.face('eyes', 'sleep'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(1.0, 'z', 'head', ZZ, {}).burst(2.6, 'z', 'head', ZZ, {});
    } },
    // fidget: shakes out its fleece like a wet dog — seeds and leaves fly, the guitar rattles
    shake: { len: 1.6, next: 'idle', f(P, t) {
      const k = seg(t, 0.05, 0.25) * (1 - seg(t, 1.0, 1.35)), osc = Math.sin(t * 5.5 * TAU);
      trunk(P, { roll: 11 * osc * k, dy: 0.4 * k });
      P.rot('neck', 0, -8 * osc * k, -6 * osc * k).rot('head', 0, -6 * osc * k, -10 * osc * k);
      P.scl('body', 1 + 0.05 * k * Math.abs(osc));
      P.rot('tail', 0, 30 * osc * k, 0).rot('guitar', 0, 0, 5 * osc * k);
      P.face('eyes', k > 0.3 ? 'squeeze' : t > 1.3 ? 'happy' : undefined); P.blinkOK = k < 0.1;
      P.burst(0.4, 'seed', 'body', [0, 20, -2], { n: 8, speed: 1.4 }).burst(0.7, 'seed', 'body', [0, 18, -6], { n: 6, speed: 1.4 }).burst(0.55, 'leaf', 'body', [0, 21, 0], { n: 4, speed: 1.2 });
    } },
    // fidget: an old ram's stretch — front legs out, rump up — and an enormous yawn
    yawn: { len: 2.6, next: 'idle', f(P, t) {
      const st = seg(t, 0.1, 0.6, E.inout) * (1 - seg(t, 1.7, 2.2, E.inout)), yw = seg(t, 0.5, 0.85, E.out) * (1 - seg(t, 1.45, 1.75, E.inout));
      trunk(P, { a: 10 * st, dy: -1.4 * st, dz: -1.2 * st, carry: 0 });
      P.rot('legFR', -26 * st).rot('legFL', -26 * st).pos('legFR', 0, -0.8 * st, 1.2 * st).pos('legFL', 0, -0.8 * st, 1.2 * st);
      P.rot('legBR', -6 * st).rot('legBL', -6 * st);
      P.rot('neck', -14 * yw).rot('head', -16 * yw + 2 * wave(t, 6) * yw).rot('jaw', 36 * yw + 2 * wave(t, 9) * yw);
      P.rot('earL', 0, 0, 20 * yw).rot('earR', 0, 0, -20 * yw).pos('browR', 0, 0.5 * yw, 0).pos('browL', 0, 0.5 * yw, 0);
      P.sq('body', 0.05 * yw).rot('tail', 0, 0, 0).rot('tail', -20 * st);
      P.face('eyes', yw > 0.2 ? 'squeeze' : t > 1.75 && t < 2.3 ? 'sleep' : undefined); P.blinkOK = yw < 0.1; P.lookW = 1 - yw;
      P.burst(1.5, 'steam', 'head', MOUTH, { n: 3, dir: [0, 0.3, 1], speed: 0.4, scale: 0.6 });
    } },
    // fidget: a mouthful of grass, chewed while it eyes you
    graze: { len: 3.2, next: 'idle', f(P, t) {
      const dn = seg(t, 0.1, 0.6, E.inout) * (1 - seg(t, 1.5, 2.0, E.inout)), nib = Math.sin(t * 4 * TAU) * seg(t, 0.6, 0.7) * (1 - seg(t, 1.3, 1.5));
      trunk(P, { a: 4 * dn, dy: -0.5 * dn });
      P.rot('neck', 36 * dn).rot('head', 26 * dn + 3 * nib).rot('jaw', 6 * dn + 6 * Math.max(0, nib));
      const chew = seg(t, 1.9, 2.0) * (1 - seg(t, 2.9, 3.1)), ph = t * 2.2 * TAU;
      P.rot('jaw', (3 + 4 * Math.max(0, Math.sin(ph))) * chew, 9 * Math.sin(ph) * chew, 0);
      P.lookW = 1 - dn;
      P.burst(1.45, 'leaf', 'head', MOUTH, { n: 3, speed: 0.6, dir: [0, 1, 0.4] });
    } },
  },
};
def.anim = anim;
