// Quests: main story chapter + side quests. Steps are checked against the game
// state (flags, counters, bag); rewards are granted by the game layer.
const F = (k) => (s) => !!s.flags[k];
const monCounter = (key, n, species) => (s) => s.party.concat(s.box).some((m) => (!species || species.includes(m.species)) && (key === 'foods' ? m.counters.foods.length : key.startsWith('defeat:') ? (m.counters.defeat[key.slice(7)] || 0) : m.counters[key]) >= n);

export const QUESTS = {
  main_soul_link: {
    name: 'Episode 1 — Soul Link', main: true, giver: 'coach',
    desc: 'Become a licensed Elemon Tamer, enter the Kansai League and stand up to Team Metallica.',
    steps: [
      { text: 'Meet Coach Gonda at the Osaka Castle training ground', done: F('met_coach') },
      { text: 'Link souls with your first Elemon', done: F('got_starter') },
      { text: 'Pass Coach Gonda\'s practice battle', done: F('beat_coach') },
      { text: 'Battle your rival Kaito', done: F('fought_kaito') },
      { text: 'Get ice cream in Dotonbori', done: F('icecream') },
      { text: 'Stop Team Metallica on Ebisu Bridge', done: F('beat_metallica_1') },
      { text: 'Have dinner at Abbey Road Okonomiyaki', done: F('dinner') },
      { text: 'Rest at the training ground', done: F('day1_done') },
      { text: 'Register for the Kansai League in Umeda', done: F('license') },
      { text: 'Win your first rank matches', done: (s) => s.league.wins >= 2 },
      { text: 'Lunch break at the Umeda Food Hall', done: F('lunch_d2') },
      { text: 'Reach Rookie C before the Rookie Cup qualifier closes (Day 5)', done: (s) => s.league.points >= 100 },
    ],
    reward: { money: 5000, items: { diamond: 1 } },
  },
  fallen_stars: {
    name: 'Fallen Stars', giver: 'hoshino', desc: 'Dr. Hoshino believes fragments of a fallen star are scattered across the Minoh Safari. They may be tied to the legends of Polaris and Solaris.',
    steps: [
      { text: 'Hear Dr. Hoshino\'s story', done: F('hoshino_met') },
      { text: 'Find star fragments in Minoh (3)', done: (s) => (s.bag.star_fragment || 0) >= 3 || !!s.flags.fragments_given },
      { text: 'Bring the fragments to Dr. Hoshino', done: F('fragments_given') },
    ],
    reward: { items: { star_gem: 1 }, money: 3000, flags: { legend_polaris_1: true } },
  },
  lemon_squeeze: {
    name: 'Lemon Squeeze', giver: 'ranger', desc: 'The ranger says Lemmo are overrunning Maple Ridge and their Alpha is getting cocky. (Beatlet seems strangely excited about this…)',
    steps: [
      { text: 'Defeat 20 Lemmo', done: monCounter('defeat:lemmo', 20) },
      { text: 'Defeat the Alpha Lemmo on Maple Ridge', done: monCounter('defeat:alpha_lemmo', 1) },
    ],
    reward: { money: 2500, items: { lemon_tart: 3, amethyst: 2 } },
  },
  protection_racket: {
    name: 'Protection Racket', giver: 'vendor', desc: 'Team Metallica keeps shaking down the takoyaki vendor. Their hideout is in a Shinsekai back alley.',
    steps: [
      { text: 'Find Team Metallica\'s alley in Shinsekai', done: F('found_alley') },
      { text: 'Beat Riff and Moshi in the alley', done: F('beat_alley') },
      { text: 'Report back to the vendor in Dotonbori', done: F('racket_done') },
    ],
    reward: { money: 4000, items: { takoyaki: 10 }, cosmetics: ['badge_metal'] },
  },
  satisfaction: {
    name: "(I Can't Get No) Satisfaction", giver: 'rollingstone', desc: 'Rollingstone is never satisfied. Feed it 8 different foods.',
    steps: [{ text: 'Feed Rollingstone 8 different foods', done: monCounter('foods', 8, ['rollingstone']) }],
    reward: { items: { ramune: 3 } },
  },
  dojo_discipline: {
    name: 'Dojo Discipline', giver: 'dojo_master', desc: 'The old master says true strength rises with the sun. Meditate at the dojo three times.',
    steps: [{ text: 'Meditate at the Shinsekai dojo (3)', done: (s) => (s.flags.dojo_sessions || 0) >= 3 }],
    reward: { items: { protein_mochi: 2 }, cosmetics: ['clip_flower'] },
  },
};
export function questProgress(s, id) {
  const q = QUESTS[id];
  const steps = q.steps.map((st) => ({ text: st.text, done: !!st.done(s) }));
  const cur = steps.findIndex((x) => !x.done);
  return { steps, current: cur, complete: cur === -1 };
}
