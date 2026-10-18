// Pidgun ♂ — a cocky street pigeon that runs the Tenderloin (homage: Guns N' Roses). Classic blue-bar
// plumage — slate grey, two black wing bars, a neck that flashes green and violet — a little curled quiff,
// small fierce orange ring-eyes, and in its right wing its signature: an oversized
// antique six-shooter (nickel, engraved, ivory grips with a little red rose inlaid). Drip (one choice per
// tier): a black bandana printed with red rose buds or a rose tucked behind its head; a gold chain with a rose
// pendant or a studded choker; a sunburst electric guitar slung on its back or a black cowboy hat. It struts
// with the classic pigeon head-bob, spins the revolver when it's bored and pecks at crumbs when it thinks
// nobody's looking.
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { C, P, S1, MORPH, stage1, wingSegP, tipsP, pigeonEyeRig, quiffCubes, revolver, muzzle, guitarCubes, chainCubes, chokerCubes, cowboyHatCubes, bandanaS1, tuckedRose, plant, strut, peck, ATTACH_S1 } from './pigeon_parts.js';

// Cobblemon-style low-res eyes, its own design: small orange rings with a dark pupil, the outer top corner cut fierce
const EYES = pigeonEyeRig({ grid: [5, 5], ring: ['#ffa834', '#ff7a24'], pupil: 'round', shape: 'sharp', at: S1.eyeAt, size: [10 / 3, 10 / 3] });
const ES = (P, x, y = x) => P.scl('eyeR', x, y, 1).scl('eyeL', x, y, 1);
const DART = (P, x) => P.pos('eyeR', x, 0, 0).pos('eyeL', x, 0, 0);
const G = [-8.9, 6.0, 6.8], TRIG = [-8.9, 4.8, 7.6], MZ = muzzle(G), BEAK = S1.mouth;
const HAND = wingSegP({ base: [-6.8, 8.4, 1.2], dir: [0, 0, 1], len: 7.0, cdir: [0, -1, 0], chord: 4.4, kind: 'hand' });
const BANDANA = bandanaS1('pg-bandana');

export const def = {
  name: 'pidgun', ppu: 3, scale: 0.32, outline: { color: C.ink, px: 1.4 },
  bones: [
    ...stage1({ M: MORPH.blue, wingR: false,
      headExtra: [...quiffCubes([0, 25.2, 6.0], MORPH.blue.head, 1), ...BANDANA.head],
      neckExtra: [
        ...chainCubes({ xs: 4.45, y: 16.3, z0: -0.6, z1: 6.6, at: [0, 13.9, 9.4], id: 'pg-chain', kind: 'rose' }),
        ...chokerCubes({ xs: 4.4, y: 16.6, z0: -0.6, z1: 6.6, id: 'pg-choker', hide: true }),
      ] }),
    ...EYES.bones,
    ...BANDANA.bones, tuckedRose('hairRose', 'pg-rosetuck'),
    // the gun wing, held like an arm: the coverts hang from the shoulder, the primaries close round the grip
    { name: 'wingR', parent: 'body', pivot: [-6.0, 14.6, 3.6], rot: [-22, 0, -10], cubes: [
      P([-7.3, 6.6, -0.6], [1.3, 8.6, 4.8], wingSegP({ base: [-6.0, 15.2, 4.2], dir: [0, -1, 0], len: 8.6, cdir: [0, 0, -1], chord: 4.8, kind: 'arm', bar1: 0.46, bar2: 0.66, barW: 0.08 })),
      P([-6.65, 7.2, -2.0], [0, 7.4, 2.0], tipsP({ n: 4, cols: C.slate, dir: 'back' }), { plane: 'x' }),
    ] },
    { name: 'handR', parent: 'wingR', pivot: [-6.8, 7.6, 1.2], rot: [22, 0, 0], cubes: [
      P([-7.4, 4.0, 1.2], [1.2, 4.4, 7.0], HAND),
      P([-10.0, 3.4, 4.6], [3.4, 2.8, 3.2], HAND),
    ] },
    { name: 'twirl', parent: 'handR', pivot: TRIG, rot: [30, 0, 0], cubes: [] },
    { name: 'gun', parent: 'twirl', pivot: G, cubes: revolver(G, 1) },
    // a sunburst single-cut slung on its back, the neck up over its left shoulder
    { name: 'guitar', parent: 'body', pivot: [0.4, 12.0, -7.9], rot: [-24, 180, 28], cubes: guitarCubes([0.4, 12.0, -7.9], { k: 1.18, id: 'pg-guitar', hide: true }) },
    // a black cowboy hat, tipped back over the quiff
    { name: 'stetson', parent: 'head', pivot: [0, 26.3, 2.4], rot: [-16, 0, 6], cubes: cowboyHatCubes([0, 26.3, 2.4], { k: 1.0, id: 'pg-hat' }) },
  ],
};
// appearance tiers: normal wears one of the first list, dripped adds one of the second, ultra dripped the third
def.drip = [
  [{ id: 'pg-bandana', name: 'Rose-bud bandana' }, { id: 'pg-rosetuck', name: 'Rose behind the head' }],
  [{ id: 'pg-chain', name: 'Gold rose chain' }, { id: 'pg-choker', name: 'Studded choker' }],
  [{ id: 'pg-guitar', name: 'Sunburst guitar' }, { id: 'pg-hat', name: 'Black cowboy hat' }],
];
def.attach = { ...ATTACH_S1, head: { bone: 'head', at: [0, 26.1, 2.8], size: 8.3 } };

// ---------------------------------------------------------------- animation
// level the revolver at the target: the arm swings forward, the hand and the twirl bring the barrel level
const AIM = (P, k) => P.rot('wingR', -64 * k, 0, 8 * k).rot('handR', 12 * k, 0, 0).rot('twirl', 22 * k, 0, 0);
const snap = (keys, t) => key(keys, t);
export const anim = {
  start: 'idle', seed: 5,
  breathe: { bone: 'body', amp: 0.016, per: 2.4 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.0, 4.6], dur: 0.1 },
  look: { bone: 'head', yaw: 30, pitch: 14, speed: 9 },
  springs: [
    { bone: 'bandR', tip: [0, -1, -4], k: 110, d: 8, gain: 0.9, max: 30 },
    { bone: 'bandL', tip: [0, -1, -3.5], k: 120, d: 8, gain: 0.9, max: 30 },
    { bone: 'tail', tip: [0, 0, -9], k: 220, d: 12, gain: 0.45, max: 12 },
    { bone: 'hairRose', tip: [0, 1.5, 0], k: 300, d: 12, gain: 0.3, max: 8 },
    { bone: 'handL', tip: [0, 0, -9], k: 260, d: 13, gain: 0.3, max: 8 },
  ],
  faces: { eyes: EYES.slot },
  fidget: { every: [4.5, 8], clips: ['peck', 'spin', 'puff'] },
  clips: {
    // standing its ground: chest out, weight rolling foot to foot, the head snapping round in jerky pigeon
    // looks (snap — hold — snap), the revolver tapping its thigh, a tail flick, a slow sizing-up tilt
    idle: { len: 2.4, loop: true, f(P, t) {
      const sw = wave(t, 1 / 2.4), b = Math.sin((t / 2.4) * Math.PI * 4), dy = 0.22 * b - 0.1;
      P.pos('body', sw * 0.3, dy, 0).rot('body', -2, sw * 2, sw * 2.2); plant(P, dy, 4);
      P.pos('footR', 0, Math.max(0, -sw) * 0.25, 0).pos('footL', 0, Math.max(0, sw) * 0.25, 0);
      const yaw = snap([[0, 0], [0.32, 0, 'lin'], [0.4, 24, 'out3'], [1.02, 24, 'lin'], [1.1, -18, 'out3'], [1.66, -18, 'lin'], [1.74, 2, 'out3'], [2.4, 0, 'lin']], t);
      const tilt = bump(t, 1.74, 2.36), bob = bump(t, 0.4, 0.5) + bump(t, 1.1, 1.2);
      P.rot('head', 2 + 2 * b - 4 * bob, yaw, -10 * tilt - yaw * 0.12).pos('neck', 0, 0, 0.5 * bob).scl('neck', 1 + 0.025 * b);
      P.face('eyes', tilt > 0.3 ? 'smug' : undefined); DART(P, Math.sign(yaw) * Math.min(1, Math.abs(yaw) / 20) * 0.35);
      ES(P, 1, 1 - 0.18 * tilt);
      const tap = Math.max(0, Math.sin((t / 0.6) * Math.PI * 2)) ** 3;
      P.rot('handR', -5 * tap, 0, 0).rot('twirl', 4 * tap, 0, 0).rot('wingR', -2 * tap, 0, 0);
      P.rot('tail', 12 * bump(t, 1.42, 1.6), sw * 4, 0).rot('wingL', 0, 0, 1.5 + b);
    } },
    // the strut: the head thrusts forward and holds while the body catches up, chest out, the gun arm
    // swinging against the step, the bandana tails flapping on their springs
    walk: { len: 0.8, loop: true, f(P, t) {
      const r = strut(P, t, 0.8, { Z: 2.2, H: 1.5, A: 1.6, roll: 4, yaw: 6, bounce: 0.7, tilt: -3 });
      P.rot('wingR', -r.s * 12, 0, -2 - Math.abs(r.s) * 3).rot('handR', r.s * 8, 0, 0).rot('twirl', -r.s * 6, 0, 0);
      P.rot('wingL', r.s * 4, 0, 2 + Math.abs(r.s) * 2.5);
    } },
    // battle cry: puffs its neck and bows low in a pigeon's coo display, tail fanned and dragging, then
    // rears up roaring with the revolver thrust at the sky
    cry: { len: 2.1, next: 'idle', f(P, t) {
      const puff = seg(t, 0, 0.3, E.out) * (1 - seg(t, 1.7, 2.05, E.inout)), bow = bump(t, 0.28, 0.78);
      const rear = seg(t, 0.74, 0.92, E.back) * (1 - seg(t, 1.55, 1.95, E.inout));
      P.scl('neck', 1 + 0.2 * puff, 1 + 0.06 * puff, 1 + 0.2 * puff);
      P.rot('head', 34 * bow - 24 * rear + wave(t, 13) * 3 * rear, 0, wave(t, 7) * 3 * rear).pos('neck', 0, -1.4 * bow, 1.2 * bow);
      P.rot('body', 16 * bow - 12 * rear, 0, 0).rot('tail', -26 * bow + 10 * rear, 0, 0).scl('tail', 1 + 0.4 * bow + 0.2 * rear, 1, 1);
      const dy = -1.2 * bow + 1.2 * rear; P.pos('body', 0, dy, 0).sq('body', 0.05 * rear * (1 - seg(t, 0.92, 1.1)) + wob(t, 1.9, 0.04, 3, 5)); plant(P, dy, 4);
      P.rot('wingR', -150 * rear, 0, -18 * rear).rot('handR', 6 * rear, 0, 0).rot('twirl', -30 * rear, 0, 0);
      P.rot('wingL', 0, 0, 58 * rear + wave(t, 6) * 8 * rear).rot('handL', 0, 34 * rear, 0);
      P.rot('jaw', 6 * bow + 30 * rear);
      P.face('eyes', bow > 0.5 ? 'closed' : rear > 0.3 ? 'angry' : undefined); P.lookW = 1 - Math.max(bow, rear); ES(P, 1 + 0.1 * rear, 1 + 0.2 * rear);
      P.burst(0.3, 'sparkle', 'neck', [0, 17, 5], { n: 6, spread: 1 }).burst(0.55, 'note', 'head', [4, 25, 3], {});
      P.burst(0.9, 'anger', 'head', [5, 27, 2], {}).burst(0.92, 'sparkle', 'gun', MZ, { n: 5 });
    } },
    // pistol-whip: winds the revolver back over its shoulder, lunges and cracks the butt down
    attack: { len: 1.05, next: 'idle', f(P, t) {
      const wind = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.3, 0.38, E.in)), hit = seg(t, 0.3, 0.42, E.in3) * (1 - seg(t, 0.56, 1.0, E.inout));
      const step = key([[0, 0], [0.3, -1.4], [0.42, 6, 'out'], [0.62, 5.2], [1.05, 0]], t);
      P.pos('root', 0, 0, step);
      P.rot('wingR', -160 * wind + 18 * hit, 0, -14 * wind + 8 * hit).rot('handR', 24 * wind - 10 * hit, 0, 0).rot('twirl', 50 * wind + 70 * hit, 0, 0);
      P.rot('body', -12 * wind + 18 * hit, 16 * wind - 12 * hit, 0).rot('head', -10 * wind + 14 * hit, -10 * wind, 0).rot('jaw', 16 * wind);
      P.rot('wingL', 0, 0, 30 * wind - 10 * hit).rot('tail', 12 * hit, 0, 0);
      const dy = -1.0 * wind + wob(t, 0.42, -0.8, 3, 6); P.pos('body', 0, dy, 0).sq('body', -0.06 * wind + wob(t, 0.42, 0.06, 4, 7)); plant(P, dy, 4);
      P.face('eyes', t > 0.05 && t < 0.36 ? 'angry' : t < 0.8 ? 'shut' : undefined); ES(P, 1 + 0.15 * hit, 1 - 0.2 * wind + 0.15 * hit);
      P.burst(0.12, 'anger', 'head', [5, 27, 3], {});
      P.burst(0.42, 'spark', 'gun', [G[0], G[1] - 3.6, G[2] - 1.6], { scale: 1.3 }).burst(0.42, 'star', 'gun', [G[0], G[1] - 3.6, G[2] - 1.6], { n: 5 });
    } },
    // special (the shot): levels the six-shooter, sights down the barrel with a squint… BANG — a star of
    // muzzle flash, sparks and a shockwave ring, the recoil kicks the wing up and rocks it back on its
    // heels; smoke curls from the barrel and it blows it away
    special: { len: 2.0, next: 'idle', f(P, t) {
      const aimK = seg(t, 0.05, 0.4, E.back) * (1 - seg(t, 1.5, 1.9, E.inout));
      AIM(P, aimK);
      P.rot('head', 6 * aimK, -14 * aimK, 10 * aimK).rot('body', 0, -10 * aimK, 0);
      P.face('eyes', t > 0.3 && t < 0.74 ? 'angry' : t < 0.98 ? 'shock' : t > 1.2 && t < 1.55 ? 'smug' : undefined);
      ES(P, 1 + 0.2 * bump(t, 0.74, 0.98), 1 - 0.3 * seg(t, 0.4, 0.7) * (1 - seg(t, 0.72, 0.76)) + 0.4 * bump(t, 0.74, 0.98));
      const tremble = seg(t, 0.4, 0.72) * (1 - seg(t, 0.72, 0.74)); P.rot('handR', wave(t, 11) * 1.5 * tremble, 0, 0);
      const kick = seg(t, 0.74, 0.78, E.out) * (1 - seg(t, 0.78, 1.15, E.inout));
      P.rot('wingR', -30 * kick, 0, 0).rot('twirl', -38 * kick, 0, 0).rot('body', -9 * kick, 0, 0).pos('body', 0, 0.4 * kick, -1.4 * kick).rot('head', -10 * kick, 0, 0);
      P.sq('body', wob(t, 0.76, 0.05, 4, 6)).rot('tail', 16 * kick, 0, 0);
      P.burst(0.75, 'pg_flash', 'gun', MZ, {}).burst(0.75, 'ring', 'gun', MZ, { scale: 1.4 }).burst(0.75, 'spark', 'gun', MZ, { scale: 1.6 });
      P.burst(0.75, 'ember', 'gun', MZ, { n: 14, dir: [0, 0.15, 1], speed: 2.2, spread: 0.35 }).burst(0.76, 'sparkle', 'gun', MZ, { n: 6, dir: [0, 0, 1], speed: 1.2 });
      if (t > 0.8 && t < 1.6) P.stream('pg_smoke', 'gun', MZ, { rate: 12, dir: [0, 1, 0.2] });
      const blow = bump(t, 1.22, 1.52); P.rot('jaw', 14 * blow).rot('head', 6 * blow, -18 * blow, 0);
      P.burst(1.34, 'pg_smoke', 'head', BEAK, { n: 5, dir: [-0.7, 0.2, 1], speed: 1.4, spread: 0.3 });
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.2, 0.65, E.inout));
      P.pos('root', 0, 0, -2.4 * k).rot('body', -14 * k + wob(t, 0.2, 4, 3, 6), 0, wave(t, 16) * 4 * k).sq('body', -0.12 * k);
      P.rot('head', -18 * k, 0, 10 * k).rot('jaw', 22 * k).scl('neck', 1 + 0.16 * k);
      P.rot('wingR', -26 * k, 0, -22 * k).rot('wingL', 0, 0, 40 * k).rot('handL', 0, 24 * k, 0).rot('tail', 18 * k, 0, 0);
      P.face('eyes', t < 0.1 ? 'shock' : t < 0.42 ? 'shut' : undefined); ES(P, 1 + 0.25 * bump(t, 0, 0.12), 1 + 0.4 * bump(t, 0, 0.12) - 0.2 * bump(t, 0.12, 0.42));
      P.burst(0.06, 'sweat', 'head', [5, 25, 5], { n: 2, dir: [1, 0.5, 0] });
      P.burst(0.02, 'pg_feather', 'body', [0, 12, 0], { n: 8, speed: 1.6 }).burst(0.02, 'spark', 'body', [0, 13, 9], {});
    } },
    // dizzy stagger, the revolver drooping, knees buckle, and it keels over onto its side, feet stuck out
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce);
      P.rot('body', wave(t, 1.5) * 8 * dizzy, wave(t, 1.8) * 14 * dizzy, wave(t, 2.2) * 8 * dizzy).rot('head', 0, wave(t, 2.2, 1) * 22 * dizzy, wave(t, 1.6) * 14 * dizzy);
      P.rot('wingR', 18 * dizzy, 0, 8 * dizzy).rot('twirl', 50 * (dizzy + fall), 0, 0).rot('handR', 20 * fall, 0, 0);
      const dy = -1.8 * dizzy; P.pos('body', 0, dy, 0); plant(P, dy, 4);
      P.rot('root', 0, 0, -86 * fall).pos('root', 4.4 * fall, 5.6 * fall, 0);
      P.rot('legR', -20 * fall, 0, 10 * fall).rot('legL', 18 * fall, 0, 14 * fall).rot('wingL', 0, 0, -10 * fall).rot('head', 0, 0, -14 * fall).rot('jaw', 24 * fall).rot('tail', 0, 0, 10 * fall);
      P.face('eyes', t < 0.4 ? 'teary' : 'swirl'); P.blinkOK = false; P.lookW = 0; ES(P, 1 + 0.15 * bump(t, 0.3, 0.6));
      P.burst(0.25, 'tear', 'head', [-3.5, 22, 7.2], { n: 3, dir: [-1, 0.5, 0.5] });
      P.burst(0.25, 'star', 'head', [0, 27, 0], { n: 5 }).burst(1.4, 'dust', 'root', [6, 1, 0], { n: 7, spread: 1 }).burst(1.4, 'pg_feather', 'body', [0, 12, 0], { n: 5, speed: 1 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      P.rot('root', 0, 0, -86).pos('root', 4.4, 5.6, 0).rot('twirl', 50, 0, 0).rot('handR', 20, 0, 0);
      P.rot('legR', -20 + wave(t, 0.42) * 6, 0, 10).rot('legL', 18, 0, 14).rot('footR', wave(t, 0.84) * 10 * bump(t, 1.2, 1.7), 0, 0);
      P.rot('wingL', 0, 0, -10).rot('head', 0, 0, -14).rot('jaw', 24 + wave(t, 0.42, 1) * 4).rot('tail', 0, 0, 10);
      P.face('eyes', 'x'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.burst(0.5, 'star', 'head', [0, 27, 0], { n: 2 }).burst(1.7, 'pg_feather', 'body', [0, 14, 0], { n: 1, speed: 0.4 });
    } },
    // victory: two spins of the revolver round its wingtip, a catch, then up beside its head with the chest
    // and neck puffed, and a cool blow across the muzzle
    win: { len: 2.3, next: 'idle', f(P, t) {
      const up = seg(t, 0, 0.22, E.out) * (1 - seg(t, 1.0, 1.15, E.inout));
      P.rot('wingR', -36 * up, 0, -22 * up).rot('handR', -18 * up, 0, 0);
      P.rot('twirl', -720 * seg(t, 0.12, 0.95, E.inout) + wob(t, 0.95, 16, 4, 6), 0, 0);
      const hop = bump(t, 0.9, 1.15); P.pos('root', 0, 2.2 * hop, 0).sq('body', 0.08 * hop - 0.08 * bump(t, 1.15, 1.3));
      const pose = seg(t, 1.0, 1.18, E.back) * (1 - seg(t, 1.95, 2.3, E.inout));
      P.rot('wingR', -128 * pose, 0, -10 * pose).rot('handR', -6 * pose, 0, 0).rot('twirl', -64 * pose, 0, 0);
      P.scl('neck', 1 + 0.18 * pose, 1 + 0.06 * pose, 1 + 0.18 * pose).rot('body', -8 * pose, 0, 0).sq('body', 0.04 * pose);
      P.rot('head', -8 * pose, -12 * pose * bump(t, 1.35, 1.75), 0).rot('jaw', 10 * bump(t, 1.4, 1.7));
      P.face('eyes', pose > 0.3 ? (t < 1.5 ? 'star' : 'smug') : t > 0.2 && t < 1.0 ? 'smug' : undefined); ES(P, 1 + 0.15 * bump(t, 1.0, 1.4));
      P.burst(1.08, 'sparkle', 'gun', MZ, { n: 5 }).burst(1.5, 'pg_smoke', 'gun', MZ, { n: 3, dir: [0, 1, 0], speed: 0.6 }).burst(1.2, 'note', 'head', [4, 26, 2], {});
    } },
    // asleep: fluffed into a ball, head tucked into its shoulder, the revolver hugged to its chest
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * Math.PI * 2), dy = -2.2 + br * 0.25;
      P.pos('body', 0, dy, 0).scl('body', 1.06 + br * 0.015, 1.04 + br * 0.03, 1.05); plant(P, dy, 4);
      P.pos('neck', 0, -2.2, -1.4).rot('neck', 16, 0, 0).rot('head', 24 + br * 2, -28, 14);
      P.rot('wingR', 26, 0, 8).rot('handR', -10, 0, 0).rot('twirl', 40, 0, 0).rot('tail', 6, 0, 0);
      P.face('eyes', 'closed'); ES(P, 1.05, 0.8 + 0.05 * br); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'head', [3, 25, 4], {}).burst(1.9, 'z', 'head', [3, 25, 4], {});
    } },
    // fidget: three quick pecks at breadcrumbs (crumbs fly), a gulp
    peck: { len: 2.4, next: 'idle', f(P, t) {
      const look = seg(t, 0, 0.28, E.out) * (1 - seg(t, 1.85, 2.3, E.inout));
      let pk = 0; for (const t0 of [0.42, 0.82, 1.18]) pk += peck(t, t0, 0.26);
      P.rot('body', 34 * look + 10 * pk, 0, 0).rot('head', 30 * look + 24 * pk, 0, -6 * look).pos('neck', 0, -1.2 * look - 1.6 * pk, 1.4 * look + 2.0 * pk);
      const dy = -0.6 * look; P.pos('body', 0, dy, 0); plant(P, dy, 4);
      P.rot('tail', -8 * look - 8 * pk, 0, 0).rot('wingR', -20 * look, 0, 0);
      for (const t0 of [0.42, 0.82, 1.18]) P.burst(t0 + 0.1, 'pg_crumb', 'root', [0, 0.4, 10], { n: 6, dir: [0, 1, 0.4] });
      const gulp = bump(t, 1.55, 1.8); P.scl('neck', 1 + 0.12 * gulp, 1 - 0.05 * gulp, 1 + 0.12 * gulp);
      P.face('eyes', t < 0.4 ? 'wide' : t > 1.5 && t < 1.82 ? 'happy' : undefined); ES(P, 1 + 0.15 * bump(t, 0.05, 0.45), 1 + 0.25 * bump(t, 0.05, 0.45) - 0.2 * bump(t, 1.5, 1.82)); DART(P, -0.3 * bump(t, 0.05, 0.4));
    } },
    // fidget: twirls the six-shooter three times round its wingtip and catches it, smug
    spin: { len: 1.8, next: 'idle', f(P, t) {
      const up = seg(t, 0, 0.2, E.out) * (1 - seg(t, 1.4, 1.75, E.inout));
      P.rot('wingR', -34 * up, 0, -20 * up).rot('handR', -20 * up, 0, 0);
      P.rot('twirl', -1080 * seg(t, 0.18, 1.08, E.inout) + wob(t, 1.08, 14, 4, 6), 0, 0);
      P.rot('head', 10 * up, -16 * up, 6 * up);
      P.face('eyes', t > 0.2 && t < 1.08 ? 'smug' : t > 1.1 && t < 1.6 ? 'smug' : undefined); DART(P, 0.3 * wave(t, 3) * bump(t, 0.2, 1.08));
      P.burst(1.1, 'sparkle', 'gun', MZ, { n: 3 });
    } },
    // fidget: the coo display — neck puffed, two bows, a half turn on the spot and back
    puff: { len: 2.0, next: 'idle', f(P, t) {
      const pf = seg(t, 0.08, 0.38, E.out) * (1 - seg(t, 1.55, 1.95, E.inout)), bw = bump(t, 0.5, 0.82) + bump(t, 0.92, 1.24);
      P.scl('neck', 1 + 0.24 * pf, 1 + 0.08 * pf, 1 + 0.24 * pf).sq('body', 0.04 * pf).rot('body', -6 * pf + 8 * bw, 0, 0);
      P.rot('head', 24 * bw - 6 * pf, 0, 0).pos('neck', 0, -0.8 * bw, 0.8 * bw).rot('tail', -14 * pf, 0, 0).scl('tail', 1 + 0.3 * pf, 1, 1);
      P.rot('root', 0, 36 * Math.sin(seg(t, 0.4, 1.4, E.inout) * Math.PI), 0);
      const st = Math.sin(seg(t, 0.4, 1.4, E.lin) * Math.PI * 4); P.pos('footR', 0, Math.max(0, st) * 0.8, 0).pos('footL', 0, Math.max(0, -st) * 0.8, 0);
      P.face('eyes', bw > 0.5 ? 'closed' : pf > 0.5 ? 'smug' : undefined); ES(P, 1, 1 - 0.15 * pf); P.rot('jaw', 10 * bw);
      P.burst(0.62, 'note', 'head', [4, 25, 3], {}).burst(1.06, 'note', 'head', [-4, 25, 3], {});
    } },
  },
};
def.anim = anim;
