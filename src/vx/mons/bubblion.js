// PROTOTYPE — bubble ring study
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import { shade, gradient, layer, on, poly, ramp, dith, shift, mix, h2 } from './kit.js';

const Q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const SET = Q.get('rings') || 'B';
const D2R = Math.PI / 180;
const nrm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
const LIGHT = nrm([-0.55, 1, 0.42]);
const R = 15, CY = 15;

function ringPaint(axis, yaw = 0, o = {}) {
  return (p, w, h) => {
    const cx = w / 2, cy = h / 2, Rt = w / 2;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const u = (i + 0.5 - cx) / Rt, v = (cy - (j + 0.5)) / Rt, d = Math.hypot(u, v) * Rt;
      if (d > Rt) continue;
      const depth = Rt - d;
      let dir;
      if (axis === 'z') { const a = yaw * D2R; dir = [u * Math.cos(a), v, -u * Math.sin(a)]; }
      else if (axis === 'x') dir = [0, v, u];
      else dir = [u, 0, -v];
      dir = nrm(dir);
      const lit = dir[0] * LIGHT[0] + dir[1] * LIGHT[1] + dir[2] * LIGHT[2];
      const rimW = (o.thin ? 0.8 : 1.4) + (o.thin ? 0.8 : 1.8) * Math.max(0, lit);
      let c = 0;
      if (depth < 1) c = lit > 0.1 ? '#86d2ee' : '#4f98c8';
      else if (depth < 1 + rimW) c = lit > 0.5 ? '#ffffff' : '#d6f4ff';
      else if (depth < 1 + rimW + (o.thin ? 1.5 : 3.5)) { const k = 1 - (depth - 1 - rimW) / (o.thin ? 1.5 : 3.5); c = dith(0, '#9fe0f4', k * 0.7, i, j); }
      if (!o.thin && lit > 0.35 && depth > 4.5 && depth < 4.5 + 2.4 * (lit - 0.35) / 0.65 + 0.6) c = '#ffffff';
      if (lit < -0.45 && depth >= 1 + rimW + 0.5 && depth < 1 + rimW + 1.8) c = '#bfeefc';
      if (c) p.px(i, j, c);
    }
  };
}
const fishP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x >> 1) % 3 === 0 ? '#1a1a22' : '#f0f2f6'); };
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const rings = [];
const S2 = 2 * R;
const zr = (yaw, o = {}) => P([-R, CY - R, 0], [S2, S2, 0], ringPaint('z', yaw, o), { plane: 'z', pivot: [0, CY, 0], rot: [0, yaw, 0], shadow: false });
if (SET === 'A' || SET === 'B' || SET === 'C') {
  rings.push(zr(0), P([0, CY - R, -R], [0, S2, S2], ringPaint('x'), { plane: 'x', shadow: false }));
}
if (SET === 'B' || SET === 'C') rings.push(zr(45, { thin: true }), zr(-45, { thin: true }));
if (SET === 'C') rings.push(P([-R, CY, -R], [S2, 0, S2], ringPaint('y', 0, { thin: true }), { plane: 'y', shadow: false }));

export const def = {
  name: 'bubblion', ppu: 3, scale: 0.4, outline: { color: '#101016', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'ball', parent: 'root', pivot: [0, CY, 0], cubes: rings },
    { name: 'fish', parent: 'root', pivot: [0, CY, 0], cubes: [P([-3.3, 11.6, -2], [6.6, 7.4, 9], fishP), P([0, 11, -9], [0, 8, 7], fishP, { plane: 'x' })] },
  ],
};
export const anim = { start: 'idle', clips: { idle: { len: 1, loop: true, f() {} } } };
def.anim = anim;
