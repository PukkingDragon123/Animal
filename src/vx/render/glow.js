// Glowing pixels: which texels of a pixel-art texture give off light. Lit windows, shop windows, signs,
// marquees and screens get an emissive twin of their texture holding only the glowing pixels, so they
// shine at night (and feed the bloom) while frames, curtains and walls stay lit by the scene.
//  - textures tagged by their painter: tex.userData.glow = true | 0..1 (the whole texture glows at that
//    strength), userData.srGlow (screens, lamp shades: whole texture) or userData.glowMask = a canvas;
//  - at night, textures painted in their lit variant (the key carries the `true` / night flag) glow
//    where the pixels are warm lamp-light (lit glass, bulbs, gold letters) or saturated neon;
//  - at night, sign boards are backlit: the lettering glows fully, the board faintly.
import * as THREE from '../../../vendor/three.module.js';

const CACHE = new Map();
const lin = (v) => Math.pow(v / 255, 2.2);

/** → null | { map, k (base intensity), col: [r, g, b] linear mean glow colour, frac (glowing share of the texture), always } */
export function glowInfo(tex, night) {
  if (!tex || !tex.image) return null;
  const ud = tex.userData || {}, key = (ud.key || tex.uuid) + '|' + (night ? 'n' : 'd');
  if (CACHE.has(key)) return CACHE.get(key);
  let out = null;
  const user = String(ud.key || '').split('|')[0];
  if (ud.glow || ud.srGlow) out = whole(tex, ud.glow === true || ud.glow === undefined ? (ud.srGlow ? 0.9 : 1) : +ud.glow, true);
  else if (ud.glowMask) out = masked(tex, () => 1, ud.glowMask);
  else if (night && /^(sign|ct_signH|neon|dt_neon|dt_sign)/.test(user)) out = masked(tex, (r, g, b) => Math.max(0.28, lampPx(r, g, b)), null, 0.8);
  else if (night && /true|night|_n$|lit$/.test(user)) out = masked(tex, lampPx, null, 1);
  CACHE.set(key, out);
  return out;
}
// how much a pixel reads as emitted light: warm lamp-light (cream / amber / gold) or bright saturated neon
function lampPx(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), v = mx / 255, s = mx ? (mx - mn) / mx : 0;
  const warm = r >= g && g >= b && r - b > 30 && g > 160 && b >= 90 ? smooth(0.78, 0.93, v) : 0;
  const neon = s > 0.45 ? smooth(0.86, 0.97, v) : 0;
  const white = smooth(0.95, 1.0, v) * (s < 0.12 ? 1 : 0);
  return Math.max(warm, neon, white);
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function pixels(tex) {
  const img = tex.image, W = img.width, H = img.height;
  let g = img.getContext && img.getContext('2d');
  if (!g) { const c = document.createElement('canvas'); c.width = W; c.height = H; g = c.getContext('2d'); g.drawImage(img, 0, 0); }
  return { W, H, d: g.getImageData(0, 0, W, H).data };
}
function whole(tex, k, always) {
  const { W, H, d } = pixels(tex), col = [0, 0, 0];
  for (let i = 0; i < d.length; i += 4) { col[0] += lin(d[i]); col[1] += lin(d[i + 1]); col[2] += lin(d[i + 2]); }
  const n = W * H; return { map: tex, k, col: col.map((c) => c / n), frac: 1, always };
}
function masked(tex, fn, mask, k = 1) {
  const { W, H, d } = pixels(tex), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), out = g.createImageData(W, H), o = out.data, col = [0, 0, 0];
  const md = mask && mask.getContext('2d').getImageData(0, 0, W, H).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    const w = md ? md[i] / 255 : fn(d[i], d[i + 1], d[i + 2]);
    if (w <= 0.01) { o[i + 3] = 255; continue; }
    o[i] = d[i] * w; o[i + 1] = d[i + 1] * w; o[i + 2] = d[i + 2] * w; o[i + 3] = 255;
    sum += w; col[0] += lin(d[i]) * w; col[1] += lin(d[i + 1]) * w; col[2] += lin(d[i + 2]) * w;
  }
  if (sum < 0.5) return null;
  g.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = tex.minFilter; t.wrapS = tex.wrapS; t.wrapT = tex.wrapT; t.anisotropy = tex.anisotropy;
  t.repeat.copy(tex.repeat); t.offset.copy(tex.offset);
  return { map: t, k, col: col.map((c) => c / sum), frac: sum / (W * H), always: false };
}
