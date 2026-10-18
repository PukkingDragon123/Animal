// Strawbaa — the grass starter. A stout, grizzled old ram whose fleece is a ripe strawberry:
// rose-red wool puffs studded with golden seeds, a leafy calyx cap with a curly stem, heavy
// spiral horns ringed with growth ridges (one tip snapped off long ago), a long craggy face,
// bushy white brows over heavy-lidded amber eyes, a notched ear and a great white beard.
// Gentle and sleepy — chews its cud, snorts at nothing — until a friend gets hurt.
import * as THREE from '../../../vendor/three.module.js';
import { E, seg, bump, wob, wave, key, clamp01, lerp } from '../anim.js';
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
  s0: '#f4ede2', s1: '#ddd3c4', s2: '#bfb1a1', s3: '#988878', s4: '#6c5c56', s5: '#48393d',
  // weathered nose leather
  n0: '#b89c9a', n1: '#8e7072', n2: '#644a50', n3: '#38242e',
  // white wool: beard, brows, chops, fetlocks
  b0: '#ffffff', b1: '#f3eee6', b2: '#d8cfc4', b3: '#ada19a', b4: '#7c6e72',
  // horn: weathered ivory, dirtier toward the skull
  h0: '#f8efd8', h1: '#e6d5b0', h2: '#ccb58c', h3: '#a48b6a', h4: '#786350', h5: '#4c3c36',
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
        if (gx >= 0 && gx < w - 1 && gy >= 0 && gy < h && h2(k, r, sd + 1) > 0.4) { p.px(gx, gy, C.wHi); p.px(gx + 1, gy, C.wHi); p.px(gx + 1, gy - 1, C.wHi); }
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
  const LW = o.lock ?? 3, cols = o.cols || [C.b0, C.b1, C.b1, C.b2, C.b3];
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
        p.px(X, y, ramp([C.b2, C.b3, C.b3, C.b4], t, X, y));
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
// the long roman-nosed muzzle: wrinkled bridge, an old scar, lip line turned down at the corner
function muzzleP(p, w, h, face, cube) {
  if (face === 'down') { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (y % 3 === 1) ? C.m0 : C.m1); return; }
  skinP(p, w, h, face, cube);
  if (face === 'up') {
    const c = w / 2 - 0.5;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (Math.abs(x - c) < 1.6) p.px(x, y, C.s0); }
    for (const y of [2, 5, 8]) for (let x = 3; x < w - 3; x++) { const yy = y + Math.round(Math.abs(x - c) * 0.18); p.px(x, yy, C.s3); p.px(x, yy - 1, '#fbf7f0'); }
    // an old scar across the bridge, with stitch marks
    for (let k = 0; k < 7; k++) { const x = 4 + k, y = 11 + Math.round(k * 0.5); p.px(x, y, '#e8b4b4'); p.px(x, y + 1, C.s4); if (k % 2 === 0) p.px(x, y - 1, C.s4); }
    for (let y = h - 4; y < h; y++) for (let x = 2; x < w - 2; x++) p.px(x, y, y === h - 4 ? C.n0 : C.n1);
    return;
  }
  if (face === 'south') {
    for (let x = 0; x < w; x++) { p.px(x, h - 1, C.n3); p.px(x, h - 2, C.s3); }
    for (let y = h - 4; y < h - 1; y++) p.px(Math.floor(w / 2), y, C.n2);
    return;
  }
  if (face === 'east' || face === 'west') {
    const F = (d) => (face === 'west' ? w - 1 - d : d);   // d = distance back from the nose
    for (let d = 0; d < w; d++) { const y = h - 2 + (d > w - 5 ? 1 : 0); p.px(F(d), y, C.n3); p.px(F(d), y - 1, d < w - 4 ? C.s2 : C.s3); }
    for (let d = 2; d < 11; d++) p.px(F(d), Math.round(3 + d * 0.95), C.s3);               // the fold from nostril to mouth
    for (let d = 0; d < 3; d++) for (let y = 1; y < h - 3; y++) p.px(F(d), y, d === 0 ? C.n1 : C.n0);
  }
}
// broad weathered nose leather: two slanted nostrils, a philtrum groove, dry cracks
function noseP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.n0 : face === 'down' ? C.n2 : ramp([C.n0, C.n1, C.n1, C.n2], T01(y, h), x, y));
  if (face !== 'south') return;
  const cx = w / 2 - 0.5;
  for (const s of [-1, 1]) {
    for (let k = 0; k < 5; k++) {
      const x = Math.round(cx + s * (2.2 + k * 0.7)), y = 2 + k;
      p.px(x, y, C.n3); p.px(x + s, y, k > 0 && k < 4 ? C.n3 : C.n2); p.px(x - s, y, C.n2);
      if (k === 0) p.px(x - s, y - 1, C.n0);
    }
  }
  for (let y = 5; y < h; y++) p.px(Math.round(cx), y, C.n2);
  for (let x = 1; x < w - 1; x++) p.px(x, 0, C.n0);
  p.px(2, h - 2, C.n0); p.px(3, h - 2, C.n0); p.px(w - 4, 1, C.n0); p.px(w - 5, 1, C.n0);
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
function hornSeg(i, n, o = {}) {
  const u = i / Math.max(1, n - 1);
  const pal = u < 0.3 ? [C.h2, C.h3, C.h4, C.h5] : u < 0.7 ? [C.h1, C.h2, C.h3, C.h4] : [C.h0, C.h1, C.h2, C.h3];
  return (p, w, h, face) => {
    const k = face === 'down' ? 0 : face === 'east' ? 0.2 : face === 'up' ? 0.55 : face === 'west' ? 0.7 : 0.35;
    const alongY = face === 'up' || face === 'down';
    const L = alongY ? h : w, A = alongY ? w : h;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const a = alongY ? y : x, c = alongY ? x : y, cc = c / Math.max(1, A - 1);
      // ridges every 3 texels, bowed toward the middle of the face
      const bow = (Math.abs(cc - 0.5) < 0.3 ? 1 : 0), r = (a + bow) % 3;
      let col = ramp(pal, k + 0.12 * Math.abs(cc - 0.5), x, y);
      if (face === 'north' || face === 'south') {
        const e = Math.min(x, y, w - 1 - x, h - 1 - y);
        col = e === 0 ? pal[3] : e === 1 ? pal[2] : (e % 2 ? pal[1] : pal[0]);
      } else if (r === 0) col = shift(pal[3], -0.3);
      else if (r === 1) col = shift(col, 0.45);
      if ((face === 'down' || face === 'east') && cc > 0.82 && r !== 0) col = shift(col, 0.3);
      p.px(x, y, col);
    }
    // a chip knocked out of the outer edge, and a long weathering crack
    if (o.chip && (face === 'down' || face === 'east')) {
      const a0 = Math.floor(L * 0.35);
      for (let a = a0; a < a0 + 3; a++) for (let c = A - 3; c < A; c++) { const X = alongY ? c : a, Y = alongY ? a : c; p.px(X, Y, c === A - 3 || a === a0 ? C.h5 : C.h0); }
    }
    if (o.crack && face === 'down') for (let a = 1; a < L - 1; a++) { const c = Math.round(A * 0.35 + Math.sin(a * 0.9) * 0.6); if (a % 4 !== 3) p.px(alongY ? c : a, alongY ? a : c, C.h5); }
  };
}
// the snapped-off tip of the right horn: a rough fracture across the end
function hornBreak(p, w, h, face) {
  hornSeg(9, 10)(p, w, h, face);
  if (face !== 'south') return;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const e = Math.min(x, y, w - 1 - x, h - 1 - y); p.px(x, y, e === 0 ? C.h4 : (x + y) % 3 === 0 ? C.h2 : C.h1); }
  p.px(1, 1, C.h5); p.px(2, 2, C.h5); p.px(w - 2, h - 2, C.h5);
}

// ears: thin flaps, pinkish-grey inside, grizzled outside; the left one has a notch bitten out of it
function earP(notch) {
  return (p, w, h, face, cube) => {
    skinP(p, w, h, face, cube);
    if (face === 'south') {
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 2; x++) p.px(x, y, y === 1 || x === 1 ? '#c8a4a2' : (y === Math.floor(h / 2) ? '#9a7072' : '#dcb4b2'));
      p.px(w - 1, 0, C.s3); p.px(w - 1, h - 1, C.s3);
    }
    if (face === 'north') { p.px(w - 1, 0, C.s3); p.px(w - 1, h - 1, C.s3); }
    if (notch && (face === 'south' || face === 'north' || face === 'up')) {
      const nx = face === 'north' ? 3 : w - 4;
      for (let k = 0; k < 3; k++) { p.px(nx + (face === 'north' ? -k : k), k, C.ink); p.px(nx + (face === 'north' ? -k : k) + (face === 'north' ? -1 : 1), k, C.ink); }
    }
  };
}
// hooves: dark, a lit rim, the cloven split down the front and back
function hoofP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.k0 : face === 'down' ? C.k2 : ramp([C.k0, C.k1, C.k1, C.k2], T01(y, h), x, y));
  if (face === 'south' || face === 'north') for (let y = 0; y < h; y++) p.px(Math.floor(w / 2), y, C.k2);
  if (face !== 'up' && face !== 'down') { for (let x = 0; x < w; x++) p.px(x, 0, '#8a7a88'); p.px(1, 1, '#7a6c7a'); }
}
const legP = skin({ cols: [C.s1, C.s2, C.s2, C.s3] });
const fetlockP = locks({ lock: 3, cols: [C.b1, C.b1, C.b2, C.b2, C.b3], t0: 0.1 });
const beardP = locks({ lock: 3 }), beardLow = locks({ lock: 3, t0: 0.3, t1: 0.7 }), browP = locks({ lock: 2, tips: false, t1: 0.6 });
const woolP = wool(), woolTop = wool({ t0: 0.0, t1: 0.3 }), woolLow = wool({ t0: 0.3, t1: 0.45 }), woolSmall = wool({ size: 9, row: 5, sx: 9, sy: 7 });

// calyx sepals: pointed leaves with a pale midrib (the glowing set is drawn brighter, for the heal)
function sepal(glow) {
  const lit = glow ? '#f4ffd0' : C.g1, mid = glow ? '#b8f07a' : C.g2, dark = glow ? '#6ad050' : C.g3, rib = glow ? '#ffffff' : C.g0;
  return (p, w, h) => {
    for (let y = 0; y < h; y++) {
      const v = T01(y, h), half = (v < 0.28 ? 0.55 + 0.45 * (v / 0.28) : Math.pow(Math.max(0, 1 - (v - 0.28) / 0.72), 0.75)) * (w / 2);
      for (let x = 0; x < w; x++) {
        const dx = x - (w / 2 - 0.5); if (Math.abs(dx) > half) continue;
        let c = dx < 0 ? lit : mid;
        if (Math.abs(dx) > half - 1) c = dark;
        if (Math.abs(dx) < 0.6 && v < 0.85) c = rib;
        if (v > 0.9) c = dark;
        p.px(x, y, c);
      }
    }
  };
}
const sepalP = sepal(false), sepalGlow = sepal(true);
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
const vineP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' || face === 'east' ? C.g1 : face === 'down' ? C.g4 : (y % 4 === 0 ? C.g3 : C.g2)); };
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
const MZ = { pivot: [0, 19.6, 10.8], rot: [14, 0, 0] };              // the muzzle's nose-down tilt (the jaw shares it)
const mirrorX = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]] } : {}), ...(c.rot ? { rot: [c.rot[0], -c.rot[1], -c.rot[2]] } : {}), mirror: !c.mirror });
const both = (...cs) => cs.flatMap((c) => [c, mirrorX(c)]);
const add3 = (a, d) => [a[0] + d[0], a[1] + d[1], a[2] + d[2]];
// the head is authored around its own origin and then carried forward of the shoulders by HEAD
const HEAD = [0, 1.4, 4.4];
const moved = (b) => ({ ...b, pivot: add3(b.pivot, HEAD), cubes: b.cubes.map((c) => ({ ...c, o: add3(c.o, HEAD), ...(c.pivot ? { pivot: add3(c.pivot, HEAD) } : {}) })) });
// the horn coil: rises off the crown, sweeps back, down behind the ear and forward past the cheek
function hornPts(s) {
  const pts = [], N = 10, cy = 20.4, cz = 7.4;
  for (let i = 0; i <= N; i++) {
    const u = i / N, th = (68 + 306 * u) * D2R, r = 5.5 - 2.1 * u;
    const lat = 3.4 + 4.1 * (1 - (1 - u) ** 3) + 1.4 * Math.max(0, (u - 0.8) / 0.2) ** 2;
    pts.push([s * lat, cy + r * Math.sin(th), cz + r * Math.cos(th)]);
  }
  return pts;
}
const hornSize = (i, n) => { const u = i / (n - 1); return [3.7 - 2.2 * u, 3.4 - 2.0 * u]; };
const hornL = chain(hornPts(1), hornSize, (i, n) => hornSeg(i, n, { chip: i === 3, crack: i === 5 }));
const hornR = chain(hornPts(-1), hornSize, (i, n) => (i === n - 1 ? hornBreak : hornSeg(i, n, { crack: i === 2 })), { extra: () => ({ mirror: true }) });
hornR[hornR.length - 1].s[2] *= 0.6;   // the snapped-off tip (the box keeps its base end)
// the curly stem: up out of the calyx, then over in a tight tendril curl
const stemPts = [[0, 28.3, 9.2], [0.1, 29.9, 9.1], [0.2, 31.2, 8.6], [0.3, 31.9, 7.6], [0.4, 31.7, 6.5], [0.5, 30.9, 6.0], [0.5, 30.2, 6.5], [0.5, 30.4, 7.3]];
const stem = chain(stemPts, (i, n) => [1.2 - 0.5 * i / n, 1.2 - 0.5 * i / n], () => stemP, { over: 0.5 });
const sepals = (glow) => [0, 32, 148, 180, 212, 328].map((phi, k) => leafAt([0, 28.2, 9.2], k % 3 ? 4.2 : 4.8, 2.6, phi, k % 3 ? 14 : 9, glow ? sepalGlow : sepalP, { id: glow ? 'cx-glow' : 'cx', hide: !!glow, ...(glow ? { glow: true } : {}) }));
// healing vines (hidden until the special): spiralling runners with leaflets, two carrying a berry
function vine(base, turn, hgt, berry) {
  const pts = [];
  for (let k = 0; k <= 7; k++) { const a = turn + k * 0.95, r = 1.5 - k * 0.12; pts.push([base[0] + Math.cos(a) * r, base[1] + k * hgt / 7, base[2] + Math.sin(a) * r]); }
  const cs = chain(pts, (i, n) => [1.0 - 0.45 * i / n, 1.0 - 0.45 * i / n], () => vineP, { over: 0.45, extra: () => ({ id: 'vine', hide: true }) });
  [2, 4, 6].forEach((k, j) => cs.push(leafAt(pts[k], 2.8, 2.0, (turn / D2R) + 70 + j * 140, -25, leafP, { id: 'vine', hide: true })));
  if (berry) { const t = pts[7]; cs.push(P([t[0] - 0.8, t[1] - 2.0, t[2] - 0.8], [1.6, 2.0, 1.6], berryP, { id: 'vine', hide: true })); }
  return cs;
}
const bloom = (at, plane) => [
  P(plane === 'y' ? [at[0] - 1.5, at[1], at[2] - 1.5] : plane === 'x' ? [at[0], at[1] - 1.5, at[2] - 1.5] : [at[0] - 1.5, at[1] - 1.5, at[2]], plane === 'y' ? [3, 0, 3] : plane === 'x' ? [0, 3, 3] : [3, 3, 0], blossomP, { plane, id: 'bloom', hide: true }),
  P([at[0] - 0.45 + (plane === 'x' ? Math.sign(at[0]) * 0.3 : 0), at[1] - 0.45 + (plane === 'y' ? 0.3 : 0), at[2] - 0.45 + (plane === 'z' ? 0.3 : 0)], [0.9, 0.9, 0.9], coreP, { id: 'bloom', hide: true, outline: false }),
];
const eyeStates = (side) => Object.entries(EYES).map(([k, fn]) => P(side < 0 ? [-EYE_X[1], EYE_Y[0], 12.66] : [EYE_X[0], EYE_Y[0], 12.66], [EYE_X[1] - EYE_X[0], EYE_Y[1] - EYE_Y[0], 0], fn, { plane: 'z', mirror: side > 0, id: 'eye-' + k, hide: k !== 'calm' }));
const BLOOMS = [['bloomA', [-1.0, 22.85, 0.7], 'y'], ['bloomB', [3.2, 21.25, -6.7], 'y'], ['bloomC', [-9.65, 14.0, 1.4], 'x'], ['bloomD', [9.65, 12.4, 0.0], 'x'], ['bloomE', [-8.45, 13.4, -9.0], 'x']];
const VINES = [['vineFR', [-11.5, 0, 6], 0.3, 14, true], ['vineFL', [11.5, 0, 5.5], 2.2, 12, false], ['vineBR', [-11.5, 0, -9.5], 4.0, 11, false], ['vineBL', [11.5, 0, -9], 5.4, 13.5, true]];

// head-group bones, authored in head space (skull front at z = 12.6) and moved by HEAD
const HEAD_BONES = [
  { name: 'head', parent: 'neck', pivot: [0, 18.5, 8], cubes: [
    P([-4.4, 16.6, 6.0], [8.8, 8.0, 6.6], skinP, { faces: { south: faceFront } }),
    P([-4.6, 15.4, 7.4], [9.2, 3.8, 4.4], skinP),                                // strong cheekbones and jaw muscles
    ...both(P([-5.4, 13.6, 7.8], [1.4, 4.8, 4.0], beardP)),                       // white mutton-chop whiskers
    P([-2.7, 15.2, 10.8], [5.4, 4.4, 6.4], muzzleP, MZ),
    P([-2.3, 15.5, 16.6], [4.6, 3.3, 1.3], noseP, MZ),
    P([-2.1, 14.0, 11.0], [4.2, 1.3, 5.0], mouthP, { ...MZ, outline: false }),
    // the red topknot under the calyx, and a forelock between the brows
    P([-2.9, 24.4, 6.4], [5.8, 3.4, 5.8], woolSmall),
    P([-1.6, 22.6, 11.8], [3.2, 2.4, 1.2], woolSmall),
    ...eyeStates(-1), ...eyeStates(1),
  ] },
  { name: 'hornR', parent: 'head', pivot: [-3.4, 24, 8], cubes: hornR },
  { name: 'hornL', parent: 'head', pivot: [3.4, 24, 8], cubes: hornL },
  { name: 'earR', parent: 'head', pivot: [-4.2, 20.4, 8.6], rot: [0, -12, 30], cubes: [P([-8.6, 19.3, 8.2], [4.4, 2.2, 0.8], earP(false), { mirror: true })] },
  { name: 'earL', parent: 'head', pivot: [4.2, 20.4, 8.6], rot: [0, 12, -30], cubes: [P([4.2, 19.3, 8.2], [4.4, 2.2, 0.8], earP(true))] },
  { name: 'browR', parent: 'head', pivot: [-1.3, 23.0, 12.8], rot: [0, 0, 8], cubes: [P([-4.9, 22.0, 11.6], [3.8, 2.0, 2.4], browP), P([-6.0, 21.4, 11.8], [1.5, 1.7, 1.8], browP)] },
  { name: 'browL', parent: 'head', pivot: [1.3, 23.0, 12.8], rot: [0, 0, -8], cubes: [P([1.1, 22.0, 11.6], [3.8, 2.0, 2.4], browP, { mirror: true }), P([4.5, 21.4, 11.8], [1.5, 1.7, 1.8], browP, { mirror: true })] },
  { name: 'jaw', parent: 'head', pivot: [0, 15.3, 9.9], cubes: [
    P([-2.4, 13.8, 11.0], [4.8, 1.4, 6.0], jawP, MZ),
    P([-1.6, 15.2, 16.0], [3.2, 0.5, 0.5], teethP, { ...MZ, outline: false }),
  ] },
  { name: 'beard', parent: 'jaw', pivot: [0, 12.8, 12.6], cubes: [
    P([-4.0, 11.6, 9.2], [8.0, 2.6, 3.4], beardP),
    P([-2.8, 9.4, 10.4], [5.6, 3.6, 4.6], beardP),
  ] },
  { name: 'beardTip', parent: 'beard', pivot: [0, 9.8, 12.8], cubes: [
    P([-2.0, 7.2, 11.0], [4.0, 2.8, 3.4], beardLow),
    P([-1.1, 6.0, 11.6], [2.2, 1.6, 2.2], beardLow),
  ] },
  { name: 'cap', parent: 'head', pivot: [0, 28.2, 9.2], cubes: [
    P([-1.5, 27.6, 7.7], [3.0, 0.9, 3.0], calyxCore),
    ...sepals(false), ...sepals(true),
  ] },
  { name: 'stem', parent: 'cap', pivot: [0, 28.4, 9.2], cubes: stem },
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
      // the berry-shaped fleece: broad and high at the shoulders, tapering to a point at the rump
      P([-8.4, 5.8, -4.0], [16.8, 13.4, 10.4], woolP),
      P([-7.2, 6.6, -12.0], [14.4, 11.6, 8.4], woolP),
      ...both(P([-9.6, 7.4, -2.6], [2.0, 10.2, 8.0], woolP), P([-9.0, 5.6, -8.4], [1.8, 6.4, 6.6], woolLow), P([-8.4, 9.2, -11.4], [1.6, 7.6, 6.0], woolP)),
      P([-6.6, 18.8, -3.4], [13.2, 2.8, 8.4], woolTop),
      P([-5.6, 17.8, -11.0], [11.2, 2.4, 8.2], woolTop),
      P([-3.6, 21.4, -1.6], [5.4, 1.4, 4.6], woolSmall), P([1.2, 20.0, -8.6], [4.0, 1.2, 3.8], woolSmall), P([-5.0, 19.8, -7.4], [3.6, 1.2, 3.6], woolSmall),
      P([-6.8, 6.6, 6.2], [13.6, 10.6, 2.0], woolP),
      P([-5.4, 5.6, 7.6], [10.8, 5.0, 1.4], woolLow),
      P([-5.6, 7.6, -13.4], [11.2, 9.0, 1.8], woolP),
      P([-3.2, 9.0, -14.4], [6.4, 5.4, 1.2], woolSmall),
      P([-7.0, 4.8, -10.4], [14.0, 1.4, 16.6], woolLow),
    ] },
    { name: 'tail', parent: 'body', pivot: [0, 13.4, -14.0], cubes: [P([-1.5, 11.0, -16.4], [3.0, 3.4, 2.6], woolSmall), P([-0.9, 10.2, -16.8], [1.8, 1.4, 1.6], woolSmall)] },
    ...BLOOMS.map(([name, at, plane]) => ({ name, parent: 'body', pivot: at, cubes: bloom(at, plane) })),
    { name: 'neck', parent: 'trunk', pivot: [0, 16, 6], cubes: [
      P([-4.8, 13.0, 4.2], [9.6, 10.6, 7.6], woolP),
      P([-4.0, 11.2, 9.4], [8.0, 4.0, 3.4], woolLow),
    ] },
    ...HEAD_BONES,
    ...VINES.map(([name, b, turn, hgt, berry]) => ({ name, parent: 'root', pivot: b, cubes: vine(b, turn, hgt, berry) })),
  ],
};

// ---------------------------------------------------------------- particles of its own
defineFx('seed', { w: 3, h: 4, paint: (p) => { p.px(1, 0, C.seedHi); p.px(0, 1, C.seedHi); p.px(1, 1, C.seed); p.px(2, 1, C.seed); p.px(1, 2, C.seed); p.px(1, 3, C.seedLo); }, glow: true, life: [0.5, 0.8], size: [0.045, 0.03], speed: [1.2, 2.4], grav: 5, drag: 1.2, spread: 1, spin: 6 });
defineFx('blossom', { w: 7, h: 7, paint: (p, w, h) => blossomP(p, w, h), life: [1.3, 1.9], size: [0.075, 0.075], speed: [0.5, 1.3], grav: 0.4, drag: 2, spread: 1, flutter: true });
defineFx('berry', { w: 6, h: 7, paint: (p) => { for (let y = 2; y < 7; y++) { const hw = y < 5 ? 3 : y === 5 ? 2 : 1; for (let x = 3 - hw; x < 3 + hw; x++) p.px(x, y, x < 3 - hw + 1 && y < 5 ? C.w0 : (x + y) % 3 === 0 ? C.seed : C.w2); } p.px(1, 1, C.g2); p.px(2, 1, C.g1); p.px(3, 1, C.g2); p.px(4, 1, C.g2); p.px(2, 0, C.g3); }, life: [0.9, 1.3], size: [0.07, 0.07], speed: [1.2, 2.2], grav: 5, drag: 0.8, spread: 0.9, spin: 5 });
defineFx('mote', { w: 5, h: 5, paint: (p) => { for (let i = 0; i < 5; i++) { p.px(2, i, i === 2 ? '#ffffff' : '#c8ff9a'); p.px(i, 2, i === 2 ? '#ffffff' : '#c8ff9a'); } }, glow: true, life: [0.8, 1.3], size: [0.06, 0.02], speed: [0.4, 0.9], grav: -1.4, drag: 1, spread: 0.8, wob: 1 });

// ---------------------------------------------------------------- animation
export const anim = {
  start: 'idle', seed: 5,
  breathe: { bone: 'body', amp: 0.02, per: 3.2 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.6], dur: 0.15 },
  look: { bone: 'head', yaw: 22, pitch: 10, speed: 3.2 },
  springs: [
    { bone: 'beard', tip: [0, -4, 1], k: 150, d: 8, gain: 0.9, max: 18, axes: [1, 0.4, 1] },
    { bone: 'beardTip', tip: [0, -4, 0.5], k: 120, d: 7, gain: 1.0, max: 22, axes: [1, 0.4, 1] },
    { bone: 'earR', tip: [-4.2, -1.5, 0], k: 140, d: 8, gain: 0.8, max: 24 },
    { bone: 'earL', tip: [4.2, -1.5, 0], k: 140, d: 8, gain: 0.8, max: 24 },
    { bone: 'stem', tip: [0, 3, -1.5], k: 120, d: 6, gain: 1.0, max: 26 },
    { bone: 'cap', tip: [0, 1.5, 0], k: 260, d: 12, gain: 0.5, max: 10 },
    { bone: 'tail', tip: [0, -1, -2.5], k: 170, d: 8, gain: 1.0, max: 26 },
  ],
  faces: {
    eyes: { default: 'calm', states: Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eye-' + k]])) },
    calyx: { default: 'normal', states: { normal: ['cx'], glow: ['cx-glow'] } },
    vines: { default: 'off', states: { off: [], on: ['vine'] } },
    bloom: { default: 'off', states: { off: [], on: ['bloom'] } },
  },
  clips: {
    idle: { len: 4, loop: true, f(P, t) {
      const br = Math.sin((t / 2) * Math.PI * 2);
      P.sq('body', br * 0.02).rot('head', br * 1.5, 0, 0);
      for (const v of ['vineFR', 'vineFL', 'vineBR', 'vineBL']) P.scl(v, 0.001);
      for (const b of ['bloomA', 'bloomB', 'bloomC', 'bloomD', 'bloomE']) P.scl(b, 0.001);
    } },
  },
};
def.anim = anim;
