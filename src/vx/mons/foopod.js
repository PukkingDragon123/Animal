// Foopod — the Foo Fighters homage, stage 1. A small, scrappy rainbow mantis shrimp up on its
// toes like a boxer: peacock-green carapace with leopard freckles, a rainbow stack of chest
// plates, folded smashing clubs held up like fists, stalked eyes with a striped midband and a
// slit of three pseudopupils (cool, alien, intense), a shaggy centre-parted mop of dark
// "long hair" antennules and a beard tuft, orange antennal scales and whips, a swimmer's tail
// fan with peacock eyespots, and a retro toy ray gun tucked in its waistband (the debut
// album's toy blaster) — the little UFO on its buckle winks at the WWII "foo fighters".
// It throws the strongest punch in the sea: the club snaps out faster than a blink and the
// water boils into cavitation bubbles that pop with a flash of light.
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import { shade, gradient, layer, on, poly, ramp, shift, mix, h2 } from './kit.js';
import { B, both, armour, spots, rainbowPlate, bands, hair, blade, grid, EYE_ROWS, eyeMap, eyeballP, eyeShutP, rayGun, MUZZLE, FX, legRig, step, saccade, clamp } from './shrimp_parts.js';

const C = {
  ink: '#120e1e',
  shell: '#25b07a', shellHi: '#86eeac', shellLo: '#157460', shellDeep: '#0c4450', spot: '#0f5446', sheen: '#62f2ff',
  rb: ['#ffd23a', '#ff922a', '#f2443a', '#e0388e'],
  back: ['#22a690', '#1d8fae', '#2a6cc8'], tail: ['#2a5ad0', '#4a40c6'],
  arm: '#e8467a', armHi: '#ff8cae', armLo: '#a8285e', armSpot: '#80184c',
  fore: '#ff6c8e', foreHi: '#ffa8c0', foreLo: '#c8386a',
  club: '#f6ead2', clubHi: '#ffffff', clubLo: '#d2b690', clubBand: '#ff5a4a', clubBandLo: '#c02a3a',
  leg: '#ff8a2a', legHi: '#ffc860', legLo: '#c4501e',
  scale: '#ff9a2a', scaleHi: '#ffd060', scaleEdge: '#e0388e',
  hair: { base: '#2c2646', hi: '#4c4a7c', lo: '#141026', sheen: '#7c88dc' },
  belt: '#24357a', beltHi: '#4060b8', beltLo: '#141e4a', beltStripe: '#ff8a2a',
  eye: '#1e5664', eyeHi: '#4a96a0', eyeLo: '#10303e', eyeShade: '#0b1a28', band: ['#ff3e9a', '#ffe23a', '#3ae8ff'],
  stalk: ['#ffb43a', '#f08a2c'], mouth: '#2a0c1e', bristle: '#fff0c8',
  fan: { root: '#2a5ad0', base: '#3a46c8', edge: '#ff6a3a', rim: '#ff9a3a', keel: '#1a2a7a', eye: '#ffd23a', eyeRing: '#16124a', eyeCore: '#ff3e9a', spine: '#fff0c8' },
};
const EYEP = { ink: C.ink, eye: C.eye, eyeHi: C.eyeHi, eyeLo: C.eyeLo, eyeShade: C.eyeShade, band: C.band, lid: C.shell };

// ---------------------------------------------------------------- painters
const shellP = layer(armour(C.shell, { top: C.shellHi, bottom: C.shellLo, dots: 6, sheen: C.sheen }), spots(C.spot, { every: 6, skip: 0.5, core: C.shellLo }));
const shellPlain = armour(C.shell, { top: C.shellHi, bottom: C.shellLo });
// the face: freckled cheeks, a dark mask line under the fringe
const faceP = (p, w, h, face, cube) => {
  shellPlain(p, w, h, face, cube);
  if (face !== 'south') return;
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const x = Math.round(w / 2 + s * (w * 0.34 - k)), y = Math.round(h * 0.55 + k * 0.6); p.px(x, y, C.spot); p.px(x + s, y + 1, C.spot); }
  for (let x = 2; x < w - 2; x++) p.px(x, Math.round(h * 0.28), shift(C.shellLo, -0.1));
};
const plates = C.rb.map((c, i) => rainbowPlate(c, i ? C.rb[i - 1] : '#ffffff'));
const backPs = C.back.map((c, i) => armour(c, { keel: true, sheen: C.back[i + 1] || C.tail[0], dots: 5, seed: i + 2 }));
const tailPs = C.tail.map((c, i) => armour(c, { keel: true, dots: 4, sheen: '#8ab0ff', seed: i + 7 }));
const armP = layer(armour(C.arm, { top: C.armHi, bottom: C.armLo }), spots(C.armSpot, { every: 4, skip: 0.42, core: C.armLo }));
const foreP = layer(armour(C.fore, { top: C.foreHi, bottom: C.foreLo }), spots(C.armLo, { every: 4, skip: 0.55 }));
// the smashing club: ivory heel with a coral band at the wrist, a white striking pad on top
const clubP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c;
    if (face === 'up') { const d = Math.max(Math.abs(x - (w - 1) / 2) / (w / 2), Math.abs(y - (h - 1) / 2) / (h / 2)); c = d > 0.8 ? C.club : d > 0.55 ? '#fffaf0' : C.clubHi; }
    else if (face === 'down') c = C.clubBandLo;
    else { const t = y / Math.max(1, h - 1); c = t > 0.74 ? (y === h - 1 ? C.clubBandLo : C.clubBand) : ramp([C.clubHi, C.club, C.clubLo], t / 0.74, x, y); if (y === 0) c = C.clubHi; }
    p.px(x, y, c);
  }
  if (face === 'south' || face === 'west' || face === 'east') { p.px(1, 1, '#ffffff'); p.px(2, 1, '#ffffff'); p.px(1, 2, '#ffffff'); const y = Math.round((h - 1) * 0.74) - 1; for (let x = 1; x < w - 1; x++) if (x % 2) p.px(x, y, C.clubLo); }
};
const legP = layer(armour(C.leg, { top: C.legHi, bottom: C.legLo }), (p, w, h, face) => { if (face === 'up' || face === 'down') return; for (let x = 0; x < w; x++) p.px(x, 1, shift(C.legLo, -0.1)); });
const kneeP = armour(shift(C.leg, -0.08), { top: C.legHi, bottom: C.legLo, dots: 3 });
const footP = gradient([C.legHi, C.leg, C.legLo]);
const clawTipP = gradient(['#5a2a3a', '#2a1020']);
const hairBox = hair(C.hair, { lock: 3 });
const hairCapP = (p, w, h, face) => {    // the centre parting runs front to back over the crown
  hairBox(p, w, h, face);
  if (face !== 'up') return;
  const m = Math.floor(w / 2); for (let y = 0; y < h; y++) { p.px(m, y, C.hair.lo); p.px(m - 1, y, C.hair.hi); p.px(m + 1, y, C.hair.base); }
};
// the fringe hangs in two curtains from the parting, leaving a gap over the nose
const fringeP = (p, w, h, face) => {
  hair(C.hair, { lock: 3, tips: 5, seed: 11, band: 0.15 })(p, w, h, face);
  const m = (w - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.abs(x - m) < (y - h * 0.15) * 0.42) p.px(x, y, 0);
};
const hairTips = (seed) => hair(C.hair, { lock: 3, tips: 5, seed, band: 0.05 });
const beardP = hair(C.hair, { lock: 2 });
const beardTipP = (p, w, h) => { const m = (w - 1) / 2; for (let y = 0; y < h; y++) { const half = (w / 2) * (1 - (y / h) ** 1.4); for (let x = 0; x < w; x++) { const d = Math.abs(x - m); if (d > half) continue; p.px(x, y, d > half - 1 ? C.hair.lo : (x + (y >> 1)) % 3 === 0 ? C.hair.hi : C.hair.base); } } };
const stalkP = bands(C.stalk, { every: 2, lit: true });
const browP = armour(C.shell, { top: C.shellHi, bottom: C.shellDeep });
const ringP = (p, w, h, face) => { const rows = [C.ink, C.band[0], C.band[1], C.band[2], C.ink]; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' || face === 'down' ? C.ink : rows[Math.min(4, Math.floor(y * 5 / h))]); };
const scaleP = (p, w, h) => {        // the antennal scale: an orange paddle with a magenta fringe and setae lines
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot((x - cx) / (w / 2), (y - cy) / (h / 2)); if (d > 1) continue;
    p.px(x, y, d > 0.82 ? C.scaleEdge : (x + y) % 4 === 0 && d > 0.3 ? C.scaleHi : ramp([C.scaleHi, C.scale, shift(C.scale, -0.2)], d, x, y));
  }
};
const antP = bands(['#ffb43a', '#fff0c8'], { every: 2 });
const lipP = layer(armour(shift(C.shell, -0.06), { top: C.shell, bottom: C.shellDeep }), (p, w, h, face) => { if (face !== 'south') return; for (let x = 1; x < w - 1; x += 2) p.px(x, h - 1, C.bristle); });
const rostrumP = armour(C.shell, { top: C.shellHi, bottom: C.shellLo, keel: true });
const jawP = layer(armour(shift(C.shell, -0.12), { top: C.shell, bottom: C.shellDeep }), (p, w, h, face) => { if (face === 'up') for (let x = 1; x < w - 1; x += 2) p.px(x, h - 1, C.bristle); });
const mouthIn = (p, w, h) => { p.rect(0, 0, w, h, C.mouth); p.rect(1, 0, w - 2, Math.max(1, h - 1), '#4a1430'); };
const beltP = (p, w, h, face) => {
  shade(C.belt, { top: C.beltHi, bottom: C.beltLo, grain: 0 })(p, w, h, face);
  if (face === 'up' || face === 'down') return;
  const m = Math.floor(h / 2); for (let x = 0; x < w; x++) { p.px(x, m, C.beltStripe); if (x % 3 === 1) p.px(x, m - 1, shift(C.beltStripe, 0.3)); }
};
// the buckle: chrome with a little orange flying saucer on it
const buckleP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? '#ffffff' : ramp(['#ffffff', '#d8deea', '#8a92aa'], y / Math.max(1, h - 1), x, y));
  if (face !== 'south') return;
  const cx = Math.floor(w / 2);
  p.px(cx - 1, 1, '#ffd23a'); p.px(cx, 1, '#ffd23a'); for (let x = cx - 3; x <= cx + 2; x++) p.px(x, 2, '#ff7a2a'); p.px(cx - 2, 3, '#c04a1a'); p.px(cx + 1, 3, '#c04a1a');
};
const fanP = blade(C.fan, { eye: true, spines: true });
const telsonP = (p, w, h, face) => { armour('#2a4ac8', { top: '#6a8aff', bottom: '#1a2a7a', keel: true })(p, w, h, face); if (face === 'up') for (let x = 0; x < w; x += 2) p.px(x, 0, C.fan.spine); };
const pleoP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (y > h - 2 && x % 2) continue; p.px(x, y, (x + y) % 3 === 0 ? '#ffb0c8' : y < 2 ? '#c8386a' : '#ff6c8e'); } };

// ---------------------------------------------------------------- the model
const EM = eyeMap(EYEP);
const eyeStates = () => Object.keys(EYE_ROWS).filter((k) => k !== 'closed').map((k) => B(-4.333, 21.8, 3.45, -0.667, 26.133, 3.45, grid(EYE_ROWS[k], EM), { plane: 'z', id: 'eye-' + k, hide: k !== 'glare' }));
const RIGHT = {
  thigh: { name: 'thighR', parent: 'root', pivot: [-2.8, 7.4, -0.6], cubes: [B(-4.0, 4.0, -1.8, -1.6, 7.8, 0.6, legP)] },
  shin: { name: 'shinR', parent: 'thighR', pivot: [-2.8, 4.2, -0.6], cubes: [
    B(-4.15, 3.4, -1.95, -1.45, 5.0, 0.75, kneeP),
    B(-3.8, 1.0, -1.5, -1.8, 4.2, 0.3, legP),
  ] },
  foot: { name: 'footR', parent: 'shinR', pivot: [-2.8, 1.2, -0.6], cubes: [
    B(-4.0, 0, -2.2, -1.6, 1.4, 1.4, footP),
    B(-3.7, 0, 1.4, -1.9, 1.0, 2.9, footP),
    B(-3.4, 0, 2.9, -2.2, 0.67, 3.8, clawTipP),
    B(-3.4, 0, -3.0, -2.2, 0.8, -2.2, clawTipP),
  ] },
  shoulder: { name: 'coxaR', parent: 'body', pivot: [-4.4, 13.2, 1.0], cubes: [B(-5.0, 12.1, -0.2, -3.6, 14.5, 2.2, armP)] },
  arm: { name: 'armR', parent: 'body', pivot: [-4.4, 13.2, 1.0], rot: [26, 0, 0], cubes: [B(-6.0, 11.9, -0.2, -3.4, 14.5, 5.0, armP)] },
  fore: { name: 'foreR', parent: 'armR', pivot: [-4.7, 13.2, 4.4], rot: [-30, 0, 0], cubes: [
    B(-5.9, 12.0, 3.2, -3.5, 17.4, 5.6, foreP),
    B(-5.5, 12.4, 5.6, -3.9, 16.6, 6.1, armP),                      // the folded dactyl blade along the front
  ] },
  club: { name: 'clubR', parent: 'foreR', pivot: [-4.7, 17.0, 4.4], cubes: [
    B(-6.5, 16.6, 2.6, -2.9, 20.4, 6.4, clubP),
    B(-6.2, 16.2, 2.9, -3.2, 20.8, 6.1, clubP),
    B(-6.85, 17.0, 2.9, -2.55, 20.0, 6.1, clubP),
  ] },
  stalk: { name: 'stalkR', parent: 'head', pivot: [-2.5, 20.4, 1.6], cubes: [
    B(-3.1, 20.0, 1.0, -1.9, 22.2, 2.2, stalkP),
    B(-4.333, 21.8, -0.233, -0.667, 26.133, 3.433, eyeballP(EYEP)),
    B(-4.5, 22.8, -0.4, -0.5, 24.467, 3.433, ringP),
    B(-4.5, 21.65, -0.4, -0.5, 26.3, 3.6, eyeShutP(EYEP), { id: 'eye-shut', hide: true }),
    ...eyeStates(),
  ] },
  brow: { name: 'browR', parent: 'stalkR', pivot: [-2.5, 26.0, 0.2], rot: [12, 0, -10], cubes: [B(-4.6, 25.9, 0.0, -0.4, 26.7, 3.95, browP)] },
  scale: { name: 'scaleR', parent: 'head', pivot: [-4.2, 16.8, 3.6], rot: [-6, 26, -32], cubes: [B(-8.0, 16.8, 2.0, -4.2, 16.8, 6.2, scaleP, { plane: 'y' })] },
  ant: { name: 'antR', parent: 'head', pivot: [-4.0, 18.6, 3.6], rot: [-14, 0, 30], cubes: [B(-4.33, 18.6, 3.27, -3.67, 22.6, 3.93, antP)] },
  ant2: { name: 'ant2R', parent: 'antR', pivot: [-4.0, 22.6, 3.6], rot: [-28, 0, -8], cubes: [B(-4.27, 22.6, 3.33, -3.73, 25.8, 3.87, antP), B(-4.4, 25.6, 3.2, -3.6, 26.4, 4.0, shade(C.scaleEdge))] },
  hair: { name: 'hairR', parent: 'head', pivot: [-4.7, 20.6, 0.0], cubes: [
    B(-5.3, 14.6, -3.6, -4.6, 21.0, 2.8, hairBox),
    B(-4.95, 11.4, -3.4, -4.95, 14.8, 2.4, hairTips(3), { plane: 'x' }),
  ] },
  pleo: { name: 'pleoR', parent: 'tail1', pivot: [-1.4, 5.4, -4.8], cubes: [B(-2.8, 3.2, -4.8, -0.4, 5.4, -4.8, pleoP, { plane: 'z' })] },
};
export const def = {
  name: 'foopod', ppu: 3, scale: 0.34, outline: { color: C.ink, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...both(RIGHT.thigh, RIGHT.shin, RIGHT.foot),
    { name: 'body', parent: 'root', pivot: [0, 7.6, -0.4], cubes: [
      B(-4.2, 6.2, -3.4, 4.2, 14.8, 3.0, shellP),
      B(-4.6, 7.6, -2.8, 4.6, 13.4, 2.4, shellP),
      // the rainbow: a stack of chest plates, yellow → orange → red → magenta
      B(-3.8, 12.6, 2.4, 3.8, 14.6, 3.9, plates[0]),
      B(-3.7, 10.7, 2.4, 3.7, 12.7, 3.8, plates[1]),
      B(-3.6, 8.8, 2.4, 3.6, 10.8, 3.7, plates[2]),
      B(-3.4, 7.4, 2.4, 3.4, 8.9, 3.5, plates[3]),
      // the back: keeled plates running green → teal → blue into the tail
      B(-3.8, 12.4, -3.95, 3.8, 14.6, -3.0, backPs[0]),
      B(-3.7, 10.2, -3.85, 3.7, 12.5, -3.0, backPs[1]),
      B(-3.6, 8.0, -3.75, 3.6, 10.3, -3.0, backPs[2]),
      // waistband with the ray gun tucked in, and its saucer buckle
      B(-4.8, 6.0, -3.8, 4.8, 7.6, 3.6, beltP),
      B(-1.0, 5.85, 3.5, 1.0, 7.75, 4.0, buckleP),
    ] },
    { name: 'gunH', parent: 'body', pivot: [5.2, 7.4, 0.2], rot: [96, 0, -14], cubes: rayGun([5.2, 7.4, 0.2], 'gun-h', { k: 0.78 }) },
    { name: 'head', parent: 'body', pivot: [0, 14.6, 0.2], cubes: [
      B(-4.4, 14.4, -3.2, 4.4, 19.8, 3.8, shellP, { faces: { south: faceP } }),
      B(-3.8, 19.6, -2.8, 3.8, 20.2, 3.2, shellP),
      B(-0.8, 16.6, 3.7, 0.8, 18.4, 4.4, rostrumP),
      B(-2.6, 15.2, 3.7, 2.6, 16.6, 4.5, lipP),
      // the mop: a centre-parted cap, a fringe in two curtains, long hair down the back
      B(-4.75, 19.6, -3.7, 4.75, 21.0, 3.75, hairCapP),
      B(-4.6, 17.4, 3.92, 4.6, 21.0, 3.92, fringeP, { plane: 'z' }),
    ] },
    { name: 'hairB', parent: 'head', pivot: [0, 20.6, -3.7], cubes: [
      B(-4.75, 13.2, -4.4, 4.75, 21.0, -3.7, hairBox),
      B(-4.5, 10.0, -4.05, 4.5, 13.4, -4.05, hairTips(9), { plane: 'z' }),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 15.3, 3.0], cubes: [
      B(-2.2, 14.0, 2.6, 2.2, 15.3, 4.5, jawP),
      B(-2.0, 15.2, 2.8, 2.0, 15.5, 4.3, mouthIn, { outline: false }),
    ] },
    { name: 'beard', parent: 'jaw', pivot: [0, 14.2, 4.0], cubes: [
      B(-1.5, 12.8, 3.4, 1.5, 14.3, 4.6, beardP),
      B(-1.3, 10.6, 4.05, 1.3, 13.0, 4.05, beardTipP, { plane: 'z' }),
      B(0, 10.6, 3.4, 0, 13.0, 4.7, beardTipP, { plane: 'x' }),
    ] },
    ...both(RIGHT.stalk, RIGHT.brow, RIGHT.scale, RIGHT.ant, RIGHT.ant2, RIGHT.hair),
    ...both(RIGHT.shoulder, RIGHT.arm, RIGHT.fore, RIGHT.club),
    { name: 'gunG', parent: 'clubL', pivot: [4.7, 18.2, 2.6], rot: [-90, 0, 0], cubes: rayGun([4.7, 18.2, 2.6], 'gun-g', { k: 0.78 }).map((c) => ({ ...c, hide: true })) },
    { name: 'tail1', parent: 'body', pivot: [0, 7.2, -3.0], rot: [-38, 0, 0], cubes: [B(-3.0, 5.4, -7.4, 3.0, 8.8, -2.6, tailPs[0])] },
    { name: 'tail2', parent: 'tail1', pivot: [0, 7.1, -7.2], rot: [-12, 0, 0], cubes: [B(-2.6, 5.6, -11.0, 2.6, 8.6, -7.0, tailPs[1])] },
    { name: 'fan', parent: 'tail2', pivot: [0, 7.1, -10.8], rot: [84, 0, 0], cubes: [
      B(-1.3, 6.75, -15.2, 1.3, 7.45, -10.6, telsonP),
      B(-6.0, 7.1, -14.8, -1.2, 7.1, -10.6, fanP, { plane: 'y', pivot: [-1.2, 7.1, -10.8], rot: [0, -16, 0] }),
      B(1.2, 7.1, -14.8, 6.0, 7.1, -10.6, fanP, { plane: 'y', mirror: true, pivot: [1.2, 7.1, -10.8], rot: [0, 16, 0] }),
    ] },
    ...both(RIGHT.pleo),
  ],
};
// fix the fan blades: the painter draws the blade root at row 0, which for a 'y' plane is the back edge
// (handled by orientation; see the atlas)

// ---------------------------------------------------------------- animation
const stance = legRig({ body: [0, 7.6, -0.4], hip: [-2.8, 7.4, -0.6], ankle: [-2.8, 1.2, -0.6], L1: 3.2, L2: 3.0 });
const CLUB = { R: [-4.7, 20.6, 4.5], L: [4.7, 20.6, 4.5] };       // the striking pad (top of the club)
const MOUTH = [0, 15.0, 4.6];
const GUNG = [4.7, 18.2, 2.6], GUNK = 0.78, MZ = [GUNG[0] + MUZZLE[0] * GUNK, GUNG[1] + MUZZLE[1] * GUNK, GUNG[2] + MUZZLE[2] * GUNK];
// punch: k 0 = guard → 1 = arm thrown straight out in front; yaw turns the punch toward the centre line
function punch(P, S, k, yaw = 10, up = 0) {
  const g = S === 'R' ? 1 : -1;
  P.rot('arm' + S, (-26 - up) * k, g * yaw * k, 0).rot('fore' + S, 120 * k, 0, 0).rot('club' + S, 8 * k, 0, 0);
}
// cock a club back by the cheek (anticipation)
function cock(P, S, k) {
  const g = S === 'R' ? 1 : -1;
  P.rot('arm' + S, 18 * k, -g * 22 * k, -g * 10 * k).rot('fore' + S, -26 * k, 0, 0).rot('club' + S, -10 * k, 0, 0);
}
// the eye stalks, each on its own: yaw/pitch per side
function eyes(P, rY, rP, lY, lP, tilt = 0) { P.rot('stalkR', rP, rY, tilt).rot('stalkL', lP, lY, -tilt); }
function antTwitch(P, t, k = 1) {
  P.rot('antR', -10 * bump(t % 1, 0.32, 0.4) * k, 0, 6 * bump(t % 1, 0.32, 0.42) * k).rot('antL', -10 * bump((t + 0.43) % 1, 0.32, 0.4) * k, 0, -6 * bump((t + 0.43) % 1, 0.32, 0.42) * k);
}

export const anim = {
  start: 'idle', seed: 13,
  breathe: { bone: 'body', amp: 0.016, per: 2.2 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.4, 5.2], dur: 0.12 },
  look: { bone: 'head', yaw: 26, pitch: 12, speed: 6 },
  springs: [
    { bone: 'hairR', tip: [0, -7, 0], k: 120, d: 8, gain: 1.0, max: 32, axes: [1, 0.3, 1] },
    { bone: 'hairL', tip: [0, -7, 0], k: 125, d: 8, gain: 1.0, max: 32, axes: [1, 0.3, 1] },
    { bone: 'hairB', tip: [0, -8, -0.5], k: 110, d: 8, gain: 1.0, max: 34, axes: [1, 0.3, 1] },
    { bone: 'beard', tip: [0, -3, 0.4], k: 180, d: 9, gain: 0.8, max: 24 },
    { bone: 'antR', tip: [0, 4, 0], k: 210, d: 8, gain: 0.7, max: 20 },
    { bone: 'antL', tip: [0, 4, 0], k: 215, d: 8, gain: 0.7, max: 20 },
    { bone: 'ant2R', tip: [0, 3.2, 0], k: 170, d: 6, gain: 1.0, max: 30 },
    { bone: 'ant2L', tip: [0, 3.2, 0], k: 175, d: 6, gain: 1.0, max: 30 },
    { bone: 'scaleR', tip: [-3.6, 0, 1], k: 240, d: 10, gain: 0.6, max: 16 },
    { bone: 'scaleL', tip: [3.6, 0, 1], k: 240, d: 10, gain: 0.6, max: 16 },
    { bone: 'stalkR', tip: [0, 4.5, 0], k: 260, d: 11, gain: 0.5, max: 14 },
    { bone: 'stalkL', tip: [0, 4.5, 0], k: 260, d: 11, gain: 0.5, max: 14 },
    { bone: 'fan', tip: [0, 0, -4.4], k: 160, d: 8, gain: 0.9, max: 22 },
    { bone: 'pleoR', tip: [0, -2, 0], k: 200, d: 8, gain: 0.8, max: 26 },
    { bone: 'pleoL', tip: [0, -2, 0], k: 200, d: 8, gain: 0.8, max: 26 },
  ],
  faces: {
    eyes: { default: 'glare', states: { ...Object.fromEntries(Object.keys(EYE_ROWS).filter((k) => k !== 'closed').map((k) => [k, ['eye-' + k]])), closed: ['eye-shut'] } },
    gun: { default: 'holster', states: { holster: ['gun-h'], hand: ['gun-g'] } },
  },
  fidget: { every: [4.5, 8], clips: ['airdrum', 'hairflip', 'shadowbox'] },
  clips: {
    // up on its toes, bouncing like a boxer: weight rocking side to side, clubs riding the bounce a beat
    // late, eyes flicking about on their own (mantis-shrimp saccades), antennae twitching, mandibles working
    idle: { len: 2.0, loop: true, f(P, t) {
      const b = bounce(t, 0.5, { squash: 0.07, stretch: 0.035 }), sway = wave(t, 0.5), dy = -0.75 + b.u * 1.0;
      stance(P, { dy, dx: 0.45 * sway, rz: -2.4 * sway, rx: 5, ry: 7 * wave(t, 0.5, 1.2) });
      P.sq('body', b.sq);
      const lag = bounce(t - 0.07, 0.5).u;
      for (const [S, ph] of [['R', 0], ['L', Math.PI]]) {
        const g = S === 'R' ? 1 : -1, pump = wave(t, 1, ph);
        P.rot('arm' + S, 5 - lag * 6 + pump * 2, g * 3 * pump, 0).rot('fore' + S, -4 + lag * 4, 0, 0).rot('club' + S, -6 * lag, 0, g * 3 * pump);
      }
      P.rot('head', 2 - b.u * 3, -5 * sway, 2 * wave(t, 0.5, 1));
      eyes(P, saccade(t, [[0, 0], [0.35, 22], [0.9, -8], [1.3, 16], [1.75, -4]]), saccade(t, [[0, 0], [0.62, -10], [1.05, 5], [1.55, -6]]),
        saccade(t, [[0, 0], [0.18, -16], [0.7, 10], [1.2, -22], [1.6, 6]]), saccade(t, [[0, 4], [0.45, -8], [1.0, 0], [1.4, 8]]));
      antTwitch(P, t * 1.5);
      P.rot('scaleR', 0, 0, -8 * bump(t, 0.9, 1.05)).rot('scaleL', 0, 0, 8 * bump(t, 1.6, 1.75));
      P.rot('jaw', 3 + 3 * Math.max(0, wave(t, 2)));
      P.rot('tail1', 0, -4 * sway, 0).rot('fan', 5 * b.u + 3 * wave(t, 1, 1), 0, 0);
      P.stream(FX.bub, 'jaw', MOUTH, { rate: 0.8, dir: [0, 1, 0.4], speed: 0.25, spread: 0.4, scale: 0.6 });
    } },
    // a bouncy boxer's shuffle: quick steps, guard up, tail fan swishing
    walk: { len: 0.7, loop: true, f(P, t) {
      const u = t / 0.7, s = Math.sin(u * Math.PI * 2), bob = Math.abs(Math.cos(u * Math.PI * 2));
      const fR = step(u, 1.5, 1.4), fL = step(u + 0.5, 1.5, 1.4);
      stance(P, { dy: -0.9 + 0.7 * bob, rx: 8, rz: -3 * s, ry: 6 * s, dx: 0.4 * s, f: { R: [0, fR[0], fR[1]], L: [0, fL[0], fL[1]] }, toe: { R: -12 * Math.max(0, fR[0]), L: -12 * Math.max(0, fL[0]) } });
      P.sq('body', -0.04 * (1 - bob));
      P.rot('armR', -3 * s, 0, 0).rot('armL', 3 * s, 0, 0).rot('clubR', -4 * bob, 0, 0).rot('clubL', -4 * bob, 0, 0);
      P.rot('head', 3 - 3 * bob, -4 * s, 2 * s);
      eyes(P, 6 * s, -4, -6 * s, -4);
      P.rot('tail1', 0, 8 * s, 0).rot('fan', 6 * bob, 0, 0);
      antTwitch(P, t * 2);
      P.burst(0.02, 'dust', 'root', [-2.8, 0.4, 0.5], { n: 1, speed: 0.3, scale: 0.5 }).burst(0.37, 'dust', 'root', [2.8, 0.4, 0.5], { n: 1, speed: 0.3, scale: 0.5 });
    } },
    // entrance: drops into a crouch, then throws the clubs wide in the mantis' meral-spread threat
    // display and roars; the fan and scales flare, bubbles boil from its jaws; it clacks its clubs together
    cry: { len: 2.0, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.32, E.inout) * (1 - seg(t, 0.32, 0.44, E.out)), up = seg(t, 0.36, 0.56, E.back) * (1 - seg(t, 1.28, 1.5, E.inout));
      const clack = seg(t, 1.46, 1.58, E.in3) * (1 - seg(t, 1.66, 1.95, E.inout));
      const tr = wave(t, 13) * up;
      stance(P, { dy: -2.2 * crouch + 0.9 * up - 0.5 * clack, rx: 14 * crouch - 12 * up + 4 * clack, rz: tr * 0.8 });
      P.sq('body', -0.1 * crouch + 0.07 * up * (1 - seg(t, 0.56, 0.75)) + wob(t, 1.58, -0.05, 4, 6));
      for (const S of ['R', 'L']) {
        const g = S === 'R' ? 1 : -1;
        P.rot('arm' + S, 20 * crouch - 70 * up, -g * 30 * up, -g * (8 * crouch + 60 * up) + tr * 2).rot('fore' + S, -20 * crouch + 50 * up, 0, -g * 20 * up).rot('club' + S, 0, 0, -g * 25 * up);
        P.rot('arm' + S, -10 * clack, g * 26 * clack, g * 4 * clack).rot('fore' + S, 20 * clack, 0, 0);
        P.rot('scale' + S, 0, 0, -g * 22 * up).rot('stalk' + S, -10 * up, g * 8 * up, -g * 22 * up + tr);
      }
      P.rot('head', 12 * crouch - 26 * up + tr * 2, 0, 0).rot('jaw', 6 * crouch + 38 * up);
      P.rot('fan', 30 * up, 0, 0).rot('tail1', 10 * crouch - 6 * up, 0, 0);
      P.face('eyes', crouch > 0.3 ? 'focus' : up > 0.3 ? 'wide' : undefined); P.blinkOK = false;
      if (t > 0.52 && t < 1.3) P.stream(FX.bub, 'jaw', MOUTH, { rate: 40, dir: [0, 0.6, 1], speed: 0.9, spread: 0.6 }).stream('bubble', 'jaw', MOUTH, { rate: 8, dir: [0, 0.8, 1], speed: 1.2, spread: 0.6, scale: 0.7 });
      P.burst(0.54, FX.ring, 'jaw', MOUTH, { scale: 0.7 }).burst(0.6, 'anger', 'head', [-6, 25, 3], {}).burst(0.72, 'anger', 'head', [6, 24, 3], {});
      P.burst(1.58, 'spark', 'body', [0, 20, 9], { n: 3 }).burst(1.58, FX.flash, 'body', [0, 20, 9], { scale: 0.45 });
    } },
    // attack (physical): cock back… and the club snaps out faster than a blink; the water cavitates —
    // a white flash, a ring and a spray of collapsing bubbles where it lands
    attack: { len: 0.9, next: 'idle', f(P, t) {
      const wind = seg(t, 0, 0.22, E.out) * (1 - seg(t, 0.22, 0.26, E.in));
      const hit = seg(t, 0.22, 0.26, E.out3) * (1 - seg(t, 0.44, 0.82, E.inout));
      const shake = t > 0.26 && t < 0.42 ? wave(t, 22) * (0.42 - t) * 6 : 0;
      stance(P, { dy: -1.2 * wind - 0.6 * hit, dz: -0.8 * wind + 2.2 * hit, rx: 6 * wind + 10 * hit, ry: 22 * wind - 24 * hit, f: { R: [0, 0, 0.6 * hit], L: [0, 0, -0.4 * hit] } });
      P.sq('body', -0.06 * wind + wob(t, 0.26, 0.06, 5, 8));
      cock(P, 'R', wind); punch(P, 'R', hit, 14, 4);
      P.rot('armR', shake, 0, 0);
      cock(P, 'L', 0.3 * hit);
      P.rot('head', 6 * wind - 6 * hit, -10 * wind + 14 * hit, 0).rot('jaw', 22 * hit);
      eyes(P, 6 * hit, 4 * wind, -6 * hit, 4 * wind);
      P.face('eyes', wind > 0.1 || hit > 0.1 ? 'focus' : undefined); P.blinkOK = false;
      P.rot('fan', 20 * hit, 0, 0);
      const pad = CLUB.R;
      P.burst(0.26, FX.flash, 'clubR', pad, {}).burst(0.26, FX.ring, 'clubR', pad, {}).burst(0.27, FX.ring, 'clubR', pad, { scale: 0.55 });
      P.burst(0.26, FX.bub, 'clubR', pad, { n: 16, speed: 1.2 }).burst(0.26, 'spark', 'clubR', pad, { n: 3 }).burst(0.3, 'bubble', 'clubR', pad, { n: 5, speed: 0.8, scale: 0.6 });
    } },
    // special (ray gun): whips the toy blaster out of its waistband, twirls it, squares up side-on and
    // fires three pulses of rings; blows… well, bubbles off the muzzle, twirls it back in
    special: { len: 2.3, next: 'idle', f(P, t) {
      const reach = seg(t, 0.02, 0.22, E.inout) * (1 - seg(t, 0.26, 0.42, E.out));
      const twirl = seg(t, 0.32, 0.62, E.inout), aim = seg(t, 0.55, 0.75, E.back) * (1 - seg(t, 1.78, 2.05, E.inout));
      const stow = bump(t, 1.95, 2.2);
      const kicks = [0.86, 1.08, 1.3].reduce((s, k) => s + wob(t, k, 1, 3, 9) * (t > k ? 1 : 0), 0);
      const drawn = t > 0.26 && t < 2.08;
      stance(P, { dy: -0.8 - 0.6 * reach, ry: -30 * aim, rx: 4 + 6 * reach, rz: 4 * reach });
      // left club: down to the hip… up into a twirl… out at arm's length
      P.rot('armL', 70 * reach - 50 * stow, 10 * reach, 20 * reach).rot('foreL', 70 * reach + 40 * stow, 0, 0);
      P.rot('armL', -40 * twirl * (1 - aim), 0, 0).rot('foreL', 40 * twirl * (1 - aim), 0, 0);
      punch(P, 'L', aim, -28, 6); P.rot('armL', -8 * kicks, 0, 0).rot('foreL', -6 * kicks, 0, 0);
      P.rot('gunG', 360 * seg(t, 0.36, 0.6, E.inout) - 360 * seg(t, 1.86, 2.04, E.inout), 0, 0);
      cock(P, 'R', 0.5 * aim);
      P.rot('head', -4 * aim, 18 * aim, 0);
      eyes(P, -10 * aim, 0, -16 * aim, 0, 4 * aim);
      P.face('gun', drawn ? 'hand' : 'holster').face('eyes', aim > 0.5 ? 'focus' : t > 1.8 && t < 2.1 ? 'smug' : undefined); P.blinkOK = false;
      if (t > 0.8 && t < 1.45) P.stream(FX.zap, 'gunG', MZ, { rate: 140, dir: [0, 0, 1], spread: 0.03 });
      for (const k of [0.86, 1.08, 1.3]) P.burst(k, FX.zapring, 'gunG', MZ, { n: 3, dir: [0, 0, 1], spread: 0.02 }).burst(k, 'spark', 'gunG', MZ, { n: 1, scale: 0.5 }).burst(k + 0.06, FX.zapring, 'gunG', MZ, { n: 2, dir: [0, 0, 1], spread: 0.02 });
      if (t > 1.45 && t < 1.85) P.stream('steam', 'gunG', MZ, { rate: 10, dir: [0, 1, 0], spread: 0.4, scale: 0.5 });
      P.burst(0.3, 'sparkle', 'clubL', CLUB.L, { n: 4, speed: 0.6 });
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.06, E.out) * (1 - seg(t, 0.2, 0.65, E.inout));
      stance(P, { dz: -2.2 * k, dy: -0.9 * k, rx: -16 * k + wob(t, 0.16, 4, 3, 6), rz: wave(t, 15) * 4 * k, f: { R: [0, 1.2 * bump(t, 0.05, 0.25), -0.8 * k], L: [0, 0, -0.6 * k] } });
      P.sq('body', -0.12 * k);
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, -30 * k, 0, -g * 34 * k).rot('fore' + S, 30 * k, 0, 0); P.rot('stalk' + S, -14 * k, 0, -g * 18 * k); }
      P.rot('head', -16 * k, 0, 8 * k).rot('jaw', 30 * k).rot('fan', 26 * k, 0, 0);
      P.face('eyes', t < 0.4 ? 'x' : undefined); P.blinkOK = false;
      P.burst(0.02, 'spark', 'body', [0, 12, 6], { n: 2 }).burst(0.02, 'star', 'head', [0, 24, 2], { n: 3 }).burst(0.03, FX.bub, 'body', [0, 12, 5], { n: 8, speed: 1 });
    } },
    // reels, eyes spinning on their stalks… and topples over sideways, little legs in the air
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce);
      stance(P, { dy: -1.2 * dizzy, rz: wave(t, 1.6) * 8 * dizzy, ry: wave(t, 1.1) * 14 * dizzy, rx: 6 * dizzy });
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, 30 * dizzy, 0, -g * 10 * dizzy).rot('fore' + S, 20 * dizzy, 0, 0); P.rot('stalk' + S, 0, wave(t, 2.2, g) * 30 * dizzy, -g * 18 * dizzy); }
      if (fall > 0) knockedOut(P, fall, t);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.4, 'star', 'head', [0, 27, 0], { n: 5 }).burst(1.4, 'dust', 'root', [-8, 1, 0], { n: 10, spread: 1, speed: 1.2 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      knockedOut(P, 1, t);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.4;
      P.burst(0.5, FX.bub, 'jaw', MOUTH, { n: 2, dir: [0, 1, 0], speed: 0.4 }).burst(1.7, FX.bub, 'jaw', MOUTH, { n: 1, dir: [0, 1, 0], speed: 0.4 });
    } },
    // victory — "learn to fly": a big leap, pleopods and tail fan beating like mad to hang in the air,
    // a club pumped at the sky; it lands, squashes, and smacks its clubs together
    win: { len: 2.2, next: 'idle', f(P, t) {
      const h = t < 1.2 ? hop(t, 1.2, 9, { crouch: 1.8, air: [0.24, 0.8] }) : { y: wob(t, 1.2, -1.4, 3, 6), sq: wob(t, 1.2, -0.14, 3, 6), air: false };
      const hang = bump(t, 0.4, 0.96), flap = wave(t, 12) * (seg(t, 0.3, 0.4) - seg(t, 0.92, 1.0));
      const fist = seg(t, 0.35, 0.5, E.back) * (1 - seg(t, 1.25, 1.55, E.inout)), clack = bump(t, 1.55, 1.85);
      const air = Math.max(0, h.y) + 1.2 * hang;
      stance(P, { dy: Math.min(0, h.y) - 0.6, rx: -8 * fist });
      P.pos('root', 0, air, 0).sq('body', h.sq);
      if (air > 0) for (const S of ['R', 'L']) P.pos('thigh' + S, 0, 0, 0).rot('thigh' + S, 18 * Math.min(1, air), 0, 0).rot('shin' + S, -30 * Math.min(1, air), 0, 0);
      P.rot('armR', -120 * fist + wave(t, 6) * 8 * fist, 0, 10 * fist).rot('foreR', 40 * fist, 0, 0);
      P.rot('armL', -20 * fist, 0, -10 * fist);
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, -10 * clack, g * 24 * clack, 0).rot('fore' + S, 20 * clack, 0, 0); }
      P.rot('pleoR', 50 * flap, 0, 0).rot('pleoL', 50 * flap, 0, 0).rot('fan', 26 * flap + 20 * hang, 0, 0).rot('tail1', 10 * hang, 0, 0);
      P.rot('head', -14 * fist, 0, 0).rot('jaw', 24 * fist);
      eyes(P, 0, -12 * fist, 0, -12 * fist, 10 * fist);
      P.face('eyes', fist > 0.3 ? 'smug' : undefined); P.blinkOK = false;
      if (t > 0.36 && t < 0.98) P.stream(FX.bub, 'tail2', [0, 5, -11], { rate: 30, dir: [0, -1, -0.5], speed: 0.8, spread: 0.6 });
      P.burst(1.2, 'dust', 'root', [0, 0.5, 0], { n: 10, spread: 1, speed: 1.2 }).burst(1.7, 'spark', 'body', [0, 20, 9], { n: 2 }).burst(1.7, FX.flash, 'body', [0, 20, 9], { scale: 0.4 });
      P.burst(0.5, 'sparkle', 'clubR', CLUB.R, { n: 8, speed: 1.2 });
    } },
    // asleep: sat back on its tail, clubs folded in its lap, stalks drooping, a bubble swelling at its jaw
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * Math.PI * 2);
      stance(P, { dy: -2.6 + br * 0.25, dz: -0.6, rx: 14 + br * 2, f: { R: [0.4, 0, 1.4], L: [-0.4, 0, 1.4] } });
      P.sq('body', -0.04 + br * 0.03);
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, 34, g * 14, -g * 4).rot('fore' + S, 24, 0, 0).rot('club' + S, 10, 0, 0); P.rot('stalk' + S, 30 + br * 4, g * 10, -g * 26); P.rot('scale' + S, 0, 0, g * 20); }
      P.rot('head', 16 + br * 3, 0, 4).rot('jaw', 6 + Math.max(0, br) * 4).rot('fan', -20, 0, 0).rot('tail1', 14, 0, 0);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [3, 24, 4], {}).burst(1.6, 'z', 'head', [3, 24, 4], {});
      P.burst(2.4, 'bubble', 'jaw', MOUTH, { n: 1, dir: [0, 1, 0.2], speed: 0.3, scale: 0.8 });
    } },
    // fidget: an air-drum fill on invisible toms — faster and faster round the kit — and a crash
    airdrum: { len: 2.0, next: 'idle', f(P, t) {
      const hits = [0.2, 0.42, 0.6, 0.74, 0.86, 0.96, 1.06, 1.14, 1.22];
      const pos = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [0, 3], [1, 3], [0, 3]];
      const crash = seg(t, 1.3, 1.38, E.out3) * (1 - seg(t, 1.6, 1.95, E.inout));
      stance(P, { dy: -1.0 - 0.3 * crash, rx: 8 - 10 * crash, ry: 0 });
      hits.forEach((h, i) => {
        const S = pos[i][0] ? 'L' : 'R', g = S === 'R' ? 1 : -1, tom = pos[i][1], k = bump(t, h - 0.09, h + 0.06);
        const down = seg(t, h - 0.05, h, E.in) * (1 - seg(t, h + 0.01, h + 0.08, E.out));
        P.rot('arm' + S, -30 * k + 16 * down, g * (14 - tom * 10) * k, 0).rot('fore' + S, 40 * k + 30 * down, 0, 0);
        P.burst(h, 'note', 'club' + S, CLUB[S], { n: 1, scale: 0.7, speed: 0.6 });
      });
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, -60 * crash, -g * 20 * crash, -g * 50 * crash).rot('fore' + S, 30 * crash, 0, 0); }
      const nod = Math.abs(wave(t, 4.2)) * seg(t, 0.15, 0.3) * (1 - seg(t, 1.25, 1.35));
      P.rot('head', 10 * nod - 18 * crash, 0, 0).rot('jaw', 8 * nod + 30 * crash);
      P.face('eyes', crash > 0.3 ? 'wide' : t > 0.15 && t < 1.25 ? 'focus' : undefined); P.blinkOK = false;
      P.burst(1.34, 'spark', 'body', [0, 26, 4], { n: 3 }).burst(1.34, 'note', 'head', [0, 27, 2], { n: 4, speed: 1.4 }).burst(1.34, FX.ring, 'head', [0, 24, 4], { scale: 0.6 });
    } },
    // fidget: dips its head and whips the hair back out of its eyes, then a cocky shake
    hairflip: { len: 1.4, next: 'idle', f(P, t) {
      const dip = seg(t, 0, 0.25, E.inout) * (1 - seg(t, 0.25, 0.36, E.in3)), whip = seg(t, 0.26, 0.4, E.out) * (1 - seg(t, 0.8, 1.2, E.inout));
      stance(P, { dy: -0.8 - 0.6 * dip, rx: 16 * dip - 10 * whip });
      P.rot('head', 30 * dip - 34 * whip, 0, 0).rot('head', 0, wave(t, 5) * 10 * seg(t, 0.85, 0.95) * (1 - seg(t, 1.1, 1.3)), 0);
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, 8 * dip - 12 * whip, 0, -g * 10 * whip); P.rot('stalk' + S, 0, 0, -g * 14 * whip); }
      P.rot('jaw', 14 * whip);
      P.face('eyes', whip > 0.4 ? 'smug' : undefined); P.blinkOK = false;
      P.burst(0.36, FX.bub, 'head', [0, 22, -4], { n: 6, dir: [0, 0.5, -1], speed: 1 });
    } },
    // fidget: shadowboxing — jab, jab, cross at nothing in particular
    shadowbox: { len: 1.3, next: 'idle', f(P, t) {
      const j1 = bump(t, 0.12, 0.3), j2 = bump(t, 0.34, 0.52), cr = seg(t, 0.6, 0.68, E.out3) * (1 - seg(t, 0.8, 1.15, E.inout));
      stance(P, { dy: -0.9, ry: 10 * (j1 + j2) - 20 * cr, dz: 0.6 * (j1 + j2) + 1.2 * cr, rx: 6 });
      punch(P, 'L', 0.75 * (j1 + j2), -8); punch(P, 'R', cr, 12);
      P.rot('head', 0, 6 * (j1 + j2) - 10 * cr, 0);
      P.face('eyes', 'focus'); P.blinkOK = false;
      P.burst(0.21, FX.bub, 'clubL', CLUB.L, { n: 4, speed: 0.8 }).burst(0.43, FX.bub, 'clubL', CLUB.L, { n: 4, speed: 0.8 }).burst(0.68, FX.bub, 'clubR', CLUB.R, { n: 8, speed: 1 }).burst(0.68, FX.ring, 'clubR', CLUB.R, { scale: 0.5 });
    } },
  },
};
// knocked out on its side: legs kicked up, clubs flopped, stalks drooping, tail fan limp
function knockedOut(P, k, t = 0) {
  P.rot('root', 0, 0, 84 * k).pos('root', -7.6 * k, 4.6 * k, 0);
  for (const [S, g] of [['R', 1], ['L', -1]]) {
    P.rot('thigh' + S, (-40 + wave(t, 0.8, g) * 8) * k, 0, -g * 10 * k).rot('shin' + S, 50 * k, 0, 0);
    P.rot('arm' + S, 40 * k, 0, -g * 30 * k).rot('fore' + S, 50 * k, 0, 0);
    P.rot('stalk' + S, 30 * k, 0, (-g * 30 + wave(t, 0.6, g) * 6) * k);
  }
  P.rot('head', 0, 0, 10 * k).rot('jaw', 26 * k).rot('fan', -30 * k, 0, 0).rot('tail1', 0, 0, -10 * k);
}
def.anim = anim;
