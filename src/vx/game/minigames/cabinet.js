// The REEF RUMBLE arcade cabinet outside the Tide Pool Arcade on Bayside Pier: a little 3D cabinet (side art,
// slanted control panel with a stick and two buttons, a glowing marquee, a coin door) whose screen shows an
// attract loop until you play — then arcade.js puts the live game on it.
// Local frame: the screen faces +z, the cabinet stands on y = 0 (the pier deck).
import * as THREE from '../../../../vendor/three.module.js';
import { boxes, canvasTex, picture } from './kit.js';

export const SCREEN = { w: 160, h: 120 };            // the game's pixel canvas (4:3)
const PURPLE = '#5a3a8a', PURPLE_D = '#3a2460', TEAL = '#2fd4c8', GOLD = '#ffc93a', INK = '#1c1838';

export function buildCabinet() {
  const g = new THREE.Group(); g.name = 'mg-cabinet';
  const W = 0.72, D = 0.62, x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2;
  // the body: two side panels, the back, the base kick, the front below the controls
  g.add(boxes([
    [x0, 0, z0, x0 + 0.05, 1.86, z1, PURPLE], [x1 - 0.05, 0, z0, x1, 1.86, z1, PURPLE],
    [x0, 0, z0, x1, 1.86, z0 + 0.05, PURPLE_D], [x0 + 0.05, 0, z1 - 0.12, x1 - 0.05, 0.86, z1 - 0.02, PURPLE_D],
    [x0, 0, z0, x1, 0.06, z1 + 0.02, INK],
    // the coin door
    [-0.13, 0.32, z1 - 0.03, 0.13, 0.62, z1, '#2a2440'], [-0.09, 0.5, z1, -0.03, 0.56, z1 + 0.01, GOLD], [0.03, 0.5, z1, 0.09, 0.56, z1 + 0.01, GOLD],
    // the control panel (a slab, then the stick and the buttons)
    [x0 + 0.02, 0.86, z1 - 0.14, x1 - 0.02, 0.98, z1 + 0.18, INK], [x0 + 0.03, 0.97, z1 - 0.13, x1 - 0.03, 0.99, z1 + 0.17, '#2a2848'],
    [-0.2, 0.99, z1 + 0.0, -0.18, 1.1, z1 + 0.02, '#c8ccd4'],
    // the bezel round the screen + the marquee box
    [x0 + 0.05, 0.98, z1 - 0.18, x1 - 0.05, 1.04, z1 - 0.14, INK], [x0 + 0.05, 1.6, z1 - 0.26, x1 - 0.05, 1.64, z1 - 0.06, INK],
    [x0, 1.64, z0 + 0.05, x1, 1.86, z1 - 0.02, '#241a3a'],
  ]));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshLambertMaterial({ color: '#e8283a' })); knob.position.set(-0.19, 1.12, 0.32); g.add(knob);
  const btns = [];
  for (const [x, c] of [[0.06, TEAL], [0.18, '#ff74c0']]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.025, 12), new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.25 })); b.position.set(x, 1.0, 0.33); g.add(b); btns.push(b); }
  // side art: a wave and the title, on both sides
  const side = canvasTex(32, 96, (c, w, h) => {
    c.fillStyle = PURPLE; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) { const wv = Math.sin(y * 0.18) * 4 + 16; c.fillStyle = y > 56 ? '#2a8ad8' : y > 50 ? TEAL : PURPLE; c.fillRect(0, y, y > 50 ? w : 0, 1); c.fillStyle = '#f4f0ff'; if (y > 46 && y < 52) c.fillRect(wv - 3, y, 6, 1); }
    c.fillStyle = GOLD; for (let i = 0; i < 6; i++) c.fillRect(4 + i * 4, 10 + (i % 2) * 3, 2, 2);
    c.fillStyle = '#ff74c0'; c.fillRect(10, 64, 12, 6); c.fillRect(8, 66, 2, 2); c.fillRect(22, 66, 2, 2); c.fillStyle = INK; c.fillRect(12, 65, 2, 2); c.fillRect(18, 65, 2, 2);
  });
  for (const sx of [-1, 1]) { const p = picture(side, D - 0.02, 1.72, { lit: true }); p.position.set(sx * (W / 2 + 0.002), 0.9, 0); p.rotation.y = sx * Math.PI / 2; g.add(p); }
  // the marquee (lit)
  const mq = canvasTex(128, 32, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a1040'); gr.addColorStop(1, '#3a2470'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = TEAL; for (let x = 0; x < w; x += 8) c.fillRect(x, h - 4 + ((x / 8) % 2), 6, 2);
    c.font = 'bold 15px "Trebuchet MS", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = INK; c.fillText('REEF RUMBLE', w / 2 + 1, 13); c.fillStyle = GOLD; c.fillText('REEF RUMBLE', w / 2, 12);
    c.font = 'bold 7px "Trebuchet MS", Arial, sans-serif'; c.fillStyle = '#ff74c0'; c.fillText('TIDE POOL ARCADE', w / 2, 25);
  });
  const marquee = picture(mq, W - 0.08, 0.2, { toneMapped: false }); marquee.position.set(0, 1.75, z1 - 0.015); g.add(marquee);
  // the screen, tilted back a little, in a dark recess
  const recess = boxes([[x0 + 0.05, 1.04, z1 - 0.28, x1 - 0.05, 1.6, z1 - 0.24, '#0a0812']], { shadow: false }); g.add(recess);
  const attract = attractTex();
  const scr = picture(attract, 0.56, 0.42, { toneMapped: false }); scr.position.set(0, 1.31, z1 - 0.2); scr.rotation.x = -0.2; g.add(scr);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.46), new THREE.MeshBasicMaterial({ color: '#a0d8ff', transparent: true, opacity: 0.06, depthWrite: false })); glass.position.set(0, 1.31, z1 - 0.19); glass.rotation.x = -0.2; g.add(glass);
  g.traverse((m) => { if (m.isMesh && m !== glass) m.castShadow = true; });
  g.userData = { screen: scr, attract, knob, buttons: btns, knobRest: knob.position.clone(), screenAt: new THREE.Vector3(0, 1.31, z1 - 0.2), tilt: -0.2, tick: 0 };
  // the attract loop animates while nobody plays (a few times a second is plenty)
  scr.onBeforeRender = () => { const u = g.userData; if (scr.material.map !== u.attract) return; const now = performance.now(); if (now - u.tick > 220) { u.tick = now; paintAttract(u.attract, now / 1000); } };
  return g;
}
function attractTex() { const t = canvasTex(SCREEN.w, SCREEN.h, null); paintAttract(t, 0); return t; }
function paintAttract(t, time) {
  const c = t.userData.g, w = SCREEN.w, h = SCREEN.h;
  c.fillStyle = '#081a3a'; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) { c.fillStyle = y > 84 ? '#0e3a6a' : '#0a2450'; c.fillRect(0, y, w, 1); }
  for (let i = 0; i < 14; i++) { const x = (i * 37 + time * 12 * ((i % 3) + 1)) % w, y = (i * 53) % 80 + 8; c.fillStyle = i % 2 ? '#5ae0ff' : '#ffffff'; c.fillRect(x | 0, y, 1, 1); }
  c.fillStyle = '#e8c890'; c.fillRect(0, h - 14, w, 14); c.fillStyle = '#c8a870'; for (let x = 0; x < w; x += 6) c.fillRect(x, h - 14 + (x % 4), 3, 1);
  c.font = 'bold 18px "Trebuchet MS", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const bob = Math.round(Math.sin(time * 3) * 2);
  c.fillStyle = '#1c1838'; c.fillText('REEF', w / 2 + 1, 30 + bob + 1); c.fillText('RUMBLE', w / 2 + 1, 48 + bob + 1);
  c.fillStyle = '#ffc93a'; c.fillText('REEF', w / 2, 30 + bob); c.fillStyle = '#ff74c0'; c.fillText('RUMBLE', w / 2, 48 + bob);
  c.font = 'bold 8px "Trebuchet MS", Arial, sans-serif';
  if (Math.floor(time * 2) % 2) { c.fillStyle = '#ffffff'; c.fillText('INSERT COIN', w / 2, 74); }
  const hi = (globalThis.__app && __app.minigames && __app.minigames.best('arcade')) || 0;
  c.fillStyle = '#5ae0ff'; c.fillText('HI ' + String(hi).padStart(6, '0'), w / 2, 90);
  // a crab scuttling along the sand
  const cx = ((time * 30) % (w + 20)) - 10, cy = h - 12;
  c.fillStyle = '#ff5a4a'; c.fillRect(cx - 4, cy - 3, 8, 4); c.fillRect(cx - 6, cy - 5, 2, 2); c.fillRect(cx + 4, cy - 5, 2, 2); c.fillStyle = '#1c1838'; c.fillRect(cx - 2, cy - 4, 1, 1); c.fillRect(cx + 1, cy - 4, 1, 1);
  t.needsUpdate = true;
}
