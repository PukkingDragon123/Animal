// Interactive 3D pick scenes, drawn under pixel-GUI overlays (never flat cards):
//  • pickHero(app, o): "Who are you?" — the real 3D hero and heroine stand on two lit, textured pedestals on
//    a little wooden stage in front of a striped curtain. Hover / arrows pick one: their spotlight swells,
//    they turn to face you and wave; drag to spin them; sparkles, dust in the light, a tap for every press.
//    Confirm with the big pixel button (or Enter): a flash, a cheer. → Promise<0 | 1>
//  • pickStarter(app, o): "Choose your partner" — three starter Tokonmon as live 3D models in glass capsules
//    on a textured lab table under spotlights. Hover / arrows bring one forward: the camera pushes in, it
//    cries, its capsule glows; drag to spin it. A pixel stat panel shows its type, glossy stat bars, a level
//    badge and a flavour line. Confirm: a flash, the glass lifts, it cheers. → Promise<index>
// Each scene renders with the stage's renderer into a corner of its canvas (after the frame has been shown)
// and is copied into the UI canvas as the modal's backdrop, so the pixel UI sits right on top of it.
import * as THREE from '../../../vendor/three.module.js';
import { Model } from '../model.js';
import { Animator } from '../anim.js';
import { castHuman } from '../people/human.js';
import { monDef } from './world.js';
import { T } from '../../px/game/ui.js';
import { mx, clamp01, easeOut, boing, squash } from '../../px/game/uikit/theme.js';
import { frame, knob, sparkle, gem, tri, ball, woodRing } from '../../px/game/uikit/frame.js';
import { roundButton } from '../../px/game/uikit/widgets.js';
import { SPECIES, elemsOf } from '../../data/species.js';
import { ELEMENTS } from '../../data/elements.js';
import { ELEM_ICON } from './dex.js';

const R = Math.round, V3 = THREE.Vector3;
const _v4 = new THREE.Vector4(), _s4 = new THREE.Vector4(), _c = new THREE.Color(), _p = new V3();

// ------------------------------------------------------------------ pixel textures for the 3D sets
function ptex(w, h, paint, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); paint(g, w, h);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapNearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t;
}
const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const planks = (rep) => ptex(32, 32, (g) => {
  const tones = ['#9a5a34', '#8a4e2c', '#a8643a', '#925430'];
  for (let j = 0; j < 4; j++) { px(g, tones[j], 0, j * 8, 32, 8); px(g, '#6a3a20', 0, j * 8 + 7, 32, 1); px(g, '#b87444', 0, j * 8, 32, 1); const seam = (j * 13) % 32; px(g, '#6a3a20', seam, j * 8, 1, 7); for (let i = 0; i < 6; i++) px(g, '#7a4426', (i * 7 + j * 5) % 32, j * 8 + 2 + (i % 4), 3, 1); }
}, rep);
const curtain = (rep) => ptex(32, 64, (g) => {
  for (let x = 0; x < 32; x++) { const k = (x % 8); px(g, k < 2 ? '#7a2a3a' : k < 4 ? '#a83a4a' : k < 6 ? '#c24a58' : '#9a3444', x, 0, 1, 64); }
  for (let x = 0; x < 32; x += 8) px(g, '#e8b84a', x + 3, 60, 2, 4);
}, rep);
const pedTop = () => ptex(32, 32, (g) => {
  px(g, '#f3e6cf', 0, 0, 32, 32);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x - 15.5, y - 15.5); if (d > 13 && d < 15) px(g, '#a35d3c', x, y); else if (d >= 15) px(g, '#d48c5c', x, y); else if (d > 11 && d < 12) px(g, '#d9a89a', x, y); }
  for (const [x, y] of [[15, 4], [15, 27], [4, 15], [27, 15]]) px(g, '#e8b84a', x, y, 2, 2);
});
const copperBand = () => ptex(32, 8, (g) => { px(g, '#a35d3c', 0, 0, 32, 8); px(g, '#d48c5c', 0, 1, 32, 1); px(g, '#6b3a28', 0, 6, 32, 2); for (let x = 2; x < 32; x += 8) { px(g, '#f2b98a', x, 3, 2, 2); px(g, '#6b3a28', x + 1, 4, 1, 1); } }, [6, 1]);
const labTiles = (rep) => ptex(32, 32, (g) => { px(g, '#cfe6e0', 0, 0, 32, 32); for (let i = 0; i < 32; i += 16) { px(g, '#9ac0bc', i, 0, 1, 32); px(g, '#9ac0bc', 0, i, 32, 1); px(g, '#e8f6f2', i + 1, 1, 14, 1); } px(g, '#b8d8d2', 3, 20, 4, 4); px(g, '#b8d8d2', 22, 5, 3, 3); }, rep);
const labTop = (rep) => ptex(32, 32, (g) => { px(g, '#8a9aa8', 0, 0, 32, 32); for (let i = 0; i < 32; i += 16) { px(g, '#6a7a88', i, 0, 1, 32); px(g, '#a8b8c4', i + 1, 0, 1, 32); } for (const [x, y] of [[3, 3], [19, 3], [3, 19], [19, 19]]) { px(g, '#5a6874', x, y, 2, 2); px(g, '#c8d4dc', x, y, 1, 1); } }, rep);
const labFront = (rep) => ptex(64, 32, (g) => { px(g, '#5a7a8a', 0, 0, 64, 32); for (let i = 0; i < 64; i += 21) { px(g, '#3e5866', i, 0, 1, 32); px(g, '#7a9aaa', i + 1, 2, 19, 1); px(g, '#e8b84a', i + 8, 14, 5, 2); px(g, '#9a6a1a', i + 8, 16, 5, 1); } px(g, '#3e5866', 0, 31, 64, 1); }, rep);

// ------------------------------------------------------------------ the 3D set + its renderer
class Diorama {
  constructor(app, bg) {
    this.app = app; this.scene = new THREE.Scene(); this.bg = bg; this.t = 0;
    this.cam = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 80); this.at = new V3(); this.camPos = new V3(); this.atGoal = new V3(); this.posGoal = new V3();
    this.disposables = [];
  }
  add(o) { this.scene.add(o); return o; }
  mesh(geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; this.scene.add(m); this.disposables.push(geo); return m; }
  spot(x, y, z, tx, ty, tz, col = 0xfff0d0, I = 30) {
    const s = new THREE.SpotLight(col, I, 12, 0.42, 0.55, 1.4); s.position.set(x, y, z); s.target.position.set(tx, ty, tz); s.castShadow = false;   // (a second scene's shadow passes upset the shared renderer; blob shadows instead) s.shadow.mapSize.set(512, 512); s.shadow.bias = -0.0006;
    this.scene.add(s, s.target);
    // a visible beam: an open cone, additive
    const h = Math.hypot(x - tx, y - ty, z - tz), geo = new THREE.ConeGeometry(Math.tan(0.42) * h * 0.95, h, 24, 1, true), mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const beam = new THREE.Mesh(geo, mat); beam.position.set((x + tx) / 2, (y + ty) / 2, (z + tz) / 2); beam.lookAt(tx, ty, tz); beam.rotateX(-Math.PI / 2); this.scene.add(beam);
    this.disposables.push(geo, mat);
    return { light: s, beam, base: I };
  }
  // a soft round contact shadow under a subject (stepped rings, no shadow map)
  blob(x, y, z, r) { for (let k = 0; k < 3; k++) { const geo = new THREE.CircleGeometry(r * (1 - k * 0.25), 32), mat = new THREE.MeshBasicMaterial({ color: 0x1a0f0c, transparent: true, opacity: 0.18, depthWrite: false }); const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.002 * (k + 1), z); this.scene.add(m); this.disposables.push(geo, mat); } }
  dust(n, box) {
    const pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = box[0] + Math.random() * (box[3] - box[0]); pos[i * 3 + 1] = box[1] + Math.random() * (box[4] - box[1]); pos[i * 3 + 2] = box[2] + Math.random() * (box[5] - box[2]); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xfff2c8, size: 0.035, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
    this.dustPts = new THREE.Points(geo, mat); this.dustBox = box; this.scene.add(this.dustPts); this.disposables.push(geo, mat);
  }
  update(dt) {
    this.t += dt;
    if (this.dustPts) { const a = this.dustPts.geometry.attributes.position, B = this.dustBox; for (let i = 0; i < a.count; i++) { let y = a.getY(i) + dt * (0.04 + (i % 5) * 0.01); if (y > B[4]) y = B[1]; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(this.t * 0.7 + i) * dt * 0.02); } a.needsUpdate = true; }
    const k = 1 - Math.exp(-dt * 4); this.at.lerp(this.atGoal, k); this.camPos.lerp(this.posGoal, k);
    this.cam.position.copy(this.camPos); this.cam.lookAt(this.at);
  }
  // render with the stage's renderer into the corner of its canvas, then copy into the UI as the backdrop
  draw(ui) {
    const st = this.app.stage; if (!st || !st.r) { ui.rect(0, 0, ui.w, ui.h, '#3a2a2e'); return false; }
    const r = st.r, cv = r.domElement, SS = ui.k || 2, pw = Math.min(cv.width, Math.round(ui.w * SS)), ph = Math.min(cv.height, Math.round(ui.h * SS));
    this.cam.aspect = ui.w / ui.h; this.cam.updateProjectionMatrix(); this.cam.updateMatrixWorld();
    r.getViewport(_v4); r.getScissor(_s4); const scT = r.getScissorTest(), cc = r.getClearColor(_c).getHex(), ca = r.getClearAlpha(), prevRT = r.getRenderTarget(), ac = r.autoClear;
    r.setRenderTarget(null); const vy = cv.height - ph;
    r.setViewport(0, vy, pw, ph); r.setScissor(0, vy, pw, ph); r.setScissorTest(true);
    r.setClearColor(this.bg, 1); r.autoClear = false; r.clear(true, true, false);
    try { r.render(this.scene, this.cam); } finally { r.setScissorTest(scT); r.setScissor(_s4); r.setViewport(_v4); r.setClearColor(cc, ca); r.setRenderTarget(prevRT); r.autoClear = ac; }
    const g = ui.g; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(cv, 0, 0, pw, ph, 0, 0, ui.w, ui.h); g.imageSmoothingEnabled = false;
    return true;
  }
  // world point → UI pixels
  project(x, y, z, ui) { _p.set(x, y, z).project(this.cam); return { x: R((_p.x + 1) / 2 * ui.w), y: R((1 - _p.y) / 2 * ui.h), vis: _p.z < 1 }; }
  dispose() { for (const d of this.disposables) if (d.dispose) d.dispose(); this.scene.traverse((o) => { if (o.material && o.material.map && o.material.map.dispose) o.material.map.dispose(); }); }
}
function sfx(app, id, o) { const a = app.audio; if (a && a.sfx) a.sfx(id, o); }
// drag to spin: returns the yaw delta for this frame (pointer drags anywhere that isn't a button)
function dragSpin(ui, S) {
  const P = ui.ptr;
  if (P.down) { if (S.drag == null) S.drag = { x: P.x, moved: 0 }; else { const dx = P.x - S.drag.x; S.drag.x = P.x; S.drag.moved += Math.abs(dx); return dx * 0.045; } }
  else if (!P.released) S.drag = null;
  return 0;
}
// the 'drag to spin' hint plate
function dragHint(u) { const lab = 'DRAG TO SPIN', w = R(u.tw(lab, { mini: true, bold: true }) + 30); frame(u, 8, u.h - 27, w, 19, { thin: true, r: 2 }); u.bigIcon('hand', 11, u.h - 24, null, { shadow: false }); u.text(lab, 26, u.h - 20, T.text, { mini: true, bold: true }); }
// a raised title plate with diamonds (big pixel type)
function titlePlate(ui, str, y, t) {
  const w = R(ui.tw(str, { scale: 2 }) + 44), x = R(ui.w / 2 - w / 2), k = boing(t * 1.4), yy = R(y - (1 - k) * 40);
  frame(ui, x, yy, w, 30, {});
  gem(ui.s, x + 12, yy + 15, T.copper, 3); gem(ui.s, x + w - 13, yy + 15, T.copper, 3);
  ui.text(str, R(ui.w / 2), yy + 10, T.text, { align: 'center', scale: 2 });
}
// a big confirm button (copper rim, a coloured face) with a squash; returns true on click / Enter
function bigButton(ui, cx, y, label, icon, color, S, live) {
  const w = R(ui.tw(label, { bold: true }) + 52), h = 26, x = R(cx - w / 2);
  const hit = ui.button(x, y, w, h, label, { color, icon, hotkey: live ? 'Enter' : null, active: true, frame: 'copper', modal: true, disabled: !live });
  if (((ui.t * 1.2) % 1) < 0.25) sparkle(ui.s, x + w - 4, y + 2, T.amberL, 1 - ((ui.t * 1.2) % 1) / 0.25);
  void S; return hit;
}

// ================================================================== who are you?
export function pickHero(app, o = {}) {
  const ui = app.ui, cards = o.cards || [{ label: 'Boy', sub: 'Messy hair, big dreams' }, { label: 'Girl', sub: 'Ponytail, bigger dreams' }];
  const D = new Diorama(app, 0x2a1a22);
  // the set: a round wooden stage, a red curtain, two pedestals under spotlights
  const floorMat = new THREE.MeshStandardMaterial({ map: planks([6, 6]), roughness: 0.8 });
  D.mesh(new THREE.CylinderGeometry(3.4, 3.5, 0.2, 48), floorMat, 0, -0.1, 0);
  const cur = D.mesh(new THREE.CylinderGeometry(4.2, 4.2, 4.2, 48, 1, true, Math.PI * 0.62, Math.PI * 0.76), new THREE.MeshStandardMaterial({ map: curtain([10, 1]), roughness: 0.9, side: THREE.BackSide }), 0, 1.9, 0.6);
  cur.receiveShadow = true; cur.castShadow = false;
  D.add(new THREE.HemisphereLight(0xffe8d8, 0x3a2030, 0.55));
  const people = [], spots = [], peds = [];
  const who = ['hero', 'heroine'], X = [-0.95, 0.95];
  for (let i = 0; i < 2; i++) {
    const top = new THREE.MeshStandardMaterial({ map: pedTop(), roughness: 0.6 }), side = new THREE.MeshStandardMaterial({ map: copperBand(), roughness: 0.45, metalness: 0.2 });
    const ped = D.mesh(new THREE.CylinderGeometry(0.52, 0.58, 0.34, 32), [side, top, side], X[i], 0.17, 0);
    const ring = D.mesh(new THREE.TorusGeometry(0.6, 0.03, 8, 40), new THREE.MeshBasicMaterial({ color: i ? 0xff8ab8 : 0xffb050 }), X[i], 0.03, 0); ring.rotation.x = Math.PI / 2; ring.castShadow = false;
    peds.push({ ped, ring });
    spots.push(D.spot(X[i] * 1.2, 4.2, 1.6, X[i], 0.4, 0, i ? 0xffe0ee : 0xfff0d0, 26));
    const m = castHuman(who[i]); const anim = m.animator ? m.animator() : new Animator(m);
    m.group.position.set(X[i], 0.34, 0); m.group.traverse((c) => { if (c.isMesh) { c.castShadow = true; } }); D.add(m.group);
    anim.play('idle', { fade: 0 });
    people.push({ m, anim, yaw: i ? -0.35 : 0.35, spin: 0, waveT: 9 }); D.blob(X[i], 0.341, 0, 0.32);
  }
  D.dust(60, [-2.2, 0.2, -1, 2.2, 3, 1.4]);
  D.camPos.set(0, 1.6, 8); D.posGoal.copy(D.camPos); D.at.set(0, 1.05, 0); D.atGoal.copy(D.at);
  const S = { sel: o.pick ?? 0, done: -1, t: 0, lp: null, selT: 9, flash: 0 };
  return new Promise((resolve) => {
    const m = {
      capture: true,
      resolve: (v) => { for (const p of people) { D.scene.remove(p.m.group); if (p.m.dispose) p.m.dispose(); } D.dispose(); resolve(v); },
      draw(u, dt, live) {
        S.t += dt; S.selT += dt;
        // input: hover a side, arrows, drag to spin, Enter / the button to confirm
        if (live && S.done < 0) {
          const moved = !S.lp || S.lp[0] !== u.ptr.x || S.lp[1] !== u.ptr.y; S.lp = [u.ptr.x, u.ptr.y];
          let want = S.sel;
          if (moved && u.ptr.x >= 0 && u.ptr.y > 40 && u.ptr.y < u.h - 50 && !u.ptr.down) want = u.ptr.x < u.w / 2 ? 0 : 1;
          if (u.key('ArrowLeft') || u.key('a')) want = 0; if (u.key('ArrowRight') || u.key('d')) want = 1;
          if (u.ptr.pressed && u.ptr.y > 40 && u.ptr.y < u.h - 50) want = u.ptr.x < u.w / 2 ? 0 : 1;
          if (want !== S.sel) { S.sel = want; S.selT = 0; sfx(app, 'ui_tap', { vol: 0.6, pitch: 1.3 }); people[want].anim.play('wave', { fade: 0.2 }); people[want].waveT = 0; }
          people[S.sel].spin += dragSpin(u, S);
        }
        // the set animates
        for (let i = 0; i < 2; i++) {
          const p = people[i], on = i === S.sel; p.waveT += dt;
          if (p.waveT > 2.2 && p.waveT < 3 && S.done < 0) { p.anim.play('idle', { fade: 0.3 }); p.waveT = 9; }
          if (!on) p.spin *= Math.exp(-dt * 3);
          const goal = (on ? 0 : (i ? -0.45 : 0.45)) + p.spin;
          p.yaw += (goal - p.yaw) * (1 - Math.exp(-dt * 6)); p.m.group.rotation.y = p.yaw;
          p.anim.update(dt, { look: on ? D.cam.position : null });
          const sp = spots[i]; sp.light.intensity += ((on ? sp.base * 1.4 : sp.base * 0.35) - sp.light.intensity) * (1 - Math.exp(-dt * 5)); sp.beam.material.opacity += ((on ? 0.1 : 0.025) - sp.beam.material.opacity) * (1 - Math.exp(-dt * 5));
          peds[i].ring.material.color.setHex(on ? (i ? 0xff9ac8 : 0xffc060) : 0x6a4a40);
          const b = on && S.selT < 0.6 ? Math.sin(S.selT * 18) * Math.exp(-S.selT * 6) * 0.06 : 0; p.m.group.scale.set(1 + b, 1 - b, 1 + b);
        }
        D.posGoal.set(S.sel ? 0.35 : -0.35, 1.5, 6.4); D.atGoal.set(S.sel ? 0.3 : -0.3, 1.04, 0);
        D.update(dt);
        D.draw(u);
        // ---- the pixel overlay
        titlePlate(u, o.title || 'WHO ARE YOU?', 8, S.t);
        for (let i = 0; i < 2; i++) {
          const on = i === S.sel, base = D.project(X[i], 0, 0.62, u), head = D.project(X[i], 2.15, 0, u), c = cards[i] || {};
          if (on) { // selection brackets around the character
            const bh = base.y - head.y - 8, bw = R(bh * 0.5), bx = head.x - R(bw / 2), by = head.y - 4, oo = R(Math.abs(Math.sin(S.t * 5)) * 2);
            for (const [cx, cy, dx, dy] of [[bx - oo, by - oo, 1, 1], [bx + bw + oo, by - oo, -1, 1], [bx - oo, by + bh + oo, 1, -1], [bx + bw + oo, by + bh + oo, -1, -1]]) { u.rect(Math.min(cx, cx + dx * 6) - 1, cy - 1, 8, 3, T.ink); u.rect(cx - 1, Math.min(cy, cy + dy * 6) - 1, 3, 8, T.ink); u.rect(Math.min(cx, cx + dx * 5), cy, 6, 1, T.amber); u.rect(cx, Math.min(cy, cy + dy * 5), 1, 6, T.amber); }
            for (let k = 0; k < 4; k++) { const a = S.t * 1.3 + k * 1.57, ph = (Math.sin(S.t * 3 + k) + 1) / 2; sparkle(u.s, R(head.x + Math.cos(a) * 40), R((head.y + base.y) / 2 + Math.sin(a) * 50), k % 2 ? T.amberL : '#ffffff', ph); }
          }
          const lab = String(c.label || (i ? 'Girl' : 'Boy')).toUpperCase(), pw2 = R(u.tw(lab, { mini: true, bold: true }) + 40), lift = on ? R(-boing(Math.min(1.2, S.selT * 1.5)) * 3) : 0, ny = base.y + 6 + lift, nx = R(base.x - pw2 / 2);
          frame(u, nx, ny, pw2, 17, { thin: true, r: 2, edge: on ? T.brass : null });
          woodRing(u.s, nx + 2, ny + 8, 7, { th: 2, fill: i ? T.pink : T.coral, shadow: false });
          u.bigIcon(c.icon || (i ? 'heart' : 'star'), nx - 4, ny + 2, null, { shadow: false });
          gem(u.s, nx + 14, ny + 8, on ? T.amber : T.copperL, 2); gem(u.s, nx + pw2 - 7, ny + 8, on ? T.amber : T.copperL, 2);
          u.text(lab, nx + 14 + R((pw2 - 21) / 2), ny + 6, T.text, { mini: true, bold: true, align: 'center' });
          if (on && c.sub) { const sw = R(u.tw(c.sub) + 16); frame(u, R(base.x - sw / 2), ny + 20, sw, 17, { thin: true, r: 2, shadow: false }); u.text(c.sub, R(base.x), ny + 25, T.text, { align: 'center' }); }
        }
        // arrows + hint + confirm
        const la = roundButton(u, 22, R(u.h / 2), 9, 'left', { color: T.cream, modal: true, sel: false }), ra = roundButton(u, u.w - 22, R(u.h / 2), 9, 'right', { color: T.cream, modal: true });
        if (live && S.done < 0 && (la.clicked || ra.clicked)) { const want = la.clicked ? 0 : 1; if (want !== S.sel) { S.sel = want; S.selT = 0; people[want].anim.play('wave', { fade: 0.2 }); people[want].waveT = 0; } }
        dragHint(u);
        if (bigButton(u, R(u.w / 2), u.h - 34, "That's me!", 'check', T.green, S, live && S.done < 0) && S.done < 0) { S.done = 0; sfx(app, 'notification', { vol: 0.8 }); people[S.sel].anim.play('cheer', { fade: 0.15 }); people[S.sel].waveT = 0; }
        if (S.done >= 0) {
          S.done += dt;
          u.fade(clamp01(1 - S.done * 2.5) * 0.85, '#fff8e8');
          for (let k = 0; k < 10; k++) { const a = k * 0.628 + S.done * 2, rr = 20 + easeOut(S.done) * 80; const hp = D.project(X[S.sel], 1.2, 0, u); sparkle(u.s, R(hp.x + Math.cos(a) * rr), R(hp.y + Math.sin(a) * rr * 0.7), k % 2 ? T.amber : '#ffffff', clamp01(1.2 - S.done)); }
          if (S.done > 1.3) u.closeModal(m, S.sel);
        }
      },
    };
    ui.openModal(m);
  });
}

// ================================================================== choose your partner
const STAT_ROWS = [['dmg', 'POW', 'red'], ['elm', 'ELM', 'violet'], ['def', 'DEF', 'blue'], ['spd', 'SPD', 'green'], ['hp', 'HP', 'orange']];
export function pickStarter(app, o = {}) {
  const ui = app.ui, ids = o.species || ['chilichick', 'bubblion', 'strawbaa'];
  const D = new Diorama(app, 0x1e2a2e);
  // the lab: tiled wall, a metal-topped table, three glass capsules under spotlights
  D.mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshStandardMaterial({ map: labTiles([7, 3]), roughness: 0.7 }), 0, 2.6, -1.8);
  D.mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshStandardMaterial({ map: planks([10, 6]), roughness: 0.85 }), 0, 0, 1).rotation.x = -Math.PI / 2;
  const tableTop = new THREE.MeshStandardMaterial({ map: labTop([4, 1.5]), roughness: 0.35, metalness: 0.35 }), tableSide = new THREE.MeshStandardMaterial({ map: labFront([2, 1]), roughness: 0.6 });
  D.mesh(new THREE.BoxGeometry(4.6, 0.9, 1.5), [tableSide, tableSide, tableTop, tableSide, tableSide, tableSide], 0, 0.45, 0);
  // a shelf strip on the wall with little bottles
  D.mesh(new THREE.BoxGeometry(5, 0.08, 0.3), new THREE.MeshStandardMaterial({ color: 0x8a5434, roughness: 0.7 }), 0, 2.4, -1.65);
  for (let i = 0; i < 9; i++) D.mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.24 + (i % 3) * 0.06, 10), new THREE.MeshStandardMaterial({ color: [0x5fd84a, 0x3ab8d8, 0xe86a9a, 0xf0b030][i % 4], roughness: 0.2, transparent: true, opacity: 0.8 }), -2 + i * 0.5, 2.56 + (i % 3) * 0.03, -1.62);
  D.add(new THREE.HemisphereLight(0xe8f4ff, 0x2a2a3a, 0.6));
  const X = [-1.3, 0, 1.3], caps = [];
  ids.forEach((id, i) => {
    const sp = SPECIES[id] || {}, el = sp.elem ? elemsOf(sp)[0] : null, col = new THREE.Color((ELEMENTS[el] && ELEMENTS[el].color) || '#3ab8d8');
    const base = D.mesh(new THREE.CylinderGeometry(0.44, 0.48, 0.14, 32), [new THREE.MeshStandardMaterial({ map: copperBand(), roughness: 0.45, metalness: 0.3 }), new THREE.MeshStandardMaterial({ map: pedTop(), roughness: 0.5 }), new THREE.MeshStandardMaterial({ color: 0x6b3a28 })], X[i], 0.97, 0);
    const glow = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6 });
    const ring = D.mesh(new THREE.TorusGeometry(0.4, 0.025, 8, 40), glow, X[i], 1.05, 0); ring.rotation.x = Math.PI / 2; ring.castShadow = false;
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xd8f0ff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
    const glass = D.mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.95, 32, 1, true), glassMat, X[i], 1.52, 0); glass.castShadow = false;
    const capTop = D.mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 32), new THREE.MeshStandardMaterial({ map: copperBand(), roughness: 0.4, metalness: 0.3 }), X[i], 2.04, 0);
    const spot = D.spot(X[i], 4.4, 1.4, X[i], 1.1, 0, 0xf4f8ff, 22);
    const C = { id, sp, el, col, base, ring, glass, capTop, spot, glow, holder: new THREE.Group(), anim: null, yaw: 0, spin: 0, pop: 0, lift: 0 };
    C.holder.position.set(X[i], 1.04, 0); D.add(C.holder); D.blob(X[i], 1.041, 0, 0.26);
    monDef(id).then((def) => {
      if (!def || D.dead) return;
      const mm = new Model(def); if (mm.drip) mm.drip(1, 0);
      const anim = mm.animator ? mm.animator() : new Animator(mm); if (anim.clips && anim.clips.idle) anim.play('idle', { fade: 0 });
      for (let k = 0; k < 6; k++) anim.update(1 / 30, {});
      mm.group.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(mm.group), size = box.getSize(new V3()), ctr = box.getCenter(new V3()), s = Math.min(0.72 / Math.max(0.01, size.y), 0.62 / Math.max(0.01, size.x, size.z));
      mm.group.position.set(-ctr.x * s, -box.min.y * s, -ctr.z * s); mm.group.scale.multiplyScalar(s);
      mm.group.traverse((c) => { if (c.isMesh) c.castShadow = true; });
      C.holder.add(mm.group); C.model = mm; C.anim = anim;
    }).catch(() => {});
    caps.push(C);
  });
  D.dust(50, [-2.2, 1, -1, 2.2, 3.4, 1]);
  D.camPos.set(0, 1.95, 4.5); D.posGoal.copy(D.camPos); D.at.set(0, 1.3, 0); D.atGoal.copy(D.at);
  const S = { sel: o.pick ?? 0, done: -1, t: 0, lp: null, selT: 9, focus: false };
  const select = (i) => { if (i === S.sel && S.focus) return; S.sel = i; S.selT = 0; S.focus = true; const C = caps[i]; sfx(app, 'bubble', { vol: 0.8, pitch: 1.1 }); if (C.anim && C.anim.clips) { const clip = C.anim.clips.cry ? 'cry' : C.anim.clips.win ? 'win' : 'idle'; C.anim.play(clip, { restart: true, fade: 0.1 }); C.cryT = 0; } };
  return new Promise((resolve) => {
    const m = {
      capture: true,
      resolve: (v) => { D.dead = true; for (const C of caps) if (C.model && C.model.dispose) C.model.dispose(); D.dispose(); resolve(v); },
      draw(u, dt, live) {
        S.t += dt; S.selT += dt;
        const proj = caps.map((C, i) => D.project(X[i], 1.5, 0, u));
        if (live && S.done < 0) {
          const moved = !S.lp || S.lp[0] !== u.ptr.x || S.lp[1] !== u.ptr.y; S.lp = [u.ptr.x, u.ptr.y];
          const panelX = u.w - 178;
          if (u.ptr.x >= 0 && u.ptr.x < panelX && u.ptr.y > 40 && u.ptr.y < u.h - 46) {
            let best = -1, bd = 1e9; proj.forEach((p, i) => { const d = Math.abs(p.x - u.ptr.x); if (d < bd) { bd = d; best = i; } });
            if (best >= 0 && bd < 70 && ((moved && !u.ptr.down) || u.ptr.pressed)) select(best);
          }
          if (u.key('ArrowLeft') || u.key('a')) select((S.sel + caps.length - 1) % caps.length);
          if (u.key('ArrowRight') || u.key('d')) select((S.sel + 1) % caps.length);
          caps[S.sel].spin += dragSpin(u, S);
        }
        caps.forEach((C, i) => {
          const on = i === S.sel && S.focus;
          if (C.anim) { C.cryT = (C.cryT ?? 9) + dt; if (C.cryT > 1.8 && C.cryT < 9 && S.done < 0) { if (C.anim.clips.idle) C.anim.play('idle', { fade: 0.3 }); C.cryT = 9; } C.anim.update(dt, { look: on ? D.cam.position : null }); }
          if (!on) C.spin *= Math.exp(-dt * 3);
          C.yaw += ((on ? 0 : (i - 1) * -0.4) + C.spin - C.yaw) * (1 - Math.exp(-dt * 6)); C.holder.rotation.y = C.yaw;
          const b = on && S.selT < 0.6 ? Math.sin(S.selT * 18) * Math.exp(-S.selT * 6) * 0.08 : 0, s = 1 + b + (on ? 0.06 : 0);
          C.holder.scale.set(s, s - b * 2, s);
          C.glow.opacity += ((on ? 0.95 : 0.35) - C.glow.opacity) * (1 - Math.exp(-dt * 6));
          C.glass.material.opacity += ((on ? 0.1 : 0.2) - C.glass.material.opacity) * (1 - Math.exp(-dt * 6));
          C.spot.light.intensity += ((on || !S.focus ? C.spot.base * (on ? 1.5 : 1) : C.spot.base * 0.35) - C.spot.light.intensity) * (1 - Math.exp(-dt * 5));
          C.spot.beam.material.opacity += ((on ? 0.1 : 0.03) - C.spot.beam.material.opacity) * (1 - Math.exp(-dt * 5));
          if (S.done >= 0 && i === S.sel) { C.lift = Math.min(1.2, C.lift + dt * 1.6); C.glass.position.y = 1.52 + easeOut(C.lift) * 1.2; C.capTop.position.y = 2.04 + easeOut(C.lift) * 1.2; C.glass.material.opacity = 0.16 * (1 - C.lift / 1.2); }
        });
        if (S.focus) { const x = X[S.sel]; D.posGoal.set(x * 0.75 - 0.3, 1.8, 3.7); D.atGoal.set(x - 0.28, 1.42, 0); } else { D.posGoal.set(0, 1.95, 4.5); D.atGoal.set(0, 1.3, 0); }
        D.update(dt);
        D.draw(u);
        // ---- the pixel overlay
        titlePlate(u, o.title || 'CHOOSE YOUR PARTNER', 8, S.t);
        caps.forEach((C, i) => {
          const p = proj[i], on = i === S.sel && S.focus, nm = (C.sp.name || C.id).toUpperCase(), w = R(u.tw(nm, { mini: true, bold: true }) + 22), y = D.project(X[i], 0.92, 0.75, u).y + 4;
          frame(u, R(p.x - w / 2), y, w, 13, { thin: true, r: 1, fill: on ? T.creamL : T.cream, edge: on ? T.brass : null });
          gem(u.s, R(p.x - w / 2) + 5, y + 6, on ? T.amber : T.copperL, 2); gem(u.s, R(p.x + w / 2) - 6, y + 6, on ? T.amber : T.copperL, 2);
          u.text(nm, p.x, y + 4, T.text, { mini: true, bold: true, align: 'center' });
          if (on) tri(u.s, p.x - 3, R(p.y - 50 + Math.abs(Math.sin(S.t * 5)) * 3), 'down', 3, T.amber);
        });
        // the stat panel
        const C = caps[S.sel], pw = 170, px0 = u.w - pw - 8, py0 = 46, ph = 182, kin = boing((S.focus ? S.selT : 0) * 1.6);
        const pX = R(px0 + (1 - kin) * (pw + 20));
        if (S.focus) {
        frame(u, pX, py0, pw, ph, {});
        const nm = (C.sp.name || C.id).toUpperCase(), nw = R(u.tw(nm, { mini: true, bold: true }) + 24);
        frame(u, pX + 10, py0 + 9, nw, 13, { thin: true, r: 1, fill: T.creamL, shadow: false });
        gem(u.s, pX + 15, py0 + 15, T.copperL, 2); gem(u.s, pX + 10 + nw - 6, py0 + 15, T.copperL, 2);
        u.text(nm, pX + 10 + R(nw / 2), py0 + 13, T.text, { mini: true, bold: true, align: 'center' });
        frame(u, pX + pw - 34, py0 + 7, 24, 17, { thin: true, r: 1, fill: T.copperL, shadow: false });
        u.text('LV', pX + pw - 31, py0 + 11, '#ffffff', { mini: true, outline: T.copperD }); u.text(String(o.level || 5), pX + pw - 17, py0 + 10, '#ffffff', { bold: true, outline: T.copperD });
        // type chips
        let cx = pX + 10; const els = C.sp.elem ? elemsOf(C.sp) : [];
        for (const el of els) { const E = ELEMENTS[el] || { name: el, color: T.cyan }, lab = String(E.name).toUpperCase(), cw = R(u.tw(lab, { mini: true, bold: true }) + 22); frame(u, cx, py0 + 28, cw, 15, { thin: true, r: 2, fill: E.color, edge: mx(E.color, T.ink, 0.3), shadow: false }); u.bigIcon(ELEM_ICON[el] || 'star', cx + 2, py0 + 29, null, { shadow: false }); u.text(lab, cx + 16, py0 + 33, '#ffffff', { mini: true, bold: true, outline: mx(E.color, T.ink, 0.5) }); cx += cw + 4; }
        if (C.sp.family) u.text(String(C.sp.family).toUpperCase(), pX + pw - 10, py0 + 33, T.dim, { mini: true, align: 'right' });
        // glossy stat bars
        const base = C.sp.base || {}, mxv = Math.max(10, ...STAT_ROWS.map(([k]) => base[k] || 0));
        STAT_ROWS.forEach(([k, lab, col], j) => {
          const by = py0 + 52 + j * 19, v = clamp01(((base[k] || 0) / mxv) * Math.min(1, easeOut((S.focus ? S.selT : 1) * 2.5 - j * 0.12)));
          u.text(lab, pX + 10, by + 3, T.dim, { mini: true, bold: true });
          u.bar(pX + 42, by, pw - 74, 9, v, { color: col, id: 'st-' + k, trail: false, clamps: true });
          u.text(String(base[k] || 0), pX + pw - 12, by + 3, T.text, { mini: true, bold: true, align: 'right' });
        });
        // a flavour line
        const lines = u.wrap(C.sp.role || C.sp.personality || '', pw - 20).slice(0, 2);
        lines.forEach((l, j) => u.text(l, pX + 10, py0 + 150 + j * 11, T.text, {}));
        }
        // hint + confirm
        dragHint(u);
        if (bigButton(u, R((u.w - pw) / 2), u.h - 34, 'Partner up!', 'heart', T.green, S, live && S.done < 0 && S.focus) && S.done < 0 && S.focus) {
          S.done = 0; sfx(app, 'notification', { vol: 0.9 }); sfx(app, 'whoosh', { vol: 0.6, pitch: 1.3 });
          const C2 = caps[S.sel]; if (C2.anim && C2.anim.clips) C2.anim.play(C2.anim.clips.win ? 'win' : C2.anim.clips.dance ? 'dance' : 'idle', { restart: true, fade: 0.1 }); C2.cryT = -9;
        }
        if (!S.focus && S.t > 0.3) { const w2 = R(u.tw('Point at a capsule') + 16); frame(u, R((u.w - pw) / 2 - w2 / 2), u.h - 60, w2, 17, { thin: true, r: 2 }); u.text('Point at a capsule', R((u.w - pw) / 2), u.h - 55, T.text, { align: 'center' }); }
        if (S.done >= 0) {
          S.done += dt;
          u.fade(clamp01(1 - S.done * 2.2) * 0.9, '#ffffff');
          const hp = proj[S.sel]; for (let k = 0; k < 12; k++) { const a = k * 0.523 + S.done * 2.4, rr = 16 + easeOut(S.done) * 90; sparkle(u.s, R(hp.x + Math.cos(a) * rr), R(hp.y + Math.sin(a) * rr * 0.7), k % 2 ? T.amber : '#ffffff', clamp01(1.4 - S.done)); }
          if (S.done > 1.6) u.closeModal(m, S.sel);
        }
        void knob; void ball; void squash;
      },
    };
    ui.openModal(m);
  });
}
