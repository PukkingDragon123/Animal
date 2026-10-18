// Painted 2D detail on the voxel world: posters, shop signs, banners, menus and
// murals as pixel art (32 px per metre by default — four pixels per voxel) on
// thin planes flush with a wall. Glowing ones (neon, lit signs) are unlit at
// night and bloom. glyphs() letters signs in big crisp Chinese / Japanese /
// display type, rasterized from a font with a hard alpha cut (no anti-aliasing).
import * as THREE from '../../vendor/three.module.js';
import { Pen, newSurf, shift } from '../px/paint.js';

// o: { x, y, z (metres, centre of the plane's bottom edge), w, h (metres), face: 's'|'n'|'e'|'w'|'up', ppm, glow, paint(p, W, H), off, yaw, cast }
export function decal(stage, o) {
  const ppm = o.ppm || 32, W = Math.max(2, Math.round(o.w * ppm)), H = Math.max(2, Math.round(o.h * ppm));
  const s = newSurf(W, H), p = new Pen(s, o.seed || 3); o.paint(p, W, H);
  s.touch && s.touch();
  const t = new THREE.CanvasTexture(s.canvas()); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const lit = o.glow && stage.moodName === 'night';
  const mat = lit ? new THREE.MeshBasicMaterial({ map: t, alphaTest: 0.5, toneMapped: false, side: THREE.DoubleSide })
    : new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, emissive: o.glow ? 0xffffff : 0x000000, emissiveMap: o.glow ? t : null, emissiveIntensity: o.glow ? 0.18 : 0 });
  if (lit) mat.color.setScalar(o.glowK ?? 1.1);
  const g = new THREE.PlaneGeometry(o.w, o.h); g.translate(0, o.h / 2, 0);
  const m = new THREE.Mesh(g, mat); m.receiveShadow = !lit; m.castShadow = !!o.cast;
  if (o.cast) m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5, side: THREE.DoubleSide });
  const off = o.off ?? 0.015, F = o.face || 's';
  if (F === 'up') { m.rotation.x = -Math.PI / 2; m.rotation.z = o.yaw || 0; m.position.set(o.x, o.y + off, o.z); }
  else {
    m.position.set(o.x + (F === 'e' ? off : F === 'w' ? -off : 0), o.y, o.z + (F === 's' ? off : F === 'n' ? -off : 0));
    m.rotation.y = o.yaw ?? ({ s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[F] || 0);
  }
  (stage.decals || (stage.decals = new THREE.Group(), stage.scene.add(stage.decals), stage.decals)).add(m);
  return m;
}

// ------------------------------------------------------------ lettering
export const FONTS = {
  serif: '"Noto Serif TC", "Noto Serif CJK TC", "WenQuanYi Zen Hei", "DotGothic16", serif',
  sans: '"Noto Sans TC", "Noto Sans CJK TC", "WenQuanYi Zen Hei", "DotGothic16", sans-serif',
  pixel: '"DotGothic16", "WenQuanYi Zen Hei Sharp", monospace',
  display: '"Bebas Neue", "Oswald", "Arial Narrow", "Impact", sans-serif',
};
export const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@900&family=Noto+Sans+TC:wght@700;900&family=Bebas+Neue&family=DotGothic16&display=swap';
// load the web fonts the given text needs (each face downloads only the subsets it uses)
export async function loadSignFonts(textSample = '中華街茶樓福龍金門') {
  if (typeof document === 'undefined' || !document.fonts) return;
  if (!document.querySelector('link[data-signfonts]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONT_CSS; l.dataset.signfonts = '1'; document.head.appendChild(l); await new Promise((r) => { l.onload = r; l.onerror = r; setTimeout(r, 2500); }); }
  const jobs = ['900 32px "Noto Serif TC"', '900 32px "Noto Sans TC"', '32px "Bebas Neue"', '32px "DotGothic16"'].map((f) => document.fonts.load(f, textSample).catch(() => {}));
  await Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 4000))]);
}
let G = null;
function mask(ch, size, font, weight) {
  if (!G) { const c = document.createElement('canvas'); c.width = c.height = 320; G = c.getContext('2d', { willReadFrequently: true }); }
  const pad = Math.ceil(size * 0.25), N = Math.ceil(size * 1.6) + pad * 2;
  G.clearRect(0, 0, N, N); G.fillStyle = '#fff'; G.textBaseline = 'alphabetic'; G.font = `${weight} ${size}px ${FONTS[font] || font}`;
  const m = G.measureText(ch), asc = m.fontBoundingBoxAscent ?? size * 0.88;
  G.fillText(ch, pad, pad + asc);
  const d = G.getImageData(0, 0, N, N).data, pts = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (d[(j * N + i) * 4 + 3] > 128) pts.push(i - pad, j - pad);
  return { pts, w: Math.round(m.width), h: Math.round((m.fontBoundingBoxAscent ?? size * 0.88) + (m.fontBoundingBoxDescent ?? size * 0.12)) };
}
const cache = new Map();
// draw `str` at (x, y) (top-left). o: { font, weight, vertical, gap, outline, outline2, shadow, align: 'left'|'center' (horizontal), track }
export function glyphs(p, str, x, y, size, color, o = {}) {
  const font = o.font || 'serif', weight = o.weight || 900, gap = o.gap ?? Math.round(size * 0.08);
  const chars = [...String(str)], ms = chars.map((ch) => { const k = ch + '|' + size + '|' + font + '|' + weight; if (!cache.has(k)) cache.set(k, mask(ch, size, font, weight)); return cache.get(k); });
  const total = o.vertical ? ms.reduce((a, m) => a + size + gap, -gap) : ms.reduce((a, m) => a + m.w + gap + (o.track || 0), -gap - (o.track || 0));
  let cx = x, cy = y;
  if (o.align === 'center') { if (o.vertical) cy -= Math.round(total / 2); else cx -= Math.round(total / 2); }
  const put = (m, ox, oy, col, grow = 0) => {
    for (let k = 0; k < m.pts.length; k += 2) {
      const X = ox + m.pts[k], Y = oy + m.pts[k + 1];
      if (!grow) p.px(X, Y, col);
      else for (let dy = -grow; dy <= grow; dy++) for (let dx = -grow; dx <= grow; dx++) if (dx * dx + dy * dy <= grow * grow + 1) p.px(X + dx, Y + dy, col);
    }
  };
  const place = [];
  for (const m of ms) {
    if (o.vertical) { place.push([m, cx + Math.round((size - m.w) / 2), cy]); cy += size + gap; }
    else { place.push([m, cx, cy]); cx += m.w + gap + (o.track || 0); }
  }
  if (o.outline2) for (const [m, X, Y] of place) put(m, X, Y, o.outline2, (o.ow || 1) + 1);
  if (o.outline) for (const [m, X, Y] of place) put(m, X, Y, o.outline, o.ow || 1);
  if (o.shadow) for (const [m, X, Y] of place) put(m, X + 1, Y + 1, o.shadow);
  for (const [m, X, Y] of place) {
    if (o.bevel) { put(m, X, Y, shift(color, -0.35)); put(m, X - 1, Y - 1, color); }
    else put(m, X, Y, color);
  }
  return total;
}
export function glyphsWidth(str, size, o = {}) {
  const font = o.font || 'serif', weight = o.weight || 900, gap = o.gap ?? Math.round(size * 0.08);
  return [...String(str)].reduce((a, ch) => { const k = ch + '|' + size + '|' + font + '|' + weight; if (!cache.has(k)) cache.set(k, mask(ch, size, font, weight)); return a + cache.get(k).w + gap + (o.track || 0); }, -gap - (o.track || 0));
}
export { Pen, newSurf };
