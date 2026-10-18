// The closet: dress the player before heading out. Almost no UI — clothes hang on
// two rails across the top of the screen; drag one onto yourself (or tap it) to wear
// it. Swipe up / down on yourself to change skin tone, left / right to switch body,
// tap your head to change hairstyle. A small ✓ finishes.
import { T } from '../../px/game/ui.js';

export const SKINS = ['#f6d8c0', '#f2cdb0', '#e6b48e', '#d8a27a', '#c48a62', '#a8704a', '#8a5a3e', '#6a4430'];
const HAIRS = { a: ['short', 'spiky', 'slick', 'buzz', 'afro', 'mohawk', 'long'], b: ['ponytail', 'bob', 'long', 'bun', 'afro', 'short', 'spiky'] };
const BODIES = {
  a: { build: 'teen', eyes: { color: '#4a3424', shape: 'sharp', thick: true } },
  b: { build: 'teen', eyes: { color: '#4a3424', shape: 'sharp', lashes: true } },
};
// what you wake up in
export function pajamas(r = {}) {
  return { name: 'hero', build: 'teen', skin: '#d8a27a', hair: { style: 'spiky', color: '#2a1e1a' }, eyes: BODIES.a.eyes, body: 'a', ...r,
    top: { kind: 'tee', color: '#7a9ad8', color2: '#f4efe6' }, bottom: { kind: 'track', color: '#5a6aa8', color2: '#f4efe6' }, shoes: { kind: 'dress', color: '#c84a5a', sock: '#c84a5a' }, acc: [], mood: 'tired' };
}
// the wardrobe on the rails: tops and bottoms above, shoes, accessories and hair dye below
export const WARDROBE = [
  [
    { slot: 'top', kind: 'hoodie', color: '#e8603a', color2: '#f4efe6', name: 'Ember hoodie' },
    { slot: 'top', kind: 'jacket', color: '#1e1e26', inner: '#c8303a', name: 'Moto jacket' },
    { slot: 'top', kind: 'tee', color: '#f0c840', name: 'Sun tee' },
    { slot: 'top', kind: 'vest', color: '#4a5a7a', color2: '#3a4a6a', inner: '#e8e4dc', name: 'Denim vest' },
    { slot: 'top', kind: 'coat', color: '#7a3a4a', name: 'Fog coat' },
    { slot: 'top', kind: 'tank', color: '#2e2e36', name: 'Black tank' },
    { slot: 'top', kind: 'jacket', color: '#d8d0c4', inner: '#e84a6a', name: 'Bomber' },
    { slot: 'top', kind: 'hoodie', color: '#3a6ab0', color2: '#f4efe6', name: 'Bay hoodie' },
    { slot: 'bottom', kind: 'jeans', color: '#2e3a5e', name: 'Jeans' },
    { slot: 'bottom', kind: 'shorts', color: '#3a5a8a', name: 'Shorts' },
    { slot: 'bottom', kind: 'skirt', color: '#2e2e3a', name: 'Skirt' },
    { slot: 'bottom', kind: 'track', color: '#1e1e26', color2: '#f0c840', name: 'Track pants' },
    { slot: 'bottom', kind: 'slacks', color: '#5a5048', name: 'Slacks' },
    { slot: 'bottom', kind: 'jeans', color: '#1a1a20', name: 'Black jeans' },
  ],
  [
    { slot: 'shoes', kind: 'sneakers', color: '#f2f0ea', stripe: '#e8603a', name: 'Kicks' },
    { slot: 'shoes', kind: 'sneakers', color: '#2a2a32', stripe: '#f0c840', name: 'Night kicks' },
    { slot: 'shoes', kind: 'boots', color: '#1a1618', name: 'Boots' },
    { slot: 'acc', acc: 'cap', color: '#c83a3a', name: 'Cap' },
    { slot: 'acc', acc: 'headphones', color: '#e84a6a', name: 'Headphones' },
    { slot: 'acc', acc: 'glasses', color: '#2a2a32', name: 'Glasses' },
    { slot: 'acc', acc: 'sunglasses', color: '#18161c', name: 'Shades' },
    { slot: 'acc', acc: 'backpack', color: '#2e6a8a', name: 'Backpack' },
    { slot: 'acc', acc: 'scarf', color: '#c8303a', name: 'Scarf' },
    { slot: 'acc', acc: 'chain', color: '#e8c040', name: 'Chain' },
    { slot: 'dye', color: '#2a1e1a', name: 'Black' }, { slot: 'dye', color: '#a8763a', name: 'Caramel' },
    { slot: 'dye', color: '#d8d0c4', name: 'Platinum' }, { slot: 'dye', color: '#c8303a', name: 'Cherry' }, { slot: 'dye', color: '#3a6ab0', name: 'Indigo' },
  ],
];
const ACC_KEY = { cap: 'capColor', headphones: 'phoneColor', backpack: 'packColor', scarf: 'scarfColor' };

// ---- little pixel drawings of each item, ~16 px, hanging from a hook at (cx, y)
function shade(c, k) { const n = parseInt(c.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + k)))); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); }
function drawItem(ui, it, cx, y, lift = 0) {
  const c = it.color, lo = shade(c, -0.3), hi = shade(c, 0.25), ink = '#16121a';
  y -= lift;
  ui.rect(cx, y, 1, 3, '#a8a4b0'); ui.rect(cx - 4, y + 3, 9, 1, '#a8a4b0');                 // the hanger
  const R = (x, yy, w, h, col) => ui.rect(cx + x, y + yy, w, h, col);
  if (it.slot === 'top') {
    const sleeve = it.kind === 'tank' || it.kind === 'vest' ? 0 : it.kind === 'tee' ? 3 : 8, long = it.kind === 'coat' ? 4 : 0;
    R(-6, 4, 13, 12 + long, ink); R(-5, 5, 11, 10 + long, c); R(-5, 5, 11, 1, hi);
    if (sleeve) { R(-9, 4, 4, sleeve + 1, ink); R(6, 4, 4, sleeve + 1, ink); R(-8, 5, 3, sleeve, c); R(6, 5, 3, sleeve, c); }
    if (it.kind === 'hoodie') { R(-3, 3, 7, 3, lo); R(-3, 11, 7, 3, lo); }
    if (it.kind === 'jacket' || it.kind === 'vest' || it.kind === 'coat') { R(0, 5, 1, 10 + long, it.inner ? it.inner : lo); R(-2, 5, 1, 3, hi); R(2, 5, 1, 3, hi); }
    R(-5, 14 + long, 11, 1, lo);
  } else if (it.slot === 'bottom') {
    if (it.kind === 'skirt') { R(-4, 4, 9, 2, ink); R(-6, 6, 13, 7, ink); R(-5, 6, 11, 6, c); R(-3, 4, 7, 2, lo); }
    else { const L = it.kind === 'shorts' ? 6 : 11; R(-5, 4, 11, 3, ink); R(-5, 7, 5, L, ink); R(1, 7, 5, L, ink); R(-4, 5, 9, 2, lo); R(-4, 7, 3, L - 1, c); R(2, 7, 3, L - 1, c); if (it.color2) { R(-4, 7, 1, L - 1, it.color2); R(4, 7, 1, L - 1, it.color2); } }
  } else if (it.slot === 'shoes') {
    const H = it.kind === 'boots' ? 7 : 4;
    for (const dx of [-7, 1]) { R(dx, 13 - H, 6, H + 1, ink); R(dx + 1, 14 - H, 4, H - 1, c); R(dx + 1, 12, 5, 1, it.kind === 'boots' ? lo : '#f4f0ea'); if (it.stripe) R(dx + 2, 11, 2, 1, it.stripe); }
  } else if (it.slot === 'acc') {
    const a = it.acc;
    if (a === 'cap') { R(-5, 6, 9, 5, ink); R(-4, 7, 7, 4, c); R(3, 10, 4, 1, lo); R(-4, 7, 7, 1, hi); }
    else if (a === 'headphones') { R(-5, 5, 11, 1, ink); R(-6, 6, 1, 4, ink); R(6, 6, 1, 4, ink); R(-7, 9, 3, 4, c); R(5, 9, 3, 4, c); }
    else if (a === 'glasses' || a === 'sunglasses') { const f = a === 'glasses' ? '#cfe4f0' : '#2a1020'; R(-7, 8, 6, 4, ink); R(1, 8, 6, 4, ink); R(-6, 9, 4, 2, f); R(2, 9, 4, 2, f); R(-1, 9, 2, 1, ink); }
    else if (a === 'backpack') { R(-5, 5, 11, 11, ink); R(-4, 6, 9, 9, c); R(-3, 11, 7, 3, lo); R(-4, 6, 9, 1, hi); }
    else if (a === 'scarf') { R(-6, 6, 13, 3, ink); R(-5, 7, 11, 1, c); R(2, 8, 3, 7, ink); R(3, 9, 1, 5, c); }
    else if (a === 'chain') { for (let i = 0; i < 9; i++) R(-6 + i * 1.5 | 0, 6 + Math.round(Math.sin((i / 8) * Math.PI) * 5), 1, 1, i % 2 ? hi : c); R(-1, 12, 3, 3, c); }
  } else if (it.slot === 'dye') {
    R(-2, 4, 5, 2, ink); R(-4, 6, 9, 9, ink); R(-3, 7, 7, 7, c); R(-3, 7, 2, 2, hi);
  }
}

export class Closet {
  // app, the current recipe, and where the player stands (a spot [x, z, yaw, y])
  constructor(app, recipe, at) { this.app = app; this.r = JSON.parse(JSON.stringify(recipe)); this.at = at; this.scroll = [0, 0]; this.drag = null; this.t = 0; this.hint = 6; }
  open() {
    this.app.overlays.push(this.draw = this.draw.bind(this));
    this.rebuild();
    return new Promise((r) => { this.done = r; });
  }
  close() { const i = this.app.overlays.indexOf(this.draw); if (i >= 0) this.app.overlays.splice(i, 1); this.done(this.r); }
  rebuild(anim = 'idle') {
    const w = this.app.world, old = w.actor('hero'), [x, z, yaw, y] = this.at;
    if (old) w.remove('hero');
    const a = w.addPerson('hero', this.r, [x, z, yaw, y]); a.play(anim, { fade: 0 });
    w.player = a; return a;
  }
  wear(it) {
    const r = this.r, au = this.app.audio;
    if (it.slot === 'top') r.top = { kind: it.kind, color: it.color, color2: it.color2, inner: it.inner };
    else if (it.slot === 'bottom') r.bottom = { kind: it.kind, color: it.color, color2: it.color2 };
    else if (it.slot === 'shoes') r.shoes = { kind: it.kind, color: it.color, stripe: it.stripe, lace: it.stripe };
    else if (it.slot === 'dye') r.hair = { ...r.hair, color: it.color };
    else if (it.slot === 'acc') {
      const has = (r.acc || []).includes(it.acc), other = { glasses: 'sunglasses', sunglasses: 'glasses' }[it.acc];
      r.acc = (r.acc || []).filter((a) => a !== it.acc && a !== other);
      if (!has) { r.acc.push(it.acc); if (ACC_KEY[it.acc]) r[ACC_KEY[it.acc]] = it.color; }
    }
    if (r.mood === 'tired') r.mood = 'happy';
    if (au.sfx) au.sfx('ui_tap');
    const a = this.rebuild(it.slot === 'top' || it.slot === 'bottom' ? 'look' : 'cheer');
    this.app.world.fx.emit('sparkle', a.headPos(), { n: 6 });
    this.lastWorn = { name: it.name, t: 1.6 };
  }
  cycleSkin(d) { const i = SKINS.indexOf(this.r.skin); this.r.skin = SKINS[(i + d + SKINS.length) % SKINS.length]; this.rebuild('look'); }
  cycleBody() {
    const next = this.r.body === 'b' ? 'a' : 'b';
    this.r.body = next; Object.assign(this.r, BODIES[next]); this.r.hair = { ...this.r.hair, style: HAIRS[next][0] };
    this.rebuild('cheer');
  }
  cycleHair() { const list = HAIRS[this.r.body || 'a'], i = list.indexOf(this.r.hair.style); this.r.hair = { ...this.r.hair, style: list[(i + 1) % list.length] }; this.rebuild('look'); }
  // the player's rectangle on screen (UI pixels)
  heroBox() {
    const w = this.app.world, a = w.actor('hero'); if (!a) return { x: 0, y: 0, w: 0, h: 0 };
    const p = a.g.position, foot = w.project([p.x, p.y, p.z]), head = w.project(a.headPos()), h = Math.max(20, foot.y - head.y + 14);
    return { x: Math.round(foot.x - h * 0.4), y: Math.round(head.y - 10), w: Math.round(h * 0.8), h: Math.round(h), headY: head.y };
  }
  draw(ui, dt) {
    this.t += dt; this.hint -= dt;
    const P = ui.ptr, W = ui.w, rails = [16, 50], gap = 24;
    // rails: a chrome bar with hangers; drag sideways on a rail to slide it
    for (let r = 0; r < 2; r++) {
      const y = rails[r]; ui.rect(0, y - 1, W, 2, '#8c8896'); ui.rect(0, y - 1, W, 1, '#d8d4e0');
      const items = WARDROBE[r], total = items.length * gap, min = Math.min(0, W - total - 12);
      this.scroll[r] = Math.max(min, Math.min(0, this.scroll[r]));
      items.forEach((it, i) => {
        if (this.drag && this.drag.it === it) return;
        const cx = Math.round(12 + i * gap + this.scroll[r]), over = P.x > cx - 10 && P.x < cx + 10 && P.y > y && P.y < y + 26;
        drawItem(ui, it, cx, y, over && !P.down ? 1 : 0);
        if (P.pressed && over) this.drag = { it, rail: r, sx: P.x, sy: P.y, scroll0: this.scroll[r], moved: false };
      });
    }
    const hb = this.heroBox();
    if (P.pressed && !this.drag && P.y > rails[1] + 28) this.swipe = { sx: P.x, sy: P.y, onHead: P.x > hb.x && P.x < hb.x + hb.w && P.y < hb.headY + 6 && P.y > hb.y - 6 };
    // dragging: along the rail it slides the rail, downward it lifts the item off its hanger
    const D = this.drag;
    if (D) {
      const dx = P.x - D.sx, dy = P.y - D.sy;
      if (!D.lifted && Math.abs(dx) > 4 && Math.abs(dx) > Math.abs(dy)) { this.scroll[D.rail] = D.scroll0 + dx; D.moved = true; }
      if (!D.moved && dy > 6) D.lifted = true;
      if (D.lifted) { drawItem(ui, D.it, P.x, P.y - 8, 0); const inHero = P.x > hb.x - 6 && P.x < hb.x + hb.w + 6 && P.y > hb.y - 6 && P.y < hb.y + hb.h + 6; if (inHero) { ui.rect(hb.x - 2, hb.y + hb.h, hb.w + 4, 1, T.amber); } }
      if (P.released) {
        if (D.lifted ? P.y > rails[1] + 24 : !D.moved && Math.hypot(dx, dy) < 4) this.wear(D.it);
        this.drag = null; P.released = false;
      }
    }
    // gestures on yourself
    const S = this.swipe;
    if (S && P.released) {
      const dx = P.x - S.sx, dy = P.y - S.sy;
      if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) this.cycleSkin(dy < 0 ? 1 : -1);
      else if (Math.abs(dx) > 14) this.cycleBody();
      else if (S.onHead) this.cycleHair();
      this.swipe = null; P.released = false;
    }
    if (ui.key('ArrowUp')) this.cycleSkin(1); if (ui.key('ArrowDown')) this.cycleSkin(-1);
    if (ui.key('ArrowLeft') || ui.key('ArrowRight')) this.cycleBody(); if (ui.key('h')) this.cycleHair();
    // whisper-quiet hints, the last item worn, and the ✓
    if (this.hint > 0) { const a = Math.min(1, this.hint); if (a > 0.3) ui.text('drag clothes onto you  ·  swipe ↑↓ skin  ·  ←→ body  ·  tap head: hair', W >> 1, ui.h - 12, T.dim, { align: 'center', mini: true }); }
    if (this.lastWorn) { this.lastWorn.t -= dt; if (this.lastWorn.t > 0) ui.text(this.lastWorn.name, W >> 1, rails[1] + 30, T.amber, { align: 'center', mini: true, outline: '#0c0814' }); }
    if (ui.button(W - 24, ui.h - 24, 20, 20, '', { icon: 'check', color: T.green, hotkey: 'Enter' })) { this.app.audio.sfx && this.app.audio.sfx('ui_confirm'); this.close(); }
  }
}
