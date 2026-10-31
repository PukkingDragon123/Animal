// The TokoBook: the TokoPhone's collection book of every Tokonmon. A grid of medals on the left (colour
// when you have seen one, a star when you have caught it) and a page on the right with the selected
// Tokonmon as a LIVE 3D model on a little pedestal — it idles, turns, and does a trick when you tap it.
// Unseen ones show as an ink silhouette.
// The model is rendered by the stage's own renderer into a corner of its canvas after the frame has been
// presented, then copied straight into the UI canvas (no pixel read-back), so the book costs one small
// extra render while it is open.
import * as THREE from '../../../vendor/three.module.js';
import { Model } from '../model.js';
import { Animator } from '../anim.js';
import { monDef } from './world.js';
import { T } from '../../px/game/ui.js';
import { mx, clamp01, easeOut, boing } from '../../px/game/uikit/theme.js';
import { rr, circle, vgrad } from '../../px/game/uikit/gfx.js';
import { frame, ball, sparkle, tri } from '../../px/game/uikit/frame.js';
import { roundButton } from '../../px/game/uikit/widgets.js';
import { SPECIES, elemsOf } from '../../data/species.js';
import { ELEMENTS } from '../../data/elements.js';

// species that have a 3D model (src/vx/mons)
const MODELS = new Set(('abbeyhorn armagreddon barkorious bearbreak beatlet blowhale bubblion cabbunny chilichick creepetal demonaconda doomsdrake dreadrake dynacoon everpunch '
  + 'fluorescape foopod gradcub grenaday hawkabunga hellcoon jungeon kanizumo kappachi kissmera kissmet kohlossus lemmo metalfang mopzart moshbull paradove pepperhorn pidgun '
  + 'piledrilla plastree polobruin purrcussion rainblin roygbot snoozaque spaceshell starstrut strawbaa studrat takaptain talonaka tartanic thrashark thundersabre trashcoon walrusk '
  + 'weirdfin wheezowl woodbub wyvillain yeezilla zapanda zapkit').split(' '));
export const ELEM_ICON = { pyro: 'flame', hydro: 'drop', bio: 'leaf', volto: 'bolt', geo: 'shield', echo: 'music', cryo: 'drop', aero: 'cloud', ecto: 'eye', ferro: 'gear', astro: 'star', nucleo: 'bolt', draco: 'flame' };
export function dexList() { return Object.keys(SPECIES).filter((id) => MODELS.has(id)); }
export const hasModel = (id) => MODELS.has(id);
export function elemColor(id) { const sp = SPECIES[id] || {}, el = sp.elem ? elemsOf(sp)[0] : null; return { el, color: (ELEMENTS[el] && ELEMENTS[el].color) || T.cyan }; }

// ------------------------------------------------------------------ the live model viewer
const _v4 = new THREE.Vector4(), _s4 = new THREE.Vector4(), _c = new THREE.Color();
export class MonViewer {
  constructor(app) {
    this.app = app; this.want = null; this.id = null; this.model = null; this.anim = null; this.yaw = 0.5; this.t = 0; this.trick = 0;
    const sc = this.scene = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xfff4e8, 0x6a6aa0, 1.35));
    const key = new THREE.DirectionalLight(0xfff0dc, 2.4); key.position.set(-2, 4, 4); sc.add(key);
    const rim = new THREE.DirectionalLight(0x9ad8ff, 1.5); rim.position.set(3, 2, -3); sc.add(rim);
    // a candy pedestal
    const ped = this.ped = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.08, 0.16, 40), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
    top.position.y = -0.08; ped.add(top);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.14, 0.12, 40), new THREE.MeshStandardMaterial({ color: 0xff4a5e, roughness: 0.45 }));
    band.position.y = -0.2; ped.add(band);
    sc.add(ped);
    this.cam = new THREE.PerspectiveCamera(24, 1, 0.05, 200);
    this.shadowMat = new THREE.MeshBasicMaterial({ color: 0x1c1838 });
  }
  async load(id) {
    if (this.want === id) return;
    this.want = id;
    let def = null; try { def = await monDef(id); } catch (e) { def = null; }
    if (this.want !== id || !def) return;
    if (this.model) { this.scene.remove(this.model.group); if (this.model.dispose) this.model.dispose(); }
    const m = new Model(def); if (m.drip) m.drip(1, 0);
    this.anim = m.animator ? m.animator() : new Animator(m);
    if (this.anim.clips && this.anim.clips.idle) this.anim.play('idle', { fade: 0 });
    for (let i = 0; i < 8; i++) this.anim.update(1 / 30, {});
    m.group.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(m.group), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
    m.group.position.set(-ctr.x, -box.min.y, -ctr.z);
    const holder = new THREE.Group(); holder.add(m.group); this.scene.add(holder);
    if (this.holder) this.scene.remove(this.holder);
    this.holder = holder; this.model = m; this.id = id; this.size = size; this.pop = 0; this.t = 0;
    const R = Math.max(size.x, size.z) * 0.62 + 0.15; this.ped.scale.set(R, 1, R);
  }
  play(clip) {
    if (!this.anim || !this.anim.clips) return;
    const list = [clip, 'win', 'dance', 'cry', 'attack', 'hop'].filter((c) => c && this.anim.clips[c]);
    if (list.length) { this.anim.play(list[0], { restart: true, fade: 0.1 }); this.trick = 1.6; }
  }
  // render into the stage canvas' top-left corner, then copy into the UI at (x, y, w, h) — returns false if not ready
  draw(ui, x, y, w, h, dt, o = {}) {
    const st = this.app && this.app.stage; if (!st || !st.r || !this.model) return false;
    const r = st.r, cv = r.domElement; if (!cv || !cv.width) return false;
    this.t += dt; this.pop += dt;
    if (this.trick > 0) { this.trick -= dt; if (this.trick <= 0 && this.anim.clips.idle) this.anim.play('idle', { fade: 0.25 }); }
    this.anim.update(dt, {});
    this.yaw += dt * (o.spin ?? 0.5);
    const s = 0.2 + 0.8 * boing(this.pop * 1.4);
    this.holder.scale.setScalar(Math.max(0.05, s)); this.holder.rotation.y = this.yaw;
    const pw = Math.max(8, Math.min(cv.width, Math.round(w * ui.kx))), ph = Math.max(8, Math.min(cv.height, Math.round(h * ui.ky)));
    const H = this.size.y, Wd = Math.max(this.size.x, this.size.z), fov = 24, aspect = pw / ph;
    const fitH = Math.max(H * 1.25, (Wd * 1.35) / aspect) * 0.5, dist = fitH / Math.tan((fov / 2) * Math.PI / 180) + Wd * 0.4;
    const p = 12 * Math.PI / 180;
    this.cam.fov = fov; this.cam.aspect = aspect; this.cam.updateProjectionMatrix();
    this.cam.position.set(0, H * 0.5 + Math.sin(p) * dist, Math.cos(p) * dist); this.cam.lookAt(0, H * 0.48, 0);
    this.scene.overrideMaterial = o.silhouette ? this.shadowMat : null;
    this.ped.visible = !o.silhouette;
    // render
    r.getViewport(_v4); r.getScissor(_s4); const scT = r.getScissorTest(), cc = r.getClearColor(_c).getHex(), ca = r.getClearAlpha(), prevRT = r.getRenderTarget(), ac = r.autoClear;
    r.setRenderTarget(null);
    const vy = cv.height - ph;
    r.setViewport(0, vy, pw, ph); r.setScissor(0, vy, pw, ph); r.setScissorTest(true);
    r.setClearColor(o.bg ?? 0xcfeaff, 1); r.autoClear = false; r.clear(true, true, false);
    try { r.render(this.scene, this.cam); } finally {
      r.setScissorTest(scT); r.setScissor(_s4); r.setViewport(_v4); r.setClearColor(cc, ca); r.setRenderTarget(prevRT); r.autoClear = ac;
    }
    const g = ui.g, sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = true;
    g.drawImage(cv, 0, 0, pw, ph, x, y, w, h);
    g.imageSmoothingEnabled = sm;
    return true;
  }
  dispose() { if (this.model && this.model.dispose) this.model.dispose(); this.model = null; this.want = null; }
}

// ------------------------------------------------------------------ the book (drawn inside the phone screen)
export class DexBook {
  constructor(app) { this.app = app; this.sel = 0; this.scroll = 0; this.scrollT = 0; this.selT = 0; this.viewer = null; this.list = dexList(); }
  status(id) {
    const st = this.app.state || {}, dex = st.dex || { seen: {}, caught: {} };
    const own = (st.party || []).some((m) => m.species === id) || (st.box || []).some((m) => m.species === id);
    return own || dex.caught[id] ? 2 : dex.seen[id] ? 1 : 0;
  }
  select(i) { i = Math.max(0, Math.min(this.list.length - 1, i)); if (i !== this.sel) { this.sel = i; this.selT = 0; const ui = this.app.ui; if (ui) ui.click('ui_tap', { vol: 0.4, pitch: 1.3 }); } }
  draw(ui, x, y, w, h, dt, live) {
    const L = this.list, n = L.length, g = ui.g; this.selT += dt;
    const narrow = w < 300, gw = narrow ? w : Math.round(w * 0.44), cell = 22, cols = Math.max(3, Math.floor((gw - 8) / cell)), rows = Math.ceil(n / cols);
    const pageX = narrow ? x : x + gw + 6, pageW = narrow ? w : w - gw - 6;
    const gridH = narrow ? Math.round(h * 0.38) : h;
    // input: arrows move through the grid
    if (live) {
      if (ui.key('ArrowRight') || ui.key('d')) this.select(this.sel + 1);
      if (ui.key('ArrowLeft') || ui.key('a')) this.select(this.sel - 1);
      if (ui.key('ArrowDown') || ui.key('s')) this.select(this.sel + cols);
      if (ui.key('ArrowUp') || ui.key('w')) this.select(this.sel - cols);
    }
    // keep the selection in view; drag / wheel-free scroll by tapping near the edges
    const visRows = Math.max(1, Math.floor((gridH - 6) / cell)), selRow = Math.floor(this.sel / cols);
    if (selRow < this.scrollT) this.scrollT = selRow; if (selRow >= this.scrollT + visRows) this.scrollT = selRow - visRows + 1;
    this.scrollT = Math.max(0, Math.min(Math.max(0, rows - visRows), this.scrollT));
    this.scroll += (this.scrollT - this.scroll) * Math.min(1, dt * 12);
    // ---- the medal grid
    frame(ui, x, y, gw, gridH, { fill: T.screenL, r: 7, thin: true, shadow: false });
    const gx0 = x + (gw - cols * cell) / 2 + cell / 2;
    ui.clip(x + 2, y + 2, gw - 4, gridH - 4, () => {
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / cols), col = i % cols, cx = gx0 + col * cell, cy = y + 4 + cell / 2 + (row - this.scroll) * cell;
        if (cy < y - cell || cy > y + gridH + cell) continue;
        const id = L[i], stt = this.status(id), on = i === this.sel, { color } = elemColor(id);
        const over = live && ui.inside(cx - cell / 2, cy - cell / 2, cell, cell) && ui.inside(x, y, gw, gridH);
        if (over && ui.ptr.released) { ui.ptr.released = false; this.select(i); }
        const bump = on ? 1 + Math.exp(-6 * this.selT) * Math.sin(this.selT * 22) * 0.15 : 1, r = (on ? 8.5 : 7.5) * bump;
        if (on) { ui.fill('rgba(255,255,255,0.9)'); circle(g, cx, cy, r + 2.6); g.fill(); }
        ball(ui.s, cx - 0.5, cy - 0.5, r, stt ? color : '#4a4f7a');
        if (stt) ui.text(SPECIES[id].name[0], cx, cy - 3.6, '#ffffff', { align: 'center', bold: true, outline: mx(color, T.ink, 0.6) });
        else ui.text('?', cx, cy - 3.6, '#9aa0d0', { align: 'center', bold: true });
        if (stt === 2) { ball(ui.s, cx + r - 2, cy - r + 2, 2.8, T.amber); }
      }
    });
    if (rows > visRows) { const bh = Math.max(10, (gridH - 8) * (visRows / rows)), by = y + 4 + (gridH - 8 - bh) * (this.scroll / Math.max(1, rows - visRows)); ui.rrect(x + gw - 4.5, by, 2.5, bh, 'rgba(255,255,255,0.55)', 1.2); }
    // ---- the page
    const py = narrow ? y + gridH + 5 : y, ph = narrow ? h - gridH - 5 : h, id = L[this.sel];
    if (!id) return;
    const sp = SPECIES[id], stt = this.status(id), { el, color } = elemColor(id);
    frame(ui, pageX, py, pageW, ph, { paper: '#ffffff', r: 9, shadowA: 0.3 });
    const num = 'No.' + String(this.sel + 1).padStart(3, '0');
    ui.text(num, pageX + 9, py + 7, T.paperDim, { mini: true, bold: true });
    ui.text(stt ? sp.name : '???', pageX + 9, py + 14, T.paperText, { bold: true, scale: 1.25 });
    if (stt && el) { ball(ui.s, pageX + pageW - 15, py + 14, 8, color); ui.bigIcon(ELEM_ICON[el] || 'star', pageX + pageW - 21, py + 8, null, { shadow: false }); }
    // the live model window
    const vx = pageX + 8, vy = py + 30, vw = pageW - 16, vh = Math.max(40, ph - 30 - (stt ? 34 : 22));
    if (!this.viewer) this.viewer = new MonViewer(this.app);
    this.viewer.load(id);
    ui.fill(T.ink); rr(g, vx - 1.4, vy - 1.4, vw + 2.8, vh + 2.8, 8.4); g.fill();
    let shown = false;
    ui.clip(vx, vy, vw, vh, () => {
      g.fillStyle = vgrad(g, vy, vy + vh, ['#e6f6ff', '#cfeaff']); ui._fs = null; g.fillRect(vx, vy, vw, vh);
      shown = this.viewer.id === id && this.viewer.draw(ui, vx, vy, vw, vh, dt, { silhouette: !stt, bg: 0xcfeaff });
      if (!shown) ui.emblem(ELEM_ICON[el] || 'star', vx + vw / 2, vy + vh / 2, 4);
      // sunburst corners + a shine
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(vx + vw * 0.25, vy + 6, vw * 0.3, 4, -0.1, 0, Math.PI * 2); g.fill();
    }, 7);
    if (live && ui.inside(vx, vy, vw, vh)) { if (ui.ptr.pressed) ui.click('bubble', { vol: 0.6 }); if (ui.ptr.released) { ui.ptr.released = false; if (stt) this.viewer.play(); } }
    if (this.viewer.trick > 1.2) sparkle(ui.s, vx + vw * 0.75, vy + 8, T.amber, (this.viewer.trick - 1.2) * 2.5);
    // status chips + one line about it
    const cy = vy + vh + 5;
    const chip = (cx, label, col) => { const cw = ui.tw(label, { mini: true, bold: true }) + 10; ui.fill(T.ink); rr(g, cx - 0.8, cy - 0.8, cw + 1.6, 10.6, 5.3); g.fill(); ui.fill(col); rr(g, cx, cy, cw, 9, 4.5); g.fill(); ui.text(label, cx + 5, cy + 2.2, '#ffffff', { mini: true, bold: true }); return cw + 4; };
    let cx = vx; cx += chip(cx, stt === 2 ? 'CAUGHT' : stt ? 'SEEN' : 'UNKNOWN', stt === 2 ? T.green : stt ? T.blue : '#8a8eaa');
    if (stt && el && ELEMENTS[el]) cx += chip(cx, ELEMENTS[el].name.toUpperCase(), color);
    if (stt && sp.family) chip(cx, String(sp.family).toUpperCase(), T.violet);
    if (stt && sp.role) { const line = ui.wrap(sp.role, vw, { mini: true })[0]; ui.text(line, vx, cy + 13, T.paperDim, { mini: true, bold: true }); }
    // flip pages
    if (!narrow) {
      const b1 = roundButton(ui, pageX + pageW - 30, py + ph - 2, 6, 'left', { color: T.blue, modal: true }), b2 = roundButton(ui, pageX + pageW - 12, py + ph - 2, 6, 'right', { color: T.blue, modal: true });
      if (b1.clicked) this.select(this.sel - 1); if (b2.clicked) this.select(this.sel + 1);
    }
    void tri; void clamp01; void easeOut;
  }
  release() { if (this.viewer) { this.viewer.dispose(); this.viewer = null; } }
}
