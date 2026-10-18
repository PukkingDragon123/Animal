// Gear: buyable stat items a Tokonmon equips (one slot; a second opens at Lv.40 — src/game/elemon.js gearSlots).
// stats: fractional boosts to the five core stats, applied in statsOf (battle snapshot);
// mods: small passive-style modifiers applied by the battle sim (src/battle/sim.js makeUnit).
// Registered as bag items (kind 'gear') in src/data/items.js. Cosmetic drip accessories are NOT gear and can't be bought.
export const GEAR = {
  guitar_pick: { name: 'Tortoiseshell Pick', icon: '🎸', price: 900, stats: { dmg: 0.06 }, desc: '+6% Damage. A lucky pick, worn smooth.' },
  heavy_pick: { name: 'Heavy-Gauge Pick', icon: '🎸', price: 1800, stats: { dmg: 0.1, spd: -0.04 }, desc: '+10% Damage, −4% Speed. Thick and stubborn.' },
  tube_amp: { name: 'Pocket Tube Amp', icon: '📻', price: 900, stats: { elm: 0.06 }, desc: '+6% Element. Warm, glowing valves.' },
  fuzz_pedal: { name: 'Fuzz Pedal', icon: '🎛️', price: 1800, stats: { elm: 0.1, def: -0.04 }, desc: '+10% Element, −4% Defense. Everything sounds bigger.' },
  mic_stand: { name: 'Steel Mic Stand', icon: '🎤', price: 900, stats: { def: 0.06 }, desc: '+6% Defense. Lean on it.' },
  road_case: { name: 'Road Case', icon: '🧳', price: 1800, stats: { def: 0.1, spd: -0.04 }, desc: '+10% Defense, −4% Speed. Built for touring.' },
  drumsticks: { name: 'Hickory Drumsticks', icon: '🥁', price: 900, stats: { spd: 0.06 }, desc: '+6% Speed. Keep time.' },
  stage_sneakers: { name: 'Stage Sneakers', icon: '👟', price: 1800, stats: { spd: 0.1, hp: -0.04 }, desc: '+10% Speed, −4% Health. Built for stage dives.' },
  leather_jacket: { name: 'Studded Leather Jacket', icon: '🧥', price: 1200, stats: { hp: 0.08 }, desc: '+8% Health. Tough as a tour bus.' },
  setlist: { name: 'Taped Setlist', icon: '📝', price: 1500, mods: { costMul: 0.92 }, desc: 'Skills cost 8% less energy. Knows what comes next.' },
  capo: { name: 'Silver Capo', icon: '🔧', price: 1500, mods: { cdMul: 0.94 }, desc: 'Cooldowns 6% shorter. Changes key in a flash.' },
  whammy_bar: { name: 'Whammy Bar', icon: '〰️', price: 1600, mods: { critChance: 0.05 }, desc: '+5% critical-hit chance.' },
  aviator_shades: { name: 'Aviator Shades', icon: '🕶️', price: 1300, mods: { immune: ['blind'] }, desc: 'Immune to blindness. Too cool for flashes.' },
  earplugs: { name: 'Stage Earplugs', icon: '🎧', price: 1300, mods: { immune: ['confuse'] }, desc: 'Immune to confusion. Can\'t hear the heckling.' },
  egg: { name: 'Egg', icon: '🥚', price: 800, stats: { hp: 0.05 }, desc: '+5% Health. I am the eggman… a Pepperhorn holding it evolves differently.' },
};
export const GEAR_IDS = Object.keys(GEAR);
export const gearOf = (id) => GEAR[id] || null;
