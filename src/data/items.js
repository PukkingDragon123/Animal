// Items: food (heal/boosts/friendship), capture gems for the keychain device,
// mixtapes (teach skills), key items. Prices in ¥.
export const ITEMS = {
  // food — battle usable ones map to sim ITEMS_BATTLE ids
  takoyaki: { name: 'Takoyaki ×6', icon: '🐙', kind: 'food', battle: true, price: 400, desc: 'Restores 30% HP. Osaka soul food.', heal: 0.3, friend: 2 },
  okonomiyaki: { name: 'Okonomiyaki', icon: '🥞', kind: 'food', battle: true, price: 900, desc: 'Restores 60% HP.', heal: 0.6, friend: 3 },
  ramune: { name: 'Ramune Soda', icon: '🥤', kind: 'food', battle: true, price: 250, desc: 'Restores 60 energy in battle.', friend: 1 },
  matcha: { name: 'Matcha Latte', icon: '🍵', kind: 'food', battle: true, price: 500, desc: 'Charges the ultimate gauge by 35%.', friend: 1 },
  revive_onigiri: { name: 'Revive Onigiri', icon: '🍙', kind: 'food', battle: true, price: 1200, desc: 'Revives a fainted Elemon with 40% HP.', friend: 2 },
  kushikatsu: { name: 'Kushikatsu', icon: '🍢', kind: 'food', price: 600, desc: 'Deep-fried skewers. No double-dipping!', heal: 0.4, friend: 3 },
  ramen: { name: 'Tonkotsu Ramen', icon: '🍜', kind: 'food', price: 800, desc: 'Rich and filling.', heal: 0.5, friend: 3 },
  ice_cream: { name: 'Soft-Serve', icon: '🍦', kind: 'food', price: 350, desc: 'Yellow Submarine special.', heal: 0.2, friend: 4 },
  lemon_tart: { name: 'Lemon Tart', icon: '🍋', kind: 'food', price: 450, desc: 'Sour and sweet.', heal: 0.25, friend: 2 },
  protein_mochi: { name: 'Protein Mochi', icon: '🍡', kind: 'boost', price: 3000, desc: '+1 stat point for one Elemon.', sp: 1 },
  star_candy: { name: 'Konpeito Star Candy', icon: '🍬', kind: 'boost', price: 5000, desc: '+1 Astral point for one Elemon.', ap: 1 },
  // capture gems (keychain device fuel)
  quartz: { name: 'Quartz Gem', icon: '💎', kind: 'gem', price: 300, desc: 'Standard capture gem.', mul: 1.0 },
  amethyst: { name: 'Amethyst Gem', icon: '🔮', kind: 'gem', price: 800, desc: 'A stronger capture gem.', mul: 1.4 },
  ruby: { name: 'Ruby Gem', icon: '♦️', kind: 'gem', price: 900, desc: 'Great against Pyro and Volto Elemon.', mul: 1.2, vs: { pyro: 2, volto: 2 } },
  sapphire: { name: 'Sapphire Gem', icon: '🔷', kind: 'gem', price: 900, desc: 'Great against Hydro and Cryo Elemon.', mul: 1.2, vs: { hydro: 2, cryo: 2 } },
  emerald: { name: 'Emerald Gem', icon: '🟩', kind: 'gem', price: 900, desc: 'Great against Bio and Aero Elemon.', mul: 1.2, vs: { bio: 2, aero: 2 } },
  topaz: { name: 'Topaz Gem', icon: '🟨', kind: 'gem', price: 900, desc: 'Great against Geo and Ferro Elemon.', mul: 1.2, vs: { geo: 2, ferro: 2 } },
  opal: { name: 'Opal Gem', icon: '🌈', kind: 'gem', price: 900, desc: 'Great against Echo and Ecto Elemon.', mul: 1.2, vs: { echo: 2, ecto: 2 } },
  diamond: { name: 'Diamond Gem', icon: '💠', kind: 'gem', price: 4000, desc: 'The best capture gem money can buy.', mul: 2.2 },
  star_gem: { name: 'Star Gem', icon: '🌟', kind: 'gem', price: 0, desc: 'Forged from star fragments. Resonates with legends.', mul: 4, legend: true },
  // mixtapes teach a skill
  mixtape_heat_wave: { name: 'Mixtape: Heat Wave', icon: '📼', kind: 'mixtape', skill: 'heat_wave', price: 2500, desc: 'Teaches Heat Wave to a Pyro Elemon.' },
  mixtape_ricochet: { name: 'Mixtape: Ricochet', icon: '📼', kind: 'mixtape', skill: 'ricochet', price: 2500, desc: 'Teaches Ricochet Shot to a Hydro Elemon.' },
  mixtape_sleep_pollen: { name: 'Mixtape: Sleep Pollen', icon: '📼', kind: 'mixtape', skill: 'sleep_pollen', price: 2500, desc: 'Teaches Sleep Pollen to a Bio Elemon.' },
  mixtape_stone_wall: { name: 'Mixtape: Stone Wall', icon: '📼', kind: 'mixtape', skill: 'stone_wall', price: 2500, desc: 'Teaches Stone Wall to a Geo Elemon.' },
  mixtape_bass_drop: { name: 'Mixtape: Bass Drop', icon: '📼', kind: 'mixtape', skill: 'bass_drop', price: 2500, desc: 'Teaches Bass Drop to an Echo Elemon.' },
  // key items
  soul_link: { name: 'Soul Link Bracelet', icon: '⌚', kind: 'key', desc: 'Links your soul stone with your partner Elemon.' },
  keychain: { name: 'Keychain Capture Device', icon: '🔑', kind: 'key', desc: 'Licensed capture device. Powered by gems.' },
  tamer_license: { name: 'Tamer License (Rookie)', icon: '🪪', kind: 'key', desc: 'Lets you catch Elemon legally in reserves.' },
  star_fragment: { name: 'Star Fragment', icon: '✨', kind: 'key', desc: 'A glowing shard of fallen starlight. Dr. Hoshino wants these.' },
  dojo_pass: { name: 'Dojo Pass', icon: '🎫', kind: 'key', desc: 'Lets you leave Elemon to train at the Shinsekai dojo.' },
};
export const itemOf = (id) => ITEMS[id];
export const GEM_IDS = Object.keys(ITEMS).filter((k) => ITEMS[k].kind === 'gem');
export function gemMultiplier(gemId, elems) {
  const g = ITEMS[gemId]; if (!g) return 1;
  let m = g.mul || 1;
  if (g.vs) for (const e of elems) if (g.vs[e]) m = Math.max(m, g.mul * g.vs[e]);
  return m;
}
