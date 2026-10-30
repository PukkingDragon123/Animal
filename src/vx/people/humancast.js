// The Tokonmon cast as Gacha Garage's realistic low-poly humans: each entry starts from one of its street
// presets and overrides colours, hair and clothes (only the kinds the original painter supports). Trainers
// wear their partner Tokonmon's colours.
export const CAST = {
  hero: {   // Ren: partner Chilichick (hot-sauce red / orange / flame yellow)
    preset: 'schoolboy', seed: 11, sex: 'm', age: 'teen', H: 1.68, build: 1,
    skin: 0xe2b28c, hair: { style: 'messy', col: 0x2a1e1a }, face: { iris: 0x6a3a1e },
    top: { kind: 'jacket', col: 0xe8603a, shirt: 0xf4efe6 }, bottom: { kind: 'jeans', col: 0x2e3a5e },
    shoes: { kind: 'sneaker', col: 0xf2f0ea, col2: 0xe8603a }, socks: { col: [240, 240, 240] },
    acc: [{ kind: 'backpack', col: 0x2e6a8a }], hat: null, glasses: null, walk: { style: 'brisk' },
  },
  heroine: {   // the player as a girl: same partner colours
    preset: 'schoolgirl', seed: 21, sex: 'f', age: 'teen', H: 1.6, build: 0.95,
    skin: 0xf0c8a4, hair: { style: 'ponytail', col: 0x3a221c }, face: { iris: 0x8a4a1e },
    top: { kind: 'jacket', col: 0xe8603a, shirt: 0xf4efe6 }, bottom: { kind: 'shorts', col: 0x2e3a5e },
    legs: 'kneesocks', socks: { col: [244, 240, 234] }, shoes: { kind: 'sneaker', col: 0xf2f0ea, col2: 0xe8603a },
    acc: [{ kind: 'backpack', col: 0x2e6a8a }], hat: null, glasses: null,
  },
  yumi: {   // partner Creepetal (periwinkle petals, blond fringe, green stem)
    preset: 'schoolgirl', seed: 4, sex: 'f', age: 'teen', H: 1.57,
    skin: 0xf2cdb0, hair: { style: 'twintails', col: 0xd8b878 }, face: { iris: 0x5a5ab8 },
    top: { kind: 'cardigan', col: 0x8a8ad8, shirt: 0xf4ecd8 }, bottom: { kind: 'skirt', col: 0x3a6a4a },
    legs: 'kneesocks', socks: { col: [244, 240, 234] }, shoes: { kind: 'sneaker', col: 0xf2f0ea, col2: 0x8a8ad8 },
    glasses: { kind: 'round', col: [200, 120, 150], thick: 1 }, acc: [{ kind: 'backpack', col: 0x3a6a4a }], hat: null,
  },
  mika: {   // cool kid, cream + pink + charcoal
    preset: 'gyaru', seed: 2, sex: 'f', age: 'teen', H: 1.61,
    skin: 0xf6e2d4, hair: { style: 'long', col: 0xd8c890 }, face: { iris: 0x6a7480 },
    top: { kind: 'jacket', col: 0xd8d0c4, shirt: 0xe84a6a }, bottom: { kind: 'skirt', col: 0x2e2e3a },
    legs: 'tights', tights: 0x2a2a32, shoes: { kind: 'boots', col: 0x2a2224 }, acc: [{ kind: 'shoulderbag', col: 0xe84a6a, side: 1 }], hat: null, glasses: null,
  },
  aoi: {   // league official, navy + gold
    preset: 'office_lady', seed: 5, sex: 'f', age: 'adult', H: 1.65,
    skin: 0xf2cdb0, hair: { style: 'ponytail', col: 0x2a1e2a }, face: { iris: 0x4a2a4a },
    top: { kind: 'blazer', col: 0x2e3a5a, shirt: 0xf6f4ee }, bottom: { kind: 'skirt', col: 0x2e3a5a },
    legs: 'tights', tights: 0xc8a088, shoes: { kind: 'pumps', col: 0x1e1a22 }, glasses: { kind: 'rect', col: [40, 34, 40], thick: 1 }, acc: [{ kind: 'tote', col: 0xe8b43a, side: 1 }], hat: null,
  },
  grandma: { preset: 'grandma', seed: 3, H: 1.5 },
  coach: {  // Gonda: partner Kanizumo (crab red, sumo gold, turquoise)
    preset: 'construction', seed: 9, sex: 'm', age: 'adult', H: 1.84, build: 1.25, belly: 0.6,
    skin: 0xc48a62, hair: { style: 'buzz', col: 0x2a2422 }, face: { iris: 0x2a2018, stubble: 0.6 },
    top: { kind: 'jacket', col: 0xc8362f, shirt: 0xffd8a6 }, bottom: { kind: 'slacks', col: 0xa82a2a },
    shoes: { kind: 'sneaker', col: 0xf2f0ea, col2: 0x28bcc0 }, hat: { kind: 'headband', col: 0x28bcc0 }, acc: [], glasses: null, walk: { style: 'heavy' },
  },
  kaito: {  // rival: silver hair, black + crimson
    preset: 'schoolboy', seed: 6, sex: 'm', age: 'teen', H: 1.75, build: 0.96,
    skin: 0xe6b890, hair: { style: 'sidepart', col: 0xc4c0ba, part: -1 }, face: { iris: 0x3a5a8a },
    top: { kind: 'jacket', col: 0x1e1e26, shirt: 0xa82e3a }, bottom: { kind: 'slacks', col: 0x2a2a34 },
    shoes: { kind: 'boots', col: 0x1a1a20 }, acc: [], hat: null, glasses: null, walk: { style: 'brisk' },
  },
  spike: {  // punk: partner Dreadrake (green head, chestnut, blue)
    preset: 'tourist', seed: 8, sex: 'm', age: 'teen', H: 1.8,
    skin: 0xe6b890, hair: { style: 'messy', col: 0x1e8a4a }, face: { iris: 0xc88a1e },
    top: { kind: 'jacket', col: 0x6a3a1e, shirt: 0xf2f0ea }, bottom: { kind: 'jeans', col: 0x2a2a30 },
    shoes: { kind: 'boots', col: 0x141216 }, acc: [], hat: null, glasses: null,
  },
  riff: { preset: 'tourist', seed: 12, sex: 'm', age: 'adult', H: 1.86, skin: 0xe0b08c, hair: { style: 'messy', col: 0xc8303a }, top: { kind: 'jacket', col: 0x4a5a7a, shirt: 0x1e1e24 }, bottom: { kind: 'jeans', col: 0x2a2a30 }, shoes: { kind: 'boots', col: 0x1a1618 }, acc: [], hat: null, glasses: null },
  moshi: { preset: 'tourist', seed: 13, sex: 'm', age: 'adult', H: 1.84, build: 1.3, belly: 0.5, skin: 0x8a5a3e, hair: { style: 'perm', col: 0x1e1614 }, top: { kind: 'tee', col: 0x3a3a42 }, bottom: { kind: 'jeans', col: 0x34303a }, shoes: { kind: 'boots', col: 0x2a2220 }, acc: [], hat: null, glasses: null },
  taro: { preset: 'kid', seed: 14, sex: 'm', age: 'kid', H: 1.24, skin: 0xe8b48c, hair: { style: 'bowl', col: 0x3a2a20 }, top: { kind: 'tee', col: 0xf0c840 }, bottom: { kind: 'shorts', col: 0x3a5a8a }, shoes: { kind: 'sneaker', col: 0xe84a3a, col2: 0xf4f0ea }, glasses: { kind: 'round', col: [40, 34, 30], thick: 1 }, acc: [{ kind: 'backpack', col: 0x5a9a5a }], hat: null },
  reporter: { preset: 'office_lady', seed: 15, sex: 'f', age: 'adult', H: 1.63, hair: { style: 'bob', col: 0x3a2a22 }, top: { kind: 'blazer', col: 0x8a3a3a, shirt: 0xf6f4ee }, bottom: { kind: 'skirt', col: 0x3a3238 }, acc: [{ kind: 'shoulderbag', col: 0x2a2622, side: 1 }] },
  chef: { preset: 'shopkeeper', seed: 16, sex: 'm', age: 'adult', H: 1.76, build: 1.25, belly: 0.8, skin: 0xe6b48e, hair: { style: 'buzz', col: 0x2a2422 }, top: { kind: 'shirt', col: 0xf2f0ea }, bottom: { kind: 'slacks', col: 0x2a2a30 }, hat: { kind: 'headband', col: 0xc83a3a } },
  lau: { preset: 'grandpa', seed: 17, H: 1.6, glasses: { kind: 'round', col: [40, 34, 30], thick: 1 } },
  driver: { preset: 'delivery', seed: 18, sex: 'm', age: 'adult', H: 1.82, build: 1.2, skin: 0xc48a62, hair: { style: 'buzz', col: 0x2a2422 }, top: { kind: 'jacket', col: 0x2a2a32, shirt: 0xb82a2a }, bottom: { kind: 'slacks', col: 0x2a2a32 }, hat: { kind: 'cap', col: 0xb82a2a, col2: 0xe8b43a } },
  chess: { preset: 'grandpa', seed: 19, H: 1.62, hat: { kind: 'flatcap', col: 0x6a5a48 } },
  mom: { preset: 'mom', seed: 20, sex: 'f', age: 'adult', H: 1.6, hair: { style: 'ponytail', col: 0x4a3226 } },
};
