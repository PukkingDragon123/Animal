// The sky: a pixel-art sky dome painted per mood into an equirectangular texture (nearest-filtered, ordered
// dithering between the gradient steps, chunky drifting cumulus lit by the sun from the sun's side), shown as
// the scene background, so the close street-level camera sees a real sky with the sun's glow where the sun
// is. The same picture is prefiltered (PMREM) into the environment that glossy surfaces reflect: glass, car
// paint, glazed tiles and wet ground pick up the sky's colours and the bright side of the horizon.
import * as THREE from '../../../vendor/three.module.js';

const W = 1024, H = 512;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dith = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
const lin = (c) => new THREE.Color(c);            // linear rgb
const CACHE = new Map();

// periodic value noise (wraps in x so the dome has no seam)
function vnoise(seed, gw, gh) {
  let s = seed >>> 0 || 1; const L = new Float32Array(gw * gh); for (let i = 0; i < L.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; L[i] = s / 4294967296; }
  const sm = (t) => t * t * (3 - 2 * t);
  return (u, v) => {
    const x = (((u % 1) + 1) % 1) * gw, y = Math.max(0, Math.min(gh - 1.001, v * gh)), x0 = Math.floor(x), y0 = Math.floor(y), fx = sm(x - x0), fy = sm(y - y0);
    const a = L[y0 * gw + (x0 % gw)], b = L[y0 * gw + ((x0 + 1) % gw)], c = L[(y0 + 1) * gw + (x0 % gw)], d = L[(y0 + 1) * gw + ((x0 + 1) % gw)];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

/**
 * m: a stage mood. → { tex (equirect, sRGB, nearest), env (PMREM render target texture, set by `envFor`) }
 * sky: [zenith, mid, horizon] colours; sun / sunDir; fog (the horizon haze); clouds: coverage 0..1.
 */
export function skyTexture(m, key) {
  if (key && CACHE.has(key)) return CACHE.get(key);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), im = g.createImageData(W, H), d = im.data;
  const [c0, c1, c2] = (m.sky || ['#5a8ad0', '#9cc4ec', '#dceaf4']).map(lin), haze = lin(m.fog || 0xc4d4e8), sunC = lin(m.sun || 0xffffff), gnd = lin(m.hemiGround || 0x807060);
  const sd = new THREE.Vector3(...(m.sunDir || [0, 1, 0])).normalize(), night = (m.sunI || 3) < 0.8 && sd.y > 0.5;   // the night "sun" is the moon, high up
  const cover = m.clouds ?? 0.4, n1 = vnoise(7, 12, 6), n2 = vnoise(19, 32, 14), n3 = vnoise(41, 80, 34);
  const col = new THREE.Color(), tmp = new THREE.Color(), cl = new THREE.Color(), dir = new THREE.Vector3();
  for (let y = 0; y < H; y++) {
    const el = (0.5 - (y + 0.5) / H) * Math.PI, sy = Math.sin(el), cy = Math.cos(el);
    for (let x = 0; x < W; x++) {
      const az = ((x + 0.5) / W) * Math.PI * 2;
      // three's equirect lookup: u = atan(dir.z, dir.x) / 2π + 0.5
      dir.set(Math.cos(az - Math.PI) * cy, sy, Math.sin(az - Math.PI) * cy);
      const q = dith(x, y);
      if (sy >= -0.02) {
        // gradient: zenith → mid → horizon, stepped into bands and dithered across each step
        const t = 1 - Math.pow(Math.max(0, sy), 0.55), steps = 22, f = t * steps, ti = (Math.floor(f) + (f - Math.floor(f) > q ? 1 : 0)) / steps;
        if (ti < 0.55) col.copy(c0).lerp(c1, ti / 0.55); else col.copy(c1).lerp(c2, (ti - 0.55) / 0.45);
        // the haze band right on the horizon
        const hb = Math.max(0, 1 - Math.max(0, sy) / 0.09); col.lerp(haze, hb * hb * 0.55);
        // the sun's glow (Mie forward scattering) and the disc; the moon is a small cool disc
        const cs = dir.dot(sd), a = Math.acos(Math.min(1, Math.max(-1, cs)));
        if (!night) {
          const glow = Math.exp(-a * 3.2) * 0.55 + Math.exp(-a * 14) * 0.6, gq = Math.floor(glow * 14 + q) / 14;
          col.add(tmp.copy(sunC).multiplyScalar(gq * (0.55 + 0.45 * (1 - Math.max(0, sd.y)))));
          if (a < 0.022) col.copy(tmp.copy(sunC).lerp(lin(0xffffff), 0.55)).multiplyScalar(1.6);
        } else {
          if (a < 0.016) col.set(0xdfe6ff); else col.add(tmp.copy(sunC).multiplyScalar(Math.floor(Math.exp(-a * 9) * 0.25 * 12 + q) / 12));
          // stars
          const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453, r = h - Math.floor(h);
          if (sy > 0.12 && r > 0.9965) col.lerp(lin(0xf4f0ff), 0.5 + (r - 0.9965) * 140);
        }
        // clouds on a plane overhead (perspective: they bunch up toward the horizon)
        if (cover > 0 && sy > 0.025) {
          const k = 0.16 / sy, u = dir.x * k * 0.06 + 0.37, v = dir.z * k * 0.06 + 0.61;
          const nn = n1(u, v) * 0.55 + n2(u * 2.3, v * 2.3) * 0.3 + n3(u * 5.1, v * 5.1) * 0.15;
          const dens = (nn - (1 - cover * 0.75) + 0.1) * 3.2, fade = Math.min(1, (sy - 0.025) / 0.12);
          if (dens * fade > q * 0.9) {
            // lit from the sun's side: offset sample toward the sun → thinner = brighter
            const nl = n1(u + sd.x * 0.012, v + sd.z * 0.012) * 0.55 + n2((u + sd.x * 0.012) * 2.3, (v + sd.z * 0.012) * 2.3) * 0.3;
            const lit = Math.max(0, Math.min(1, 0.55 + (nn - nl) * 9)), lq = Math.floor(lit * 4 + q) / 4;
            const base = night ? tmp.copy(c1).multiplyScalar(1.4) : tmp.copy(c2).lerp(lin(0xffffff), 0.6);
            cl.copy(c1).lerp(base, 0.35).multiplyScalar(night ? 0.9 : 0.82);                                      // the cloud's shaded underside
            cl.lerp(base.clone().lerp(sunC, night ? 0.1 : 0.35).multiplyScalar(night ? 1 : 1.12), lq);        // its sunlit tops
            col.lerp(cl, Math.min(1, dens * fade * 1.4) * (0.75 + 0.25 * fade));
          }
        }
      } else {
        // below the horizon: the haze over the ground beyond the city
        const t = Math.min(1, -sy / 0.3); col.copy(haze).lerp(tmp.copy(gnd).multiplyScalar(0.6).lerp(haze, 0.5), t);
      }
      const i = (y * W + x) * 4; col.convertLinearToSRGB();
      d[i] = Math.min(255, col.r * 255); d[i + 1] = Math.min(255, col.g * 255); d[i + 2] = Math.min(255, col.b * 255); d[i + 3] = 255;
    }
  }
  g.putImageData(im, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const out = { tex, env: null };
  if (key) CACHE.set(key, out);
  return out;
}

/** the prefiltered environment for a sky (made once per sky, on the stage's renderer) */
export function envFor(renderer, sky) {
  if (sky.env) return sky.env;
  const pm = new THREE.PMREMGenerator(renderer);
  sky.env = pm.fromEquirectangular(sky.tex).texture;
  pm.dispose();
  return sky.env;
}
