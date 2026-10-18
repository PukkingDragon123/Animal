// Strawbaa — the grass starter. A baby strawberry lamb: a big round head, a chubby little body of fluffy
// strawberry wool (red, pale seed dots, soft cream highlights) on stubby legs, a leafy calyx worn like a
// beret (a strawberry blossom tucked in it) with a tiny curly stem, big glossy kawaii eyes, rosy cheeks and a
// tiny ω mouth. A little red bandana bib nods to the old country songs it is named after.
// Gentle, sleepy and clumsy — but it hops straight in when a friend gets hurt, and heals with hearts,
// berries and blossoms.
import * as THREE from '../../../vendor/three.module.js';
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import { defineFx } from '../fx.js';
import { ramp, h2 } from './kit.js';

const C = {
  ink: '#3a0f26',
  // strawberry fleece: red puffs, soft cream highlights, pale seeds
  wHi: '#ffe4d8', w0: '#ff8e9c', w1: '#f4475f', w2: '#dc3350', w3: '#b42349', w4: '#7c1640', w5: '#500c2e',
  seed: '#fff0b4', seedHi: '#fffbe8', seedLo: '#e6c47e', pit: '#a81c44',
  // calyx, stem, runners
  g0: '#d6f69c', g1: '#90d966', g2: '#58b24c', g3: '#307a40', g4: '#1a4a2e',
  st0: '#8cc250', st1: '#609c40', st2: '#3e6e30',
  // cream face (the berry's white flesh), ears and legs
  f0: '#fffaf2', f1: '#fdf0e0', f2: '#f6dec8', f3: '#e6c2ac',
  pink: '#ffb6c4', pinkLo: '#f28ca2', blush: '#ff98ae', blushHi: '#ffc6d2', nose: '#e8788a', noseLo: '#bc5068',
  // hooves
  k0: '#b8766e', k1: '#8e4e50', k2: '#62303a',
  // mouth
  lip: '#5a1a2e', mouth: '#7a1c34', tongue: '#ff7c94',
  // kawaii eyes: a dark berry-tinted iris, lighter berry red in its lower third
  eyeLine: '#1a0a16', eyeIris: '#2e1232', eyeA: '#6c2450', eyeB: '#a83c68',
  // blossoms
  p0: '#fffdf6', p1: '#f4ece2', p2: '#e6ccd2', core: '#ffd23e',
  // bandana bib
  band: ['#f05450', '#d42834', '#a01828', '#64101c'],
};
const D2R = Math.PI / 180, TAU = Math.PI * 2;

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
// boxes strung along a polyline (stems, runners): size(i, n) → [width, thickness], tex(i, n) → painter
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
// strawberry wool: rows of round puffs (a cream-lit crown, a shadowed rim underneath) shingled over a top-lit
// ramp, dotted with pale seeds sitting in little dimples on a loose diagonal lattice
const W_LIT = [C.wHi, C.w0, C.w1, C.w2], W_MID = [C.w0, C.w1, C.w1, C.w2, C.w3], W_RIM = [C.w2, C.w3, C.w3, C.w4, C.w5];
function seedAt(p, x, y) {
  p.px(x, y - 1, C.pit);
  p.px(x, y, C.seedHi); p.px(x + 1, y, C.seed); p.px(x, y + 1, C.seed); p.px(x + 1, y + 1, C.seedLo);
}
function wool(o = {}) {
  const S = o.size ?? 12, RH = o.row ?? 6;
  return (p, w, h, face, cube) => {
    const up = face === 'up', dn = face === 'down';
    const T = (y) => (up ? 0.0 : dn ? 0.85 : (o.t0 ?? 0.05) + (o.t1 ?? 0.45) * T01(y, h));
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
        // a soft cream glint on the crown of some puffs
        const gx = Math.round(cx - rx * 0.4), gy = Math.round(cy - ry * 0.25);
        if (gx >= 0 && gx < w - 1 && gy >= 0 && gy < h && h2(k, r, sd + 1) > 0.5) { p.px(gx, gy, C.wHi); p.px(gx + 1, gy, C.wHi); p.px(gx + 1, gy - 1, C.wHi); }
      }
    }
    if (o.seeds === 0 || dn) return;
    const SX = o.sx ?? 11, SY = o.sy ?? 8;
    for (let r = 0, y = 3 + (sd % 4); y < h - 2; y += SY, r++) for (let x = 2 + ((r & 1) ? SX >> 1 : 0) + (sd % 5); x < w - 2; x += SX) {
      if (h2(x, y, sd) > (o.seeds ?? 0.85)) continue;
      seedAt(p, x, y);
    }
  };
}
const woolP = wool(), woolTop = wool({ t0: 0.0, t1: 0.3 }), woolSmall = wool({ size: 9, row: 5, sx: 8, sy: 6 });
// smooth cream skin, softly top-lit, a pale rim along the top edge
function skin(o = {}) {
  const cols = o.cols || [C.f0, C.f1, C.f1, C.f2];
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? cols[0] : face === 'down' ? C.f3 : ramp(cols, T01(y, h), x, y));
    if (face !== 'up' && face !== 'down' && o.rim !== false) for (let x = 0; x < w; x++) p.px(x, 0, '#ffffff');
  };
}
const skinP = skin(), legP = skin({ cols: [C.f1, C.f1, C.f2, C.f3] }), snoutSkin = skin({ cols: [C.f0, C.f1, C.f2] });
// the face: cream with rosy cheek blush under each eye (the eyes and mouth are separate planes)
const EYE_Y = [14.9, 18.5], EYE_X = [1.25, 4.25];   // |x| range of each eye on the face
function faceFront(p, w, h, face, cube) {
  skinP(p, w, h, face, cube);
  if (face !== 'south') return;
  const X = (mx) => (mx - cube.o[0]) * 3, Y = (my) => (cube.o[1] + cube.s[1] - my) * 3;
  for (const s of [-1, 1]) {
    const cx = X(s * 3.45), cy = Y(14.05);
    for (let y = Math.floor(cy - 2); y <= Math.ceil(cy + 2); y++) for (let x = Math.floor(cx - 4); x <= Math.ceil(cx + 4); x++) {
      const d = ((x - cx) / 3.6) ** 2 + ((y - cy) / 1.6) ** 2; if (d > 1) continue;
      p.px(x, y, d < 0.3 && x < cx ? C.blushHi : d > 0.75 && (x + y) % 2 ? C.f1 : C.blush);
    }
  }
}
// the little snout: cream, with a pink button nose at the top of its front face
function snoutP(p, w, h, face, cube) {
  snoutSkin(p, w, h, face, cube);
  if (face !== 'south') return;
  const cx = w / 2 - 0.5;
  for (let y = 0; y < 3; y++) for (let x = 0; x < w; x++) { const half = 2.4 - y * 0.8; if (Math.abs(x - cx) <= half) p.px(x, y, y === 0 && Math.abs(x - cx) < half - 0.6 ? C.pink : Math.abs(x - cx) > half - 0.9 ? C.noseLo : C.nose); }
  p.px(Math.round(cx), 3, C.noseLo);
}
// floppy ears: cream outside, pink inside (the front face), a rounded tip at texture x = w - 1
function earP(p, w, h, face, cube) {
  skinP(p, w, h, face, cube);
  if (face === 'south') for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) p.px(x, y, Math.abs(y - (h - 1) / 2) < 0.8 && x < w - 3 ? C.pinkLo : C.pink);
  if (face === 'south' || face === 'north') { p.px(w - 1, 0, C.f3); p.px(w - 1, h - 1, C.f3); }
}
// hooves: soft rose-brown, a lit rim, the cloven split down the front
function hoofP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.k0 : face === 'down' ? C.k2 : ramp([C.k0, C.k1, C.k1, C.k2], T01(y, h), x, y));
  if (face === 'south') for (let y = 1; y < h; y++) p.px(Math.floor(w / 2), y, C.k2);
  if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) p.px(x, 0, '#d4968c');
}
// the bandana bib: red cloth with white polka dots and a darker hem
function bibP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.band[0] : face === 'down' ? C.band[3] : ramp(C.band.slice(0, 3), T01(y, h), x, y));
  if (face !== 'south' && face !== 'north') return;
  for (let y = 1; y < h - 1; y += 2) for (let x = 1 + ((y >> 1) % 2) * 2; x < w - 1; x += 4) p.px(x, y, '#fff4ec');
  for (let x = 0; x < w; x++) p.px(x, h - 1, C.band[2]);
}

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
const calyxCore = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? ((x + y) % 3 ? C.g2 : C.g1) : face === 'down' ? C.g4 : y === 0 ? C.g1 : C.g3); };
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
// healing runners: a twisting green vine, lighter along the top
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

// ---------------------------------------------------------------- eyes and mouth
// kawaii eyes (recent-gen style): a big rounded eye with a 1-texel dark outline, a dark berry-tinted iris that
// lightens to berry red in its lower third, a big white catchlight high on the outer side and a small glint low
// on the inner side. 9 × 11 texels, outer corner at x = 0 (the left eye is mirrored).
// '#' outline · 'k' iris · 'a' / 'b' the lighter lower gradient · 'o' white
const EYE_MAPS = {
  open:    ['..#####..', '.#kkkkk#.', '#ookkkkk#', '#oookkkk#', '#ookkkkk#', '#kkkkkkk#', '#kkkkkkk#', '#aaaaaaa#', '#bbbbbob#', '.#bbbbb#.', '..#####..'],
  // angry: a flat lid line cuts the top, tilted down toward the nose
  angry:   ['.........', '.........', '###......', '#oo####..', '#oookk###', '#ookkkkk#', '#kkkkkkk#', '#aaaaaaa#', '#bbbbbob#', '.#bbbbb#.', '..#####..'],
  // sad: the lid tilts the other way, down toward the outer corner
  sad:     ['.........', '.........', '......###', '..####kk#', '###kkkkk#', '#ookkkkk#', '#ookkkkk#', '#aaaaaaa#', '#bbbbbob#', '.#bbbbb#.', '..#####..'],
  // half: sleepy, a level lid across the middle
  half:    ['.........', '.........', '.........', '.........', '#########', '#ookkkkk#', '#kkkkkkk#', '#aaaaaaa#', '#bbbbbob#', '.#bbbbb#.', '..#####..'],
  closed:  ['.........', '.........', '.........', '.........', '.........', '.........', '##.....##', '.#######.', '..#####..', '.........', '.........'],
  sleep:   ['.........', '.........', '.........', '.........', '.........', '.........', '.........', '##.....##', '.#######.', '..#####..', '.........'],
  happy:   ['.........', '.........', '.........', '...###...', '..#####..', '.##...##.', '##.....##', '#.......#', '.........', '.........', '.........'],
  squeeze: ['.........', '.........', '##.......', '.###.....', '...###...', '.....###.', '...###...', '.###.....', '##.......', '.........', '.........'],
  x:       ['.........', '.........', '##.....##', '.##...##.', '..##.##..', '...###...', '..##.##..', '.##...##.', '##.....##', '.........', '.........'],
};
const EYE_COL = { '#': C.eyeLine, k: C.eyeIris, a: C.eyeA, b: C.eyeB, o: '#ffffff' };
const EYES = Object.fromEntries(Object.entries(EYE_MAPS).map(([k, rows]) => [k, (p) => rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') p.px(x, y, EYE_COL[r[x]]); })]));
// the mouth: a tiny ω, a little smile, or wide open for a "baa"
const MOUTHS = {
  w: { w: 7, h: 3, rows: ['#..#..#', '.##.##.', '.......'] },
  smile: { w: 7, h: 3, rows: ['#.....#', '.#...#.', '..###..'] },
  open: { w: 6, h: 5, rows: ['.####.', '#mmmm#', '#mmmm#', '#tttt#', '.####.'] },
};
const mouthPaint = (m) => (p) => m.rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') p.px(x, y, r[x] === 'm' ? C.mouth : r[x] === 't' ? C.tongue : C.lip); });

// ---------------------------------------------------------------- the model
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const mirrorX = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]] } : {}), ...(c.rot ? { rot: [c.rot[0], -c.rot[1], -c.rot[2]] } : {}), mirror: !c.mirror });
const both = (...cs) => cs.flatMap((c) => [c, mirrorX(c)]);
// a rounded lump: three boxes, each full-size along one axis and inset by b along the other two
const lump = (c, s, b, tex, front) => [
  P([c[0] - s[0] / 2, c[1] - s[1] / 2 + b, c[2] - s[2] / 2 + b], [s[0], s[1] - 2 * b, s[2] - 2 * b], tex),
  P([c[0] - s[0] / 2 + b, c[1] - s[1] / 2, c[2] - s[2] / 2 + b], [s[0] - 2 * b, s[1], s[2] - 2 * b], tex),
  P([c[0] - s[0] / 2 + b, c[1] - s[1] / 2 + b, c[2] - s[2] / 2], [s[0] - 2 * b, s[1] - 2 * b, s[2]], tex, front ? { faces: { south: front } } : {}),
];
// the calyx beret: seven sepals around a little green dome, each a flat inner half and a drooping outer
// half so the brim curls over the head; the glowing copy swaps in during the heal
const CX = [0.3, 25.35, 4.6];
function sepals(glow) {
  const out = [], x = { id: glow ? 'cx-glow' : 'cx', hide: !!glow, ...(glow ? { glow: true } : {}) };
  for (let k = 0; k < 7; k++) {
    const phi = k * (360 / 7) + 12, li = 4.6, lo = 2.4, f = phi * D2R, a = li / (li + lo);
    const tip = [CX[0] + Math.sin(f) * li, CX[1], CX[2] + Math.cos(f) * li];
    out.push(leafAt(CX, li, 4.2, phi, 0, sepal(glow, 0, a), x), leafAt(tip, lo, 4.2, phi, 38, sepal(glow, a, 1), x));
  }
  return out;
}
const stem = chain([[0.3, 25.9, 4.6], [0.4, 27.0, 4.5], [0.6, 27.8, 3.9], [0.85, 27.7, 3.1], [1.0, 27.1, 2.9]], (i, n) => [0.95 - 0.3 * i / n, 0.95 - 0.3 * i / n], () => stemP, { over: 0.4 });
// healing runners (hidden until the special): little spiralling vines with leaflets, a berry or a blossom on top
function vine(base, turn, hgt, berry) {
  const pts = [];
  for (let k = 0; k <= 6; k++) { const a = turn + k * 1.0, r = 1.3 - k * 0.12; pts.push([base[0] + Math.cos(a) * r, base[1] + k * hgt / 6, base[2] + Math.sin(a) * r]); }
  const cs = chain(pts, (i, n) => [1.1 - 0.45 * i / n, 1.1 - 0.45 * i / n], () => vineP, { over: 0.4, extra: () => ({ id: 'vine', hide: true }) });
  [2, 4].forEach((k, j) => cs.push(leafAt(pts[k], 2.8, 2.2, (turn / D2R) + 70 + j * 160, -55, leafP, { id: 'vine', hide: true })));
  const t = pts[6];
  if (berry) cs.push(P([t[0] - 0.8, t[1] - 1.9, t[2] - 0.8], [1.6, 1.9, 1.6], berryP, { id: 'vine', hide: true }), leafAt([t[0], t[1], t[2]], 1.3, 1.5, 0, -10, sepal(false), { id: 'vine', hide: true }));
  else cs.push(P([t[0] - 1.4, t[1] + 0.2, t[2]], [2.8, 2.8, 0], blossomP, { plane: 'z', id: 'vine', hide: true }), P([t[0] - 0.4, t[1] + 1.2, t[2] - 0.3], [0.8, 0.8, 0.8], coreP, { id: 'vine', hide: true, outline: false }));
  return cs;
}
const bloom = (at, plane) => [
  P(plane === 'y' ? [at[0] - 1.4, at[1], at[2] - 1.4] : [at[0], at[1] - 1.4, at[2] - 1.4], plane === 'y' ? [2.8, 0, 2.8] : [0, 2.8, 2.8], blossomP, { plane, id: 'bloom', hide: true }),
  P([at[0] - 0.4 + (plane === 'x' ? Math.sign(at[0]) * 0.3 : 0), at[1] - 0.4 + (plane === 'y' ? 0.3 : 0), at[2] - 0.4], [0.8, 0.8, 0.8], coreP, { id: 'bloom', hide: true, outline: false }),
];
const BLOOMS = [['bloomA', [2.6, 14.25, -1.6], 'y'], ['bloomB', [-2.6, 14.25, -3.6], 'y'], ['bloomC', [7.55, 8.8, -0.6], 'x'], ['bloomD', [-7.55, 9.2, -2.8], 'x']];
const VINES = [['vineFR', [-10, 0, 5], 0.3, 9.5, true], ['vineFL', [10, 0, 4.5], 2.2, 8.5, false], ['vineBR', [-10, 0, -7.5], 4.0, 8, false], ['vineBL', [10, 0, -7], 5.4, 9.5, true]];
const eyeStates = (side) => Object.entries(EYES).map(([k, fn]) => P(side < 0 ? [-EYE_X[1], EYE_Y[0], 10.26] : [EYE_X[0], EYE_Y[0], 10.26], [EYE_X[1] - EYE_X[0], EYE_Y[1] - EYE_Y[0], 0], fn, { plane: 'z', mirror: side > 0, id: (side < 0 ? 'eyeR-' : 'eyeL-') + k, hide: k !== 'open' }));
const mouthStates = Object.entries(MOUTHS).map(([k, m]) => P([-m.w / 6, 14.0 - m.h / 3, 11.16], [m.w / 3, m.h / 3, 0], mouthPaint(m), { plane: 'z', id: 'mouth-' + k, hide: k !== 'w' }));

export const def = {
  name: 'strawbaa', ppu: 3, scale: 0.42, outline: { color: C.ink, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    // stubby legs hang from the root, so the hooves stay planted while the body bounces about
    ...[['legFR', -4.2, 1.8], ['legFL', 4.2, 1.8], ['legBR', -4.2, -5.2], ['legBL', 4.2, -5.2]].map(([name, x, z]) => ({ name, parent: 'root', pivot: [x, 5.0, z], cubes: [
      P([x - 1.5, 1.2, z - 1.5], [3.0, 4.6, 3.0], legP),
      P([x - 1.6, 0, z - 1.6], [3.2, 1.5, 3.2], hoofP),
    ] })),
    // the trunk pivots at the bottom of the body, so squash and stretch keep the lamb sitting on its legs
    { name: 'trunk', parent: 'root', pivot: [0, 3.0, -1.5], cubes: [] },
    { name: 'body', parent: 'trunk', pivot: [0, 7.0, -1.5], cubes: [
      // a chubby strawberry of a body: one big rounded puff, with smaller puffs to make it woolly
      ...lump([0, 8.0, -1.8], [15.0, 10.4, 13.6], 2.0, woolP),
      P([-4.6, 12.6, -5.8], [4.8, 1.6, 4.6], woolSmall), P([0.4, 12.8, -3.6], [4.4, 1.4, 4.0], woolSmall),
      ...both(P([-8.3, 6.0, -4.8], [1.0, 4.4, 5.0], woolSmall)),
      P([-3.4, 5.8, -9.4], [6.8, 4.8, 1.0], woolSmall),
      P([-4.4, 3.6, 3.8], [8.8, 3.4, 1.6], woolSmall),
    ] },
    // a little red polka-dot bandana bib
    { name: 'bib', parent: 'body', pivot: [0, 12.2, 5.4], rot: [-10, 0, 0], cubes: [
      P([-3.8, 10.8, 4.9], [7.6, 1.4, 0.6], bibP), P([-2.6, 9.4, 5.0], [5.2, 1.4, 0.6], bibP), P([-1.3, 8.2, 5.1], [2.6, 1.2, 0.6], bibP),
    ] },
    { name: 'tail', parent: 'body', pivot: [0, 8.6, -8.8], cubes: [
      P([-1.3, 7.2, -10.8], [2.6, 2.8, 2.2], woolSmall),
      ...[-40, 0, 40].map((a) => leafAt([0, 8.6, -8.9], 1.6, 1.4, 180 + a, 50, sepal(false))),
    ] },
    ...BLOOMS.map(([name, at, plane]) => ({ name, parent: 'body', pivot: at, cubes: bloom(at, plane) })),
    { name: 'head', parent: 'trunk', pivot: [0, 12.6, 3.4], cubes: [
      // a big round cream head under a hood of strawberry wool, with a fringe of bangs over the brow
      ...lump([0, 17.6, 5.4], [11.6, 10.4, 9.6], 1.2, skinP, faceFront),
      ...lump([0, 21.8, 4.65], [13.0, 6.2, 11.7], 2.0, woolTop),
      P([-4.4, 19.2, 10.3], [3.0, 1.6, 0.9], woolSmall), P([-1.5, 18.9, 10.4], [3.0, 1.8, 0.9], woolSmall), P([1.4, 19.3, 10.3], [3.0, 1.5, 0.9], woolSmall),
      P([-2.1, 12.6, 9.6], [4.2, 2.5, 1.5], snoutP),
      ...eyeStates(-1), ...eyeStates(1), ...mouthStates,
    ] },
    { name: 'earR', parent: 'head', pivot: [-5.4, 19.6, 4.6], rot: [0, -16, 56], cubes: [P([-9.4, 18.4, 4.1], [4.2, 2.4, 1.0], earP, { mirror: true })] },
    { name: 'earL', parent: 'head', pivot: [5.4, 19.6, 4.6], rot: [0, 16, -56], cubes: [P([5.2, 18.4, 4.1], [4.2, 2.4, 1.0], earP)] },
    // the calyx, worn like a beret, with a little strawberry blossom tucked in at the front
    { name: 'cap', parent: 'head', pivot: [0.3, 25.0, 4.6], rot: [3, 0, -6], cubes: [
      P([-1.5, 25.0, 2.8], [3.6, 1.1, 3.6], calyxCore),
      ...sepals(false), ...sepals(true),
      P([2.1, 25.5, 8.4], [3.2, 3.2, 0], blossomP, { plane: 'z', pivot: [3.7, 25.5, 8.4], rot: [-24, 16, -12] }),
      P([3.25, 26.65, 8.2], [0.9, 0.9, 0.9], coreP, { outline: false, pivot: [3.7, 25.5, 8.4], rot: [-24, 16, -12] }),
    ] },
    { name: 'stem', parent: 'cap', pivot: [0.3, 25.8, 4.6], cubes: stem },
    ...VINES.map(([name, b, turn, hgt, berry]) => ({ name, parent: 'root', pivot: b, cubes: vine(b, turn, hgt, berry) })),
  ],
  // mount points for buyable gear (model units, same space as cube origins); size = width of that part
  attach: {
    head: { bone: 'head', at: [0, 24.9, 4.6], size: 12 },     // top centre of the head (the calyx sits here)
    face: { bone: 'head', at: [0, 16.7, 10.3], size: 9 },     // between the eyes, on the face
    neck: { bone: 'body', at: [0, 11.8, 5.6], size: 8 },      // front of the neck, where the bib ties
    back: { bone: 'body', at: [0, 13.4, -2.0], size: 11 },    // middle of the back
  },
};

// ---------------------------------------------------------------- particles of its own
defineFx('seed', { w: 3, h: 4, paint: (p) => { p.px(1, 0, C.seedHi); p.px(0, 1, C.seedHi); p.px(1, 1, C.seed); p.px(2, 1, C.seed); p.px(1, 2, C.seed); p.px(1, 3, C.seedLo); }, glow: true, life: [0.5, 0.8], size: [0.045, 0.03], speed: [1.2, 2.4], grav: 5, drag: 1.2, spread: 1, spin: 6 });
defineFx('blossom', { w: 7, h: 7, paint: (p, w, h) => blossomP(p, w, h), life: [1.3, 1.9], size: [0.075, 0.075], speed: [0.5, 1.3], grav: 0.4, drag: 2, spread: 1, flutter: true });
defineFx('berry', { w: 6, h: 7, paint: (p) => { for (let y = 2; y < 7; y++) { const hw = y < 5 ? 3 : y === 5 ? 2 : 1; for (let x = 3 - hw; x < 3 + hw; x++) p.px(x, y, x < 3 - hw + 1 && y < 5 ? C.w0 : (x + y) % 3 === 0 ? C.seed : C.w2); } p.px(1, 1, C.g2); p.px(2, 1, C.g1); p.px(3, 1, C.g2); p.px(4, 1, C.g2); p.px(2, 0, C.g3); }, life: [0.9, 1.3], size: [0.07, 0.07], speed: [1.2, 2.2], grav: 5, drag: 0.8, spread: 0.9, spin: 5 });
defineFx('mote', { w: 5, h: 5, paint: (p) => { for (let i = 0; i < 5; i++) { p.px(2, i, i === 2 ? '#ffffff' : '#c8ff9a'); p.px(i, 2, i === 2 ? '#ffffff' : '#c8ff9a'); } }, glow: true, life: [0.8, 1.3], size: [0.06, 0.02], speed: [0.4, 0.9], grav: -1.4, drag: 1, spread: 0.8, wob: 1 });

// ---------------------------------------------------------------- animation
const PIV = Object.fromEntries(def.bones.map((b) => [b.name, b.pivot]));
const MOUTH = [0, 13.6, 11.4], BROW = [0, 19.6, 11.2], CROWN = [0.4, 28.4, 4.6], ZZ = [3.6, 25.5, 8];
const HOOF = { legFR: [-4.2, 0.3, 3.3], legFL: [4.2, 0.3, 3.3], legBR: [-4.2, 0.3, -3.7], legBL: [4.2, 0.3, -3.7] };
const T0 = PIV.trunk;
// where a point riding on the trunk ends up when the trunk pitches by a° and shifts by (dy, dz)
function onTrunk(pt, a, dy = 0, dz = 0) {
  const r = a * D2R, y = pt[1] - T0[1], z = pt[2] - T0[2];
  return [pt[0], T0[1] + y * Math.cos(r) - z * Math.sin(r) + dy, T0[2] + y * Math.sin(r) + z * Math.cos(r) + dz];
}
// the trunk heaves, surges, pitches (− nose up) and rolls; carry > 0 makes the front legs ride along with it
function trunk(P, { dy = 0, dz = 0, a = 0, roll = 0, yaw = 0, carry = 0 } = {}) {
  P.pos('trunk', 0, dy, dz).rot('trunk', a, yaw, roll);
  if (carry) for (const leg of ['legFR', 'legFL']) {
    const p0 = PIV[leg], p1 = onTrunk(p0, a, dy, dz);
    P.pos(leg, 0, (p1[1] - p0[1]) * carry, (p1[2] - p0[2]) * carry).rot(leg, a * carry, 0, 0);
  }
}
// all four legs tuck up under the body while airborne (front ones forward, hind ones back)
const tuck = (P, k) => P.rot('legFR', -28 * k).rot('legFL', -28 * k).rot('legBR', 28 * k).rot('legBL', 28 * k);
// lying on its side (fainted): rolled over onto the right flank about a point this high, so it lands where it stood
const SIDE = 8.0;
function keel(P, th, up = 0) { const r = th * D2R; P.rot('root', 0, 0, th).pos('root', SIDE * Math.sin(r), SIDE * (1 - Math.cos(r)) + up, 0); }
const splay = (P, k) => { for (const [leg, sx] of [['legFR', -1], ['legFL', 1], ['legBR', -1], ['legBL', 1]]) P.rot(leg, (leg[3] === 'F' ? -18 : 18) * k, 0, sx * 14 * k); };
const VN = VINES.map((v) => v[0]), BL = BLOOMS.map((b) => b[0]);

export const anim = {
  start: 'idle', seed: 5,
  breathe: { bone: 'body', amp: 0.015, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [1.8, 4.2], dur: 0.12 },
  look: { bone: 'head', yaw: 25, pitch: 12, speed: 4 },
  springs: [
    { bone: 'earR', tip: [-4.2, 0, 0], k: 105, d: 6, gain: 1.1, max: 30 },
    { bone: 'earL', tip: [4.2, 0, 0], k: 105, d: 6, gain: 1.1, max: 30 },
    { bone: 'cap', tip: [0, 1.5, 0], k: 190, d: 9, gain: 0.7, max: 12 },
    { bone: 'stem', tip: [0, 2, -0.5], k: 110, d: 5, gain: 1.2, max: 30 },
    { bone: 'tail', tip: [0, 0, -2], k: 150, d: 7, gain: 1.1, max: 30 },
    { bone: 'bib', tip: [0, -3, 0.5], k: 170, d: 8, gain: 0.7, max: 14 },
  ],
  faces: {
    eyes: { default: 'open', states: { ...Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eyeR-' + k, 'eyeL-' + k]])), wink: ['eyeR-open', 'eyeL-happy'] } },
    mouth: { default: 'w', states: Object.fromEntries(Object.keys(MOUTHS).map((k) => [k, ['mouth-' + k]])) },
    calyx: { default: 'normal', states: { normal: ['cx'], glow: ['cx-glow'] } },
    vines: { default: 'off', states: { off: [], on: ['vine'] } },
    bloom: { default: 'off', states: { off: [], on: ['bloom'] } },
  },
  fidget: { every: [4.5, 8], clips: ['baa', 'nod', 'shake'] },
  clips: {
    // a happy little bob on the spot; now and then a curious head tilt with a smile
    idle: { len: 3.2, loop: true, f(P, t) {
      const b = bounce(t, 0.8, { squash: 0.07, stretch: 0.03 });
      trunk(P, { dy: b.u * 0.5 }); P.sq('trunk', b.sq);
      const tilt = seg(t, 1.55, 1.8, E.back) * (1 - seg(t, 2.65, 3.0, E.inout));
      P.rot('head', 3.5 * Math.sin((t / 0.8) * TAU - 1.3), 8 * tilt, 3 * Math.sin((t / 1.6) * TAU + 0.5) + 16 * tilt);
      P.rot('tail', 0, 26 * Math.sin(t * 2.5 * TAU), 0);
      P.face('mouth', tilt > 0.4 ? 'smile' : undefined);
    } },
    // hop-hop: two bouncy little hops per cycle, legs tucked in the air, a clumsy sway from side to side
    walk: { len: 0.72, loop: true, f(P, t) {
      const h = hop(t, 0.36, 2.8, { crouch: 0.8, air: [0.18, 0.66] }), sd = Math.floor(t / 0.36) % 2 ? 1 : -1;
      const air = h.air ? Math.sin(h.k * Math.PI) : 0;
      P.pos('root', 0, Math.max(0, h.y), 0);
      trunk(P, { dy: Math.min(0, h.y) * 0.7, roll: 5 * sd * air, a: -5 * air });
      P.sq('trunk', h.sq); tuck(P, air);
      P.rot('head', -6 * air + (h.air ? 0 : 10 * Math.max(0, -h.sq)), 0, -5 * sd * air);
      P.rot('tail', 24 * air, 0, 0);
      P.face('mouth', 'smile');
      P.burst(0.24, 'dust', 'root', [0, 0.3, -1], { n: 2, speed: 0.5, spread: 1, scale: 0.4 }).burst(0.6, 'dust', 'root', [0, 0.3, -1], { n: 2, speed: 0.5, spread: 1, scale: 0.4 });
    } },
    // battle cry: crouches, hops up and lets out a brave little "BAA!", wool puffed right up
    cry: { len: 1.8, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.38, E.out));
      const air = t > 0.32 && t < 0.78 ? Math.sin(((t - 0.32) / 0.46) * Math.PI) : 0;
      const yell = seg(t, 0.38, 0.5, E.back) * (1 - seg(t, 1.3, 1.55, E.inout));
      P.pos('root', 0, 4.4 * air, 0);
      trunk(P, { dy: -1.0 * crouch });
      P.sq('trunk', -0.2 * crouch + 0.12 * air * (t < 0.55 ? 1 : 0) + wob(t, 0.78, -0.17, 2.8, 6));
      P.rot('head', 10 * crouch - 22 * yell + wave(t, 11) * 3 * yell, wave(t, 5) * 5 * yell, 0);
      P.scl('body', 1 + 0.12 * yell, 1 + 0.1 * yell, 1 + 0.12 * yell); tuck(P, air);
      P.face('eyes', crouch > 0.3 ? 'angry' : yell > 0.3 ? 'squeeze' : undefined).face('mouth', yell > 0.2 ? 'open' : undefined);
      P.blinkOK = yell < 0.1;
      for (const tt of [0.5, 0.75, 1.0]) P.burst(tt, 'ring', 'head', MOUTH, {});
      P.burst(0.52, 'seed', 'body', [0, 14, -2], { n: 10, speed: 1.5 }).burst(0.55, 'note', 'head', MOUTH, { n: 2, dir: [0, 1, 0.5], speed: 1.1 });
      P.burst(0.78, 'dust', 'root', [0, 0.3, 0], { n: 6, speed: 1.0, spread: 1, scale: 0.6 });
    } },
    // headbutt: a butt-wiggle and two scrapes, a hop-charge, BONK — stars and a ring — then a dizzy wobble
    attack: { len: 1.6, next: 'idle', f(P, t) {
      const lower = seg(t, 0, 0.25, E.out) * (1 - seg(t, 0.95, 1.3, E.inout));
      const wiggle = Math.sin(t * 7 * TAU) * seg(t, 0.06, 0.16) * (1 - seg(t, 0.4, 0.48));
      const z = key([[0, 0], [0.42, -1.2], [0.5, -1.4], [0.68, 8.0, 'in3'], [0.8, 4.4, 'out'], [0.95, 5.0, 'inout'], [1.45, 0, 'inout']], t);
      const air = t > 0.5 && t < 0.68 ? Math.sin(((t - 0.5) / 0.18) * Math.PI) : 0, imp = t > 0.68 ? Math.exp(-5 * (t - 0.68)) : 0;
      P.pos('root', 0, 2.0 * air, z);
      trunk(P, { a: 6 * lower - 6 * imp, yaw: 8 * wiggle, roll: 5 * wiggle, dy: -0.6 * lower });
      P.sq('trunk', wob(t, 0.68, -0.18, 3, 6)); tuck(P, air);
      const shake = Math.sin((t - 1.05) * 24) * seg(t, 1.05, 1.1) * (1 - seg(t, 1.2, 1.45));
      P.rot('head', 26 * lower - 14 * imp + wob(t, 0.68, -8, 3.5, 6), 12 * shake, 6 * Math.sin(t * 3 * TAU) * seg(t, 0.75, 0.8) * (1 - seg(t, 0.95, 1.05)));
      for (const t0 of [0.1, 0.27]) {
        const fw = seg(t, t0, t0 + 0.06, E.out) * (1 - seg(t, t0 + 0.07, t0 + 0.15, E.in));
        P.rot('legFR', -26 * fw).pos('legFR', 0, 1.0 * bump(t, t0, t0 + 0.08), 0);
        P.burst(t0 + 0.13, 'dust', 'legFR', HOOF.legFR, { n: 2, dir: [0, 0.4, -1], speed: 1.0, scale: 0.45 });
      }
      P.face('eyes', t < 0.68 ? 'angry' : t < 1.05 ? 'x' : t < 1.4 ? 'squeeze' : undefined).face('mouth', t > 0.66 && t < 1.0 ? 'open' : undefined);
      P.blinkOK = false;
      if (t > 0.5 && t < 0.68) P.stream('dust', 'root', [0, 0.3, -6], { rate: 30, dir: [0, 0.4, -1], speed: 0.7, spread: 0.6, scale: 0.5 });
      P.burst(0.68, 'ring', 'head', BROW, {}).burst(0.68, 'spark', 'head', BROW, { n: 2 }).burst(0.68, 'star', 'head', BROW, { n: 6, speed: 1.4 })
        .burst(0.69, 'dust', 'root', [0, 0.5, 14], { n: 8, speed: 1.4, spread: 1, scale: 0.75 }).burst(0.82, 'star', 'head', CROWN, { n: 3, speed: 0.4 });
    } },
    // heal: plants its hooves, then pops — the calyx glows, blossoms open in its wool, little runners spring up
    // around it, and hearts, berries and seed sparkles go bubbling up
    special: { len: 2.6, next: 'idle', f(P, t) {
      const plant = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 2.2, 2.55, E.inout)), pop = seg(t, 0.36, 0.6, E.back) * (1 - seg(t, 2.0, 2.45, E.inout));
      trunk(P, { dy: -0.8 * plant + 0.5 * pop });
      P.sq('trunk', -0.14 * plant * (1 - pop) + wob(t, 0.4, 0.08, 2.5, 5));
      for (const [leg, sx] of [['legFR', -1], ['legFL', 1], ['legBR', -1], ['legBL', 1]]) P.rot(leg, 0, 0, sx * 7 * plant);
      P.rot('head', 10 * plant - 16 * pop, 0, 9 * Math.sin(t * 1.3 * TAU) * pop);
      P.face('eyes', t < 0.4 ? 'closed' : 'happy').face('mouth', t > 0.38 && t < 0.95 ? 'open' : 'smile').face('calyx', t > 0.3 && t < 2.3 ? 'glow' : 'normal')
        .face('vines', t > 0.36 && t < 2.5 ? 'on' : 'off').face('bloom', t > 0.42 && t < 2.45 ? 'on' : 'off');
      P.blinkOK = false; P.lookW = 1 - pop;
      VN.forEach((v, i) => { const g = seg(t, 0.38 + i * 0.06, 0.66 + i * 0.06, E.back) * (1 - seg(t, 2.1 + i * 0.05, 2.45, E.in)); P.scl(v, Math.max(0.001, g)).rot(v, wave(t, 0.9, i) * 6 * g, wave(t, 0.5, i * 2) * 25 * g, wave(t, 0.7, i + 1) * 6 * g); });
      BL.forEach((b, i) => { const g = seg(t, 0.44 + i * 0.07, 0.68 + i * 0.07, E.back) * (1 - seg(t, 2.1 + i * 0.04, 2.4, E.in)); P.scl(b, Math.max(0.001, g)); });
      P.scl('body', 1 + 0.06 * pop).scl('cap', 1 + 0.2 * pop + 0.05 * wave(t, 2) * pop);
      P.burst(0.42, 'heart', 'head', CROWN, { n: 6, speed: 1.4, spread: 0.9 }).burst(0.45, 'berry', 'body', [0, 14, -2], { n: 6, speed: 1.8 }).burst(0.45, 'seed', 'body', [0, 14, -2], { n: 10, speed: 1.6 })
        .burst(0.4, 'leaf', 'root', [0, 1, 0], { n: 10, dir: [0, 1, 0], speed: 2.0, spread: 0.9 }).burst(0.42, 'petal', 'root', [0, 1, 0], { n: 12, dir: [0, 1, 0], speed: 1.9, spread: 0.9 })
        .burst(0.44, 'ring', 'root', [0, 2.5, 0], { tint: [0.75, 1.25, 0.7], scale: 1.8 }).burst(0.6, 'ring', 'root', [0, 2.5, 0], { tint: [1.25, 0.8, 0.95], scale: 1.3 })
        .burst(0.62, 'sparkle', 'cap', CROWN, { n: 8, speed: 1 });
      if (t > 0.6 && t < 2.1) {
        const sw = t * 5;
        P.stream('heart', 'body', [0, 15, -2], { rate: 6, dir: [0, 1, 0], speed: 0.9, spread: 0.6 })
          .stream('berry', 'body', [0, 14, -2], { rate: 2.5, dir: [0, 1, 0], speed: 1.4, spread: 0.8 })
          .stream('seed', 'root', [Math.cos(sw) * 9, 2, Math.sin(sw) * 9 - 1.5], { rate: 10, dir: [-Math.sin(sw), 1.4, Math.cos(sw)], speed: 1.4, spread: 0.3 })
          .stream('petal', 'root', [-Math.cos(sw) * 9, 2, -Math.sin(sw) * 9 - 1.5], { rate: 10, dir: [Math.sin(sw), 1.2, -Math.cos(sw)], speed: 1.4, spread: 0.3, key: 'b' })
          .stream('mote', 'root', [0, 3, -1], { rate: 8, spread: 1.2, speed: 0.9 });
      }
      P.burst(2.15, 'petal', 'body', [0, 14, -2], { n: 8, speed: 1.4 });
    } },
    hurt: { len: 0.6, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.06, E.out) * (1 - seg(t, 0.16, 0.6, E.inout));
      trunk(P, { dz: -1.8 * k, a: -7 * k, roll: 6 * k * wave(t, 10) });
      P.sq('trunk', -0.14 * k + wob(t, 0.16, 0.06, 3, 6)).scl('body', 1 + 0.08 * k).rot('head', -14 * k, 0, 9 * k);
      P.face('eyes', t < 0.4 ? 'squeeze' : t < 0.55 ? 'sad' : undefined).face('mouth', t < 0.35 ? 'open' : undefined); P.blinkOK = false;
      P.burst(0.02, 'seed', 'body', [0, 14, -2], { n: 8, speed: 1.2 }).burst(0.02, 'spark', 'head', BROW, {}).burst(0.03, 'leaf', 'body', [0, 13, 0], { n: 2 });
    } },
    // a sad, dizzy wobble, its little legs give way, and over it plops onto its side
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dz = seg(t, 0, 0.2) * (1 - seg(t, 0.85, 0.95)), sink = seg(t, 0.82, 1.0, E.in), fall = seg(t, 1.0, 1.36, E.in);
      trunk(P, { roll: 7 * Math.sin(t * 2.4 * TAU) * dz, dy: -1.2 * sink * (1 - fall) });
      P.rot('head', 5 * Math.sin(t * 2.4 * TAU + 1) * dz, 14 * Math.sin(t * 1.7 * TAU) * dz, 10 * Math.sin(t * 2.4 * TAU + 2) * dz - 12 * fall);
      for (const [leg, sx] of [['legFR', -1], ['legFL', 1], ['legBR', -1], ['legBL', 1]]) P.rot(leg, 0, 0, sx * 10 * sink * (1 - fall));
      splay(P, fall);
      keel(P, 90 * fall + (t > 1.36 ? wob(t, 1.36, 6, 3, 7) : 0), 1.6 * Math.sin(Math.PI * fall));
      P.face('eyes', t < 0.8 ? 'sad' : 'x').face('mouth', t > 0.9 ? 'open' : undefined); P.blinkOK = false; P.lookW = 1 - dz;
      P.burst(0.2, 'star', 'head', CROWN, { n: 4, speed: 0.5 }).burst(1.36, 'dust', 'root', [-3, 0.5, 0], { n: 8, speed: 1.1, spread: 1, scale: 0.75 }).burst(1.4, 'star', 'head', CROWN, { n: 3, speed: 0.6 });
    } },
    down: { len: 3, loop: true, f(P, t) {
      const br = Math.sin((t / 3) * TAU);
      keel(P, 90); splay(P, 1);
      P.sq('body', 0.04 * br).rot('head', 0, 0, -12);
      P.rot('legFL', 14 * bump(t, 1.8, 2.0)).rot('legBL', -10 * bump(t, 1.9, 2.15));
      P.face('eyes', 'x'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.3;
      P.burst(0.6, 'star', 'head', CROWN, { n: 2, speed: 0.3 });
    } },
    // victory: two happy hops and a big spinning one, hearts and sparkles, then a wink
    win: { len: 2.5, next: 'idle', f(P, t) {
      let y, sq;
      if (t < 0.9) { const h = hop(t, 0.45, 2.6, { crouch: 0.8 }); y = h.y; sq = h.sq; }
      else if (t < 1.9) { const h = hop(t - 0.9, 1.0, 6.0, { crouch: 1.5, air: [0.22, 0.7] }); y = h.y; sq = h.sq; }
      else { y = wob(t, 1.9, -0.5, 3, 6); sq = wob(t, 1.9, -0.12, 3, 6); }
      P.pos('root', 0, Math.max(0, y), 0); trunk(P, { dy: Math.min(0, y) * 0.7 }); P.sq('trunk', sq);
      P.rot('root', 0, 360 * seg(t, 1.15, 1.6, E.inout), 0);
      tuck(P, y > 0.5 ? Math.min(1, y / 2) : 0);
      P.rot('head', -10 * seg(t, 1.1, 1.3) * (1 - seg(t, 1.6, 1.9)), 0, 8 * Math.sin(t * 2 * TAU) * seg(t, 1.9, 2.0));
      P.rot('tail', 0, 30 * Math.sin(t * 3 * TAU), 0);
      P.face('eyes', t > 2.0 && t < 2.42 ? 'wink' : 'happy').face('mouth', t > 1.1 && t < 1.75 ? 'open' : 'smile'); P.blinkOK = false;
      P.burst(1.62, 'heart', 'head', CROWN, { n: 5, speed: 1.2, spread: 0.8 }).burst(1.9, 'sparkle', 'root', [0, 6, 0], { n: 10, speed: 1.4, spread: 1 }).burst(1.9, 'dust', 'root', [0, 0.3, 0], { n: 5, speed: 0.8, scale: 0.6 })
        .burst(0.45, 'dust', 'root', [0, 0.3, 0], { n: 2, speed: 0.4, scale: 0.4 });
    } },
    // asleep: curled up with its forelegs tucked in front, head drooping onto the ground, Z… Z…
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * TAU);
      trunk(P, { dy: -2.4 + 0.2 * br }); P.sq('trunk', -0.04 + 0.03 * br);
      for (const leg of ['legFR', 'legFL']) P.rot(leg, -84).pos(leg, 0, -3.3, 1.4);
      for (const [leg, sx] of [['legBR', -1], ['legBL', 1]]) P.rot(leg, -80, sx * 20, -sx * 8).pos(leg, sx * 0.4, -3.2, 0.4);
      P.rot('head', 15 + 3 * br, 0, 11).rot('earL', 0, 0, -14).rot('earR', 0, 0, 14);
      P.face('eyes', 'sleep').face('mouth', 'w'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(1.2, 'z', 'head', ZZ, {}).burst(2.6, 'z', 'head', ZZ, {});
    } },
    // fidget: a little "baa" — squash, then stretch up with the mouth wide open
    baa: { len: 1.3, next: 'idle', f(P, t) {
      const sq = seg(t, 0.05, 0.25, E.inout) * (1 - seg(t, 0.25, 0.33, E.out)), up = seg(t, 0.28, 0.42, E.back) * (1 - seg(t, 0.85, 1.1, E.inout));
      trunk(P, { dy: -0.6 * sq });
      P.sq('trunk', -0.18 * sq + 0.08 * up * (1 - seg(t, 0.45, 0.6)) + wob(t, 0.9, 0.05, 3, 6));
      P.rot('head', 8 * sq - 20 * up + wave(t, 9) * 2 * up, 0, 7 * up);
      P.face('mouth', up > 0.2 ? 'open' : undefined).face('eyes', up > 0.3 ? 'happy' : sq > 0.3 ? 'closed' : undefined); P.blinkOK = false;
      P.burst(0.42, 'heart', 'head', MOUTH, { n: 1, dir: [0, 1, 0.3], speed: 0.7 });
    } },
    // fidget: a sleepy nod — eyelids sag, the big head droops... and it jolts awake, ears flapping
    nod: { len: 2.8, next: 'idle', f(P, t) {
      const droop = seg(t, 0.1, 1.5, E.inout) * (1 - seg(t, 1.62, 1.72, E.out)), jolt = bump(t, 1.62, 1.95);
      trunk(P, { dy: -0.6 * droop });
      const shake = Math.sin((t - 2.0) * 20) * seg(t, 2.0, 2.05) * (1 - seg(t, 2.2, 2.45));
      P.rot('head', 24 * droop - 10 * jolt + wob(t, 1.7, 5, 3, 5), 10 * shake, 9 * droop);
      P.rot('earL', 0, 0, -14 * droop + 26 * jolt).rot('earR', 0, 0, 14 * droop - 26 * jolt);
      P.face('eyes', droop > 0.75 ? 'closed' : droop > 0.2 ? 'half' : undefined); P.blinkOK = droop < 0.05 && t > 2.3; P.lookW = 1 - droop;
      P.burst(1.66, 'sweat', 'head', [5, 22, 8], { n: 1, dir: [1, 1, 0], speed: 0.8 });
    } },
    // fidget: shakes out its fleece like a wet puppy — seeds fly — and wobbles, a little off balance
    shake: { len: 1.5, next: 'idle', f(P, t) {
      const k = seg(t, 0.05, 0.22) * (1 - seg(t, 0.9, 1.15)), osc = Math.sin(t * 6 * TAU);
      trunk(P, { roll: 12 * osc * k + wob(t, 1.1, 6, 2, 4), dy: 0.4 * k });
      P.rot('head', 0, -10 * osc * k, -12 * osc * k);
      P.scl('body', 1 + 0.06 * k * Math.abs(osc)).rot('tail', 0, 35 * osc * k, 0);
      P.face('eyes', k > 0.3 ? 'squeeze' : t > 1.1 ? 'happy' : undefined); P.blinkOK = k < 0.1;
      P.burst(0.35, 'seed', 'body', [0, 13, -2], { n: 8, speed: 1.4 }).burst(0.65, 'seed', 'body', [0, 11, -5], { n: 6, speed: 1.4 }).burst(0.5, 'leaf', 'body', [0, 13, 0], { n: 3, speed: 1.2 });
    } },
  },
};
def.anim = anim;
