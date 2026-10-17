// Content integrity: every species has a design, every map uses real props and
// exposes the story points/arenas the scripts rely on (all reachable), every
// audio id referenced in code exists, and skills/designs line up.
import fs from 'node:fs';
import path from 'node:path';
import { ok, section, done } from './_h.js';
import { SPECIES } from '../src/data/species.js';
import { LOCATIONS } from '../src/data/locations.js';
import { CREATURE_DESIGNS, PROPS, HUMANS } from '../src/data/designs/index.js';
import { buildGrid } from '../src/world/map.js';
import { findPath } from '../src/world/nav.js';
import { buildEnvironment, setPropLibrary } from '../src/gfx/env.js';
import { SFX_NAMES, TRACK_IDS, STINGER_IDS, AMBIENCES } from '../src/audio/audio.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const srcFiles = [];
(function walk(d) { for (const f of fs.readdirSync(path.join(root, d))) { const p = d + '/' + f; if (fs.statSync(path.join(root, p)).isDirectory()) walk(p); else if (p.endsWith('.js')) srcFiles.push(p); } })('src');
const allSrc = srcFiles.map((f) => [f, read(f)]);

section('every species has a hand-made design');
const NO_DESIGN_OK = new Set();
for (const id of Object.keys(SPECIES)) ok(`design for ${id}`, !!CREATURE_DESIGNS[id] || NO_DESIGN_OK.has(id));
for (const id of ['player_a', 'player_b', 'player_c', 'coach', 'mika', 'kaito', 'taro', 'thrash', 'riff', 'moshi', 'hoshino', 'vendor', 'clerk', 'farmer', 'receptionist', 'dojo_master', 'ranger', 'shopkeeper', 'granny'])
  ok(`character ${id}`, !!HUMANS.CHARACTERS[id] && !!HUMANS.CHAR_LORE[id]);

section('maps: props, story points, arenas, reachability');
setPropLibrary(PROPS);
const NEED = {
  farm: ['pasture', 'field', 'farmer', 'cam_wide', 'treeline', 'fence_jump', 'wolf_stop'],
  castle_park: ['gate', 'mika_meet', 'coach', 'kaito_enter', 'pedestals', 'bench_night', 'castle_view', 'ground_center'],
  dotonbori: ['arrive', 'icecream', 'icecream_table', 'vendor', 'taro', 'punks_enter', 'restaurant', 'hoshino', 'canal_view'],
  umeda: ['arrive', 'reception', 'receptionist', 'plaza_view', 'foodhall', 'lunch_table', 'opponent'],
  shinsekai: ['arrive', 'dojo_master', 'onsen', 'arcade', 'cosmetics', 'shop', 'alley', 'tower_view'],
  minoh_waterfall: ['entrance', 'ranger'], minoh_bamboo: ['entrance', 'ranger'], minoh_maple: ['entrance', 'ranger'],
};
const ARENAS = { castle_park: ['main'], dotonbori: ['bridge'], umeda: ['stage'], shinsekai: ['yard', 'alley'] };
const maps = {};
for (const id of Object.keys(NEED)) {
  const def = (await import(`../src/world/maps/${id}.js`)).default;
  maps[id] = def;
  ok(`${id}: id matches file`, def.id === id);
  for (const p of def.props || []) ok(`${id}: prop ${p[0]} exists`, !!PROPS.DESIGNS[p[0]]);
  const g = buildGrid(def);
  buildEnvironment(def, g, { textures: false });
  const start = def.spawns.start;
  const reach = (x, z) => { const p = findPath(g, start[0], start[1], x, z); return !!p; };
  for (const k of NEED[id]) {
    const pt = (def.points && def.points[k]) || (def.spawns && def.spawns[k]);
    ok(`${id}: point ${k} defined`, !!pt);
    if (pt && k !== 'cam_wide' && k !== 'treeline' && k !== 'castle_view' && k !== 'canal_view' && k !== 'plaza_view' && k !== 'tower_view' && k !== 'bench_night' && id !== 'farm') ok(`${id}: point ${k} reachable`, reach(pt[0], pt[1]), pt);
  }
  for (const a of ARENAS[id] || []) { const A = def.arenas && def.arenas[a]; ok(`${id}: arena ${a}`, !!A); if (A) ok(`${id}: arena ${a} reachable`, reach(A.x, A.z)); }
  for (const ex of def.exits || []) ok(`${id}: exit target ${ex.to}`, ex.to === 'worldmap' || !!Object.values(LOCATIONS).find((L) => L.map === ex.to));
  if (def.safari) for (const sp of def.safari.spawns) ok(`${id}: safari species ${sp.species}`, !!SPECIES[sp.species]);
  if (def.ambience && def.ambience.music) ok(`${id}: music ${def.ambience.music}`, TRACK_IDS.includes(def.ambience.music));
  if (def.ambience && def.ambience.sound) ok(`${id}: ambience ${def.ambience.sound}`, AMBIENCES.includes(def.ambience.sound));
}
for (const [id, L] of Object.entries(LOCATIONS)) {
  ok(`location ${id} map loaded`, !!maps[L.map]);
  if (maps[L.map]) ok(`location ${id} spawn ${L.spawn}`, !!((maps[L.map].points || {})[L.spawn] || (maps[L.map].spawns || {})[L.spawn]));
}

section('audio ids referenced in code exist');
const used = { sfx: new Set(), music: new Set(), stinger: new Set() };
for (const [, src] of allSrc) {
  for (const m of src.matchAll(/\.sfx\('([a-z_0-9]+)'[,)]/g)) used.sfx.add(m[1]);
  for (const m of src.matchAll(/\.music\('([a-z_0-9]+)'/g)) used.music.add(m[1]);
  for (const m of src.matchAll(/stinger\('([a-z_0-9]+)'/g)) used.stinger.add(m[1]);
  for (const m of src.matchAll(/music: '([a-z_0-9]+)'/g)) used.music.add(m[1]);
}
for (const id of used.sfx) ok(`sfx ${id}`, SFX_NAMES.includes(id));
for (const id of used.music) ok(`music ${id}`, TRACK_IDS.includes(id));
for (const id of used.stinger) ok(`stinger ${id}`, STINGER_IDS.includes(id));

done('content');
