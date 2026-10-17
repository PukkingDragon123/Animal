// Dishes you can order at counters (first-person ordering zoom-in scene) and
// eat at tables with your Tokonmon (eating zoom-in). Eating feeds the progress
// system (src/data/progress.js): taste tags count toward skill/passive unlocks,
// e.g. lots of 'spicy' food teaches Chilichick fire breathing, and the
// Super Spicy Curry grants Heat Tolerance.
//
//   tags:  spicy sweet sour salty umami savory fried cold hot seafood veggie fruit meat dairy fizzy
//   heat:  0–5 chili level (5 = tears guaranteed)
//   heal:  fraction of HP restored for the party · friend: friendship for the Tokonmon who ate
//   stat:  { stat, n } permanent stat points for the Tokonmon who ate (rare dishes only)
export const FOODS = {
  // ---- Yellow Submarine (ice-cream parlour, Dotonbori)
  yellow_sub_float: { name: 'Yellow Submarine Float', icon: '🍦', price: 450, tags: ['sweet', 'cold', 'fizzy', 'dairy'], heat: 0, heal: 0.2, friend: 4, desc: 'Lemon soda, vanilla soft-serve and a candy periscope.' },
  octopus_garden_sundae: { name: "Octopus's Garden Sundae", icon: '🍨', price: 520, tags: ['sweet', 'cold', 'dairy', 'fruit'], heat: 0, heal: 0.25, friend: 5, desc: 'Sea-salt caramel, blue-jelly waves and a gummy octopus.' },
  chili_mango_swirl: { name: 'Chili-Mango Swirl', icon: '🌶️', price: 480, tags: ['sweet', 'cold', 'spicy', 'fruit'], heat: 2, heal: 0.2, friend: 4, desc: 'Sweet mango soft-serve dusted with chili salt.' },
  matcha_strawberry_fields: { name: 'Strawberry Fields Matcha', icon: '🍓', price: 520, tags: ['sweet', 'cold', 'fruit', 'dairy'], heat: 0, heal: 0.25, friend: 5, desc: 'Uji matcha cone with fresh strawberries forever.' },
  // ---- Abbey Road (okonomiyaki teppan, Dotonbori)
  abbey_road_okonomiyaki: { name: 'Abbey Road Okonomiyaki', icon: '🥞', price: 900, tags: ['savory', 'hot', 'umami'], heat: 0, heal: 0.6, friend: 4, desc: 'The house special. Four toppings walking in a line.' },
  come_together_modan: { name: 'Come Together Modan-yaki', icon: '🍳', price: 1000, tags: ['savory', 'hot', 'umami', 'meat'], heat: 0, heal: 0.6, friend: 5, desc: 'Okonomiyaki and yakisoba, finally together.' },
  something_yakisoba: { name: 'Something Yakisoba', icon: '🍝', price: 700, tags: ['savory', 'hot', 'salty'], heat: 1, heal: 0.45, friend: 3, desc: 'Sweet-sour sauce and red ginger. Something in the way it sizzles.' },
  here_comes_the_sunny_egg: { name: 'Here Comes the Sunny Egg', icon: '🍳', price: 400, tags: ['savory', 'hot'], heat: 0, heal: 0.25, friend: 3, desc: 'A perfect fried egg on top of anything.' },
  // ---- Dotonbori street stalls
  takoyaki: { name: 'Takoyaki ×6', icon: '🐙', price: 400, tags: ['savory', 'hot', 'seafood', 'fried'], heat: 0, heal: 0.3, friend: 2, desc: 'Osaka soul food. Hotter inside than you think.' },
  kushikatsu: { name: 'Kushikatsu', icon: '🍢', price: 600, tags: ['fried', 'savory', 'hot', 'meat'], heat: 0, heal: 0.4, friend: 3, desc: 'Deep-fried skewers. No double-dipping!' },
  red_hot_ramen: { name: 'Red Hot Chili Ramen', icon: '🍜', price: 950, tags: ['spicy', 'hot', 'umami', 'meat'], heat: 4, heal: 0.5, friend: 4, desc: 'Chili oil the colour of a stage light.' },
  // ---- Umeda Food Hall
  super_spicy_curry: { name: 'Super Spicy Curry', icon: '🍛', price: 1200, tags: ['spicy', 'hot', 'savory', 'meat'], heat: 5, heal: 0.55, friend: 6, desc: 'Level 50 heat. The menu says "We are not responsible."' },
  mild_curry: { name: 'Mild Mixed Curry', icon: '🍛', price: 800, tags: ['savory', 'hot', 'sweet'], heat: 1, heal: 0.5, friend: 3, desc: 'Curry mixed into the rice, raw egg on top.' },
  ramen: { name: 'Tonkotsu Ramen', icon: '🍜', price: 800, tags: ['umami', 'hot', 'salty', 'meat'], heat: 0, heal: 0.5, friend: 3, desc: 'Rich and filling.' },
  mapo_tofu: { name: 'Mapo Tofu Bowl', icon: '🌶️', price: 900, tags: ['spicy', 'hot', 'savory'], heat: 3, heal: 0.45, friend: 3, desc: 'Numbing sansho and chili. Tingles all the way down.' },
  fruit_sando: { name: 'Fruit Sando', icon: '🥪', price: 600, tags: ['sweet', 'fruit', 'dairy', 'cold'], heat: 0, heal: 0.3, friend: 4, desc: 'Strawberries and cream between fluffy bread.' },
  seaweed_salad: { name: 'Seaweed Salad', icon: '🥗', price: 500, tags: ['veggie', 'salty', 'cold', 'seafood'], heat: 0, heal: 0.25, friend: 2, desc: 'Crunchy wakame with sesame.' },
  lemon_tart: { name: 'Lemon Tart', icon: '🍋', price: 450, tags: ['sour', 'sweet', 'fruit'], heat: 0, heal: 0.25, friend: 2, desc: 'Sour and sweet.' },
  // ---- Shinsekai
  doteyaki: { name: 'Doteyaki', icon: '🍢', price: 500, tags: ['savory', 'hot', 'meat', 'sweet'], heat: 0, heal: 0.35, friend: 3, desc: 'Beef tendon stewed in miso. A Shinsekai classic.' },
  ghost_pepper_kushikatsu: { name: 'Ghost Pepper Kushikatsu', icon: '🔥', price: 800, tags: ['spicy', 'fried', 'hot'], heat: 5, heal: 0.35, friend: 4, desc: 'The batter glows faintly. Nobody knows why.' },
  onsen_tamago: { name: 'Onsen Tamago', icon: '🥚', price: 300, tags: ['savory', 'hot'], heat: 0, heal: 0.2, friend: 3, desc: 'Slow-cooked in the hot spring.' },
  ramune: { name: 'Ramune Soda', icon: '🥤', price: 250, tags: ['sweet', 'fizzy', 'cold'], heat: 0, heal: 0.1, friend: 1, desc: 'Pop the marble.' },
  // ---- Minoh
  momiji_tempura: { name: 'Momiji Tempura', icon: '🍁', price: 400, tags: ['fried', 'sweet', 'veggie'], heat: 0, heal: 0.25, friend: 4, desc: 'Maple leaves fried in sweet batter. Only in Minoh.' },
  yuzu_cider: { name: 'Yuzu Cider', icon: '🍋', price: 350, tags: ['sour', 'fizzy', 'cold', 'fruit'], heat: 0, heal: 0.15, friend: 2, desc: 'Minoh craft cider.' },
};

// Where each dish is sold (restaurant / counter id → menu).
export const MENUS = {
  yellow_submarine: ['yellow_sub_float', 'octopus_garden_sundae', 'chili_mango_swirl', 'matcha_strawberry_fields'],
  abbey_road: ['abbey_road_okonomiyaki', 'come_together_modan', 'something_yakisoba', 'here_comes_the_sunny_egg'],
  dotonbori_stalls: ['takoyaki', 'kushikatsu', 'red_hot_ramen'],
  food_hall: ['super_spicy_curry', 'mild_curry', 'ramen', 'mapo_tofu', 'fruit_sando', 'seaweed_salad', 'lemon_tart'],
  shinsekai_stalls: ['doteyaki', 'ghost_pepper_kushikatsu', 'kushikatsu', 'ramune'],
  onsen: ['onsen_tamago', 'ramune'],
  minoh: ['momiji_tempura', 'yuzu_cider'],
};

export const foodOf = (id) => FOODS[id] || null;
export const isSpicy = (id) => !!(FOODS[id] && FOODS[id].tags.includes('spicy'));
