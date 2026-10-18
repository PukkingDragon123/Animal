// 3D → pixel-art creature renderer.
//
// A creature is a smooth 3D model built from signed-distance shapes (ellipsoids,
// round cones, tori, rounded boxes) hung on bones. Each design compiles to its own
// GLSL raymarcher; every frame the bones are posed in JS and the model is
// raymarched on the GPU at 3×3 supersampling. The G-buffer (material, light,
// facing, depth) is then turned into a pixel sprite the way a pixel artist shades:
//   · 5 hue-shifted tones per material, light from the top-left, clean clusters,
//     dithering only along band edges,
//   · real self-shadowing (head onto body, wing onto flank) and ambient occlusion,
//   · warm bounce light underneath, a crisp rim light along the far silhouette,
//   · gloss highlights, emissive materials (fire) shaded hot-core → dark edge,
//   · painted markings (eyes, cheeks, belly) that wrap the 3D surface,
//   · selective outline: warm dark ink, softer on the lit side, plus inner
//     contours wherever a nearer part overlaps a farther one.
// Because the model is 3D, every facing direction and every pose is free, and the
// animation clips are smooth eased 3D motion with squash & stretch.
//
// design = {
//   id, size: [w, h] sprite pixels, anchor: [x, y] (ground point), unit: world units per pixel,
//   pitch: camera tilt (deg), yaw: default facing (deg; 0 = toward the viewer, − = toward screen-left),
//   pal: { key: '#hex' | { c: '#hex', gloss, emit } }, ink: '#hex',
//   parts: [{ n, parent, p: [x, y, z] pivot, s: [shapes], show, bond }],
//   anim: { bob, sway, flap, hop, lean, lag }, pad: { clip: [l, t, r, b] }, bond: { grow: { part: k } }
// }
// shapes (part-local coordinates, y up, the creature faces +z):
//   ['ell', [x, y, z], [rx, ry, rz], mat, o]      ['sph', [x, y, z], r, mat, o]
//   ['cone', [x, y, z], [x, y, z], r1, r2, mat, o] (round cone / capsule)
//   ['chain', [[x, y, z, r], ...], mat, o]          (round cones through points)
//   ['tor', [x, y, z], R, r, mat, o]                 ['box', [x, y, z], [hx, hy, hz], round, mat, o]
// options: k (smooth-union radius), rot: [rx, ry, rz] (deg), paint (recolour only), on: ['part', …] (paint target),
//          grad: { a: [x,y,z], b: [x,y,z], stops: [[t, mat], ...] }, minus: shape (carved out of this shape only),
//          sub (carve from everything before it)
import { ramp, bayer, mix } from './color.js';
import { Surf, P } from './surface.js';

export const FPS = 24;
const TAU = Math.PI * 2, D2R = Math.PI / 180;
let SS = 3;
// supersampling per pixel side (3 = 9 rays/pixel; 2 is plenty on slow GPUs)
export function setSupersample(n) { SS = Math.max(1, Math.min(4, n | 0)); for (const k of cache.keys()) cache.delete(k); }

// ------------------------------------------------------------------ small math
const v3 = (x = 0, y = 0, z = 0) => [x, y, z];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const nrm = (a) => scl(a, 1 / (Math.hypot(...a) || 1));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// 4×4 column-major
const I4 = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function m4mul(a, b) { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; }
const T4 = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
const S4 = (x, y, z) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
function R4(rx, ry, rz) {   // R = Ry · Rx · Rz (yaw, then pitch, then roll in the bone's frame)
  const a = rx * D2R, b = ry * D2R, c = rz * D2R;
  const X = [1, 0, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1];
  const Y = [Math.cos(b), 0, -Math.sin(b), 0, 0, 1, 0, 0, Math.sin(b), 0, Math.cos(b), 0, 0, 0, 0, 1];
  const Z = [Math.cos(c), Math.sin(c), 0, 0, -Math.sin(c), Math.cos(c), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  return m4mul(Y, m4mul(X, Z));
}
function m4inv(m) {
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  const det = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06 || 1e-9);
  return [(a11 * b11 - a12 * b10 + a13 * b09) * det, (a02 * b10 - a01 * b11 - a03 * b09) * det, (a31 * b05 - a32 * b04 + a33 * b03) * det, (a22 * b04 - a21 * b05 - a23 * b03) * det,
    (a12 * b08 - a10 * b11 - a13 * b07) * det, (a00 * b11 - a02 * b08 + a03 * b07) * det, (a32 * b02 - a30 * b05 - a33 * b01) * det, (a20 * b05 - a22 * b02 + a23 * b01) * det,
    (a10 * b10 - a11 * b08 + a13 * b06) * det, (a01 * b08 - a00 * b10 - a03 * b06) * det, (a30 * b04 - a31 * b02 + a33 * b00) * det, (a21 * b02 - a20 * b04 - a23 * b00) * det,
    (a11 * b07 - a10 * b09 - a12 * b06) * det, (a00 * b09 - a01 * b07 + a02 * b06) * det, (a31 * b01 - a30 * b03 - a32 * b00) * det, (a20 * b03 - a21 * b01 + a22 * b00) * det];
}
function m3rot(r) { const m = R4(r[0] || 0, r[1] || 0, r[2] || 0); return [m[0], m[4], m[8], m[1], m[5], m[9], m[2], m[6], m[10]]; } // transpose = inverse rotation, column-major mat3

// ------------------------------------------------------------------ GLSL generation
const f = (x) => { const s = (+x).toFixed(4); return s.includes('.') ? s : s + '.0'; };
const vec = (a) => `vec3(${f(a[0])},${f(a[1])},${f(a[2])})`;

function optsOf(s) { const o = s[s.length - 1]; return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; }
function matKeyOf(s) {
  switch (s[0]) { case 'ell': case 'sph': return s[3]; case 'cone': return s[5]; case 'chain': return s[2]; case 'tor': return s[4]; case 'box': return s[4]; default: return null; }
}
// signed distance expression for a shape in local coords `q`
function sdExpr(s, q) {
  const o = optsOf(s);
  let c = s[0] === 'chain' || s[0] === 'cone' ? null : s[1];
  let qq = q;
  if (c) qq = `(${q}-${vec(c)})`;
  if (o.rot) { const m = m3rot(o.rot); qq = `(mat3(${m.map(f).join(',')})*${qq})`; }
  let e;
  switch (s[0]) {
    case 'ell': e = `sdEll(${qq},${vec(s[2])})`; break;
    case 'sph': e = `(length(${qq})-${f(s[2])})`; break;
    case 'cone': e = o.rot ? `sdRC(${qq},${vec(s[1])},${vec(s[2])},${f(s[3])},${f(s[4])})` : `sdRC(${q},${vec(s[1])},${vec(s[2])},${f(s[3])},${f(s[4])})`; break;
    case 'chain': {
      const pts = s[1], parts = [];
      for (let i = 0; i + 1 < pts.length; i++) parts.push(`sdRC(${q},${vec(pts[i])},${vec(pts[i + 1])},${f(pts[i][3])},${f(pts[i + 1][3])})`);
      e = parts.reduce((a, b) => `min(${a},${b})`);
      break;
    }
    case 'tor': e = `sdTor(${qq},vec2(${f(s[2])},${f(s[3])}))`; break;
    case 'box': e = `sdBox(${qq},${vec(s[2])},${f(s[3])})`; break;
    default: e = '1e5';
  }
  if (o.minus) e = `smax(${e},-${sdExpr(o.minus, q)},${f(o.minus[o.minus.length - 1]?.k ?? 0.6)})`;
  // licking-flame wobble (animated by uPh)
  if (o.wob) e = `(${e} + ${f(o.wob)} * sin(${q}.x * 0.32 + ${q}.y * 0.45 + uPh * 6.2832) * sin(${q}.z * 0.28 - ${q}.y * 0.35 + uPh * 12.566))`;
  return e;
}
// rough local bounding sphere of a shape (for culling)
function boundOf(s) {
  const o = optsOf(s), k = (o.k || 0) + 1;
  switch (s[0]) {
    case 'ell': return [s[1], Math.max(...s[2]) + k];
    case 'sph': return [s[1], s[2] + k];
    case 'cone': { const c = scl(add(s[1], s[2]), 0.5); return [c, Math.hypot(...sub(s[2], s[1])) / 2 + Math.max(s[3], s[4]) + k]; }
    case 'chain': { const pts = s[1]; let c = [0, 0, 0]; for (const p of pts) c = add(c, p.slice(0, 3)); c = scl(c, 1 / pts.length); let r = 0; for (const p of pts) r = Math.max(r, Math.hypot(...sub(p.slice(0, 3), c)) + p[3]); return [c, r + k]; }
    case 'tor': return [s[1], s[2] + s[3] + k];
    case 'box': return [s[1], Math.hypot(...s[2]) + s[3] + k];
    default: return [[0, 0, 0], 1];
  }
}
function mergeBounds(bs) {
  if (!bs.length) return [[0, 0, 0], 0];
  let c = [0, 0, 0]; for (const [p] of bs) c = add(c, p); c = scl(c, 1 / bs.length);
  let r = 0; for (const [p, rr] of bs) r = Math.max(r, Math.hypot(...sub(p, c)) + rr);
  return [c, r];
}

const LIB = /* glsl */`
float sdEll(vec3 p, vec3 r){ float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / max(k1, 1e-5); }
float sdRC(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba = b - a; float l2 = dot(ba, ba); float rr = r1 - r2; float a2 = l2 - rr * rr; float il2 = 1.0 / l2;
  vec3 pa = p - a; float y = dot(pa, ba); float z = y - l2; vec3 xv = pa * l2 - ba * y; float x2 = dot(xv, xv);
  float y2 = y * y * l2; float z2 = z * z * l2; float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}
float sdTor(vec3 p, vec2 t){ vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
float sdBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float smin(float a, float b, float k){ if (k <= 0.0) return min(a, b); float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
float smax(float a, float b, float k){ return -smin(-a, -b, k); }
`;

function compile(d) {
  const parts = d.parts.map((p, i) => Object.assign({ idx: i + 1 }, p));
  const pal = d.pal || {};
  const matKeys = []; const matIdx = new Map();
  const mid = (k) => { if (!matIdx.has(k)) { matIdx.set(k, matKeys.length + 1); matKeys.push(k); } return matIdx.get(k); };
  const geo = [], paints = [], matCases = [];
  let sid = 0;
  for (const p of parts) {
    const b = p.idx, q = `q${b}`;
    const gs = [], ps = [];
    for (const s of p.s || []) {
      const o = optsOf(s);
      if (o.grad) for (const [, k] of o.grad.stops) mid(k); else mid(matKeyOf(s));
      if (o.paint) ps.push(s); else gs.push(s);
    }
    if (gs.length) {
      const [bc, br] = mergeBounds(gs.map(boundOf));
      let code = `  if (uB[${b}][1][3] > 0.5) { vec3 ${q} = (uB[${b}] * vec4(p, 1.0)).xyz; float sc = uB[${b}][0][3];\n`;
      code += `   if ((length(${q} - ${vec(bc)}) - ${f(br)}) * sc < d + 2.0) {\n`;
      for (const s of gs) {
        sid++;
        const o = optsOf(s);
        const e = `(${sdExpr(s, q)}) * sc`;
        if (o.sub) code += `    { float e = ${e}; float nd = smax(d, -e, ${f(o.k || 0)}); if (-e > d) { gs = ${sid}; gp = ${b}; gq = ${q}; } d = nd; }\n`;
        else code += `    { float e = ${e}; if (e < d) { gs = ${sid}; gp = ${b}; gq = ${q}; } d = smin(d, e, ${f(o.k || 0)}); }\n`;
        matCases.push([sid, s]);
      }
      code += '   }\n  }\n';
      geo.push(code);
    }
    for (const s of ps) {
      const o = optsOf(s);
      const on = o.on ? o.on.map((n) => parts.find((x) => x.n === n)?.idx).filter(Boolean) : null;
      const cond = on ? `(${on.map((i) => `gp == ${i}`).join(' || ')})` : 'true';
      const [bc, br] = boundOf(s);
      paints.push(`  if (uB[${b}][1][3] > 0.5 && ${cond}) { vec3 ${q} = (uB[${b}] * vec4(p, 1.0)).xyz; if (length(${q} - ${vec(bc)}) < ${f(br + 1)} && (${sdExpr(s, q)}) < 0.0) m = ${matExpr(s, q)}; }\n`);
    }
  }
  function matExpr(s, q) {
    const o = optsOf(s);
    if (!o.grad) return f(mid(matKeyOf(s)));
    const { a, b, stops } = o.grad, ab = sub(b, a), l2 = dot(ab, ab) || 1;
    const t = `(dot(${q} - ${vec(a)}, ${vec(ab)}) / ${f(l2)})`;
    let ex = f(mid(stops[0][1]));                       // later stops wrap earlier ones
    for (let i = 1; i < stops.length; i++) ex = `(${t} >= ${f(stops[i][0])} ? ${f(mid(stops[i][1]))} : ${ex})`;
    return ex;
  }
  const matFn = matCases.map(([i, s]) => `  if (gs == ${i}) return ${matExpr(s, 'gq')};`).join('\n');
  const glossy = [], emit = [];
  for (const k of matKeys) { const v = pal[k]; if (v && typeof v === 'object') { if (v.gloss) glossy.push(matIdx.get(k)); if (v.emit) emit.push(matIdx.get(k)); } }
  const NB = parts.length + 1;
  const src = `#version 300 es
precision highp float;
uniform mat4 uB[${NB}];          // world → bone (rest) space; row 3 carries [scale, visible, -, -]
uniform vec2 uRes; uniform vec2 uAnchor; uniform float uUnit; uniform float uSS;
uniform vec3 uCR; uniform vec3 uCU; uniform vec3 uCF; uniform vec3 uL; uniform vec4 uBound; uniform float uPh;
out vec4 o;
int gs; int gp; vec3 gq;
${LIB}
float map(vec3 p){
  float d = 1e5; gs = 0; gp = 0;
${geo.join('')}  return d;
}
float matOf(){
${matFn}
  return 0.0;
}
float paint(vec3 p, float m){
${paints.join('')}  return m;
}
bool lit(int g){ ${parts.filter((p) => p.noShadow).map((p) => `if (g == ${p.idx}) return true;`).join(' ')} return false; }
bool glossy(float m){ ${glossy.length ? glossy.map((i) => `if (abs(m - ${f(i)}) < 0.5) return true;`).join(' ') : ''} return false; }
bool emits(float m){ ${emit.length ? emit.map((i) => `if (abs(m - ${f(i)}) < 0.5) return true;`).join(' ') : ''} return false; }
vec3 normalAt(vec3 p){
  const vec2 k = vec2(1.0, -1.0); const float h = 0.08;
  return normalize(k.xyy * map(p + k.xyy * h) + k.yyx * map(p + k.yyx * h) + k.yxy * map(p + k.yxy * h) + k.xxx * map(p + k.xxx * h));
}
float shadow(vec3 ro, vec3 rd){
  float r = 1.0; float t = 0.6;
  for (int i = 0; i < 48; i++) { float h = map(ro + rd * t); r = min(r, 9.0 * h / t); t += clamp(h, 0.3, 4.0); if (r < 0.02 || t > 70.0) break; }
  return clamp(r, 0.0, 1.0);
}
float occl(vec3 p, vec3 n){
  float occ = 0.0; float w = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.9 * float(i); occ += (h - map(p + n * h)) * w; w *= 0.7; }
  return clamp(1.0 - occ * 0.09, 0.0, 1.0);
}
void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 sp = vec2(fc.x / uSS, uRes.y - fc.y / uSS);
  vec2 w2 = vec2(sp.x - uAnchor.x, uAnchor.y - sp.y) * uUnit;
  vec3 ro = uCR * w2.x + uCU * w2.y - uCF * 400.0;
  vec3 rd = uCF;
  // bounding sphere
  vec3 oc = ro - uBound.xyz; float b = dot(oc, rd); float c = dot(oc, oc) - uBound.w * uBound.w; float hh = b * b - c;
  if (hh < 0.0) { o = vec4(0.0); return; }
  float t = max(0.0, -b - sqrt(hh)); float t1 = -b + sqrt(hh);
  bool hit = false;
  for (int i = 0; i < 200; i++) { float dd = map(ro + rd * t); if (dd < 0.012) { hit = true; break; } t += dd * 0.9; if (t > t1) break; }
  if (!hit) { o = vec4(0.0); return; }
  vec3 p = ro + rd * t;
  map(p);
  float m = matOf();
  int sp0 = gp;
  m = paint(p, m);
  vec3 n = normalAt(p);
  float l;
  float face = clamp(dot(n, -rd), 0.0, 1.0);
  if (emits(m)) { l = face; }
  else {
    float dif = dot(n, uL);
    float sh = dif > 0.0 && !lit(sp0) ? shadow(p + n * 0.25, uL) : 1.0;
    float ao = occl(p, n);
    l = dif * mix(0.4, 1.0, sh) - (1.0 - sh) * 0.25 * step(0.0, dif);
    l -= (1.0 - ao) * 0.6;
    l += 0.14 * max(0.0, -n.y) * ao;                                  // warm bounce from the ground
    if (glossy(m)) { float sp = pow(max(0.0, dot(reflect(-uL, n), -rd)), 22.0) * sh; if (sp > 0.55) l = 9.0; }
  }
  float enc = l > 8.0 ? 1.0 : clamp((l + 1.0) * 0.5, 0.0, 0.992);
  o = vec4(m / 255.0, enc, face, clamp((t - 300.0) / 200.0, 0.004, 1.0));
}`;
  return { src, parts, matKeys, matIdx, NB };
}

// ------------------------------------------------------------------ WebGL plumbing
let GL = null;
function gl() {
  if (GL) return GL;
  const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas');
  const g = cv.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
  if (!g) throw new Error('WebGL2 unavailable');
  const vs = g.createShader(g.VERTEX_SHADER);
  g.shaderSource(vs, '#version 300 es\nin vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }');
  g.compileShader(vs);
  const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
  GL = { cv, g, vs, buf };
  return GL;
}
function program(d) {
  if (d._prog) return d._prog;
  const { g, vs } = gl();
  const c = compile(d);
  const fs = g.createShader(g.FRAGMENT_SHADER);
  g.shaderSource(fs, c.src); g.compileShader(fs);
  if (!g.getShaderParameter(fs, g.COMPILE_STATUS)) { const log = g.getShaderInfoLog(fs); console.error(log, c.src.split('\n').map((l, i) => i + 1 + ': ' + l).join('\n')); throw new Error('sdf shader: ' + log); }
  const pr = g.createProgram(); g.attachShader(pr, vs); g.attachShader(pr, fs); g.bindAttribLocation(pr, 0, 'a'); g.linkProgram(pr);
  if (!g.getProgramParameter(pr, g.LINK_STATUS)) throw new Error('sdf link: ' + g.getProgramInfoLog(pr));
  const U = {}; for (const n of ['uB', 'uPh', 'uRes', 'uAnchor', 'uUnit', 'uSS', 'uCR', 'uCU', 'uCF', 'uL', 'uBound']) U[n] = g.getUniformLocation(pr, n);
  // whole-model bound in rest pose (generous: animation moves parts around)
  const bs = []; for (const p of d.parts) for (const s of p.s || []) if (!optsOf(s).paint) bs.push(boundOf(s));
  const [bc, br] = mergeBounds(bs);
  d._prog = Object.assign(c, { pr, U, bound: [bc, br * 1.35 + 6] });
  return d._prog;
}

// ------------------------------------------------------------------ animation (3D poses)
const ease = (t) => t * t * (3 - 2 * t);
const W = (t) => Math.sin(t * TAU);
function kf(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [ta, va] = keys[i - 1], [tb, vb] = keys[i]; return va + (vb - va) * ease((t - ta) / (tb - ta || 1)); }
  return keys[keys.length - 1][1];
}
export const CLIPS = { idle: 48, walk: 16, run: 12, attack: 14, breath: 24, dash: 16, throw: 18, cast: 16, hurt: 10, faint: 24, buff: 24, happy: 20, sleep: 48, eat: 40 };
const LOOP = { idle: true, walk: true, run: true, happy: true, sleep: true, buff: true };
export const isLoop = (c) => !!LOOP[c];

// pose(design, clip, t) → { bone: { rx, ry, rz, dx, dy, dz, sx, sy, sz } , __expr, __mouth, __show }
// conventions: rx > 0 tips forward (nod / lean), rz rolls (wings: + raises the left wing), ry turns.
function pose(d, clip, t) {
  const A = Object.assign({ bob: 1, sway: 1, flap: 1, hop: 1, lean: 1, lag: 1 }, d.anim || {});
  const o = {}, names = d._names;
  const B = (n, q) => { if (!names.has(n) && n !== 'root') return; const c = o[n] || (o[n] = {}); for (const k in q) c[k] = k[0] === 's' ? (c[k] ?? 1) * q[k] : (c[k] || 0) + q[k]; };
  const each = (re, fn) => { let i = 0; for (const n of names) if (re.test(n)) fn(n, i++); };
  const side = (n) => (/L$/.test(n) ? 1 : -1);
  o.__show = new Set();
  const flick = (re, g, tt) => each(re, (n, k) => B(n, { sx: Math.max(0.04, g) * (1 + 0.08 * W(tt * 9 + k * 0.37)), sy: Math.max(0.04, g) * (1 + 0.1 * W(tt * 7 + k * 0.5)), sz: Math.max(0.04, g) * (1 + 0.14 * W(tt * 13 + k * 0.61)) }));
  const rise = (re, tt, dy, dx = 0, s0 = 0.5, s1 = 1.1) => { let cnt = 0; each(re, () => cnt++); each(re, (n, k) => { const ph = (tt + k / cnt) % 1, s = s0 + (s1 - s0) * ph; B(n, { dy: dy * ph, dx: dx * ph, sx: s, sy: s, sz: s }); }); };
  const breathe = (tt, k = 1) => {
    const b = W(tt);
    B('body', { dy: 0.5 * b * A.bob * k, sy: 1 + 0.02 * b * k, sx: 1 - 0.012 * b * k, sz: 1 - 0.012 * b * k });
    B('head', { dy: 0.35 * W(tt - 0.08) * A.bob * k, rz: 1.5 * W(tt * 0.5) * A.sway, rx: 1.2 * W(tt - 0.1) });
    each(/^(crest|hood|tuft|hair|flame)/, (n, i) => B(n, { rx: -2.5 * W(tt - 0.15 * A.lag - i * 0.05) * A.sway * k }));
    each(/^tail/, (n, i) => B(n, { ry: 5 * W(tt * 0.5 - 0.2 * A.lag - i * 0.06) * A.sway * k, rx: 2 * W(tt - 0.25) }));
    each(/^wing/, (n) => B(n, { rz: side(n) * 3 * W(tt - 0.1) * A.flap * k }));
    each(/^ear/, (n) => B(n, { rz: side(n) * 3 * W(tt - 0.18) }));
  };
  switch (clip) {
    case 'idle': {
      breathe(t * 2);
      if (Math.abs(t - 0.3) < 0.022 || Math.abs(t - 0.82) < 0.022) o.__expr = 'closed';
      B('head', { ry: kf([[0, 0], [0.45, 0], [0.52, 14], [0.66, 14], [0.74, -6], [0.84, -6], [0.9, 0], [1, 0]], t), rz: kf([[0, 0], [0.5, 0], [0.55, 4], [0.66, 4], [0.72, 0], [1, 0]], t) });
      break;
    }
    case 'walk': case 'run': {
      const run = clip === 'run', s = t * TAU;
      const hop = Math.abs(Math.sin(s)) * (run ? 3.4 : 1.5) * A.hop;
      B('body', { dy: hop, rx: (run ? 12 : 3) * A.lean, rz: (run ? 3 : 4) * Math.sin(s), sy: 1 + 0.05 * Math.cos(2 * s) * (run ? 1 : 0.5), sx: 1 - 0.03 * Math.cos(2 * s) });
      B('head', { rx: (run ? -6 : 0) + 3 * Math.sin(2 * s - 0.6), rz: -3 * Math.sin(s - 0.4) });
      each(/^leg/, (n) => { const ph = (/L$/.test(n) ? 0 : Math.PI) + (/B[LR]$/.test(n) ? Math.PI : 0); B(n, { rx: -(run ? 42 : 26) * Math.sin(s + ph), dy: Math.max(0, Math.sin(s + ph)) * (run ? 2.4 : 1.2) }); });   // quadrupeds trot in diagonal pairs
      each(/^wing/, (n) => B(n, { rz: side(n) * ((run ? 26 : 6) * Math.abs(Math.sin(2 * s)) + (run ? 18 : 0)) * A.flap }));
      each(/^(crest|hood|tuft|hair|flame)/, (n, i) => B(n, { rx: -(run ? 10 : 3) - 4 * Math.sin(2 * s - 1.2 * A.lag - i * 0.3) }));
      each(/^tail/, (n, i) => B(n, { ry: 8 * Math.sin(s - 1.2 * A.lag - i * 0.4), rx: -(run ? 10 : 2) }));
      break;
    }
    case 'attack': {      // peck: wind-up → snap forward → recover
      const lean = kf([[0, 0], [0.3, -12], [0.42, 34], [0.6, 30], [1, 0]], t), dz = kf([[0, 0], [0.3, -3], [0.42, 8], [0.6, 7], [1, 0]], t);
      B('body', { rx: lean * 0.6 * A.lean, dz, sy: kf([[0, 1], [0.3, 0.9], [0.42, 1.06], [0.7, 1], [1, 1]], t), sx: kf([[0, 1], [0.3, 1.06], [0.42, 0.96], [0.7, 1], [1, 1]], t) });
      B('head', { rx: lean * 0.6 });
      each(/^(crest|hood|tuft|hair|flame)/, (n, i) => B(n, { rx: kf([[0, 0], [0.32, 8], [0.5, -18], [0.75, 4], [1, 0]], t - i * 0.03) }));
      each(/^wing/, (n) => B(n, { rz: side(n) * kf([[0, 0], [0.3, 40], [0.45, -10], [1, 0]], t) }));
      each(/^tail/, (n) => B(n, { rx: kf([[0, 0], [0.42, -20], [1, 0]], t) }));
      if (t > 0.36 && t < 0.64) { o.__mouth = 'open'; o.__expr = 'fierce'; o.__show.add('slash'); }
      break;
    }
    case 'breath': {      // big inhale, then a long fire breath
      const inh = kf([[0, 0], [0.25, 1], [0.32, 0], [1, 0]], t), blow = t > 0.3 && t < 0.92;
      B('root', { ry: kf([[0, 0], [0.22, -36], [0.92, -36], [1, 0]], t) });        // turn side-on so the jet crosses the screen
      B('body', { sy: 1 + 0.08 * inh - (blow ? 0.03 : 0), sx: 1 - 0.03 * inh + (blow ? 0.03 : 0), sz: 1 + 0.06 * inh, rx: kf([[0, 0], [0.25, -12], [0.34, 10], [0.9, 8], [1, 0]], t) });
      B('head', { rx: kf([[0, 0], [0.25, -12], [0.34, 6], [0.9, 5], [1, 0]], t) + (blow ? 1.5 * W(t * 16) : 0), rz: blow ? 1.5 * W(t * 11) : 0 });
      each(/^(crest|hood|tuft|hair|flame)/, (n, i) => B(n, { rx: blow ? -10 - 4 * W(t * 10 - i * 0.2) : 6 * inh }));
      each(/^wing/, (n) => B(n, { rz: side(n) * (25 * inh + (blow ? 30 + 6 * W(t * 9) : 0)) }));
      o.__mouth = blow ? 'open' : null; o.__expr = blow ? 'teary' : inh > 0.3 ? 'closed' : null;
      if (blow) { o.__show.add('fire'); o.__show.add('tears'); }
      flick(/^fire/, kf([[0.3, 0.1], [0.42, 1], [0.84, 1], [0.92, 0.1]], t), t);
      break;
    }
    case 'dash': {
      const k = kf([[0, 0], [0.2, 1], [0.8, 1], [1, 0]], t);
      B('body', { rx: 24 * k * A.lean, sz: 1 + 0.12 * k, sy: 1 - 0.1 * k, dy: 1.5 * k * Math.abs(W(t * 3)), dz: 4 * k });
      B('head', { rx: -10 * k });
      each(/^(crest|hood|tuft|hair|flame|tail)/, (n) => B(n, { rx: -24 * k }));
      each(/^wing/, (n) => B(n, { rz: side(n) * -10 * k, rx: -40 * k }));
      each(/^leg/, (n) => B(n, { rx: (/L$/.test(n) ? 1 : -1) * 40 * W(t * 4) }));
      o.__expr = 'fierce';
      if (k > 0.5) o.__show.add('dashfire');
      flick(/^dashfire/, kf([[0.15, 0.2], [0.3, 1], [0.8, 1], [0.95, 0.3]], t), t * 2);
      break;
    }
    case 'throw': case 'cast': {
      const k = kf([[0, 0], [0.35, 1], [0.5, -0.6], [0.7, -0.5], [1, 0]], t);
      B('body', { rx: -10 * k, ry: 14 * k, dy: 2 * Math.max(0, -k), sy: 1 - 0.04 * k });
      each(/^wing/, (n) => B(n, { rz: side(n) * (/R$/.test(n) ? 80 : 20) * Math.max(0, k), rx: /R$/.test(n) ? -60 * k : 0 }));
      B('head', { rx: -6 * k });
      if (clip === 'throw' && t < 0.48) o.__show.add('chiliHand');
      if (clip === 'throw' && t >= 0.48) { const u = (t - 0.48) / 0.52; o.__show.add('chiliFly'); B('chiliFly', { dz: 70 * u, dy: 14 * Math.sin(u * Math.PI), rx: 600 * u }); }
      o.__mouth = k < 0 ? 'open' : null; if (k < 0) o.__expr = 'fierce';
      break;
    }
    case 'hurt': {
      const k = kf([[0, 1], [0.4, 0.7], [1, 0]], t);
      B('body', { dz: -4 * k, rx: -16 * k, rz: 6 * k * W(t * 3), sx: 1 - 0.08 * k, sy: 1 + 0.06 * k });
      B('head', { rx: -10 * k });
      each(/^(crest|hood|tuft|hair|flame|tail)/, (n) => B(n, { rx: 14 * k }));
      each(/^wing/, (n) => B(n, { rz: side(n) * 40 * k }));
      o.__expr = 'hurt'; o.__mouth = 'open'; o.__show.add('stars');
      break;
    }
    case 'faint': {
      const k = kf([[0, 0], [0.5, 1], [1, 1]], t), bounce = kf([[0, 0], [0.5, 0], [0.62, 2], [0.75, 0], [1, 0]], t);
      B('body', { rz: -80 * k, dy: -6 * k + bounce, dx: -10 * k, sy: 1 - 0.06 * k });
      B('head', { rz: -10 * k });
      each(/^(crest|hood|tuft|hair|flame)/, (n) => B(n, { rx: 10 * k }));
      each(/^leg/, (n) => B(n, { rx: -30 * k }));
      o.__expr = 'ko'; if (t > 0.55) o.__show.add('swirl');
      break;
    }
    case 'buff': {
      breathe(t * 4, 1.6);
      B('body', { dy: 1.2 * Math.abs(W(t * 2)), sy: 1.04 });
      each(/^(crest|hood|tuft|hair|flame)/, (n) => B(n, { sy: 1.1 + 0.05 * W(t * 4) }));
      each(/^wing/, (n) => B(n, { rz: side(n) * (30 + 10 * W(t * 4)) }));
      o.__expr = 'fierce'; o.__show.add('aura');
      flick(/^aura/, 0.85 + 0.15 * Math.abs(W(t * 2)), t * 2);
      break;
    }
    case 'happy': {
      const h = Math.abs(W(t));
      B('body', { dy: 6 * h, sy: 1 + 0.08 * (h < 0.2 ? 1 - h * 5 : 0) + 0.04 * h, sx: 1 - 0.03 * h });
      B('head', { rz: 5 * W(t), rx: -4 * h });
      each(/^wing/, (n) => B(n, { rz: side(n) * (14 + 34 * h) }));
      each(/^(crest|hood|tuft|hair|flame)/, (n) => B(n, { rx: 6 * W(t * 2 - 0.2) }));
      each(/^tail/, (n) => B(n, { ry: 18 * W(t * 2) }));
      o.__expr = 'happy'; o.__mouth = 'open'; o.__show.add('hearts');
      rise(/^heart/, t, 14, 0, 0.5, 1.1);
      break;
    }
    case 'sleep': {
      const b = W(t);
      B('body', { dy: -5 + 0.6 * b, sy: 0.86 + 0.02 * b, sx: 1.08 - 0.01 * b, sz: 1.04, rx: 6 });
      B('head', { dy: -2, rx: 16 + 2 * b, rz: 8 });
      each(/^(crest|hood|tuft|hair|flame)/, (n) => B(n, { rx: 6 }));
      each(/^leg/, (n) => B(n, { sy: 0.2, dy: 3 }));
      each(/^wing/, (n) => B(n, { rz: side(n) * -6 }));
      o.__expr = 'closed'; o.__show.add('zz');
      rise(/^zz/, t, 20, 6, 0.45, 1.15);
      break;
    }
    case 'eat': {         // lift a chili, chomp it down, the heat hits: tears, steam, a burst of fire
      const lift = kf([[0, 0], [0.14, 1], [0.2, 0], [1, 0]], t);
      const chew = t > 0.2 && t < 0.6 ? Math.abs(W(t * 7)) : 0;
      const gulp = kf([[0, 0], [0.6, 0], [0.64, 1], [0.7, 0], [1, 0]], t);
      const heat = kf([[0, 0], [0.66, 0], [0.74, 1], [1, 1]], t);
      if (t < 0.17) o.__show.add('chiliHand');
      else if (t < 0.6) { o.__show.add('chili'); const s = kf([[0.17, 1], [0.6, 0.15]], t); B('chili', { sz: s, rx: -6 * chew }); }
      B('body', { sy: 1 - 0.03 * chew - 0.06 * gulp + 0.04 * heat * Math.abs(W(t * 10)), sx: 1 + 0.04 * gulp, dy: 2.5 * heat * Math.abs(W(t * 6)) });
      B('head', { rx: -8 * lift + 6 * chew - 8 * gulp + heat * 3 * W(t * 12), rz: heat * 4 * W(t * 9), dy: -1.5 * gulp });
      each(/^wing/, (n) => B(n, { rz: side(n) * (heat > 0.3 ? 70 * Math.abs(W(t * 8)) : /R$/.test(n) ? 50 * lift : 0), rx: /R$/.test(n) ? -50 * lift : 0 }));
      each(/^(crest|hood|tuft|hair|flame)/, (n) => B(n, { sy: 1 + 0.15 * heat, rx: -6 * heat * W(t * 10) }));
      o.__mouth = chew > 0.5 || heat > 0.5 ? 'open' : null;
      o.__expr = heat > 0.4 ? 'teary' : chew || gulp > 0.3 ? 'closed' : null;
      if (heat > 0.4) { o.__show.add('tears'); o.__show.add('steam'); rise(/^steam/, t * 3, 9, 0, 0.5, 1.3); }
      if (t > 0.8 && t < 0.97) { o.__show.add('fire'); flick(/^fire/, kf([[0.8, 0.1], [0.85, 0.42], [0.92, 0.38], [0.97, 0.05]], t), t); }
      break;
    }
    default: breathe(t * 2);
  }
  // always-on secondary motion: fuse flames flicker, an open mouth drops the jaw
  each(/^flame/, (n, k) => B(n, { sx: 1 + 0.12 * W(t * 6 + k * 0.3), sy: 1 + 0.18 * W(t * 4 + k * 0.5 + 0.2), sz: 1 + 0.12 * W(t * 5 + k * 0.7) }));
  if (o.__mouth === 'open') B('jaw', { rx: 26 });
  return o;
}

function visible(p, expr, show, bonded) {
  if (p.hide || (p.bond && !bonded)) return false;
  if (p.show == null) return true;
  const list = Array.isArray(p.show) ? p.show : [p.show];
  return list.some((s) => (s[0] === '!' ? !(s.slice(1) === expr || show.has(s.slice(1))) : s === expr || show.has(s) || (s === 'open' && !expr)));
}

// ------------------------------------------------------------------ render one frame
// opts: { clip, frame, scale, yaw (deg, overrides design.yaw), pitch, expr, bonded, show: [] , light: [x,y,z] camera-space }
export function renderFrame(d, opts = {}) {
  const pr = program(d);
  const { g, cv } = gl();
  if (!d._names) d._names = new Set(d.parts.map((p) => p.n));
  const sc = opts.scale || 1, clip = opts.clip || 'idle', n = CLIPS[clip] || 24, fi = ((opts.frame || 0) % n + n) % n;
  const po = pose(d, clip, fi / n);
  const expr = opts.expr || po.__expr || null, mouth = po.__mouth || null;
  const show = new Set(po.__show); show.add(mouth ? 'mouth:' + mouth : 'mouth:closed');
  if (opts.show) for (const s of opts.show) show.add(s);
  const pad = (d.pad && d.pad[clip]) || [0, 0, 0, 0];
  const w = Math.round((d.size[0] + pad[0] + pad[2]) * sc), h = Math.round((d.size[1] + pad[1] + pad[3]) * sc);
  const W2 = w * SS, H2 = h * SS;
  if (cv.width !== W2 || cv.height !== H2) { cv.width = W2; cv.height = H2; }
  // bones
  const yaw = opts.yaw ?? d.yaw ?? -35, pitch = opts.pitch ?? d.pitch ?? 18;
  const grow = opts.bonded && d.bond && d.bond.grow;
  const M = new Map();
  const rootQ = po.root || {};
  const root = m4mul(R4(0, yaw + (rootQ.ry || 0), 0), T4(rootQ.dx || 0, rootQ.dy || 0, rootQ.dz || 0));
  const byName = new Map(pr.parts.map((p) => [p.n, p]));
  const worldOf = (p) => {
    if (M.has(p.n)) return M.get(p.n);
    const q = po[p.n] || {};
    let gx = 1; if (grow && grow[p.n]) gx = grow[p.n];
    const [px, py, pz] = p.p || [0, 0, 0];
    const local = m4mul(T4(px + (q.dx || 0), py + (q.dy || 0), pz + (q.dz || 0)), m4mul(R4(q.rx || 0, q.ry || 0, q.rz || 0), m4mul(S4((q.sx ?? 1) * gx, (q.sy ?? 1) * gx, (q.sz ?? 1) * gx), T4(-px, -py, -pz))));
    const par = p.parent && byName.get(p.parent);
    const m = m4mul(par ? worldOf(par) : p.bill ? T4(rootQ.dx || 0, rootQ.dy || 0, rootQ.dz || 0) : root, local);
    const s = Math.min(Math.hypot(m[0], m[1], m[2]), Math.hypot(m[4], m[5], m[6]), Math.hypot(m[8], m[9], m[10]));
    M.set(p.n, m); m.s = s;
    return m;
  };
  const NB = pr.NB, bonesArr = new Float32Array(NB * 16);
  bonesArr.set(I4(), 0);
  let anyGlass = false;
  for (const p of pr.parts) {
    const m = worldOf(p), o = p.idx * 16;
    bonesArr.set(m4inv(m), o);
    const vis = visible(p, expr, show, opts.bonded);
    if (p.glass && vis) anyGlass = true;
    bonesArr[o + 3] = m.s; bonesArr[o + 7] = vis && !p.glass ? 1 : 0; bonesArr[o + 11] = 0; bonesArr[o + 15] = 1;
  }
  // camera: orthographic, pitched down, looking toward −z
  const pc = pitch * D2R;
  const F = nrm([0, -Math.sin(pc), -Math.cos(pc)]), R = [1, 0, 0], U = cross(R, F);
  const Lc = nrm(opts.light || [-0.55, 0.72, 0.62]);            // camera space: x right, y up, z toward viewer
  const Lw = nrm(add(add(scl(R, Lc[0]), scl(U, Lc[1])), scl(F, -Lc[2])));
  const unit = (d.unit || 1) / sc;
  const [bc, br] = pr.bound;
  const bcw = root ? [root[0] * bc[0] + root[4] * bc[1] + root[8] * bc[2] + root[12], root[1] * bc[0] + root[5] * bc[1] + root[9] * bc[2] + root[13], root[2] * bc[0] + root[6] * bc[1] + root[10] * bc[2] + root[14]] : bc;
  g.viewport(0, 0, W2, H2);
  g.useProgram(pr.pr);
  const U_ = pr.U;
  g.uniformMatrix4fv(U_.uB, false, bonesArr); g.uniform1f(U_.uPh, fi / n);
  g.uniform2f(U_.uRes, w, h); g.uniform2f(U_.uAnchor, (d.anchor[0] + pad[0]) * sc, (d.anchor[1] + pad[1]) * sc); g.uniform1f(U_.uUnit, unit); g.uniform1f(U_.uSS, SS);
  g.uniform3fv(U_.uCR, R); g.uniform3fv(U_.uCU, U); g.uniform3fv(U_.uCF, F); g.uniform3fv(U_.uL, Lw);
  g.uniform4f(U_.uBound, bcw[0], bcw[1], bcw[2], br + 40);
  g.bindBuffer(g.ARRAY_BUFFER, gl().buf); g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
  g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT);
  g.drawArrays(g.TRIANGLES, 0, 3);
  const raw = new Uint8Array(W2 * H2 * 4);
  g.readPixels(0, 0, W2, H2, g.RGBA, g.UNSIGNED_BYTE, raw);
  const surf = shade(d, pr, raw, w, h, sc);
  // second pass: transparent parts (water balls, bubbles) drawn over the opaque sprite
  if (anyGlass) {
    for (const p of pr.parts) bonesArr[p.idx * 16 + 7] = p.glass && visible(p, expr, show, opts.bonded) ? 1 : 0;
    g.uniformMatrix4fv(U_.uB, false, bonesArr);
    g.clear(g.COLOR_BUFFER_BIT); g.drawArrays(g.TRIANGLES, 0, 3);
    const raw2 = new Uint8Array(W2 * H2 * 4);
    g.readPixels(0, 0, W2, H2, g.RGBA, g.UNSIGNED_BYTE, raw2);
    glassOver(d, pr, raw2, surf, w, h);
  }
  surf.ox = Math.round(pad[0] * sc); surf.oy = Math.round(pad[1] * sc);
  return surf;
}

// ------------------------------------------------------------------ G-buffer → pixel art
// default heat ramp for emissive materials: ember edge → white-hot core
const FIRE = ['#6e1022', '#b8221e', '#e84a1c', '#ff8c1a', '#ffd040', '#fff7cf'];
function shade(d, pr, raw, w, h, sc) {
  const N = w * h, W2 = w * SS, H2 = h * SS;
  const mat = new Uint8Array(N), lit = new Float32Array(N), face = new Float32Array(N), dep = new Float32Array(N), spec = new Uint8Array(N);
  const cnt = new Uint8Array(256);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let hits = 0; cnt.fill(0);
    for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) {
      const sy = H2 - 1 - (y * SS + j), k = (sy * W2 + x * SS + i) * 4;
      if (raw[k]) { hits++; cnt[raw[k]]++; }
    }
    if (hits * 2 < SS * SS) continue;
    let best = 0, bc = 0; for (let m = 1; m < 256; m++) if (cnt[m] > bc) { bc = cnt[m]; best = m; }
    let l = 0, fc = 0, dz = 1, sp = 0, c = 0;
    for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) {
      const sy = H2 - 1 - (y * SS + j), k = (sy * W2 + x * SS + i) * 4;
      if (raw[k] !== best) continue;
      c++; if (raw[k + 1] === 255) sp++; else l += raw[k + 1] / 255 * 2 - 1;
      fc += raw[k + 2] / 255; dz = Math.min(dz, raw[k + 3] / 255);
    }
    const i = y * w + x;
    mat[i] = best; lit[i] = c - sp > 0 ? l / (c - sp) : 1; face[i] = fc / c; dep[i] = dz * 200; spec[i] = sp * 2 >= c ? 1 : 0;
  }
  const pal = d.pal || {};
  const info = [null, ...pr.matKeys.map((k) => { const v = pal[k] ?? k; const hex = typeof v === 'object' ? v.c : v; return { hex, ramp: (typeof v === 'object' && v.ramp) || ramp(hex), gloss: !!(typeof v === 'object' && v.gloss), emit: !!(typeof v === 'object' && v.emit), heat: typeof v === 'object' && v.heat != null ? v.heat : 0.7, fire: (typeof v === 'object' && v.fire) || FIRE, flat: !!(typeof v === 'object' && v.flat) }; })];
  const band = new Int8Array(N);
  const empty = (x, y) => x < 0 || y < 0 || x >= w || y >= h || !mat[y * w + x];
  const th = [-0.32, 0.02, 0.36, 0.72];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, m = mat[i]; if (!m) continue;
    const I = info[m];
    if (I.emit) { const z = I.heat + (face[i] - 0.55) * 0.5 + (bayer(x, y) - 0.5) * 0.06; band[i] = Math.max(0, Math.min(5, Math.floor(z * 6))); continue; }
    if (I.flat) { band[i] = 3; continue; }
    if (spec[i] && I.gloss) { band[i] = 5; continue; }
    let l = lit[i];
    // rim light on the far (right / lower) silhouette edge
    if ((empty(x + 1, y) || empty(x + 1, y + 1)) && l > -0.6) l += 0.3;
    const dz = (bayer(x, y) - 0.5) * 0.07;
    let b = 1; for (const t of th) if (l + dz > t) b++;
    band[i] = Math.min(5, b);
  }
  // cleanup: a lone pixel takes its neighbours' band
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; if (!mat[i] || band[i] >= 5) continue;
    const nb = [i - 1, i + 1, i - w, i + w];
    if (nb.every((k) => mat[k] === mat[i] && band[k] !== band[i])) { const c2 = {}; for (const k of nb) c2[band[k]] = (c2[band[k]] || 0) + 1; band[i] = +Object.entries(c2).sort((a, b) => b[1] - a[1])[0][0]; }
  }
  const surf = new Surf(w, h), out = surf.data;
  const glow = [];
  for (let i = 0; i < N; i++) { const m = mat[i]; if (!m) continue; const I = info[m]; out[i] = P(I.emit ? I.fire[band[i]] : I.ramp[band[i]]); if (I.emit) glow.push(i); }
  // inner contours: front pixel next to a clearly farther surface
  const T = 2.6 / Math.max(0.5, (d.unit || 1) / sc) * 0.5 + 1.2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, m = mat[i]; if (!m || info[m].emit) continue;
    let e = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
      const j = Y * w + X; if (!mat[j] || info[mat[j]].emit) continue;
      if (dep[j] - dep[i] > T) { e = dx > 0 || dy > 0 ? 2 : 1; break; }
    }
    if (e) out[i] = P(e === 2 ? mix(info[m].ramp[1], info[m].ramp[0], 0.55) : info[m].ramp[1]);
  }
  // silhouette outline
  const ink = d.ink || '#2a1618';
  const dst = new Uint32Array(out);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (mat[i]) continue;
    let nb = 0, lt = false;
    const t = (X, Y, l) => { if (nb || X < 0 || Y < 0 || X >= w || Y >= h) return; const k = Y * w + X; if (mat[k]) { nb = mat[k]; lt = l; } };
    t(x, y + 1, true); t(x + 1, y, true); t(x - 1, y, false); t(x, y - 1, false);
    if (!nb) continue;
    const I = info[nb];
    dst[i] = P(I.emit ? I.fire[0] : mix(I.ramp[0], ink, lt ? 0.3 : 0.7));
  }
  surf.data = dst; surf.touch();
  surf.glow = glow;
  return surf;
}

// transparent material over the sprite: a bright rim where it turns away (fresnel),
// a crisp highlight, a faint tint inside (sparse dither over empty background)
function glassOver(d, pr, raw, surf, w, h) {
  const W2 = w * SS, H2 = h * SS, out = surf.data, pal = d.pal || {};
  const cov = new Uint8Array(w * h), face = new Float32Array(w * h), mat = new Uint8Array(w * h), spec = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let hits = 0, fc = 0, m = 0, sp = 0;
    for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) { const k = ((H2 - 1 - (y * SS + j)) * W2 + x * SS + i) * 4; if (raw[k]) { hits++; m = raw[k]; fc += raw[k + 2] / 255; if (raw[k + 1] === 255) sp++; } }
    if (hits * 2 < SS * SS) continue;
    const i = y * w + x; cov[i] = 1; face[i] = fc / hits; mat[i] = m; spec[i] = sp * 2 >= hits ? 1 : 0;
  }
  const info = (m) => { const k = pr.matKeys[m - 1], v = pal[k] ?? k, hex = typeof v === 'object' ? v.c : v; return (typeof v === 'object' && v.ramp) || ramp(hex); };
  // ball centre/radius from the covered pixels
  let x0 = w, x1 = -1, y0 = h, y1 = -1, mm = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (cov[y * w + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); mm = mat[y * w + x]; }
  if (x1 < 0) return;
  const cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2, r = Math.max(1, (x1 - x0 + 1 + y1 - y0 + 1) / 4), R = info(mm);
  const src = new Uint32Array(out);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!cov[i]) continue;
    const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1 || !cov[i - 1] || !cov[i + 1] || !cov[i - w] || !cov[i + w];
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, rr = Math.hypot(dx, dy) / r, a = Math.atan2(dy, dx);
    if (edge) { out[i] = P(R[1]); continue; }
    if (rr > 0.66 && rr < 0.8 && a > -2.75 && a < -1.75) { out[i] = P(R[5]); continue; }                       // highlight arc
    if (Math.hypot(dx + r * 0.42, dy + r * 0.5) < Math.max(1, r * 0.07)) { out[i] = P(R[5]); continue; }      // glint
    if (rr > 0.86 && a > 0.1 && a < 1.9) { out[i] = P(R[3]); continue; }                                     // lit lower-right rim
    if (rr > 0.9) { out[i] = P(R[2]); continue; }
    if (src[i] >>> 24) surf.blend(x, y, R[4], 0.12);
  }
  surf.touch();
}

// ------------------------------------------------------------------ cache + player
const cache = new Map();
let uid = 0;
export function frames(d, clip = 'idle', opts = {}) {
  if (!d._uid) d._uid = 's' + (++uid);
  const key = [d._uid, clip, opts.scale || 1, opts.yaw ?? '', opts.bonded ? 1 : 0, opts.expr || '', (opts.show || []).join(',')].join('|');
  let f = cache.get(key);
  if (!f) { f = []; for (let i = 0; i < (CLIPS[clip] || 24); i++) f.push(renderFrame(d, Object.assign({}, opts, { clip, frame: i }))); cache.set(key, f); }
  return f;
}
export class SdfPlayer {
  constructor(d, opts = {}) { this.d = d; this.opts = Object.assign({}, opts); this.clip = 'idle'; this.t = 0; this.frame = 0; this.base = 'idle'; this.queue = null; this.done = false; }
  play(clip, { then = null, restart = true } = {}) { if (!CLIPS[clip]) clip = 'idle'; if (this.clip === clip && !restart) return; this.clip = clip; this.t = 0; this.frame = 0; this.queue = then; this.done = false; }
  update(dt) {
    this.t += dt;
    const n = CLIPS[this.clip] || 24, step = 1 / FPS;
    while (this.t >= step) {
      this.t -= step;
      if (this.frame < n - 1) this.frame++;
      else if (isLoop(this.clip)) this.frame = 0;
      else if (this.clip === 'faint') this.done = true;
      else { this.done = true; this.clip = this.queue || this.base; this.queue = null; this.frame = 0; }
    }
  }
  current() { return frames(this.d, this.clip, this.opts)[this.frame]; }
}
