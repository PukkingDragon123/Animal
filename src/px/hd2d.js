// HD-2D presentation pass (WebGL2): takes the low-res pixel frame and stages it
// like a diorama — crisp nearest-neighbour pixels in the focus band, tilt-shift
// depth of field toward the top and bottom of the screen, bloom from bright
// pixels and light halos, soft god-ray light shafts, warm/violet colour grading,
// vignette and a whisper of film grain.
const VS = `#version 300 es
in vec2 a; out vec2 v; void main(){ v = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;
const BRIGHT = `#version 300 es
precision highp float; uniform sampler2D t; uniform float th; in vec2 v; out vec4 o;
void main(){ vec3 c = texture(t, v).rgb; float l = max(c.r, max(c.g, c.b)); o = vec4(c * smoothstep(th, th + 0.18, l), 1.0); }`;
const BLUR = `#version 300 es
precision highp float; uniform sampler2D t; uniform vec2 d; in vec2 v; out vec4 o;
void main(){ vec3 c = texture(t, v).rgb * 0.227;
  c += (texture(t, v + d * 1.385).rgb + texture(t, v - d * 1.385).rgb) * 0.316;
  c += (texture(t, v + d * 3.231).rgb + texture(t, v - d * 3.231).rgb) * 0.070; o = vec4(c, 1.0); }`;
const FINAL = `#version 300 es
precision highp float;
uniform sampler2D tScene; uniform sampler2D tSoft; uniform sampler2D tBloom;
uniform vec2 uLow; uniform vec2 uOut; uniform float uTime;
uniform float uFocus; uniform float uBand; uniform float uDof; uniform float uBloom;
uniform float uRays; uniform vec2 uRayDir; uniform vec3 uRayCol; uniform float uVig; uniform float uWarm; uniform float uNight; uniform float uSat; uniform float uCon;
in vec2 v; out vec4 o;
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
void main(){
  // crisp pixel lookup (nearest texel of the low-res frame)
  vec2 px = (floor(v * uLow) + 0.5) / uLow;
  vec3 sharp = texture(tScene, px).rgb;
  vec3 soft = texture(tSoft, v).rgb;
  // tilt-shift: in focus inside the band around uFocus, blurring smoothly away from it
  float dy = abs(v.y - uFocus);
  float k = smoothstep(uBand, uBand + 0.32, dy) * uDof;
  vec3 c = mix(sharp, soft, k);
  // bloom
  c += texture(tBloom, v).rgb * uBloom;
  // god rays: soft diagonal shafts drifting slowly, stronger toward the top
  if (uRays > 0.0) {
    float s = dot(v * vec2(uOut.x / uOut.y, 1.0), normalize(uRayDir));
    float shafts = 0.55 * sin(s * 9.0 + uTime * 0.05) + 0.35 * sin(s * 23.0 - uTime * 0.08) + 0.25 * sin(s * 4.0 + 1.3);
    shafts = smoothstep(0.25, 1.1, shafts) * smoothstep(0.0, 0.9, v.y);
    c += uRayCol * shafts * uRays;
  }
  // grade: violet shadows, warm highlights, gentle filmic contrast
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(c, c * vec3(0.86, 0.82, 1.06), (1.0 - smoothstep(0.0, 0.55, l)) * 0.55);
  c = mix(c, c * vec3(1.08, 1.02, 0.9), smoothstep(0.5, 1.0, l) * uWarm);
  c = mix(c, c * vec3(0.55, 0.62, 0.95), uNight);
  c = mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, uSat);
  c = (c - 0.5) * uCon + 0.5;
  c = c / (1.0 + c * 0.06) * 1.04;
  // vignette + grain
  vec2 q = v - 0.5; q.x *= uOut.x / uOut.y;
  c *= mix(1.0, smoothstep(1.05, 0.25, length(q)), uVig);
  c += (hash(v * uOut + fract(uTime)) - 0.5) * 0.018;
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
    this.opts = { focus: 0.52, band: 0.22, dof: 0.65, bloom: 0.45, threshold: 0.8, rays: 0.06, rayDir: [1, 0.55], rayCol: [1.0, 0.84, 0.58], vig: 0.6, warm: 0.5, night: 0, sat: 1.12, contrast: 1.1 };
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
  // frame: the low-res canvas from Scene2D; glowCanvas (optional): extra light halos fed only to bloom
  draw(frame, time = 0) {
    const g = this.g, o = this.opts, W = frame.width, H = frame.height, OW = this.cv.width, OH = this.cv.height;
    // upload scene (nearest for crisp lookup, a linear copy feeds the blurs)
    const sc = this.target('scene', W, H, false);
    g.bindTexture(g.TEXTURE_2D, sc.tx); g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, W, H, 0, g.RGBA, g.UNSIGNED_BYTE, frame);
    const lin = this.target('lin', W, H, true);
    g.bindTexture(g.TEXTURE_2D, lin.tx); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, W, H, 0, g.RGBA, g.UNSIGNED_BYTE, frame);
    // soft (DOF) copy at half res, two blur iterations
    const hw = W >> 1, hh = H >> 1, a = this.target('softA', hw, hh), b = this.target('softB', hw, hh);
    this.pass(this.pBlur, a, hw, hh, { t: lin.tx }, { d: [1 / W, 0] });
    this.pass(this.pBlur, b, hw, hh, { t: a.tx }, { d: [0, 1 / hh] });
    this.pass(this.pBlur, a, hw, hh, { t: b.tx }, { d: [1.6 / hw, 0] });
    this.pass(this.pBlur, b, hw, hh, { t: a.tx }, { d: [0, 1.6 / hh] });
    // bloom at quarter res
    const qw = W >> 2, qh = H >> 2, c = this.target('bloomA', qw, qh), d = this.target('bloomB', qw, qh);
    this.pass(this.pBright, c, qw, qh, { t: lin.tx }, { th: o.threshold });
    for (let i = 0; i < 3; i++) { this.pass(this.pBlur, d, qw, qh, { t: c.tx }, { d: [(1 + i) / qw, 0] }); this.pass(this.pBlur, c, qw, qh, { t: d.tx }, { d: [0, (1 + i) / qh] }); }
    this.pass(this.pFinal, null, OW, OH, { tScene: sc.tx, tSoft: b.tx, tBloom: c.tx }, {
      uLow: [W, H], uOut: [OW, OH], uTime: time, uFocus: 1 - o.focus, uBand: o.band, uDof: o.dof, uBloom: o.bloom,
      uRays: o.rays, uRayDir: o.rayDir, uRayCol: o.rayCol, uVig: o.vig, uWarm: o.warm, uNight: o.night, uSat: o.sat, uCon: o.contrast,
    });
  }
}
