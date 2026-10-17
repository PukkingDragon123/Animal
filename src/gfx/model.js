// Rigged voxel models from a design DSL. Every part is voxelized on the same
// global lattice (so the rest pose is seamless) and hung on a bone at its
// pivot; eyes and mouths are swappable pixel-art decals for anime expressions.
//
// design = {
//   vs: voxel size (m), pal: { key: '#hex' }, arch: 'quad'|'biped'|…,
//   parts: [{ n, parent?, p:[pivot], s:[shapes], mirror?:true, mp?, sway?, spin?, hide? }],
//   eyes:  { part, at, dir?, style, iris, px?, mirror? },
//   mouth: { part, at, dir?, style, px? },
//   decals:[{ part, at, dir?, rows, cmap, px?, mirror? }],
//   fx:    [{ part, at, type, rate?, scale? }]   particle emitter anchors
// }
import * as THREE from '../../vendor/three.module.js';
import { voxelize, meshGrid, decalGeometry, rayHit } from './voxel.js';
import { toonMaterial, glowMaterial } from './materials.js';

// ----------------------------------------------------------- eye patterns
const EYE_BASE = {
  anime: ['.kkk.', 'kwwik', 'kwiik', 'kiiik', '.kkk.'],
  big: ['.kkkk.', 'kwwiik', 'kwiiik', 'kiiiik', 'kiiiwk', '.kkkk.'],
  bead: ['kk', 'wk'],
  dot: ['k'],
  round: ['.kk.', 'kwik', 'kiik', '.kk.'],
  sharp: ['kkkk.', 'kwiik', '.kkkk'],
  fierce: ['kk...', 'kwkk.', 'kiiik', '.kkkk'],
  sleepy: ['kkkkk', 'kiiik', '.kkk.'],
  tall: ['kk', 'wk', 'ik', 'kk'],
  cyclops: ['..kkkk..', '.kssssk.', 'ksskkssk', 'kskwikks', 'kskiikks', 'ksskkssk', '.kssssk.', '..kkkk..'],
  visor: ['gggggg', 'gwgggg'],
  goggle: ['.mmmm.', 'mkwikm', 'mkiikm', '.mmmm.'],
  star: ['..k..', '.kwk.', 'kiiik', '.kik.', 'k...k'],
};

function patW(rows) { return Math.max(...rows.map((r) => r.length)); }
function blank(w, h) { return Array.from({ length: h }, () => Array(w).fill('.')); }
const toRows = (g) => g.map((r) => r.join(''));

// Expression variants derived procedurally from the base pattern's size.
export function eyeVariants(style) {
  const base = EYE_BASE[style] || EYE_BASE.anime;
  const w = patW(base), h = base.length;
  const out = { normal: base };
  if (w <= 2 && h <= 2) {
    out.happy = [w === 1 ? 'k' : 'kk']; out.closed = out.happy; out.hurt = out.happy; out.ko = ['k']; out.angry = base; out.sad = base;
    return out;
  }
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  { // happy ^
    const g = blank(w, h);
    for (let c = 0; c < w; c++) { const r = Math.round(cy - 0.5 + Math.abs(c - cx) * (h > 3 ? 0.9 : 0.6)); if (r >= 0 && r < h) g[r][c] = 'k'; }
    out.happy = toRows(g);
  }
  { // closed —
    const g = blank(w, h); const r = Math.min(h - 1, Math.round(cy + 0.3));
    for (let c = 0; c < w; c++) g[r][c] = 'k';
    out.closed = toRows(g);
  }
  { // hurt > (mirrors to <)
    const g = blank(w, h);
    for (let r = 0; r < h; r++) { const c = Math.round((1 - Math.abs(r - cy) / Math.max(cy, 0.5)) * (w - 1)); g[r][Math.max(0, Math.min(w - 1, c))] = 'k'; }
    out.hurt = toRows(g);
  }
  { // ko x
    const g = blank(w, h); const n = Math.min(w, h);
    for (let t = 0; t < n; t++) { const r = Math.round((t / (n - 1 || 1)) * (h - 1)); const c = Math.round((t / (n - 1 || 1)) * (w - 1)); g[r][c] = 'k'; g[r][w - 1 - c] = 'k'; }
    out.ko = toRows(g);
  }
  { // angry: cut outer-top corner with a lid line
    const g = base.map((r) => r.padEnd(w, '.').split(''));
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      const lid = (w - 1 - c) * (h / w) * 0.7 - r; // slopes down toward the inner side (right col = inner for left eye)
      if (lid > 0.6) g[r][c] = '.';
      else if (lid > -0.4 && g[r][c] !== '.') g[r][c] = 'k';
    }
    out.angry = toRows(g);
  }
  { // sad: opposite slant
    const g = base.map((r) => r.padEnd(w, '.').split(''));
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      const lid = c * (h / w) * 0.7 - r;
      if (lid > 0.6) g[r][c] = '.';
      else if (lid > -0.4 && g[r][c] !== '.') g[r][c] = 'k';
    }
    out.sad = toRows(g);
  }
  return out;
}

const MOUTHS = {
  cat: { closed: ['k.k.k', '.k.k.'], open: ['.kkk.', 'krrrk', 'krtrk', '.kkk.'] },
  line: { closed: ['kkk'], open: ['.k.', 'krk', '.k.'] },
  smile: { closed: ['k...k', '.kkk.'], open: ['kkkkk', 'krrrk', '.krk.'] },
  fang: { closed: ['kkkkk', '.w.w.'], open: ['kkkkk', 'kw.wk', 'krrrk', '.kkk.'] },
  grin: { closed: ['kwwwk'], open: ['kwwwk', 'krrrk', 'kwwwk'] },
  beak: { closed: [], open: ['.kk.', 'krrk', '.kk.'] },
  tiny: { closed: ['k'], open: ['k', 'r'] },
  w: { closed: ['k.k.k', '.k.k.'], open: ['k.k.k', '.krk.', '..k..'] },
  zig: { closed: ['k.k.k.k', '.k.k.k.'], open: ['kkkkkkk', 'kw.w.wk', 'krrrrrk', '.kkkkk.'] },
  lips: { closed: ['.ppp.', 'ppppp', '.ppp.'], open: ['.ppp.', 'prrrp', 'pwwwp', '.ppp.'] },
  none: { closed: [], open: [] },
};

const DECAL_CMAP = (iris, extra = {}) => Object.assign({
  k: '#16111c', w: '#ffffff', i: iris || '#3a2a1a', s: '#f4f1ea', r: '#a3243a', t: '#ff8aa0',
  g: { c: iris || '#7ff', glow: 2 }, m: '#3b3f4a', p: '#e0263c',
}, extra);

// ----------------------------------------------------------- templates
const templates = new Map();

function mirrorTuple(t) {
  // Clone a shape tuple with "mirror only" semantics (evaluated at -x).
  const out = t.slice();
  const oi = typeof out[out.length - 1] === 'object' && !Array.isArray(out[out.length - 1]) ? out.length - 1 : -1;
  const opts = oi >= 0 ? Object.assign({}, out[oi]) : {};
  opts._mo = 1;
  if (oi >= 0) out[oi] = opts; else out.push(opts);
  return out;
}

function expandParts(parts) {
  const names = new Set(parts.map((p) => p.n));
  const out = [];
  for (const p of parts) {
    out.push(p);
    if (p.mirror) {
      const n2 = typeof p.mirror === 'string' ? p.mirror : p.n.replace(/L$/, 'R').replace(/L(\d+)$/, 'R$1');
      let parent = p.mp || p.parent;
      if (!p.mp && parent && /L\d*$/.test(parent)) {
        const pr = parent.replace(/L$/, 'R').replace(/L(\d+)$/, 'R$1');
        if (names.has(pr) || parts.some((q) => q.n === parent && q.mirror)) parent = pr;
      }
      out.push(Object.assign({}, p, { n: n2, parent, p: [-p.p[0], p.p[1], p.p[2]], s: p.s.map(mirrorTuple), mirror: false, _mirrored: true, sway: p.sway ? Object.assign({}, p.sway, { mirror: true }) : undefined }));
      names.add(n2);
    }
  }
  return out;
}

// voxelize() treats opts._mo as "only the mirrored copy" — implement by
// pre-negating geometry: simplest is to evaluate shapes at -x, which voxelize
// does for {m:1}; so translate _mo into a wrapper part grid flip.
function voxelizePart(shapes, design) {
  const normal = [], mirrored = [];
  for (const t of shapes) {
    const o = t[t.length - 1];
    if (o && typeof o === 'object' && !Array.isArray(o) && o._mo) mirrored.push(t); else normal.push(t);
  }
  if (!mirrored.length) return voxelize(normal, { vs: design.vs, pal: design.pal });
  // Mirrored-only shapes: voxelize un-mirrored, then flip the grid along x.
  const g = voxelize(mirrored.map((t) => { const c = t.slice(); const o = Object.assign({}, c[c.length - 1]); delete o._mo; c[c.length - 1] = o; return c; }), { vs: design.vs, pal: design.pal });
  const f = new g.constructor(-(g.ox + g.nx - 1), g.oy, g.oz, g.nx, g.ny, g.nz, g.vs);
  for (let i = 0; i < g.nx; i++) for (let j = 0; j < g.ny; j++) for (let k = 0; k < g.nz; k++) f.data[f.idx(g.nx - 1 - i, j, k)] = g.data[g.idx(i, j, k)];
  return f;
}

function placeDecal(spec, partGrid, partPivot, rows, cmap, px, pal, mirror, depth) {
  const geo = decalGeometry(rows, cmap, px, pal, { mirror, depth });
  // find the surface: march from outside along -dir
  const at = spec.at.slice(); if (mirror) at[0] = -at[0];
  let dir = spec.dir ? spec.dir.slice() : [0, 0, 1];
  if (mirror) dir[0] = -dir[0];
  const l = Math.hypot(dir[0], dir[1], dir[2]) || 1; dir = dir.map((v) => v / l);
  let pos = at;
  if (partGrid && spec.snap !== false) {
    const vs = partGrid.vs;
    const from = [at[0] + dir[0] * vs * 6, at[1] + dir[1] * vs * 6, at[2] + dir[2] * vs * 6];
    const hit = rayHit(partGrid, from, [-dir[0], -dir[1], -dir[2]], vs * 16);
    if (hit) pos = [hit.x, hit.y, hit.z];
  }
  const lift = spec.lift ?? px * 0.5;
  pos = [pos[0] + dir[0] * lift - partPivot[0], pos[1] + dir[1] * lift - partPivot[1], pos[2] + dir[2] * lift - partPivot[2]];
  const yaw = Math.atan2(dir[0], dir[2]);
  const pitch = -Math.asin(Math.max(-1, Math.min(1, dir[1])));
  return { geo, pos, rot: [pitch, yaw, spec.roll ? (mirror ? -spec.roll : spec.roll) * Math.PI / 180 : 0] };
}

export function getTemplate(design, key) {
  const k = key || design.id;
  if (k && templates.has(k)) return templates.get(k);
  const t = buildTemplate(design);
  if (k) templates.set(k, t);
  return t;
}
export function clearTemplates() { templates.clear(); }

export function buildTemplate(design) {
  const parts = expandParts(design.parts);
  const byName = new Map();
  const out = { design, parts: [], decals: [], fx: [], bounds: new THREE.Box3(), faces: 0 };
  // 1) voxelize every part on the shared lattice
  const grids = parts.map((p) => voxelizePart(p.s, design));
  // 2) each lattice cell belongs to one part (first claimer, unless part.over)
  //    → no coplanar duplicate faces where parts overlap; 3) union occupancy
  //    drives AO so junctions get proper crevice shadows.
  const KEY = (i, j, k) => ((i + 1024) * 2048 + (j + 1024)) * 2048 + (k + 1024);
  const owner = new Map();
  parts.forEach((p, pi) => {
    const g = grids[pi];
    for (let i = 0; i < g.nx; i++) for (let j = 0; j < g.ny; j++) for (let k = 0; k < g.nz; k++) {
      const id = g.idx(i, j, k);
      if (!g.data[id]) continue;
      const key = KEY(i + g.ox, j + g.oy, k + g.oz);
      const prev = owner.get(key);
      if (prev === undefined || p.over) {
        if (prev !== undefined && p.over) { const pg = grids[prev.pi]; pg.data[prev.id] = 0; }
        owner.set(key, { pi, id });
      } else if (!p.keep) g.data[id] = 0;
    }
  });
  const occ = (i, j, k) => owner.has(KEY(i, j, k));
  for (let pi = 0; pi < parts.length; pi++) {
    const p = parts[pi], grid = grids[pi];
    const m = meshGrid(grid, { offset: p.p, occ: p.solo ? null : occ });
    out.faces += m.faces;
    const rec = { name: p.n, parent: p.parent || null, pivot: p.p, grid, lit: m.lit, glow: m.glow, sway: p.sway || null, spin: p.spin || null, hide: !!p.hide };
    out.parts.push(rec); byName.set(p.n, rec);
    if (grid.count()) {
      const vs = grid.vs;
      out.bounds.expandByPoint(new THREE.Vector3((grid.ox - 0.5) * vs, (grid.oy - 0.5) * vs, (grid.oz - 0.5) * vs));
      out.bounds.expandByPoint(new THREE.Vector3((grid.ox + grid.nx - 0.5) * vs, (grid.oy + grid.ny - 0.5) * vs, (grid.oz + grid.nz - 0.5) * vs));
    }
  }
  // tighten bounds to filled voxels (grid includes padding)
  const tb = new THREE.Box3();
  for (const r of out.parts) {
    const g = r.grid;
    for (let i = 0; i < g.nx; i++) for (let j = 0; j < g.ny; j++) for (let k2 = 0; k2 < g.nz; k2++) {
      if (!g.data[g.idx(i, j, k2)]) continue;
      tb.expandByPoint(new THREE.Vector3(g.cx(i), g.cy(j), g.cz(k2)));
    }
  }
  if (!tb.isEmpty()) out.bounds = tb.expandByScalar(design.vs * 0.5);

  const pal = design.pal;
  const vs = design.vs;
  // eyes
  if (design.eyes) {
    const e = design.eyes;
    const part = byName.get(e.part || 'head');
    const variants = eyeVariants(e.style || 'anime');
    const px = vs * (e.px || 1);
    const cmap = DECAL_CMAP(e.iris, e.cmap);
    const sides = e.mirror === false ? [false] : [false, true];
    for (const mir of sides) {
      const set = {};
      for (const [name, rows] of Object.entries(variants)) {
        const d = placeDecal(e, part && part.grid, part ? part.pivot : [0, 0, 0], rows, cmap, px, pal, mir, e.depth || 2);
        set[name] = d;
      }
      out.decals.push({ kind: 'eye', side: mir ? 'R' : 'L', part: e.part || 'head', set });
    }
  }
  if (design.mouth && design.mouth.style !== 'none') {
    const mo = design.mouth;
    const part = byName.get(mo.part || 'head');
    const pats = MOUTHS[mo.style || 'cat'] || MOUTHS.cat;
    const px = vs * (mo.px || 0.8);
    const cmap = DECAL_CMAP('#000', mo.cmap);
    const set = {};
    for (const [name, rows] of Object.entries(pats)) {
      if (!rows.length) continue;
      set[name] = placeDecal(mo, part && part.grid, part ? part.pivot : [0, 0, 0], rows, cmap, px, pal, false, 2);
    }
    out.decals.push({ kind: 'mouth', part: mo.part || 'head', set });
  }
  for (const dc of design.decals || []) {
    const part = byName.get(dc.part || 'head');
    const px = vs * (dc.px || 1);
    const cmap = DECAL_CMAP(dc.iris, dc.cmap);
    const sides = dc.mirror ? [false, true] : [false];
    for (const mir of sides) out.decals.push({ kind: 'static', part: dc.part || 'head', set: { normal: placeDecal(dc, part && part.grid, part ? part.pivot : [0, 0, 0], dc.rows, cmap, px, pal, mir, dc.depth || 1) } });
  }
  for (const f of design.fx || []) {
    const emit = (partName, at) => {
      const part = byName.get(partName);
      const piv = part ? part.pivot : [0, 0, 0];
      out.fx.push(Object.assign({}, f, { part: part ? partName : null, local: [at[0] - piv[0], at[1] - piv[1], at[2] - piv[2]] }));
    };
    const pn = f.part || 'body';
    emit(pn, f.at);
    if (f.mirror) emit(pn.replace(/L$/, 'R'), [-f.at[0], f.at[1], f.at[2]]);
  }
  // free voxel grids we no longer need except head (portrait framing) — keep all, they are small
  return out;
}

// ----------------------------------------------------------- instances
export function instantiate(tpl, opts = {}) {
  const root = new THREE.Group();
  root.name = 'model';
  const pose = new THREE.Group(); // animator-owned offsets (bob, lunge, squash)
  pose.name = 'pose';
  root.add(pose);
  const lit = toonMaterial({ rim: opts.rim ?? 0.12 });
  const glow = glowMaterial();
  const flat = glowMaterial(); flat.toneMapped = true;
  const bones = {};
  const rest = {};
  const meshes = [];
  for (const p of tpl.parts) {
    const b = new THREE.Object3D();
    b.name = p.name;
    bones[p.name] = b;
  }
  for (const p of tpl.parts) {
    const b = bones[p.name];
    const parent = p.parent && bones[p.parent] ? bones[p.parent] : pose;
    const pp = p.parent && bones[p.parent] ? tpl.parts.find((q) => q.name === p.parent).pivot : [0, 0, 0];
    b.position.set(p.pivot[0] - pp[0], p.pivot[1] - pp[1], p.pivot[2] - pp[2]);
    parent.add(b);
    rest[p.name] = { pos: b.position.clone(), rot: new THREE.Euler(0, 0, 0) };
    if (p.lit) { const m = new THREE.Mesh(p.lit, lit); m.castShadow = opts.shadow !== false; m.receiveShadow = !!opts.receiveShadow; b.add(m); meshes.push(m); }
    if (p.glow) { const m = new THREE.Mesh(p.glow, glow); b.add(m); meshes.push(m); }
    if (p.hide) b.visible = false;
  }
  const face = { eyes: [], mouth: null };
  for (const d of tpl.decals) {
    const bone = bones[d.part] || pose;
    const group = {};
    for (const [name, dd] of Object.entries(d.set)) {
      const g = new THREE.Group();
      g.position.set(dd.pos[0], dd.pos[1], dd.pos[2]);
      g.rotation.set(dd.rot[0], dd.rot[1], dd.rot[2], 'YXZ');
      if (dd.geo.lit) g.add(new THREE.Mesh(dd.geo.lit, flat));
      if (dd.geo.glow) g.add(new THREE.Mesh(dd.geo.glow, glow));
      g.visible = name === 'normal' || (d.kind === 'mouth' && name === 'closed');
      bone.add(g);
      group[name] = g;
    }
    if (d.kind === 'eye') face.eyes.push(group);
    else if (d.kind === 'mouth') face.mouth = group;
  }
  const emitters = tpl.fx.map((f) => {
    const a = new THREE.Object3D();
    a.position.set(f.local[0], f.local[1], f.local[2]);
    (bones[f.part] || pose).add(a);
    return { anchor: a, type: f.type, rate: f.rate ?? 1, scale: f.scale ?? 1, acc: 0, color: f.color };
  });
  const b = tpl.bounds;
  root.userData.rig = {
    tpl, design: tpl.design, arch: tpl.design.arch || 'quad', pose, bones, rest, face, emitters, meshes,
    materials: [lit, glow, flat],
    height: b.isEmpty() ? 1 : b.max.y, radius: b.isEmpty() ? 0.5 : Math.max(b.max.x, -b.min.x, b.max.z, -b.min.z),
    bounds: b.clone(),
    sway: tpl.parts.filter((p) => p.sway || p.spin).map((p) => ({ name: p.name, sway: p.sway, spin: p.spin })),
  };
  return root;
}

export function buildModel(design, key, opts) { return instantiate(getTemplate(design, key), opts); }

export function disposeModel(root) {
  const rig = root.userData.rig;
  if (rig) for (const m of rig.materials) m.dispose();
}
