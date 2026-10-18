// Set dressing that mixes voxels and 2D cards: trees with voxel trunks and
// branches under crowns of painted leaf clumps, potted bamboo and ferns, tall
// grass, strings of paper lanterns, pennants, laundry lines and overhead wires.
// Positions are in voxels (like the kit); cards and wires are placed in metres.
import * as THREE from '../../vendor/three.module.js';
import { Cards, SPR, paintAll, pick, spriteInfo } from './cards.js';
import { h3 } from './kit.js';

export class Dress {
  constructor(kit) { this.k = kit; this.v = kit.v; this.s = 1 / kit.v.vpm; this.cards = new Cards(); this.wires = []; paintAll(); }
  card(spr, x, y, z, o) { const s = this.s; this.cards.add(spr, x * s, y * s, z * s, o); return this; }
  // voxel line from a to b (inclusive) with an optional radius
  limb(a, b, name, r = 0) {
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) * 2) + 1;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = Math.round(a[0] + (b[0] - a[0]) * t), y = Math.round(a[1] + (b[1] - a[1]) * t), z = Math.round(a[2] + (b[2] - a[2]) * t);
      if (r) this.k.box(x, y, z, x + r, y, z + r, name); else this.k.set(x, y, z, name);
    }
  }
  // a tree: voxel trunk + branches, a crown of leaf-clump cards toned by height and sun side.
  // kind: leaf (plane/ficus), oak, euc, ginkgo, bloom, cypress
  tree(x, y, z, kind = 'leaf', seed = 1, o = {}) {
    const k = this.k, R = (i) => h3(seed * 31 + 7, i, 77), set = SPR[kind === 'leaf' ? 'leaf' : kind] || SPR.leaf;
    const H = o.h || { leaf: 30, oak: 22, euc: 60, ginkgo: 34, bloom: 20, cypress: 22 }[kind] || 28;
    const CR = o.r || { leaf: 20, oak: 30, euc: 18, ginkgo: 15, bloom: 19, cypress: 34 }[kind] || 20;
    const thick = kind === 'oak' || kind === 'euc' || kind === 'cypress' ? 2 : 1;
    const bark = kind === 'euc' ? ['#b8aa98', '#a69884', '#cfc4b0', '#8e8070'] : kind === 'leaf' ? ['#8a8270', '#9a9280', '#6e6656', '#b0a890'] : 'trunk';
    // trunk: root flare, slight lean, mottled bark
    let tx = x, tz = z; const lx = R(1) < 0.5 ? -1 : 1, lz = R(2) < 0.5 ? -1 : 1, every = 8 + Math.floor(R(3) * 10);
    k.box(x - 1, y, z - 1, x + thick + 1, y + 1, z + thick + 1, bark, 'patch', { sc: 2 });
    for (let j = 0; j < H; j++) {
      if (j > 6 && j % every === 0) { if (R(10 + j) < 0.6) tx += lx; else tz += lz; }
      k.box(tx, y + j, tz, tx + thick, y + j, tz + thick, bark, 'patch', { sc: 2 });
    }
    const top = [tx + thick / 2, y + H, tz + thick / 2];
    // branches out to the clump centres
    const nb = o.branches || (kind === 'cypress' ? 5 : kind === 'euc' ? 4 : 5), ends = [];
    for (let i = 0; i < nb; i++) {
      const a = (i / nb) * Math.PI * 2 + R(20 + i) * 1.2, el = kind === 'cypress' ? 0.18 + R(30 + i) * 0.2 : 0.45 + R(30 + i) * 0.5;
      const sy = y + Math.round(H * (kind === 'euc' ? 0.55 : 0.62) + R(40 + i) * H * 0.3), L = CR * (0.62 + R(50 + i) * 0.3);
      const e = [top[0] + Math.cos(a) * Math.cos(el) * L, sy + Math.sin(el) * L, top[2] + Math.sin(a) * Math.cos(el) * L * 0.8];
      this.limb([top[0], sy, top[2]], e, bark, thick > 1 && i % 2 ? 1 : 0);
      const mid = [(top[0] + e[0]) / 2, (sy + e[1]) / 2, (top[2] + e[2]) / 2];
      this.limb(mid, [mid[0] + Math.cos(a + 1.1) * L * 0.35, mid[1] + L * 0.25, mid[2] + Math.sin(a + 1.1) * L * 0.3], bark);
      ends.push(e, [mid[0] + Math.cos(a + 1.1) * L * 0.35, mid[1] + L * 0.25, mid[2] + Math.sin(a + 1.1) * L * 0.3]);
    }
    ends.push([top[0], y + H + CR * 0.45, top[2]]);
    // crown
    const cy = ends.reduce((m, e) => m + e[1], 0) / ends.length, cx = top[0], cz = top[2];
    const per = o.per || (kind === 'cypress' ? 3 : 4), spread = CR * (kind === 'cypress' ? 0.35 : 0.42);
    let n = 0;
    for (const e of ends) for (let j = 0; j < per; j++) {
      const r1 = h3(seed, n, 5), r2 = h3(seed, n, 6), r3 = h3(seed, n, 7), r4 = h3(seed, n, 8); n++;
      const px = e[0] + (r1 - 0.5) * spread * 2, py = e[1] + (r2 - 0.5) * spread * (kind === 'cypress' ? 0.5 : 1.2), pz = e[2] + (r3 - 0.5) * spread * 1.6;
      const lit = (py - cy) / CR * 1.1 - (px - cx) / CR * 0.45 + (pz - cz) / CR * 0.25 + (r4 - 0.5) * 0.3;
      const tone = lit > 0.3 ? set.hi : lit < -0.25 ? set.lo : set.mid;
      const sc = (o.scale || 1) * (0.85 + r4 * 0.3), spr = pick(tone, r1), info = spriteInfo(spr);
      this.card(spr, px, py - (info.h / info.ppm) * this.v.vpm * sc * 0.5, pz, { scale: sc, rot: (r2 - 0.5) * 0.5, sway: kind === 'euc' ? 1.4 : 1 });
    }
    return top;
  }
  // a pot (voxels) with a card plant
  pot(x, y, z, plant = 'bamboo', col = '#b85a3a', seed = 1) {
    const k = this.k, v = this.v, c = v.c(col), d = v.c('#8a3e2a'), soil = v.c('#4a3424');
    k.box(x - 2, y, z - 2, x + 2, y + 4, z + 2, (xx, yy, zz) => (yy === y + 4 && Math.abs(xx - x) < 2 && Math.abs(zz - z) < 2 ? soil : yy === y + 3 ? d : c));
    const list = SPR[plant] || SPR.bamboo;
    for (let i = 0; i < (plant === 'bamboo' ? 2 : 1); i++) this.card(pick(list, h3(seed, i, 3)), x + (i - 0.5) * 1.5, y + 4.5, z + 0.5, { scale: 0.9 + h3(seed, i, 4) * 0.25, sway: 1.2 });
  }
  // scatter tall grass / flower / fern cards over the top surface of a region (voxels)
  tufts(x0, z0, x1, z1, n, list, seed = 1, o = {}) {
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + h3(seed, i, 1) * (x1 - x0)), z = Math.round(z0 + h3(seed, i, 2) * (z1 - z0)), y = this.v.top(x, z);
      if (y < 0 || (o.maxY && y > o.maxY)) continue;
      this.card(pick(list, h3(seed, i, 3)), x, y + 1, z, { scale: (o.scale || 1) * (0.8 + h3(seed, i, 4) * 0.4), sway: o.sway ?? 1.3 });
    }
  }
  // ---- things on wires (a, b in voxels)
  wire(a, b, sag = 6, color = 0x2a2428, seg = 16) {
    const s = this.s, pts = [];
    for (let i = 0; i <= seg; i++) { const t = i / seg; pts.push([(a[0] + (b[0] - a[0]) * t) * s, (a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t)) * s, (a[2] + (b[2] - a[2]) * t) * s]); }
    this.wires.push({ pts, color });
    return (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  }
  lanterns(a, b, o = {}) {
    const at = this.wire(a, b, o.sag ?? 10, 0x3a1e1e), L = Math.hypot(b[0] - a[0], b[2] - a[2]), step = o.step || 9, n = Math.floor(L / step);
    for (let i = 1; i < n; i++) { const p = at(i / n); this.card(o.big ? pick(SPR.lanternBig, h3(i, 2, 9)) : SPR.lantern[(i + (o.alt || 0)) % (o.mixed ? 2 : 1)], p[0], p[1], p[2], { hang: true, glow: true, sway: 0.6, scale: o.scale || 1 }); }
  }
  pennants(a, b, o = {}) {
    const at = this.wire(a, b, o.sag ?? 8, 0x4a4040), L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.floor(L / (o.step || 4));
    for (let i = 1; i < n; i++) { const p = at(i / n); this.card(SPR.pennant[i % SPR.pennant.length], p[0], p[1], p[2], { hang: true, sway: 1.6 }); }
  }
  laundry(a, b, o = {}) {
    const at = this.wire(a, b, o.sag ?? 5, 0x6a6a70), L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.floor(L / (o.step || 7));
    for (let i = 1; i < n; i++) { if (h3(i, o.seed || 1, 4) < 0.18) continue; const p = at(i / n); this.card(pick(SPR.laundry, h3(i, o.seed || 1, 5)), p[0], p[1] + 0.3, p[2], { hang: true, sway: 2.2 }); }
  }
  // add everything to the stage
  build(stage) {
    this.cards.build(stage);
    const byCol = new Map();
    for (const w of this.wires) { if (!byCol.has(w.color)) byCol.set(w.color, []); const L = byCol.get(w.color); for (let i = 0; i + 1 < w.pts.length; i++) L.push(...w.pts[i], ...w.pts[i + 1]); }
    for (const [col, arr] of byCol) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      stage.scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: col })));
    }
  }
}
