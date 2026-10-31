// The REEF RUMBLE arcade cabinet outside the Tide Pool Arcade on Bayside Pier, sculpted in voxels (32 per metre):
// purple side panels with a painted wave and a crab, a slanted control panel with a ball-top stick and two
// glowing buttons (separate pieces, so they tilt and press while you play), a coin door with lit slots, a dark
// screen recess with a bezel and a back-lit marquee. The screen and marquee are pixel-art canvases: an attract
// loop until you play, then arcade.js draws the live game on it.
// Local frame: the screen faces +z, the cabinet stands on y = 0 (the pier deck).
import * as THREE from '../../../../vendor/three.module.js';
import { voxel, GLOW, canvasTex, picture } from './kit.js';

export const SCREEN = { w: 160, h: 120 };            // the game's pixel canvas (4:3)
const V = 32;

export function buildCabinet(st) {
  const g = new THREE.Group(); g.name = 'mg-cabinet';
  const X = 23, Y = 61, Z = 20;
  g.add(voxel(st, [X, Y, Z], (F, r, H) => {
    const pu = F.c('#5a3a8a'), puD = F.c('#40286a'), puL = F.c('#7a56b0'), ink = F.c('#1c1428'), blk = F.c('#241a34'), te = F.c('#2fd4c8'), teD = F.c('#1f9a94'), wh = F.c('#f4f0ff'), sea = F.c('#2a6ad8'), seaD = F.c('#1e4a9e');
    const gold = F.c('#ffc93a'), crab = F.c('#ff5a4a'), crabD = F.c('#c8382e'), slot = F.c('#ffe066', GLOW), chrome = F.c('#c8ccd4'), chromeD = F.c('#8a8e98'), mq = F.c('#3a2470');
    // the side profile: deep at the bottom, the control panel juts out, the screen recesses, the marquee overhangs
    const front = (y) => (y < 27 ? 17 : y < 32 ? 19 : y < 51 ? 13 : y < 59 ? 17 : 15);
    for (const sx of [0, X - 1]) for (let y = 0; y < Y; y++) for (let z = 0; z <= front(y); z++) {
      // painted side art: a sea at the bottom with a wave crest, stars above, a crab on the sand
      let c = pu;
      if (y < 14) c = (y + (z >> 1)) % 7 === 0 ? seaD : sea;
      else if (y < 17) c = Math.sin(z * 0.9 + y) > 0.2 ? wh : te;
      else if ((z * 5 + y * 3) % 29 === 0) c = gold;
      if (z === front(y) || y === Y - 1) c = puD;
      if (z === 0) c = puD;
      F.set(sx, y, z, c);
    }
    for (const sx of [0, X - 1]) { F.box(sx, 4, 6, sx, 6, 11, crab); F.box(sx, 7, 7, sx, 7, 10, crab); F.set(sx, 8, 7, ink); F.set(sx, 8, 10, ink); F.box(sx, 6, 4, sx, 7, 5, crabD); F.box(sx, 6, 12, sx, 7, 13, crabD); F.box(sx, 3, 5, sx, 3, 12, crabD); }
    // the trim strips (chrome t-molding) along the side edges
    for (const sx of [0, X - 1]) for (let y = 0; y < Y; y++) F.set(sx, y, front(y), y % 6 === 0 ? chrome : chromeD);
    // back and inner body
    F.box(1, 0, 0, X - 2, Y - 1, 1, blk);
    F.box(1, 0, 15, X - 2, 26, 17, puL); F.box(1, 0, 16, X - 2, 1, 17, ink);                       // the kick panel
    F.box(7, 6, 17, 15, 18, 17, blk); F.box(8, 14, 17, 9, 16, 17, slot); F.box(13, 14, 17, 14, 16, 17, slot); F.box(10, 8, 17, 12, 9, 17, chromeD);   // coin door
    // the control panel: a slanted slab (steps down toward you) with a chrome edge
    for (let z = 13; z <= 19; z++) { const top = 31 - Math.floor((z - 13) / 3); F.box(1, 27, z, X - 2, top, z, (x, y) => (y === top ? (z === 19 ? chrome : ink) : blk)); }
    F.box(1, 27, 19, X - 2, 28, 19, te);
    // the screen recess and bezel
    F.box(1, 32, 2, X - 2, 50, 11, ink);
    F.box(1, 32, 12, X - 2, 33, 13, blk); F.box(1, 49, 12, X - 2, 50, 13, blk); F.box(1, 32, 12, 2, 50, 13, blk); F.box(X - 3, 32, 12, X - 2, 50, 13, blk);
    // the marquee box (its face is the lit picture) and the top
    F.box(1, 51, 2, X - 2, 58, 16, mq); F.box(1, 51, 16, X - 2, 51, 17, ink); F.box(1, 58, 16, X - 2, 58, 17, ink);
    F.box(0, 59, 0, X - 1, 60, 15, puD); for (let x = 0; x < X; x += 3) F.set(x, 60, 15, te);
    void teD;
  }, { vpm: V, key: 'mg-cabinet' }));
  // the stick and the two buttons are separate pieces (they move)
  const stick = new THREE.Group(); stick.position.set(-0.19, 0.97, 0.21);
  stick.add(voxel(st, [5, 9, 5], (F, r, H) => { const ch = F.c('#c8ccd4'), red = F.c('#e8283a'), redL = F.c('#ff6a6a'), b = F.c('#1c1428'); F.box(1, 0, 1, 3, 0, 3, b); F.box(2, 1, 2, 2, 5, 2, ch); H.ball(F, 2, 6.5, 2, 2.3, 2.3, 2.3, (x, y) => (y > 7 && x < 2 ? redL : red)); }, { vpm: 90, key: 'mg-stick' }));
  g.add(stick);
  const buttons = [];
  for (const [x, c, k] of [[0.05, '#2fd4c8', 'a'], [0.17, '#ff74c0', 'b']]) {
    const b = new THREE.Group(); b.position.set(x, 0.965, 0.25);
    b.add(voxel(st, [7, 3, 7], (F, r, H) => { const cc = F.c(c, GLOW), rim = F.c('#1c1428'), hi = F.c('#ffffff', GLOW); H.disc(F, 3, 3, 0, 0, 3.4, rim); H.disc(F, 3, 3, 1, 2, 2.6, cc); F.set(2, 2, 2, hi); }, { vpm: 130, key: 'mg-btn' + k }));
    g.add(b); buttons.push(b);
  }
  // the marquee (lit pixel art) and the screen
  const mqT = canvasTex(128, 32, (c, w, h) => {
    c.fillStyle = '#1a1040'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a1a58'; for (let y = 0; y < h; y += 2) c.fillRect(0, y, w, 1);
    c.fillStyle = '#2fd4c8'; for (let x = 0; x < w; x += 8) c.fillRect(x, h - 4 + ((x / 8) % 2), 6, 2);
    c.font = '16px "TKSilkscreen", monospace'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillStyle = '#1c1838'; c.fillText('REEF RUMBLE', w / 2 + 1, 4); c.fillStyle = '#ffc93a'; c.fillText('REEF RUMBLE', w / 2, 3);
    c.font = '8px "TKTiny5", monospace'; c.fillStyle = '#ff74c0'; c.fillText('TIDE POOL ARCADE', w / 2, 20);
  });
  const marquee = picture(mqT, 0.66, 0.2, { toneMapped: false }); marquee.position.set(0, 1.705, 0.237); g.add(marquee);
  const attract = attractTex();
  const scr = picture(attract, 0.6, 0.45, { toneMapped: false }); scr.position.set(0, 1.29, 0.07); scr.rotation.x = -0.14; g.add(scr);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.5), new THREE.MeshBasicMaterial({ color: '#a0d8ff', transparent: true, opacity: 0.07, depthWrite: false })); glass.position.set(0, 1.29, 0.08); glass.rotation.x = -0.14; g.add(glass);
  g.userData = { screen: scr, attract, stick, buttons, screenAt: new THREE.Vector3(0, 1.29, 0.07), tick: 0 };
  // the attract loop animates while nobody plays (a few times a second is plenty)
  scr.onBeforeRender = () => { const u = g.userData; if (scr.material.map !== u.attract) return; const now = performance.now(); if (now - u.tick > 220) { u.tick = now; paintAttract(u.attract, now / 1000); } };
  return g;
}
function attractTex() { const t = canvasTex(SCREEN.w, SCREEN.h, null); t.userData.keep = true; paintAttract(t, 0); return t; }
function paintAttract(t, time) {
  const c = t.userData.g, w = SCREEN.w, h = SCREEN.h;
  c.fillStyle = '#081a3a'; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) { c.fillStyle = y > 84 ? '#0e3a6a' : '#0a2450'; c.fillRect(0, y, w, 1); }
  for (let i = 0; i < 14; i++) { const x = (i * 37 + time * 12 * ((i % 3) + 1)) % w, y = (i * 53) % 80 + 8; c.fillStyle = i % 2 ? '#5ae0ff' : '#ffffff'; c.fillRect(x | 0, y, 1, 1); }
  c.fillStyle = '#e8c890'; c.fillRect(0, h - 14, w, 14); c.fillStyle = '#c8a870'; for (let x = 0; x < w; x += 6) c.fillRect(x, h - 14 + (x % 4), 3, 1);
  c.font = '16px "TKSilkscreen", monospace'; c.textAlign = 'center'; c.textBaseline = 'top';
  const bob = Math.round(Math.sin(time * 3) * 2);
  c.fillStyle = '#1c1838'; c.fillText('REEF', w / 2 + 1, 18 + bob + 1); c.fillText('RUMBLE', w / 2 + 1, 36 + bob + 1);
  c.fillStyle = '#ffc93a'; c.fillText('REEF', w / 2, 18 + bob); c.fillStyle = '#ff74c0'; c.fillText('RUMBLE', w / 2, 36 + bob);
  c.font = '8px "TKSilkscreen", monospace';
  if (Math.floor(time * 2) % 2) { c.fillStyle = '#ffffff'; c.fillText('INSERT COIN', w / 2, 66); }
  const hi = (globalThis.__app && __app.minigames && __app.minigames.best('arcade')) || 0;
  c.fillStyle = '#5ae0ff'; c.fillText('HI ' + String(hi).padStart(6, '0'), w / 2, 82);
  const cx = Math.round(((time * 30) % (w + 20)) - 10), cy = h - 12;
  c.fillStyle = '#ff5a4a'; c.fillRect(cx - 4, cy - 3, 8, 4); c.fillRect(cx - 6, cy - 5, 2, 2); c.fillRect(cx + 4, cy - 5, 2, 2); c.fillStyle = '#1c1838'; c.fillRect(cx - 2, cy - 4, 1, 1); c.fillRect(cx + 1, cy - 4, 1, 1);
  t.needsUpdate = true;
}
