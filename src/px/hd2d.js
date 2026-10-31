// HD-2D presentation pass (WebGL2): takes the rendered frame and stages it like a diorama — crisp
// nearest-neighbour pixels in the focus band, tilt-shift depth of field toward the top and bottom of the
// screen, a two-level bloom (a tight glow and a wide soft halo around lamps, neon and lit windows), soft
// god-ray light shafts, and a filmic grade: split toning (cool shadows, warm highlights), saturation, an
// S-curve contrast that never clips, lifted blacks, vignette and a whisper of film grain.
// When the 3D stage runs its own depth of field (the close third-person camera; it sets frame.depthDof 0..1),
// the tilt-shift steps back by that much, so the two never stack.
const VS = `#version 300 es
in vec2 a; out vec2 v; void main(){ v = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;
const BRIGHT = `#version 300 es
precision highp float; uniform sampler2D t; uniform float th; in vec2 v; out vec4 o;
void main(){ vec3 c = texture(t, v).rgb; float l = max(c.r, max(c.g, c.b)); o = vec4(c * smoothstep(th, th + 0.2, l), 1.0); }`;
const BLUR = `#version 300 es
precision highp float; uniform sampler2D t; uniform vec2 d; in vec2 v; out vec4 o;
void main(){ vec3 c = texture(t, v).rgb * 0.227;
  c += (texture(t, v + d * 1.385).rgb + texture(t, v - d * 1.385).rgb) * 0.316;
  c += (texture(t, v + d * 3.231).rgb + texture(t, v - d * 3.231).rgb) * 0.070; o = vec4(c, 1.0); }`;
const FINAL = `#version 300 es
precision highp float;
uniform sampler2D tScene; uniform sampler2D tSoft; uniform sampler2D tBloom; uniform sampler2D tWide;
uniform vec2 uLow; uniform vec2 uOut; uniform float uTime;
uniform float uFocus; uniform float uBand; uniform float uDof; uniform float uBloom; uniform float uWide;
uniform float uRays; uniform vec2 uRayDir; uniform vec3 uRayCol; uniform float uVig; uniform float uWarm; uniform float uNight; uniform float uSat; uniform float uCon;
uniform vec3 uShadowTint; uniform vec3 uHighTint; uniform float uLift; uniform float uVibe;
in vec2 v; out vec4 o;
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
void main(){
  // crisp pixel lookup (the nearest texel of the frame)
  ivec2 ip = clamp(ivec2(floor(v * uLow)), ivec2(0), ivec2(uLow) - 1);
  vec3 sharp = texelFetch(tScene, ip, 0).rgb;
  vec3 soft = texture(tSoft, v).rgb;
  // tilt-shift: in focus inside the band around uFocus, blurring smoothly away from it
  float dy = abs(v.y - uFocus);
  float k = smoothstep(uBand, uBand + 0.32, dy) * uDof;
  vec3 c = mix(sharp, soft, k);
  // bloom: a tight glow plus a wide halo
  c += (texture(tBloom, v).rgb * (1.0 - 0.5 * uWide) + texture(tWide, v).rgb * uWide * 1.4) * uBloom;
  // god rays: soft diagonal shafts drifting slowly, stronger toward the top
  if (uRays > 0.0) {
    float s = dot(v * vec2(uOut.x / uOut.y, 1.0), normalize(uRayDir));
    float shafts = 0.55 * sin(s * 9.0 + uTime * 0.05) + 0.35 * sin(s * 23.0 - uTime * 0.08) + 0.25 * sin(s * 4.0 + 1.3);
    shafts = smoothstep(0.25, 1.1, shafts) * smoothstep(0.0, 0.9, v.y);
    c += uRayCol * shafts * uRays;
  }
  // grade: split toning (cool shadows, warm highlights), night shift, saturation, S-curve contrast, lifted blacks
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c *= mix(uShadowTint, vec3(1.0), smoothstep(0.0, 0.45, l));
  c = mix(c, c * uHighTint, smoothstep(0.4, 1.0, l) * (0.5 + uWarm));
  c = mix(c, c * vec3(0.72, 0.82, 1.06), uNight);
  c = max(mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, uSat), 0.0);
  // vibrance: lift the saturation of muted colours more than of already vivid ones (no neon over-saturation)
  if (uVibe != 0.0) { float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), sat = (mx - mn) / max(mx, 1e-4); float lv = dot(c, vec3(0.2126, 0.7152, 0.0722)); c = max(mix(vec3(lv), c, 1.0 + uVibe * (1.0 - sat) * (1.0 - sat)), 0.0); }
  vec3 cc = clamp(c, 0.0, 1.0);
  c = mix(c, cc * cc * (3.0 - 2.0 * cc) + (c - cc), (uCon - 1.0) * 2.0);
  c = c * (1.0 - uLift) + uLift;
  // vignette + grain
  vec2 q = v - 0.5; q.x *= uOut.x / uOut.y;
  c *= mix(1.0, smoothstep(1.05, 0.25, length(q)), uVig);
  c += (hash(v * uOut + fract(uTime)) - 0.5) * 0.016;
  o = vec4(c, 1.0);
}`;

export class HD2D {
  constructor(canvas) {
    this.cv = canvas;
    const g = this.g = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
    if (!g) throw new Error('WebGL2 unavailable');
    const vs = this.sh(g.VERTEX_SHADER, VS);
    this.pBright = this.prog(vs, BRIGHT); this.pBlur = this.prog(vs, BLUR); this.pFinal = this.prog(vs, FINAL);
    const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    this.tex = {}; this.fbo = {};
    this.opts = { focus: 0.52, band: 0.2, dof: 0.75, bloom: 0.5, threshold: 0.78, wide: 0, rays: 0.11, rayDir: [1, 0.62], rayCol: [1.0, 0.8, 0.52], vig: 0.62, warm: 0.65, night: 0, sat: 1.16, contrast: 1.14, shadowTint: [0.86, 0.82, 1.06], highTint: [1.08, 1.02, 0.9], lift: 0 };
  }
  sh(type, src) { const g = this.g, s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s); if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s)); return s; }
  prog(vs, fs) { const g = this.g, p = g.createProgram(); g.attachShader(p, vs); g.attachShader(p, this.sh(g.FRAGMENT_SHADER, fs)); g.bindAttribLocation(p, 0, 'a'); g.linkProgram(p); if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p)); return p; }
  target(name, w, h, linear = true) {
    const g = this.g; let t = this.tex[name];
    if (t && t.w === w && t.h === h) return t;
    const tx = g.createTexture(); g.bindTexture(g.TEXTURE_2D, tx);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, w, h, 0, g.RGBA, g.UNSIGNED_BYTE, null);
    const f = linear ? g.LINEAR : g.NEAREST; g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, f); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, f);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    const fb = g.createFramebuffer(); g.bindFramebuffer(g.FRAMEBUFFER, fb); g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, tx, 0);
    t = this.tex[name] = { tx, fb, w, h };
    return t;
  }
  pass(p, dst, w, h, binds, uni) {
    const g = this.g; g.useProgram(p);
    g.bindFramebuffer(g.FRAMEBUFFER, dst ? dst.fb : null); g.viewport(0, 0, w, h);
    let unit = 0;
    for (const [name, t] of Object.entries(binds)) { g.activeTexture(g.TEXTURE0 + unit); g.bindTexture(g.TEXTURE_2D, t); g.uniform1i(g.getUniformLocation(p, name), unit++); }
    for (const [name, v] of Object.entries(uni || {})) { const L = g.getUniformLocation(p, name); if (!L) continue; if (Array.isArray(v)) g[`uniform${v.length}fv`](L, v); else g.uniform1f(L, v); }
    g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
    g.drawArrays(g.TRIANGLES, 0, 3);
  }
  // frame: the rendered canvas (uploaded once: linear-filtered for the blurs, read texel-exact for the crisp lookup)
  draw(frame, time = 0) {
    const g = this.g, o = this.opts, W = frame.width, H = frame.height, OW = this.cv.width, OH = this.cv.height;
    const sc = this.target('scene', W, H, true);
    g.bindTexture(g.TEXTURE_2D, sc.tx); g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, W, H, 0, g.RGBA, g.UNSIGNED_BYTE, frame);
    // soft (DOF) copy at half res, two blur iterations
    const hw = W >> 1, hh = H >> 1, a = this.target('softA', hw, hh), b = this.target('softB', hw, hh);
    this.pass(this.pBlur, a, hw, hh, { t: sc.tx }, { d: [1 / W, 0] });
    this.pass(this.pBlur, b, hw, hh, { t: a.tx }, { d: [0, 1 / hh] });
    this.pass(this.pBlur, a, hw, hh, { t: b.tx }, { d: [1.6 / hw, 0] });
    this.pass(this.pBlur, b, hw, hh, { t: a.tx }, { d: [0, 1.6 / hh] });
    // bloom at quarter res; a wide halo at eighth res
    const qw = Math.max(1, W >> 2), qh = Math.max(1, H >> 2), c = this.target('bloomA', qw, qh), d = this.target('bloomB', qw, qh);
    this.pass(this.pBright, c, qw, qh, { t: sc.tx }, { th: o.threshold });
    for (let i = 0; i < 3; i++) { this.pass(this.pBlur, d, qw, qh, { t: c.tx }, { d: [(1 + i) / qw, 0] }); this.pass(this.pBlur, c, qw, qh, { t: d.tx }, { d: [0, (1 + i) / qh] }); }
    const ew = Math.max(1, W >> 3), eh = Math.max(1, H >> 3), e = this.target('wideA', ew, eh), f = this.target('wideB', ew, eh);
    if (o.wide > 0) {
      this.pass(this.pBlur, e, ew, eh, { t: c.tx }, { d: [1 / qw, 0] });
      for (let i = 0; i < 3; i++) { this.pass(this.pBlur, f, ew, eh, { t: e.tx }, { d: [0, (1 + i * 1.5) / eh] }); this.pass(this.pBlur, e, ew, eh, { t: f.tx }, { d: [(1 + i * 1.5) / ew, 0] }); }
    }
    this.pass(this.pFinal, null, OW, OH, { tScene: sc.tx, tSoft: b.tx, tBloom: c.tx, tWide: e.tx }, {
      uLow: [W, H], uOut: [OW, OH], uTime: time, uFocus: 1 - o.focus, uBand: o.band, uDof: o.dof * (1 - Math.min(1, frame.depthDof || 0)), uBloom: o.bloom, uWide: o.wide || 0,
      uRays: o.rays, uRayDir: o.rayDir, uRayCol: o.rayCol, uVig: o.vig, uWarm: o.warm, uNight: o.night, uSat: o.sat, uCon: o.contrast,
      uShadowTint: o.shadowTint || [1, 1, 1], uHighTint: o.highTint || [1, 1, 1], uLift: o.lift || 0, uVibe: o.vibe || 0,
    });
  }
}
