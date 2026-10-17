// Passives any Tokonmon can earn: stat-chart marks (src/data/progress.js
// STAT_MARKS), bonding/switching passives, and passives from activities.
// Conditional passives use `when` (see sim.js whenOk): bonded, unbonded,
// bondT, switchedIn, lowHp, highHp, arena, wet, burning, form.

export const COMMON_PASSIVES = [
  // ---- switching & bonding (the owner's examples: "when you switch out and come back, you get an extra punch")
  { id: 'comeback_punch', kind: 'passive', name: 'Comeback Punch', elem: 'neutral', desc: 'Switch out and come back: the first hit after returning deals +60% and sends the foe flying.', mods: { comeback: 0.6 } },
  { id: 'fresh_legs', kind: 'passive', name: 'Fresh Legs', elem: 'neutral', desc: '+25% speed for 5 s after switching in.', when: { switchedIn: 5 }, mods: { spdMul: 1.25 } },
  { id: 'soul_sync', kind: 'passive', name: 'Soul Sync', elem: 'neutral', desc: 'While bonded, the ultimate charges 25% faster.', when: { bonded: true }, mods: { ultGain: 1.25 } },
  { id: 'long_link', kind: 'passive', name: 'Long Link', elem: 'neutral', desc: 'After 20 s bonded: +15% damage and −15% damage taken.', when: { bondT: 20 }, mods: { dmgMul: 1.15, takenMul: 0.85 } },
  { id: 'free_spirit', kind: 'passive', name: 'Free Spirit', elem: 'neutral', desc: 'While NOT bonded it fights its own way: +10% damage, +10% speed.', when: { unbonded: true }, mods: { dmgMul: 1.1, spdMul: 1.1 } },
  { id: 'show_off', kind: 'passive', name: 'Show-Off', elem: 'neutral', desc: 'Emotes recharge faster and dancing on the beat heals more (+10% damage while bonded).', when: { bonded: true }, mods: { dmgMul: 1.1 } },
  // ---- stat-chart marks (Damage)
  { id: 'power_up', kind: 'passive', name: 'Power Up', elem: 'neutral', stat: 'dmg', desc: '+8% physical damage.', mods: { physMul: 1.08 } },
  { id: 'heavy_hitter', kind: 'passive', name: 'Heavy Hitter', elem: 'neutral', stat: 'dmg', desc: 'Critical hits deal +30% more damage.', mods: { critDmg: 0.3 } },
  { id: 'last_stand', kind: 'passive', name: 'Last Stand', elem: 'neutral', stat: 'dmg', desc: 'Below 40% HP: +30% damage.', mods: { lowHpDmg: 0.3 } },
  // ---- Element
  { id: 'attuned', kind: 'passive', name: 'Attuned', elem: 'neutral', stat: 'elm', desc: '+8% elemental damage.', mods: { elmMul: 1.08 } },
  { id: 'deep_energy', kind: 'passive', name: 'Deep Energy', elem: 'neutral', stat: 'elm', desc: 'Skills cost 15% less energy.', mods: { costMul: 0.85 } },
  { id: 'overflow', kind: 'passive', name: 'Overflow', elem: 'neutral', stat: 'elm', desc: 'Skill cooldowns are 15% shorter.', mods: { cdMul: 0.85 } },
  // ---- Defense
  { id: 'sturdy', kind: 'passive', name: 'Sturdy', elem: 'neutral', stat: 'def', desc: '+10% defense.', mods: { defMul: 1.1 } },
  { id: 'thick_skin', kind: 'passive', name: 'Thick Skin', elem: 'neutral', stat: 'def', desc: 'Takes 10% less damage.', mods: { takenMul: 0.9 } },
  { id: 'iron_wall', kind: 'passive', name: 'Iron Wall', elem: 'neutral', stat: 'def', desc: 'Shields are 30% stronger; immune to knockback.', mods: { shieldMul: 1.3, knockImmune: true } },
  // ---- Speed
  { id: 'light_feet', kind: 'passive', name: 'Light Feet', elem: 'neutral', stat: 'spd', desc: '+8% movement speed.', mods: { spdMul: 1.08 } },
  { id: 'sharp_eye', kind: 'passive', name: 'Sharp Eye', elem: 'neutral', stat: 'spd', desc: '+6% critical-hit chance.', mods: { critChance: 0.06 } },
  { id: 'afterimage', kind: 'passive', name: 'Afterimage', elem: 'neutral', stat: 'spd', desc: 'Dodge recharges 30% faster.', mods: { dodgeCd: 0.7 } },
  // ---- Health
  { id: 'hearty', kind: 'passive', name: 'Hearty', elem: 'neutral', stat: 'hp', desc: 'Regenerates 0.5% HP per second.', mods: { regen: 0.005 } },
  { id: 'second_wind', kind: 'passive', name: 'Second Wind', elem: 'neutral', stat: 'hp', desc: 'Below 30% HP: +30% defense.', when: { lowHp: 0.3 }, mods: { defMul: 1.3 } },
  { id: 'big_heart', kind: 'passive', name: 'Big Heart', elem: 'neutral', stat: 'hp', desc: 'Heals received are 25% stronger.', mods: { healMul: 1.25 } },
  // ---- activities
  { id: 'onsen_glow', kind: 'passive', name: 'Onsen Glow', elem: 'neutral', desc: 'Relaxed from the hot spring: immune to drowsiness and sleep.', mods: { immune: ['sleep', 'drowsy'] } },
  { id: 'rhythm_gamer', kind: 'passive', name: 'Rhythm Gamer', elem: 'echo', desc: 'Arcade-trained timing: wider beat window, on-beat hits +35%.', mods: { beatWindow: 0.15, beatMul: 1.35 } },
  { id: 'dojo_discipline', kind: 'passive', name: 'Dojo Discipline', elem: 'neutral', desc: 'Staggers 40% shorter; parry recharges faster.', mods: { stagger: 0.6 } },
  { id: 'crowd_pleaser', kind: 'passive', name: 'Crowd Pleaser', elem: 'echo', desc: 'In the stadium spotlight: team-combo meter fills 30% faster.', mods: { teamGain: 1.3 } },
];
