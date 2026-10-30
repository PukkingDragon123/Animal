// Content integrity: every Tokonmon the game shows is hand-pixel art that renders
// in every clip and view, and every audio id the code asks for exists.
import fs from 'node:fs';
import path from 'node:path';
import { ok, section, done } from './_h.js';
import { BGM, SFX_SAMPLES } from '../src/audio/samples.js';
import { SPECIES } from '../src/data/species.js';
import { renderFrame, CLIPS } from '../src/px/pixmon.js';
import { SFX_NAMES, TRACK_IDS, STINGER_IDS, AMBIENCES } from '../src/audio/audio.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const srcFiles = [];
(function walk(d) { for (const f of fs.readdirSync(path.join(root, d))) { const p = d + '/' + f; if (fs.statSync(path.join(root, p)).isDirectory()) walk(p); else if (p.endsWith('.js')) srcFiles.push(p); } })('src');
const allSrc = srcFiles.map((f) => [f, read(f)]);

section('hand-pixel Tokonmon: every design renders every clip, front and back');
const DESIGNS = {};
for (const f of ['pix_starters', 'pix_friends', 'pix_bullies', 'pix_wild', 'pix_evos_a', 'pix_evos_b']) {
  try { Object.assign(DESIGNS, (await import(`../src/data/sprites/${f}.js`)).SPRITES); } catch (e) { if (f === 'pix_starters') throw e; }
}
for (const [id, d] of Object.entries(DESIGNS)) {
  ok(`${id} is a known species`, !!SPECIES[id]);
  let bad = null;
  for (const clip of Object.keys(CLIPS)) for (const yaw of [-45, 45, 180]) for (let f = 0; f < CLIPS[clip]; f += 3) {
    try { const s = renderFrame(d, { clip, frame: f, yaw, scale: 0.6 }); if (s.w !== d.w || s.h !== d.h || !s.data.some((v) => v >>> 24)) bad = bad || `${clip}/${yaw}/${f} empty`; }
    catch (e) { bad = bad || `${clip}/${yaw}/${f}: ${e.message}`; }
  }
  ok(`${id} renders all clips${bad ? ' — ' + bad : ''}`, !bad);
}
for (const id of ['chilichick', 'bubblion', 'strawbaa']) ok(`starter ${id} is drawn`, !!DESIGNS[id]);
const pendingArt = Object.keys(SPECIES).filter((id) => !DESIGNS[id]);
if (pendingArt.length) console.log('   species still to be drawn:', pendingArt.join(', '));

section('audio ids referenced in code exist');
const used = { sfx: new Set(), music: new Set(), stinger: new Set() };
for (const [, src] of allSrc) {
  for (const m of src.matchAll(/\.sfx\('([a-z_0-9]+)'[,)]/g)) used.sfx.add(m[1]);
  for (const m of src.matchAll(/\.music\('([a-z_0-9]+)'/g)) used.music.add(m[1]);
  for (const m of src.matchAll(/stinger\('([a-z_0-9]+)'/g)) used.stinger.add(m[1]);
  for (const m of src.matchAll(/music: '([a-z_0-9]+)'/g)) used.music.add(m[1]);
}
for (const id of used.sfx) ok(`sfx ${id}`, SFX_NAMES.includes(id) || !!SFX_SAMPLES[id]);   // synthesised or a recorded sample
for (const id of used.music) ok(`music ${id}`, TRACK_IDS.includes(id) || !!BGM[id]);   // procedural track or recorded BGM
for (const id of used.stinger) ok(`stinger ${id}`, STINGER_IDS.includes(id));
for (const [, src] of allSrc) for (const m of src.matchAll(/ambience: '([a-z_0-9]+)'/g)) ok(`ambience ${m[1]}`, AMBIENCES.includes(m[1]));

done('content');
