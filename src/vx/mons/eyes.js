// Shared eyes and expressions for Tokonmon box models. The house rule: no human
// eyes. Every model uses one of two Pokémon-like styles:
//   'dot'  — small solid dark dots with a single glint (Wooper, Psyduck, Ditto),
//   'poke' — a solid dark oval with a round white highlight, a small glint and a
//            thin accent crescent at the bottom (Pikachu, Rowlet, Sprigatito),
// and a shared set of expression states drawn in the same language:
//   open closed happy shut x swirl shock wide angry sad sleepy heart star teary
//   (+ 'wink' = right open, left happy).
// eyeRig() returns two bones (eyeR / eyeL, pivots at the eye centres so clips can
// squash, stretch and shift the eyes) holding one plane per state, and the face
// slot spec for the Animator. The left eye is the mirrored right eye, so shapes
// like > < and the catchlights stay symmetric.
//
//   const EYES = eyeRig({ style: 'poke', at: [-3.4, 19.6, 6.24], size: [3, 3.4], accent: '#ff8a2e' });
//   def.bones.push(...EYES.bones);  anim.faces.eyes = EYES.slot;
//
// mouthArt(state, o) paints simple mouths for flat-faced creatures in the same style.

const INK = '#1a0c14', WHITE = '#ffffff';
const inside = (x, y, cx, cy, rx, ry) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
function blob(p, w, h, cx, cy, rx, ry, c, keep) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inside(x, y, cx, cy, rx, ry) && (!keep || keep(x, y))) p.px(x, y, typeof c === 'function' ? c(x, y) : c);
}
// a polyline stroke of thickness t (texels)
function stroke(p, w, h, pts, c, t = 1) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3) + 1;
    for (let k = 0; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n, y = y0 + ((y1 - y0) * k) / n;
      for (let a = 0; a < t; a++) for (let b = 0; b < t; b++) { const X = Math.floor(x - (t - 1) / 2 + a), Y = Math.floor(y - (t - 1) / 2 + b); if (X >= 0 && Y >= 0 && X < w && Y < h) p.px(X, Y, c); }
    }
  }
}
const curve = (x0, x1, f, n = 12) => Array.from({ length: n + 1 }, (_, i) => { const x = x0 + ((x1 - x0) * i) / n; return [x, f(x)]; });

// the shape of the open eye for a style, in texels: centre, radii
function shape(style, w, h) {
  const cx = w / 2, cy = h / 2;
  if (style === 'dot') return { cx, cy, rx: Math.max(1.1, w * 0.19), ry: Math.max(1.5, h * 0.27) };
  return { cx, cy, rx: w * 0.42, ry: h * 0.46 };
}
// ---- 'gen9': a configurable eye in the Gen 8–9 language, so every species gets its own:
//   shape   'round' | 'tall' | 'almond' (pointed corners) | 'droopy' (outer corner low, gentle)
//           | 'sharp' (flat top lid, outer corner high, fierce) | 'sleepy' (heavy top lid)
//   sclera  true: white eye with an iris inside (Fuecoco, Sobble); false: the iris fills the eye (Sprigatito, Quaxly)
//   iris    colour; irisSize (0..1 of the eye); irisY (offset, 0 = centred); pupil 'round' | 'slit' | 'cross' | 'none'
//   shine   1 | 2 (catchlights); lash: a single flick at the outer corner; line: outline colour; lid: thick top lid line
function g9mask(o, w, h) {
  const sh = o.shape || 'round', cx = w / 2, cy = h / 2, ry = h * (sh === 'tall' ? 0.48 : sh === 'sharp' ? 0.38 : sh === 'sleepy' ? 0.36 : 0.44);
  const top = (u) => {
    const s = Math.sin(Math.PI * u);
    if (sh === 'round' || sh === 'tall') return cy - ry * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2));
    if (sh === 'almond') return cy - ry * s ** 0.8;
    if (sh === 'droopy') return cy - ry * s ** 0.7 + (1 - u) * ry * 0.35;
    if (sh === 'sharp') return cy - ry * Math.min(1, s * 1.8) * 0.9 - (1 - u) * ry * 0.3 + u * ry * 0.15;
    return cy - ry * 0.55 * s ** 0.5;                                        // sleepy: a heavy, flat lid
  };
  const bot = (u) => {
    const s = Math.sin(Math.PI * u);
    if (sh === 'round' || sh === 'tall') return cy + ry * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2));
    if (sh === 'droopy') return cy + ry * 0.85 * s ** 0.8 + (1 - u) * ry * 0.2;
    if (sh === 'sharp') return cy + ry * 0.95 * s ** 0.7 - (1 - u) * ry * 0.1;
    return cy + ry * 0.9 * s ** 0.75;
  };
  const x0 = w * 0.06, x1 = w * 0.94;
  const inside = (x, y) => { const u = (x + 0.5 - x0) / (x1 - x0); if (u <= 0 || u >= 1) return false; return y + 0.5 >= top(u) && y + 0.5 <= bot(u); };
  return { inside, cx, cy, ry, top, bot, x0, x1 };
}
function g9open(p, w, h, o, keep) {
  const m = g9mask(o, w, h), line = o.line || INK, ok = (x, y) => m.inside(x, y) && (!keep || keep(x, y));
  const iris = o.iris || '#3a6ad0', irisLo = o.irisLo || shiftHex(iris, 0.3), irisHi = shiftHex(iris, -0.45);
  const ir = Math.min(w, h) * (o.sclera ? (o.irisSize ?? 0.3) : 0.6), icx = m.cx + (o.irisX || 0) * w, icy = m.cy + (o.irisY ?? (o.sclera ? 0.04 : 0.02)) * h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!ok(x, y)) continue;
    const dx = x + 0.5 - icx, dy = y + 0.5 - icy, inIris = !o.sclera || dx * dx + dy * dy <= ir * ir;
    let c;
    if (!inIris) c = y + 0.5 < m.top((x + 0.5 - m.x0) / (m.x1 - m.x0)) + 1.6 ? '#d6dcee' : WHITE;      // the lid's shadow on the white
    else {
      const t = Math.max(0, Math.min(1, (dy / (o.sclera ? ir : m.ry) + 1) / 2));
      c = t < 0.4 ? irisHi : t < 0.72 ? iris : irisLo;
      const pr = ir * 0.48, pupil = o.pupil || (o.sclera ? 'round' : 'round');
      if (pupil === 'round' && dx * dx + (dy + ir * 0.05) ** 2 <= pr * pr) c = o.pupilColor || INK;
      if (pupil === 'slit' && Math.abs(dx) <= Math.max(0.6, ir * 0.16) && Math.abs(dy) <= ir * 0.82) c = o.pupilColor || INK;
      if (pupil === 'cross' && (Math.abs(dx) <= 0.6 || Math.abs(dy) <= 0.6) && dx * dx + dy * dy <= pr * pr * 1.4) c = o.pupilColor || INK;
    }
    p.px(x, y, c);
  }
  // outline: 1 texel, the top lid line heavier
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!ok(x, y)) continue;
    const edge = !m.inside(x - 1, y) || !m.inside(x + 1, y) || !m.inside(x, y - 1) || !m.inside(x, y + 1);
    const topEdge = !m.inside(x, y - 1) || (o.lid !== false && !m.inside(x, y - 2) && y > 0 && m.inside(x, y - 1) && !m.inside(x, y - 2));
    if (edge || topEdge) p.px(x, y, line);
  }
  // catchlights: a big one high on the outer side of the iris, a glint low on the inner side
  const hr = Math.max(0.9, ir * (o.sclera ? 0.38 : 0.3)), hx = icx - ir * 0.38, hy = icy - ir * 0.42;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (ok(x, y) && (x + 0.5 - hx) ** 2 + (y + 0.5 - hy) ** 2 <= hr * hr) p.px(x, y, WHITE);
  if ((o.shine ?? 2) > 1) { const gx = Math.round(icx + ir * 0.42 - 0.5), gy = Math.round(icy + ir * 0.38 - 0.5); if (ok(gx, gy)) p.px(gx, gy, WHITE); }
  if (o.lash) { const u = 0.02, xx = Math.round(m.x0), yy = Math.round(m.top(0.08)); p.px(xx, yy - 1, line); if (xx > 0) p.px(xx - 1, yy - 2, line); }
}
function shiftHex(hex, k) {
  const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('');
}
// the open eye, optionally clipped by a lid line (keep(x, y) → visible)
function openEye(p, w, h, o, keep) {
  if (o.style === 'gen9') return g9open(p, w, h, o, keep);
  const { cx, cy, rx, ry } = shape(o.style, w, h), dark = o.color || INK;
  if (o.style === 'dot') {
    blob(p, w, h, cx, cy, rx, ry, dark, keep);
    const hs = rx > 1.9 ? 2 : 1, hx = Math.round(cx - rx * 0.55), hy = Math.round(cy - ry * 0.55);
    for (let a = 0; a < hs; a++) for (let b = 0; b < hs; b++) if (!keep || keep(hx + a, hy + b)) p.px(hx + a, hy + b, WHITE);
    return;
  }
  const acc = o.accent || '#5a6aa8';
  blob(p, w, h, cx, cy, rx, ry, (x, y) => (inside(x, y, cx, cy - ry * 0.22, rx * 0.92, ry * 0.98) ? dark : acc), keep);
  // big round catchlight high on the outer side, a small glint low on the inner side
  const hr = Math.max(1, Math.min(rx, ry) * 0.36);
  blob(p, w, h, cx - rx * 0.36, cy - ry * 0.38, hr, hr * 1.1, WHITE, keep);
  const gx = Math.round(cx + rx * 0.38), gy = Math.round(cy + ry * 0.3);
  if (!keep || keep(gx, gy)) p.px(gx, gy, WHITE);
}
const lidKeep = (w, h, o, y0, y1) => (x, y) => y + 0.5 >= y0 + ((y1 - y0) * (x + 0.5)) / w;
function lid(p, w, h, o, y0, y1) {
  const { cx, rx } = shape(o.style, w, h), t = o.style === 'dot' ? 1 : Math.max(1, Math.round(h / 9));
  const xa = cx - rx - 1, xb = cx + rx + 1, f = (x) => y0 + ((y1 - y0) * x) / w - 0.5;
  if (o.style === 'gen9') {        // the lid line only spans the eye
    const m = g9mask(o, w, h);
    for (let x = 0; x < w; x++) { const y = Math.round(f(x + 0.5)); let any = false; for (let yy = 0; yy < h; yy++) if (m.inside(x, yy)) any = true; if (any) for (let k = 0; k < t; k++) if (y + k >= 0 && y + k < h) p.px(x, y + k, o.line || INK); }
    return;
  }
  stroke(p, w, h, [[xa, f(xa)], [xb, f(xb)]], o.line || INK, t);
}
// state painters (p, w, h) for a style; R eye orientation (outer side at x = 0)
export function eyeArt(state, o = {}) {
  const st = { style: 'poke', ...o };
  return (p, w, h) => {
    const { cx, cy, rx, ry } = shape(st.style, w, h), ink = st.line || INK;
    const t = st.style === 'dot' ? 1 : Math.max(1, Math.round(h / 8));
    const big = { rx: Math.max(rx, w * 0.36), ry: Math.max(ry, h * 0.4) };
    switch (state) {
      case 'open': openEye(p, w, h, st); break;
      case 'closed': stroke(p, w, h, curve(cx - big.rx, cx + big.rx, (x) => cy - big.ry * 0.05 + (1 - ((x - cx) / big.rx) ** 2) * big.ry * 0.32), ink, t); break;
      case 'happy': stroke(p, w, h, curve(cx - big.rx, cx + big.rx, (x) => cy + big.ry * 0.3 - (1 - ((x - cx) / big.rx) ** 2) * big.ry * 0.62), ink, t); break;
      case 'shut': stroke(p, w, h, [[cx - big.rx, cy - big.ry * 0.62], [cx + big.rx * 0.75, cy], [cx - big.rx, cy + big.ry * 0.62]], ink, t); break;
      case 'x': stroke(p, w, h, [[cx - big.rx * 0.8, cy - big.ry * 0.7], [cx + big.rx * 0.8, cy + big.ry * 0.7]], ink, t); stroke(p, w, h, [[cx + big.rx * 0.8, cy - big.ry * 0.7], [cx - big.rx * 0.8, cy + big.ry * 0.7]], ink, t); break;
      case 'swirl': {
        const R = Math.min(big.rx, big.ry), pts = [];
        for (let a = 0; a < 15; a += 0.3) { const r = (a / 15) * R; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * (big.ry / big.rx)]); }
        stroke(p, w, h, pts, ink, 1); break;
      }
      case 'shock': blob(p, w, h, cx, cy, big.rx, big.ry, ink); blob(p, w, h, cx, cy, big.rx - 1, big.ry - 1, WHITE); p.px(Math.floor(cx), Math.floor(cy), ink); if (w > 9) p.px(Math.floor(cx) - 1, Math.floor(cy), ink); break;
      case 'wide': {
        blob(p, w, h, cx, cy, big.rx, big.ry, ink); blob(p, w, h, cx, cy, big.rx - 1, big.ry - 1, WHITE);
        blob(p, w, h, cx + 0.3, cy + 0.2, big.rx * 0.5, big.ry * 0.55, st.color || INK); p.px(Math.round(cx - big.rx * 0.15), Math.round(cy - big.ry * 0.2), WHITE); break;
      }
      case 'angry': { const y0 = cy - ry * 0.95, y1 = cy - ry * 0.05; openEye(p, w, h, st, lidKeep(w, h, st, y0, y1)); lid(p, w, h, st, y0, y1); break; }
      case 'sad': { const y0 = cy - ry * 0.1, y1 = cy - ry * 0.9; openEye(p, w, h, st, lidKeep(w, h, st, y0, y1)); lid(p, w, h, st, y0, y1); break; }
      case 'sleepy': { const y = cy - ry * 0.1; openEye(p, w, h, st, lidKeep(w, h, st, y, y)); lid(p, w, h, st, y, y); break; }
      case 'heart': {
        const r = Math.min(big.rx, big.ry) * 0.55, col = '#ff3e6c';
        blob(p, w, h, cx - r * 0.9, cy - r * 0.35, r, r, col); blob(p, w, h, cx + r * 0.9, cy - r * 0.35, r, r, col);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const yy = y + 0.5 - (cy - r * 0.3), half = (r * 1.9) * (1 - yy / (r * 2.2)); if (yy >= 0 && Math.abs(x + 0.5 - cx) <= half) p.px(x, y, col); }
        p.px(Math.round(cx - r * 1.2), Math.round(cy - r * 0.6), WHITE); break;
      }
      case 'star': {
        const R = Math.min(big.rx, big.ry) * 1.05, col = '#ffd23a';
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = Math.abs(x + 0.5 - cx), dy = Math.abs(y + 0.5 - cy); if (dx * dy < R * 0.28 && dx < R && dy < R) p.px(x, y, dx + dy < R * 0.4 ? WHITE : col); }
        break;
      }
      case 'teary': {
        openEye(p, w, h, st);
        blob(p, w, h, cx, cy + ry * 0.62, rx * 0.8, ry * 0.32, '#8ad8ff', (x, y) => inside(x, y, cx, cy, rx, ry));
        p.px(Math.round(cx + rx * 0.2), Math.round(cy - ry * 0.55), WHITE); break;
      }
      default: openEye(p, w, h, st);
    }
  };
}
export const EYE_STATES = ['open', 'closed', 'happy', 'shut', 'x', 'swirl', 'shock', 'wide', 'angry', 'sad', 'sleepy', 'heart', 'star', 'teary'];
const GLOW = new Set(['heart', 'star']);
// two eye bones with every state as a plane. at: the right eye's centre (x < 0) in model units;
// size: the plane in units (the drawing canvas; the open eye fills part of it)
export function eyeRig(o = {}) {
  const { parent = 'head', at, size = [3, 3.4], plane = 'z', states = EYE_STATES } = o;
  const [x, y, z] = at, [w, h] = size;
  const mk = (side) => states.map((s) => ({
    o: side < 0 ? [x - w / 2, y - h / 2, z] : [-x - w / 2, y - h / 2, z], s: [w, h, 0], plane, mirror: side > 0,
    tex: eyeArt(s, o), glow: GLOW.has(s) && o.glow !== false, id: (side < 0 ? 'eR-' : 'eL-') + s, hide: s !== 'open', outline: false,
  }));
  const bones = [
    { name: o.right || 'eyeR', parent, pivot: [x, y, z], cubes: mk(-1) },
    { name: o.left || 'eyeL', parent, pivot: [-x, y, z], cubes: mk(1) },
  ];
  const slot = { default: 'open', states: Object.fromEntries(states.map((s) => [s, ['eR-' + s, 'eL-' + s]])) };
  if (states.includes('happy')) slot.states.wink = ['eR-open', 'eL-happy'];
  return { bones, slot };
}

// ---------------------------------------------------------------- mouths
// simple mouths in the same language. o: { line, inner, tongue, teeth }
export function mouthArt(state, o = {}) {
  const line = o.line || INK, inner = o.inner || '#5a1424', tongue = o.tongue || '#ff7a90', teeth = o.teeth || WHITE;
  return (p, w, h) => {
    const cx = w / 2, cy = h / 2, rx = w * 0.42, ry = h * 0.42, t = Math.max(1, Math.round(h / 7));
    switch (state) {
      case 'smile': stroke(p, w, h, curve(cx - rx, cx + rx, (x) => cy - ry * 0.25 + (1 - ((x - cx) / rx) ** 2) * ry * 0.5), line, t); break;
      case 'cat': stroke(p, w, h, curve(cx - rx, cx, (x) => cy - ry * 0.2 + Math.sin(((x - cx + rx) / rx) * Math.PI) * ry * 0.45), line, t); stroke(p, w, h, curve(cx, cx + rx, (x) => cy - ry * 0.2 + Math.sin(((x - cx) / rx) * Math.PI) * ry * 0.45), line, t); break;
      case 'grin': blob(p, w, h, cx, cy - ry * 0.3, rx, ry * 1.1, line, (x, y) => y + 0.5 >= cy - ry * 0.3); blob(p, w, h, cx, cy - ry * 0.3, rx - 1, ry * 1.1 - 1, inner, (x, y) => y + 0.5 >= cy - ry * 0.3 + 1); blob(p, w, h, cx, cy + ry * 0.55, rx * 0.5, ry * 0.35, tongue); break;
      case 'o': blob(p, w, h, cx, cy, rx * 0.45, ry * 0.7, line); blob(p, w, h, cx, cy, rx * 0.45 - 1, ry * 0.7 - 1, inner); break;
      case 'wavy': stroke(p, w, h, curve(cx - rx, cx + rx, (x) => cy + Math.sin(((x - cx) / rx) * Math.PI * 2) * ry * 0.3, 16), line, t); break;
      case 'frown': stroke(p, w, h, curve(cx - rx * 0.8, cx + rx * 0.8, (x) => cy + ry * 0.3 - (1 - ((x - cx) / (rx * 0.8)) ** 2) * ry * 0.5), line, t); break;
      case 'grit': blob(p, w, h, cx, cy, rx, ry * 0.6, line); blob(p, w, h, cx, cy, rx - 1, ry * 0.6 - 1, teeth); for (let x = Math.ceil(cx - rx + 2); x < cx + rx - 1; x += 2) p.px(x, Math.floor(cy), line); break;
      case 'tongue': stroke(p, w, h, curve(cx - rx, cx + rx, (x) => cy - ry * 0.3 + (1 - ((x - cx) / rx) ** 2) * ry * 0.35), line, t); blob(p, w, h, cx + rx * 0.25, cy + ry * 0.35, rx * 0.32, ry * 0.5, tongue, (x, y) => y + 0.5 > cy - ry * 0.05); break;
      case 'flat': stroke(p, w, h, [[cx - rx * 0.6, cy], [cx + rx * 0.6, cy]], line, t); break;
      default: stroke(p, w, h, [[cx - rx * 0.6, cy], [cx + rx * 0.6, cy]], line, t);
    }
  };
}
export const MOUTH_STATES = ['smile', 'cat', 'grin', 'o', 'wavy', 'frown', 'grit', 'tongue', 'flat'];
// a mouth plane set on a bone; returns { cubes, slot }
export function mouthRig(o = {}) {
  const { at, size = [3, 1.6], plane = 'z', states = MOUTH_STATES, def = 'smile' } = o, [x, y, z] = at, [w, h] = size;
  const cubes = states.map((s) => ({ o: [x - w / 2, y - h / 2, z], s: [w, h, 0], plane, tex: mouthArt(s, o), id: 'm-' + s, hide: s !== def, outline: false }));
  return { cubes, slot: { default: def, states: Object.fromEntries(states.map((s) => [s, ['m-' + s]])) } };
}
