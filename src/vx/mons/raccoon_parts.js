// Shared parts for the Trashcoon line (Trashcoon → Dynacoon → Hellcoon), the AC/DC homage:
// raccoon fur, bandit masks, ringed tails with little bolt notches, sharp bandit eyes, junk
// materials (cardboard, tape, soda cans, sticks, TNT, leather, iron, galvanised lids, rusty
// pipe, bronze) and a tiny FK/IK rig so paws stay on a stick, a fuse or a pair of handlebars
// while everything else bounces. Original designs only — no logos, covers or likenesses.
import * as THREE from '../../../vendor/three.module.js';
import { defineFx } from '../fx.js';
import { poly, ramp, shift, mix, h2 } from './kit.js';

export { shift, mix, h2, poly, ramp };
const D2R = Math.PI / 180;

// ---------------------------------------------------------------- palettes
// one fur family per stage: alley grey → soot grey → near-black with silver tips
export const PAL = {
  trash: {
    c: '#928b8c', hi: '#bdb5b2', lo: '#6b6367', deep: '#463f47', tip: '#d8d0cc',
    cream: '#ece6db', creamHi: '#fffbf3', creamLo: '#bdb3a8',
    mask: '#28232e', maskHi: '#433d4b', maskLo: '#17131b',
    belly: '#c2b8b2', bellyHi: '#ddd4cc', bellyLo: '#9a8f8c',
    paw: '#4a434c', pawHi: '#6c646e', pawLo: '#2e2930',
    ringD: '#2e282e', ringL: '#c2bab6', bolt: '#e8c870',
    nose: '#1d1921', noseHi: '#6c6476', ink: '#17121b',
  },
  dyna: {
    c: '#6f6a78', hi: '#959099', lo: '#4c4756', deep: '#302c38', tip: '#b8b2bc',
    cream: '#ddd4c6', creamHi: '#f4ecdf', creamLo: '#a89c90',
    mask: '#1d1922', maskHi: '#35303c', maskLo: '#0f0c12',
    belly: '#9a929a', bellyHi: '#b8b0b6', bellyLo: '#726a74',
    paw: '#2a2530', pawHi: '#4a4352', pawLo: '#16131a',
    ringD: '#211d26', ringL: '#9e979f', bolt: '#f0c84a',
    nose: '#151118', noseHi: '#5a5262', ink: '#120e15',
    scar: '#c98c8e', scarLo: '#8e5058',
  },
  hell: {
    c: '#4d4956', hi: '#726c7c', lo: '#34303c', deep: '#201d26', tip: '#a8a2b0',
    cream: '#cfc6ba', creamHi: '#e8e0d4', creamLo: '#988e84',
    mask: '#131016', maskHi: '#2a2530', maskLo: '#08060a',
    belly: '#6e6872', bellyHi: '#8a848e', bellyLo: '#4e4854',
    paw: '#1f1b24', pawHi: '#3c3644', pawLo: '#0f0c12',
    ringD: '#16121a', ringL: '#8a8490', bolt: '#ff9a3a',
    nose: '#100c12', noseHi: '#4a4252', ink: '#0c090e',
    scar: '#b87a7e', scarLo: '#7a4048',
  },
};
// junk materials
export const J = {
  // corrugated kraft cardboard
  card: '#c49a62', cardHi: '#e0b97e', cardLo: '#9a7444', cardDeep: '#6a4c2c', cardIn: '#e8cf9c',
  tape: '#e6d6a2', tapeHi: '#f6ecc4', tapeLo: '#bca878',
  marker: '#24202a', print: '#c8302e',
  // soda can
  can: '#d42e36', canHi: '#f4605c', canLo: '#8e1626', canDeep: '#5a0c18', alu: '#cfd3da', aluHi: '#f4f6fa', aluLo: '#8a909c', wave: '#f6f2ea',
  // stick
  bark: '#7c5636', barkHi: '#a07450', barkLo: '#54381f', barkDeep: '#3a2614', wood: '#e2bc84', woodLo: '#b88c58', leaf: '#6aa443', leafHi: '#9ccc5c', leafLo: '#3e7428',
  band: '#e04a4a', bandLo: '#a02a32',
  // bottle cap
  capR: '#d8302e', capRHi: '#ff7058', capRLo: '#8a1820',
  // TNT
  tnt: '#cf2a22', tntHi: '#ff5c42', tntLo: '#8a1418', tntDeep: '#58080e', paper: '#eadcbc', paperLo: '#bca886', stencil: '#1d1418',
  fuse: '#4a3c30', fuseHi: '#7a6650', fuseLo: '#2a2018',
  // leather (bandolier, jacket)
  leather: '#5c3a22', leatherHi: '#86583a', leatherLo: '#3a2414',
  black: '#1f1d24', blackHi: '#403d4a', blackLo: '#111015', gloss: '#7c7a8c',
  brass: '#d6ac4a', brassHi: '#fbe08c', brassLo: '#946a1e',
  // school blazer (torn velvet)
  vel: '#2d6646', velHi: '#4a9466', velLo: '#1b4230', velDeep: '#0f281b', pipe: '#d8b44a',
  // iron, steel, rust, bronze
  iron: '#4a4e58', ironHi: '#7c828e', ironLo: '#2b2d35', ironDeep: '#1a1b21',
  rust: '#9a5530', rustHi: '#c27a44', rustLo: '#62341c',
  galv: '#a9b0b8', galvHi: '#d8dde2', galvLo: '#727a84', galvDeep: '#4c525c',
  chrome: ['#ffffff', '#dfe6f2', '#a8b2c8', '#5a6284', '#7a84a8', '#98a2c0'],
  bronze: '#c08a3a', bronzeHi: '#f0c070', bronzeLo: '#7e5420', bronzeDeep: '#4a3010',
  devil: '#c4202a', devilHi: '#ff5a4a', devilLo: '#7a0e18', devilDeep: '#420610',
};

// ---------------------------------------------------------------- tiny helpers
export const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
// the same cube on the other side of the model (x → −x), texture mirrored
export const mirrorCube = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: !c.mirror, ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]], rot: c.rot ? [c.rot[0], -c.rot[1], -c.rot[2]] : undefined } : {}) });
const fill = (p, w, h, fn) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x, y); if (c !== null) p.px(x, y, c); } };
const side = (f) => f === 'south' || f === 'north' || f === 'east' || f === 'west';
const _m4 = new THREE.Matrix4(), _eu = new THREE.Euler();
// Euler XYZ (degrees) that turns local +x toward `dir` (local +y as close as possible to `up`)
export function aimX(dir, up = [0, 1, 0]) {
  const x = new THREE.Vector3(...dir).normalize(), u = new THREE.Vector3(...up);
  const z = new THREE.Vector3().crossVectors(x, u); if (z.lengthSq() < 1e-8) z.set(0, 0, 1); z.normalize();
  const y = new THREE.Vector3().crossVectors(z, x);
  _eu.setFromRotationMatrix(_m4.makeBasis(x, y, z), 'XYZ');
  return [_eu.x / D2R, _eu.y / D2R, _eu.z / D2R];
}
// Euler XYZ (degrees) that turns local +z toward `fwd` (local +x toward `sideV`)
export function aimZ(fwd, sideV = [1, 0, 0]) {
  const z = new THREE.Vector3(...fwd).normalize(), x = new THREE.Vector3(...sideV);
  x.addScaledVector(z, -x.dot(z)); if (x.lengthSq() < 1e-8) x.set(0, 1, 0).addScaledVector(z, -z.y);
  x.normalize();
  const y = new THREE.Vector3().crossVectors(z, x);
  _eu.setFromRotationMatrix(_m4.makeBasis(x, y, z), 'XYZ');
  return [_eu.x / D2R, _eu.y / D2R, _eu.z / D2R];
}
// a box spanning a → b (a rod: pipe, stick, strap), w × t thick, its long axis local z
export function rod(a, b, w, t, tex, x = {}) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d) + (x.over ?? 0), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const { over, sideV, ...rest } = x;
  return { o: [m[0] - w / 2, m[1] - t / 2, m[2] - L / 2], s: [w, t, L], pivot: m, rot: aimZ(d, sideV || [1, 0, 0]), tex, ...rest };
}

// ---------------------------------------------------------------- fur
// fur: clean top-lit bands (mostly mid-tone), staggered soft hair clumps — a little "v" of a
// darker tone with a lit pixel above — and, where asked, a jagged fringe along the bottom edge
export function furP(F, o = {}) {
  const c = o.c || F.c, top = o.top || F.hi, bot = o.bottom || F.lo, sx = o.sx || 7, sy = o.sy || 6;
  return (p, w, h, face) => {
    const band = (x, y) => (face === 'up' ? top : face === 'down' ? shift(bot, -0.1) : ramp([top, c, c, bot], h > 1 ? y / (h - 1) : 0.5, x, y));
    fill(p, w, h, band);
    if (face === 'down') return;
    for (let r = 0, y = o.y0 ?? 2; y < h - 1; y += sy, r++) for (let x = (r % 2) * (sx >> 1) + 1; x < w - 2; x += sx) {
      const b = band(x, y);
      p.px(x, y, shift(b, -0.09)); p.px(x + 1, y + 1, shift(b, -0.13)); p.px(x + 2, y, shift(b, -0.09));
      if (y > 0) p.px(x + 1, y - 1, shift(b, 0.07));
      if (o.tips && h2(x, y, 5) < 0.3) p.px(x + 1, y - 1 >= 0 ? y - 1 : y, F.tip);
    }
    if (face === 'up' || face === 'plane') return;
    if (o.rim !== false) for (let x = 0; x < w; x++) p.px(x, 0, shift(top, 0.06));
    if (o.fringe && h > 3) for (let x = 0; x < w; x++) { const k = x % 3 === 1 ? 2 : 1; for (let y = h - k; y < h; y++) p.px(x, y, shift(bot, -0.16)); }
  };
}
// fur with a pale belly patch on the front face (soft ragged edge, a few fur marks)
export function bellyP(F, o = {}) {
  const fur = furP(F, o);
  return (p, w, h, face, cube) => {
    fur(p, w, h, face, cube);
    if (face !== 'south') return;
    const cx = w / 2 - 0.5, cy = h * (o.cy ?? 0.62), rx = w * (o.rx ?? 0.36), ry = h * (o.ry ?? 0.6);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2, jag = ((x * 2 + y) % 4) * 0.04;
      if (d > 1 - jag) continue;
      p.px(x, y, d > 0.82 - jag ? F.bellyLo : ramp([F.bellyHi, F.belly, F.belly, F.bellyLo], (y - (cy - ry)) / (2 * ry), x, y));
    }
    for (let y = Math.round(cy - ry * 0.4); y < h - 2; y += 4) for (let x = Math.round(cx - rx * 0.5) + ((y >> 2) % 2) * 2; x < cx + rx * 0.5; x += 4) { p.px(x, y, F.bellyLo); p.px(x + 1, y + 1, shift(F.bellyLo, 0.06)); }
  };
}
// a flat cut-out tuft (cheek ruffs, elbows, bangs): jagged strands pointing toward +x of the texture
export const tuftP = (F, o = {}) => (p, w, h) => {
  for (let y = 0; y < h; y++) {
    const l = Math.round(w * (0.35 + 0.65 * Math.abs(Math.sin(y * 1.25 + (o.ph || 0)))));
    for (let x = w - l; x < w; x++) p.px(x, y, x === w - l ? (o.cream ? F.creamLo : F.lo) : (o.cream ? (x < w - l + 2 ? F.cream : F.creamHi) : y % 3 === 0 ? F.hi : F.c));
  }
};
// hanging bangs (planes): fur spikes pointing down from the top edge
export const bangsP = (F, o = {}) => (p, w, h) => {
  for (let x = 0; x < w; x++) {
    const k = x % 4, l = Math.round(h * (k === 1 ? 1 : k === 2 ? 0.7 : k === 3 ? 0.45 : 0.25) * (o.k || 1));
    for (let y = 0; y < l; y++) p.px(x, y, y === l - 1 ? F.lo : k === 1 ? F.hi : F.c);
  }
};

// ---------------------------------------------------------------- the face
// skull painter: fur everywhere, the bandit mask on the front wrapping round the sides, pale
// brows arching over it, the dark forehead stripe, pale cheeks. o: { ex, ey (eye centre: texels
// from the face centre / from the top), mask: 'domino' | 'bar' (a censor bar), scar }
export function skullP(F, o = {}) {
  const fur = furP(F, { sx: 8, sy: 6 });
  const ex = o.ex ?? 7.5, ey = o.ey ?? 9.5, bar = o.mask === 'bar';
  const mh = o.mh ?? 4.6;
  const mtop = (dx) => (bar ? ey - mh : dx < 1.5 ? ey - mh + 2.4 : ey - mh + Math.max(0, dx - ex - 2.5) * 0.5);
  const mbot = (dx) => (bar ? ey + mh - 0.6 : dx < 1.2 ? ey + mh + 1 : ey + mh - 0.4 + Math.max(0, dx - ex) * 0.6);
  return (p, w, h, face, cube) => {
    fur(p, w, h, face, cube);
    if (face === 'south') {
      const cx = (w - 1) / 2;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = Math.abs(x - cx), t = mtop(dx), b = mbot(dx);
        if (y >= t && y <= b) { p.px(x, y, y < t + 1 ? F.maskHi : y > b - 1 && !bar ? F.maskLo : F.mask); continue; }
        if (!bar && y < t && dx >= 1.5) {   // the pale brow band arching over each eye patch
          const bt = t - 3.2 + Math.abs(dx - ex) * 0.16;
          if (y >= bt && dx < ex + 5) { p.px(x, y, y < bt + 1 ? F.creamHi : F.cream); continue; }
        }
        if (y < t && dx < 1.4 + y * 0.08) { p.px(x, y, y < 2 ? F.lo : F.deep); continue; }   // the forehead stripe
        if (y > b && dx >= 1.2) p.px(x, y, ramp([F.creamHi, F.cream, F.cream, F.creamLo], (y - b) / Math.max(1, h - b), x, y));
      }
      if (bar) for (let x = 2; x < w - 2; x += 5) p.px(x, Math.round(ey - 3.4), F.maskHi);
      if (o.scar) {   // a pale scar slashing across the brow and the mask
        const x0 = Math.round(cx + ex - 4), y0 = Math.round(ey - 8);
        for (let k = 0; k < 12; k++) { const X = Math.round(x0 + k * 0.55); p.px(X, y0 + k, F.scar); if (k % 3 === 1) { p.px(X - 1, y0 + k, F.scarLo); p.px(X + 1, y0 + k, F.scarLo); } }
      }
    }
    if (face === 'east' || face === 'west') {
      // the mask wraps back toward the ears, drooping and narrowing
      const edge = (w * 0 + (cube ? cube.s[0] * 3 : 30) - 1) / 2;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const f = face === 'east' ? x : w - 1 - x, lim = w * (bar ? 0.3 : 0.4);
        if (f > lim) continue;
        const t = mtop(edge) + f * 0.3, b = mbot(edge) - f * 0.55;
        if (t > b) continue;
        if (y >= t && y <= b) p.px(x, y, F.mask);
        else if (y > b && y < h - 1) p.px(x, y, ramp([F.cream, F.creamLo], (y - b) / Math.max(1, h - b), x, y));
      }
    }
  };
}
// the muzzle: pale, with the mask's dark bridge running down its top to the nose
export function muzzleP(F, o = {}) {
  return (p, w, h, face) => {
    fill(p, w, h, (x, y) => (face === 'up' ? F.creamHi : face === 'down' ? F.creamLo : ramp([F.creamHi, F.cream, F.cream, F.creamLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
    const cx = (w - 1) / 2;
    if (face === 'up' && o.bridge !== false) for (let y = 0; y < h; y++) { const hw = (o.bw ?? 1.8) - (y / h) * (o.bt ?? 1.0); for (let x = 0; x < w; x++) if (Math.abs(x - cx) < hw) p.px(x, y, y < h * 0.6 ? F.mask : F.deep); }
    if (face === 'south' && o.mouth) {   // philtrum and a mouth line curling up at one corner (the smirk)
      p.vl(Math.round(cx), Math.max(0, h - 3), h - 2, F.ink);
      for (let x = 1; x < w - 1; x++) p.px(x, h - 1, F.ink);
      p.px(w - 2, h - 2, F.ink); p.px(w - 1, h - 3, F.ink);
    }
    if (face === 'east' || face === 'west') {
      for (let x = 0; x < w; x++) p.px(x, h - 1, o.mouth ? F.ink : F.creamLo);
      for (let k = 0; k < 3; k++) { const x = Math.round(w * 0.35) + k * 2, y = Math.round(h * 0.5) + (k % 2); p.px(face === 'east' ? x : w - 1 - x, y, F.creamLo); }
      if (o.bridge !== false) for (let x = 0; x < w; x++) p.px(x, 0, F.c);
    }
  };
}
export const noseP = (F) => (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? F.noseHi : y < 1 ? shift(F.nose, 0.16) : F.nose));
  if (face === 'south' && w > 3) { p.px(1, 0, F.noseHi); p.px(2, 0, shift(F.noseHi, 0.15)); p.px(Math.floor(w / 2), h - 1, F.ink); }
};
export const jawP = (F) => (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? F.cream : face === 'down' ? F.creamLo : ramp([F.cream, F.cream, F.creamLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (face === 'south' || face === 'east' || face === 'west') for (let x = 0; x < w; x++) p.px(x, 0, F.ink);
};
export const mouthP = (p, w, h) => { p.rect(0, 0, w, h, '#3a0a14'); p.rect(1, 1, Math.max(1, w - 2), Math.max(1, h - 2), '#62121e'); };
export const tongueP = (p, w, h) => fill(p, w, h, (x, y) => (x === 0 || x === w - 1 ? '#b42c46' : y === 0 ? '#ff95a5' : '#e65a74'));
export const toothP = (p, w, h, face) => { fill(p, w, h, (x, y) => (y < h * 0.4 ? '#fffbf0' : y < h * 0.8 ? '#f0e4c8' : '#c8b896')); if (face === 'south') p.px(0, 0, '#ffffff'); };
// ears: stepped boxes, rimmed in white, dark inside
export const earP = (F, part) => (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? F.creamHi : face === 'down' ? F.lo : ramp([F.hi, F.c, F.lo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (face === 'south') fill(p, w, h, (x, y) => (x === 0 || x === w - 1 || (part === 'tip' && y === 0) ? F.creamHi : part === 'tip' ? F.cream : y === 0 && part === 'mid' ? F.creamLo : x === 1 || x === w - 2 ? F.maskHi : F.mask));
  else if (face === 'north') fill(p, w, h, (x, y) => (x === 0 || x === w - 1 || (part === 'tip' && y < 2) ? F.cream : ramp([F.c, F.lo], y / Math.max(1, h - 1), x, y)));
  else if (face === 'east' || face === 'west') fill(p, w, h, (x, y) => (y === 0 && part === 'tip' ? F.creamHi : x === 0 || x === w - 1 ? F.cream : F.c));
};
// whiskers: long pale strands, darker roots
export const whiskerP = (p, w, h) => { for (const [y0, sl] of [[h * 0.25, -0.12], [h * 0.85, 0.06]]) for (let x = 0; x < w; x++) { const y = Math.round(y0 + (w - x) * sl); if (x < w - 1 || y % 2) p.px(x, y, x > w * 0.75 ? '#a8a0a8' : '#f6f2ee'); } };

// ---------------------------------------------------------------- eyes
// sharp bandit eyes: an almond with a straight hard upper lid that slants toward the snout, a
// lash flick at the outer corner, a small slit pupil. Shapes are authored in a 10 × 7 space and
// scaled to the plane's texture; x = 0 is the outer corner. o: { lid (lid row at the outer
// corner), slope, low (lower-lid row), curve, ix, iy, ir (iris), pupil: 'slit' | 'dot', glint }
export function eyeShape(p, o = {}) {
  const W = p.w, H = p.h, kx = 10 / W, ky = 7 / H;
  const lid = o.lid ?? 1.6, slope = o.slope ?? 0.2, low = o.low ?? 5.6;
  const top = (X) => lid + slope * X, bot = (X) => low - Math.abs(X - (o.lowAt ?? 5.5)) ** 2 * (o.curve ?? 0.05);
  const ix = o.ix ?? 6, iy = o.iy ?? 3.6, ir = o.ir ?? 2.2;
  const G = o.colors || EYE_TRASH.colors;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const X = (x + 0.5) * kx, Y = (y + 0.5) * ky, t = top(X), b = bot(X);
    if (Y < t - ky || Y > b + ky) continue;
    if (Y < t || Y > b || x === 0 || x === W - 1) { p.px(x, y, G.ink); continue; }
    const dx = (X - ix) / kx, dy = (Y - iy) / ky, d = Math.hypot(dx, dy), R = ir / kx;
    if (d < R) {
      const pupil = o.pupil === 'dot' ? d < 1.2 : Math.abs(dx) < 0.62 && Math.abs(dy) < (o.slitH ?? 1.1) / ky;
      p.px(x, y, pupil ? G.pupil : d > R - 0.9 ? G.irisLo : dy > 0.5 ? G.irisHi : G.iris);
    } else p.px(x, y, Y < t + ky ? G.scleraLo : G.sclera);
  }
  for (let x = 0; x < W; x++) p.px(x, Math.floor(top((x + 0.5) * kx) / ky) - 1, G.ink);              // the hard lid line
  if (o.flick !== false) { const y0 = Math.floor(top(0.5 * kx) / ky) - 2; p.px(0, y0, G.ink); p.px(1, y0, G.ink); p.px(0, y0 - 1, G.ink); }
  if (o.glint && G.glint !== null) p.px(Math.round((ix - ir * 0.5) / kx), Math.round((iy - ir * 0.45) / ky), G.glint || '#ffffff');
}
// the full set of expression textures for one eye style
export function eyeSet(style = {}) {
  const C = style.colors, ink = (C && C.ink) || '#120e15';
  const base = (o) => (p) => eyeShape(p, { colors: C, pupil: style.pupil, glint: style.glint, ...o });
  return {
    sly: base({ lid: 1.5, slope: 0.2, low: 6.1, lowAt: 4.5, curve: 0.07, ix: 5.9, iy: 4.1, ir: 2.35 }),
    glare: base({ lid: 1.2, slope: 0.36, low: 6.0, lowAt: 4.0, curve: 0.06, ix: 5.6, iy: 4.5, ir: 2.1, slitH: 0.9 }),
    wide: base({ lid: 0.6, slope: 0.04, low: 6.5, curve: 0.06, ix: 5.2, iy: 3.6, ir: 1.9, pupil: 'dot', flick: false, glint: false }),
    smug: base({ lid: 2.7, slope: -0.02, low: 5.8, lowAt: 5, curve: 0.1, ix: 5.6, iy: 4.6, ir: 2.2 }),
    closed: (p) => { const W = p.w, H = p.h; for (let x = 0; x < W; x++) { const y = Math.round((3.4 + Math.abs(x * 10 / W - 5) * 0.1 + x * 10 / W * 0.12) * H / 7); p.px(x, y, ink); if (x > 0 && x < W - 1) p.px(x, y - 1, ink); } p.px(0, Math.round(2 * H / 7), ink); p.px(1, Math.round(2 * H / 7), ink); },
    hurt: (p) => { const W = p.w, H = p.h, m = Math.round(H / 2); for (let i = 0; i < m; i++) { const x = Math.round(W * 0.2) + i; p.px(x, m - 1 - i, ink); p.px(x + 1, m - 1 - i, ink); p.px(x, m + i - 1, ink); p.px(x + 1, m + i - 1, ink); } },
    x: (p) => { const W = p.w, H = p.h, n = Math.min(W, H) - 1, x0 = Math.round((W - n) / 2); for (let i = 0; i < n; i++) { p.px(x0 + i, i, ink); p.px(x0 + i + 1, i, ink); p.px(x0 + n - i, i, ink); p.px(x0 + n - i - 1, i, ink); } },
    swirl: (p) => { const W = p.w, H = p.h; for (let a = 0; a < 14; a += 0.15) { const r = a * 0.26, x = Math.round(W / 2 + Math.cos(a) * r * W / 9), y = Math.round(H / 2 + Math.sin(a) * r * H / 8); if (r < 3.6) p.px(x, y, style.swirl || '#e8e2d6'); } },
  };
}
// pale eye-whites read inside the black mask; glowing eyes (stages 2–3) have no whites at all
export const EYE_TRASH = { colors: { sclera: '#f2ead4', scleraLo: '#c9bda6', iris: '#e8a42c', irisHi: '#ffd664', irisLo: '#9c5a14', pupil: '#1a1012', ink: '#120e15', glint: '#ffffff' }, glint: true };

// ---------------------------------------------------------------- the ringed tail
// rings alternate dark / pale along the tail with a tiny zig-zag edge; every dark ring carries a
// little bolt-shaped notch (the wink at the bolt in the band's name). s0 = tail length (texels) at
// this segment's root end, so neighbouring segments continue the rings. Segments run along local −z.
const BOLT = ['..##', '.##.', '####', '.##.', '##..'];
export function tailP(F, s0 = 0, o = {}) {
  const per = o.per || 13, dk = o.dark || 7, tipAt = o.tipAt ?? 1e9;
  return (p, w, h, face, cube) => {
    const L = Math.round(cube.s[2] * 3);
    const map = (x, y) => (face === 'east' ? [x, y] : face === 'west' ? [L - 1 - x, y] : face === 'up' ? [h - 1 - y, x] : face === 'down' ? [y, x] : face === 'south' ? [0, x] : [L - 1, x]);
    const across = face === 'east' || face === 'west' ? h : w;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const [a, c] = map(x, y), s = s0 + a, zz = (c % 3 === 1) ? 1 : 0;
      const v = face === 'up' ? 0 : face === 'down' ? 1 : c / Math.max(1, across - 1);
      let col;
      if (s >= tipAt) col = ramp([F.maskHi, F.mask, F.mask, F.maskLo], v, x, y);
      else {
        const k = (((s + zz) % per) + per) % per, dark = k < dk;
        col = dark ? ramp([F.maskHi, F.ringD, F.ringD, F.maskLo], v, x, y) : ramp([F.tip, F.ringL, F.ringL, shift(F.ringL, -0.2)], v, x, y);
        if (!dark && k === per - 1) col = shift(col, -0.1);
      }
      p.px(x, y, col);
    }
    if (o.bolts === false) return;
    if (face === 'east' || face === 'west' || face === 'up') {
      for (let k = Math.floor(s0 / per) - 1; k * per < s0 + L; k++) {
        if (k * per + dk > tipAt) continue;
        const a0 = k * per - s0 + Math.floor((dk - 4) / 2), c0 = Math.round(across / 2 - 2.5 + ((k * 3) % 3) - 1);
        BOLT.forEach((row, i) => [...row].forEach((ch, j) => {
          if (ch !== '#') return;
          const a = a0 + j, c = c0 + i; if (a < 0 || a >= L || c < 0 || c >= across) return;
          p.px(face === 'east' ? a : face === 'west' ? L - 1 - a : c, face === 'up' ? h - 1 - a : c, F.bolt);
        }));
      }
    }
  };
}

// ---------------------------------------------------------------- paws
// little dexterous raccoon hands: dark, knuckle creases, pale finger pads underneath
export const handP = (F) => (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? F.pawHi : face === 'down' ? F.paw : ramp([F.pawHi, F.paw, F.pawLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  const q = (k) => Math.round((k * w) / 4);
  if (face === 'down') { for (let k = 0; k < 4; k++) { p.px(q(k) + 1, 1, '#6a6070'); p.px(q(k) + 1, h - 2, '#5a5262'); } p.rect(1, Math.floor(h / 2) - 1, w - 2, 2, '#4a4252'); }
  if (face === 'south' || face === 'north') { for (let k = 1; k < 4; k++) p.vl(q(k), Math.floor(h * 0.45), h - 1, F.pawLo); for (let k = 0; k < 4; k++) p.px(q(k) + 1, h - 1, '#d8d0c8'); }
  if (face === 'east' || face === 'west') { for (let x = 1; x < w - 1; x++) p.px(x, Math.floor(h * 0.45), F.pawLo); }
};
// long plantigrade hind feet: dark, five toes and pale claws at the front
export const footP = (F) => (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? F.pawHi : face === 'down' ? F.pawLo : ramp([F.pawHi, F.paw, F.pawLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  const q = (k) => Math.round((k * w) / 5);
  if (face === 'up') { for (let k = 1; k < 5; k++) for (let y = h - 4; y < h; y++) p.px(q(k), y, F.pawLo); for (let y = 2; y < h - 6; y += 3) p.px(Math.floor(w / 2), y, F.paw); }
  if (face === 'south') { for (let k = 0; k < 5; k++) { p.px(q(k) + 1, h - 1, '#e8e0d4'); p.px(q(k) + 1, h - 2, '#bdb2a6'); } for (let k = 1; k < 5; k++) p.vl(q(k), 0, h - 1, F.pawLo); }
};

// ---------------------------------------------------------------- junk materials
// corrugated cardboard: clean bands, faint flutes, the cut edge showing its corrugation along
// the top; o: { tape: [[x0, x1]] vertical tape strips, arrows: true (a "this way up" mark), torn }
export function cardP(o = {}) {
  return (p, w, h, face) => {
    const base = (x, y) => (face === 'up' ? (o.upFlat ? J.cardHi : ramp([J.cardHi, J.card], y / Math.max(1, h - 1) * 0.8, x, y)) : face === 'down' ? J.cardDeep : ramp([J.cardHi, J.card, J.cardLo], h > 1 ? y / (h - 1) : 0.5, x, y));
    fill(p, w, h, (x, y) => { const c = base(x, y); return (face === 'up' ? y : x) % 3 === 0 ? shift(c, -0.045) : c; });
    if (side(face) && o.edge !== false && h > 2) { for (let x = 0; x < w; x++) p.px(x, 0, x % 2 ? J.cardIn : J.cardHi); }
    if (o.stains && side(face) && w > 10) for (const [u, v, r] of [[0.22, 0.55, 1.6], [0.7, 0.4, 1.2]]) { const cx = u * w, cy = v * h; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - cx, (y - cy) * 1.3); if (d < r + 0.6 && d > r - 0.6) p.px(x, y, shift(J.card, -0.1)); } }
    if (side(face) && h > 3) for (let x = 0; x < w; x++) p.px(x, h - 1, J.cardDeep);
    for (const [a, b] of o.tape || []) {
      if (!(face === 'south' || face === 'north' || face === 'east' || face === 'west' || face === 'up')) continue;
      const x0 = Math.round(a * w), x1 = Math.round(b * w);
      for (let y = 0; y < h; y++) for (let x = x0; x <= x1; x++) p.px(x, y, x === x0 || x === x1 ? J.tapeLo : (y + x) % 7 === 0 ? J.tapeHi : J.tape);
    }
    if (o.arrows && (face === 'east' || face === 'west') && h >= 6 && w >= 12) {   // the "this way up" mark: two arrows over a bar
      const y0 = 1, y1 = h - 2, x0 = Math.round(w * (o.arrowsAt ?? 0.3));
      for (const ax of [x0, x0 + 4]) { p.vl(ax, y0 + 1, y1 - 1, J.print); p.px(ax, y0, J.print); p.px(ax - 1, y0 + 1, J.print); p.px(ax + 1, y0 + 1, J.print); }
      p.hl(x0 - 2, x0 + 6, y1, J.print);
    }
  };
}
// a strip of masking tape (cubes), crinkled
export const tapeP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'down' ? J.tapeLo : (x + y * 3) % 7 === 0 ? J.tapeHi : (x * 5 + y) % 11 === 0 ? J.tapeLo : J.tape));
// a crimped bottle cap seen face-on (planes) or as a short box: red with a pale ring and teeth
export const bottleCapP = (c = J.capR, hi = J.capRHi, lo = J.capRLo) => (p, w, h, face) => {
  if (face === 'up' || face === 'plane' || face === 'south') {
    const cx = (w - 1) / 2, cy = (h - 1) / 2, r = Math.min(w, h) / 2;
    fill(p, w, h, (x, y) => { const d = Math.hypot(x - cx, y - cy); if (d > r + 0.2) return face === 'plane' ? null : lo; const a = Math.atan2(y - cy, x - cx); if (d > r - 1) return Math.round((a / Math.PI) * 8) % 2 ? lo : c; return d > r - 2 ? J.aluHi : x + y < w - 1 ? hi : c; });
    return;
  }
  fill(p, w, h, (x) => (x % 2 ? lo : c));
};
// soda can sheet metal: red with a pale wave, aluminium crimps
export const canP = (o = {}) => (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'down' ? J.canDeep : ramp([J.canHi, J.can, J.canLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (face === 'plane' || face === 'south') {
    for (let x = 0; x < w; x++) { const y = Math.round(h * 0.5 + Math.sin(x * 0.9) * 1.4); p.px(x, y, J.wave); p.px(x, y + 1, J.wave); }
  }
};
// the soda-can tie: a flattened can cut to a tie shape — crimped knot, wave stripe, pointed end
export const tieP = (p, w, h) => {
  const cx = (w - 1) / 2;
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1), hw = (y < 2 ? 0.32 : 0.32 + Math.min(1, (t - 0.1) / 0.6) * 0.68) * (w / 2), tip = t > 0.82 ? (1 - (t - 0.82) / 0.18) : 1;
    for (let x = 0; x < w; x++) {
      const dx = Math.abs(x - cx); if (dx > hw * tip + 0.3) continue;
      const edge = dx > hw * tip - 0.9;
      let col = edge ? J.canDeep : x < cx - hw * 0.3 ? J.canHi : J.can;
      if (y === 1 || y === h - 3) col = J.alu;
      if (Math.abs(y - (h * 0.42 + Math.sin(x * 1.3) * 1.2)) < 0.8) col = J.wave;
      if (y > h * 0.55 && y < h * 0.58) col = J.aluLo;
      p.px(x, y, col);
    }
  }
};
// the pull tab (tie knot): aluminium with its hole
export const tabP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? J.aluHi : face === 'down' ? J.aluLo : ramp([J.aluHi, J.alu, J.aluLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (face === 'south' && w > 2 && h > 2) { p.rect(1, Math.floor(h / 2), w - 2, Math.max(1, Math.floor(h / 2) - 1), '#3a2e34'); p.px(0, 0, '#ffffff'); }
};
// bark: a stick along local x (ends are the east/west faces), knot rings, a red rubber-band string
export const barkP = (o = {}) => (p, w, h, face) => {
  if (face === 'east' || face === 'west') { const cx = (w - 1) / 2, cy = (h - 1) / 2; fill(p, w, h, (x, y) => { const d = Math.hypot(x - cx, y - cy); return d > Math.min(w, h) / 2 - 0.6 ? J.barkLo : d > 1 ? J.wood : J.woodLo; }); return; }
  fill(p, w, h, (x, y) => (face === 'up' ? J.barkHi : face === 'down' ? J.barkDeep : ramp([J.barkHi, J.bark, J.barkLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  for (let x = 2; x < w; x += 5 + (x % 3)) for (let y = 0; y < h; y++) if ((x + y) % 4 !== 0) p.px(x, y, face === 'up' ? J.bark : J.barkLo);
  for (let x = 4; x < w; x += 9) { p.px(x, Math.floor(h / 2), J.barkDeep); p.px(x + 1, Math.floor(h / 2), J.barkHi); }
  if (o.string && face === 'south') for (let x = o.s0 ?? 0; x < w - (o.s1 ?? 0); x++) { p.px(x, Math.floor(h / 2), J.band); p.px(x, Math.floor(h / 2) + 1, x % 4 ? J.bandLo : J.band); }
};
export const leafP = (p, w, h) => {
  const cx = (w - 1) / 2;
  for (let y = 0; y < h; y++) { const hw = Math.sin(((y + 0.5) / h) * Math.PI) * (w / 2); for (let x = 0; x < w; x++) { const dx = x - cx; if (Math.abs(dx) > hw) continue; p.px(x, y, Math.abs(dx) < 0.6 ? J.leafLo : dx < 0 ? J.leafHi : J.leaf); } }
};

// ---------------------------------------------------------------- FK / IK rig
// rig(def) gives a clip the model-space frame of any bone (from the rest pose + this frame's
// offsets in P), and a two-bone arm solver: arm bones hang along −y at rest, the forearm bone
// carries `hand` (its grip point, model coordinates). The solver writes absolute angles into the
// pose (offset = wanted − rest), so it must run after the clip has posed the bones above it.
const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
export function rig(def) {
  const B = Object.fromEntries(def.bones.map((b) => [b.name, b]));
  const Z = { r: [0, 0, 0], p: [0, 0, 0], s: [1, 1, 1] };
  const get = (P, n) => (P && P.b && P.b[n]) || Z;
  const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  function frame(P, n) {
    const b = B[n], o = get(P, n), par = b.parent ? B[b.parent] : null, pp = par ? par.pivot : [0, 0, 0], r = b.rot || [0, 0, 0];
    const M = new THREE.Matrix4().compose(
      _p.set(b.pivot[0] - pp[0] + o.p[0], b.pivot[1] - pp[1] + o.p[1], b.pivot[2] - pp[2] + o.p[2]),
      _q.setFromEuler(_e.set((r[0] + o.r[0]) * D2R, (r[1] + o.r[1]) * D2R, (r[2] + o.r[2]) * D2R)),
      _s.set(o.s[0], o.s[1], o.s[2]));
    return par ? frame(P, par.name).multiply(M) : M;
  }
  // where a point (model coordinates at rest, carried by bone n) is now, in model space
  const at = (P, n, pt) => V(pt).sub(V(B[n].pivot)).applyMatrix4(frame(P, n));
  const setAbs = (P, n, a) => { const r = B[n].rot || [0, 0, 0]; if (!P) { B[n].rot = a.slice(); return; } const o = P.b[n]; if (!o) return; o.r[0] = a[0] - r[0]; o.r[1] = a[1] - r[1]; o.r[2] = a[2] - r[2]; };
  // solve arm + fore so the hand reaches `target` (model space). o: { pole: elbow direction
  // (parent space), w: blend weight with whatever the clip already wrote }
  function reach(P, arm, fore, target, o = {}) {
    const A = B[arm], F = B[fore], par = A.parent;
    const T = target.clone().applyMatrix4(frame(P, par).invert()).add(V(B[par].pivot));
    const S = V(A.pivot).add(V(get(P, arm).p));
    const Lu = V(F.pivot).distanceTo(V(A.pivot)), Lf = V(F.hand).distanceTo(V(F.pivot));
    const d = T.clone().sub(S); let L = d.length();
    const u = L > 1e-6 ? d.clone().divideScalar(L) : new THREE.Vector3(0, -1, 0);
    L = Math.min(Lu + Lf - 1e-3, Math.max(Math.abs(Lu - Lf) + 1e-3, L));
    const a = (Lu * Lu - Lf * Lf + L * L) / (2 * L), hh = Math.sqrt(Math.max(0, Lu * Lu - a * a));
    const pole = V(o.pole || [0, -0.3, -1]);
    let n = pole.clone().addScaledVector(u, -pole.dot(u)); if (n.lengthSq() < 1e-8) n = new THREE.Vector3(0, 0, -1).addScaledVector(u, -u.z); n.normalize();
    const E = S.clone().addScaledVector(u, a).addScaledVector(n, hh), Tc = S.clone().addScaledVector(u, L);
    const y1 = S.clone().sub(E).normalize(), f = Tc.clone().sub(E).normalize();
    let z1 = f.clone().addScaledVector(y1, -f.dot(y1)); if (z1.lengthSq() < 1e-6) z1 = n.clone().negate().addScaledVector(y1, n.dot(y1)); z1.normalize();
    const x1 = new THREE.Vector3().crossVectors(y1, z1);
    const M1 = new THREE.Matrix4().makeBasis(x1, y1, z1), e1 = new THREE.Euler().setFromRotationMatrix(M1, 'XYZ');
    const fl = f.clone().applyMatrix4(M1.clone().transpose()), al = Math.atan2(-fl.z, -fl.y);
    const wA = [e1.x / D2R, e1.y / D2R, e1.z / D2R], wF = [al / D2R, 0, 0], w = o.w ?? 1;
    if (P && w < 1) {
      const ra = A.rot || [0, 0, 0], rf = F.rot || [0, 0, 0], oa = P.b[arm].r, of = P.b[fore].r;
      for (let i = 0; i < 3; i++) { wA[i] = ra[i] + oa[i] + (wA[i] - ra[i] - oa[i]) * w; wF[i] = rf[i] + of[i] + (wF[i] - rf[i] - of[i]) * w; }
    }
    setAbs(P, arm, wA); setAbs(P, fore, wF);
    return E;
  }
  return { B, frame, at, reach, V };
}

// ---------------------------------------------------------------- shared effects
defineFx('splinter', { w: 4, h: 4, frames: [(p) => { p.px(0, 0, J.wood); p.px(1, 1, J.wood); p.px(2, 2, J.woodLo); p.px(1, 0, J.barkHi); p.px(3, 3, J.bark); }, (p) => { p.px(0, 2, J.bark); p.px(1, 2, J.wood); p.px(2, 1, J.wood); p.px(3, 1, J.woodLo); }], life: [0.5, 0.9], size: [0.05, 0.05], speed: [1.8, 3.4], grav: 9, drag: 0.5, spread: 0.7, spin: 10 });
defineFx('cardbit', { w: 4, h: 4, frames: [(p) => { p.rect(0, 0, 4, 3, J.card); p.hl(0, 3, 0, J.cardHi); p.px(3, 3, J.cardLo); }, (p) => { p.rect(0, 1, 3, 3, J.cardLo); p.px(0, 1, J.cardHi); p.px(3, 0, J.card); }], life: [0.7, 1.2], size: [0.06, 0.06], speed: [1, 2.2], grav: 3.5, drag: 1.8, spread: 1, flutter: true });
// a big chunky lightning bolt (yellow-white), for the "Thunder" strike
defineFx('thunder', {
  w: 12, h: 30, frames: [0, 1].map((k) => (p, w, h) => {
    let x = k ? 7 : 4; const pts = [];
    for (let y = 0; y < h; y++) { pts.push(x); if (y % 6 === 5) x += (y % 12 === 5 ? 3 : -3) * (k ? -1 : 1); x = Math.max(2, Math.min(w - 3, x)); }
    pts.forEach((cx, y) => { const hw = y < 3 ? 1 : 2; for (let i = -hw; i <= hw; i++) p.px(cx + i, y, Math.abs(i) < 1 ? '#ffffff' : Math.abs(i) < 2 ? '#fff4a0' : '#ffd03a'); });
  }),
  glow: true, life: [0.12, 0.2], size: [0.7, 0.75], speed: [0, 0], grav: 0, spread: 0, fps: 24,
});
// a riff note: a glowing yellow eighth note
defineFx('riff', {
  w: 8, h: 11, frames: ['#ffe24a', '#fff2a8'].map((c) => (p, w, h) => { p.rect(0, h - 4, 4, 3, c); p.px(4, h - 3, c); p.vl(3, 1, h - 4, c); p.rect(4, 1, 2, 2, c); p.px(6, 3, c); p.px(6, 4, c); p.px(1, h - 4, '#ffffff'); }),
  glow: true, life: [0.8, 1.2], size: [0.12, 0.1], speed: [1.6, 2.6], grav: -0.2, drag: 1.4, spread: 0.5, wob: 1.2, fade: true, tint: [[1, 1, 1], [1, 0.9, 0.6]],
});
// a shockwave ring with little zig-zag teeth
defineFx('shockring', {
  w: 40, h: 40, paint: (p, w, h) => {
    const m = (w - 1) / 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const a = Math.atan2(y - m, x - m), r = Math.hypot(x - m, y - m), R = m - 1.5 + ((Math.round((a / Math.PI) * 12) % 2) ? 1.2 : -0.6);
      if (Math.abs(r - R) < 1.1) p.px(x, y, r > R ? '#ffd23a' : '#fffbe0');
    }
  },
  glow: true, life: [0.3, 0.3], size: [0.15, 1.3], speed: [0, 0], grav: 0, fade: true,
});
