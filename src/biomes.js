// Biome definitions — palette + props + environment flags. Colors follow the
// STYLE FORMULA: soft-saturated naturals, warm cozy light, biome-tinted fog.

export const BIOMES = {
  forest: {
    id: 'forest',
    ground: 0x74c46a, groundEdge: 0x569a52,
    skyTop: 0x8fd0ff, skyBottom: 0xeafaff, fog: 0xcdeeff, fogDensity: 0.018,
    sun: 0xfff2d6, sunInt: 1.05, ambSky: 0xbfe4ff, ambGround: 0x4f8a45, ambInt: 0.85,
    props: [
      { build: 'tree', count: 34, scale: [1.0, 1.8] },
      { build: 'bush', count: 26, scale: [0.7, 1.3] },
      { build: 'fern', count: 28, scale: [0.7, 1.2] },
      { build: 'log', count: 7, scale: [0.9, 1.3] },
      { build: 'flowerProp', count: 36, scale: [0.6, 1.0] },
    ],
    water: false,
  },
  meadow: {
    id: 'meadow',
    ground: 0x8ad06a, groundEdge: 0x6fae54,
    skyTop: 0x86ccff, skyBottom: 0xfff6e8, fog: 0xe6f3d8, fogDensity: 0.016,
    sun: 0xfff0cf, sunInt: 1.1, ambSky: 0xd6efb8, ambGround: 0x6aa64f, ambInt: 0.9,
    props: [
      { build: 'flowerProp', count: 72, scale: [0.6, 1.2] },
      { build: 'fern', count: 20, scale: [0.6, 1.0] },
      { build: 'bush', count: 14, scale: [0.6, 1.0] },
      { build: 'tree', count: 7, scale: [0.9, 1.3] },
    ],
    water: false,
  },
  arctic: {
    id: 'arctic',
    ground: 0xeaf3ff, groundEdge: 0xc6dcf2,
    skyTop: 0x9fd2f0, skyBottom: 0xeef8ff, fog: 0xdcecfb, fogDensity: 0.022,
    sun: 0xfdeede, sunInt: 0.95, ambSky: 0xd6ecff, ambGround: 0xb9d2ee, ambInt: 1.0,
    props: [
      { build: 'iceberg', count: 14, scale: [0.9, 1.8] },
      { build: 'snowpile', count: 22, scale: [0.7, 1.3] },
      { build: 'icerock', count: 10, scale: [0.6, 1.1] },
    ],
    water: true, cold: true, waterColor: 0x4f7fb0,
  },
  ocean: {
    id: 'ocean',
    ground: 0x2f93b8, groundEdge: 0x1f6f93,
    skyTop: 0x2bb6d6, skyBottom: 0x9fe4ef, fog: 0x39a9c6, fogDensity: 0.030,
    sun: 0xeafaff, sunInt: 0.9, ambSky: 0x73d6ea, ambGround: 0x1c6e8c, ambInt: 1.0,
    props: [
      { build: 'coral', count: 22, scale: [0.7, 1.6] },
      { build: 'seaweedProp', count: 26, scale: [0.8, 1.6] },
      { build: 'rock', count: 12, scale: [0.7, 1.4] },
    ],
    water: true, underwater: true, waterColor: 0x2aa6c9,
  },
  river: {
    id: 'river',
    ground: 0x3f8f6f, groundEdge: 0x2f6f53,
    skyTop: 0x8fd0ff, skyBottom: 0xeafaff, fog: 0xbfe6e0, fogDensity: 0.020,
    sun: 0xfff2d6, sunInt: 1.05, ambSky: 0xbfe4ff, ambGround: 0x356a4f, ambInt: 0.9,
    props: [
      { build: 'rock', count: 18, scale: [0.7, 1.5] },
      { build: 'reed', count: 24, scale: [0.8, 1.4] },
      { build: 'tree', count: 10, scale: [0.9, 1.4] },
    ],
    water: true, current: true, currentDir: [0, 1], currentStrength: 3.4, waterColor: 0x4aa3c4,
  },
  savanna: {
    id: 'savanna',
    ground: 0xd9b25a, groundEdge: 0xb78f3f,
    skyTop: 0x86c6ff, skyBottom: 0xffedc4, fog: 0xf0dca8, fogDensity: 0.016,
    sun: 0xffe6b0, sunInt: 1.15, ambSky: 0xf2dca0, ambGround: 0xa98230, ambInt: 0.95,
    props: [
      { build: 'acacia', count: 12, scale: [1.0, 1.8] },
      { build: 'tallgrass', count: 40, scale: [0.7, 1.3] },
      { build: 'rock', count: 12, scale: [0.7, 1.3] },
    ],
    water: false,
  },
};

export function biomeOf(id) { return BIOMES[id] || BIOMES.forest; }
