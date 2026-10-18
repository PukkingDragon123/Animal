// Pidgun ♀ — the same street species, female form (homage: Guns N' Roses). An ash-red pigeon: rosy-cream
// plumage, wine-red wing bars, a neck that flashes pink and violet, almond rose-red ring eyes with a single
// lash flick, a little curled quiff on her crown, and a long-stemmed red rose held up in her left wing like she's daring you to
// take it — her signature. Drip (one choice per tier): a second rose tucked behind her head feathers or a
// rose-bud headband; a studded choker with a rose pendant or a gold chain with a heart; red heart shades pushed
// up on her crown or a cherry guitar on her back. Rose petals are painted along her tail; a quiff curls on top.
// Sassier than the male: a swaying strut, a hip-roll idle, a slap with the free wing, and a storm
// of rose petals for a special.
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { C, P, S1, MORPH, stage1, wingSegP, tipsP, pigeonEyeRig, quiffCubes, shadesCubes, guitarCubes, chokerCubes, chainCubes, bandanaS1, tuckedRose, rose, leafP, plant, strut, peck, ATTACH_S1 } from './pigeon_parts.js';

const M = MORPH.ash;
// her own low-res eyes: almond rose-red rings round a dark pupil, one lash flick
const EYES = pigeonEyeRig({ grid: [5, 5], ring: ['#ff5a74', '#d02c4c'], pupil: 'round', shape: 'almond', lash: true, py: 0.4, at: S1.eyeAt, size: [10 / 3, 10 / 3] });
const ES = (P, x, y = x) => P.scl('eyeR', x, y, 1).scl('eyeL', x, y, 1);
const HAND = wingSegP({ ...M, base: [6.8, 8.4, 1.2], dir: [0, 0, 1], len: 7.0, cdir: [0, -1, 0], chord: 4.4, kind: 'hand' });
const BANDANA = bandanaS1('pr-band', { headband: true });
const RB = [8.4, 15.6, 6.6], BLOOM = [8.4, 15.6, 6.6], BEAK = S1.mouth;

export const def = {
  name: 'pidrose', ppu: 3, scale: 0.31, outline: { color: C.ink, px: 1.4 },
  bones: [
    ...stage1({ M, wingL: false, tailPetals: true, headExtra: [...quiffCubes([0, 24.9, 4.4], M.head, 0.85), ...BANDANA.head],
      neckExtra: [
        ...chokerCubes({ xs: 4.4, y: 16.6, z0: -0.6, z1: 6.6, id: 'pr-choker', hide: true }),
        ...chainCubes({ xs: 4.45, y: 16.2, z0: -0.6, z1: 6.6, at: [0, 13.9, 9.4], id: 'pr-chain', kind: 'heart' }),
      ] }),
    ...EYES.bones,
    // the rose wing, held like an arm: coverts from the shoulder, the primaries closed round the stem
    { name: 'wingL', parent: 'body', pivot: [6.0, 14.6, 3.6], rot: [-22, 0, 4], cubes: [
      P([6.0, 6.6, -0.6], [1.3, 8.6, 4.8], wingSegP({ ...M, base: [6.0, 15.2, 4.2], dir: [0, -1, 0], len: 8.6, cdir: [0, 0, -1], chord: 4.8, kind: 'arm', bar1: 0.46, bar2: 0.66, barW: 0.08 })),
      P([6.65, 7.2, -2.0], [0, 7.4, 2.0], tipsP({ n: 4, cols: M.slate, dir: 'back' }), { plane: 'x' }),
    ] },
    { name: 'handL', parent: 'wingL', pivot: [6.8, 7.6, 1.2], rot: [4, -16, 0], cubes: [
      P([6.2, 4.0, 1.2], [1.2, 4.4, 7.0], HAND),
      P([6.6, 4.1, 5.4], [2.6, 2.4, 2.4], HAND),
    ] },
    { name: 'rose', parent: 'handL', pivot: [8.4, 5.2, 6.6], rot: [18, 0, 8], cubes: rose(RB, 1, { stem: 8 }) },
    tuckedRose('hairRose', 'pr-rosetuck'), ...BANDANA.bones,
    // red heart shades pushed up on her crown, behind the quiff
    { name: 'shades', parent: 'head', pivot: [0, 26.2, 1.0], rot: [-38, 0, 0], cubes: shadesCubes([0, 26.2, 1.0], { k: 0.95, kind: 'heart', id: 'pr-shades', hide: true }) },
    // a cherry single-cut slung on her back, the neck up over her right shoulder
    { name: 'guitar', parent: 'body', pivot: [-0.4, 12.0, -7.9], rot: [-24, 180, -28], cubes: guitarCubes([-0.4, 12.0, -7.9], { k: 1.1, id: 'pr-guitar', hide: true, finish: ['#ff5a5a', '#d0203a', '#8a0c24', '#3a0610'] }) },
  ],
};
def.drip = [
  [{ id: 'pr-rosetuck', name: 'Rose in her feathers' }, { id: 'pr-band', name: 'Rose-bud headband' }],
  [{ id: 'pr-choker', name: 'Rose-pendant choker' }, { id: 'pr-chain', name: 'Gold heart chain' }],
  [{ id: 'pr-shades', name: 'Heart shades' }, { id: 'pr-guitar', name: 'Cherry guitar' }],
];
def.attach = ATTACH_S1;

// ---------------------------------------------------------------- animation
// bring the bloom up under the bill (k 0..1)
const SNIFF = (P, k) => P.rot('wingL', -40 * k, 0, -14 * k).rot('handL', -24 * k, -10 * k, 0).rot('rose', -10 * k, 0, 18 * k);
export const anim = {
  start: 'idle', seed: 9,
  breathe: { bone: 'body', amp: 0.016, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 5.0], dur: 0.11 },
  look: { bone: 'head', yaw: 30, pitch: 14, speed: 8 },
  springs: [
    { bone: 'tail', tip: [0, 0, -9], k: 200, d: 11, gain: 0.5, max: 14 },
    { bone: 'handR', tip: [0, 0, -9], k: 260, d: 13, gain: 0.3, max: 8 },
    { bone: 'rose', tip: [0, 9, 0], k: 240, d: 10, gain: 0.5, max: 12 },
    { bone: 'hairRose', tip: [0, 1.5, 0], k: 300, d: 12, gain: 0.3, max: 8 },
    { bone: 'bandR', tip: [0, -1, -4], k: 110, d: 8, gain: 0.9, max: 30 },
    { bone: 'bandL', tip: [0, -1, -3.5], k: 120, d: 8, gain: 0.9, max: 30 },
  ],
  faces: { eyes: EYES.slot },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'toss', 'toss', 'sniff', 'preen', 'peck'] },
  clips: {
    // all attitude: the hips roll, the tail swishes, the head tips with a slow sassy tilt, the rose turns
    idle: { len: 2.6, loop: true, f(P, t) {
      const sw = wave(t, 1 / 2.6), b = Math.sin((t / 2.6) * Math.PI * 4), dy = 0.2 * b - 0.1;
      P.pos('body', sw * 0.5, dy, 0).rot('body', -2, sw * 4, sw * 4); plant(P, dy, 4);
      P.pos('footR', 0, Math.max(0, -sw) * 0.3, 0).pos('footL', 0, Math.max(0, sw) * 0.3, 0);
      P.rot('tail', 0, -sw * 12, sw * 6);
      const yaw = key([[0, 0], [0.5, 0, 'lin'], [0.58, 16, 'out3'], [1.3, 16, 'lin'], [1.4, -10, 'out3'], [2.0, -10, 'lin'], [2.1, 0, 'out3'], [2.6, 0, 'lin']], t);
      const tip = bump(t, 1.4, 2.4);
      P.rot('head', 2 + 2 * b, yaw, 12 * tip - sw * 4).scl('neck', 1 + 0.02 * b);
      P.rot('rose', 0, wave(t, 1 / 2.6) * 20, 0).rot('wingL', -2 * b, 0, 0);
      P.face('eyes', bump(t, 1.5, 2.3) > 0.5 ? 'smug' : bump(t, 0.6, 1.2) > 0.6 ? 'wink' : undefined); P.pos('eyeR', yaw * 0.015, 0, 0).pos('eyeL', yaw * 0.015, 0, 0); ES(P, 1, 1 - 0.15 * bump(t, 1.5, 2.3));
    } },
    // the sassy strut: the head-bob, hips swinging wide, the tail swishing, the rose held high
    walk: { len: 0.84, loop: true, f(P, t) {
      const r = strut(P, t, 0.84, { Z: 2.0, H: 1.4, A: 1.5, roll: 7, yaw: 10, bounce: 0.6, tilt: -3 });
      P.rot('tail', 0, -r.s * 10, r.s * 6).rot('wingL', -r.s * 5, 0, 0).rot('rose', 0, r.s * 8, 0);
      P.rot('wingR', r.s * 4, 0, -2 - Math.abs(r.s) * 2);
    } },
    // battle cry: a twirl on the spot, then the rose thrust out like a sword, neck puffed, a shriek
    cry: { len: 2.0, next: 'idle', f(P, t) {
      const spin = seg(t, 0.05, 0.6, E.inout), dip = bump(t, 0.0, 0.25);
      P.rot('root', 0, 360 * spin, 0).pos('root', 0, 1.6 * bump(t, 0.12, 0.55), 0);
      const dy = -1.0 * dip; P.pos('body', 0, dy, 0); plant(P, dy, 4);
      const thrust = seg(t, 0.6, 0.78, E.back) * (1 - seg(t, 1.55, 1.95, E.inout));
      P.rot('wingL', -86 * thrust, 0, -16 * thrust).rot('handL', -6 * thrust, 0, 0).rot('rose', 46 * thrust, 0, 10 * thrust);
      P.rot('wingR', 0, 0, -50 * thrust + wave(t, 6) * 6 * thrust).rot('handR', 0, -26 * thrust, 0);
      P.scl('neck', 1 + 0.18 * thrust, 1 + 0.05 * thrust, 1 + 0.18 * thrust).rot('head', -20 * thrust + wave(t, 12) * 3 * thrust, 0, 0).rot('jaw', 30 * thrust);
      P.rot('body', -8 * thrust, 0, 0).sq('body', 0.05 * thrust * (1 - seg(t, 0.78, 0.95)) + wob(t, 1.9, 0.04, 3, 5)).rot('tail', 14 * thrust, 0, 0).scl('tail', 1 + 0.3 * thrust, 1, 1);
      P.face('eyes', thrust > 0.4 ? 'angry' : spin > 0 && spin < 1 ? 'happy' : undefined); P.lookW = 1 - thrust; ES(P, 1 + 0.1 * thrust, 1 + 0.2 * thrust);
      P.burst(0.74, 'pg_petal', 'rose', BLOOM, { n: 14, speed: 1.4 }).burst(0.76, 'sparkle', 'rose', BLOOM, { n: 5 }).burst(0.8, 'anger', 'head', [-5, 27, 2], {});
    } },
    // attack (wing-slap): the free wing swings out wide, she steps in and slaps it across
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const wind = seg(t, 0, 0.28, E.out) * (1 - seg(t, 0.28, 0.36, E.in)), hit = seg(t, 0.28, 0.4, E.in3) * (1 - seg(t, 0.55, 0.95, E.inout));
      const step = key([[0, 0], [0.28, -1.2], [0.4, 5.2, 'out'], [0.6, 4.6], [1.0, 0]], t);
      P.pos('root', 0, 0, step).rot('root', 0, 22 * wind - 30 * hit, 0);
      P.rot('wingR', -30 * wind - 40 * hit, -50 * wind + 70 * hit, -70 * wind + 10 * hit).rot('handR', 0, -30 * wind + 20 * hit, 0);
      P.rot('body', -8 * wind + 12 * hit, 0, -6 * wind + 8 * hit).rot('head', -8 * wind + 8 * hit, 14 * wind - 16 * hit, 0).rot('jaw', 12 * hit);
      const dy = -0.8 * wind + wob(t, 0.4, -0.7, 3, 6); P.pos('body', 0, dy, 0).sq('body', -0.05 * wind + wob(t, 0.4, 0.05, 4, 7)); plant(P, dy, 4);
      P.face('eyes', t > 0.05 && t < 0.3 ? 'angry' : t < 0.75 ? 'shut' : t < 1.0 ? 'smug' : undefined); ES(P, 1 + 0.15 * hit, 1 - 0.2 * wind);
      P.burst(0.1, 'anger', 'head', [-5, 27, 3], {});
      P.burst(0.4, 'spark', 'root', [-3, 13, 13], { scale: 1.2 }).burst(0.4, 'star', 'root', [-3, 13, 13], { n: 4 }).burst(0.4, 'pg_feather', 'root', [-3, 13, 12], { n: 3 });
    } },
    // special (petal storm): she spins with the rose held out, a whirl of petals rising round her, then
    // flings the rose arm forward and the storm tears across at the target
    special: { len: 2.2, next: 'idle', f(P, t) {
      const out = seg(t, 0, 0.25, E.out) * (1 - seg(t, 1.8, 2.15, E.inout)), whirl = seg(t, 0.2, 1.25, E.inout);
      P.rot('root', 0, 720 * whirl, 0).pos('root', 0, 1.2 * Math.sin(whirl * Math.PI), 0);
      P.rot('wingL', -70 * out, 0, -40 * out).rot('rose', 20 * out, 0, 0).rot('wingR', 0, 0, -40 * out * (1 - seg(t, 1.25, 1.4)));
      const fling = seg(t, 1.25, 1.38, E.out) * (1 - seg(t, 1.6, 2.0, E.inout));
      P.rot('wingL', -40 * fling, 0, 30 * fling).rot('body', 10 * fling, 0, 0).pos('root', 0, 0, 2 * fling).rot('head', 8 * fling, 0, 0);
      P.face('eyes', whirl > 0.05 && whirl < 0.95 ? 'closed' : fling > 0.3 ? 'angry' : t > 1.7 ? 'heart' : undefined); P.lookW = 1 - out; ES(P, 1 + 0.15 * fling, 1 + 0.25 * fling);
      if (t > 0.25 && t < 1.3) P.stream('pg_petal', 'root', [0, 6, 0], { rate: 70, dir: [0, 1, 0], speed: 2.2, spread: 1 }).stream('pg_petal', 'rose', BLOOM, { rate: 30, speed: 1.2 });
      P.burst(1.3, 'pg_petal', 'rose', BLOOM, { n: 40, dir: [0, 0.2, 1], speed: 3.2, spread: 0.45 }).burst(1.3, 'sparkle', 'rose', BLOOM, { n: 8, dir: [0, 0, 1], speed: 2 });
      P.burst(1.32, 'ring', 'rose', BLOOM, { scale: 1.2 });
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.2, 0.65, E.inout));
      P.pos('root', 0, 0, -2.4 * k).rot('body', -14 * k + wob(t, 0.2, 4, 3, 6), 0, wave(t, 16) * 4 * k).sq('body', -0.12 * k);
      P.rot('head', -18 * k, 0, -10 * k).rot('jaw', 22 * k).scl('neck', 1 + 0.16 * k);
      P.rot('wingL', 20 * k, 0, 24 * k).rot('wingR', 0, 0, -40 * k).rot('handR', 0, -24 * k, 0).rot('tail', 18 * k, 0, 0);
      P.face('eyes', t < 0.1 ? 'shock' : t < 0.42 ? 'shut' : undefined); ES(P, 1 + 0.25 * bump(t, 0, 0.12), 1 + 0.4 * bump(t, 0, 0.12) - 0.2 * bump(t, 0.12, 0.42));
      P.burst(0.06, 'sweat', 'head', [-5, 25, 5], { n: 2, dir: [-1, 0.5, 0] });
      P.burst(0.02, 'pg_feather', 'body', [0, 12, 0], { n: 7, speed: 1.6, tint: [1, 0.9, 0.9] }).burst(0.02, 'pg_petal', 'rose', BLOOM, { n: 4 }).burst(0.02, 'spark', 'body', [0, 13, 9], {});
    } },
    // a woozy pirouette, the rose drooping, and she swoons onto her side
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce);
      P.rot('body', wave(t, 1.5) * 8 * dizzy, wave(t, 1.8) * 14 * dizzy, wave(t, 2.2) * 8 * dizzy).rot('head', 0, wave(t, 2.2, 1) * 22 * dizzy, wave(t, 1.6) * 14 * dizzy);
      P.rot('wingL', 20 * (dizzy + fall), 0, 10 * dizzy).rot('rose', 40 * (dizzy + fall), 0, 0);
      const dy = -1.8 * dizzy; P.pos('body', 0, dy, 0); plant(P, dy, 4);
      P.rot('root', 0, 0, 86 * fall).pos('root', -4.4 * fall, 5.6 * fall, 0);
      P.rot('legR', 18 * fall, 0, -14 * fall).rot('legL', -20 * fall, 0, -10 * fall).rot('wingR', 0, 0, 10 * fall).rot('head', 0, 0, 14 * fall).rot('jaw', 20 * fall).rot('tail', 0, 0, -10 * fall);
      P.face('eyes', t < 0.4 ? 'teary' : t < 0.95 ? 'swirl' : 'x'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.25, 'tear', 'head', [3.5, 22, 7.2], { n: 3, dir: [1, 0.5, 0.5] });
      P.burst(0.25, 'star', 'head', [0, 27, 0], { n: 5 }).burst(1.4, 'dust', 'root', [-6, 1, 0], { n: 7, spread: 1 }).burst(1.4, 'pg_petal', 'rose', BLOOM, { n: 8, speed: 0.8 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      P.rot('root', 0, 0, 86).pos('root', -4.4, 5.6, 0).rot('wingL', 20, 0, 0).rot('rose', 40, 0, 0);
      P.rot('legR', 18, 0, -14).rot('legL', -20 + wave(t, 0.42) * 6, 0, -10).rot('footL', wave(t, 0.84) * 10 * bump(t, 1.2, 1.7), 0, 0);
      P.rot('wingR', 0, 0, 10).rot('head', 0, 0, 14).rot('jaw', 20 + wave(t, 0.42, 1) * 4).rot('tail', 0, 0, -10);
      P.face('eyes', 'x'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.burst(0.5, 'star', 'head', [0, 27, 0], { n: 2 }).burst(1.6, 'pg_petal', 'rose', BLOOM, { n: 1, speed: 0.3 });
    } },
    // victory: a hop and a twirl, then a pose with the rose held to her breast, eyes ^ ^, petals drifting
    win: { len: 2.2, next: 'idle', f(P, t) {
      const hop = bump(t, 0.1, 0.5); P.pos('root', 0, 2.4 * hop, 0).rot('root', 0, 360 * seg(t, 0.1, 0.55, E.inout), 0).sq('body', 0.07 * hop - 0.07 * bump(t, 0.5, 0.65));
      const pose = seg(t, 0.55, 0.75, E.back) * (1 - seg(t, 1.85, 2.2, E.inout));
      P.rot('wingL', -46 * pose, 0, -26 * pose).rot('handL', -20 * pose, -14 * pose, 0).rot('rose', -6 * pose, 0, 22 * pose);
      P.rot('wingR', 0, 0, -36 * pose).rot('handR', 0, -20 * pose, 0).scl('neck', 1 + 0.12 * pose).rot('body', -6 * pose, 0, 0);
      P.rot('head', -6 * pose, 0, 12 * pose).rot('tail', 0, wave(t, 2) * 10 * pose, 0).scl('tail', 1 + 0.25 * pose, 1, 1);
      P.face('eyes', pose > 0.4 ? (t < 1.3 ? 'happy' : 'wink') : undefined); ES(P, 1, 1 - 0.1 * pose);
      P.burst(0.7, 'pg_petal', 'rose', BLOOM, { n: 16, speed: 1.2 }).burst(0.72, 'sparkle', 'head', [0, 26, 4], { n: 5 });
    } },
    // asleep: fluffed up, head tucked into her shoulder, the rose cradled against her
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * Math.PI * 2), dy = -2.2 + br * 0.25;
      P.pos('body', 0, dy, 0).scl('body', 1.06 + br * 0.015, 1.04 + br * 0.03, 1.05); plant(P, dy, 4);
      P.pos('neck', 0, -2.2, -1.4).rot('neck', 16, 0, 0).rot('head', 24 + br * 2, 28, -14);
      P.rot('wingL', 20, 0, -6).rot('handL', -16, 0, 0).rot('rose', -20, 0, 20).rot('tail', 6, 0, 0);
      P.face('eyes', 'closed'); ES(P, 1.05, 0.8 + 0.05 * br); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'head', [-3, 25, 4], {}).burst(1.9, 'z', 'head', [-3, 25, 4], {});
    } },
    // signature fidget: the rose toss — a dip, a flick, the rose spins up into the air… and she catches it
    // without looking, a puff of petals, a wink
    toss: { len: 2.2, next: 'idle', f(P, t) {
      const dip = bump(t, 0.05, 0.4), flick = seg(t, 0.35, 0.45, E.out) * (1 - seg(t, 0.5, 0.7)), air = seg(t, 0.42, 1.25, E.lin);
      const hgt = Math.sin(air * Math.PI) * 9 * (air > 0 && air < 1 ? 1 : 0);
      P.pos('body', 0, -0.8 * dip, 0); plant(P, -0.8 * dip, 4);
      P.rot('wingL', -40 * flick - 10 * dip, 0, 0).pos('rose', 0, hgt, hgt * 0.15).rot('rose', 0, 0, -720 * air * (air < 1 ? 1 : 0));
      const look = bump(t, 0.4, 1.2); P.rot('head', -24 * look, 0, -6 * look); P.lookW = 1 - look;
      const ctch = bump(t, 1.22, 1.5); P.rot('wingL', 10 * ctch, 0, 0).sq('body', -0.05 * ctch).rot('head', 6 * ctch, 0, 0);
      P.face('eyes', look > 0.3 ? 'wide' : t > 1.3 && t < 2.0 ? 'wink' : undefined); ES(P, 1 + 0.15 * look, 1 + 0.2 * look);
      P.burst(1.25, 'pg_petal', 'rose', BLOOM, { n: 8, speed: 1.0 }).burst(1.28, 'sparkle', 'rose', BLOOM, { n: 4 });
    } },
    // dance: the sassy sway — hips swinging on the beat, a full twirl, the rose held high, then a pose with a
    // shower of petals and a wink
    dance: { len: 2.6, next: 'idle', f(P, t) {
      const beat = (t / 0.42) % 1, hit = Math.exp(-beat * 6), on = 1 - seg(t, 2.0, 2.1), sw = Math.sin((t / 0.84) * Math.PI * 2) * on;
      P.pos('root', sw * 1.3, 0, 0).rot('body', 0, sw * 16, sw * 9).rot('tail', 0, -sw * 24, sw * 10).rot('head', 6 * hit * on, sw * 12, -sw * 10);
      const dy = -0.6 * hit * on; P.pos('body', 0, dy, 0); plant(P, dy, 4);
      P.rot('root', 0, 360 * seg(t, 1.0, 1.5, E.inout), 0).pos('root', 0, 1.2 * bump(t, 1.0, 1.5), 0);
      P.rot('wingL', -50 * on, 0, -10 * on).rot('rose', 0, 30 * Math.sin(t * Math.PI * 2), 0).rot('wingR', 0, 0, -30 * on - 10 * hit * on);
      const end = seg(t, 2.0, 2.15, E.back) * (1 - seg(t, 2.4, 2.6)); P.rot('wingL', -80 * end, 0, -20 * end).rot('body', -6 * end, 0, 0).rot('head', -8 * end, 0, 12 * end);
      P.face('eyes', end > 0.3 ? 'wink' : hit > 0.6 ? 'happy' : 'open'); ES(P, 1, 1 - 0.12 * hit * on);
      for (let i = 0; i < 5; i++) P.burst(i * 0.42 + 0.02, 'note', 'head', [i % 2 ? -4 : 4, 26, 3], {});
      P.burst(2.1, 'pg_petal', 'rose', BLOOM, { n: 24, speed: 1.6 }).burst(2.1, 'sparkle', 'head', [0, 27, 3], { n: 5 });
    } },
    // fidget: brings the rose to her bill, eyes closed, a long sniff… and a petal drifts off
    sniff: { len: 2.6, next: 'idle', f(P, t) {
      const k = seg(t, 0.1, 0.55, E.inout) * (1 - seg(t, 1.9, 2.4, E.inout));
      SNIFF(P, k); P.rot('head', 10 * k, 16 * k, -8 * k); P.lookW = 1 - k;
      const sn = bump(t, 0.8, 1.0) + bump(t, 1.05, 1.25); P.scl('neck', 1 + 0.06 * sn).rot('head', -5 * sn, 0, 0);
      const sigh = bump(t, 1.35, 1.9); P.sq('body', 0.05 * sigh).rot('head', -8 * sigh, 0, 0);
      P.face('eyes', k > 0.6 && t < 1.9 ? (t > 1.35 ? 'heart' : 'closed') : undefined); ES(P, 1 + 0.1 * sigh, 1 + 0.15 * sigh);
      P.burst(1.45, 'pg_petal', 'rose', BLOOM, { n: 2, speed: 0.4 }).burst(1.4, 'sparkle', 'rose', BLOOM, { n: 3, speed: 0.5 });
    } },
    // fidget: a quick preen — the bill combs through the neck feathers, a ruffle, a shake
    preen: { len: 2.2, next: 'idle', f(P, t) {
      const k = seg(t, 0.05, 0.3, E.out) * (1 - seg(t, 1.2, 1.45, E.inout)), comb = wave(t, 3.2) * k;
      P.rot('head', 38 * k, -40 * k + comb * 8, 20 * k).pos('neck', 0.8 * k, -1 * k, -0.6 * k).rot('jaw', 6 * k + comb * 4);
      const ruf = bump(t, 1.4, 1.9); P.scl('body', 1 + 0.06 * ruf, 1 + 0.04 * ruf, 1 + 0.06 * ruf).scl('neck', 1 + 0.12 * ruf).rot('body', 0, 0, wave(t, 9) * 5 * ruf);
      P.rot('wingR', 0, 0, -10 * ruf).rot('tail', 0, wave(t, 8) * 10 * ruf, 0);
      P.face('eyes', k > 0.5 ? 'closed' : undefined);
      P.burst(0.7, 'pg_feather', 'neck', [3, 16, 4], { n: 1, speed: 0.5, tint: [1, 0.9, 0.9] }).burst(1.55, 'pg_feather', 'body', [0, 12, 0], { n: 2, speed: 0.8, tint: [1, 0.9, 0.9] });
    } },
    // fidget: two pecks at crumbs, a gulp
    peck: { len: 2.0, next: 'idle', f(P, t) {
      const look = seg(t, 0, 0.28, E.out) * (1 - seg(t, 1.5, 1.9, E.inout));
      let pk = 0; for (const t0 of [0.42, 0.85]) pk += peck(t, t0, 0.26);
      P.rot('body', 34 * look + 10 * pk, 0, 0).rot('head', 30 * look + 24 * pk, 0, 6 * look).pos('neck', 0, -1.2 * look - 1.6 * pk, 1.4 * look + 2.0 * pk);
      const dy = -0.6 * look; P.pos('body', 0, dy, 0); plant(P, dy, 4);
      P.rot('tail', -8 * look - 8 * pk, 0, 0).rot('wingL', -20 * look, 0, 0);
      for (const t0 of [0.42, 0.85]) P.burst(t0 + 0.1, 'pg_crumb', 'root', [0, 0.4, 10], { n: 6, dir: [0, 1, 0.4] });
      const gulp = bump(t, 1.2, 1.45); P.scl('neck', 1 + 0.12 * gulp, 1 - 0.05 * gulp, 1 + 0.12 * gulp);
      P.face('eyes', t < 0.4 ? 'wide' : t > 1.15 && t < 1.5 ? 'happy' : undefined); ES(P, 1 + 0.12 * bump(t, 0.05, 0.42), 1 + 0.22 * bump(t, 0.05, 0.42));
    } },
  },
};
def.anim = anim;
