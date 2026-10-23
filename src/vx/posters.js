// Posters, ads and packaging painted from REAL 3D renders of the Tokonmon (never pixel art):
// - monShot() poses a Tokonmon model (any clip, time, drip, angle), renders it offscreen with
//   the stage's renderer and toon look, and cuts it out as a sticker (ink line + white border)
// - poster() lays out a high-resolution print: sunburst, halftone, paper grain, big display
//   type, the renders with drop shadows, tape and wear
// - posterDecal() hangs it on a wall as a smooth-filtered plane; it shows plain paper at once
//   and fills in when the renders are done
import * as THREE from '../../vendor/three.module.js';
import { Model, dripForm } from './model.js';
import { Animator } from './anim.js';
import { loadSignFonts } from './decals.js';

const D2R = Math.PI / 180, TAU = Math.PI * 2;
const shots = new Map();
// a posed Tokonmon as a transparent canvas. o: { clip, t, yaw, pitch, drip, look, w, h, outline, border }
export function monShot(stage, id, o = {}) {
  const key = id + JSON.stringify(o);
  if (!shots.has(key)) shots.set(key, (async () => {
    const mod = await import(`./mons/${id}.js`); let def = mod.def || mod.default; if (!def) throw new Error('no def ' + id);
    if ((o.drip || 1) >= 3) def = dripForm(def);
    const m = new Model(def); if (m.drip) m.drip(o.drip || 1, o.look ?? 0);
    const an = new Animator(m); if (o.clip && an.clips[o.clip]) an.play(o.clip, { fade: 0 });
    const DT = 1 / 60; for (let i = 0; i < Math.round((o.t ?? 1.4) / DT); i++) an.update(DT, {});
    const sc = new THREE.Scene(); sc.add(m.group); m.group.rotation.y = (o.yaw ?? 24) * D2R; m.group.updateMatrixWorld(true);
    sc.add(new THREE.HemisphereLight(0xfff4e8, 0x6a5a7a, 1.15));
    const key1 = new THREE.DirectionalLight(0xfff0dc, 2.1); key1.position.set(-2, 3, 4); sc.add(key1);
    const rim = new THREE.DirectionalLight(0x9ad8ff, 1.3); rim.position.set(3, 2, -3); sc.add(rim);
    const box = new THREE.Box3().setFromObject(m.group), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
    const W = o.w || 640, H = o.h || 640, cam = new THREE.PerspectiveCamera(20, W / H, 0.01, 200);
    const fit = Math.max(size.y, size.x / (W / H), size.z * 0.6) * 0.58 / Math.tan(10 * D2R) * 1.08, p = (o.pitch ?? 8) * D2R;
    cam.position.set(ctr.x, ctr.y + Math.sin(p) * fit, ctr.z + Math.cos(p) * fit); cam.lookAt(ctr);
    if (stage.style && stage.style.toon) stage.toonify(sc);
    const r = stage.r, rt = new THREE.WebGLRenderTarget(W, H, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
    const cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha(), prevT = r.getRenderTarget(), prevTM = r.toneMapping;
    r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear(); r.render(sc, cam);
    const px = new Uint8Array(W * H * 4); r.readRenderTargetPixels(rt, 0, 0, W, H, px);
    r.setRenderTarget(prevT); r.setClearColor(cc, ca); r.toneMapping = prevTM; rt.dispose();
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'), img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);   // flip
    g.putImageData(img, 0, 0);
    return sticker(cv, o.outline ?? 3, o.border ?? 9);
  })());
  return shots.get(key);
}
// cut-out look: an ink line hugging the silhouette and a white sticker border around that
function sticker(src, ink, border) {
  const pad = border + ink + 2, W = src.width + pad * 2, H = src.height + pad * 2;
  const sil = (col) => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c; };
  const out = document.createElement('canvas'); out.width = W; out.height = H; const g = out.getContext('2d');
  const ring = (c, r) => { for (let a = 0; a < 24; a++) { const t = (a / 24) * TAU; g.drawImage(c, pad + Math.cos(t) * r, pad + Math.sin(t) * r); } };
  if (border) { const w = sil('#fffaf0'); ring(w, ink + border); ring(w, ink + border * 0.5); }
  if (ink) { const k = sil('#1a1220'); ring(k, ink); }
  g.drawImage(src, pad, pad);
  return out;
}

// ---------------------------------------------------------------- the print
const rnd = (seed) => { let x = seed >>> 0 || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
function burst(g, cx, cy, R, n, c1, c2, rot = 0) { for (let i = 0; i < n; i++) { const a0 = rot + (i / n) * TAU, a1 = rot + ((i + 0.5) / n) * TAU; g.fillStyle = i % 2 ? c1 : c2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R); g.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R); g.closePath(); g.fill(); } }
function halftone(g, W, H, col, step, from, to) { g.fillStyle = col; for (let y = 0; y < H; y += step) for (let x = (y / step) % 2 ? step / 2 : 0; x < W; x += step) { const k = Math.max(0, Math.min(1, (y / H - from) / (to - from))); if (k <= 0) continue; g.beginPath(); g.arc(x, y, step * 0.45 * k, 0, TAU); g.fill(); } }
function grain(g, W, H, seed, a = 0.06) { const r = rnd(seed); for (let i = 0; i < (W * H) / 60; i++) { g.fillStyle = r() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(40,20,30,${a})`; g.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r() * 1.5); } }
function title(g, str, x, y, size, fill, o = {}) {
  g.save(); g.font = `${o.weight || ''} ${size}px ${o.font || '"Bebas Neue", "Oswald", Impact, sans-serif'}`; g.textAlign = o.align || 'center'; g.textBaseline = 'alphabetic';
  if (o.skew) g.transform(1, 0, o.skew, 1, 0, 0);
  if (o.shadow) { g.fillStyle = o.shadow; g.fillText(str, x + size * 0.05, y + size * 0.06); }
  if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.sw || size * 0.12; g.strokeStyle = o.stroke; g.strokeText(str, x, y); }
  g.fillStyle = fill; g.fillText(str, x, y); g.restore();
}
function tape(g, x, y, w, h, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = 'rgba(240,232,200,0.82)'; g.fillRect(-w / 2, -h / 2, w, h); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(-w / 2, -h / 2, w, h * 0.3); g.restore(); }

// spec: { w, h (px), bg: [top, bottom], burst: [c1, c2], dots, title, title2, sub, lines: [], foot, accent, ink,
//         mons: [{ id, clip, t, yaw, pitch, drip, x, y (0..1 centre), s (height fraction) }], tape, seed, frame }
export async function paintPoster(cv, stage, P) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, seed = P.seed || 3;
  const base = () => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, P.bg[0]); gr.addColorStop(1, P.bg[1]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (P.burst) burst(g, W * (P.burstX ?? 0.5), H * (P.burstY ?? 0.48), Math.max(W, H) * 1.1, 28, P.burst[0], P.burst[1], 0.1);
    if (P.dots) halftone(g, W, H, P.dots, Math.round(W / 34), 0.55, 1.0);
  };
  base(); grain(g, W, H, seed, 0.05);
  await loadSignFonts('TOKONMON').catch(() => {});
  let pics = [];
  try { pics = await Promise.all((P.mons || []).map((m) => monShot(stage, m.id, m))); } catch (e) { console.warn('poster', e); }
  base();
  // renders: drop shadow, then the sticker
  (P.mons || []).forEach((m, i) => {
    const pic = pics[i]; if (!pic) return;
    const h = H * (m.s ?? 0.6), w = (pic.width / pic.height) * h, x = W * (m.x ?? 0.5) - w / 2, y = H * (m.y ?? 0.55) - h / 2;
    g.save(); g.globalAlpha = 0.35; g.filter = 'blur(6px)'; g.drawImage(pic, x + W * 0.02, y + H * 0.02, w, h); g.restore();
    g.drawImage(pic, x, y, w, h);
  });
  // type
  const ink = P.ink || '#1a1220', ac = P.accent || '#ffd040';
  if (P.title) title(g, P.title, W / 2, H * (P.titleY ?? 0.17), Math.round(W * (P.titleK ?? 0.2)), P.titleFill || ac, { stroke: ink, shadow: 'rgba(0,0,0,0.35)', skew: P.skew ?? -0.08 });
  if (P.title2) title(g, P.title2, W / 2, H * ((P.titleY ?? 0.17) + 0.085), Math.round(W * 0.1), '#fffaf0', { stroke: ink, sw: W * 0.012 });
  if (P.sub) { g.fillStyle = ink; g.fillRect(0, H * 0.83, W, H * 0.075); title(g, P.sub, W / 2, H * 0.883, Math.round(W * 0.068), ac, {}); }
  (P.lines || []).forEach((l, i) => title(g, l, W / 2, H * (0.94 + i * 0.045), Math.round(W * 0.045), P.lineFill || '#fffaf0', { stroke: ink, sw: W * 0.008 }));
  if (P.corner) { g.save(); g.translate(W * 0.84, H * 0.3); g.rotate(-0.25); g.fillStyle = P.cornerBg || '#e83a3a'; g.beginPath(); for (let i = 0; i < 24; i++) { const r = i % 2 ? W * 0.09 : W * 0.115, a = (i / 24) * TAU; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); title(g, P.corner[0], 0, -W * 0.005, Math.round(W * 0.055), '#fffaf0', {}); if (P.corner[1]) title(g, P.corner[1], 0, W * 0.045, Math.round(W * 0.04), '#fffaf0', {}); g.restore(); }
  // paper: frame, grain, wear, tape
  if (P.frame !== false) { g.strokeStyle = P.frame || '#fffaf0'; g.lineWidth = W * 0.022; g.strokeRect(W * 0.011, H * 0.011, W - W * 0.022, H - H * 0.022); }
  grain(g, W, H, seed + 1, 0.045);
  const r = rnd(seed + 7); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1; for (let i = 0; i < 6; i++) { const x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * W * 0.3, y + (r() - 0.5) * 8); g.stroke(); }
  if (P.tape !== false) { tape(g, W * 0.1, H * 0.02, W * 0.22, H * 0.04, -0.5); tape(g, W * 0.9, H * 0.02, W * 0.22, H * 0.04, 0.5); }
}
// hang a poster on a wall: o like decal() ({ x, y, z, w, h, face, yaw, off }) + o.poster (spec); ppm ~ 400
export function posterDecal(stage, o) {
  const ppm = o.ppm || 400, W = Math.round(o.w * ppm), H = Math.round(o.h * ppm);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  const g0 = cv.getContext('2d'); g0.fillStyle = (o.poster.bg || ['#f4ecd8'])[0]; g0.fillRect(0, 0, W, H);
  const mat = new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide }); mat.userData.keep = true;
  const geo = new THREE.PlaneGeometry(o.w, o.h); geo.translate(0, o.h / 2, 0);
  const m = new THREE.Mesh(geo, mat); m.receiveShadow = true;
  const off = o.off ?? 0.02, F = o.face || 's';
  m.position.set(o.x + (F === 'e' ? off : F === 'w' ? -off : 0), o.y, o.z + (F === 's' ? off : F === 'n' ? -off : 0));
  m.rotation.y = o.yaw ?? ({ s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[F] || 0); if (o.tilt) m.rotation.z = o.tilt;
  (stage.decals || (stage.decals = new THREE.Group(), stage.scene.add(stage.decals), stage.decals)).add(m);
  paintPoster(cv, stage, o.poster).then(() => { t.needsUpdate = true; }).catch((e) => console.warn('poster', e));
  t.needsUpdate = true;
  return m;
}

// ---------------------------------------------------------------- the poster catalogue
export const POSTERS = {
  league: { bg: ['#1a2a6a', '#e8603a'], burst: ['rgba(255,220,120,0.16)', 'rgba(255,255,255,0.04)'], dots: 'rgba(255,240,200,0.25)', title: 'TOKON LEAGUE', title2: 'SAN FRANCISCO', sub: 'SEASON 7 · SIGN UP AT ANY DOJO', accent: '#ffd040',
    mons: [{ id: 'strawbaa', clip: 'win', t: 1.1, yaw: 30, x: 0.2, y: 0.6, s: 0.38 }, { id: 'bubblion', clip: 'win', t: 1.2, yaw: -30, x: 0.8, y: 0.6, s: 0.38 }, { id: 'chilichick', clip: 'dance', t: 1.3, yaw: 10, x: 0.5, y: 0.55, s: 0.5 }], corner: ['NEW', 'SEASON'], seed: 11 },
  chickTour: { bg: ['#2a0e1a', '#e83a2a'], burst: ['rgba(255,190,60,0.22)', 'rgba(0,0,0,0.0)'], dots: 'rgba(255,200,80,0.3)', title: 'CHILICHICK', title2: 'HOT SAUCE TOUR', sub: 'LIVE · THE FOGHORN · FRI 9PM', accent: '#ffd040', titleFill: '#ffd040',
    mons: [{ id: 'chilichick', clip: 'sip', t: 1.5, yaw: 20, x: 0.5, y: 0.56, s: 0.6 }], corner: ['SOLD', 'OUT!'], seed: 21 },
  pigeons: { bg: ['#141418', '#5a1a2a'], burst: ['rgba(255,60,80,0.18)', 'rgba(0,0,0,0)'], dots: 'rgba(255,255,255,0.12)', title: 'PIDGUN', title2: '& THE ROSES', sub: 'APPETITE FOR CRUMBS · WORLD TOUR', accent: '#ff4a5a', titleFill: '#f4e8d8',
    mons: [{ id: 'pidgun', clip: 'dance', t: 1.2, yaw: 25, x: 0.34, y: 0.58, s: 0.5 }, { id: 'jungeon', clip: 'win', t: 1.0, yaw: -25, x: 0.7, y: 0.6, s: 0.5 }], seed: 31 },
  raccoons: { bg: ['#1a1a1a', '#3a1a0a'], burst: ['rgba(255,140,0,0.2)', 'rgba(0,0,0,0)'], dots: 'rgba(255,200,0,0.18)', title: 'TRASHCOON', title2: 'HIGHWAY TO THE DUMP', sub: 'ONE NIGHT ONLY · PIER 70', accent: '#ffb020', titleFill: '#ffb020', skew: -0.18,
    mons: [{ id: 'dynacoon', clip: 'dance', t: 1.4, yaw: 20, x: 0.5, y: 0.58, s: 0.6 }], corner: ['LOUD!'], seed: 41 },
  bears: { bg: ['#f0e8d8', '#c8a8e8'], burst: ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)'], dots: 'rgba(120,80,200,0.18)', title: 'GRADCUB', title2: 'THE COLLEGE DROPOUT CLUB', sub: 'BEAR NECESSITIES · MISSION ST', accent: '#5a2a8a', titleFill: '#5a2a8a', ink: '#2a1a3a',
    mons: [{ id: 'gradcub', clip: 'dance', t: 1.0, yaw: 20, x: 0.32, y: 0.58, s: 0.48 }, { id: 'yeezilla', clip: 'win', t: 1.0, yaw: -20, x: 0.7, y: 0.56, s: 0.56 }], seed: 51 },
  shrimp: { bg: ['#0e2a4a', '#2a8ab0'], burst: ['rgba(255,255,255,0.12)', 'rgba(0,0,0,0)'], dots: 'rgba(160,230,255,0.25)', title: 'FOOPOD', title2: 'EVERLONG SURF CLUB', sub: 'LEARN TO STAGE-DIVE · OCEAN BEACH', accent: '#ff8a5a', titleFill: '#ff8a5a',
    mons: [{ id: 'foopod', clip: 'dance', t: 1.0, yaw: 20, x: 0.4, y: 0.58, s: 0.5 }, { id: 'everpunch', clip: 'win', t: 1.0, yaw: -20, x: 0.72, y: 0.6, s: 0.42 }], seed: 61 },
  pier: { bg: ['#4a8ac8', '#f0c890'], burst: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)'], dots: 'rgba(255,255,255,0.25)', title: 'PIER 39', title2: 'MEET THE SEA LIONS', sub: 'DAILY · FISHERMAN\'S WHARF', accent: '#e8403a', titleFill: '#fffaf0', ink: '#1a2a4a',
    mons: [{ id: 'barkorious', clip: 'win', t: 1.0, yaw: 25, x: 0.5, y: 0.58, s: 0.56 }], seed: 71 },
  dojo: { bg: ['#3a0e0e', '#c83a2a'], burst: ['rgba(255,210,120,0.18)', 'rgba(0,0,0,0)'], dots: 'rgba(255,220,140,0.2)', title: 'GOLDEN CLAW', title2: 'TOKON DOJO', sub: 'DISCIPLINE · DRIP · DESTINY', accent: '#ffd040', titleFill: '#ffd040',
    mons: [{ id: 'kanizumo', clip: 'win', t: 1.2, yaw: 20, x: 0.5, y: 0.56, s: 0.58 }], seed: 81 },
};
export function poster(name, extra = {}) { return { ...POSTERS[name], ...extra }; }
