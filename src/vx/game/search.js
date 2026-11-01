// The TokoLens: a first-person search mode. Walking the city, the HUD's lens button lights up next to
// anything worth a closer look — parked cars, bushes and trees, vending machines, bins, crates, benches and
// the windows of the houses. Press it (or R) and the camera drops into your eyes: drag (or the arrows) to
// look around, move the lens over things and tap. The lens ring hums faster as it nears something hidden:
// a Tokonmon peeking out from under a car, a lost item in a bush, coins behind a vending machine.
// Each place can be searched once a day.
// The same first-person camera is used for the "look closer" moments indoors: open a fridge or step up
// to a shelf or cooler and you see it from your own eyes, with the snacks as little 3D things to tap.
// Spots come from the city as built (its instanced props and buildings), so no city file is touched.
import * as THREE from '../../../vendor/three.module.js';
import { T } from '../../px/game/ui.js';
import { mx, clamp01, easeOut, boing } from '../../px/game/uikit/theme.js';
import { fillDisc, discRows } from '../../px/game/uikit/gfx.js';
import { frame, ball, sparkle, tri, woodRing, ringPx } from '../../px/game/uikit/frame.js';
import { roundButton } from '../../px/game/uikit/widgets.js';
import * as St from '../../game/state.js';
import { SPECIES } from '../../data/species.js';
import { ITEMS } from '../../data/items.js';
import { hasModel } from './dex.js';
import { itemIcon } from './phone.js';

const D2R = Math.PI / 180;
// what each kind of prop can hide, in the prop's own frame (x along its length, y up, z across)
const KINDS = {
  car: { label: 'under the car', r: 3.6, hides: [[0, 0.22, 0, 'under the car'], [1.9, 0.55, 0, 'behind the bumper']], mons: ['studrat', 'trashcoon', 'zapkit', 'kanizumo', 'beatlet'] },
  bush: { label: 'in the bush', r: 2.4, hides: [[0, 0.55, 0, 'in the bush']], mons: ['cabbunny', 'woodbub', 'lemmo', 'beatlet', 'creepetal'] },
  treeB: { label: 'in the tree', r: 3, hides: [[0, 2.9, 0, 'up in the leaves'], [0.35, 0.3, 0.3, 'by the roots']], mons: ['woodbub', 'paradove', 'pidgun', 'plastree'] },
  tree: { label: 'in the tree', r: 3, hides: [[0, 2.9, 0, 'up in the leaves'], [0.35, 0.3, 0.3, 'by the roots']], mons: ['woodbub', 'paradove', 'pidgun', 'plastree'] },
  palm: { label: 'up the palm', r: 3, hides: [[0, 3.6, 0, 'in the fronds']], mons: ['paradove', 'hawkabunga'] },
  vending: { label: 'the vending machine', r: 2.6, hides: [[0, 0.12, 0.42, 'under the machine'], [0.2, 0.85, 0.45, 'in the coin return']], mons: ['zapkit', 'lemmo', 'roygbot'] },
  bin: { label: 'the bin', r: 2.2, hides: [[0, 0.95, 0, 'in the bin']], mons: ['trashcoon', 'studrat', 'foopod'] },
  dumpster: { label: 'the dumpster', r: 2.8, hides: [[0, 1.3, 0, 'in the dumpster'], [0.9, 0.2, 0.6, 'behind it']], mons: ['trashcoon', 'dynacoon', 'studrat'] },
  crate: { label: 'the crates', r: 2.2, hides: [[0, 0.6, 0, 'behind the crate']], mons: ['studrat', 'foopod'] },
  boxes: { label: 'the boxes', r: 2.2, hides: [[0, 0.5, 0, 'in the boxes']], mons: ['studrat', 'foopod', 'cabbunny'] },
  planter: { label: 'the planter', r: 2.2, hides: [[0, 0.75, 0, 'in the flowers']], mons: ['cabbunny', 'creepetal', 'woodbub'] },
  mailbox: { label: 'the mailbox', r: 2, hides: [[0, 1.05, 0, 'in the mailbox']], mons: ['paradove', 'zapkit'] },
  bench: { label: 'the bench', r: 2.4, hides: [[0, 0.18, 0, 'under the bench']], mons: ['pidgun', 'cabbunny', 'snoozaque'] },
  window: { label: 'the window', r: 3.4, hides: [], mons: ['wheezowl', 'paradove', 'pidgun', 'snoozaque', 'mopzart'] },
};
const FINDS = [['ramune', 5], ['cabbage', 4], ['quartz', 3], ['takoyaki', 2], ['ice_cream', 2], ['lemon_tart', 2], ['amethyst', 1], ['star_candy', 0.4], ['$', 4]];
// first-person shelves: what's on them
const SHELF = { fridge: ['ramune', 'matcha', 'ice_cream', 'lemon_tart'], cooler: ['ramune', 'ramune', 'matcha', 'ice_cream'], shelf: ['takoyaki', 'revive_onigiri', 'cabbage', 'lemon_tart', 'star_candy', 'ramune'] };
const PICK_RE = /fridge|cooler|freezer|shel|snack|drinks?\b|vending/i;

function rnd(seed) { let h = 2166136261; for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
const _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2();

export class SearchMode {
  constructor(app) { this.app = app; this.spots = null; this.cityRef = null; this.near = null; this.scanT = 0; this.S = null; this.wrapped = new WeakSet(); }
  get active() { return !!this.S; }
  // ------------------------------------------------------------------ spots (built once per city)
  ensure() {
    const w = this.app.world;
    if (!w || !w.city || !w.ready) { this.spots = null; this.cityRef = null; return null; }
    if (this.cityRef === w.city) return this.spots;
    this.cityRef = w.city; this.spots = [];
    try { this.collect(w); } catch (e) { console.warn('lens spots', e); }
    try { this.wrapPicks(w); } catch (e) { console.warn('lens picks', e); }
    return this.spots;
  }
  collect(w) {
    const c = w.city.c, seen = new Set();
    const props = c.root && c.root.getObjectByName('props');
    if (props) props.traverse((im) => {
      const kind = im.userData && im.userData.prop; if (!im.isInstancedMesh || !KINDS[kind]) return;
      for (let i = 0; i < im.count; i++) {
        im.getMatrixAt(i, _m); _v.setFromMatrixPosition(_m);
        const key = kind + ':' + _v.x.toFixed(1) + ',' + _v.z.toFixed(1); if (seen.has(key)) continue; seen.add(key);
        const e = _m.elements, yaw = Math.atan2(e[8], e[0]), K = KINDS[kind];
        this.spots.push({ id: key, kind, x: _v.x, y: _v.y, z: _v.z, yaw, r: K.r, hides: K.hides.map(([hx, hy, hz, label]) => ({ x: _v.x + Math.cos(yaw) * hx + Math.sin(yaw) * hz, y: _v.y + hy, z: _v.z - Math.sin(yaw) * hx + Math.cos(yaw) * hz, label })) });
      }
    });
    // windows: the upper storey of each building, on every side you can stand in front of
    for (const B of c.buildings || []) {
      if (!B || !(B.floors >= 2 || B.H >= 5)) continue;
      const sides = [[B.x + B.w / 2, B.z + B.d, 0, 1], [B.x + B.w / 2, B.z, 0, -1], [B.x, B.z + B.d / 2, -1, 0], [B.x + B.w, B.z + B.d / 2, 1, 0]];
      for (const [fx, fz, nx, nz] of sides) {
        const sx = fx + nx * 1.8, sz = fz + nz * 1.8;
        if (!w.nav.ok(sx, sz, 0)) continue;
        this.spots.push({ id: 'win:' + fx.toFixed(1) + ',' + fz.toFixed(1), kind: 'window', x: sx, y: 0, z: sz, r: 2.6, hides: [{ x: fx + nx * 0.05, y: 4.4, z: fz + nz * 0.05, label: 'in the window' }] });
      }
    }
  }
  // fridges, coolers and shelves open in first person (their own act still runs; the snacks come after)
  wrapPicks(w) {
    for (const it of w.city.c.inter || []) {
      if (this.wrapped.has(it) || it.npc) continue;
      if (!(it.icon === 'fridge' || PICK_RE.test(it.label || ''))) continue;
      const orig = it.act; this.wrapped.add(it);
      it.act = async (app, x) => this.lookCloser(x || it, orig);
    }
  }
  log() { const st = this.app.state, f = st.flags || (st.flags = {}), day = (st.time && st.time.day) || 1; if (!f.lens || f.lens.day !== day) f.lens = { day, done: {} }; return f.lens; }
  // ------------------------------------------------------------------ per frame while roaming (from the HUD)
  scan(dt) {
    const spots = this.ensure(), w = this.app.world, p = w && w.player;
    if (!spots || !p || !w.city || w.city.L !== 0 || w.city.inside >= 0) { this.near = null; return null; }
    this.scanT -= dt; if (this.scanT > 0) return this.near; this.scanT = 0.2;
    const q = p.g.position, L = this.log(); let best = null, bd = 1e9;
    for (const s of spots) {
      const d = Math.hypot(s.x - q.x, s.z - q.z); if (d > s.r || d >= bd) continue;
      if (L.done[s.id] && L.done[s.id].length >= this.hidesOf(s).length) continue;
      bd = d; best = s;
    }
    this.near = best; return best;
  }
  hidesOf(s) {
    if (s.kind !== 'window') return s.hides;
    return s.hides;
  }
  // ------------------------------------------------------------------ the first-person camera
  // the world camera orbits target at dist from yaw / pitch (°): for first person the camera sits at the eye
  view() {
    const S = this.S, cy = Math.cos(S.pitch * D2R), dir = _v.set(Math.sin(S.yaw * D2R) * cy, Math.sin(S.pitch * D2R), Math.cos(S.yaw * D2R) * cy);
    const D = S.focus;
    return { target: new THREE.Vector3(S.eye.x + dir.x * D, S.eye.y + dir.y * D, S.eye.z + dir.z * D), dist: D, yaw: Math.atan2(-dir.x, -dir.z) / D2R, pitch: Math.asin(Math.max(-1, Math.min(1, -dir.y))) / D2R };
  }
  async firstPerson(at, focusPts, body) {
    const app = this.app, w = app.world, p = w.player, cin = app.cinema, st = app.stage;
    const eye = p.g.position.clone(); eye.y += 1.48;
    const c = new THREE.Vector3(); for (const h of focusPts) c.add(_v.set(h.x, h.y, h.z)); c.multiplyScalar(1 / Math.max(1, focusPts.length));
    // step back a little from what we look at, so it fills the lens
    const flat = Math.hypot(c.x - eye.x, c.z - eye.z);
    if (flat < 1.1) { const k = (1.1 - flat) / Math.max(0.01, flat); eye.x -= (c.x - eye.x) * k; eye.z -= (c.z - eye.z) * k; }
    const d = c.clone().sub(eye), dist = Math.max(0.6, d.length());
    const S = this.S = { eye, focus: dist, yaw: Math.atan2(d.x, d.z) / D2R, pitch: Math.asin(d.y / dist) / D2R, t: 0, at, found: [], fx: [], mons: [], items: [], lx: app.ui.w / 2, ly: app.ui.h / 2, beepT: 0, msg: null };
    S.yaw0 = S.yaw; S.pitch0 = S.pitch;
    if (p.path) p.path = null; if (w.city) { w.city.vx = w.city.vz = w.city.spd = 0; }
    p.faceTo(c.x, c.z);
    const hidden = [p, w.partner].filter(Boolean); const vis = hidden.map((a) => a.g.visible);
    const near0 = st.cam.near; st.cam.near = 0.08; st.cam.updateProjectionMatrix();
    if (app.audio.sfx) app.audio.sfx('whoosh', { vol: 0.6, pitch: 1.3 });
    let draw = null;
    try {
      if (cin) { await cin.begin({ bars: false, fov: 60, hush: false }); cin.move(() => this.view(), { dur: 0.75 }); }
      await app.wait(380);
      hidden.forEach((a) => { a.g.visible = false; });
      draw = (ui, dt) => this.drawUI(ui, dt);
      app.overlays.push(draw);
      await body(S);
    } finally {
      if (draw) app.overlays.splice(app.overlays.indexOf(draw), 1);
      for (const m of S.mons) w.remove(m.id);
      for (const it of S.items) st.scene.remove(it.g);
      hidden.forEach((a, i) => { a.g.visible = vis[i]; });
      st.cam.near = near0; st.cam.updateProjectionMatrix();
      if (app.audio.sfx) app.audio.sfx('whoosh', { vol: 0.5, pitch: 0.9 });
      if (cin) await cin.end({ dur: 0.7 });
      this.S = null;
    }
  }
  // ------------------------------------------------------------------ search a spot
  enter(spot = this.near) {
    const app = this.app; if (!spot || this.S || app.story.busy) return;
    this.near = null;
    const hides = this.hidesOf(spot), L = this.log(), done = L.done[spot.id] || (L.done[spot.id] = []);
    const day = (app.state.time && app.state.time.day) || 1, r = rnd(spot.id + ':' + day), K = KINDS[spot.kind] || KINDS.bush;
    const pool = K.mons.filter((id) => SPECIES[id] && hasModel(id));
    // what's hidden where: the first hide always holds something
    const content = hides.map((h, i) => {
      if (done.includes(i)) return { kind: 'gone' };
      const roll = r();
      if (pool.length && roll < 0.38) return { kind: 'mon', id: pool[Math.floor(r() * pool.length)] };
      if (roll < 0.82 || i === 0) { const tot = FINDS.reduce((a, f) => a + f[1], 0); let x = r() * tot; for (const [id, wgt] of FINDS) { x -= wgt; if (x <= 0) return id === '$' ? { kind: 'money', n: 40 + Math.floor(r() * 9) * 20 } : { kind: 'item', id }; } }
      return { kind: 'none' };
    });
    app.story.run(async () => {
      let battle = null;
      await this.firstPerson(spot, hides, async (S) => {
        S.mode = 'lens'; S.hides = hides.map((h, i) => ({ ...h, i, c: content[i], open: content[i].kind === 'gone' }));
        S.label = K.label;
        await new Promise((res) => { S.exit = res; });
        battle = S.battle || null;
      });
      if (battle) {
        const sp = SPECIES[battle], lv = Math.max(3, Math.min(12, ((app.state.party || [])[0] || { level: 5 }).level + Math.floor(Math.random() * 3) - 1));
        await app.startBattle({ foe: { name: 'Wild ' + sp.name, team: [[battle, lv]] }, wild: true, title: 'WILD TOKONMON!', subtitle: sp.name });
        await app.fade(0, 400);
      }
    });
  }
  // tap the lens: reveal what's under it
  async reveal(S, h) {
    const app = this.app, w = app.world, L = this.log();
    h.open = true; (L.done[S.at.id] || (L.done[S.at.id] = [])).push(h.i);
    const c = h.c, ui = app.ui, sp = w.project([h.x, h.y, h.z]);
    if (c.kind === 'mon') {
      const sp0 = SPECIES[c.id], yaw = Math.atan2(S.eye.x - h.x, S.eye.z - h.z);
      if (app.audio.sfx) app.audio.sfx('notification', { vol: 0.8 });
      const a = await w.addMon('lens-' + c.id + S.mons.length, c.id, [h.x, h.z, yaw, h.y], {});
      a.g.position.y = Math.max(h.y - 0.25, w.ground(h.x, h.z, h.y)); a.g.scale.setScalar(0.01); a.play(a.anim.clips && a.anim.clips.cry ? 'cry' : 'idle', { fade: 0 });
      S.mons.push(a); S.pop = { a, t: 0 };
      S.fx.push({ kind: 'burst', x: sp.x, y: sp.y, t: 0, color: T.amber });
      S.ff = 1; S.found.push(c);
      try { St.seen(app.state, c.id); } catch (e) { /* old saves */ }
      app.save && app.save();
      await app.wait(700);
      const pick = await app.choose(`A wild ${sp0.name} was hiding ${h.label}!`, ['Battle!', 'Let it be']);
      if (pick === 0) { S.battle = c.id; S.exit && S.exit(); return; }
      a.play(a.anim.clips && a.anim.clips.win ? 'win' : 'idle', { restart: true });
      if (app.audio.sfx) app.audio.sfx('bubble', { vol: 0.7 });
      S.shrink = { a, t: 0 };
      app.toast(`${sp0.name} added to your TokoBook`, { icon: 'book', color: T.violet });
    } else if (c.kind === 'item' || c.kind === 'money') {
      if (app.audio.sfx) app.audio.sfx('notification', { vol: 0.7, pitch: 1.2 });
      if (c.kind === 'item') St.addItem(app.state, c.id, 1); else app.state.money = (app.state.money || 0) + c.n;
      S.fx.push({ kind: 'item', icon: c.kind === 'money' ? 'coin' : itemIcon(c.id), x: sp.x, y: sp.y, t: 0, label: c.kind === 'money' ? `+${c.n}` : (ITEMS[c.id] || {}).name });
      S.found.push(c);
      app.toast(c.kind === 'money' ? `Found ${c.n} coins ${h.label}!` : `Found ${(ITEMS[c.id] || { name: c.id }).name}!`, { icon: c.kind === 'money' ? 'coin' : 'bag', color: T.amber });
      app.save && app.save();
    } else {
      S.fx.push({ kind: 'puff', x: sp.x, y: sp.y, t: 0 });
      if (app.audio.sfx) app.audio.sfx('ui_back', { vol: 0.5 });
      S.msg = { text: 'Nothing ' + h.label + '…', t: 0 };
    }
    void ui;
  }
  // ------------------------------------------------------------------ fridges, coolers, shelves
  async lookCloser(it, orig) {
    const app = this.app, kind = /fridge|freezer/i.test(it.label || '') || it.icon === 'fridge' ? 'fridge' : /cooler|drink|vending/i.test(it.label || '') ? 'cooler' : 'shelf';
    const L = this.log(), key = 'pick:' + it.x.toFixed(1) + ',' + it.z.toFixed(1), taken = !!L.done[key];
    const target = { x: it.x, y: (it.y ?? 1.2) - 0.1, z: it.z };
    await this.firstPerson(it, [target], async (S) => {
      S.mode = 'pick'; S.label = it.label;
      if (orig) await orig(app, it);
      if (taken) { await app.say('', 'You already took something from here today.'); return; }
      // the snacks as little 3D things in front of it
      const list = SHELF[kind], dir = new THREE.Vector3(target.x - S.eye.x, 0, target.z - S.eye.z).normalize(), right = new THREE.Vector3(dir.z, 0, -dir.x);
      const base = new THREE.Vector3(target.x, target.y, target.z).addScaledVector(dir, -Math.min(0.55, S.focus * 0.4));
      const cols = Math.min(3, list.length), rows = Math.ceil(list.length / cols);
      list.forEach((id, i) => {
        const c0 = i % cols, r0 = Math.floor(i / cols), g = itemMesh(id);
        g.position.copy(base).addScaledVector(right, (c0 - (cols - 1) / 2) * 0.26); g.position.y += (rows - 1) * 0.14 - r0 * 0.28;
        g.lookAt(S.eye.x, g.position.y, S.eye.z);
        g.scale.setScalar(0.01); app.stage.scene.add(g);
        S.items.push({ id, g, home: g.position.clone(), t: -i * 0.08, price: kind === 'shelf' ? (ITEMS[id] || {}).price || 0 : 0 });
      });
      S.pickHint = kind === 'shelf' ? 'Tap one to buy it' : 'Tap one to take it';
      await new Promise((res) => { S.exit = res; });
      if (S.took) L.done[key] = [0];
    });
  }
  async takeItem(S, it) {
    const app = this.app;
    if (it.price && (app.state.money || 0) < it.price) { if (app.audio.sfx) app.audio.sfx('ui_back'); S.msg = { text: 'Not enough coins…', t: 0 }; return; }
    if (it.price) app.state.money -= it.price;
    S.took = it; it.fly = 0;
    St.addItem(app.state, it.id, 1); app.save && app.save();
    if (app.audio.sfx) app.audio.sfx('notification', { vol: 0.7, pitch: 1.2 });
    app.toast(`${it.price ? 'Bought' : 'Took'} ${(ITEMS[it.id] || { name: it.id }).name}!`, { icon: 'bag', color: T.amber });
    await app.wait(900);
    S.exit && S.exit();
  }
  // ------------------------------------------------------------------ the lens UI (an app overlay while searching)
  drawUI(ui, dt) {
    const S = this.S; if (!S) return;
    const app = this.app, w = app.world, g = ui.g, W = ui.w, H = ui.h; S.t += dt;
    const busy = !!ui.dialog;
    // look around: drag, or the arrows / WASD
    const P = ui.ptr, k = app.keysDown || {};
    if (!busy) {
      if (P.down) { if (S.drag == null) S.drag = { x: P.x, y: P.y, moved: 0 }; else { const dx = P.x - S.drag.x, dy = P.y - S.drag.y; S.yaw -= dx * 0.35; S.pitch -= dy * 0.3; S.drag.moved += Math.abs(dx) + Math.abs(dy); S.drag.x = P.x; S.drag.y = P.y; } }
      const kx = (k.ArrowLeft || k.a ? 1 : 0) - (k.ArrowRight || k.d ? 1 : 0), ky = (k.ArrowUp || k.w ? 1 : 0) - (k.ArrowDown || k.s ? 1 : 0);
      S.yaw += kx * 70 * dt; S.pitch += ky * 55 * dt;
      S.yaw = S.yaw0 + Math.max(-75, Math.min(75, ((S.yaw - S.yaw0 + 540) % 360) - 180)); S.pitch = Math.max(-60, Math.min(45, S.pitch));
      if (P.x >= 0 && (P.down || S.mouse)) { S.lx += (P.x - S.lx) * Math.min(1, dt * 18); S.ly += (P.y - S.ly) * Math.min(1, dt * 18); }
      if (kx || ky) { S.lx += (W / 2 - S.lx) * Math.min(1, dt * 6); S.ly += (H / 2 - S.ly) * Math.min(1, dt * 6); }
      if (P.x >= 0 && !P.down && (P.x !== S.px || P.y !== S.py) && S.t > 0.4) S.mouse = true;
      S.px = P.x; S.py = P.y;
    }
    // pop / shrink the revealed Tokonmon
    if (S.pop) { S.pop.t += dt; S.pop.a.g.scale.setScalar(Math.max(0.01, boing(S.pop.t * 1.3))); if (S.pop.t > 1.5) S.pop = null; }
    if (S.shrink) { S.shrink.t += dt; const k2 = Math.max(0.01, 1 - easeOut(S.shrink.t * 1.2)); S.shrink.a.g.scale.setScalar(k2); S.shrink.a.g.position.y += dt * 0.8; if (k2 <= 0.02) { w.remove(S.shrink.a.id); S.mons = S.mons.filter((m) => m !== S.shrink.a); S.shrink = null; } }
    // 3D snacks: bob, spin, fly to you
    for (const it of S.items) {
      it.t += dt;
      if (it.fly != null) { it.fly += dt; const f = easeOut(it.fly * 1.6); it.g.position.lerpVectors(it.home, S.eye, f * 0.85); it.g.scale.setScalar(Math.max(0.01, 1 - f)); continue; }
      it.g.scale.setScalar(Math.max(0.01, boing(it.t * 1.5)) * (it.hover ? 1.18 : 1));
      it.g.position.y = it.home.y + Math.sin(S.t * 2.4 + it.home.x * 9) * 0.015; it.g.rotation.y += dt * (it.hover ? 2.2 : 0.4);
    }
    const lens = S.mode === 'lens', R = Math.round(Math.min(W, H) * 0.15), r0 = Math.round;
    // the lens: the world dims outside a round window around the reticle (pixel rows, no soft edges)
    if (lens) {
      g.globalAlpha = 0.55; ui.rect(0, 0, W, S.ly - R - 4, T.deep); ui.rect(0, S.ly + R + 4, W, H - S.ly - R - 4, T.deep); ui.rect(0, S.ly - R - 4, S.lx - R - 4, 2 * R + 8, T.deep); ui.rect(S.lx + R + 4, S.ly - R - 4, W - S.lx - R - 4, 2 * R + 8, T.deep); g.globalAlpha = 1; void discRows;
    } else { g.globalAlpha = 0.3; ui.fill(T.deep); for (let y = 0; y < H; y += 1) { const e = Math.abs(y / H - 0.5) * 2, n = r0(Math.max(0, e - 0.5) * W * 0.25); if (n > 0) { g.fillRect(0, y, n, 1); g.fillRect(W - n, y, n, 1); } } g.globalAlpha = 1; }
    // signal: how close the lens is to something still hidden
    let sig = 0, hit = null;
    if (lens) for (const h of S.hides) { if (h.open) continue; const s = w.project([h.x, h.y, h.z]); if (!s.vis) continue; const d = Math.hypot(s.x - S.lx, s.y - S.ly), v = clamp01(1 - d / (R * 2.6)); if (v > sig) { sig = v; hit = d < R * 0.9 ? h : null; } }
    void hit;
    if (lens) {
      S.beepT -= dt;
      if (sig > 0.05 && S.beepT <= 0 && !busy) { S.beepT = 0.95 - sig * 0.8; if (app.audio.sfx) app.audio.sfx('ui_tap', { vol: 0.25 + sig * 0.4, pitch: 1.4 + sig * 0.8 }); S.ping = 0; }
      S.ping = (S.ping ?? 9) + dt;
      const col = sig > 0.75 ? T.amber : sig > 0.3 ? T.cyan : T.cream, spin = S.t * (0.6 + sig * 4), wob = sig > 0.75 ? r0(Math.sin(S.t * 40)) : 0;
      const cx = r0(S.lx) + wob, cy = r0(S.ly);
      woodRing(ui.s, cx, cy, R, { th: 4, color: sig > 0.75 ? T.brass : T.copper });
      // a signal light running round the square viewfinder + tick marks along its edges
      { const per = 8 * R, p0 = ((spin * R * 2) % per + per) % per; for (let q = 0; q < 4; q++) { const p = (p0 + q * 2) % per, side = Math.floor(p / (2 * R)), u = p % (2 * R), lx = side === 0 ? cx - R + u : side === 1 ? cx + R + 2 : side === 2 ? cx + R - u : cx - R - 3, ly = side === 0 ? cy - R - 3 : side === 1 ? cy - R + u : side === 2 ? cy + R + 2 : cy + R - u; ui.rect(lx, ly, 1.4, 1.4, col); } }
      for (let i = -2; i <= 2; i++) { ui.rect(cx + i * R * 0.4, cy - R + 1, 0.7, 2, T.cream); ui.rect(cx + i * R * 0.4, cy + R - 3, 0.7, 2, T.cream); ui.rect(cx - R + 1, cy + i * R * 0.4, 2, 0.7, T.cream); ui.rect(cx + R - 3, cy + i * R * 0.4, 2, 0.7, T.cream); }
      if (S.ping < 0.5) { ringPx(ui.s, cx, cy, R + 6 + r0(S.ping * 20), col, 1 - S.ping * 2); }
      // a glint on the glass
      ui.rect(cx - r0(R * 0.5), cy - r0(R * 0.6), r0(R * 0.3), 1, '#ffffff'); ui.rect(cx - r0(R * 0.6), cy - r0(R * 0.5), 1, r0(R * 0.25), '#ffffff');
      // cross-hair
      ui.rect(cx - 3, cy, 7, 1, col); ui.rect(cx, cy - 3, 1, 7, col);
      const bw = r0(R * 1.2), by = cy + R + 10; ui.bar(cx - r0(bw / 2), by, bw, 4, sig, { color: sig > 0.75 ? 'yellow' : 'cyan', id: 'lens-sig', trail: false, shine: false });
      if (sig > 0.75) ui.text('!', cx, cy - R - 20 - r0(Math.abs(Math.sin(S.t * 10)) * 2), T.amber, { align: 'center', scale: 2, outline: T.ink });
    }
    // tap = search here (a drag only looks around)
    if (!busy && P.released) {
      const tap = !S.drag || S.drag.moved < 6; S.drag = null;
      if (tap && !ui.inside(W - 34, 0, 34, 34)) {
        if (lens && S.t > 0.8 && !S.revealing) { S.lx = P.x; S.ly = P.y; P.released = false; const h = this.hitAt(S, P.x, P.y, R); if (h) { S.revealing = true; this.reveal(S, h).finally(() => { S.revealing = false; }); } else S.fx.push({ kind: 'puff', x: P.x, y: P.y, t: 0 }); }
        else if (!lens) { const it = this.itemAt(S, P.x, P.y); if (it && !S.took) { P.released = false; this.takeItem(S, it); } }
      }
    } else if (!P.down && !P.released) S.drag = null;
    if (!busy && lens && (ui.key('e') || ui.key('Enter') || ui.key(' ')) && S.t > 0.8 && !S.revealing) { const h = this.hitAt(S, S.lx, S.ly, R); if (h) { S.revealing = true; this.reveal(S, h).finally(() => { S.revealing = false; }); } }
    if (!lens && !busy) for (const it of S.items) it.hover = false;
    if (!lens && !busy && P.x >= 0) { const it = this.itemAt(S, P.x, P.y); if (it) it.hover = true; }
    // effects: bursts, flying item icons, puffs
    for (const f of S.fx) {
      f.t += dt;
      if (f.kind === 'burst') { for (let i = 0; i < 10; i++) { const a = i * 0.628 + f.t, rr2 = 6 + easeOut(f.t * 2) * 34; sparkle(ui.s, f.x + Math.cos(a) * rr2, f.y + Math.sin(a) * rr2 * 0.8, i % 2 ? T.amber : '#ffffff', clamp01(1 - f.t)); } }
      else if (f.kind === 'item') { const k2 = easeOut(f.t * 1.4), x = Math.round(f.x + (W / 2 - f.x) * k2), y = Math.round(f.y + (H * 0.38 - f.y) * k2 - Math.sin(k2 * Math.PI) * 30), sz = f.t < 0.25 ? 16 : 32; woodRing(ui.s, x, y, sz === 32 ? 20 : 11, { th: 3, fill: T.cream }); ui.bigIcon(f.icon, x - sz / 2, y - sz / 2, null, { scale: sz / 12 }); if (f.label && f.t > 0.6) ui.text(f.label, x, y + 26, '#ffffff', { align: 'center', bold: true, outline: T.ink }); for (let i = 0; i < 6; i++) sparkle(ui.s, x + Math.cos(i + f.t * 3) * 28, y + Math.sin(i + f.t * 3) * 28, T.amber, clamp01(1.4 - f.t)); }
      else if (f.kind === 'puff') { g.globalAlpha = clamp01(0.8 - f.t * 1.4); for (let i = 0; i < 6; i++) { const a = i * 1.047, rr2 = 4 + f.t * 30, sz = 2 + f.t * 5; ui.rect(f.x + Math.cos(a) * rr2 - sz, f.y + Math.sin(a) * rr2 * 0.7 - sz, sz * 2, sz * 2, T.cream); } g.globalAlpha = 1; }
    }
    S.fx = S.fx.filter((f) => f.t < 2.2);
    // the top bar: the lens badge, what you're looking at, what you found; the exit button
    const title = lens ? 'TOKOLENS' : 'LOOK CLOSER';
    const tw = Math.round(ui.tw(title, { mini: true, bold: true }) + 34);
    frame(ui, 6, 6, tw, 19, { thin: true, r: 2, shadowA: 0.35 });
    ui.bigIcon(lens ? 'lens' : 'eye', 9, 9, null, { shadow: false });
    ui.text(title, 25, 13, T.text, { mini: true, bold: true });
    if (lens) {
      const n = S.hides.length; for (let i = 0; i < n; i++) { const h = S.hides[i]; ball(ui.s, tw + 16 + i * 12, 15, 4, h.open ? (h.c.kind === 'none' ? '#8a7e74' : T.amber) : T.cream); if (h.open && h.c.kind !== 'none') sparkle(ui.s, tw + 16 + i * 12, 15, '#ffffff', 0.4); }
    } else if (S.pickHint && S.items.length && !S.took) ui.text(S.pickHint, tw + 12, 11, '#ffffff', { bold: true, outline: T.ink });
    const exit = roundButton(ui, W - 18, 18, 9, 'close', { color: T.cream, hotkey: 'Escape', modal: false });
    if ((exit.clicked || ui.key('Backspace') || ui.key('r')) && !busy && !S.revealing) { S.exit && S.exit(); }
    // hints until the first find
    if (lens && !S.found.length && S.t < 9 && !busy) {
      const a = clamp01(S.t * 2) * clamp01(9 - S.t), y = H - 26;
      g.save(); g.globalAlpha = a;
      const hint = 'Drag to look  -  tap to search', hw = Math.round(ui.tw(hint) + 34), hx = Math.round(W / 2 - hw / 2);
      frame(ui, hx, y - 2, hw, 20, { thin: true, r: 2 });
      ui.bigIcon('hand', hx + 5, y + 2, null, { shadow: false }); ui.text(hint, hx + 22, y + 4, T.text, {});
      g.restore(); ui._fs = null; ui._font = null;
    }
    if (S.msg) { S.msg.t += dt; const a = clamp01(S.msg.t * 5) * clamp01((1.8 - S.msg.t) * 3); if (a > 0) { g.save(); g.globalAlpha = a; ui.text(S.msg.text, W / 2, H * 0.7 - S.msg.t * 6, '#ffffff', { align: 'center', bold: true, outline: T.ink }); g.restore(); ui._fs = null; ui._font = null; } else if (S.msg.t > 1) S.msg = null; }
    void tri; void mx; void frame;
  }
  hitAt(S, x, y, R) {
    const w = this.app.world; let best = null, bd = R * 1.1;
    for (const h of S.hides) { if (h.open) continue; const s = w.project([h.x, h.y, h.z]); if (!s.vis) continue; const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = h; } }
    return best;
  }
  itemAt(S, x, y) {
    if (!S.items.length) return null;
    const app = this.app; _ndc.set((x / app.vw) * 2 - 1, 1 - (y / app.vh) * 2); _ray.setFromCamera(_ndc, app.stage.cam);
    const hits = _ray.intersectObjects(S.items.filter((i) => i.fly == null).map((i) => i.g), true);
    if (!hits.length) return null;
    let o = hits[0].object; while (o && !S.items.some((i) => i.g === o)) o = o.parent;
    return S.items.find((i) => i.g === o) || null;
  }
}

// ------------------------------------------------------------------ little 3D snacks
const MAT = new Map();
function mat(c, o = {}) { const key = c + JSON.stringify(o); let m = MAT.get(key); if (!m) { m = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.45 }, o)); MAT.set(key, m); } return m; }
export function itemMesh(id) {
  const g = new THREE.Group(), add = (geo, m, y = 0, x = 0, z = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); g.add(me); return me; };
  if (/ramune|soda/.test(id)) { add(new THREE.CylinderGeometry(0.045, 0.05, 0.16, 16), mat('#7fd8ff', { roughness: 0.15, metalness: 0.1 }), 0.08); add(new THREE.CylinderGeometry(0.052, 0.052, 0.04, 16), mat('#ffffff'), 0.09); add(new THREE.CylinderGeometry(0.02, 0.03, 0.05, 12), mat('#2f8cff'), 0.185); }
  else if (/matcha|latte|tea/.test(id)) { add(new THREE.CylinderGeometry(0.05, 0.05, 0.15, 16), mat('#5fdc4a'), 0.075); add(new THREE.CylinderGeometry(0.052, 0.052, 0.035, 16), mat('#fff4d8'), 0.08); add(new THREE.CylinderGeometry(0.025, 0.04, 0.05, 12), mat('#ffffff'), 0.175); }
  else if (/ice_cream/.test(id)) { add(new THREE.ConeGeometry(0.045, 0.13, 12), mat('#e8a860'), 0.065).rotation.x = Math.PI; add(new THREE.SphereGeometry(0.055, 16, 12), mat('#ffd6ec'), 0.15); add(new THREE.SphereGeometry(0.012, 8, 6), mat('#ff4d6a'), 0.21); }
  else if (/tart|cake/.test(id)) { add(new THREE.CylinderGeometry(0.075, 0.065, 0.04, 20), mat('#e8a860'), 0.02); add(new THREE.CylinderGeometry(0.062, 0.062, 0.02, 20), mat('#ffe066'), 0.045); }
  else if (/onigiri/.test(id)) { const m = add(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 3), mat('#ffffff'), 0.075); m.rotation.x = Math.PI / 2; m.rotation.y = Math.PI / 2; add(new THREE.BoxGeometry(0.06, 0.06, 0.055), mat('#1c2a20'), 0.04); }
  else if (/takoyaki/.test(id)) { add(new THREE.BoxGeometry(0.16, 0.025, 0.09), mat('#f4ead0'), 0.012); for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.024, 12, 8), mat('#c87a3a'), 0.04, -0.05 + i * 0.05); }
  else if (/cabbage/.test(id)) { add(new THREE.SphereGeometry(0.07, 16, 12), mat('#8fe060'), 0.07); }
  else if (/candy|mochi/.test(id)) { add(new THREE.SphereGeometry(0.045, 16, 12), mat('#ff74c0'), 0.06); for (const s of [-1, 1]) { const c = add(new THREE.ConeGeometry(0.03, 0.05, 10), mat('#ffd23a'), 0.06, s * 0.065); c.rotation.z = s * Math.PI / 2; } }
  else { add(new THREE.BoxGeometry(0.1, 0.12, 0.06), mat('#ff8a3a'), 0.06); add(new THREE.BoxGeometry(0.102, 0.03, 0.062), mat('#ffffff'), 0.07); }
  return g;
}
