// Side-scrolling "stage set" pieces for HD-2D scenes (see docs/SCENES.md):
//   rooms    — cut-away interiors: textured back wall + side walls with a dark
//              cut face (dollhouse look), wainscot, trim, windows (lit at night)
//   backdrop — far parallax layers (city skyline w/ lit windows, mountains,
//              treelines) as big pixel-art planes behind the play strip
//   panels   — in-world pixel boards: menus, posters, calligraphy, TV screens
// All textures are generated pixel art (16 px per metre, nearest sampling).
import * as THREE from '../../vendor/three.module.js';
import { toonMaterial } from './materials.js';
import { hash3 } from '../core/rng.js';

const PX = 16;
class Img {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h * 4); }
  set(x, y, c, a = 255) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 4; this.d[i] = (c >> 16) & 255; this.d[i + 1] = (c >> 8) & 255; this.d[i + 2] = c & 255; this.d[i + 3] = a; }
  get(x, y) { const i = (y * this.w + x) * 4; return (this.d[i] << 16) | (this.d[i + 1] << 8) | this.d[i + 2]; }
  rect(x, y, w, h, c, a = 255) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c, a); }
}
const hex = (c) => (typeof c === 'number' ? c : parseInt(String(c || '#888888').replace('#', ''), 16));
const shade = (c, f) => { const r = Math.min(255, Math.max(0, Math.round(((c >> 16) & 255) * f))), g = Math.min(255, Math.max(0, Math.round(((c >> 8) & 255) * f))), b = Math.min(255, Math.max(0, Math.round((c & 255) * f))); return (r << 16) | (g << 8) | b; };
const mix = (a, b, t) => { const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255, br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255; return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t); };
const Hh = (x, y, s) => hash3(x, y, s * 97 + 3);

function texOf(img, repeat = true) {
  const t = new THREE.DataTexture(img.d, img.w, img.h, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.flipY = true; t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------- wall painters (32×32 px = 2 m tile)
const WALL = {
  plaster(img, c, v) { const b = hex(c || '#efe4cf'); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) img.set(x, y, shade(b, 1 + (Hh(x, y, 1 + v) - 0.5) * 0.06)); for (let i = 0; i < 6; i++) img.set(Math.floor(Hh(i, 1, 2) * 32), Math.floor(Hh(i, 2, 3) * 32), shade(b, 0.92)); },
  wood(img, c, v) { const b = hex(c || '#a8743f'); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const plank = x >> 3; let k = shade(b, 0.9 + Hh(plank, v, 4) * 0.2); if ((x & 7) === 0) k = shade(b, 0.62); else if ((x & 7) === 1) k = shade(k, 1.08); if (Hh(x, y >> 2, 5 + plank) > 0.93) k = shade(k, 0.85); img.set(x, y, k); } for (let p = 0; p < 4; p++) { const y = Math.floor(Hh(p, 7, 6) * 32); img.set(p * 8 + 2, y, shade(b, 0.55)); img.set(p * 8 + 2, (y + 16) % 32, shade(b, 0.55)); } },
  dark_wood(img, c, v) { WALL.wood(img, c || '#5a3a26', v); },
  tile(img, c, v) { const b = hex(c || '#e9f1f2'); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { let k = shade(b, 0.97 + Hh(x >> 3, y >> 3, 8) * 0.06); if ((x & 7) === 0 || (y & 7) === 0) k = shade(b, 0.78); else if ((x & 7) === 1 && (y & 7) === 1) k = shade(b, 1.08); img.set(x, y, k); } },
  brick(img, c, v) { const b = hex(c || '#9a4a35'); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const row = y >> 2, off = row % 2 ? 4 : 0; const bx = (x + off) & 7, by = y & 3; let k = shade(b, 0.88 + Hh((x + off) >> 3, row, 9) * 0.22); if (bx === 0 || by === 0) k = hex('#cbbba4'); img.set(x, y, k); } },
  concrete(img, c, v) { const b = hex(c || '#a9adb2'); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) img.set(x, y, shade(b, 1 + (Hh(x, y, 10 + v) - 0.5) * 0.1)); for (let x = 0; x < 32; x++) img.set(x, 31, shade(b, 0.8)); for (let y = 0; y < 32; y++) img.set(31, y, shade(b, 0.8)); img.set(4, 4, shade(b, 0.7)); img.set(27, 4, shade(b, 0.7)); img.set(4, 27, shade(b, 0.7)); img.set(27, 27, shade(b, 0.7)); },
  shoji(img, c, v) { const paper = hex('#f6f0e0'), frame = hex(c || '#7a5230'); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { let k = shade(paper, 1 + (Hh(x, y, 11) - 0.5) * 0.04); if (x % 8 === 0 || y % 10 === 0) k = frame; img.set(x, y, k); } },
  wallpaper(img, c, v) { const b = hex(c || '#e6c6d6'), m = shade(b, 0.86); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { let k = b; if ((x % 16 === 7 || x % 16 === 8) && y % 8 < 6) k = m; if ((x + y) % 16 === 0 && (y % 8 === 3)) k = shade(b, 1.1); img.set(x, y, k); } },
  stripes(img, c, v) { const b = hex(c || '#ffe36b'), m = shade(b, 0.8); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) img.set(x, y, (x >> 2) % 2 ? b : m); },
  checker(img, c, v) { const b = hex(c || '#f2f2f2'), m = hex('#1b1b24'); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) img.set(x, y, ((x >> 3) + (y >> 3)) % 2 ? b : m); },
  stone(img, c, v) { const b = hex(c || '#8e8c86'); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const row = Math.floor(y / 6), off = row % 2 ? 5 : 0; const bx = (x + off) % 11, by = y % 6; let k = shade(b, 0.85 + Hh(Math.floor((x + off) / 11), row, 12) * 0.25); if (bx === 0 || by === 0) k = shade(b, 0.62); img.set(x, y, k); } },
  metal(img, c, v) { const b = hex(c || '#7d8794'); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { let k = shade(b, 0.95 + (y % 16 < 1 ? -0.25 : 0) + Hh(x, y, 13) * 0.05); if (x % 16 === 15) k = shade(b, 0.7); img.set(x, y, k); } for (const [x, y] of [[2, 2], [13, 2], [18, 2], [29, 2], [2, 18], [13, 18], [18, 18], [29, 18]]) img.set(x, y, shade(b, 1.35)); },
  neon(img, c, v) { const b = hex(c || '#22163a'); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) img.set(x, y, shade(b, 1 + (Hh(x, y, 14) - 0.5) * 0.12)); for (let x = 0; x < 32; x++) { img.set(x, 6, hex('#ff4fd0')); img.set(x, 25, hex('#3ff0ff')); } },
  tatami(img, c, v) { const b = hex(c || '#c8c27a'); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { let k = shade(b, (y % 2 ? 0.94 : 1.02) + Hh(x, y, 15) * 0.04); if (x === 0 || x === 31) k = hex('#3a5a3a'); img.set(x, y, k); } },
};
const wallTexCache = new Map();
function wallTexture(style, color, v = 0) {
  const key = style + '|' + color + '|' + v;
  if (wallTexCache.has(key)) return wallTexCache.get(key);
  const img = new Img(32, 32);
  (WALL[style] || WALL.plaster)(img, color, v);
  const t = texOf(img);
  wallTexCache.set(key, t);
  return t;
}

// textured quad with UVs in metres (texture = 2 m tile)
function quad(w, h, tex, opts = {}) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 2 + (opts.u0 || 0), uv.getY(i) * h / 2 + (opts.v0 || 0));
  const m = toonMaterial({ map: tex, vertexColors: false, side: opts.side ?? THREE.FrontSide });
  if (opts.tint) m.color = new THREE.Color(opts.tint);
  const mesh = new THREE.Mesh(g, m);
  mesh.receiveShadow = true; mesh.castShadow = !!opts.cast;
  return mesh;
}
function slab(w, h, d, color) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toonMaterial({ vertexColors: false, color: hex(color) }));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------- rooms
// room: { x, z, w, d, h, wall:'plaster'|..., wallColor, side:'wood'…, sideColor, wainscot:{style,color,h},
//         trim:'#hex', cut:'#hex', windows:[{x, y, w, h, view:'city'|'sky'|'garden'|'night'}], left:true, right:true, back:true }
function buildRoom(r, group, env) {
  const H = r.h ?? 3.2, T = r.t ?? 0.25;
  const wallTex = wallTexture(r.wall || 'plaster', r.wallColor);
  const sideTex = wallTexture(r.side || r.wall || 'plaster', r.sideColor || r.wallColor, 1);
  const cut = r.cut || '#2a1c22';
  if (r.back !== false) {
    const back = quad(r.w, H, wallTex);
    back.position.set(r.x + r.w / 2, H / 2, r.z);
    group.add(back);
    const shell = slab(r.w + T * 2, H + T, T, cut); shell.position.set(r.x + r.w / 2, (H + T) / 2, r.z - T / 2 - 0.01); group.add(shell);
    if (r.wainscot) {
      const ws = r.wainscot, wh = ws.h ?? 1.0;
      const wq = quad(r.w, wh, wallTexture(ws.style || 'wood', ws.color, 2)); wq.position.set(r.x + r.w / 2, wh / 2, r.z + 0.02); group.add(wq);
      const rail = slab(r.w, 0.08, 0.08, r.trim || '#6a4428'); rail.position.set(r.x + r.w / 2, wh, r.z + 0.05); group.add(rail);
    }
    const top = slab(r.w, 0.14, 0.14, r.trim || '#6a4428'); top.position.set(r.x + r.w / 2, H - 0.07, r.z + 0.07); group.add(top);
    for (const wnd of r.windows || []) addWindow(wnd, r, group, env);
  }
  for (const side of ['left', 'right']) {
    if (r[side] === false) continue;
    const x = side === 'left' ? r.x : r.x + r.w;
    const wq = quad(r.d, H, sideTex);
    wq.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
    wq.position.set(x, H / 2, r.z + r.d / 2);
    group.add(wq);
    // thick cut wall with a dark section face toward the camera (dollhouse look)
    const sl = slab(T, H + T, r.d + T, cut);
    sl.position.set(x + (side === 'left' ? -T / 2 - 0.01 : T / 2 + 0.01), (H + T) / 2, r.z + r.d / 2 - T / 2);
    group.add(sl);
  }
}
function addWindow(w, r, group, env) {
  const img = new Img(Math.max(8, Math.round(w.w * PX)), Math.max(8, Math.round(w.h * PX)));
  const em = new Img(img.w, img.h);
  const view = w.view || 'sky';
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const t = y / img.h;
    let c = view === 'night' ? mix(0x0a0f2e, 0x2a1a5a, t) : view === 'garden' ? (t > 0.55 ? mix(0x5ea64a, 0x3d7a34, Hh(x, y, 20)) : mix(0x9fd8ff, 0xdff3ff, t)) : mix(0x86c8ff, 0xd8f0ff, t);
    let e = 0;
    if (view === 'city' || view === 'night') {
      const bx = Math.floor(x / 5), bh = Math.floor(img.h * (0.35 + Hh(bx, 1, 21) * 0.5));
      if (img.h - y < bh) { c = view === 'night' ? 0x1a1430 : 0x8a90a8; if (x % 5 > 1 && y % 3 === 1 && Hh(x, y, 22) > 0.45) { c = 0xffe08a; e = 0xffd070; } }
    }
    img.set(x, y, c); em.set(x, y, e);
  }
  // frame + cross bars
  const fc = hex(w.frame || r.trim || '#5a3a26');
  for (let x = 0; x < img.w; x++) { img.set(x, 0, fc); img.set(x, img.h - 1, fc); img.set(x, img.h >> 1, fc); }
  for (let y = 0; y < img.h; y++) { img.set(0, y, fc); img.set(img.w - 1, y, fc); img.set(img.w >> 1, y, fc); }
  const tex = texOf(img, false), etex = texOf(em, false);
  const m = toonMaterial({ map: tex, emissiveMap: etex, emissive: 0xffffff, vertexColors: false });
  env.emissiveMats.push(m);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w.w, w.h), m);
  mesh.position.set(r.x + w.x + w.w / 2, w.y + w.h / 2, r.z + 0.03);
  group.add(mesh);
}

// ---------------------------------------------------------------- backdrop layers
// { kind:'skyline'|'mountains'|'trees'|'hills', z, x0?, x1?, y0?, height, color, color2, lit, seed }
function buildBackdrop(L, def, group, env) {
  const W = def.size[0];
  const x0 = L.x0 ?? -W * 0.6, x1 = L.x1 ?? W * 1.6;
  const width = x1 - x0, height = L.height ?? 20;
  const ppm = L.ppm ?? 4;                  // far layers: chunky pixels
  const iw = Math.max(16, Math.round(width * ppm)), ih = Math.max(8, Math.round(height * ppm));
  const img = new Img(iw, ih), em = new Img(iw, ih);
  const col = hex(L.color || '#3a3a5a'), col2 = hex(L.color2 || L.color || '#4a4a6a');
  const seed = L.seed ?? 1;
  if (L.kind === 'skyline') {
    let x = 0;
    while (x < iw) {
      const bw = 6 + Math.floor(Hh(x, 1, seed) * 14), bh = Math.floor(ih * (0.3 + Hh(x, 2, seed) * 0.65));
      const c = Hh(x, 3, seed) > 0.5 ? col : col2;
      for (let i = x; i < Math.min(iw, x + bw); i++) for (let y = ih - bh; y < ih; y++) {
        img.set(i, y, shade(c, 0.95 + (i === x ? -0.15 : 0)));
        if (L.lit !== false && (i - x) % 3 === 1 && (ih - y) % 3 === 1 && y > ih - bh + 2 && Hh(i, y, seed + 7) > 0.55) { img.set(i, y, 0xffe6a0); em.set(i, y, Hh(i, y, seed + 9) > 0.5 ? 0xffd27a : 0x9fe8ff); }
      }
      // antenna / sign tops
      if (Hh(x, 4, seed) > 0.7) for (let y = ih - bh - 4; y < ih - bh; y++) img.set(x + (bw >> 1), y, shade(c, 0.8));
      if (L.signs && Hh(x, 5, seed) > 0.6) { const sc = [0xff4fd0, 0x3ff0ff, 0xffd23a, 0x7bff6a][Math.floor(Hh(x, 6, seed) * 4)]; for (let i = x + 1; i < Math.min(iw, x + bw - 1); i++) { img.set(i, ih - bh + 3, sc); em.set(i, ih - bh + 3, sc); } }
      x += bw + Math.floor(Hh(x, 7, seed) * 3);
    }
  } else {
    for (let i = 0; i < iw; i++) {
      const u = i / iw;
      let hgt;
      if (L.kind === 'mountains') hgt = 0.45 + 0.35 * Math.abs(Math.sin(u * 7 + seed)) * (0.6 + Hh(Math.floor(i / 9), 1, seed) * 0.4) + Math.sin(u * 31 + seed) * 0.04;
      else if (L.kind === 'hills') hgt = 0.35 + 0.2 * Math.sin(u * 5 + seed) + 0.08 * Math.sin(u * 17 + seed * 2);
      else hgt = 0.55 + 0.25 * Math.abs(Math.sin(i * 0.9 + seed)) * Hh(i >> 1, 3, seed) + 0.12 * Math.sin(u * 13); // trees
      const top = Math.floor(ih * (1 - Math.min(0.98, hgt)));
      for (let y = top; y < ih; y++) {
        let c = (y - top) < 2 ? shade(col, 1.12) : col;
        if (L.kind === 'mountains' && y - top < ih * 0.08 && L.snow) c = 0xeef4ff;
        img.set(i, y, mix(c, col2, (y - top) / Math.max(1, ih - top) * 0.6));
      }
    }
  }
  const tex = texOf(img, false), etex = texOf(em, false);
  const m = toonMaterial({ map: tex, emissiveMap: etex, emissive: 0xffffff, vertexColors: false, alphaTest: 0.5, transparent: false });
  m.fog = true;
  env.emissiveMats.push(m);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), m);
  mesh.position.set(x0 + width / 2, (L.y0 ?? 0) + height / 2, L.z ?? -40);
  group.add(mesh);
}

// ---------------------------------------------------------------- panels (menus, posters, TVs)
// { x, y, z, w, h, rot (deg about Y), kind, title, lines:[...], bg, fg, accent, glow }
function panelTexture(p) {
  if (typeof document === 'undefined') return null;
  const ppm = p.ppm || 40;
  const cw = Math.max(16, Math.round(p.w * ppm)), ch = Math.max(16, Math.round(p.h * ppm));
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  const bg = p.bg || ({ menu: '#2a1a12', poster: '#ffe9c2', calligraphy: '#f4eedc', tv: '#0a1424', sign: '#1b1230', chalk: '#20302a' }[p.kind] || '#ffffff');
  const fg = p.fg || ({ menu: '#ffe9b0', poster: '#2a1a3a', calligraphy: '#1a1410', tv: '#7ff0ff', sign: '#ffffff', chalk: '#f2f2e6' }[p.kind] || '#111111');
  c.fillStyle = bg; c.fillRect(0, 0, cw, ch);
  c.strokeStyle = p.accent || shadeCss(bg); c.lineWidth = 2; c.strokeRect(1, 1, cw - 2, ch - 2);
  c.fillStyle = fg; c.textBaseline = 'top';
  let y = 3;
  if (p.title) { const fs = Math.max(7, Math.round(ch * (p.lines && p.lines.length ? 0.16 : 0.5))); c.font = `bold ${fs}px monospace`; c.textAlign = 'center'; c.fillStyle = p.accent || fg; c.fillText(p.title, cw / 2, y); y += fs + 2; }
  if (p.lines) { const fs = Math.max(6, Math.min(12, Math.floor((ch - y - 2) / p.lines.length) - 1)); c.font = `${fs}px monospace`; c.textAlign = 'left'; c.fillStyle = fg; for (const l of p.lines) { c.fillText(l, 4, y); y += fs + 1; } }
  // hard pixel threshold: no smooth text edges
  const id = c.getImageData(0, 0, cw, ch);
  const bgc = hex(bg);
  for (let i = 0; i < id.data.length; i += 4) {
    const r = id.data[i], g = id.data[i + 1], b = id.data[i + 2];
    const dr = r - ((bgc >> 16) & 255), dg = g - ((bgc >> 8) & 255), db = b - (bgc & 255);
    if (Math.abs(dr) + Math.abs(dg) + Math.abs(db) < 140) { id.data[i] = (bgc >> 16) & 255; id.data[i + 1] = (bgc >> 8) & 255; id.data[i + 2] = bgc & 255; }
  }
  c.putImageData(id, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return t;
}
function shadeCss(c) { const v = shade(hex(c), 0.6); return '#' + v.toString(16).padStart(6, '0'); }
function buildPanel(p, group, env) {
  const tex = panelTexture(p);
  const glow = p.glow || p.kind === 'tv' || p.kind === 'sign';
  const m = tex ? toonMaterial({ map: tex, vertexColors: false, emissiveMap: glow ? tex : null, emissive: glow ? 0xffffff : undefined }) : toonMaterial({ vertexColors: false, color: hex(p.bg || '#ddd') });
  if (glow && tex) env.emissiveMats.push(m);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), m);
  mesh.position.set(p.x, p.y, p.z);
  mesh.rotation.y = ((p.rot || 0) * Math.PI) / 180;
  group.add(mesh);
  return mesh;
}

export function buildStage(def, env) {
  const group = new THREE.Group(); group.name = 'stage';
  for (const r of def.rooms || []) buildRoom(r, group, env);
  for (const L of def.backdrop || []) buildBackdrop(L, def, group, env);
  for (const p of def.panels || []) buildPanel(p, group, env);
  return group;
}
