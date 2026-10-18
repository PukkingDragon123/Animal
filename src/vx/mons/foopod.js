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
import { eyeRig, mouthRig, eyesAt, eyesScale, glance } from './eyes.js';
import { shade, gradient, layer, on, poly, ramp, shift, mix, h2 } from './kit.js';
import { denim, B, both, armour, spots, rainbowPlate, bands, hair, hairLocks, blade, grid, SHRIMP_EYE, eyeHousingP, rayGun, MUZZLE, FX, legRig, step, saccade, DRIP_FORM, clamp } from './shrimp_parts.js';

const C = {
  ink: '#120e1e',
  shell: '#25b07a', shellHi: '#86eeac', shellLo: '#157460', shellDeep: '#0c4450', spot: '#0f5446', sheen: '#62f2ff',
  rb: ['#ffd23a', '#ff922a', '#f2443a', '#e0388e'],
  back: ['#22a690', '#1d8fae', '#2a6cc8'], tail: ['#2a5ad0', '#4a40c6'],
  arm: '#e8467a', armHi: '#ff8cae', armLo: '#a8285e', armSpot: '#80184c',
  fore: '#ff6c8e', foreHi: '#ffa8c0', foreLo: '#c8386a',
  club: '#f6ead2', clubHi: '#ffffff', clubLo: '#d2b690', clubBand: '#ff7c9a', clubBandLo: '#c8386a',
  leg: '#ff8a2a', legHi: '#ffc860', legLo: '#c4501e',
  scale: '#ff9a2a', scaleHi: '#ffd060', scaleEdge: '#e0388e',
  hair: { base: '#2e2a5c', hi: '#5654a6', lo: '#17132f', sheen: '#8c96f4' },
  belt: '#24357a', beltHi: '#4060b8', beltLo: '#141e4a', beltStripe: '#ff8a2a',
  band: ['#ff3e9a', '#ffe23a', '#3ae8ff'],
  stalk: ['#ffb43a', '#f08a2c'], mouth: '#2a0c1e', bristle: '#fff0c8',
  fan: { root: '#2a5ad0', base: '#3a46c8', edge: '#ff6a3a', rim: '#ff9a3a', keel: '#1a2a7a', eye: '#ffd23a', eyeRing: '#16124a', eyeCore: '#ff3e9a', spine: '#fff0c8' },
};
const EYEP = { band: C.band, lid: C.shell };

// ---------------------------------------------------------------- painters
const shellP = layer(armour(C.shell, { top: C.shellHi, bottom: C.shellLo, dots: 6, sheen: C.sheen }), spots(C.spot, { every: 6, skip: 0.5, core: C.shellLo }));
const shellPlain = armour(C.shell, { top: C.shellHi, bottom: C.shellLo });
// the face: a shadow under the fringe, a paler muzzle round a hard, set mouth
const faceP = (p, w, h, face, cube) => {
  shellPlain(p, w, h, face, cube);
  if (face !== 'south') return;
  const m = (w - 1) / 2, my = h - Math.round(h * 0.17);
  for (let x = 0; x < w; x++) { p.px(x, Math.round(h * 0.3), C.shellLo); p.px(x, Math.round(h * 0.3) + 1, shift(C.shell, -0.1)); }
  for (let y = Math.round(h * 0.52); y < h - 1; y++) for (let x = 0; x < w; x++) { const d = Math.abs(x - m) / (w * 0.36) + Math.max(0, my - y) / (h * 0.4); if (d < 1) p.px(x, y, d > 0.82 && (x + y) & 1 ? C.shell : '#5ad49a'); }
  for (let x = Math.round(m - 4); x <= Math.round(m + 4); x++) p.px(x, my, C.mouth);
  p.px(Math.round(m - 5), my + 1, C.mouth); p.px(Math.round(m + 5), my + 1, C.mouth);
};
const plates = [...C.rb, '#a046d8'].map((c, i, a) => rainbowPlate(c, i ? a[i - 1] : '#ffffff'));
const saucerMark = (p, w, h, face) => {          // the line's marking: a pale flying saucer on the upper back
  if (face !== 'north') return;
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2);
  for (let x = cx - 6; x <= cx + 5; x++) { p.px(x, cy, '#c8fff0'); p.px(x, cy + 1, x % 3 ? '#7ae8d0' : '#ffffff'); }
  for (let x = cx - 3; x <= cx + 2; x++) p.px(x, cy - 1, '#c8fff0'); for (let x = cx - 2; x <= cx + 1; x++) p.px(x, cy - 2, '#ffffff');
  for (let k = 0; k < 3; k++) p.px(cx - 4 + k * 4, cy + 3, '#ffe23a');
};
const backPs = C.back.map((c, i) => layer(armour(c, { keel: true, sheen: C.back[i + 1] || C.tail[0], dots: 5, seed: i + 2 }), i === 1 ? saucerMark : () => {}));
const tailPs = C.tail.map((c, i) => armour(c, { keel: true, dots: 4, sheen: '#8ab0ff', seed: i + 7 }));
const armP = layer(armour(C.arm, { top: C.armHi, bottom: C.armLo }), spots(C.armSpot, { every: 4, skip: 0.42, core: C.armLo }));
const foreP = layer(armour(C.fore, { top: C.foreHi, bottom: C.foreLo }), spots(C.armLo, { every: 4, skip: 0.55 }));
// the smashing club: a pearly heel (white → cream → peach), a coral cuff at the wrist, the dactyl's joint
// creased into the front, and a white striking pad with a pearl sheen on top
const clubP = (p, w, h, face) => {
  const cuff = Math.round((h - 1) * 0.7);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c;
    if (face === 'up') { const d = Math.max(Math.abs(x - (w - 1) / 2) / (w / 2), Math.abs(y - (h - 1) / 2) / (h / 2)); c = d > 0.78 ? C.club : d > 0.5 ? ((x + y) % 3 === 0 ? '#d4f2ff' : '#fff8ee') : '#ffffff'; }
    else if (face === 'down') c = C.clubBandLo;
    else if (y > cuff) c = y === h - 1 ? C.clubBandLo : (x + y) % 4 === 0 ? shift(C.clubBand, 0.2) : C.clubBand;
    else if (y === cuff) c = C.clubLo;
    else c = y === 0 ? C.clubHi : y < cuff * 0.45 ? C.clubHi : y < cuff * 0.8 ? C.club : '#f0d2b4';
    p.px(x, y, c);
  }
  if (face === 'up' || face === 'down') return;
  p.px(1, 1, '#ffffff'); p.px(2, 2, '#ffffff');
  for (let k = 0; k < 3; k++) p.px(w - 2 - k, 2 + k, '#c4e8ff');                              // pearl sheen
  if (face === 'south') { const x = Math.round(w * 0.64); for (let y = 2; y < cuff; y++) p.px(x, y, '#e6c2a2'); }   // the dactyl's joint
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
const scaleP = (p, w, h) => {        // the antennal scale: an orange paddle with a magenta fringe and setae lines
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot((x - cx) / (w / 2), (y - cy) / (h / 2)); if (d > 1) continue;
    p.px(x, y, d > 0.82 ? C.scaleEdge : (x + y) % 4 === 0 && d > 0.3 ? C.scaleHi : ramp([C.scaleHi, C.scale, shift(C.scale, -0.2)], d, x, y));
  }
};
const antP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' || face === 'down' ? '#f0d8a8' : x === 0 ? '#fff0d0' : y % 5 === 0 ? '#c09060' : '#f0d8a8'); };   // the antennae are drumsticks
const jawP = layer(armour(shift(C.shell, -0.12), { top: C.shell, bottom: C.shellDeep }), (p, w, h, face) => { if (face === 'up') for (let x = 1; x < w - 1; x += 2) p.px(x, h - 1, C.bristle); });
const mouthIn = (p, w, h) => { p.rect(0, 0, w, h, C.mouth); p.rect(1, 0, w - 2, Math.max(1, h - 1), '#4a1430'); };
// the buckle: chrome with a little orange flying saucer on it
const fanOuter = blade(C.fan, { eye: true, spines: true, flip: true });
const fanInner = blade({ ...C.fan, root: '#2a6cc8', base: '#3a5ad8', edge: '#7a5ae8', rim: '#ffd23a' }, { spines: true, flip: true });
const spineP = gradient(['#fff0c8', '#ffb43a', '#c0501e']);
const telsonP = (p, w, h, face) => { armour('#2a4ac8', { top: '#6a8aff', bottom: '#1a2a7a', keel: true })(p, w, h, face); if (face === 'up') for (let x = 0; x < w; x += 2) p.px(x, 0, C.fan.spine); };
// ---------------------------------------------------------------- drip (accessories)
const ACC = {
  glove: '#e8283a', gloveHi: '#ff6a5a', gloveLo: '#9a1426', lace: '#ffffff',
  wood: '#e8c890', woodLo: '#b88a54', tee: '#1c1a24', teeHi: '#34303e', print: '#ff4aa8', print2: '#ffd23a',
  gtr: '#e0283a', gtrHi: '#ff6a5a', guard: '#f4f0e8', neck: '#6a3a1e', head: '#1c1a24', strap: '#2a2440',
  chrome: '#dfe4ee', chromeLo: '#7c84a0', orb: '#ffb04a', orbHi: '#fff4c8',
};
const gloveP = (p, w, h, face) => { shade(ACC.glove, { top: ACC.gloveHi, bottom: ACC.gloveLo, grain: 0 })(p, w, h, face); if (face !== 'up' && face !== 'down') { p.px(1, 1, '#ffd0c8'); p.px(2, 1, '#ffd0c8'); p.px(1, 2, '#ffd0c8'); } };
const cuffP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' || face === 'down' ? '#d8d8e4' : x % 3 === 1 && y > 0 && y < h - 1 ? '#c8283a' : '#ffffff'); };
const stickP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? '#ffffff' : y < 2 ? '#fff4dc' : x === 0 ? '#fff0c8' : (y % 5 === 0 ? ACC.woodLo : ACC.wood)); };
// the band tee: black, a pink flying saucer and yellow stars printed on the chest (no real logo)
const teeP = (p, w, h, face) => {
  shade(ACC.tee, { top: ACC.teeHi, bottom: '#0e0c14', grain: 0 })(p, w, h, face);
  if (face !== 'south' || w < 12) return;
  const cx = Math.floor(w / 2), cy = Math.floor(h * 0.42);
  for (let x = cx - 5; x <= cx + 5; x++) { p.px(x, cy, ACC.print); p.px(x, cy + 1, x % 2 ? ACC.print : '#ffffff'); }
  for (let x = cx - 2; x <= cx + 2; x++) p.px(x, cy - 1, ACC.print); for (let x = cx - 1; x <= cx + 1; x++) p.px(x, cy - 2, '#ffd0ec');
  for (const [dx, dy] of [[-4, 3], [-1, 4], [3, 3]]) p.px(cx + dx, cy + 1 + dy, ACC.print2);
  for (const [dx, dy] of [[-6, -3], [5, -3], [6, 0]]) p.px(cx + dx, cy + dy, ACC.print2);
};
const sleeveP = (p, w, h, face) => { shade(ACC.tee, { top: ACC.teeHi, bottom: '#0e0c14', grain: 0 })(p, w, h, face); if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) p.px(x, h - 1, ACC.print); };
const gtrP = (p, w, h, face) => { shade(ACC.gtr, { top: ACC.gtrHi, bottom: '#9a1426', grain: 0 })(p, w, h, face); if (face === 'north') { const cx = Math.floor(w / 2); for (let y = 2; y < h - 1; y++) for (let x = cx - 1; x <= cx + 1; x++) p.px(x, y, y % 4 === 1 ? '#c0c4d0' : ACC.guard); } };
const neckP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'north' && y % 3 === 0 ? '#d8dce8' : x === 0 ? '#8a5a2e' : ACC.neck); };
const darkP = shade(ACC.head, { top: '#3a3448', bottom: '#0e0c14', grain: 0 });
const strapP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 4 === 0 ? '#ff8a2a' : ACC.strap); };
const chromeP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? '#ffffff' : (x + y) % 2 ? ACC.chrome : (y % 2 ? '#a8b0c4' : '#ffffff')); };
const orbP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, x === 0 || y === 0 ? ACC.orbHi : ACC.orb); };
const cordP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, '#2a2440'); };
const A = (id) => ({ id, hide: true });
// gloves sit over the clubs (on the club bones, so they punch with them)
const GLOVE = [
  B(-6.95, 15.3, 2.2, -2.45, 19.4, 6.0, gloveP, A('acc-gloves')),
  B(-3.0, 15.9, 4.2, -2.2, 18.0, 5.8, gloveP, A('acc-gloves')),
  B(-6.6, 14.4, 2.4, -2.8, 15.5, 5.8, cuffP, A('acc-gloves')),
];
const JEANS_WAIST = [B(-4.75, 5.6, -3.75, 4.75, 7.7, 3.55, denim(), A('acc-jeans'))];
const JEANS_LEG = [B(-4.25, 3.6, -2.05, -1.35, 7.9, 0.85, denim({ rip: true, cuff: true }), A('acc-jeans'))];
const NECKLACE = [
  ...[-1, 1].map((g) => B(-0.17, 10.3, 3.92, 0.17, 16.0, 4.22, cordP, { pivot: [0, 10.3, 4.07], rot: [0, 0, -g * 39], ...A('acc-ufo') })),
  ...[-1, 1].flatMap((g) => [B(g * 1.25 - 0.35, 11.5, 3.9, g * 1.25 + 0.35, 12.2, 4.6, orbP, { glow: true, ...A('acc-ufo') }), B(g * 2.5 - 0.35, 13.0, 3.8, g * 2.5 + 0.35, 13.7, 4.5, orbP, { glow: true, ...A('acc-ufo') })]),
  B(-1.2, 9.4, 3.8, 1.2, 9.85, 4.6, chromeP, A('acc-ufo')),
  B(-0.55, 9.85, 3.95, 0.55, 10.4, 4.45, orbP, { glow: true, ...A('acc-ufo') }),
  B(-0.35, 9.0, 4.0, 0.35, 9.4, 4.4, orbP, { glow: true, ...A('acc-ufo') }),
];
const TEE = [
  B(-4.3, 8.4, 3.95, 4.3, 14.8, 4.25, teeP, A('acc-tee')),
  B(-4.3, 8.4, -4.25, 4.3, 14.8, -3.95, teeP, A('acc-tee')),
  B(-5.1, 8.4, -3.95, -4.8, 14.8, 3.95, teeP, A('acc-tee')),
  B(4.8, 8.4, -3.95, 5.1, 14.8, 3.95, teeP, A('acc-tee')),
  B(-5.6, 11.4, -0.7, -3.7, 14.7, 2.6, sleeveP, A('acc-tee')),
  B(3.7, 11.4, -0.7, 5.6, 14.7, 2.6, sleeveP, { mirror: true, ...A('acc-tee') }),
];
// a little red guitar slung across the back, its strap over the chest
const GUITAR = [
  B(-3.4, 7.8, -5.6, 0.6, 11.0, -4.5, gtrP, { pivot: [-1.4, 9.4, -5.0], rot: [0, 0, 28], ...A('acc-guitar') }),
  B(-2.9, 10.6, -5.6, 0.1, 12.8, -4.5, gtrP, { pivot: [-1.4, 9.4, -5.0], rot: [0, 0, 28], ...A('acc-guitar') }),
  B(-1.8, 12.8, -5.4, -1.0, 19.0, -4.7, neckP, { pivot: [-1.4, 9.4, -5.0], rot: [0, 0, 28], ...A('acc-guitar') }),
  B(-2.0, 19.0, -5.5, -0.8, 20.6, -4.6, darkP, { pivot: [-1.4, 9.4, -5.0], rot: [0, 0, 28], ...A('acc-guitar') }),
  B(-0.3, 7.6, 3.9, 0.3, 15.6, 4.3, strapP, { pivot: [0, 11.6, 4.1], rot: [0, 0, -40], ...A('acc-guitar') }),
];
// a retro capsule mic, held up by the little right leg
const MIC = [
  B(-6.65, 4.4, -3.0, -5.85, 7.2, -2.2, darkP, A('acc-mic')),
  B(-7.15, 7.2, -3.5, -5.35, 9.8, -1.7, chromeP, A('acc-mic')),
  B(-7.3, 8.2, -3.65, -5.2, 8.6, -1.55, darkP, A('acc-mic')),
];

// ---------------------------------------------------------------- the model
// the stalk eyes (eyes.js, hand-pixelled): teal iris, magenta midband, slit pseudopupils; each on its stalk
const EYES = eyeRig({ style: 'pix', chunk: 1, map: SHRIMP_EYE, at: [-2.9, 25.333, 3.25], parentR: 'stalkR', parentL: 'stalkL', line: '#120a22', iris: '#3ad0cc', irisDark: '#156a7a', pupilColor: '#0a0814', accent: '#ff4aa8', extra: ['smug', 'glint'] });
// the mouth on the mandible, between the mustache hooks
const MOUTH = mouthRig({ chunk: 1, at: [0, 14.55, 4.22], size: [3.4, 1.4], line: '#140a1c', inner: '#4a1430', tongue: '#ff6c8e', def: 'flat', states: ['flat', 'grit', 'grin', 'o', 'frown', 'smile', 'wavy'] });
const locks = (axis, at, th, top, spec, seed, side) => hairLocks(C.hair, axis, at, th, top, spec, seed, side);
const RIGHT = {
  thigh: { name: 'thighR', parent: 'root', pivot: [-2.8, 7.4, -0.6], cubes: [B(-4.0, 4.0, -1.8, -1.6, 7.8, 0.6, legP), ...JEANS_LEG] },
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
  shoulder: { name: 'coxaR', parent: 'body', pivot: [-4.4, 12.8, 1.0], cubes: [B(-5.2, 11.7, -0.3, -3.8, 14.2, 2.2, armP)] },
  arm: { name: 'armR', parent: 'body', pivot: [-4.4, 12.8, 1.0], rot: [24, -6, 0], cubes: [B(-6.0, 11.6, -0.2, -3.4, 14.0, 4.6, armP)] },
  wleg: { name: 'wlegR', parent: 'body', pivot: [-4.3, 8.8, -2.6], rot: [0, 0, -10], cubes: [B(-6.6, 8.45, -2.95, -4.1, 9.15, -2.25, legP), B(-6.6, 5.4, -2.95, -5.9, 8.6, -2.25, legP), B(-6.5, 4.6, -2.85, -6.0, 5.4, -2.35, clawTipP)] },
  fore: { name: 'foreR', parent: 'armR', pivot: [-4.7, 12.8, 4.1], rot: [-26, 0, 6], cubes: [
    B(-5.85, 11.8, 2.95, -3.55, 16.0, 5.25, foreP),
    B(-5.25, 12.6, 5.25, -4.15, 15.4, 5.75, armP),                     // the folded dactyl blade along the front
  ] },
  club: { name: 'clubR', parent: 'foreR', pivot: [-4.7, 15.7, 4.1], cubes: [
    ...GLOVE,
    B(-6.25, 15.4, 2.5, -3.15, 18.6, 5.7, clubP),
    B(-6.0, 15.05, 2.75, -3.4, 18.95, 5.45, clubP),
    B(-6.55, 15.75, 2.75, -2.85, 18.25, 5.45, clubP),
  ] },
  stalk: { name: 'stalkR', parent: 'head', pivot: [-2.9, 20.4, 1.4], rot: [0, 0, 8], cubes: [
    B(-3.45, 19.8, 0.85, -2.35, 23.4, 1.95, stalkP),
    B(-4.733, 23.333, -0.433, -1.067, 27.333, 3.233, eyeHousingP(EYEP, 24.5, 25.5)),
    B(-4.4, 23.0, -0.1, -1.4, 27.667, 3.233, eyeHousingP(EYEP, 24.5, 25.5)),
  ] },
  ant: { name: 'antR', parent: 'head', pivot: [-3.7, 19.4, 2.9], rot: [-16, 0, 38], cubes: [B(-4.03, 19.4, 2.57, -3.37, 23.2, 3.23, antP)] },
  ant2: { name: 'ant2R', parent: 'antR', pivot: [-3.7, 23.2, 2.9], rot: [-34, 0, -14], cubes: [B(-3.97, 23.2, 2.63, -3.43, 26.4, 3.17, antP), B(-4.15, 26.2, 2.45, -3.25, 27.1, 3.35, shade('#ffffff', { top: '#ffffff', bottom: '#e0d8cc' }))] },
  hair: { name: 'hairR', parent: 'head', pivot: [-4.2, 20.0, 0.0], cubes: locks('z', -4.7, 0.6, 20.3, [[-2.9, -1.3, 13.8, 12, 10, 0], [-1.35, 0.3, 13.0, 8, 3, 0.12], [0.25, 1.8, 14.2, 12, -4, 0], [1.75, 2.9, 15.8, 16, -10, 0.08]], 3, -1) },
  max: { name: 'maxR', parent: 'head', pivot: [-1.6, 16.4, 3.9], cubes: [B(-2.0, 15.7, 3.5, -0.3, 16.5, 4.3, beardP), B(-2.8, 14.2, 3.55, -1.9, 16.3, 4.35, beardP), B(-2.7, 13.4, 3.7, -2.0, 14.3, 4.3, beardP)] },
};
export const def = {
  name: 'foopod', ppu: 3, scale: 0.32, outline: { color: C.ink, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...both(RIGHT.thigh, RIGHT.shin, RIGHT.foot),
    { name: 'body', parent: 'root', pivot: [0, 7.6, -0.4], cubes: [
      B(-4.2, 6.2, -3.4, 4.2, 14.8, 3.0, shellP),
      B(-4.8, 11.9, -3.1, 4.8, 14.9, 2.6, shellP),                      // the shoulder yoke
      B(-4.5, 7.6, -2.8, 4.5, 11.9, 2.4, shellP),
      // the rainbow: a stack of chest plates, yellow → orange → red → magenta
      B(-3.8, 12.6, 2.4, 3.8, 14.6, 3.9, plates[0]),
      B(-3.7, 10.7, 2.4, 3.7, 12.7, 3.8, plates[1]),
      B(-3.6, 8.8, 2.4, 3.6, 10.8, 3.7, plates[2]),
      B(-3.4, 7.4, 2.4, 3.4, 8.9, 3.5, plates[3]),
      // the back: keeled plates running green → teal → blue into the tail
      B(-3.8, 12.4, -3.95, 3.8, 14.6, -3.0, backPs[0]),
      B(-3.7, 10.2, -3.85, 3.7, 12.5, -3.0, backPs[1]),
      B(-3.6, 8.0, -3.75, 3.6, 10.3, -3.0, backPs[2]),
      // the waist: a last pair of rainbow sternites, magenta → violet, down to the hips
      B(-3.2, 6.0, 2.2, 3.2, 7.6, 3.3, plates[4]),
      B(-4.5, 5.9, -3.5, 4.5, 6.3, 3.0, shellP),
      ...NECKLACE, ...TEE, ...GUITAR, ...JEANS_WAIST,
    ] },
    { name: 'head', parent: 'body', pivot: [0, 14.6, 0.2], cubes: [
      B(-3.8, 14.5, -2.8, 3.8, 19.5, 3.5, shellP, { faces: { south: faceP } }),
      // the mop: a centre-parted cap and a fringe in two curtains
      B(-4.1, 19.3, -3.2, 4.1, 20.3, 3.3, hairCapP),
      B(-4.0, 18.0, 3.55, 4.0, 20.3, 3.55, fringeP, { plane: 'z' }),
    ] },
    { name: 'hairB', parent: 'head', pivot: [0, 20.0, -3.3], cubes: locks('x', -3.75, 0.6, 20.3, [[-4.1, -2.5, 14.0, -12, 14, 0], [-2.6, -0.85, 13.0, -5, 18, -0.12], [-0.9, 0.9, 13.6, 0, 15, 0], [0.85, 2.6, 12.8, 5, 18, -0.12], [2.5, 4.1, 14.2, 12, 14, 0]], 11) },
    { name: 'jaw', parent: 'head', pivot: [0, 15.3, 3.0], cubes: [
      B(-1.9, 14.0, 2.4, 1.9, 15.3, 4.2, jawP),
      B(-1.7, 15.2, 2.6, 1.7, 15.5, 4.0, mouthIn, { outline: false }),
      ...MOUTH.cubes,
    ] },
    { name: 'beard', parent: 'jaw', pivot: [0, 14.2, 3.8], cubes: [
      B(-1.4, 12.8, 3.2, 1.4, 14.3, 4.4, beardP),
      B(-1.2, 10.6, 3.85, 1.2, 13.0, 3.85, beardTipP, { plane: 'z' }),
      B(0, 10.6, 3.2, 0, 13.0, 4.5, beardTipP, { plane: 'x' }),
    ] },
    ...both(RIGHT.stalk, RIGHT.ant, RIGHT.ant2, RIGHT.hair, RIGHT.max),
    ...EYES.bones,
    ...both(RIGHT.shoulder, RIGHT.arm, RIGHT.fore, RIGHT.club, RIGHT.wleg),
    { name: 'micR', parent: 'wlegR', pivot: [-6.25, 5.0, -2.6], cubes: MIC },
    { name: 'gunH', parent: 'wlegL', pivot: [6.25, 5.5, -2.6], rot: [14, 0, -8], cubes: rayGun([6.25, 5.5, -2.6], 'gun-h', { k: 0.72 }) },
    { name: 'gunG', parent: 'clubL', pivot: [4.7, 16.6, 2.5], rot: [-90, 0, 0], cubes: rayGun([4.7, 16.6, 2.5], 'gun-g', { k: 0.8 }).map((c) => ({ ...c, hide: true })) },
    { name: 'tail1', parent: 'body', pivot: [0, 7.2, -3.0], rot: [-38, 0, 0], cubes: [
      B(-3.0, 5.4, -7.4, 3.0, 8.8, -2.6, tailPs[0]),
    ] },
    { name: 'tail2', parent: 'tail1', pivot: [0, 7.1, -7.2], rot: [-12, 0, 0], cubes: [
      B(-2.6, 5.6, -11.0, 2.6, 8.6, -7.0, tailPs[1]),
    ] },
    { name: 'fan', parent: 'tail2', pivot: [0, 7.1, -10.8], rot: [100, 0, 0], cubes: [
      B(-1.2, 6.75, -15.8, 1.2, 7.45, -10.6, telsonP),
      B(-1.0, 6.85, -16.5, -0.35, 7.35, -15.8, spineP), B(0.35, 6.85, -16.5, 1.0, 7.35, -15.8, spineP),
      ...[[-50, fanOuter, 7.0], [-25, fanInner, 7.12], [25, fanInner, 7.12], [50, fanOuter, 7.0]].map(([a, P, y]) => B(-1.4, y, -16.6, 1.4, y, -10.8, P, { plane: 'y', mirror: a > 0, pivot: [0, y, -10.8], rot: [0, a, 0] })),
    ] },
  ],
};
// where buyable gear sits (model units, rest pose): crown of the mop, between the stalk eyes, the front
// of the neck above the chest plates, the middle of the back
// appearance tiers: normal wears one of the first pair, dripped adds one of the second, ultra dripped the third
def.drip = [
  [{ id: 'acc-gloves', name: 'Red boxing gloves' }, { id: 'acc-tee', name: 'Flying-saucer band tee' }],
  [{ id: 'acc-ufo', name: 'Foo-orb necklace' }, { id: 'acc-jeans', name: 'Ripped denim cut-offs' }],
  [{ id: 'acc-guitar', name: 'Little red guitar' }, { id: 'acc-mic', name: 'Retro capsule mic' }],
];
def.attach = {
  head: { bone: 'head', at: [0, 20.3, 0.05], size: 8.2 },
  face: { bone: 'head', at: [0, 25.3, 3.3], size: 9.0 },
  neck: { bone: 'body', at: [0, 14.5, 3.9], size: 7.6 },
  back: { bone: 'body', at: [0, 11.0, -3.95], size: 7.6 },
};

// ---------------------------------------------------------------- animation
const stance = legRig({ body: [0, 7.6, -0.4], hip: [-2.8, 7.4, -0.6], ankle: [-2.8, 1.2, -0.6], L1: 3.2, L2: 3.0 });
const CLUB = { R: [-4.7, 19.0, 4.1], L: [4.7, 19.0, 4.1] };       // the striking pad (top of the club)
const MOUTHP = [0, 15.0, 4.6];
const GUNG = [4.7, 16.6, 2.5], GUNK = 0.8, MZ = [GUNG[0] + MUZZLE[0] * GUNK, GUNG[1] + MUZZLE[1] * GUNK, GUNG[2] + MUZZLE[2] * GUNK];
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
// the double-biceps flex (a mantis' meral-spread threat display): upper arms straight out to the sides,
// forearms up, clubs held beside the head
function flex(P, S, k) {
  const g = S === 'R' ? 1 : -1;
  P.rot('arm' + S, -24 * k, -g * 84 * k, 0).rot('fore' + S, 26 * k, 0, -g * 6 * k);
}
// one expression: eye state and mouth state together (posture does the rest)
const ex = (P, e, m) => { if (e) P.face('eyes', e); if (m) P.face('mouth', m); return P; };
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
    { bone: 'stalkR', tip: [0, 4.5, 0], k: 260, d: 11, gain: 0.5, max: 14 },
    { bone: 'stalkL', tip: [0, 4.5, 0], k: 260, d: 11, gain: 0.5, max: 14 },
    { bone: 'fan', tip: [0, 0, -4.4], k: 160, d: 8, gain: 0.9, max: 22 },
    { bone: 'wlegR', tip: [-2.4, -3, 0], k: 230, d: 9, gain: 0.7, max: 18 },
    { bone: 'wlegL', tip: [2.4, -3, 0], k: 230, d: 9, gain: 0.7, max: 18 },
  ],
  faces: {
    eyes: EYES.slot,
    mouth: MOUTH.slot,
    gun: { default: 'holster', states: { holster: ['gun-h'], hand: ['gun-g'] } },
  },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'gunspin', 'airdrum', 'hairflip', 'shadowbox'] },
  clips: {
    // up on its toes, bouncing like a boxer: weight rocking side to side, clubs riding the bounce a beat
    // late, eyes flicking about on their own (mantis-shrimp saccades), antennae twitching, mandibles working
    idle: { len: 2.0, loop: true, f(P, t) {
      const b = bounce(t, 0.5, { squash: 0.07, stretch: 0.035 }), sway = wave(t, 0.5), dy = -0.75 + b.u * 1.0;
      stance(P, { dy, dx: 0.45 * sway, rz: -2.4 * sway, rx: 5, ry: 9 + 6 * wave(t, 0.5, 1.2), f: { R: [-0.2, 0, -0.9], L: [0.2, 0, 1.1] }, toe: { R: 0, L: 0 } });
      P.rot('wlegR', 0, 0, 6 * b.u).rot('wlegL', 0, 0, -6 * b.u);
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
      ex(P, t > 1.3 && t < 1.62 ? 'smug' : undefined, t > 1.28 && t < 1.72 ? 'smile' : 'flat');
      P.rot('jaw', 3 + 3 * Math.max(0, wave(t, 2)));
      P.rot('tail1', 0, -4 * sway, 0).rot('fan', 5 * b.u + 3 * wave(t, 1, 1), 0, 0);
      P.stream(FX.bub, 'jaw', MOUTHP, { rate: 0.8, dir: [0, 1, 0.4], speed: 0.25, spread: 0.4, scale: 0.6 });
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
        P.rot('arm' + S, 20 * crouch, 0, -g * 8 * crouch + tr * 2).rot('fore' + S, -20 * crouch, 0, 0); flex(P, S, up); P.rot('club' + S, -10 * up, 0, -g * 10 * up);
        P.rot('arm' + S, -10 * clack, g * 26 * clack, g * 4 * clack).rot('fore' + S, 20 * clack, 0, 0);
        P.rot('stalk' + S, -10 * up, g * 8 * up, g * 22 * up + tr);
      }
      P.rot('head', 12 * crouch - 26 * up + tr * 2, 0, 0).rot('jaw', 6 * crouch + 38 * up);
      P.rot('fan', 30 * up, 0, 0).rot('tail1', 10 * crouch - 6 * up, 0, 0);
      ex(P, crouch > 0.3 ? 'angry' : up > 0.3 ? 'wide' : clack > 0.3 ? 'angry' : t > 1.75 ? 'smug' : undefined, crouch > 0.3 ? 'grit' : up > 0.3 ? 'o' : clack > 0.2 ? 'grin' : t > 1.75 ? 'smile' : undefined); P.blinkOK = false;
      eyesScale(P, 1 - 0.12 * crouch + 0.1 * up * (1 - seg(t, 0.6, 0.9)), 1 - 0.22 * crouch + 0.22 * up * (1 - seg(t, 0.6, 0.9)));
      if (t > 0.52 && t < 1.3) P.stream(FX.bub, 'jaw', MOUTHP, { rate: 40, dir: [0, 0.6, 1], speed: 0.9, spread: 0.6 }).stream('bubble', 'jaw', MOUTHP, { rate: 8, dir: [0, 0.8, 1], speed: 1.2, spread: 0.6, scale: 0.7 });
      P.burst(0.54, FX.ring, 'jaw', MOUTHP, { scale: 0.7 }).burst(0.6, 'anger', 'head', [-6, 25, 3], {}).burst(0.72, 'anger', 'head', [6, 24, 3], {});
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
      ex(P, wind > 0.1 ? 'angry' : t > 0.24 && t < 0.36 ? 'shut' : hit > 0.1 ? 'angry' : t > 0.6 ? 'smug' : undefined, wind > 0.1 ? 'grit' : hit > 0.1 ? 'o' : t > 0.6 ? 'smile' : undefined); P.blinkOK = false;
      eyesScale(P, 1 + 0.18 * bump(t, 0.24, 0.38), 1 - 0.3 * bump(t, 0.24, 0.38));
      P.rot('fan', 20 * hit, 0, 0);
      const pad = CLUB.R;
      P.burst(0.26, FX.flash, 'clubR', pad, {}).burst(0.26, FX.ring, 'clubR', pad, {}).burst(0.27, FX.ring, 'clubR', pad, { scale: 0.55 });
      P.burst(0.26, FX.bub, 'clubR', pad, { n: 16, speed: 1.2 }).burst(0.26, 'spark', 'clubR', pad, { n: 3 }).burst(0.3, 'bubble', 'clubR', pad, { n: 5, speed: 0.8, scale: 0.6 });
    } },
    // special (ray gun): whips the toy blaster out of its waistband, twirls it, squares up side-on and
    // fires three pulses of rings; blows… well, bubbles off the muzzle, twirls it back in
    special: { len: 2.3, next: 'idle', f(P, t) {
      // left arm track: [arm x, arm y, arm z, fore x] — guard → down to the hip → up to twirl → aim → back to the hip → guard
      const A = key([[0, [0, 0, 0, 0]], [0.2, [126, 0, -12, 56], 'out'], [0.3, [126, 0, -12, 56]], [0.46, [-30, 0, -10, 40], 'inout'], [0.6, [-24, 0, -6, 30]],
        [0.76, [-34, 30, 0, 118], 'back'], [1.78, [-34, 30, 0, 118]], [1.98, [126, 0, -12, 56], 'inout'], [2.1, [126, 0, -12, 56]], [2.3, [0, 0, 0, 0], 'inout']], t);
      const aim = seg(t, 0.6, 0.76, E.out) * (1 - seg(t, 1.78, 1.98, E.inout)), reach = bump(t, 0.05, 0.42) + bump(t, 1.85, 2.25);
      const kicks = [0.86, 1.08, 1.3].reduce((s, k) => s + wob(t, k, 1, 3, 9) * (t > k ? 1 : 0), 0);
      const drawn = t > 0.26 && t < 2.06;
      stance(P, { dy: -0.8 - 0.7 * reach, ry: -30 * aim, rx: 4 + 8 * reach, rz: -5 * reach });
      P.rot('armL', A[0] - 8 * kicks, A[1], A[2]).rot('foreL', A[3] - 6 * kicks, 0, 0);
      P.rot('gunG', 360 * seg(t, 0.4, 0.62, E.inout), 0, 0);
      cock(P, 'R', 0.5 * aim);
      P.rot('head', -4 * aim + 10 * reach, 18 * aim, 0);
      eyes(P, -10 * aim + 14 * reach, 20 * reach, -16 * aim + 18 * reach, 24 * reach, 4 * aim);
      P.face('gun', drawn ? 'hand' : 'holster'); P.blinkOK = false;
      ex(P, t < 0.3 ? 'open' : t < 0.64 ? 'smug' : aim > 0.5 && t < 1.5 ? 'wink' : t < 2.05 ? 'smug' : undefined, t < 0.3 ? 'flat' : t < 0.64 ? 'smile' : aim > 0.5 && t < 1.5 ? 'grit' : t < 2.1 ? 'grin' : undefined);
      if (t > 0.8 && t < 1.45) P.stream(FX.zap, 'gunG', MZ, { rate: 140, dir: [0, 0, 1], spread: 0.03 });
      for (const k of [0.86, 1.08, 1.3]) P.burst(k, FX.zapring, 'gunG', MZ, { n: 3, dir: [0, 0, 1], spread: 0.02 }).burst(k, 'spark', 'gunG', MZ, { n: 1, scale: 0.5 }).burst(k + 0.06, FX.zapring, 'gunG', MZ, { n: 2, dir: [0, 0, 1], spread: 0.02 });
      if (t > 1.45 && t < 1.8) P.stream('steam', 'gunG', MZ, { rate: 10, dir: [0, 1, 0], spread: 0.4, scale: 0.5 });
      P.burst(0.62, 'sparkle', 'gunG', MZ, { n: 4, speed: 0.6 });
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.06, E.out) * (1 - seg(t, 0.2, 0.65, E.inout));
      stance(P, { dz: -2.2 * k, dy: -0.9 * k, rx: -16 * k + wob(t, 0.16, 4, 3, 6), rz: wave(t, 15) * 4 * k, f: { R: [0, 1.2 * bump(t, 0.05, 0.25), -0.8 * k], L: [0, 0, -0.6 * k] } });
      P.sq('body', -0.12 * k);
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, -30 * k, 0, g * 34 * k).rot('fore' + S, 30 * k, 0, 0); P.rot('stalk' + S, -14 * k, 0, g * 18 * k); }
      P.rot('head', -16 * k, 0, 8 * k).rot('jaw', 30 * k).rot('fan', 26 * k, 0, 0);
      ex(P, t < 0.42 ? 'shut' : 'sad', t < 0.42 ? 'wavy' : 'frown'); P.blinkOK = false; eyesScale(P, 1 + 0.15 * k, 1 - 0.25 * k);
      P.burst(0.1, 'sweat', 'head', [-4.5, 21, 2], { n: 2, dir: [-1, 0.8, 0] }).burst(0.1, 'sweat', 'head', [4.5, 21, 2], { n: 2, dir: [1, 0.8, 0] });
      P.burst(0.02, 'spark', 'body', [0, 12, 6], { n: 2 }).burst(0.02, 'star', 'head', [0, 24, 2], { n: 3 }).burst(0.03, FX.bub, 'body', [0, 12, 5], { n: 8, speed: 1 });
    } },
    // reels, eyes spinning on their stalks… and topples over sideways, little legs in the air
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce);
      stance(P, { dy: -1.2 * dizzy, rz: wave(t, 1.6) * 8 * dizzy, ry: wave(t, 1.1) * 14 * dizzy, rx: 6 * dizzy });
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, 30 * dizzy, 0, g * 10 * dizzy).rot('fore' + S, 20 * dizzy, 0, 0); P.rot('stalk' + S, 0, wave(t, 2.2, g) * 30 * dizzy, g * 18 * dizzy); }
      if (fall > 0) knockedOut(P, fall, t);
      ex(P, t < 0.95 ? 'swirl' : 'x', t < 0.95 ? 'wavy' : 'o'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.25, 'sweat', 'head', [-4.5, 21, 2], { n: 2, dir: [-1, 0.8, 0] }).burst(0.6, 'tear', 'head', [3, 20, 4], { n: 3, dir: [1, 0.5, 0.5] });
      P.burst(0.4, 'star', 'head', [0, 27, 0], { n: 5 }).burst(1.4, 'dust', 'root', [-8, 1, 0], { n: 10, spread: 1, speed: 1.2 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      knockedOut(P, 1, t);
      ex(P, 'swirl', 'o'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.4;
      P.burst(0.5, FX.bub, 'jaw', MOUTHP, { n: 2, dir: [0, 1, 0], speed: 0.4 }).burst(1.7, FX.bub, 'jaw', MOUTHP, { n: 1, dir: [0, 1, 0], speed: 0.4 });
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
      flex(P, 'R', fist); P.rot('armR', 0, 0, -30 * fist + wave(t, 6) * 6 * fist).rot('clubR', -14 * fist, 0, 0);
      P.rot('armL', -20 * fist, 0, -10 * fist);
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, -10 * clack, g * 24 * clack, 0).rot('fore' + S, 20 * clack, 0, 0); }
      P.rot('fan', 34 * flap + 20 * hang, 0, 0).rot('tail2', 10 * flap, 0, 0).rot('tail1', 10 * hang, 0, 0);
      P.rot('head', -14 * fist, 0, 0).rot('jaw', 24 * fist);
      eyes(P, 0, -12 * fist, 0, -12 * fist, 10 * fist);
      ex(P, hang > 0.5 ? 'star' : fist > 0.3 ? 'happy' : t > 1.5 ? 'smug' : undefined, fist > 0.2 || t > 1.2 ? 'grin' : undefined); P.blinkOK = false;
      eyesScale(P, 1 - 0.1 * hang, 1 + 0.15 * hang);
      if (t > 0.36 && t < 0.98) P.stream(FX.bub, 'tail2', [0, 5, -11], { rate: 30, dir: [0, -1, -0.5], speed: 0.8, spread: 0.6 });
      P.burst(1.2, 'dust', 'root', [0, 0.5, 0], { n: 10, spread: 1, speed: 1.2 }).burst(1.7, 'spark', 'body', [0, 20, 9], { n: 2 }).burst(1.7, FX.flash, 'body', [0, 20, 9], { scale: 0.4 });
      P.burst(0.5, 'sparkle', 'clubR', CLUB.R, { n: 8, speed: 1.2 });
    } },
    // asleep: sat back on its tail, clubs folded in its lap, stalks drooping, a bubble swelling at its jaw
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * Math.PI * 2);
      stance(P, { dy: -2.6 + br * 0.25, dz: -0.6, rx: 14 + br * 2, f: { R: [0.4, 0, 1.4], L: [-0.4, 0, 1.4] } });
      P.sq('body', -0.04 + br * 0.03);
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, 34, g * 14, -g * 4).rot('fore' + S, 24, 0, 0).rot('club' + S, 10, 0, 0); P.rot('stalk' + S, 28 + br * 3, 0, g * (26 + br * 3)); }
      P.rot('head', 16 + br * 3, 0, 4).rot('jaw', 6 + Math.max(0, br) * 4).rot('fan', -20, 0, 0).rot('tail1', 14, 0, 0);
      ex(P, 'closed', 'o'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [3, 24, 4], {}).burst(1.6, 'z', 'head', [3, 24, 4], {});
      P.burst(2.4, 'bubble', 'jaw', MOUTHP, { n: 1, dir: [0, 1, 0.2], speed: 0.3, scale: 0.8 });
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
      for (const S of ['R', 'L']) { flex(P, S, crash); P.rot('arm' + S, -20 * crash, 0, 0).rot('club' + S, -20 * crash, 0, 0); }
      const nod = Math.abs(wave(t, 4.2)) * seg(t, 0.15, 0.3) * (1 - seg(t, 1.25, 1.35));
      P.rot('head', 10 * nod - 18 * crash, 0, 0).rot('jaw', 8 * nod + 30 * crash);
      ex(P, crash > 0.3 ? 'wide' : t > 0.15 && t < 1.25 ? (Math.floor(t * 7) % 3 === 0 ? 'shut' : 'angry') : t > 1.6 ? 'happy' : undefined, crash > 0.3 ? 'o' : t > 0.15 && t < 1.25 ? 'grit' : t > 1.6 ? 'grin' : undefined); P.blinkOK = false;
      P.burst(1.0, 'sweat', 'head', [-4.5, 22, 2], { n: 2, dir: [-1, 1, 0] });
      P.burst(1.34, 'spark', 'body', [0, 26, 4], { n: 3 }).burst(1.34, 'note', 'head', [0, 27, 2], { n: 4, speed: 1.4 }).burst(1.34, FX.ring, 'head', [0, 24, 4], { scale: 0.6 });
    } },
    // fidget: dips its head and whips the hair back out of its eyes, then a cocky shake
    hairflip: { len: 1.4, next: 'idle', f(P, t) {
      const dip = seg(t, 0, 0.25, E.inout) * (1 - seg(t, 0.25, 0.36, E.in3)), whip = seg(t, 0.26, 0.4, E.out) * (1 - seg(t, 0.8, 1.2, E.inout));
      stance(P, { dy: -0.8 - 0.6 * dip, rx: 16 * dip - 10 * whip });
      P.rot('head', 30 * dip - 34 * whip, 0, 0).rot('head', 0, wave(t, 5) * 10 * seg(t, 0.85, 0.95) * (1 - seg(t, 1.1, 1.3)), 0);
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, 8 * dip - 12 * whip, 0, g * 10 * whip); P.rot('stalk' + S, 0, 0, g * 14 * whip); }
      P.rot('jaw', 14 * whip);
      ex(P, dip > 0.4 ? 'closed' : whip > 0.4 ? 'smug' : undefined, whip > 0.3 ? 'smile' : undefined); P.blinkOK = false;
      P.burst(0.36, FX.bub, 'head', [0, 22, -4], { n: 6, dir: [0, 0.5, -1], speed: 1 });
    } },
    // fidget: shadowboxing — jab, jab, cross at nothing in particular
    shadowbox: { len: 1.3, next: 'idle', f(P, t) {
      const j1 = bump(t, 0.12, 0.3), j2 = bump(t, 0.34, 0.52), cr = seg(t, 0.6, 0.68, E.out3) * (1 - seg(t, 0.8, 1.15, E.inout));
      stance(P, { dy: -0.9, ry: 10 * (j1 + j2) - 20 * cr, dz: 0.6 * (j1 + j2) + 1.2 * cr, rx: 6 });
      punch(P, 'L', 0.75 * (j1 + j2), -8); punch(P, 'R', cr, 12);
      P.rot('head', 0, 6 * (j1 + j2) - 10 * cr, 0);
      ex(P, t < 0.85 ? 'angry' : 'smug', t < 0.6 ? 'grit' : t < 0.8 ? 'o' : 'grin'); P.blinkOK = false;
      P.burst(0.21, FX.bub, 'clubL', CLUB.L, { n: 4, speed: 0.8 }).burst(0.43, FX.bub, 'clubL', CLUB.L, { n: 4, speed: 0.8 }).burst(0.68, FX.bub, 'clubR', CLUB.R, { n: 8, speed: 1 }).burst(0.68, FX.ring, 'clubR', CLUB.R, { scale: 0.5 });
    } },
    // the dance: a punk pogo on the beat — hop, hop, a club punched at the sky on every one, the hair flying —
    // a side-to-side headbang, then a hop-spin into the finish with one club raised
    dance: { len: 2.6, next: 'idle', f(P, t) {
      const beat = 0.3, n = Math.floor(t / beat), u = (t % beat) / beat;
      const pogo = t < 1.2 ? hop(t, beat, 2.4, { crouch: 0.9, air: [0.18, 0.7] }) : { y: 0, sq: 0 };
      const bang = seg(t, 1.2, 1.3) * (1 - seg(t, 1.75, 1.85)), side = Math.sin((t - 1.2) / beat * Math.PI) * bang;
      const spin = seg(t, 1.86, 2.2, E.inout), sp = t > 1.8 && t < 2.3 ? hop(t - 1.8, 0.5, 4, { crouch: 1.4 }) : { y: 0, sq: 0 };
      const fin = seg(t, 2.16, 2.3, E.back) * (1 - seg(t, 2.45, 2.6, E.inout)), land = t > 2.3 ? wob(t, 2.3, -0.8, 3, 6) : 0;
      const y = pogo.y + sp.y + land;
      stance(P, { dy: Math.min(0, y) - 0.6, rz: 8 * side, rx: 6 });
      P.pos('root', 0, Math.max(0, y), 0).rot('root', 0, 360 * spin, 0).sq('body', pogo.sq + sp.sq);
      if (t < 1.2) { const S = n % 2 ? 'L' : 'R', k = bump(u, 0.05, 0.85); punch(P, S, 0.9 * k, 0, 70); P.rot('club' + (S === 'R' ? 'L' : 'R'), -10, 0, 0); }
      for (const S of ['R', 'L']) flex(P, S, bang);
      flex(P, 'R', fin); P.rot('armR', 0, 0, -30 * fin);
      P.rot('head', (t < 1.2 ? 16 * bump(u, 0, 0.5) : 0) - 10 * fin, 0, 16 * side);
      ex(P, fin > 0.4 ? 'star' : t < 1.2 ? (u < 0.4 ? 'shut' : 'happy') : bang > 0.3 ? 'shut' : 'happy', fin > 0.3 ? 'grin' : bang > 0.3 ? 'o' : 'grin'); P.blinkOK = false;
      eyesScale(P, 1 + 0.12 * pogo.sq * -3, 1 + pogo.sq * 1.5);
      for (let k = 0; k < 8; k++) P.burst(k * beat + 0.02, 'note', 'head', [0, 27, 2], { n: 1, speed: 0.9, scale: 0.8 });
      P.burst(2.24, 'sparkle', 'clubR', CLUB.R, { n: 10, speed: 1.4 }).burst(2.3, 'dust', 'root', [0, 0.5, 0], { n: 8, spread: 1, speed: 1 });
    } },
    // the signature fidget: whips out the toy ray gun and spins it like a gunslinger… it goes off and zaps
    // its own antenna. A sheepish look, then it blows the smoke off the muzzle — in bubbles — and holsters it
    gunspin: { len: 3.2, next: 'idle', f(P, t) {
      const A = key([[0, [0, 0, 0, 0]], [0.2, [126, 0, -12, 56], 'out'], [0.3, [126, 0, -12, 56]], [0.55, [-34, 0, -8, 46], 'inout'], [1.55, [-34, 0, -8, 46]],
        [1.62, [-50, 0, -8, 40], 'out'], [1.9, [-20, 0, -16, 60], 'inout'], [2.4, [-20, 0, -16, 60]], [2.62, [126, 0, -12, 56], 'inout'], [2.72, [126, 0, -12, 56]], [3.0, [0, 0, 0, 0], 'inout']], t);
      const spins = key([[0.5, 0], [0.8, 0.6, 'in'], [1.5, 3, 'lin'], [1.6, 3, 'out']], t), kick = wob(t, 1.55, 1, 4, 7) * (t > 1.55 ? 1 : 0);
      const jolt = seg(t, 1.56, 1.6, E.out) * (1 - seg(t, 1.7, 1.9)), blow = bump(t, 1.95, 2.45), reach = bump(t, 0.05, 0.42) + bump(t, 2.5, 2.9);
      stance(P, { dy: -0.8 - 0.6 * reach + 0.8 * jolt, rx: 4 + 8 * reach - 6 * jolt, rz: -5 * reach, ry: -10 * blow });
      P.sq('body', 0.08 * jolt);
      P.rot('armL', A[0] - 10 * kick, A[1], A[2]).rot('foreL', A[3], 0, 0);
      P.rot('gunG', -360 * spins, 0, 0);
      P.rot('antR', -40 * jolt, 0, 20 * jolt).rot('ant2R', -30 * jolt, 0, 0);
      P.rot('head', 10 * reach - 8 * jolt + 10 * blow, 22 * blow, -8 * blow);
      eyes(P, 14 * reach - 20 * jolt, 18 * reach - 14 * jolt, 18 * reach + 26 * blow, 22 * reach + 10 * blow);
      P.face('gun', t > 0.28 && t < 2.68 ? 'hand' : 'holster'); P.blinkOK = false;
      ex(P, t < 0.3 ? 'open' : t < 1.55 ? (spins > 2 ? 'glint' : 'smug') : t < 1.75 ? 'wide' : t < 1.95 ? 'sad' : t < 2.45 ? 'closed' : 'smug', t < 1.55 ? 'smile' : t < 1.75 ? 'o' : t < 1.95 ? 'wavy' : t < 2.45 ? 'o' : 'grin');
      eyesScale(P, 1 - 0.15 * jolt, 1 + 0.3 * jolt);
      P.burst(1.55, FX.zapring, 'gunG', MZ, { n: 2, dir: [0, 0, 1], spread: 0.02 }).burst(1.55, 'spark', 'gunG', MZ, { n: 1, scale: 0.5 });
      P.burst(1.6, 'spark', 'ant2R', [-3.7, 26.6, 2.9], { n: 2 }).burst(1.6, 'smoke', 'ant2R', [-3.7, 26.6, 2.9], { n: 4, scale: 0.4 }).burst(1.62, 'sweat', 'head', [4.5, 22, 2], { n: 2, dir: [1, 1, 0] });
      if (t > 1.6 && t < 2.4) P.stream('steam', 'gunG', MZ, { rate: 9, dir: [0, 1, 0], spread: 0.4, scale: 0.45 });
      if (t > 2.0 && t < 2.4) P.stream(FX.bub, 'jaw', MOUTHP, { rate: 30, dir: [0.6, 0.4, 0.6], speed: 0.7, spread: 0.3 });
    } },
  },
};
// knocked out on its side: legs kicked up, clubs flopped, stalks drooping, tail fan limp
function knockedOut(P, k, t = 0) {
  P.rot('root', 0, 0, 84 * k).pos('root', -7.6 * k, 4.6 * k, 0);
  for (const [S, g] of [['R', 1], ['L', -1]]) {
    P.rot('thigh' + S, (-40 + wave(t, 0.8, g) * 8) * k, 0, -g * 10 * k).rot('shin' + S, 50 * k, 0, 0);
    P.rot('arm' + S, 40 * k, 0, g * 30 * k).rot('fore' + S, 50 * k, 0, 0);
    P.rot('stalk' + S, 30 * k, 0, (g * 30 + wave(t, 0.6, g) * 6) * k);
  }
  P.rot('head', 0, 0, 10 * k).rot('jaw', 26 * k).rot('fan', -30 * k, 0, 0).rot('tail1', 0, 0, -10 * k);
}
// the drip form: black lacquer and gold, with sapphire eyes
const SAPPHIRE = { '#3ad0cc': '#4ab8ff', '#156a7a': '#1a3a8a' };
def.dripForm = { ...DRIP_FORM, map: (c, glow) => SAPPHIRE[c] || DRIP_FORM.map(c, glow) };
def.anim = anim;
