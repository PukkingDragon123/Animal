// Hand-drawn pixel eyes for the Grenaday and Snoozaque lines (creature_rules §7 / §9): a white eye
// with shaped corners, a shaded iris fill (darker at the top) holding a defined pupil, clean square
// highlights, a lid line (and, for liner eyes, an under-lash and smudge) — never a bullseye of rings. Each emotion is its own designed map: a stepped diagonal lid for
// angry, a drooping one for sad, half lids for smug and sleepy, ^ blocks for happy, a flat line for
// closed, a small pupil in more white for shock. Maps use the eyes.js 'pix' palette:
//   l line · w white · s shaded white · k pupil · h highlight · i iris · I dark iris · c accent (lid skin)
// Outer corner at x = 0 (the right eye; the left eye is mirrored by eyeRig).

function grid(w, h) {
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  const api = {
    get: (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? g[y][x] : '.'),
    set(x, y, c) { if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = c; return api; },
    rect(x0, y0, x1, y1, c, keep) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!keep || keep(api.get(x, y))) api.set(x, y, c); return api; },
    rows: () => g.map((r) => r.join('')),
  };
  return api;
}

// o: { w, h, eye: [x0, y0, x1, y1] sclera block, cut: corner steps [tl, tr, bl, br] (px), iris: [x0, y0, x1, y1],
//      dark: rows of dark iris at its top, pupil: [x0, y0, x1, y1], hi: [[x, y], …], glint: [[x, y], …],
//      t: lid thickness, wing: [[x, y], …] (liner flick pixels), lidSkin: fill above the lid with 'c' (sleepy lids) }
// lid: a function x → the lid line's top row for that column (the eye shows below the line)
// m: per-state tweaks { pupil, iris, hi, glint, noIris, skin }
export function blockEye(o, lid, m = {}) {
  const G = grid(o.w, o.h), [ex0, ey0, ex1, ey1] = o.eye, cut = o.cut || [0, 0, 1, 1];
  const inEye = (x, y) => {
    if (x < ex0 || x > ex1 || y < ey0 || y > ey1) return false;
    const dx0 = x - ex0, dx1 = ex1 - x, dy0 = y - ey0, dy1 = ey1 - y;
    if (dy0 < cut[0] && dx0 < cut[0] - dy0) return false;
    if (dy0 < cut[1] && dx1 < cut[1] - dy0) return false;
    if (dy1 < cut[2] && dx0 < cut[2] - dy1) return false;
    if (dy1 < cut[3] && dx1 < cut[3] - dy1) return false;
    return true;
  };
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) if (inEye(x, y)) G.set(x, y, 'w');
  const iris = m.iris || o.iris, pupil = m.pupil || o.pupil;
  if (iris && !m.noIris) for (let y = iris[1]; y <= iris[3]; y++) for (let x = iris[0]; x <= iris[2]; x++) if (inEye(x, y)) G.set(x, y, y < iris[1] + (o.dark ?? 2) ? 'I' : 'i');
  if (pupil) for (let y = pupil[1]; y <= pupil[3]; y++) for (let x = pupil[0]; x <= pupil[2]; x++) if (inEye(x, y)) G.set(x, y, 'k');
  for (const [x, y] of m.hi || o.hi || []) if (inEye(x, y)) G.set(x, y, 'h');
  for (const [x, y] of m.glint || o.glint || []) if (inEye(x, y)) G.set(x, y, 'h');
  // the lid: clear above the line, draw the line (t px) on every column the eye spans (+1 at the outer side)
  const t = m.t ?? o.t ?? 2;
  for (let x = ex0 - 1; x <= ex1; x++) {
    const ly = Math.round(lid(x));
    let any = false; for (let y = 0; y < o.h; y++) if (inEye(x, y) || inEye(x + 1, y)) any = true;
    if (!any) continue;
    for (let y = 0; y < ly; y++) G.set(x, y, inEye(x, y) ? ((m.skin ?? o.lidSkin) ? 'c' : '.') : G.get(x, y));
    for (let y = ly; y < ly + t; y++) if (y >= 0 && y <= ey1 + 1 && (inEye(x, y) || y <= ey0 || x === ex0 - 1)) G.set(x, y, 'l');
  }
  // liner eyes: a lash line hugging the bottom of the eye and a smoky smudge under it
  if (m.under ?? o.under) for (let x = ex0; x <= ex1; x++) {
    let yb = -1; for (let y = 0; y < o.h; y++) if ('wsiIkh'.includes(G.get(x, y))) yb = y;
    if (yb < 0) continue;
    G.set(x, yb + 1, 'l'); if ((m.smudge ?? o.smudge) && x > ex0 && x < ex1) G.set(x, yb + 2, 'c');
  }
  for (const [x, y] of m.wing ?? o.wing ?? []) G.set(x, y, 'l');
  return G.rows();
}
// '^' blocks (happy): a chunky stepped arch t px thick from (x0, base) up to the peak and down
export function arch(o, x0, x1, base, peak, t = 2, wing = [], ch = 'l') {
  const G = grid(o.w, o.h), cx = (x0 + x1) / 2, half = (x1 - x0) / 2;
  for (let x = x0; x <= x1; x++) { const y = Math.round(peak + ((base - peak) * Math.abs(x - cx)) / half); for (let k = 0; k < t; k++) G.set(x, y + k, ch); }
  for (const [x, y] of wing) G.set(x, y, 'l');
  return G.rows();
}
// a flat closed line (t px) with stepped ends dipping one row
export function shut(o, x0, x1, y, t = 2, dip = 1, wing = []) {
  const G = grid(o.w, o.h);
  for (let x = x0; x <= x1; x++) { const end = x - x0 < 2 || x1 - x < 2 ? dip : 0; for (let k = 0; k < t; k++) G.set(x, y + end + k, 'l'); }
  for (const [x, y2] of wing) G.set(x, y2, 'l');
  return G.rows();
}
// a lid profile: straight from (xa, ya) to (xb, yb), stepped (rounded to whole rows)
export const slope = (xa, ya, xb, yb) => (x) => ya + ((yb - ya) * Math.max(0, Math.min(1, (x - xa) / Math.max(1, xb - xa))));
export const flat = (y) => () => y;
