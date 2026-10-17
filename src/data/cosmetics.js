// Cosmetics for the bracelet, soul stone and the player (watches, earrings,
// badges, hair clips, grillz) + special eyeballs for Ecto Elemon.
export const COSMETICS = {
  // soul stone colours/shapes (stone slot)
  stone_cyan: { slot: 'stone', name: 'Aqua Soul Stone', value: { color: '#38f0ff', shape: 'round' }, price: 0 },
  stone_heart: { slot: 'stone', name: 'Heartbeat Stone', value: { color: '#ff4f8a', shape: 'heart' }, price: 3000 },
  stone_star: { slot: 'stone', name: 'Rockstar Stone', value: { color: '#ffd23a', shape: 'star' }, price: 3500 },
  stone_diamond: { slot: 'stone', name: 'Diamond Cut Stone', value: { color: '#c8f4ff', shape: 'diamond' }, price: 5000 },
  stone_skull: { slot: 'stone', name: 'Metal Skull Stone', value: { color: '#b46bff', shape: 'skull' }, price: 4200, req: 'flag:beat_metallica_1' },
  stone_ember: { slot: 'stone', name: 'Ember Stone', value: { color: '#ff7a2b', shape: 'round' }, price: 2000 },
  // wearables
  watch_digital: { slot: 'watch', name: 'Digital Watch', value: 'digital', price: 1500 },
  watch_gold: { slot: 'watch', name: 'Gold Watch', value: 'gold', price: 9000 },
  watch_smart: { slot: 'watch', name: 'Smartwatch 2050', value: 'smart', price: 6000 },
  earrings_studs: { slot: 'earrings', name: 'Stud Earrings', value: 'studs', price: 1200 },
  earrings_hoops: { slot: 'earrings', name: 'Hoop Earrings', value: 'hoops', price: 2400 },
  earrings_bolt: { slot: 'earrings', name: 'Lightning Earrings', value: 'lightning', price: 3200 },
  clip_star: { slot: 'hairclip', name: 'Star Hair Clip', value: 'star', price: 800 },
  clip_heart: { slot: 'hairclip', name: 'Heart Hair Clip', value: 'heart', price: 800 },
  clip_bolt: { slot: 'hairclip', name: 'Bolt Hair Clip', value: 'bolt', price: 900 },
  clip_flower: { slot: 'hairclip', name: 'Sakura Hair Clip', value: 'flower', price: 900 },
  grillz_silver: { slot: 'grillz', name: 'Silver Grillz', value: 'silver', price: 6000 },
  grillz_gold: { slot: 'grillz', name: 'Gold Grillz', value: 'gold', price: 12000 },
  grillz_diamond: { slot: 'grillz', name: 'Diamond Grillz', value: 'diamond', price: 25000 },
  badge_rookie: { slot: 'badge', name: 'Rookie League Pin', value: '#5ae0ff', price: 0, req: 'flag:license' },
  badge_beatles: { slot: 'badge', name: 'Fab Four Pin', value: '#ffd23a', price: 1500 },
  badge_metal: { slot: 'badge', name: 'Heavy Metal Pin', value: '#b46bff', price: 1500 },
  // Ecto eyeballs (applies to Ecto Elemon with an eye slot)
  eye_googly: { slot: 'ectoEye', name: 'Googly Eye', value: { iris: '#111111', style: 'round' }, price: 1000 },
  eye_star: { slot: 'ectoEye', name: 'Starry Eye', value: { iris: '#ffd23a', style: 'star' }, price: 2200 },
  eye_heart: { slot: 'ectoEye', name: 'Heart Eye', value: { iris: '#ff4f8a', style: 'big' }, price: 2200 },
  eye_galaxy: { slot: 'ectoEye', name: 'Galaxy Eye', value: { iris: '#8a5aff', style: 'big' }, price: 4000 },
  eye_cat: { slot: 'ectoEye', name: 'Cat Eye', value: { iris: '#a0ff6a', style: 'sharp' }, price: 1800 },
};
export const COSMETIC_SLOTS = ['stone', 'watch', 'earrings', 'hairclip', 'grillz', 'badge'];
export const SLOT_NAMES = { stone: 'Soul Stone', watch: 'Watch', earrings: 'Earrings', hairclip: 'Hair Clip', grillz: 'Grillz', badge: 'Badge', ectoEye: 'Ecto Eyeball' };
// equipped: { slot: cosmeticId } → look.cosmetics object for humanDesign
export function cosmeticsToLook(equipped) {
  const out = {};
  for (const [slot, id] of Object.entries(equipped || {})) {
    const c = COSMETICS[id];
    if (!c || slot === 'ectoEye') continue;
    out[slot] = c.value;
  }
  if (!out.stone) out.stone = COSMETICS.stone_cyan.value;
  return out;
}
