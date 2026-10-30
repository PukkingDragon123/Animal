// Downtown / Market — rect [116, 110, 230, 180]. North edge (z 110) meets Market Street's south
// sidewalk, west edge (x 116) meets Van Ness. A busy, colourful downtown on a small street grid:
//
//   x 116 ─────────── 146 ──────── 168 ┃5th┃ 178 ──────────────────────────── 230
//   z 110  Market frontage · tram stop                Market frontage
//   z 113  TOKON LAB ┃ AOI  ┃ plaza · kiosk  │PETAL┃   ┃ HALCYON  │ NIMBUS   │ AURORA
//          (enter)   ┃PLAZA ┃ MOMO MART│BOBA │& STEM   ┃ tower    │ tower    │ tower
//   z 139  ═══════════════ MISSION STREET ═══════════╋═══ STARLIGHT CINEMA · PIXEL PALACE · RAMEN KAZE
//   z 150  THE STREET ARENA (court, bleachers,       ┃   ┃ parking lot      │ food truck alley
//   z 180   floodlights, scoreboard, graffiti)       ┃   ┃                  │
import { TX } from '../build.js';
import './props_dt.js';
import * as D from './dt_tex.js';
import { fadeable, festoon, groundDecal, groundLine, awningS, awningE, furn, rng } from './dt_kit.js';
import { signBoard, ptext } from './dt_pix.js';
import './pk_props.js';

const PI = Math.PI;
const say = (app, who, ...l) => app.say(who, ...l);

export function build(C, [X0, Z0, X1, Z1], ctx) {
  const night = !!ctx.night, R = rng(4242);
  const pave = TX.pavers('#d2c6b2'), pave2 = TX.pavers('#c4c0b8'), walk = TX.pavers('#cfc8bc');

  // ================================================================ ground: blocks, streets, sidewalks
  C.ground(116, 112.5, 168, 139, pave);                         // NW block (lab, plaza, shops)
  C.ground(178, 112.5, 230, 139, pave2);                        // NE block (towers, cinema)
  C.ground(116, 150, 168, 180, TX.asphalt('#3e3c46'));           // the Street Arena lot
  C.ground(178, 150, 208, 180, TX.asphalt('#46464f'));           // parking
  C.ground(208, 150, 230, 180, TX.pavers('#dcc8a4'));            // food truck alley
  // Mission Street (east–west) and 5th Street (north–south) with a plain junction
  C.street(116, 142, 170, 148, { dir: 'x' }); C.street(176, 142, 230, 148, { dir: 'x' });
  C.street(170, 110, 176, 142, { dir: 'z' }); C.street(170, 148, 176, 180, { dir: 'z' }); C.street(170, 142, 176, 148, { line: false });
  C.crossing(170, 139.4, 176, 141.6, 'x'); C.crossing(170, 148.4, 176, 150.6, 'x');
  C.crossing(166.6, 142, 168.8, 148, 'z'); C.crossing(177.2, 142, 179.4, 148, 'z');
  // raised sidewalks
  C.sidewalk(116, 110, 168, 112.5, { tex: walk }); C.sidewalk(178, 110, 230, 112.5, { tex: walk });       // Market frontage
  C.sidewalk(116, 139, 170, 142, { tex: walk }); C.sidewalk(176, 139, 230, 142, { tex: walk });           // Mission north
  C.sidewalk(116, 148, 170, 150, { tex: walk }); C.sidewalk(176, 148, 230, 150, { tex: walk });           // Mission south
  C.sidewalk(168, 110, 170, 139, { tex: walk }); C.sidewalk(176, 110, 178, 139, { tex: walk });           // 5th, north half
  C.sidewalk(168, 150, 170, 180, { tex: walk }); C.sidewalk(176, 150, 178, 180, { tex: walk });           // 5th, south half
  // the zones (sub-zones after the district so they win)
  C.zone('Downtown', X0, Z0, X1, Z1, { label: 'Downtown', sub: 'Market District', music: 'city', bed: 'street', step: 'step_concrete' });
  C.zone('Street Arena', 116, 150.3, 166.5, 180, { label: 'Street Arena', sub: 'Downtown', music: 'party', bed: 'street', step: 'step_concrete' });
  C.zone('Tokon Lab', 118, 115, 136, 135, { label: 'Tokon Lab', sub: "Professor Aoi's research lab", music: 'lofi2', bed: null, step: 'step_carpet' });

  tokonLab(C, night);
  aoiPlaza(C);
  marketFrontage(C, night);
  momoMart(C, night);
  bubbleMoon(C, night);
  petalAndStem(C, night);
  towers(C, night);
  cinema(C, night);
  eastShops(C, night);
  streetArena(C, night);
  parking(C, R);
  foodTrucks(C);
  streetFurniture(C);
}

// ==================================================================== PROFESSOR AOI'S TOKON LAB
// x 118–136, z 115–135, two storeys, entered from Aoi Plaza through glass doors on the east side.
function tokonLab(C, night) {
  const mint = '#3ab8a0', white = TX.solid('#f2f6f4'), mintT = TX.solid('#5ad8c0'), steel = TX.solid('#a8b4bc'), wood = TX.planks('#b88a5a'), dark = TX.solid('#2a3440');
  const B = C.building({
    name: 'Tokon Lab', x: 118, z: 115, w: 18, d: 20, floors: 2, enter: true,
    wall: D.labCladding(), trim: mint, base: '#7a8a8a', inner: D.labInner(),
    roof: { type: 'flat', tex: TX.concrete('#b8c0c0'), parapet: 0.7 },
    door: { side: 'e', at: 0.5, w: 1.8, tex: TX.doorTex('#2a9a84', 'glass') },
    windows: { every: 3.3, w: 1.8, h: 1.5, tex: D.labWindow() },
    floorTexs: [TX.tiles('#eef4f2', '#d6e6e2', 0.5), TX.carpet('#2e7e78', '#4aa89c')],
    step: 'step_carpet', mm: '#5ad8c0',
    interior(C, B) {
      const g0 = B.gk(0, 'in'), g1 = B.gk(1, 'in');
      // ---- ground floor: reception, waiting sofa, starter table, healing machine, analysers
      C.stairs(B, 0, 118.3, 120, 119.8, 126, 'n', { tex: TX.planks('#d8dcdc'), side: '#8a9aa0' });
      // reception desk (north of the door path) with the lab logo on its front
      furn(C, B, 0, 131.4, 120.4, 134.6, 121.4, 1.0, white, { top: mintT, s: signBoard('labdesk', 'RECEPTION', 3.2, 1.0, { bg: '#5ad8c0', fg: '#ffffff', frame: '#2a9a84', sub: 'TOKON LAB', subCol: '#e8fff8' }) });
      C.prop('dt_monitor', 132.4, 120.9, { y: 1.0, collide: false }); C.prop('dt_plant', 135.2, 120.2);
      // waiting corner (south of the door path)
      C.prop('dt_sofa', 132.4, 134.0, { yaw: PI }); C.furniture(B, 0, 131.4, 131.6, 133.4, 132.6, 0.42, wood, { top: TX.solid('#e8d8c0') });
      C.prop('dt_plant', 135.1, 134.1); C.prop('dt_plant', 129.7, 134.1);
      // the starter table: three capsules under glass
      furn(C, B, 0, 122.4, 124.4, 126.6, 126.0, 0.9, TX.solid('#5ad8c0'), { top: TX.solid('#f6faf8'), s: D.screenTex('dex', 4.2, 0.9) });
      C.prop('dt_pedestal_r', 123.2, 125.2, { y: 0.9 }); C.prop('dt_pedestal_b', 124.5, 125.2, { y: 0.9 }); C.prop('dt_pedestal_p', 125.8, 125.2, { y: 0.9 });
      // north wall: the Dex wall screen over a console, server racks, specimen tanks, the healing machine
      C.decal(g0, D.bigScreenTex(), 121.8, 0.95, 115.12, 's', 3.2, 1.8, { off: 0.1 });
      C.furniture(B, 0, 120.2, 115.2, 123.4, 116.0, 0.85, steel, { top: dark });
      C.prop('dt_server', 124.6, 115.7); C.prop('dt_server', 125.5, 115.7); C.prop('dt_tank', 127.0, 116.0); C.prop('dt_tank', 128.4, 116.0);
      C.prop('dt_heal', 131.5, 116.05);
      C.prop('dt_plant', 134.9, 115.8);
      // west wall: analysers facing east, a tank
      C.prop('dt_machine', 118.95, 130.0, { yaw: PI / 2 }); C.prop('dt_machine', 118.95, 132.4, { yaw: PI / 2 }); C.prop('dt_tank', 119.0, 134.2);
      // two research desks facing the room
      C.prop('dt_desk', 122.6, 131.0); C.prop('dt_desk', 126.0, 131.0);
      // a floor stripe leading from the door to the starter table
      for (let x = 127.2; x < 135.6; x += 1.1) C.quad(g0, mintT, [x, 0.03, 125.3], [x + 0.7, 0.03, 125.3], [x + 0.7, 0.03, 124.7], [x, 0.03, 124.7]);

      // ---- upstairs: Aoi's study — library walls, desk, whiteboard, telescope, rug
      const books = (x0, x1, z, face, seed) => { for (let x = x0, i = 0; x < x1 - 0.1; x += 2, i++) furn(C, B, 1, x, z, Math.min(x + 2, x1), z + 0.6, 2.2, TX.planks('#7a5236'), { top: TX.solid('#9a6a44'), [face]: D.bookshelfTex(seed + i) }); };
      books(120.2, 128.2, 115.2, 's', 1);
      for (let z = 127.0, i = 0; z < 134.6; z += 2, i++) furn(C, B, 1, 118.2, z, 118.8, Math.min(z + 2, 134.8), 2.2, TX.planks('#7a5236'), { top: TX.solid('#9a6a44'), e: D.bookshelfTex(10 + i) });
      C.decal(g1, D.whiteboardTex(), 131.2, 4.0, 115.12, 's', 2.2, 1.2, { off: 0.1 });
      // Aoi's desk: wood top, monitor (box + screen), chair, a mug of pens
      C.furniture(B, 1, 129.6, 118.2, 132.8, 119.3, 0.78, wood, { top: TX.solid('#c89a6a') });
      C.box(g1, dark, 130.4, 3.8, 118.4, 132.0, 4.75, 118.55); C.decal(g1, D.screenTex('dna', 1.5, 0.85), 131.2, 3.85, 118.56, 's', 1.5, 0.85, { off: 0.01 });
      C.box(g1, TX.solid('#2a8a84'), 130.8, 3.0, 119.8, 131.6, 3.48, 120.6); C.box(g1, TX.solid('#2a8a84'), 130.8, 3.48, 120.5, 131.6, 4.2, 120.65);
      C.box(g1, TX.solid('#f0c040'), 132.3, 3.78, 118.6, 132.55, 3.98, 118.85);
      // rug, sofa, coffee table, globe, plants, a specimen cabinet and a brass telescope by the window
      groundDecal(C, D.rugTex(), 123.5, 123.5, 127.5, 126.5, 3.03, g1);
      // a proper sofa: seat, back, arms, cushions
      C.furniture(B, 1, 123.3, 128.0, 127.7, 128.9, 0.42, TX.solid('#e0703a'), { top: TX.solid('#f08a4a') });
      C.box(g1, TX.solid('#c85a2a'), 123.3, 3.0, 128.75, 127.7, 3.95, 129.05); C.box(g1, TX.solid('#c85a2a'), 123.1, 3.0, 128.0, 123.4, 3.65, 129.05); C.box(g1, TX.solid('#c85a2a'), 127.6, 3.0, 128.0, 127.9, 3.65, 129.05);
      for (const x of [124.0, 125.5, 127.0]) C.box(g1, TX.solid(x === 125.5 ? '#f0c040' : '#5ad8c0'), x - 0.32, 3.42, 128.5, x + 0.32, 3.82, 128.72);
      // the big work table: specimen jars, a microscope, papers
      C.furniture(B, 1, 121.6, 130.6, 126.4, 132.2, 0.82, TX.planks('#8a5a36'), { top: TX.solid('#e8e0d0') });
      for (const [x, c] of [[122.2, '#5affc8'], [122.7, '#ff8ab0'], [123.2, '#ffd84a']]) { C.box(g1, TX.solid('#d8f0f8'), x - 0.16, 3.82, 131.0, x + 0.16, 4.22, 131.32); C.box(g1, TX.solid(c), x - 0.12, 3.84, 131.04, x + 0.12, 4.1, 131.28); }
      C.box(g1, TX.solid('#2a3440'), 124.4, 3.82, 131.0, 124.8, 3.88, 131.5); C.box(g1, TX.solid('#2a3440'), 124.55, 3.88, 131.1, 124.65, 4.3, 131.2); C.box(g1, TX.solid('#5a6470'), 124.45, 4.2, 131.0, 124.75, 4.45, 131.3);
      for (const [x, z] of [[125.4, 131.2], [125.8, 131.7], [123.6, 131.9]]) C.box(g1, TX.solid('#fbfbf6'), x - 0.2, 3.82, z - 0.14, x + 0.2, 3.84, z + 0.14);
      C.box(g1, TX.solid('#2a8a84'), 123.6, 3.0, 132.5, 124.2, 3.45, 133.1, { top: TX.solid('#3aa8a0') }); C.box(g1, TX.solid('#2a8a84'), 123.6, 3.45, 133.0, 124.2, 4.0, 133.1);
      // a floor lamp, a display case of capsules and fossils, a second plant
      C.box(g1, TX.solid('#3a3e48'), 128.3, 3.0, 128.3, 128.4, 4.7, 128.4); C.box(g1, TX.solid('#fff0c0'), 128.05, 4.6, 128.05, 128.65, 5.0, 128.65);
      furn(C, B, 1, 129.6, 133.9, 132.8, 134.8, 1.1, TX.planks('#7a5236'), { top: TX.solid('#d8f0f8') });
      for (const [x, c] of [[130.1, '#e8503a'], [130.8, '#3a8ad8'], [131.5, '#ff5a8a'], [132.2, '#e8e0c8']]) C.box(g1, TX.solid(c), x - 0.17, 4.1, 134.2, x + 0.17, 4.42, 134.5);
      C.furniture(B, 1, 124.6, 121.6, 126.4, 122.4, 0.42, wood);
      C.box(g1, TX.solid('#8a6a3a'), 133.6, 3.0, 128.6, 133.8, 3.9, 128.8); C.box(g1, TX.solid('#3a8ad8'), 133.3, 3.9, 128.4, 134.1, 4.6, 129.1, { top: TX.solid('#5ab86a') });
      for (const [x, z] of [[135.3, 133.9], [121.4, 133.9], [128.9, 116.3]]) { C.box(g1, TX.solid('#e8e4dc'), x - 0.3, 3.0, z - 0.3, x + 0.3, 3.45, z + 0.3); C.box(g1, TX.solid('#4aa05a'), x - 0.4, 3.45, z - 0.4, x + 0.4, 4.25, z + 0.4, { top: TX.solid('#5ab86a') }); }
      furn(C, B, 1, 133.4, 115.2, 135.8, 115.8, 1.9, TX.solid('#c8d4da'), { top: TX.solid('#e8eef0'), s: D.screenTex('scan', 2.4, 1.9) });
      C.box(g1, TX.solid('#c8a050'), 134.6, 3.0, 124.2, 134.8, 4.0, 124.4); C.box(g1, TX.solid('#d8b060'), 134.2, 4.0, 123.9, 135.2, 4.25, 124.7); C.box(g1, TX.solid('#8a6a3a'), 134.0, 4.05, 124.2, 134.4, 4.2, 124.4);
      C.nav.block(134.3, 123.9, 135.2, 124.7, 1);
      // a glass railing round the stair hole upstairs (the stairs rise north along the west wall)
      C.box(g1, TX.solid('#bfe8f0'), 119.8, 3.0, 120.0, 119.86, 3.95, 126.0);
      C.nav.block(119.8, 126.0, 120.0, 126.3, 1);

      // ---- interactables
      C.interact({ x: 131.5, z: 117.6, label: 'Use the healing machine', icon: 'heart', mm: true, act: async (app) => {
        const party = (app.state && app.state.party) || [];
        if (app.audio && app.audio.sfx) app.audio.sfx('sparkle');
        for (const m of party) { if (m.maxHp != null) m.hp = m.maxHp; else m.hp = 1; }
        if (app.audio && app.audio.jingle) app.audio.jingle('complete');
        app.toast(party.length ? 'Your team is fully healed!' : 'The machine hums. (No Tokonmon to heal yet.)', { icon: 'heart' });
        if (app.save) app.save();
      } });
      C.interact({ x: 124.5, z: 126.9, label: 'Look at the capsules', icon: 'star', act: async (app) => {
        if (app.story && app.story.starters) return app.story.starters();
        await say(app, '', 'Three capsules glow under glass: one warm as a chili, one fizzing with bubbles, one smelling of strawberries.', 'A card reads: "STARTER TOKONMON — please ask Professor Aoi."');
      } });
      C.interact({ x: 121.8, z: 116.9, label: 'Read the Dex wall', icon: 'tv', act: async (app) => say(app, '', 'TOKON DEX — ALAMO REGION. Twelve entries… most still shown as silhouettes.', 'Every Tokonmon you meet fills in another square.') });
      C.interact({ x: 120.3, z: 131.2, label: 'Examine the analyser', icon: 'pc', act: async (app) => say(app, '', 'The analyser draws a slow green wave. A sticky note: "Capsule resonance — do NOT shake."') });
      C.interact({ x: 127.7, z: 117.4, label: 'Look at the tanks', icon: 'drop', act: async (app) => say(app, '', 'Glowing mint-green liquid, rising bubbles… and a sleepy pink jellyfish-ish Tokonmon drifting inside.') });
      C.interact({ x: 124.3, z: 117.0, L: 1, label: 'Browse the bookshelf', icon: 'book', act: async (app) => { const T = ['"Capsule Physics for Beginners"', '"Elemental Affinities, 3rd ed."', '"Why Do Tokonmon Love Snacks?"', '"Field Notes: the Alamo Hill Grass"']; await say(app, '', 'You pull out ' + T[Math.floor(Math.random() * T.length)] + '. Dense, but full of doodles in the margins.'); } });
      C.interact({ x: 119.6, z: 130.5, L: 1, label: 'Browse the bookshelf', icon: 'book', act: async (app) => say(app, '', 'A whole shelf of battle records from the Street Arena, sorted by date.') });
      C.interact({ x: 131.2, z: 120.0, L: 1, label: "Peek at Aoi's computer", icon: 'pc', act: async (app) => say(app, '', 'RESEARCH LOG: "Tokonmon raised with care grow stronger bonds — and stronger moves. Battles are a conversation."') });
      C.interact({ x: 131.2, z: 116.6, L: 1, label: 'Read the whiteboard', icon: 'eye', act: async (app) => say(app, '', 'Arrows between two sketches of the same Tokonmon. "LV 16?" is circled three times in red.') });
      C.interact({ x: 131.2, z: 133.3, L: 1, label: 'Look at the display case', icon: 'star', act: async (app) => app.say('', 'Capsules from the first Tokon Expedition, and a fossil labelled "ANCIENT CHILICHICK? (probably a rock)".') });
      C.interact({ x: 124.2, z: 133.0, L: 1, label: 'Peer into the microscope', icon: 'eye', act: async (app) => app.say('', 'A single glowing scale, shimmering in three colours at once.') });
      C.interact({ x: 133.8, z: 124.3, L: 1, label: 'Look through the telescope', icon: 'eye', act: async (app) => say(app, '', 'Through the window: the Street Arena floodlights, and far away the green dome of Alamo Hill.') });
    },
  });
  // ---- outside: entrance canopy, the sign, a roof observatory, solar panels, an antenna
  const front = B.gk(0, 'front'), roof = `b${B.id}:roof`, H = 6;
  C.box(front, TX.solid('#f4f8f6'), 136, 2.38, 122.9, 137.6, 2.52, 127.1, { top: TX.solid('#5ad8c0') });
  for (const z of [123.0, 127.0]) C.box(front, TX.solid('#3ab8a0'), 137.45, 0, z - 0.06, 137.57, 2.38, z + 0.06);
  C.box(front, TX.solid('#2a8a84'), 136.0, 2.62, 122.2, 136.14, 3.72, 127.8);
  C.decal(front, D.signs.lab(), 136.14, 2.67, 125, 'e', 5.4, 1.0, { off: 0.01 });
  C.box(roof, TX.solid('#e8eef0'), 120, H, 117, 125, H + 0.6, 122);
  for (let i = 0; i < 4; i++) { const k = 0.6 * i; C.box(roof, i === 3 ? TX.solid('#5ad8c0') : TX.solid('#f4f8f8'), 120.4 + k, H + 0.6 + i * 0.5, 117.4 + k, 124.6 - k, H + 1.1 + i * 0.5, 121.6 - k); }
  C.box(roof, TX.solid('#2a3440'), 122.3, H + 1.0, 121.62, 122.7, H + 2.6, 121.7);
  for (let x = 127; x < 134; x += 2.2) C.quad(roof, TX.ptex('dt_solar', 1, 1, (g, W, Hh, r, P) => { P.fill('#2a3a6a'); for (let i = 0; i < W; i += 8) P.vline(i, 0, Hh, '#8a9ab8'); for (let j = 0; j < Hh; j += 16) P.hline(0, j, W, '#8a9ab8'); P.dither(0, 0, W, Hh, '#5a7ab8', (x2, y2) => ((x2 + y2) % 20 < 3 ? 0.6 : 0)); }), [x, H + 0.3, 131], [x + 1.9, H + 0.3, 131], [x + 1.9, H + 1.1, 129], [x, H + 1.1, 129]);
  C.box(roof, TX.solid('#8a96a4'), 133.8, H, 118, 134.0, H + 3.2, 118.2);
  C.box(roof, TX.solid('#e8473a'), 133.7, H + 3.2, 117.9, 134.1, H + 3.4, 118.3);
  C.box(roof, TX.metalRoof('#9aa8b0'), 129, H, 118, 131.4, H + 1.0, 120);
  // NPCs
  C.npc({ id: 'aoi', who: 'aoi', name: 'Professor Aoi', x: 127.8, z: 127.6, yaw: PI / 2, lines: [
    ['Welcome to the Tokon Lab! I study the bond between people and Tokonmon.', 'The healing machine by the north wall is free for every trainer — use it whenever your team is tired.'],
    ['The capsules on that table are starter Tokonmon. Each one is waiting for the right partner.', 'Battles at the Street Arena? Go and see! Just bring your team back to me in one piece.'],
    ['Upstairs is my study. Mind the books — and the telescope. It was my grandmother\'s.'],
  ] });
  C.npc({ id: 'dt_mei', who: 'passerby28', name: 'Lab Aide Mei', x: 133.0, z: 119.7, yaw: 0, lines: [
    ['Hi! Sign in? …Just kidding. Professor Aoi is by the starter table.', 'The healing machine is behind me. Six slots, one for each of your team.'],
    ['Fun fact: the tanks upstairs used to hold seawater. Now they hold a very sleepy Tokonmon.'],
  ] });
  C.spot('lab', 133.6, 125, -PI / 2); C.spot('labDoor', 137.4, 125, -PI / 2); C.spot('labStarters', 124.5, 127.5, PI); C.spot('labHeal', 131.5, 117.8, PI);
}

// ==================================================================== AOI PLAZA (x 136–146)
function aoiPlaza(C) {
  C.ground(138.5, 118.5, 143.5, 123.5, TX.cobble('#b8aa98'), { y: 0.01 });
  C.prop('dt_statue', 141, 121);
  C.interact({ x: 141, z: 122.9, label: 'Read the plaque', icon: 'eye', act: async (app) => app.say('', '"To the first Tokonmon of the city, who followed a lost child home." — Aoi Plaza, est. 2031') });
  for (const [x, z] of [[138, 114.2], [144.2, 114.2], [138, 137.6], [144.2, 137.6]]) C.prop('pk_oak', x, z);
  C.prop('bench', 139.0, 126.6, { yaw: 0 }); C.prop('bench', 143.2, 126.6, { yaw: 0 }); C.prop('bench', 144.8, 121, { yaw: PI / 2 });
  C.prop('planter', 141, 130.2); C.prop('planter', 141, 134.4); C.prop('lamp', 137.2, 120); C.prop('lamp', 137.2, 131); C.prop('bin', 145.4, 126.4);
  C.prop('bikeRack', 141, 116.4); C.prop('bush', 136.9, 117.2); C.prop('bush', 136.9, 133.4);
  // lab garden strips west + south of the lab
  C.ground(116, 112.5, 118, 139, TX.grass('#6aa858'), { y: 0.01 }); C.ground(118, 135, 136, 139, TX.grass('#6aa858'), { y: 0.01 }); C.ground(118, 112.5, 136, 115, TX.grass('#6aa858'), { y: 0.01 });
  for (const x of [120.5, 125, 129.5, 134]) C.prop('bush', x, 137.2);
  C.prop('mailbox', 136.8, 136.3); C.prop('pk_oak', 117, 137.4); C.prop('pk_oak', 117, 113.6);
  // the lab's direction monolith at the Mission Street end
  C.box('props', TX.solid('#2a8a84'), 139.2, 0, 138.2, 142.8, 1.2, 138.6, { top: TX.solid('#5ad8c0') });
  C.decal('props', signBoard('labdir', 'TOKON LAB', 3.4, 1.0, { bg: '#f4f8f6', fg: '#1e6a64', frame: '#3ab8a0', sub: 'HEALING  OPEN TO ALL', subCol: '#e8473a', shadow: false }), 141, 0.1, 138.6, 's', 3.4, 1.0, { off: 0.01 });
  C.nav.block(139.2, 138.2, 142.8, 138.6);
}

// ==================================================================== MARKET FRONTAGE: tram stop, kiosk, vending
function marketFrontage(C, night) {
  // tram shelter (x 145–153), roof lifts when you step under it
  const S = fadeable(C, 'tram shelter', 145, 110.2, 8, 2.3, 2.8, { inside: [145.2, 110.3, 152.8, 112.3] });
  const glass = TX.ptex('dt_glass', 1, 1, (g, W, H, r, P) => { P.fill('#a8d8ec'); P.dither(0, 0, W, H, '#e8f8ff', (x, y) => ((x + y) % 22 < 4 ? 0.7 : 0.1)); P.rect(0, 0, W, 2, '#5a6a7a'); });
  const post = TX.solid('#c8303a');
  for (const x of [145.1, 152.9]) for (const z of [110.35, 112.35]) C.box(S.back, post, x - 0.08, 0.12, z - 0.08, x + 0.08, 2.75, z + 0.08);
  C.box(S.back, glass, 145.2, 0.5, 112.3, 152.8, 2.5, 112.4); C.box(S.back, glass, 152.8, 0.5, 110.6, 152.9, 2.5, 112.3);
  C.decal(S.back, D.tramMapTex(), 152.92, 0.75, 111.4, 'e', 1.2, 1.7, { off: 0.03 });
  C.box(S.roof, TX.solid('#c8303a'), 144.8, 2.75, 110.0, 153.2, 2.95, 112.6, { top: TX.metalRoof('#d84a4a') });
  C.decal(S.roof, signBoard('tram', 'TRAM  MARKET ST', 4, 0.5, { bg: '#c8303a', fg: '#ffffff', frame: '#7a1a1e', bolts: false }), 149, 2.4, 112.6, 's', 4, 0.5, { off: 0.02 });
  C.box(S.back, TX.planks('#a86a3a'), 146.2, 0.12, 111.7, 151.6, 0.55, 112.25); C.nav.block(146.2, 111.7, 151.6, 112.25);
  C.nav.block(145, 112.25, 153, 112.45); C.nav.block(152.75, 110.6, 153, 112.4);
  C.prop('sign', 144.4, 110.6);
  C.spot('tramStop', 149, 111.1, PI);
  C.interact({ x: 149, z: 111.1, label: 'Check the tram stop', icon: 'map', mm: true, act: async (app) => {
    if (app.story && app.story.tramStop) return app.story.tramStop();
    await app.say('', 'MARKET ST tram stop. Next tram: 3 min. The route map lists Wharf, Chinatown, Van Ness, Market and Sunset Row.');
  } });
  C.npc({ id: 'dt_commuter', who: 'passerby18', name: 'Commuter', x: 151.3, z: 111.3, yaw: PI, clip: 'phone', lines: [['The tram is late again. I\'ll just catch a wild Tokonmon on my phone while I wait.'], ['Did you know the Market tram goes all the way to the wharf? Best clam chowder in the city.']] });
  // pocket plaza behind it: kiosk, vending machines, capsule toys, trees and benches
  C.ground(147, 113.5, 158, 125.5, TX.pavers('#e0d0b8'), { y: 0.01 });
  C.prop('dt_kiosk', 150.2, 116.2);
  C.interact({ x: 150.2, z: 117.6, label: 'Browse the newsstand', icon: 'book', act: async (app) => { const H = ['"STREET FINALS SATURDAY — WHO WILL WEAR THE CROWN?"', '"Wild Tokonmon spotted in Alamo Hill tall grass!"', '"Boba prices rise; trainers outraged."']; await app.say('Newsstand', 'Today\'s headline: ' + H[Math.floor(Math.random() * H.length)]); } });
  C.prop('vending', 156.4, 113.7); C.prop('vending', 157.5, 113.7); C.prop('dt_gacha', 155.2, 113.6); C.prop('dt_gacha', 154.2, 113.6);
  C.interact({ x: 156.9, z: 114.9, label: 'Buy a drink', icon: 'coin', act: async (app) => { if (app.audio && app.audio.sfx) app.audio.sfx('coin'); app.toast('Clunk! A cold Fizz Pop.', { icon: 'coin' }); } });
  C.interact({ x: 154.7, z: 114.8, label: 'Turn the capsule toy', icon: 'star', act: async (app) => { if (app.audio && app.audio.sfx) app.audio.sfx('gacha'); const T = ['a tiny keychain Chilichick', 'a rubber Bubblion', 'a sticker of a sleepy Strawbaa', 'a capsule… with another, smaller capsule inside']; app.toast('You got ' + T[Math.floor(Math.random() * T.length)] + '!', { icon: 'star' }); } });
  for (const [x, z] of [[149, 123.6], [156, 123.6]]) C.prop('pk_oak', x, z);
  C.prop('bench', 152.5, 121.4, { yaw: PI }); C.prop('bench', 152.5, 124.8, { yaw: 0 }); C.prop('bin', 154.7, 121.2); C.prop('planter', 152.5, 119.2);
  C.prop('bikeRack', 147.8, 120.5, { yaw: PI / 2 });
}

// ==================================================================== MOMO MART (convenience store), x 147–159, z 127–139
function momoMart(C, night) {
  const B = C.building({
    name: 'Momo Mart', x: 147, z: 127, w: 12, d: 12, floors: 1, enter: true,
    wall: TX.plaster('#f4f0e8'), trim: '#5ab86a', base: '#5a6070', inner: TX.wallpaper('#f8f8f4', '#e0ece0'),
    roof: { type: 'flat', tex: TX.concrete('#a8a8a0'), parapet: 1.0 },
    door: { side: 's', at: 0.25, w: 1.6, tex: TX.doorTex('#5ab86a', 'glass') },
    windows: { skip: ['s'], every: 3.2 }, floorTex: TX.tiles('#f4f2ee', '#dde2e8', 0.5), step: 'step_concrete', mm: '#ff8ab0',
    interior(C, B) {
      const g = B.gk(0, 'in'), grey = TX.solid('#b8bcc4'), white = TX.solid('#f4f4f2');
      // fridges along the north wall, a back counter (coffee + hot snacks) in the north-east corner
      furn(C, B, 0, 147.2, 127.2, 154.2, 128.0, 2.1, TX.solid('#c8ccd4'), { top: white, s: D.fridgeTex() });
      C.furniture(B, 0, 154.6, 127.2, 158.8, 128.0, 1.0, TX.solid('#5ab86a'), { top: TX.solid('#e8e8e4') });
      C.prop('dt_coffee', 155.4, 127.6, { y: 1.0, collide: false }); C.prop('dt_warmer', 157.3, 127.6, { y: 1.0, collide: false });
      C.decal(g, D.screenTex('dex', 2.4, 0.6), 156.7, 1.9, 127.12, 's', 2.4, 0.6, { off: 0.1 });
      // wall shelf on the west wall, two gondolas
      furn(C, B, 0, 147.2, 129.2, 147.9, 137.2, 1.8, grey, { top: white, e: D.shelfTex(1) });
      for (const [x, s] of [[149.6, 2], [152.2, 4]]) furn(C, B, 0, x, 129.8, x + 0.8, 134.6, 1.4, grey, { top: white, e: D.shelfTex(s, 2, 1.4), w: D.shelfTex(s + 1, 2, 1.4), s: D.shelfTex(s + 7, 0.8, 1.4) });
      // the counter (clerk behind, north of it), register, hot snacks
      furn(C, B, 0, 154.4, 133.4, 158.8, 134.3, 1.0, TX.solid('#5ab86a'), { top: TX.solid('#e8e8e4'), s: TX.ptex('dt_counter', 4.4, 1.0, (g2, W, H, r, P) => { P.fill('#5ab86a'); P.rect(0, 0, W, 4, '#f4f4f2'); P.rect(0, H - 4, W, 4, '#3a8a4a'); for (let x = 8; x < W; x += 24) { P.rect(x, 10, 14, 14, '#ff8ab0'); P.rect(x + 4, 8, 6, 4, '#5ab86a'); } }) });
      C.prop('dt_register', 155.4, 133.9, { y: 1.0, collide: false }); C.prop('dt_warmer', 157.6, 133.9, { y: 1.0, collide: false });
      C.prop('dt_atm', 147.85, 138.1, { yaw: PI / 2 });
      C.box(g, TX.solid('#e8473a'), 151.0, 0, 137.8, 151.6, 0.5, 138.4); C.box(g, TX.solid('#c8303a'), 151.05, 0.5, 137.85, 151.55, 0.62, 138.35);
      C.interact({ x: 156.4, z: 135.2, label: 'Shop at the counter', icon: 'bag', mm: true, act: async (app) => {
        if (app.story && app.story.shop) return app.story.shop();
        const i = await app.choose('Momo Mart — what would you like?', ['Onigiri ($2)', 'Fizz Pop ($1)', 'Just looking']);
        if (i === 2 || i < 0) return app.say('Clerk', 'Take your time! We never close.');
        if (app.audio && app.audio.sfx) app.audio.sfx('coin');
        await app.say('Clerk', i === 0 ? 'One salmon onigiri! Your partner is staring at it, by the way.' : 'One ice-cold Fizz Pop. Careful, it really sparkles.');
      } });
      C.interact({ x: 150.9, z: 131.6, label: 'Browse the shelves', icon: 'eye', act: async (app) => app.say('', 'Instant noodles, pocky-style sticks, fifteen flavours of Fizz Pop… and a whole shelf of Tokon treats.') });
      C.interact({ x: 150.7, z: 129.0, label: 'Open a fridge', icon: 'fridge', act: async (app) => app.say('', 'A blast of cold air. Milk tea, melon soda, and something labelled "ENERGY (FOR TOKONMON ONLY)".') });
    },
  });
  const f = B.gk(0, 'front');
  C.decal(f, D.storeWindow('mart', 3.8), 153, 0.4, 139, 's', 7.6, 1.9, { off: 0.03 });
  C.decal(f, D.storeWindow('mart', 1.6), 148.2, 0.4, 139, 's', 1.9, 1.9, { off: 0.03 });
  C.box(f, TX.solid('#3a8a4a'), 147.6, 2.42, 139.0, 158.4, 3.42, 139.14);
  C.decal(f, D.signs.mart(), 153.6, 2.47, 139.14, 's', 6, 0.9, { off: 0.01 });
  C.box(f, TX.solid('#f4f0e8'), 148.9, 2.32, 139.0, 151.1, 2.4, 140.0);
  C.prop('dt_gacha', 157.9, 139.7); C.prop('dt_gacha', 156.9, 139.7); C.prop('bin', 158.7, 139.7);
  C.npc({ id: 'dt_clerk', who: 'passerby46', name: 'Momo Mart Clerk', x: 156.8, z: 132.6, yaw: 0, lines: [['Irasshai— er, welcome to Momo Mart! Open 24 hours, 365 days.'], ['The onigiri are fresh at six. The Fizz Pop is fresh… forever, I think.']] });
}

// ==================================================================== BUBBLE MOON (boba café), x 160–168, z 129–139
function bubbleMoon(C, night) {
  const B = C.building({
    name: 'Bubble Moon', x: 160, z: 129, w: 8, d: 10, floors: 1, enter: true,
    wall: TX.plaster('#e4d4f4'), trim: '#b890e0', base: '#5a4a6a', inner: TX.wallpaper('#f6f0fa', '#e0d0f0'),
    roof: { type: 'flat', tex: TX.concrete('#a8a4b0'), parapet: 0.5 },
    door: { side: 's', at: 0.3, w: 1.1, tex: TX.doorTex('#7a4ab8', 'glass') },
    windows: { skip: ['s'], every: 2.8, curtain: '#b890e0' }, floorTex: TX.planks('#c89a72'), step: 'step_wood', mm: '#b890e0',
    interior(C, B) {
      const g = B.gk(0, 'in');
      C.decal(g, D.menuTex(), 164.2, 1.45, 129.12, 's', 2.4, 1.1, { off: 0.1 });
      C.prop('dt_neonmoon', 161.6, 129.35, { y: 1.5, collide: false });
      C.furniture(B, 0, 160.2, 129.2, 167.8, 129.8, 0.95, TX.solid('#a878d8'), { top: TX.solid('#f4ecf8') });
      C.prop('dt_cups', 162.2, 129.5, { y: 0.95, collide: false }); C.prop('dt_coffee', 166.6, 129.5, { y: 0.95, collide: false });
      C.furniture(B, 0, 161.4, 131.8, 167.8, 132.6, 1.0, TX.ptex('dt_bobacounter', 1, 1, (g2, W, H, r, P) => { P.fill('#b890e0'); for (let x = 0; x < W; x += 8) P.vline(x, 0, H, '#a070d0'); P.rect(0, 0, W, 3, '#f4ecf8'); }), { top: TX.solid('#f4ecf8') });
      C.prop('dt_register', 162.4, 132.2, { y: 1.0, collide: false }); C.prop('dt_cups', 165.6, 132.2, { y: 1.0, collide: false });
      C.prop('dt_cafetable', 163.0, 135.2); C.prop('dt_cafetable', 165.6, 137.4);
      C.furniture(B, 0, 160.2, 133.4, 160.8, 138.6, 0.45, TX.solid('#ffc0d8'), { top: TX.solid('#ffd8e8') });
      C.box(g, TX.solid('#d8b0f0'), 160.2, 0.45, 133.4, 160.35, 1.0, 138.6);
      C.prop('dt_plant', 167.3, 138.3);
      C.interact({ x: 164.3, z: 133.4, label: 'Order a boba', icon: 'bowl', mm: true, act: async (app) => {
        const i = await app.choose('Bubble Moon — today\'s menu', ['Milk tea', 'Ube taro', 'Mango', 'Nothing, thanks']);
        if (i < 0 || i === 3) return app.say('Barista', 'Come back when the moon is full! …Or tomorrow. Either works.');
        if (app.audio && app.audio.sfx) app.audio.sfx('bubble');
        await app.say('Barista', ['Classic milk tea, extra pearls!', 'Ube taro — the purple one. Very photogenic.', 'Mango with popping pearls. They go pop!'][i], 'Your partner eyes the straw with great interest.');
      } });
    },
  });
  const f = B.gk(0, 'front');
  C.decal(f, D.storeWindow('boba', 2.6), 165.5, 0.45, 139, 's', 4.4, 1.85, { off: 0.03 });
  C.box(f, TX.solid('#7a4ab8'), 160.6, 2.42, 139.0, 167.4, 3.3, 139.14); C.decal(f, D.signs.boba(), 164, 2.46, 139.14, 's', 5, 0.8, { off: 0.01 });
  awningS(C, f, TX.awningTex('#b890e0', '#f8f0ff'), 163.2, 167.8, 139, 2.38, 2.0, 0.9);
  C.prop('dt_cafetable', 166.2, 140.8);
  C.npc({ id: 'dt_barista', who: 'passerby3', name: 'Barista', x: 165.0, z: 130.9, yaw: 0, lines: [['Welcome to Bubble Moon! Our pearls are cooked fresh every hour.'], ['The Street Arena crowd always orders mango. Something about the colour of victory.']] });
  C.npc({ id: 'dt_taro', who: 'taro', name: 'Taro', x: 158.4, z: 140.9, yaw: 0, lines: [['I spent ALL my allowance on the capsule toys. I got three of the same Bubblion keychain.', 'Want one? I have… so many.'], ['When I grow up I\'m gonna battle in the Street Arena. Under the big lights!']] });
}

// ==================================================================== PETAL & STEM (corner florist on 5th St), x 159–168, z 115–126
function petalAndStem(C, night) {
  const B = C.building({ name: 'Petal & Stem', x: 159, z: 115, w: 9, d: 11, floors: 2, fh: 3.2, wall: TX.brick('#b8604a', '#e0d0c0'), trim: '#f4ece0', base: '#5a4a44',
    roof: { type: 'flat', tex: TX.concrete('#9a968e'), parapet: 0.6 }, windows: { every: 2.4, lit: 0.4, curtain: '#e8c86a', skip: ['e'] }, mm: '#c8786a' });
  const f = B.gk(0, 'front'), roof = `b${B.id}:roof`;
  // shopfront on the east face (5th Street), windows above
  const win = TX.ptex('dt_flowerwin', 3, 1.9, (g, W, H, r, P) => { P.fill('#2a3a2a'); P.rect(3, 3, W - 6, H - 6, '#e8f4e8'); P.dither(3, 3, W - 6, H - 6, '#b8d8c0', 0.2); for (let i = 0; i < 7; i++) { const x = 8 + i * 13, c = ['#ff6a8a', '#ffd84a', '#f8f0f0', '#b06aff', '#ff8a3a'][i % 5]; P.rect(x + 2, H - 22, 8, 14, '#8a6a4a'); for (let k = 0; k < 9; k++) P.rect(x + Math.floor(r() * 10), H - 34 + Math.floor(r() * 12), 3, 3, c); P.rect(x + 4, H - 26, 1, 6, '#3a8a4a'); } });
  C.decal(f, win, 168, 0.45, 118.4, 'e', 4.4, 1.9, { off: 0.03 }); C.decal(f, win, 168, 0.45, 123.6, 'e', 3.6, 1.9, { off: 0.03 });
  C.decal(f, TX.doorTex('#2a6a3a', 'glass'), 168, 0, 121.4, 'e', 1.0, 2.2, { off: 0.03 });
  C.box(f, TX.solid('#2a6a3a'), 168.0, 2.45, 115.4, 168.14, 3.25, 125.6); C.decal(f, D.signs.flowers(), 168.14, 2.45, 120.5, 'e', 6, 0.8, { off: 0.01 });
  awningE(C, f, TX.awningTex('#5ab86a', '#f8f4ec'), 115.6, 125.4, 168, 2.4, 2.0, 0.9);
  // a FIZZ POP billboard mounted on the upper storey of the 5th Street face
  C.box(B.gk(1, 'front'), TX.solid('#2a2e38'), 168.0, 3.3, 116.2, 168.16, 7.5, 124.8);
  C.decal(B.gk(1, 'front'), D.billboard('fizz'), 168.16, 3.4, 120.5, 'e', 8, 4, { off: 0.01 });
  for (const [z, k] of [[116.6, 'pk_flowers_r'], [117.6, 'pk_flowers_y'], [124.6, 'pk_flowers_p'], [125.4, 'pk_flowers_r']]) C.prop(k, 168.5, z);
  C.prop('planter', 163.5, 126.6);
  C.interact({ x: 168.9, z: 121.4, label: 'Smell the flowers', icon: 'leaf', act: async (app) => app.say('Florist', 'Sweet peas today! Tokonmon of the Bio type go wild for them.') });
  C.npc({ id: 'dt_florist', who: 'passerby50', name: 'Florist', x: 168.75, z: 119.4, yaw: PI / 2, lines: [['Fresh tulips, three for five! …Your partner is eating one. That\'s fine. That\'s fine.']] });
  C.prop('dt_ac', 161.5, 118, { y: 6.4, collide: false }); C.box(roof, TX.metalRoof('#9aa8b0'), 164, 6.4, 122, 165.6, 7.6, 123.6);
}

// ==================================================================== OFFICE TOWERS (non-enterable)
function towers(C, night) {
  const T = [
    { name: 'HALCYON', x: 180, z: 112.8, w: 15, d: 9.4, floors: 9, wall: D.towerTex('bronze', night), trim: '#3a3430', base: '#2a2622', crown: '#c8a060' },
    { name: 'NIMBUS CENTER', x: 201, z: 112.8, w: 14, d: 12.6, floors: 13, wall: D.towerTex('blue', night), trim: '#d0d8e0', base: '#5a6470', crown: '#e8eef4' },
    { name: 'AURORA', x: 218, z: 112.8, w: 11, d: 11.2, floors: 8, wall: D.stoneTowerTex('#e0d4bc', night), trim: '#c8bca4', base: '#8a7a64', crown: '#5ab8a8' },
  ];
  for (const t of T) {
    const fh = 3.5, B = C.building({ name: t.name, x: t.x, z: t.z, w: t.w, d: t.d, floors: t.floors, fh, wall: t.wall, trim: t.trim, base: t.base, roof: { type: 'flat', tex: TX.concrete('#8a8a86'), parapet: 0.9 }, windows: { skip: ['n', 's', 'e', 'w'] }, mm: '#7a8aa0' });
    const f = B.gk(0, 'front'), roof = `b${B.id}:roof`, H = t.floors * fh, cx = t.x + t.w / 2;
    // the lobby: glass, gold name, a canopy
    const lw = Math.min(8, t.w - 2);
    C.decal(f, D.lobbyTex(t.name, lw), cx, 0.05, t.z + t.d, 's', lw, 3.4, { off: 0.04 });
    C.box(f, TX.solid('#2a2e38'), cx - lw / 2 - 0.3, 3.4, t.z + t.d, cx + lw / 2 + 0.3, 3.6, t.z + t.d + 1.6, { top: TX.solid('#3a3e48') });
    C.decal(f, D.lobbyTex(t.name, 6), t.x + t.w, 0.05, t.z + t.d / 2, 'e', 6, 3.4, { off: 0.04 });
    // the crown: a set-back top storey, plant boxes, an antenna or a helipad
    C.box(roof, TX.solid(t.crown), t.x + 1.5, H, t.z + 1.5, t.x + t.w - 1.5, H + 2.6, t.z + t.d - 1.5, { top: TX.concrete('#9a9a96') });
    C.box(roof, TX.solid('#3a3e48'), t.x + 1.4, H + 2.6, t.z + 1.4, t.x + t.w - 1.4, H + 2.8, t.z + t.d - 1.4);
    if (t.name === 'NIMBUS CENTER') {
      C.box(roof, TX.solid('#9aa0aa'), cx - 0.12, H + 2.8, t.z + t.d / 2 - 0.12, cx + 0.12, H + 9, t.z + t.d / 2 + 0.12);
      C.box(roof, TX.solid('#e8473a'), cx - 0.2, H + 9, t.z + t.d / 2 - 0.2, cx + 0.2, H + 9.4, t.z + t.d / 2 + 0.2);
    } else if (t.name === 'HALCYON') {
      const pad = TX.ptex('dt_helipad', 5, 5, (g, W, Hh, r, P) => { P.fill('#5a5e66'); for (let a = 0; a < 6.3; a += 0.01) P.rect(W / 2 + Math.cos(a) * 64, Hh / 2 + Math.sin(a) * 64, 4, 4, '#f0c040'); P.rect(W / 2 - 24, Hh / 2 - 34, 10, 68, '#f4f0e8'); P.rect(W / 2 + 14, Hh / 2 - 34, 10, 68, '#f4f0e8'); P.rect(W / 2 - 24, Hh / 2 - 5, 48, 10, '#f4f0e8'); });
      groundDecal(C, pad, cx - 2.5, t.z + t.d / 2 - 2.5, cx + 2.5, t.z + t.d / 2 + 2.5, H + 2.82, roof);
    } else {
      for (let i = 0; i < 3; i++) C.box(roof, TX.solid(i & 1 ? '#5ab8a8' : '#e0d4bc'), t.x + 3 + i * 0.8, H + 2.8 + i * 1.2, t.z + 3 + i * 0.8, t.x + t.w - 3 - i * 0.8, H + 4.0 + i * 1.2, t.z + t.d - 3 - i * 0.8);
    }
    C.box(roof, TX.metalRoof('#9aa8b0'), t.x + 0.6, H, t.z + 0.6, t.x + 2.2, H + 1.4, t.z + 2.6);
  }
  // passage between the towers and the shops: trees, benches, a sculpture
  C.ground(178, 125.6, 230, 129.6, TX.pavers('#d8d0c4'), { y: 0.01 });
  for (const x of [199, 216.5]) C.prop('pk_oak', x, 127.6);
  C.prop('bench', 205, 127.8, { yaw: 0 }); C.prop('bench', 211, 127.8, { yaw: 0 }); C.prop('planter', 224, 127.4); C.prop('bikeRack', 221, 127.6);
  C.npc({ id: 'dt_suit', who: 'passerby23', name: 'Office Worker', x: 208.2, z: 126.9, yaw: 0, clip: 'phone', lines: [['Twelve meetings today. TWELVE. My Tokonmon has a better work-life balance than me.'], ['Nimbus Center has a rooftop garden. Employees only. …I\'ve never been.']] });
}

// ==================================================================== STARLIGHT CINEMA, x 180–200, z 125.6–139
function cinema(C, night) {
  const B = C.building({ name: 'Starlight Cinema', x: 180, z: 129.6, w: 20, d: 9.4, floors: 2, fh: 5, wall: D.decoWall(), trim: '#d8b060', base: '#2a8a84',
    roof: { type: 'flat', tex: TX.concrete('#8a8a86'), parapet: 1.2 }, windows: { skip: ['n', 's', 'e', 'w'] }, mm: '#d8b060',
    door: { side: 's', at: 0.5, w: 1.8, kind: 'glass', col: '#2a2e38', label: 'Buy a ticket', act: async (app) => {
      const i = await app.choose('STARLIGHT — now showing', ['Galaxy Rangers', 'Kaiju Picnic', 'Love in 8-Bit', 'Not today']);
      if (i < 0 || i === 3) return app.say('Ticket Booth', 'Popcorn\'s on us next time!');
      await app.say('Ticket Booth', ['Galaxy Rangers — sold out, sorry! The Street Finals crowd booked every seat.', 'Kaiju Picnic: a giant Tokonmon, a tiny sandwich. Next show at 9.', 'Love in 8-Bit… there are two seats left. Bring a friend!'][i]);
    } } });
  const f = B.gk(0, 'front'), z = 139;
  for (const x of [186.6, 193.4]) C.decal(f, TX.doorTex('#2a2e38', 'glass'), x, 0, z, 's', 1.8, 2.3, { off: 0.03 });
  // poster cases
  [['galaxy', 181.6], ['kaiju', 183.4], ['love', 196.6], ['galaxy', 198.4]].forEach(([k, x]) => { C.box(f, TX.solid('#d8b060'), x - 0.6, 0.55, z, x + 0.6, 2.25, z + 0.08); C.decal(f, D.posterTex(k), x, 0.62, z + 0.08, 's', 1.0, 1.5, { off: 0.01 }); });
  // the marquee box over the doors, the blade sign at the corner
  C.box(f, TX.solid('#2a2e38'), 182, 2.75, z, 198, 4.45, z + 1.6, { top: TX.solid('#d8b060') });
  C.decal(f, D.marqueeTex('NOW SHOWING', 'GALAXY RANGERS  KAIJU PICNIC  LOVE IN 8-BIT'), 190, 2.8, z + 1.6, 's', 14, 1.6, { off: 0.01 });
  C.box(f, TX.solid('#2a8a84'), 198.7, 4.4, z, 199.3, 11.6, z + 1.4);
  C.decal(f, D.bladeTex('STARLIGHT'), 199.3, 4.5, z + 0.7, 'e', 1.3, 7, { off: 0.01 });
  // ticket booth on the sidewalk
  C.box('props', TX.solid('#d8b060'), 189.2, 0.12, 139.6, 190.8, 2.3, 140.8, { top: TX.solid('#c8303a') });
  C.decal('props', TX.ptex('dt_booth', 1.2, 0.9, (g, W, H, r, P) => { P.fill('#2a2e38'); P.rect(2, 2, W - 4, H - 4, '#ffe8b0'); P.rect(0, H - 8, W, 8, '#c8303a'); P.rect(10, 6, 18, 2, '#d8b060'); }), 190, 1.0, 140.8, 's', 1.2, 0.9);
  C.box('props', TX.solid('#c8303a'), 189.0, 2.3, 139.4, 191.0, 2.5, 141.0); C.nav.block(189.2, 139.6, 190.8, 140.8);
  for (const x of [183.5, 196.5]) C.prop('bollard', x, 141.4);
  C.npc({ id: 'dt_moviefan', who: 'passerby30', name: 'Movie Buff', x: 182.6, z: 140.6, yaw: PI, lines: [['Galaxy Rangers is sold out because of the Street Finals viewing party. Sold. Out.'], ['Kaiju Picnic is better anyway. Trust me. I\'ve seen it eleven times.']] });
  C.interact({ x: 183.4, z: 140.1, label: 'Look at the posters', icon: 'eye', act: async (app) => app.say('', 'GALAXY RANGERS — "Space is big. Their capsules are bigger."', 'KAIJU PICNIC — "One giant appetite."', 'LOVE IN 8-BIT — "Two hearts. Zero polygons."') });
}

// ==================================================================== PIXEL PALACE (games) + RAMEN KAZE, Mission St north side
function eastShops(C, night) {
  const P = C.building({ name: 'Pixel Palace', x: 201, z: 130, w: 14, d: 9, floors: 3, fh: 3.4, wall: TX.concrete('#4a4a5a'), trim: '#ff4a8a', base: '#1e1e28',
    roof: { type: 'flat', tex: TX.concrete('#8a8a86'), parapet: 0.6 }, windows: { skip: ['s'], every: 2.6, lit: 0.6, curtain: '#5ac8ff' }, mm: '#4a4a5a',
    door: { side: 's', at: 0.5, w: 1.6, kind: 'glass', col: '#ff4a8a', label: 'Peek inside', act: async (app) => app.say('Clerk', 'Pixel Palace! Cards, games, battle gear. We\'re restocking right now — come back after the Finals!') } });
  const f = P.gk(0, 'front'), roof = `b${P.id}:roof`, H = 10.2;
  C.decal(f, D.storeWindow('games', 4.6), 204.2, 0.45, 139, 's', 5.2, 1.85, { off: 0.03 }); C.decal(f, D.storeWindow('games', 4.6), 211.8, 0.45, 139, 's', 5.2, 1.85, { off: 0.03 });
  C.box(f, TX.solid('#1e1e28'), 202, 2.5, 139, 214, 3.4, 139.14); C.decal(f, D.signs.games(), 208, 2.45, 139.14, 's', 8, 1.0, { off: 0.01 });
  for (let k = 1; k < 3; k++) { const g = P.gk(k, 'front'); C.decal(g, D.billboard(k === 1 ? 'phone' : 'concert'), 208, k * 3.4 + 0.25, 139, 's', 5.6, 2.8, { off: 0.04 }); }
  for (const x of [202.4, 213.6]) C.box(roof, TX.solid('#4a4e58'), x - 0.1, H, 133.4, x + 0.1, H + 2, 133.6);
  C.box(roof, TX.solid('#2a2e38'), 201.8, H + 1.4, 133.6, 214.2, H + 5.8, 133.8); C.decal(roof, D.billboard('league'), 208, H + 1.6, 133.8, 's', 8.6, 4.2, { off: 0.01 });
  C.prop('dt_ac', 203, 131.6, { y: H, collide: false });
  const K = C.building({ name: 'Ramen Kaze', x: 217, z: 130.4, w: 12.4, d: 8.6, floors: 2, fh: 3.3, wall: TX.planks('#5a3a2a', 'v'), trim: '#e8303a', base: '#2a1a1a',
    roof: { type: 'gable', tex: TX.roofTiles('#5a4a5a'), ridge: 'x', eave: 0.5, h: 1.8 }, windows: { skip: ['s'], every: 2.6, lit: 0.7, curtain: '#f4ece0' }, mm: '#8a3a2a',
    door: { side: 's', at: 0.3, w: 1.2, col: '#2a1a1a', label: 'Slurp some ramen', act: async (app) => { if (app.audio && app.audio.sfx) app.audio.sfx('door'); await app.say('Chef', 'Irasshaimase! Shoyu, miso or spicy? …Ah, you\'re a trainer. Spicy it is.', 'You slurp a steaming bowl. Your partner gets a naruto slice.'); } } });
  const kf = K.gk(0, 'front');
  C.decal(kf, D.storeWindow('ramen', 3.4), 224.4, 0.45, 139, 's', 6.4, 1.85, { off: 0.03 });
  C.box(kf, TX.solid('#2a1a1a'), 217.6, 2.45, 139, 228.8, 3.3, 139.14); C.decal(kf, D.signs.ramen(), 223.2, 2.45, 139.14, 's', 7, 0.85, { off: 0.01 });
  const noren = TX.ptex('dt_noren', 1.4, 0.8, (g, W, H, r, P) => { P.fill('#2a3a6a'); for (let x = 0; x < W; x += 11) P.vline(x, 4, H - 4, '#1e2a4a'); P.rect(0, 0, W, 4, '#5a3a2a'); ptext(P, 'RAMEN', W / 2, H / 2 + 2, '#f4f0e8', { font: 3, s: 2 }); });
  C.decal(kf, noren, 220.7, 1.55, 139.06, 's', 1.4, 0.8, { off: 0.02 });
  for (const x of [218.2, 228.2]) C.prop('lantern', x, 139.5, { y: 1.7, collide: false });
}

// ==================================================================== THE STREET ARENA, x 116–166, z 150–180
function streetArena(C, night) {
  const cx = 143, cz = 165;
  // the court: painted lines, emblem, trainer boxes A / B (8 m apart)
  groundDecal(C, D.courtTex(), D.COURT.x0, D.COURT.z0, D.COURT.x0 + D.COURT.w, D.COURT.z0 + D.COURT.d, 0.012);
  C.paint(126, 154, 160, 176, '#3a62b0');
  // north bleachers (rise north), west bleachers (rise west): walkable 0.33 m tiers
  const seat = TX.planks('#9aa0aa', 'h'), seat2 = TX.planks('#b0b6c0', 'h');
  const north = [['#e8473a', 152.6, 153.6], ['#f0c040', 151.6, 152.6], ['#3a8ad8', 150.6, 151.6]];
  north.forEach(([c, z0, z1], i) => C.plinth(124, z0, 158, z1, 0.33 * (i + 1), i & 1 ? seat2 : seat, D.riserTex(c), { mm: '#9aa0aa', y0: 0 }));
  const west = [['#e8473a', 122, 123], ['#f0c040', 121, 122], ['#3a8ad8', 120, 121], ['#5ab86a', 116.6, 120]];
  west.forEach(([c, x0, x1], i) => C.plinth(x0, 154, x1, 178.6, 0.33 * (i + 1), i & 1 ? seat2 : seat, D.riserTex(c), { mm: '#9aa0aa', y0: 0 }));
  // the north-west corner: announcer's table on a little stage
  C.plinth(116.6, 150.6, 124, 154, 0.33, TX.planks('#5a4a3a'), TX.solid('#2a2e38'));
  C.box('props', TX.solid('#2a2e38'), 118.6, 0.33, 151.2, 122.4, 1.2, 152.0, { top: TX.solid('#c8303a') }); C.nav.block(118.6, 151.2, 122.4, 152.0);
  C.decal('props', signBoard('mc', 'LIVE', 1.6, 0.6, { bg: '#c8303a', fg: '#ffffff', frame: '#1e1e28' }), 120.5, 0.45, 152.0, 's', 1.6, 0.6, { off: 0.01 });
  // the graffiti wall on Van Ness (its east face over the west bleachers), a fadeable piece
  const GW = fadeable(C, 'graffiti wall', 116.1, 150.4, 0.6, 29.2, 4.6);
  C.box(GW.front, TX.concrete('#8a8478'), 116.15, 0, 150.4, 116.6, 4.6, 179.6, { top: TX.solid('#6a6458') });
  C.nav.block(116.0, 150.4, 116.6, 179.6);
  const panels = [D.graffiti('TOKON', 0), D.mural('#ffd84a', '#5ac8d8'), D.graffiti('BATTLE!', 1), D.graffiti('GG', 4), D.graffiti('ZAP!', 2)];
  panels.forEach((t, i) => C.decal(GW.front, t, 116.6, 1.45, 153.4 + i * 5.8, 'e', 5.6, 3, { off: 0.02 }));
  // fences: tall chain-link behind the north bleachers, low railings on the camera-facing sides
  for (let x = 117.6; x < 156; x += 2) C.prop('dt_fence', x, 150.3);
  C.prop('dt_fence', 157.4, 150.3); C.prop('dt_fence', 165.4, 150.3);
  for (let z = 152; z < 179; z += 2) C.prop('dt_rail', 165.9, z, { yaw: PI / 2 });
  for (let x = 124.6; x < 165; x += 2) C.prop('dt_rail', x, 178.9);
  // the gate: an arch sign over the north-east entrance (fadeable)
  const G = fadeable(C, 'arena gate', 158.4, 150.0, 7.4, 0.6, 4.6);
  for (const x of [158.6, 164.4]) C.box(G.back, TX.solid('#1e1e28'), x - 0.15, 0.0, 150.15, x + 0.15, 4.6, 150.45);
  C.box(G.front, TX.solid('#1e1e28'), 158.3, 3.3, 150.1, 164.7, 4.5, 150.5); C.decal(G.front, D.signs.arena(), 161.5, 3.35, 150.5, 's', 6.2, 1.05, { off: 0.01 });
  C.nav.block(158.4, 150.1, 158.8, 150.5); C.nav.block(164.2, 150.1, 164.6, 150.5);
  // the scoreboard, on two posts behind the north bleachers (fadeable)
  const SB = fadeable(C, 'scoreboard', 137, 150.1, 7, 0.5, 6.4);
  for (const x of [138.4, 142.6]) C.box(SB.back, TX.solid('#3a3e48'), x - 0.12, 0, 150.2, x + 0.12, 3.4, 150.44);
  C.box(SB.front, TX.solid('#1e1e28'), 137.1, 3.3, 150.1, 143.9, 6.3, 150.5, { top: TX.solid('#c8303a') });
  C.decal(SB.front, D.scoreboardTex(), 140.5, 3.5, 150.5, 's', 6.4, 2.6, { off: 0.01 });
  // floodlights at the corners, aimed at the centre spot
  for (const [x, z] of [[125.2, 154.6], [165.2, 151.4], [125.2, 177.6], [163.4, 177.6]]) C.prop('dt_flood', x, z, { yaw: Math.atan2(cx - x, cz - z) });
  // team benches and coolers on the apron, the graffiti artist's kit
  C.prop('dt_teambench', 130.6, 155.0, { yaw: PI }); C.prop('dt_teambench', 155.4, 155.0, { yaw: PI });
  C.prop('dt_spray', 164.6, 172.8); C.prop('bin', 164.8, 156.2); C.prop('vending', 163.6, 152.8, { yaw: PI });
  // the "hall of fame" graffiti wall along 5th Street (east face), outside the railing
  const HW = fadeable(C, 'hall of fame', 166.5, 156, 0.6, 20, 3.2);
  C.box(HW.front, TX.brick('#8a5a4a', '#c8b8a8'), 166.6, 0, 156, 167.0, 3.2, 176, { top: TX.solid('#5a4a44') }); C.nav.block(166.5, 156, 167.1, 176);
  [D.graffiti('RIFF', 3, '#7a5a4a', 6.6), D.graffiti('STREET', 5, '#7a5a4a', 6.6), D.mural('#ff7a3a', '#3a3a58', 6.6)].forEach((t, i) => C.decal(HW.front, t, 167.0, 0.15, 159.4 + i * 6.6, 'e', 6.6, 3, { off: 0.02 }));
  C.prop('dt_spray', 167.8, 170.6, { yaw: -PI / 2 });
  // spots + interactions
  C.spot('arena', cx, cz, 0); C.spot('arenaA', cx - 4, cz, PI / 2); C.spot('arenaB', cx + 4, cz, -PI / 2); C.spot('arenaGate', 161.5, 151.2, PI * 0.85);
  C.interact({ x: 161.5, z: 151.6, label: 'Read the challenge board', icon: 'fist', mm: true, act: async (app) => {
    if (app.story && app.story.streetArena) return app.story.streetArena();
    await app.say('', 'STREET ARENA — open battles every day. Stand in box A or box B and wait for a challenger.', 'Finals: Saturday, 7 PM. No fireworks. (Looking at you, Chilichick owners.)');
  } });
  C.interact({ x: 140.5, z: 154.0, y: 1.6, label: 'Look at the scoreboard', icon: 'eye', act: async (app) => app.say('', 'RED 2 — BLUE 1. Round 3, 7:42 left on the clock. Someone forgot to reset it last night.') });
  C.interact({ x: 117.6, z: 165.6, y: 2.9, label: 'Admire the graffiti', icon: 'eye', act: async (app) => app.say('', 'Huge chrome letters: TOKON. BATTLE! GG. A grinning yellow Tokonmon wearing a crown — "STREET KING".') });
  C.npc({ id: 'dt_kaito', who: 'kaito', name: 'Kaito', x: 156.2, z: 158.0, yaw: Math.atan2(cx - 156.2, cz - 158), lines: [['Hmph. You again? This court is where real trainers settle things.', 'When you\'re ready, stand in box A. I\'ll be in B.'], ['The floodlights come on at sunset. That\'s when the good battles start.']] });
  C.npc({ id: 'dt_spike', who: 'spike', name: 'Spike', x: 135.5, z: 152.7, yaw: 0, clip: 'sit', lines: [['Yo! Best seat in the house, right here. Second row, centre.', 'Last night some kid\'s Bubblion flooded the whole court. LEGENDARY.'], ['You battling today? I\'ll cheer. Loudly. Badly.']] });
  C.npc({ id: 'dt_reporter', who: 'reporter', name: 'Reporter', x: 127.6, z: 156.2, yaw: Math.atan2(cx - 127.6, cz - 156.2), clip: 'explain', lines: [['Live from the Street Arena! …Oh, sorry, we\'re not live yet. Sound check.', 'Any comment for Channel 8 before the Finals?'], ['Rumour says a trainer with a fire-type partner is climbing the ranks fast. Know anyone like that?']] });
  C.npc({ id: 'dt_riff', who: 'riff', name: 'Riff', x: 168.9, z: 164.0, yaw: -PI / 2, lines: [['This wall? Hall of fame, man. Every Street King gets their tag up here.', 'Win the Finals and I\'ll paint your partner. Big. Chrome. Sparkles.'], ['My band plays the pier on Friday. Riff and the Feedbacks. The posters are… everywhere. I made sure.']] });
  C.npc({ id: 'dt_fan', who: 'passerby37', name: 'Fan', x: 121.5, z: 163.0, yaw: PI / 2, clip: 'cheer', lines: [['GO RED! GO BLUE! …I just like cheering, honestly.']] });
}

// ==================================================================== PARKING LOT, x 178–208, z 150–180
function parking(C, R) {
  // stall lines (2.7 m bays): row A z 151–156 (noses north), rows B/C back to back z 163–173
  const xs = []; for (let x = 180; x <= 207.1; x += 2.7) xs.push(x);
  for (const x of xs) { groundLine(C, x, 151, x, 156); groundLine(C, x, 163, x, 173); }
  groundLine(C, 180, 168, 207, 168); groundLine(C, 179, 159.5, 207.5, 159.5, 0.12, '#f0c040');
  for (let i = 0; i < xs.length - 1; i++) {
    const x = (xs[i] + xs[i + 1]) / 2;
    if (R() < 0.75) C.prop('dt_car' + Math.floor(R() * 6), x, 153.6, { yaw: PI / 2 });
    if (R() < 0.6) C.prop('dt_car' + Math.floor(R() * 6), x, 165.5, { yaw: -PI / 2 });
    if (R() < 0.6) C.prop('dt_car' + Math.floor(R() * 6), x, 170.5, { yaw: PI / 2 });
  }
  C.prop('dt_paystation', 179.0, 158.0, { yaw: PI / 2 }); C.prop('dt_psign', 178.8, 156.2, { yaw: PI / 2 });
  C.interact({ x: 179.9, z: 158.0, label: 'Read the pay station', icon: 'coin', act: async (app) => app.say('', 'PARKING $3 / HOUR. Tokonmon ride free. (They don\'t drive. Mostly.)') });
  for (const z of [161.2, 176]) C.prop('lamp', 193.5, z);
  C.prop('bollard', 179, 150.8); C.prop('bollard', 181, 150.8); C.prop('cone', 205, 161); C.prop('cone', 206, 162.2);
  // a big pole billboard at the south edge, facing the camera (fadeable)
  const BB = fadeable(C, 'parking billboard', 189, 178.4, 9, 0.8, 9.4);
  for (const x of [191.5, 196.5]) C.box(BB.back, TX.solid('#4a4e58'), x - 0.18, 0, 178.6, x + 0.18, 5.2, 178.96);
  C.box(BB.front, TX.solid('#2a2e38'), 189.3, 5.0, 178.5, 198.7, 9.4, 178.8); C.decal(BB.front, D.billboard('boba'), 194, 5.15, 178.8, 's', 8.6, 4.1, { off: 0.01 });
  C.nav.block(191.3, 178.5, 191.7, 179.0); C.nav.block(196.3, 178.5, 196.7, 179.0);
  C.decal('props', D.signs.parking(), 180.6, 2.2, 150.25, 's', 3.4, 0.9, { off: 0.2 });
  C.box('props', TX.solid('#4a4e58'), 179.0, 0.12, 150.1, 179.15, 3.1, 150.25); C.box('props', TX.solid('#4a4e58'), 182.1, 0.12, 150.1, 182.25, 3.1, 150.25); C.box('props', TX.solid('#1e3a8a'), 178.8, 2.1, 150.25, 182.4, 3.2, 150.4);
}

// ==================================================================== FOOD TRUCK ALLEY, x 208–230, z 150–180
function foodTrucks(C) {
  C.prop('dt_truck_taco', 212.6, 154.0); C.prop('dt_truck_ice', 220.2, 154.0); C.prop('dt_truck_dumpling', 210.0, 171.4, { yaw: PI / 2 });
  C.interact({ x: 211.4, z: 156.4, label: 'Order tacos', icon: 'bowl', act: async (app) => { if (app.audio && app.audio.sfx) app.audio.sfx('coin'); await app.say('Taco Truck', 'Two al pastor, extra pineapple! Your partner gets the crunchy bits.'); } });
  C.interact({ x: 219.0, z: 156.4, label: 'Get ice cream', icon: 'bowl', act: async (app) => { if (app.audio && app.audio.sfx) app.audio.sfx('coin'); await app.say('Ice Cream Truck', 'Strawberry swirl with rainbow sprinkles! Careful — it melts fast in this sun.'); } });
  C.interact({ x: 212.4, z: 172.5, label: 'Buy dumplings', icon: 'bowl', act: async (app) => { if (app.audio && app.audio.sfx) app.audio.sfx('coin'); await app.say('Dumpling Truck', 'Six pork-and-chive, fresh from the steamer! Dip in the black vinegar.'); } });
  for (const [x, z, k] of [[214.6, 162.4, 'parasol'], [220.6, 161.6, 'dt_parasol'], [226.4, 163.4, 'parasol'], [216.2, 170.0, 'dt_parasol'], [222.4, 171.2, 'parasol'], [227.2, 175.6, 'dt_parasol'], [215.6, 176.6, 'parasol']]) C.prop(k, x, z);
  // festoon lights on four poles
  const poles = [[209.2, 158.2], [228.8, 158.2], [209.2, 178.6], [228.8, 178.6]];
  for (const [x, z] of poles) C.box('props', TX.solid('#3a3e48'), x - 0.09, 0, z - 0.09, x + 0.09, 4.6, z + 0.09);
  for (const [x, z] of poles) C.nav.block(x - 0.15, z - 0.15, x + 0.15, z + 0.15);
  festoon(C, 'dt_bulb', 209.2, 158.2, 228.8, 178.6, 4.5, 16, 0.8); festoon(C, 'dt_bulb', 228.8, 158.2, 209.2, 178.6, 4.5, 16, 0.8);
  festoon(C, 'dt_bulb', 209.2, 158.2, 228.8, 158.2, 4.5, 12, 0.5); festoon(C, 'dt_bulb', 209.2, 178.6, 228.8, 178.6, 4.5, 12, 0.5);
  // the alley sign on posts at the north edge (south face → camera)
  for (const x of [223.4, 229.0]) C.box('props', TX.solid('#3a3e48'), x - 0.08, 0.12, 150.5, x + 0.08, 3.6, 150.66);
  C.box('props', TX.solid('#a8501e'), 223.0, 2.7, 150.5, 229.4, 3.7, 150.66); C.decal('props', D.signs.food(), 226.2, 2.75, 150.66, 's', 6.2, 0.9, { off: 0.01 });
  C.nav.block(223.3, 150.4, 223.5, 150.8); C.nav.block(228.9, 150.4, 229.1, 150.8);
  C.prop('bin', 222.6, 166.4); C.prop('bin', 209.4, 163); C.prop('planter', 225.6, 179.0); C.prop('crate', 215.6, 152.2); C.prop('crate', 223.3, 152.4);
  C.npc({ id: 'dt_foodie', who: 'passerby100', name: 'Foodie', x: 220.6, z: 160.4, yaw: 0, clip: 'sip', lines: [['I rank every food truck in the city. The dumpling truck is a solid nine. The ice cream? Ten. Don\'t tell the dumplings.']] });
}

// ==================================================================== STREET FURNITURE
function streetFurniture(C) {
  // lamps, street trees, hydrants, bins along Mission and 5th
  for (const x of [122, 134, 146, 163.6, 184, 196, 206, 220]) C.prop('lamp', x, 141.4);
  for (const x of [128, 152, 164, 190, 202, 214, 226]) C.prop('lamp', x, 149.3, { yaw: PI });
  for (const z of [116, 127, 137.6, 156, 175]) C.prop('lamp', 168.6, z);
  for (const z of [121, 132, 153, 162, 171]) C.prop('lamp', 177.4, z, { yaw: PI });
  for (const x of [125, 140, 202.6, 216]) C.prop('pk_oak', x, 141.0);
  C.prop('hydrant', 167.4, 141.2); C.prop('hydrant', 178.6, 148.8); C.prop('mailbox', 177.2, 141.0); C.prop('dt_newsbox', 180.4, 141.1);
  C.prop('bin', 144.4, 141.2); C.prop('bin', 199.6, 141.2); C.prop('bin', 169.4, 149.4);
  C.prop('bikeRack', 131, 141.1); C.prop('dt_bike', 131, 141.6);
  for (let x = 182; x < 208; x += 3.2) C.prop('dt_meter', x, 149.6);
  // traffic lights at the junction corners and the street signs
  C.prop('dt_tlight', 169.4, 141.6, { yaw: PI / 2 }); C.prop('dt_tlight', 176.6, 148.4, { yaw: -PI / 2 }); C.prop('dt_tlight', 176.6, 141.6, { yaw: PI }); C.prop('dt_tlight', 169.4, 148.4, { yaw: 0 });
  C.box('props', TX.solid('#5a6070'), 169.0, 0.12, 139.6, 169.12, 3.4, 139.72);
  C.decal('props', D.signs.mission(), 168.4, 3.0, 139.72, 's', 2.2, 0.4, { off: 0.01 }); C.decal('props', D.signs.fifth(), 169.12, 2.5, 139.66, 'e', 1.6, 0.4, { off: 0.01 });
}
