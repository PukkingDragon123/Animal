// World map: three towns + outskirts. Locations unlock through the story.
export const TOWNS = {
  chuo: { name: 'Chuo — Castle District', color: '#ffb3d9' },
  namba: { name: 'Namba — Neon Canals', color: '#ff5ac8' },
  umeda: { name: 'Umeda — Sky District', color: '#5ae0ff' },
  shinsekai: { name: 'Shinsekai — New World', color: '#ffd23a' },
  minoh: { name: 'Minoh Safari Reserve', color: '#7ad04a' },
};
export const LOCATIONS = {
  castle_park: { name: 'Osaka Castle Park', town: 'chuo', map: 'castle_park', spawn: 'gate', icon: '🏯', desc: 'The training ground beneath the castle. Coach Gonda trains rookies here.', services: ['training'], unlock: 'start', pos: [0.48, 0.42] },
  dotonbori: { name: 'Dotonbori', town: 'namba', map: 'dotonbori', spawn: 'arrive', icon: '🦀', desc: 'Neon canal of food stalls, giant crab signs and street battles.', services: ['restaurant', 'icecream', 'shop'], unlock: 'flag:unlock_dotonbori', pos: [0.4, 0.66] },
  umeda: { name: 'Umeda Sky District', town: 'umeda', map: 'umeda', spawn: 'arrive', icon: '🏙️', desc: 'Home of the Elemon League Kansai HQ and the Umeda Food Hall.', services: ['league', 'restaurant'], unlock: 'flag:unlock_umeda', pos: [0.42, 0.18] },
  shinsekai: { name: 'Shinsekai', town: 'shinsekai', map: 'shinsekai', spawn: 'arrive', icon: '🗼', desc: 'Retro streets, the dojo, the arcade, an onsen… and Team Metallica.', services: ['dojo', 'shop', 'cosmetics', 'relax'], unlock: 'flag:unlock_shinsekai', pos: [0.55, 0.8] },
  minoh_waterfall: { name: 'Minoh — Waterfall Trail', town: 'minoh', map: 'minoh_waterfall', spawn: 'entrance', icon: '🌊', desc: 'Safari trail to the famous falls. Kappachi splash in the stream.', services: ['safari'], unlock: 'flag:license', pos: [0.2, 0.12] },
  minoh_bamboo: { name: 'Minoh — Bamboo Trail', town: 'minoh', map: 'minoh_bamboo', spawn: 'entrance', icon: '🎋', desc: 'A whispering bamboo grove. Lantern ghosts appear at night.', services: ['safari'], unlock: 'flag:license', pos: [0.1, 0.24] },
  minoh_maple: { name: 'Minoh — Maple Ridge', town: 'minoh', map: 'minoh_maple', spawn: 'entrance', icon: '🍁', desc: 'Red maples and a lemon grove ruled by the Alpha Lemmo.', services: ['safari'], unlock: 'flag:license', pos: [0.26, 0.3] },
};
// Activities and their time cost (hours)
export const ACTIVITY_HOURS = { travel: 0.5, battle: 0.5, league: 1, safari_trail: 2, dojo: 2, relax: 2, meal: 1, shop: 0.25 };
