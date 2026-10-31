// Alamo Hill Park, close-up pass: everything you see from a few metres away. Called from park.js after the
// terrain and the set pieces exist:
//  - a white gazebo on the east lawn (sit in it), a stepping-stone trail to it, flower beds of tulips, daisies,
//    lavender and marigolds around it
//  - a richer pond: a ring of edge stones, cattail stands, flowering lily pads
//  - a picnic laid out on the lawn, a carved welcome sign, more slatted benches and bins
//  - grass tufts, wildflowers and California poppies over the lawns (cheap instanced voxels, no shadows)
//  - interactables for all of it: sit on benches, read plaques, smell the beds, hop the stones, skip a stone,
//    watch the pond, tidy litter into a bin
import { TX } from '../build.js';
import { groundDecal } from './dt_kit.js';
import './pk_detail.js';
import '../props_trees.js';

const PI = Math.PI;
const sfx = (app, n, o) => { if (app.audio && app.audio.sfx) app.audio.sfx(n, o); };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const flags = (app) => { const s = app.state || (app.state = {}); return s.flags || (s.flags = {}); };

/** the gazebo's footprint and the other areas the tree scatter must leave free */
export const GAZEBO = { x: 92, z: 70, r: 3.2 };
export const RESERVED = [[GAZEBO.x - 4.2, GAZEBO.z - 4.2, GAZEBO.x + 4.2, GAZEBO.z + 5.6], [82.5, 72, 90, 78.5], [84.5, 62.5, 99.5, 66.5]];

/** sit the player down on a seat surface for a moment (a line or two), then stand them back up where they were */
export async function sitDown(app, x, z, yaw, y, lines) {
  const w = app.world, me = w && w.player;
  if (!me) { await app.say('', ...lines); return; }
  const p = me.g.position, back = [p.x, p.z, me.yaw, p.y];
  sfx(app, 'cloth');
  me.path = null; me.place(x, z, yaw, y); me.g.position.y = y; me.play('sit', { fade: 0.25 });
  if (w.partner && !w.partner.busy) { w.partner.face(me); }
  await app.say('', ...lines);
  me.play('idle', { fade: 0.25 }); me.place(back[0], back[1], back[2], back[3]);
  if (w.city) w.city.placed();
}

export function detail(C, ctx, H) {
  const { Y } = H;
  gazebo(C, Y);
  flowerBeds(C, Y);
  pond(C);
  picnic(C);
  welcome(C, Y);
  benches(C, H);
  groundCover(C, H);
}

// ==================================================================== the gazebo (east lawn) and its stepping stones
function gazebo(C, Y) {
  const { x: cx, z: cz } = GAZEBO, y0 = Y(cx, cz);
  C.prop('pk2_gazebo', cx, cz, { y: y0, collide: false });
  // the deck (5 voxels: one easy step) and the posts / balustrade on five sides (the south side is open)
  C.nav.height(cx - 2.05, cz - 2.05, cx + 2.05, cz + 2.05, 0, y0 + 0.31);
  const R = 2.5, pts = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2 + PI / 6; pts.push([cx + Math.cos(a) * R, cz + Math.sin(a) * R]); }
  pts.forEach(([x, z], i) => {
    C.nav.block(x - 0.15, z - 0.15, x + 0.15, z + 0.15);
    const [x2, z2] = pts[(i + 1) % 6]; if ((z + z2) / 2 > cz + R * 0.6) return;
    for (let t = 0; t <= 1; t += 0.08) { const px = x + (x2 - x) * t, pz = z + (z2 - z) * t; C.nav.block(px - 0.12, pz - 0.12, px + 0.12, pz + 0.12); }
  });
  // a bench inside along the back (north) rail, a lantern hanging from the roof
  C.prop('pk2_bench', cx, cz - 1.55, { y: y0 + 0.31, yaw: PI, collide: false }); C.nav.block(cx - 0.85, cz - 1.9, cx + 0.85, cz - 1.3);
  C.prop('lantern', cx, cz, { y: y0 + 2.75 });
  C.interact({ x: cx, z: cz - 0.7, r: 1.4, label: 'Sit in the gazebo', icon: 'heart', act: async (app) => {
    await sitDown(app, cx, cz - 1.45, 0, y0 + 0.31 + 0.44, [pick([
      'You sit in the gazebo. The lawn hums in the sun, and somewhere a kid is losing a game of Tokon tag very loudly.',
      'Shade, a breeze, and the creak of old white paint. Your partner curls up on the cool boards and is asleep in seconds.',
      'A Pidgun lands on the rail, looks at you, looks at your snack pocket, and waits. It is a very patient Tokonmon.'])]);
  } });
  C.interact({ x: cx + 1.2, z: cz - 1.8, y: y0 + 2.2, r: 1.2, label: 'Read the carvings', icon: 'eye', act: async (app) => app.say('', 'Carved into the rail, under many coats of white paint: initials in hearts, a tiny Cabbunny, and "MAY 1961 — IT RAINED, WE DANCED ANYWAY".') });
  // the stepping-stone trail from the main path to the gazebo steps
  const trail = [[81.2, 76.2], [82.4, 75.9], [83.6, 75.4], [84.8, 75.1], [86.0, 74.6], [87.2, 74.5], [88.4, 74.2], [89.6, 74.3], [90.8, 73.9], [92.0, 73.6]];
  trail.forEach(([x, z], i) => C.prop('pk2_step', x, z, { yaw: i * 1.7, collide: false }));
  C.interact({ x: 86.0, z: 74.6, r: 1.6, label: 'Hop the stepping stones', icon: 'star', act: async (app) => {
    const me = app.world.player; sfx(app, 'boing', { pitch: 1.2 });
    if (me) { me.play('jump', { restart: true }); }
    await app.say('', pick(['Hop, hop, hop — you make it to the gazebo without touching the grass once. The floor was lava. You win.', 'You hop the stones. Your partner hops them too, then hops back to do it again. And again.']));
  } });
}

// ==================================================================== flower beds of individual flowers
function flowerBeds(C, Y) {
  const soil = TX.dirt('#5a3e2a'), edge = TX.solid('#8a8478');
  const bed = (x0, z0, x1, z1, kinds) => {
    const y = Y((x0 + x1) / 2, (z0 + z1) / 2);
    C.box('ground', edge, x0 - 0.08, y, z0 - 0.08, x1 + 0.08, y + 0.12, z1 + 0.08, { top: soil }); C.nav.block(x0, z0, x1, z1);
    let n = 0; for (let x = x0 + 0.5; x < x1; x += 1.0) for (let z = z0 + 0.5; z < z1; z += 1.0) C.prop(kinds[n++ % kinds.length], x, z, { y: y + 0.12, collide: false, yaw: (n & 3) * PI / 2 });
  };
  bed(85, 63, 90, 65, ['pk2_tulip_red', 'pk2_tulip_yel', 'pk2_tulip_white', 'pk2_tulip_pink', 'pk2_tulip_purple']);
  bed(94, 63, 99, 65, ['pk2_lavender', 'pk2_daisy', 'pk2_lavender', 'pk2_marigold']);
  bed(83, 76, 85, 78, ['pk2_marigold', 'pk2_daisy']);
  C.interact({ x: 87.5, z: 66.0, label: 'Smell the tulips', icon: 'leaf', act: async (app) => { sfx(app, 'cloth', { vol: 0.4 }); await app.say('', 'Red, yellow, white, pink and purple tulips in neat rows — each one a little cup of colour.', pick(['A little Bio Tokonmon climbs out of a yellow one, dusted in pollen and extremely pleased with itself.', 'Your partner sniffs one, sneezes, and looks betrayed.'])); } });
  C.interact({ x: 96.5, z: 66.0, label: 'Brush the lavender', icon: 'leaf', act: async (app) => { sfx(app, 'cloth', { vol: 0.4 }); await app.say('', 'You run a hand through the lavender. The smell follows you for a whole minute. Calm, purple, sleepy.'); } });
}

// ==================================================================== the pond: edge stones, cattails, lilies, a mallard family
function pond(C) {
  // stones around the water's edge (on the path ring's inner side)
  for (let a = 0; a < 28; a++) {
    const t = (a / 28) * PI * 2, x = 70 + Math.cos(t) * 10.6, z = 85.5 + Math.sin(t) * 7.2;
    if (Math.abs(x - 70) < 2.2) continue;                                  // the bridge
    C.prop('pk2_pondstones', x, z, { y: -0.3, yaw: -t + PI / 2, collide: false });
  }
  for (const [x, z] of [[61.0, 83.4], [61.6, 88.6], [78.8, 83.0], [77.6, 89.8], [64.6, 80.4], [74.8, 80.6]]) C.prop('pk2_cattails', x, z, { y: -0.5, collide: false, yaw: x });
  for (const [x, z] of [[64.0, 85.6], [75.6, 86.0], [66.6, 89.4], [73.4, 82.6]]) C.prop('pk2_lily', x, z, { y: -0.43, collide: false, yaw: z });
  C.interact({ x: 74.6, z: 79.9, r: 1.6, label: 'Watch the pond', icon: 'eye', act: async (app) => { sfx(app, 'bubble', { pitch: 1.3, vol: 0.5 }); await app.say('', pick(['A trail of bubbles wanders between the lily pads. Something small and blue is having a lovely time down there.', 'A lily pad wobbles, then another — a tiny water Tokonmon is hopping across them, one careful pad at a time.'])); } });
  let skips = 0;
  C.interact({ x: 61.2, z: 81.2, r: 1.5, label: 'Skip a stone', icon: 'star', act: async (app) => {
    const n = 1 + Math.floor(Math.random() * 6); skips = Math.max(skips, n);
    sfx(app, 'whoosh'); for (let i = 0; i < n; i++) setTimeout(() => sfx(app, 'plop', { pitch: 1 + i * 0.15, vol: 0.6 - i * 0.07 }), 350 + i * 220);
    const me = app.world.player; if (me) me.play('throw', { restart: true });
    await app.say('', n === 1 ? 'Plunk. Straight to the bottom. Your partner looks unimpressed.' : `${n} skips! ${n >= 5 ? 'The jogger stops to applaud.' : 'Not bad.'} (Best today: ${skips})`);
  } });
}

// ==================================================================== the picnic on the west lawn
function picnic(C) {
  // (the park's two blankets become laid-out picnics through park.js's swap; this one is the family's)
  C.interact({ x: 22.0, z: 88.8, r: 1.4, label: 'Peek at the picnic', icon: 'bowl', act: async (app) => {
    const F = flags(app), d = (app.state && app.state.time && app.state.time.day) || 1;
    if (F.pk_picnic !== d && app.state && app.state.bag) { F.pk_picnic = d; app.state.bag.lemon_tart = (app.state.bag.lemon_tart || 0) + 1; sfx(app, 'reward'); app.toast('Got a Lemon Tart!', { icon: 'bag' }); await app.say('', 'A note is tucked under the thermos: "Baked too many again! Help yourself to ONE tart — the Sunset Row Running Club." You take one. Just one.'); if (app.save) app.save(); return; }
    await app.say('', 'Gingham blanket, wicker basket, cucumber sandwiches, three apples and a thermos of tea. A paperback lies open, face down, at the exciting bit.');
  } });
}

// ==================================================================== a carved welcome sign by the north gate
function welcome(C, Y) {
  const x = 57.0, z = 35.2, y = Y(x, z);
  C.prop('pk2_sign', x, z, { y, yaw: 0 });
  C.decal('props', TX.signTex('ALAMO HILL', '#2e5a3a', '#f4ecd0', { w: 1.5, h: 0.62, fs: 0.62 }), x, y + 0.84, z + 0.2, 's', 1.5, 0.62, { off: 0.008 });
  C.interact({ x, z: z + 1.0, label: 'Read the welcome sign', icon: 'map', act: async (app) => app.say('', '"WELCOME TO ALAMO HILL PARK. Please: no Tokon battles on the flower beds, no feeding bread to the pond Tokonmon (lettuce is fine), and no climbing the gazebo. Yes, you."') });
}

// ==================================================================== extra benches (with plaques) and bins
const PLAQUES = [
  '"For Agnes, who knew every Tokonmon in this park by name. 1931–2019."',
  '"Sit here and watch the fog roll in. — the Okada family"',
  '"In memory of Biscuit, the bravest Pidgun on Alamo Hill."',
  '"The best seat in the city. We checked them all. — Sunset Row Running Club"',
];
function benches(C, H) {
  const { along, PATHS, benchYaw } = H;
  const spots = [[PATHS.west, 0.25, 1], [PATHS.sw, 0.6, -1], [PATHS.north, 0.55, -1], [PATHS.picnic, 0.35, -1]];
  spots.forEach(([P, t, s], i) => {
    const p = along(P, t, s, 2.1); C.prop('bench', p.x, p.z, { yaw: benchYaw(p.fx, p.fz) });
    const sx = p.x + p.fx * 0.9, sz = p.z + p.fz * 0.9;
    C.interact({ x: sx, z: sz, r: 1.2, label: 'Sit on the bench', icon: 'heart', act: async (app) => {
      const y = app.world.ground(p.x, p.z) + 0.46;
      await sitDown(app, p.x + p.fx * 0.15, p.z + p.fz * 0.15, Math.atan2(p.fx, p.fz), y, [`A little brass plaque on the backrest: ${PLAQUES[i % PLAQUES.length]}`, pick(['You sit a while. A jogger waves. A Tokonmon in the hedge does not.', 'The park sounds: leaves, a distant ball game, two Tokonmon arguing over a stick.'])]);
    } });
    const b = along(P, t + 0.04, s, 2.4); C.prop('bin', b.x, b.z);
    C.interact({ x: b.x - b.fx * 0.2, z: b.z - b.fz * 0.2, r: 1.0, label: 'Tidy up litter', icon: 'hand', act: async (app) => {
      const F = flags(app), d = (app.state && app.state.time && app.state.time.day) || 1;
      sfx(app, 'thud', { vol: 0.5 });
      if (F['pk_tidy' + i] === d) { await app.say('', 'This bit of the park is spotless. You did that.'); return; }
      F['pk_tidy' + i] = d; if (typeof app.state.money === 'number') app.state.money += 5;
      app.toast('Kept the park tidy  +$5', { icon: 'coin' });
      await app.say('', pick(['You pick up a crisp packet and a soda can and drop them in the bin. A passing gardener tips her hat and presses a coin into your hand.', 'Litter in the bin! A Pidgun watches you with deep suspicion. Somebody leaves you a "thank you" coin on the bench.']));
    } });
  });
}

// ==================================================================== ground cover: tufts, wildflowers, poppies, under the trees litter
function groundCover(C, H) {
  const { T, R, Y } = H;
  const open = (t) => t === 0;   // plain lawn only (not paths, beds or tall grass)
  const reserved = (x, z) => RESERVED.some(([a, b, c, d]) => x > a && x < c && z > b && z < d);
  const meadow = (x, z) => (x > 76 && x < 85 && z > 33 && z < 52) || (x > 19 && x < 30 && z > 80 && z < 88) || (x > 86 && x < 102 && z > 49 && z < 55);
  for (let z = 33.2; z < 97; z += 2.6) for (let x = 17.6; x < 103; x += 2.6) {
    const jx = x + (R() - 0.5) * 2.2, jz = z + (R() - 0.5) * 2.2;
    if (!open(T(jx, jz)) || !open(T(jx + 0.8, jz)) || !open(T(jx - 0.8, jz)) || !open(T(jx, jz + 0.8)) || !open(T(jx, jz - 0.8)) || reserved(jx, jz)) continue;
    const m = meadow(jx, jz), k = R();
    if (!m && k > 0.42) continue;
    const kind = m ? (k < 0.45 ? 'gr_wild' : k < 0.7 ? 'gr_poppy' : 'gr_tuft') : k < 0.3 ? 'gr_tuftDry' : k < 0.36 ? 'gr_wild' : 'gr_tuft';
    C.prop(kind, jx, jz, { y: Y(jx, jz), yaw: Math.floor(R() * 4) * PI / 2, collide: false });
  }
  // a little sign by the wildflower meadow
  C.interact({ x: 80.5, z: 50.6, label: 'Wildflower meadow', icon: 'leaf', act: async (app) => app.say('', 'A hand-painted sign: "NO MOW ZONE — California poppies, yarrow and lupines for the pollinating Bio-types. Please keep your Tokonmon out (Bio-types: you may look)."') });
}
