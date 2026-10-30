// Professor Aoi's upstairs study (Tokon Lab, storey 1): the lived-in layer over the furniture downtown.js lays out —
// a reading nook with an armchair and a round rug, a tea station, a terrarium with a shy resident, a cork board of
// field notes, a star chart, a planning table with a map of the bay, a rolling library ladder, a creature bed,
// a fossil skull on a plinth, trailing plants on the shelves and the everyday clutter of a busy researcher.
// It keeps the stair landing (x 118.3–120.2, z 115.2–120) and the approach to every existing interactable clear.
import { TX } from '../build.js';
import { furn } from './dt_kit.js';

const S = (c) => TX.solid(c);
const pt = TX.ptex;
const { light, dark } = TX;

const cork = () => pt('dt_cork', 1.3, 0.9, (g, W, H, r, P) => {
  P.fill('#6a4a2a'); P.rect(2, 2, W - 4, H - 4, '#b88a52'); P.speck(220, '#a87a44', r, 2, 2, W - 4, H - 4); P.speck(120, '#c89a62', r, 2, 2, W - 4, H - 4);
  const notes = [[5, 5, 10, 8, '#f8f0a0'], [18, 4, 9, 11, '#f4f4ec'], [30, 6, 9, 8, '#a8d8f0'], [6, 16, 12, 9, '#f4f4ec'], [22, 17, 8, 8, '#f8c0d0'], [32, 16, 7, 10, '#f8f0a0']];
  for (const [x, y, w, h, c] of notes) { P.rect(x + 1, y + 1, w, h, '#4a3420'); P.rect(x, y, w, h, c); for (let yy = y + 2; yy < y + h - 1; yy += 2) P.hline(x + 1, yy, w - 2 - (yy % 3), dark(c, 0.35)); P.px(x + Math.floor(w / 2), y, '#d8282a'); }
  P.rect(19, 6, 7, 5, '#5a8a4a'); P.rect(20, 7, 5, 3, '#8ac86a');            // a photo of a leafy creature
  for (let t = 0; t < 1; t += 0.05) { P.px(10 + t * 13, 6 + t * 12, '#c83a3a'); P.px(23 + t * 12, 17 - t * 10, '#c83a3a'); }
});
const starChart = () => pt('dt_stars', 1.6, 1.1, (g, W, H, r, P) => {
  P.fill('#c8a050'); P.rect(2, 2, W - 4, H - 4, '#1a2448'); P.speck(70, '#8a9ac8', r, 3, 3, W - 6, H - 6); P.speck(25, '#ffffff', r, 3, 3, W - 6, H - 6);
  const pts = [[10, 8], [17, 12], [24, 9], [29, 15], [36, 11], [42, 20], [14, 24], [22, 27], [33, 26]];
  for (let i = 0; i + 1 < pts.length; i++) { const [a, b] = pts[i], [c, d] = pts[i + 1]; for (let t = 0; t <= 1; t += 0.08) P.px(a + (c - a) * t, b + (d - b) * t, '#6a7ab8'); }
  for (const [x, y] of pts) { P.rect(x - 1, y, 3, 1, '#fff4c0'); P.rect(x, y - 1, 1, 3, '#fff4c0'); }
  for (let a = 0; a < 6.283; a += 0.05) P.px(W / 2 + Math.cos(a) * (W / 2 - 5), H / 2 + Math.sin(a) * (H / 2 - 5), '#3a4a7a');
});
const bayMap = () => pt('dt_baymap', 2.6, 1.8, (g, W, H, r, P) => {
  P.fill('#e8dcb8'); P.speck(200, '#d8c8a0', r);
  for (let y = 0; y < 18; y++) P.hline(0, y, W, y < 16 ? '#8ab0c8' : '#a8c8d8');      // the bay along the top
  P.speck(40, '#a8c8e0', r, 0, 0, W, 15);
  P.rect(50, 0, 8, 22, '#d8c8a0');                                                   // the pier
  for (const [x0, y0, x1, y1, c] of [[4, 24, 36, 50, '#a8c890'], [42, 24, 82, 50, '#e8b0a0'], [4, 56, 36, 54 + 0, '#e8d890'], [42, 56, 82, 54, '#c8b8e0']]) P.rect(x0, y0, x1 - x0, Math.max(6, y1 - y0), c);
  P.rect(4, 56, 32, 0, '#000');
  for (const [x0, y0, x1, y1] of [[0, 20, W, 23], [0, 51, W, 55], [37, 18, 41, H]]) P.rect(x0, y0, x1 - x0, y1 - y0, '#f8f4e8');
  for (const [x, y] of [[20, 36], [62, 40], [56, 64], [18, 64]]) { P.rect(x, y, 3, 3, '#d8282a'); P.px(x + 1, y - 1, '#f8f4e8'); }
  P.rect(70, 46, 10, 10, '#f8f4e8'); P.tiny('N', 73, 48, '#3a3a3a'); P.vline(75, 44, 2, '#3a3a3a');
  for (let i = 0; i < 40; i++) P.px(8 + r() * 26, 26 + r() * 22, '#6a9a5a');               // the park's trees
  P.rect(0, 0, W, 1, '#a8885a'); P.rect(0, H - 1, W, 1, '#a8885a');
});
const ladderTex = () => { const t = pt('dt_ladder', 0.6, 2.4, (g, W, H, r, P) => { g.clearRect(0, 0, W, H); P.rect(1, 0, 2, H, '#8a5a32'); P.rect(W - 3, 0, 2, H, '#8a5a32'); for (let y = 4; y < H; y += 9) P.rect(1, y, W - 2, 2, '#a87a4a'); P.vline(1, 0, H, '#a87a4a'); }); t.userData.cutout = true; return t; };
const rugRound = () => pt('dt_rugRound', 2.6, 2.6, (g, W, H, r, P) => {
  const c = W / 2 - 0.5; g.clearRect(0, 0, W, H); P.fill('#2e7e78');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - c, y - c); if (d > c) continue; P.px(x, y, d > c - 3 ? '#c85a3a' : d > c - 5 ? '#f0c060' : Math.floor(d / 6) % 2 ? '#e8d8b8' : '#d8a87a'); }
});
const terrarium = () => pt('dt_terra', 1.8, 0.7, (g, W, H, r, P) => {
  P.fill('#3a4a3a'); P.rect(1, 1, W - 2, H - 2, '#5a7a6a');
  P.rect(1, H - 6, W - 2, 5, '#5a3a22'); P.speck(30, '#7a5a3a', r, 1, H - 6, W - 2, 5);
  for (let i = 0; i < 26; i++) { const x = 2 + Math.floor(r() * (W - 5)), h = 4 + Math.floor(r() * 10); P.rect(x, H - 6 - h, 2, h, ['#3a8a3a', '#5aaa4a', '#2e6a32'][i % 3]); P.px(x, H - 7 - h, '#8ad86a'); }
  P.rect(34, H - 10, 5, 4, '#7ab84a'); P.px(35, H - 9, '#1a1a1a'); P.px(37, H - 9, '#1a1a1a');   // the shy leaf-creature
  P.dither(1, 1, W - 2, H - 2, '#d8f0f0', (x, y) => ((x + y) % 11 < 2 ? 0.6 : 0));
  P.rect(0, 0, W, 1, '#8a9a9a');
});
const boxLabel = () => pt('dt_boxlab', 0.6, 0.45, (g, W, H, r, P) => { P.fill('#c89a62'); P.hline(0, 6, W, '#a87a44'); P.rect(4, 8, 11, 6, '#f4f0e6'); P.tiny('SPC', 4, 9, '#3a3a6a'); P.speck(10, '#a87a44', r); });

export function aoiStudy(C, B) {
  const g1 = B.gk(1, 'in'), y = 3.0;
  // ---- reading nook (south-east): round rug, mustard armchair, footstool, side table with a lamp and books
  C.quad(g1, rugRound(), [132.2, y + 0.032, 132.6], [135.0, y + 0.032, 132.6], [135.0, y + 0.032, 129.8], [132.2, y + 0.032, 129.8], { fit: true });
  const mus = '#d8a83a', musD = '#b8862a';
  C.furniture(B, 1, 134.2, 130.2, 135.4, 131.5, 0.42, S(musD), { top: S(mus) });
  C.box(g1, S(musD), 135.15, y, 130.2, 135.45, y + 1.15, 131.5, { top: S(mus) });
  for (const z of [130.1, 131.4]) C.box(g1, S(musD), 134.2, y, z, 135.45, y + 0.68, z + 0.16, { top: S(mus) });
  C.box(g1, S('#f0c860'), 134.35, y + 0.42, 130.35, 135.1, y + 0.55, 131.35);
  C.furniture(B, 1, 133.2, 130.5, 133.7, 131.1, 0.32, S(musD), { top: S(mus) });
  C.furniture(B, 1, 134.45, 131.75, 135.05, 132.35, 0.55, TX.planks('#7a5236'), { top: S('#9a6a44') });
  C.box(g1, S('#3a3e48'), 134.68, y + 0.55, 131.98, 134.76, y + 0.98, 132.06); C.box(g1, S('#fff0c0'), 134.5, y + 0.95, 131.8, 134.95, y + 1.22, 132.25);
  for (let i = 0; i < 3; i++) C.box(g1, S(['#c8402a', '#2e5a8a', '#e8b040'][i]), 134.5 + i * 0.02, y + 0.55 + i * 0.05, 132.1, 134.75 + i * 0.02, y + 0.6 + i * 0.05, 132.3);
  // ---- tea station on the east wall: a counter, kettle, mugs, a tea tin
  furn(C, B, 1, 135.2, 125.6, 135.9, 127.6, 0.92, TX.planks('#8a5a36'), { top: S('#e8e2d6') });
  C.box(g1, S('#c8ccd4'), 135.35, y + 0.92, 125.8, 135.7, y + 1.2, 126.15, { top: S('#2a2e38') }); C.box(g1, S('#2a2e38'), 135.45, y + 1.2, 125.92, 135.6, y + 1.26, 126.03);
  for (const [z, c] of [[126.5, '#f4f0e8'], [126.75, '#5ad8c0'], [127.0, '#e8705a']]) C.box(g1, S(c), 135.45, y + 0.92, z, 135.6, y + 1.04, z + 0.15);
  C.box(g1, S('#c83a3a'), 135.4, y + 0.92, 127.25, 135.65, y + 1.15, 127.5, { top: S('#e8c060') });
  // ---- terrarium on a cabinet by the east wall, with someone small living in it
  furn(C, B, 1, 135.1, 117.6, 135.9, 119.6, 0.8, TX.planks('#6a4428'), { top: S('#9a6a44') });
  C.box(g1, S('#a8d0c8'), 135.2, y + 0.8, 117.75, 135.8, y + 1.5, 119.45, { top: S('#c8e8e0'), w: terrarium() });
  C.interact({ x: 134.4, z: 118.6, L: 1, label: 'Look at the terrarium', icon: 'leaf', act: async (app) => app.say('', 'Moss, ferns and a tiny pond. Something small and leaf-shaped blinks at you… then very carefully pretends to be a leaf.') });
  // ---- cork board of field notes and a star chart
  C.decal(g1, cork(), 129.15, 3.75, 115.12, 's', 1.3, 0.9, { off: 0.1 });
  C.interact({ x: 129.15, z: 116.9, L: 1, label: 'Read the cork board', icon: 'eye', act: async (app) => app.say('', 'Field notes pinned in a spiral: "Leaf-type seen in Alamo Hill tall grass, 6:40 am." "Sea lions = NOT Tokonmon (confirmed)." Red string connects everything to a photo of a very blurry critter.') });
  C.decal(g1, starChart(), 118.12, 3.75, 117.6, 'e', 1.6, 1.1, { off: 0.1 });
  // ---- the planning table: a map of the bay with pins
  C.furniture(B, 1, 128.8, 124.8, 131.4, 126.6, 0.82, TX.planks('#6a4428'), { top: S('#7a5236') });
  C.quad(g1, bayMap(), [128.95, y + 0.825, 126.45], [131.25, y + 0.825, 126.45], [131.25, y + 0.825, 124.95], [128.95, y + 0.825, 124.95], { fit: true });
  for (const [x, z, c] of [[129.6, 125.3, '#d8282a'], [130.7, 125.9, '#2e7e78'], [130.1, 126.2, '#f0c040']]) C.box(g1, S(c), x - 0.03, y + 0.825, z - 0.03, x + 0.03, y + 0.92, z + 0.03);
  C.box(g1, S('#c8a050'), 131.0, y + 0.825, 125.1, 131.2, y + 0.84, 125.4);
  C.interact({ x: 130.1, z: 127.3, L: 1, label: 'Study the map', icon: 'eye', act: async (app) => app.say('', 'A hand-drawn map of the bay. Pins mark Tokonmon sightings: the park, the pier, Chinatown… and one pin, alone, out in the water.') });
  // ---- a rolling library ladder leaning on the north shelves
  C.quad(g1, ladderTex(), [126.2, y, 116.75], [126.8, y, 116.75], [126.8, y + 2.35, 115.86], [126.2, y + 2.35, 115.86], { fit: true });
  C.quad(g1, ladderTex(), [126.8, y, 116.75], [126.2, y, 116.75], [126.2, y + 2.35, 115.86], [126.8, y + 2.35, 115.86], { fit: true });
  C.nav.block(126.15, 116.4, 126.85, 116.85, 1);
  // ---- trailing plants on top of the shelves, book piles on the floor, specimen boxes
  for (const x of [121.2, 124.6, 127.6]) {
    C.box(g1, S('#e8e4dc'), x - 0.18, y + 2.2, 115.3, x + 0.18, y + 2.48, 115.7);
    C.box(g1, S('#4a9a4a'), x - 0.3, y + 2.48, 115.25, x + 0.3, y + 2.7, 115.75, { top: S('#5ab85a') });
    for (const [dx, h] of [[-0.22, 0.9], [0.05, 0.55], [0.2, 1.2]]) C.box(g1, S('#3a8a3a'), x + dx - 0.05, y + 2.25 - h, 115.8, x + dx + 0.05, y + 2.25, 115.86);
  }
  const pile = (x, z, n, seed) => { for (let i = 0; i < n; i++) { const c = ['#c8402a', '#2e5a8a', '#e8b040', '#3a7a4a', '#7a3a6a', '#e8e0d0'][(i + seed) % 6], o = (i % 2) * 0.03; C.box(g1, S(c), x - 0.17 + o, y + i * 0.06, z - 0.12, x + 0.17 + o, y + (i + 1) * 0.06 - 0.005, z + 0.12, { top: S(light(c, 0.15)) }); } C.nav.block(x - 0.2, z - 0.15, x + 0.2, z + 0.15, 1); };
  pile(121.2, 116.25, 5, 0); pile(121.65, 116.3, 3, 2); pile(119.3, 133.2, 6, 4); pile(127.4, 133.0, 4, 1);
  for (const [x0, z0, x1, z1, h, y0] of [[119.0, 134.15, 119.8, 134.85, 0.45, 0], [119.1, 134.2, 119.7, 134.75, 0.4, 0.45]]) C.box(g1, S('#c89a62'), x0, y + y0, z0, x1, y + y0 + h, z1, { top: S('#d8aa72'), s: boxLabel() });
  C.nav.block(119.0, 134.1, 119.8, 134.9, 1);
  // ---- a round creature bed by the stairwell, with a ball
  C.furniture(B, 1, 120.1, 126.5, 121.3, 127.5, 0.18, S('#c85a6a'), { top: S('#e88a9a') });
  C.box(g1, S('#f8e8d8'), 120.3, y + 0.12, 126.7, 121.1, y + 0.2, 127.3); C.box(g1, S('#f0c040'), 121.35, y, 127.6, 121.55, y + 0.2, 127.8);
  // ---- a fossil skull on a plinth beside the display case
  furn(C, B, 1, 127.8, 133.9, 128.7, 134.75, 0.9, S('#e8e4dc'), { top: S('#f4f0e8') });
  const bone = S('#e8dcc0'), boneD = S('#c8b898');
  C.box(g1, bone, 127.95, y + 0.9, 134.05, 128.55, y + 1.25, 134.6, { top: S('#f0e8d0') }); C.box(g1, boneD, 128.0, y + 0.9, 134.55, 128.5, y + 1.05, 134.75);
  C.box(g1, S('#2a2420'), 128.05, y + 1.08, 134.6, 128.18, y + 1.18, 134.61); C.box(g1, S('#2a2420'), 128.32, y + 1.08, 134.6, 128.45, y + 1.18, 134.61);
  for (const x of [128.05, 128.17, 128.29, 128.41]) C.box(g1, S('#f8f4e8'), x, y + 0.98, 134.6, x + 0.06, y + 1.04, 134.66);
  C.box(g1, boneD, 128.15, y + 1.25, 134.15, 128.35, y + 1.42, 134.35);
  C.interact({ x: 128.2, z: 133.3, L: 1, label: 'Examine the fossil', icon: 'star', act: async (app) => app.say('', 'A heavy fossil skull with a crest like a frill. The label: "Ancient Tokonmon? Ancient Tokonmon. (Do not touch. Especially you, Professor.)"') });
  // ---- desk-side clutter: a waste bin with crumpled notes, papers on the floor, a mug on the map table edge
  C.box(g1, S('#5a6470'), 132.9, y, 119.4, 133.25, y + 0.38, 119.75, { top: S('#2a2e38') });
  for (const [x, z] of [[133.05, 119.5], [133.15, 119.62]]) C.box(g1, S('#f4f4ec'), x - 0.05, y + 0.36, z - 0.05, x + 0.05, y + 0.44, z + 0.05);
  for (const [x, z, a] of [[129.2, 121.2, 0], [128.5, 120.6, 1], [133.6, 121.6, 0]]) C.box(g1, S('#fbfbf6'), x - (a ? 0.15 : 0.2), y + 0.025, z - (a ? 0.2 : 0.15), x + (a ? 0.15 : 0.2), y + 0.03, z + (a ? 0.2 : 0.15));
  // ---- a tall potted fig in the north-west corner of the work area and one by the tea station
  for (const [x, z] of [[121.0, 129.7], [135.4, 129.0]]) {
    C.furniture(B, 1, x - 0.28, z - 0.28, x + 0.28, z + 0.28, 0.5, S('#c8643a'), { top: S('#5a3a22') });
    C.box(g1, S('#6a4a32'), x - 0.04, y + 0.5, z - 0.04, x + 0.04, y + 1.3, z + 0.04);
    for (const [dx, dy, dz, s] of [[0, 1.55, 0, 0.42], [-0.18, 1.2, 0.12, 0.3], [0.2, 1.3, -0.1, 0.3]]) C.box(g1, S('#3a8a3a'), x + dx - s, y + dy - s * 0.8, z + dz - s, x + dx + s, y + dy + s * 0.8, z + dz + s, { top: S('#5aaa4a') });
  }
}
