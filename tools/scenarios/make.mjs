// Builds save files for play-test scenarios: node tools/scenarios/make.mjs <name> > save.json
import * as S from '../../src/game/state.js';
import { createElemon } from '../../src/game/elemon.js';
import { SPECIES } from '../../src/data/species.js';
import { SKILLS } from '../../src/data/skills.js';

const STORY = ['met_coach', 'starter', 'got_starter', 'beat_coach', 'fought_kaito', 'unlock_dotonbori', 'icecream', 'beat_metallica_1', 'got_beatlet', 'dinner', 'hoshino_met', 'day1_done', 'unlock_umeda', 'license', 'unlock_shinsekai', 'lunch_d2', 'free_time', 'seen_minoh', 'seen_shinsekai', 'ranger_met', 'dojo_intro'];
const DRIVER_DONE = ['pt_shinsekai', 'pt_dojo', 'pt_onsen', 'pt_minoh', 'pt_ranger', 'pt_umeda'];
function mon(sp, lv) {
  const m = createElemon(sp, { level: lv, friendship: 150 });
  for (const [l, id] of SPECIES[sp].learn) if (l <= lv && !m.skills.known.includes(id)) m.skills.known.push(id);
  m.skills.active = m.skills.known.filter((id) => SKILLS[id] && SKILLS[id].kind === 'active').slice(0, 4);
  m.skills.ult = lv >= 14 ? SPECIES[sp].ult : null;
  return m;
}
function base(day, hour, map, x, z) {
  const s = S.newGame({ name: 'Rin' });
  s.player.look = null; s.player.preset = 'player_a';
  for (const f of [...STORY, ...DRIVER_DONE]) s.flags[f] = true;
  s.flags.starter = 'kindoru';
  s.time = { day, hour };
  s.map = { id: map, x, z };
  s.story.beat = 'free';
  s.unlocks.slots = { active: 4, ult: 1, passive: 2 };
  s.unlocks.locations = ['castle_park', 'dotonbori', 'umeda', 'shinsekai', 'minoh_waterfall', 'minoh_bamboo', 'minoh_maple'];
  s.quests.main_soul_link = { step: 11, done: false };
  s.quests.fallen_stars = { step: 2, done: false };
  s.money = 12000; s.bag = { takoyaki: 5, quartz: 6, amethyst: 2, ramune: 3 };
  s.league.points = 60; s.league.wins = 2;
  s.deadlines = [{ id: 'rookie_cup', name: 'Rookie Cup qualifier', day: 5, hour: 18, done: false }];
  return s;
}
const scen = {
  polaris() { const s = base(3, 20.2, 'minoh_waterfall', 31, 40); s.flags.fragments_given = true; s.bag.star_gem = 1; s.party = [mon('kindoru', 18), mon('beatlet', 15), mon('pebblips', 14)]; return s; },
  rookiecup() { const s = base(5, 9, 'castle_park', 22, 40); s.league.points = 110; s.league.rank = 'C'; s.party = [mon('kindoru', 14), mon('beatlet', 12)]; return s; },
  lemmo() { const s = base(3, 9, 'minoh_maple', 23, 40); s.party = [mon('beatlet', 12), mon('kindoru', 14)]; s.party[0].counters.defeat = { lemmo: 19, alpha_lemmo: 1 }; return s; },
};
process.stdout.write(JSON.stringify(scen[process.argv[2]]()));
