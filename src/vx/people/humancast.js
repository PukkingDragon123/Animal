// The Tokonmon cast as realistic low-poly humans (gg/ people). Each entry starts from a Gacha Garage
// preset and overrides it. Trainers wear their partner Tokonmon's colours.
//   anime: 0..1 anime-girl build (longer legs, smaller frame, bigger eyes, springy twin tails / ribbons)
//   face.style: 0..1 stylised eyes (big glossy irises, bold lash line); face.deco: stickers, gems, paint
//   hair.ribbon / hair.ahoge / hair.clip: springy hair accessories
export const CAST = {
  hero: {   // Ren: partner Chilichick (hot-sauce red / orange / flame yellow)
    preset: 'schoolboy', seed: 11, sex: 'm', age: 'teen', H: 1.66, build: 1,
    skin: 0xe2b28c, hair: { style: 'messy', col: 0x2a1e1a, ahoge: 1 },
    face: { style: 0.8, iris: 0x6a3a1e, tilt: 1.1, browW: 1.2, deco: [{ kind: 'bandaid', at: 'cheekR' }] },
    top: { kind: 'jacket', col: 0xe8603a, shirt: 0xf4efe6, zip: true, stripe: 0xffd040 },
    bottom: { kind: 'jeans', col: 0x2e3a5e }, shoes: { kind: 'sneaker', col: 0xf2f0ea, col2: 0xe8603a }, socks: { col: [240, 240, 240] },
    acc: [{ kind: 'backpack', col: 0x2e6a8a }], hat: null, glasses: null, walk: { style: 'young' },
  },
  heroine: {   // the player as a girl: partner colours (hot-sauce red / orange / flame yellow)
    preset: 'schoolgirl', seed: 21, sex: 'f', age: 'teen', H: 1.58, build: 0.94, anime: 1, bust: 0.5,
    skin: 0xf0c8a4, hair: { style: 'ponytail', col: 0x3a221c, volume: 1.15, ribbon: 0xffd040, ahoge: 1 },
    face: { style: 1, iris: 0x8a4a1e, tilt: 0.5, blush: 0.4, makeup: { lash: 0.8 }, deco: [{ kind: 'bandaid', at: 'cheekR' }, { kind: 'hatch' }] },
    top: { kind: 'jacket', col: 0xe8603a, shirt: 0xf4efe6, zip: true, stripe: 0xffd040 }, bottom: { kind: 'shorts', col: 0x2e3a5e },
    legs: 'kneesocks', socks: { col: [244, 240, 234] }, shoes: { kind: 'sneaker', col: 0xf2f0ea, col2: 0xe8603a },
    acc: [{ kind: 'backpack', col: 0x2e6a8a }], hat: null, glasses: null, walk: { style: 'young' },
  },
  yumi: {   // partner Creepetal (periwinkle petals, blond fringe, green stem)
    preset: 'schoolgirl', seed: 4, sex: 'f', age: 'teen', H: 1.56, build: 0.94, anime: 1, bust: 0.5,
    skin: 0xf2cdb0, hair: { style: 'twintails', col: 0xe8d08a, volume: 1.15, ribbon: 0x8a8ad8, ahoge: 1, clip: 0x5aa86a },
    face: { style: 1, iris: 0x5a5ab8, lid: 'double', tilt: 0.3, blush: 0.5, freckles: 0.2, makeup: { lash: 0.8, liner: 0.2, blush: [240, 150, 160] }, deco: [{ kind: 'star', at: 'cheekL', col: 0xffd84a }, { kind: 'hatch' }] },
    top: { kind: 'cardigan', col: 0x8a8ad8, shirt: 0xf4ecd8 }, bottom: { kind: 'skirt', cut: 'pleated', col: 0x3a6a4a, plaid: [244, 236, 216] },
    legs: 'socks', socks: { col: [244, 240, 234], knee: true }, shoes: { kind: 'sneaker', col: 0xf2f0ea, col2: 0x8a8ad8 },
    glasses: { kind: 'round', col: [200, 120, 150], thick: 1 }, acc: [{ kind: 'backpack', col: 0x3a6a4a, charm: 0xe86aa0 }], hat: null, walk: { style: 'young' },
  },
  mika: {   // cool kid, pink + charcoal
    preset: 'gyaru', seed: 2, sex: 'f', age: 'teen', H: 1.6, build: 0.92, anime: 1, bust: 0.5,
    skin: 0xf6e2d4, hair: { style: 'long', col: 0xe8d8a8, volume: 1.1, clip: 0xe84a6a, ears: 'cat' },
    face: { style: 1, iris: 0x8a3a6a, tilt: 1.2, blush: 0.3, makeup: { liner: 0.9, lash: 1, lower: true, shadow: [232, 120, 150], blush: [240, 140, 160] }, lipstick: 0xe0707e, deco: [{ kind: 'gems', at: 'eyeR', col: 0xff8ab0 }, { kind: 'mole', at: 'eyeL' }] },
    top: { kind: 'jacket', col: 0xd8d0c4, shirt: 0xe84a6a }, bottom: { kind: 'skirt', cut: 'mini', col: 0x2e2e3a },
    legs: 'tights', tights: 0x2a2a32, shoes: { kind: 'boots', col: 0x2a2224 }, acc: [{ kind: 'shoulderbag', col: 0xe84a6a, side: 1 }], hat: null, glasses: null, walk: { style: 'dainty' },
  },
  aoi: {   // league official, navy + gold
    preset: 'office_lady', seed: 5, sex: 'f', age: 'adult', H: 1.64, build: 0.95, anime: 0.7, bust: 0.6,
    skin: 0xf2cdb0, hair: { style: 'ponytail', col: 0x2a1e2a, ribbon: 0xe8b43a },
    face: { style: 0.8, iris: 0x4a2a4a, tilt: 0.9, makeup: { liner: 0.6, lash: 0.8, shadow: [170, 130, 160] }, lipstick: 0xc0505a, deco: [{ kind: 'mole', at: 'mouthL' }] },
    top: { kind: 'blazer', col: 0x2e3a5a, shirt: 0xf6f4ee }, bottom: { kind: 'skirt', cut: 'pencil', col: 0x2e3a5a },
    legs: 'tights', tights: 0xc8a088, shoes: { kind: 'pumps', col: 0x1e1a22 }, glasses: { kind: 'rect', col: [40, 34, 40], thick: 1 }, acc: [{ kind: 'tote', col: 0xe8b43a, side: 1 }], hat: null, walk: { style: 'dainty' },
  },
  grandma: {
    preset: 'grandma', seed: 3, H: 1.5, skin: 0xe2b896, hair: { style: 'bun', col: 0xe8e4e0, grey: 1 },
    face: { style: 0.5, deco: [{ kind: 'hatch' }] }, top: { kind: 'cardigan', col: 0x7a3a4a, shirt: 0xf0e8e0, pattern: 'floral' },
    glasses: { kind: 'round', col: [160, 130, 90], thick: 1 }, acc: [{ kind: 'handbag', col: 0xc8a050 }], hat: null,
  },
  coach: {  // Gonda: partner Kanizumo (crab red, sumo gold, turquoise)
    preset: 'construction', seed: 9, sex: 'm', age: 'adult', H: 1.84, build: 1.25, belly: 0.6,
    skin: 0xc48a62, hair: { style: 'buzz', col: 0x2a2422 },
    face: { style: 0.6, stubble: 0.7, browW: 1.5, iris: 0x2a2018, deco: [{ kind: 'scar', at: 'browL' }] },
    top: { kind: 'jacket', col: 0xc8362f, shirt: 0xffd8a6, stripe: 0xffcc2e, zip: true }, bottom: { kind: 'slacks', col: 0xa82a2a, noCrease: true },
    shoes: { kind: 'sneaker', col: 0xf2f0ea, col2: 0x28bcc0 }, hat: { kind: 'headband', col: 0x28bcc0 }, acc: [], glasses: null, walk: { style: 'heavy' },
  },
  kaito: {  // rival: silver hair, black + crimson
    preset: 'schoolboy', seed: 6, sex: 'm', age: 'teen', H: 1.74, build: 0.96,
    skin: 0xe6b890, hair: { style: 'sidepart', col: 0xd8d0c4, part: -1, volume: 1.2 },
    face: { style: 0.9, iris: 0x3a5a8a, tilt: 1.4, browW: 1.1, makeup: { liner: 0.4 }, deco: [{ kind: 'paint', at: 'cheekL', col: 0xa82e3a }] },
    top: { kind: 'jacket', col: 0x1e1e26, shirt: 0xa82e3a }, bottom: { kind: 'slacks', col: 0x2a2a34 },
    shoes: { kind: 'boots', col: 0x1a1a20 }, acc: [], hat: null, glasses: null, walk: { style: 'brisk' },
  },
  spike: {  // punk: partner Dreadrake (green head, chestnut, blue)
    preset: 'tourist', seed: 8, sex: 'm', age: 'teen', H: 1.8, build: 1.02,
    skin: 0xe6b890, hair: { style: 'mohawk', col: 0x1e8a4a },
    face: { style: 0.8, iris: 0xc88a1e, tilt: 1.3, browW: 1.3, deco: [{ kind: 'paint', at: 'eyeL', col: 0x1e1a22 }, { kind: 'bandaid', at: 'nose' }] },
    top: { kind: 'jacket', col: 0x6a3a1e, shirt: 0xf2f0ea }, bottom: { kind: 'jeans', col: 0x2a2a30 },
    shoes: { kind: 'boots', col: 0x141216 }, acc: [], hat: null, glasses: null, walk: { style: 'slouch' },
  },
  riff: { preset: 'tourist', seed: 12, sex: 'm', age: 'adult', H: 1.86, skin: 0xe0b08c, hair: { style: 'mohawk', col: 0xc8303a }, face: { style: 0.7, stubble: 0.4, deco: [{ kind: 'paint', at: 'eyeR', col: 0x1e1a22 }] }, top: { kind: 'jacket', col: 0x4a5a7a, shirt: 0x1e1e24 }, bottom: { kind: 'jeans', col: 0x2a2a30 }, shoes: { kind: 'boots', col: 0x1a1618 }, acc: [], hat: null, glasses: null, walk: { style: 'slouch' } },
  moshi: { preset: 'tourist', seed: 13, sex: 'm', age: 'adult', H: 1.84, build: 1.3, belly: 0.5, skin: 0x8a5a3e, hair: { style: 'perm', col: 0x1e1614, volume: 1.5 }, face: { style: 0.7, stubble: 0.3 }, top: { kind: 'tee', col: 0x3a3a42, print: 'circle', col2: 0xffd040 }, bottom: { kind: 'jeans', col: 0x34303a }, shoes: { kind: 'boots', col: 0x2a2220 }, acc: [], hat: null, glasses: null },
  taro: { preset: 'kid', seed: 14, sex: 'm', age: 'kid', H: 1.24, skin: 0xe8b48c, hair: { style: 'bowl', col: 0x3a2a20 }, face: { style: 1, freckles: 0.7, deco: [{ kind: 'bandaid', at: 'cheekL' }] }, top: { kind: 'tee', col: 0xf0c840, print: 'star', col2: 0x3a6ab0 }, bottom: { kind: 'shorts', col: 0x3a5a8a }, shoes: { kind: 'sneaker', col: 0xe84a3a, col2: 0xf4f0ea }, glasses: { kind: 'round', col: [40, 34, 30], thick: 1.2 }, acc: [{ kind: 'backpack', col: 0x5a9a5a }], hat: null },
  reporter: { preset: 'office_lady', seed: 15, sex: 'f', age: 'adult', H: 1.62, anime: 0.6, hair: { style: 'bob', col: 0x3a2a22 }, face: { style: 0.8, makeup: { liner: 0.5, lash: 0.7 }, lipstick: 0xc8505a }, top: { kind: 'blazer', col: 0x8a3a3a, shirt: 0xf6f4ee }, bottom: { kind: 'skirt', cut: 'pencil', col: 0x3a3238 }, acc: [{ kind: 'shoulderbag', col: 0x2a2622, side: 1 }] },
  chef: { preset: 'shopkeeper', seed: 16, sex: 'm', age: 'adult', H: 1.76, build: 1.25, belly: 0.8, skin: 0xe6b48e, hair: { style: 'buzz', col: 0x2a2422 }, face: { style: 0.6, mustache: true, stubble: 0.3 }, top: { kind: 'shirt', col: 0xf2f0ea, sleeve: 'short' }, bottom: { kind: 'slacks', col: 0x2a2a30 }, hat: { kind: 'headband', col: 0xc83a3a }, acc: [{ kind: 'apron', col: 0xc83a3a }] },
  lau: { preset: 'grandpa', seed: 17, H: 1.6, skin: 0xe2b896, hair: { style: 'bald', col: 0xe8e4e0, grey: 1 }, face: { style: 0.5, mustache: true, stubble: 0.8 }, top: { kind: 'jacket', col: 0x5a6a5a, shirt: 0xe8e4dc }, glasses: { kind: 'round', col: [40, 34, 30], thick: 1 }, acc: [{ kind: 'cane', col: 0x5a3a22 }], hat: null },
  driver: { preset: 'delivery', seed: 18, sex: 'm', age: 'adult', H: 1.82, build: 1.2, skin: 0xc48a62, hair: { style: 'buzz', col: 0x2a2422 }, face: { style: 0.6, stubble: 0.6, iris: 0xc89a1e }, top: { kind: 'jacket', col: 0x2a2a32, shirt: 0xb82a2a, stripe: 0xe8b43a }, bottom: { kind: 'slacks', col: 0x2a2a32 }, hat: { kind: 'cap', col: 0xb82a2a, col2: 0xe8b43a }, acc: [] },
  chess: { preset: 'grandpa', seed: 19, H: 1.62, skin: 0xd6a882, hair: { style: 'bald', col: 0xd8d4d0, grey: 1 }, face: { style: 0.5, mustache: true, stubble: 0.6 }, top: { kind: 'polo', col: 0xe8e2d4, vest: 0x6a5a4a, sleeve: 'long' }, glasses: { kind: 'rect', col: [150, 120, 70], thick: 1 }, hat: { kind: 'flatcap', col: 0x6a5a48 }, acc: [] },
  mom: { preset: 'mom', seed: 20, sex: 'f', age: 'adult', H: 1.6, anime: 0.5, hair: { style: 'ponytail', col: 0x4a3226, ribbon: 0xe8603a }, face: { style: 0.8, makeup: { lash: 0.6, blush: [236, 150, 140] } }, top: { kind: 'knit', col: 0xe8d8c0, sleeve: 'long' }, bottom: { kind: 'skirt', cut: 'long', col: 0x6a5a4a } },
};
