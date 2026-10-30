// Animal folk: the people of Tokonmon San Francisco are anthropomorphic animals and fantasy creatures,
// built as blocky chibis on top of anime.js. This module holds:
// - the species catalogue: fur colours, ears, horns, muzzle, eyes, tail and markings
// - the 3D parts: box ears and horns, and a muzzle box whose front face repaints its nose and mouth per
//   expression; tails hang on a springy bone
// - pixel animal eyes for the face layer (mons/animal_eyes.js)
import * as THREE from '../../../vendor/three.module.js';
import { animalEye } from '../mons/animal_eyes.js';

export const ANIMALS = {
  fox:     { fur: '#e8743a', fur2: '#fff2e2', dark: '#5a2a14', ear: 'pointy', earIn: '#fff2e2', earTip: '#2a1a14', muzzle: [0.1, 0.06, 0.1], eye: 'cat', iris: '#ffb02a', tail: 'fluffy', tip: '#fff4e8', whisk: true, mouthW: true },
  wolf:    { fur: '#8a8e9a', fur2: '#e8e8f0', dark: '#2e3038', ear: 'pointy', earIn: '#d8d8e4', muzzle: [0.1, 0.066, 0.11], eye: 'canine', iris: '#e8c040', tail: 'fluffy', tip: '#d8dae4' },
  cat:     { fur: '#2e2836', fur2: '#e8e0ec', dark: '#120e16', ear: 'pointy', earIn: '#ff9ab8', muzzle: [0.075, 0.05, 0.035], eye: 'cat', iris: '#7ad85a', tail: 'thin', whisk: true, mouthW: true },
  tiger:   { fur: '#f08a2a', fur2: '#fff4e8', dark: '#2a1a14', ear: 'round', earIn: '#fff4e8', stripes: '#2a1a14', muzzle: [0.1, 0.064, 0.05], eye: 'canine', iris: '#f2c23a', tail: 'thin', rings: '#2a1a14', whisk: true, mouthW: true },
  bear:    { fur: '#7a4a2a', fur2: '#d8aa7a', dark: '#3a2010', ear: 'round', earIn: '#c89060', muzzle: [0.09, 0.064, 0.06], eye: 'beady', tail: 'puff' },
  panda:   { fur: '#f2f0ea', fur2: '#ffffff', dark: '#1a1a1e', ear: 'round', earC: '#1a1a1e', earIn: '#1a1a1e', patches: '#1a1a1e', muzzle: [0.075, 0.055, 0.045], eye: 'beady', tail: 'puff' },
  rabbit:  { fur: '#f2e6d8', fur2: '#ffffff', dark: '#8a6a5a', ear: 'long', earIn: '#ffb0c0', muzzle: [0.065, 0.048, 0.03], eye: 'beady', tail: 'puff', mouthW: true, teeth: true, nose: '#ff8aa0' },
  goat:    { fur: '#e8e0d0', fur2: '#ffffff', dark: '#6a5a4a', ear: 'side', earIn: '#f0c8b8', horns: 'goat', hornC: '#b8a888', muzzle: [0.075, 0.07, 0.07], eye: 'goat', iris: '#d8a040', tail: 'puff' },
  dog:     { fur: '#c8904a', fur2: '#f4e2c8', dark: '#5a3418', ear: 'floppy', earC: '#8a5a2a', muzzle: [0.09, 0.062, 0.07], eye: 'canine', tail: 'dog' },
  mouse:   { fur: '#a8a0a8', fur2: '#f0e0e8', dark: '#4a444a', ear: 'big', earIn: '#ffb0c0', muzzle: [0.055, 0.042, 0.045], eye: 'beady', tail: 'thin', tailC: '#e8b0b8', whisk: true, nose: '#ff8aa0' },
  raccoon: { fur: '#8a8a92', fur2: '#e8e8ec', dark: '#2a2a30', ear: 'pointy', earIn: '#e8e8ec', mask: '#2a2a30', muzzle: [0.075, 0.052, 0.06], eye: 'beady', tail: 'fluffy', rings: '#2a2a30', tip: '#2a2a30' },
  bull:    { fur: '#5a3a2a', fur2: '#c8a080', dark: '#2a1810', ear: 'side', earIn: '#c8a080', horns: 'bull', hornC: '#f0e8d8', muzzle: [0.11, 0.075, 0.06], eye: 'beady', nose: '#d89a8a', noseRing: true, tail: 'thin' },
  sheep:   { fur: '#f6f2ea', fur2: '#3a2e2a', dark: '#2a201c', ear: 'side', earIn: '#3a2e2a', wool: true, muzzle: [0.075, 0.062, 0.05], eye: 'goat', iris: '#e0b060', tail: 'puff' },
  // fantasy
  dragon:  { fur: '#2e8a5a', fur2: '#e8d890', dark: '#14402a', scales: true, ear: 'fin', earIn: '#e8d890', horns: 'dragon', hornC: '#f0e8c8', muzzle: [0.1, 0.066, 0.09], eye: 'reptile', iris: '#ffc23a', tail: 'dragon', nostrils: true },
  kitsune: { fur: '#f4f0f8', fur2: '#ffffff', dark: '#8a7a9a', ear: 'pointy', earIn: '#ff8ab0', earTip: '#ff5a8a', marks: '#e8304a', muzzle: [0.09, 0.056, 0.07], eye: 'cat', iris: '#ff5a8a', tail: 'kitsune', tip: '#ff8ab0', whisk: true, mouthW: true },
  qilin:   { fur: '#d8a85a', fur2: '#fff4d8', dark: '#6a4a1a', scales: true, ear: 'side', earIn: '#fff4d8', horns: 'antler', hornC: '#f0d070', muzzle: [0.085, 0.06, 0.07], eye: 'goat', iris: '#7ae0ff', tail: 'fluffy', tip: '#fff4d8' },
};
export const FOLK_KINDS = Object.keys(ANIMALS);

// ---------------------------------------------------------------- textures (Canvas2D)
const cv = (W, H, fn) => { const c = document.createElement('canvas'); c.width = W; c.height = H; fn(c.getContext('2d'), W, H); return c; };
const tex = (c, px) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (px) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; } return t; };
const lam = (t, o = {}) => new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide, ...o });
function furPaint(g, W, H, c, c2, seed = 3, o = {}) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c); gr.addColorStop(1, o.bottom || c); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  let x = seed * 9301 + 49297; const r = () => ((x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < (W * H) / 6; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(30,10,20,0.12)'; g.fillRect(Math.floor(r() * W), Math.floor(r() * H), 1, 1 + Math.floor(r() * 3)); }
  if (o.scales) { g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1; for (let y = 0; y < H; y += 4) for (let xx = (y / 4) % 2 ? 2 : 0; xx < W; xx += 4) { g.beginPath(); g.arc(xx + 2, y + 4, 2, Math.PI, 0); g.stroke(); } }
  if (o.wool) { for (let i = 0; i < W * H / 30; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.4)' : 'rgba(200,190,170,0.35)'; g.beginPath(); g.arc(r() * W, r() * H, 1.5 + r() * 2, 0, Math.PI * 2); g.fill(); } }
  void c2;
}
export function furTexture(A, W = 64, H = 64, seed = 3) { return tex(cv(W, H, (g) => { furPaint(g, W, H, A.fur, A.fur2, seed, A); if (A.stripes) { g.fillStyle = A.stripes; for (let i = 0; i < 6; i++) { const y = 4 + i * (H / 6); g.beginPath(); g.moveTo(0, y); g.lineTo(W * 0.3, y + 3); g.lineTo(0, y + 6); g.fill(); g.beginPath(); g.moveTo(W, y); g.lineTo(W * 0.7, y + 3); g.lineTo(W, y + 6); g.fill(); } } }), true); }

// ---------------------------------------------------------------- 3D parts
// head-local helpers: F(x, y, z) maps head units (scale 1: a 0.2 × 0.238 × 0.2 cube, y up from the chin)
export function buildFolk(A, F, S, attach, addBone, seedTex) {
  const fur = furTexture(A, 64, 64, 5), fur2 = tex(cv(32, 32, (g, W, H) => furPaint(g, W, H, A.fur2, A.fur2, 7)), true);
  const parts = { muzzle: null };
  const box = (w, h, d, at, mats, rot) => { const m = new THREE.Mesh(new THREE.BoxGeometry(S(w), S(h), S(d)), mats); m.position.set(...F(...at)); if (rot) m.rotation.set(...rot); m.castShadow = true; m.receiveShadow = true; return m; };
  const add = (m) => { const g = new THREE.Group(); g.add(m); attach('head', g); return m; };
  // ears
  const earMat = (inner, outer = A.earC || A.fur, tip = A.earTip) => lam(tex(cv(16, 24, (g, W, H) => { furPaint(g, W, H, outer, outer, 11); if (inner) { g.fillStyle = inner; g.fillRect(3, 6, W - 6, H - 8); } if (tip) { g.fillStyle = tip; g.fillRect(0, 0, W, 5); } }), true));
  const ear = A.ear, em = earMat(A.earIn), eo = earMat(null);
  const earMats = [eo, eo, eo, eo, em, eo];
  for (const s of [-1, 1]) {
    if (ear === 'pointy') add(box(0.06, 0.085, 0.022, [s * 0.065, 0.268, -0.01], earMats, [0, 0, -s * 0.18]));
    if (ear === 'round') add(box(0.052, 0.048, 0.022, [s * 0.075, 0.25, -0.01], earMats));
    if (ear === 'big') add(box(0.075, 0.07, 0.016, [s * 0.085, 0.262, -0.01], earMats, [0, 0, -s * 0.25]));
    if (ear === 'long') add(box(0.04, 0.15, 0.02, [s * 0.04, 0.31, -0.02], earMats, [0, 0, -s * 0.1]));
    if (ear === 'floppy') add(box(0.03, 0.11, 0.06, [s * 0.112, 0.17, -0.01], [eo, eo, eo, eo, eo, eo], [0, 0, s * 0.12]));
    if (ear === 'side') add(box(0.07, 0.03, 0.035, [s * 0.125, 0.19, -0.01], earMats, [0, 0, s * 0.35]));
    if (ear === 'fin') add(box(0.012, 0.075, 0.07, [s * 0.105, 0.2, -0.04], earMats, [0.4, 0, s * 0.3]));
  }
  // horns
  const hm = lam(tex(cv(8, 16, (g, W, H) => { const gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, A.hornC || '#e8e0c8'); gr.addColorStop(1, '#fffaf0'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 2; y < H; y += 3) g.fillRect(0, y, W, 1); }), true));
  for (const s of [-1, 1]) {
    if (A.horns === 'goat') { add(box(0.03, 0.08, 0.03, [s * 0.05, 0.27, -0.03], hm, [-0.5, 0, -s * 0.15])); add(box(0.026, 0.06, 0.026, [s * 0.06, 0.29, -0.09], hm, [-1.6, 0, -s * 0.15])); }
    if (A.horns === 'bull') { add(box(0.09, 0.03, 0.03, [s * 0.15, 0.22, 0], hm)); add(box(0.026, 0.06, 0.026, [s * 0.19, 0.25, 0], hm, [0, 0, s * 0.3])); }
    if (A.horns === 'dragon') { add(box(0.025, 0.1, 0.025, [s * 0.055, 0.28, -0.05], hm, [-0.9, 0, -s * 0.1])); add(box(0.02, 0.05, 0.02, [s * 0.07, 0.27, -0.12], hm, [-1.4, 0, -s * 0.1])); }
    if (A.horns === 'antler') { add(box(0.02, 0.1, 0.02, [s * 0.05, 0.3, -0.02], hm, [0, 0, -s * 0.25])); add(box(0.016, 0.05, 0.016, [s * 0.09, 0.34, -0.02], hm, [0, 0, -s * 0.9])); add(box(0.016, 0.04, 0.016, [s * 0.05, 0.36, -0.02], hm, [0, 0, s * 0.3])); }
  }
  if (A.horns === 'dragon') for (let i = 0; i < 3; i++) add(box(0.012, 0.04, 0.03, [0, 0.25 - i * 0.04, -0.11 - i * 0.012], hm, [-0.5, 0, 0]));
  // the muzzle: a box out from the lower face; its front shows the nose and the mouth (repainted per expression)
  if (A.muzzle) {
    const [mw, mh, md] = A.muzzle, front = document.createElement('canvas'); front.width = 96; front.height = 64;
    const ft = tex(front), sideM = lam(fur2), m = box(mw, mh, md, [0, 0.03 + mh / 2, 0.1 + md / 2 - 0.012], [sideM, sideM, sideM, sideM, lam(ft), sideM]);
    add(m); parts.muzzle = { canvas: front, tex: ft, A };
  }
  // the tail, on its own springy bone at the small of the back
  if (A.tail) parts.tail = A.tail;
  void addBone; void seedTex;
  return parts;
}
export function buildTail(A, hipBone, base, k, LOCK, mesh, mat, paint) {
  const T = A.tail, fur = A.tailC || A.fur, tip = A.tip || fur, g = new THREE.Group();
  const tm = (c1, c2, rings) => mat(paint(16, 48, (gg, W, H) => { gg.fillStyle = c1; gg.fillRect(0, 0, W, H); if (rings) { gg.fillStyle = rings; for (let y = 4; y < H * 0.7; y += 10) gg.fillRect(0, y, W, 4); } gg.fillStyle = c2; gg.fillRect(0, 0, W, H * 0.25); }));
  const [x, y, z] = base, L = (p0, p1, pc, w, d, m) => { const me = mesh(LOCK(p0, p1, pc, w, d, { segs: 4, sides: 4, out: [0, 1, 0] }), m); g.add(me); };
  const s = k;
  if (T === 'fluffy') L([x, y, z], [x, y + 0.2 * s, z - 0.32 * s], [x, y - 0.04 * s, z - 0.25 * s], 0.06 * s, 0.06 * s, tm(fur, tip, A.rings));
  if (T === 'kitsune') for (const a of [-0.5, 0, 0.5]) L([x, y, z], [x + a * 0.28 * s, y + 0.22 * s, z - 0.28 * s], [x + a * 0.15 * s, y - 0.02 * s, z - 0.22 * s], 0.05 * s, 0.05 * s, tm(fur, tip));
  if (T === 'thin') L([x, y, z], [x, y + 0.26 * s, z - 0.3 * s], [x, y - 0.12 * s, z - 0.3 * s], 0.018 * s, 0.018 * s, tm(fur, fur, A.rings));
  if (T === 'dog') L([x, y, z], [x, y + 0.18 * s, z - 0.16 * s], [x, y + 0.02 * s, z - 0.18 * s], 0.03 * s, 0.03 * s, tm(fur, tip));
  if (T === 'dragon') L([x, y, z], [x, y - 0.1 * s, z - 0.45 * s], [x, y - 0.02 * s, z - 0.25 * s], 0.07 * s, 0.05 * s, tm(fur, A.fur2));
  if (T === 'puff') { const m = new THREE.Mesh(new THREE.BoxGeometry(0.07 * s, 0.07 * s, 0.06 * s), mat(paint(8, 8, (gg) => { gg.fillStyle = A.tip || A.fur2 || fur; gg.fillRect(0, 0, 8, 8); }))); m.position.set(x, y, z - 0.03 * s); g.add(m); }
  return g;
}

// ---------------------------------------------------------------- painting
// an animal eye as a small pixel image (crisp, nearest-scaled) for the face layer
const EYE_STATE = { open: 'open', closed: 'closed', happy: 'happy', angry: 'angry', sad: 'sad', wide: 'wide', half: 'sleepy', smug: 'smug' };
const eyeCache = new Map();
export function animalEyeImage(A, state, side) {
  const key = (A.eye || 'beady') + (A.iris || '') + state + side;
  if (eyeCache.has(key)) return eyeCache.get(key);
  const W = 22, H = 20, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), img = g.createImageData(W, H);
  const pen = { px(x, y, col) { const xx = side > 0 ? W - 1 - x : x; if (xx < 0 || y < 0 || xx >= W || y >= H) return pen; const n = parseInt(col.slice(1, 7), 16), i = (y * W + xx) * 4; img.data[i] = n >> 16; img.data[i + 1] = (n >> 8) & 255; img.data[i + 2] = n & 255; img.data[i + 3] = 255; return pen; } };
  animalEye(A.eye || 'beady', EYE_STATE[state] || 'open', A.iris ? { iris: A.iris } : {})(pen, W, H);
  g.putImageData(img, 0, 0); eyeCache.set(key, c); return c;
}
// the muzzle front: nose, philtrum, mouth (per state), whiskers
export function paintMuzzle(P, state) {
  const A = P.A, g = P.canvas.getContext('2d'), W = P.canvas.width, H = P.canvas.height, dark = '#1e1014';
  g.fillStyle = A.fur2; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(0, H - 8, W, 8);
  // nose
  const nw = W * 0.34, nh = H * 0.24; g.fillStyle = A.nose || '#24161a'; g.beginPath(); g.roundRect ? g.roundRect(W / 2 - nw / 2, 3, nw, nh, 6) : g.rect(W / 2 - nw / 2, 3, nw, nh); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(W / 2 - nw / 4, 5, nw / 4, 3);
  if (A.nostrils) { g.fillStyle = dark; g.fillRect(W / 2 - nw / 3, 3 + nh * 0.5, 4, 3); g.fillRect(W / 2 + nw / 3 - 4, 3 + nh * 0.5, 4, 3); }
  if (A.noseRing) { g.strokeStyle = '#ffd040'; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, 3 + nh + 3, 6, 0, Math.PI); g.stroke(); }
  // philtrum + mouth
  const my = 3 + nh + H * 0.18; g.strokeStyle = dark; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(W / 2, 3 + nh); g.lineTo(W / 2, my - 2); g.stroke();
  const open = (w, h, fangs) => { g.fillStyle = '#4a1420'; g.beginPath(); g.moveTo(W / 2 - w, my); g.quadraticCurveTo(W / 2, my + h * 2, W / 2 + w, my); g.closePath(); g.fill(); g.fillStyle = '#ff7a8a'; g.beginPath(); g.ellipse(W / 2, my + h * 0.9, w * 0.5, h * 0.35, 0, 0, Math.PI * 2); g.fill(); if (fangs) { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(W / 2 - w * 0.6, my); g.lineTo(W / 2 - w * 0.45, my + 6); g.lineTo(W / 2 - w * 0.3, my); g.fill(); g.beginPath(); g.moveTo(W / 2 + w * 0.6, my); g.lineTo(W / 2 + w * 0.45, my + 6); g.lineTo(W / 2 + w * 0.3, my); g.fill(); } };
  const w = (lift) => { g.beginPath(); g.moveTo(W / 2 - 18, my - 2 - lift); g.quadraticCurveTo(W / 2 - 9, my + 6, W / 2, my - 2); g.quadraticCurveTo(W / 2 + 9, my + 6, W / 2 + 18, my - 2 - lift); g.stroke(); };
  if (state === 'closed') A.mouthW ? w(0) : (g.beginPath(), g.moveTo(W / 2 - 12, my + 2), g.lineTo(W / 2, my - 2), g.lineTo(W / 2 + 12, my + 2), g.stroke());
  else if (state === 'smile') w(5);
  else if (state === 'frown') { g.beginPath(); g.moveTo(W / 2 - 14, my + 6); g.quadraticCurveTo(W / 2, my - 4, W / 2 + 14, my + 6); g.stroke(); }
  else if (state === 'smirk') { g.beginPath(); g.moveTo(W / 2 - 12, my + 2); g.quadraticCurveTo(W / 2 + 6, my + 4, W / 2 + 16, my - 4); g.stroke(); }
  else if (state === 'grin') { open(20, 7, true); }
  else if (state === 'open' || state === 'o') open(state === 'o' ? 8 : 12, state === 'o' ? 7 : 6, false);
  else if (state === 'shout' || state === 'laugh') open(22, 10, true);
  else w(1);
  if (A.teeth && (state === 'closed' || state === 'smile')) { g.fillStyle = '#ffffff'; g.fillRect(W / 2 - 5, my + 1, 10, 8); g.strokeStyle = dark; g.lineWidth = 1; g.strokeRect(W / 2 - 5, my + 1, 10, 8); g.beginPath(); g.moveTo(W / 2, my + 1); g.lineTo(W / 2, my + 9); g.stroke(); }
  if (A.whisk) { g.fillStyle = 'rgba(30,16,20,0.6)'; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) g.fillRect(W / 2 + s * (W * 0.3 + i * 6) - 1, my - 6 + i * 4, 3, 3); }
  P.tex.needsUpdate = true;
}
