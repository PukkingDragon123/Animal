// Shared parts for the rainbow-goblin line (Rainblin → Roygbot), an original homage to the seven colour goblins
// of the Rainbow Goblins tale (and Takanaka's album of the same name): seven mischievous goblins, one per colour
// of the rainbow, who lasso rainbows and drink their colours. Original designs only.
//   ROYGBIV palettes (skin, cloth, metal tints), painters (goblin skin, ragged cloth, rope, leather, tin, mech
//   armour with panel lines, rainbow stripes, glass), the rainbow arc, eye and mouth maps, the little goblin-robot
//   pilots of the mech, particle kinds and the drip-form maps.
import { shade, gradient, ramp, shift, h2 } from './kit.js';
import { B, region, ell, stamp, GOLD, fromHsl, formMap } from './story_parts.js';
import { defineFx } from '../fx.js';
import { crisp } from './takanaka_parts.js';

export const RAINBOW = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
// per colour: skin (mid, hi, lo), cloth (deep tone), metal tint (pilots), the band colour of the arc
export const GOB = {
  red: { skin: '#ea4a3c', cloth: '#9c1c24', band: '#ff3a3a', name: 'Red' },
  orange: { skin: '#ff8c2e', cloth: '#c0501a', band: '#ff8a1e', name: 'Orange' },
  yellow: { skin: '#f6d23c', cloth: '#b88a0e', band: '#ffe03a', name: 'Yellow' },
  green: { skin: '#5ac84c', cloth: '#26762e', band: '#3ad85a', name: 'Green' },
  blue: { skin: '#3e8ef0', cloth: '#1c4aa4', band: '#3a9aff', name: 'Blue' },
  indigo: { skin: '#6450d6', cloth: '#2c2280', band: '#5a4aff', name: 'Indigo' },
  violet: { skin: '#b64ede', cloth: '#6c1e8e', band: '#c45aff', name: 'Violet' },
};
for (const k of RAINBOW) { const g = GOB[k]; g.skinHi = shift(g.skin, 0.22); g.skinLo = shift(g.skin, -0.3); g.skinDeep = shift(g.skin, -0.5); g.clothHi = shift(g.cloth, 0.2); g.clothLo = shift(g.cloth, -0.32); }
export const GK = {
  ink: '#1a0a14', leather: '#6a3e1e', leatherHi: '#9a6436', leatherLo: '#3e220e', rope: '#c89a5a', ropeLo: '#8a6232',
  tin: '#b8bcc8', tinHi: '#e8ecf4', tinLo: '#7a7e8c', hair: '#241a22', hairHi: '#4a3644', tusk: '#fff6dc', tuskLo: '#d8c8a0',
  armor: '#eef0f6', armorHi: '#ffffff', armorLo: '#b8bccc', armorDeep: '#8a90a4', joint: '#2a2e3a', jointHi: '#4a5060', jointLo: '#14161e',
  glass: '#9ad8ff', screen: '#141824', panel: '#5a6074',
};
const side = (f) => f !== 'up' && f !== 'down';

// ---------------------------------------------------------------- goblin painters
// warty goblin skin: banded shade with a scatter of darker warts and lit bumps
export function skinP(c, o = {}) {
  const g = GOB[c];
  return (p, w, h, face) => {
    shade(g.skin, { top: g.skinHi, bottom: g.skinLo, grain: 0.05 })(p, w, h, face);
    if (!side(face) && face !== 'up') return;
    for (let y = 1; y < h - 1; y++) for (let x = 0; x < w; x++) if (h2(x, y, 9) < 0.025) { p.px(x, y, g.skinLo); p.px(x, y - 1, g.skinHi); }
    if (o.inner && (face === 'south' || face === 'plane')) for (let y = Math.floor(h * 0.3); y < h - 1; y++) for (let x = 1; x < w - 1; x++) p.px(x, y, (x + y) % 5 === 0 ? g.skinLo : g.skinDeep);    // the inside of an ear
  };
}
// ragged cloth in the goblin's colour: patched, with a torn hem and stitches
export function clothP(c, o = {}) {
  const g = GOB[c];
  return crisp((p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let col = face === 'up' ? g.clothHi : face === 'down' ? g.clothLo : ramp([g.clothHi, g.cloth, g.cloth, g.clothLo], y / Math.max(1, h - 1), x, y);
      if (side(face) && x % 6 === 3) col = shift(col, -0.1);
      p.px(x, y, col);
    }
    if (o.patch && face === 'south') { const x0 = Math.floor(w * 0.62), y0 = Math.floor(h * 0.3); p.rect(x0, y0, 4, 4, GK.leather); for (let i = 0; i < 4; i++) { p.px(x0 - 1, y0 + i, i % 2 ? GK.ropeLo : GK.rope); } }
    if (o.ragged && side(face)) for (let x = 0; x < w; x++) { const cut = (x * 5) % 7 < 2 ? 2 : (x * 3) % 5 === 0 ? 1 : 0; for (let k = 0; k < cut; k++) p.px(x, h - 1 - k, 0); p.px(x, h - 1 - cut, g.clothLo); }
  });
}
export const leatherP = (p, w, h, face) => { shade(GK.leather, { top: GK.leatherHi, bottom: GK.leatherLo, grain: 0.06 })(p, w, h, face); if (side(face)) for (let x = 1; x < w; x += 3) p.px(x, Math.floor(h / 2), GK.leatherHi); };
export const buckleP = gradient([GOLD[0], GOLD[1], GOLD[2]]);
export const ropeP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 3 === 0 ? GK.ropeLo : (x + y) % 3 === 1 ? GK.rope : '#e0b878'); };
export const tinP = gradient([GK.tinHi, GK.tin, GK.tinLo]);
export const tuskP = gradient([GK.tusk, GK.tusk, GK.tuskLo]);
// the shaggy fringe poking out from under the hood
export const hairP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? GK.hairHi : x % 3 === 1 ? GK.hairHi : GK.hair);
  if (side(face)) for (let x = 0; x < w; x++) { const cut = (x * 7) % 5 < 2 ? 1 : (x * 3) % 4 === 0 ? 2 : 0; for (let k = 0; k < cut; k++) p.px(x, h - 1 - k, 0); }
};

// ---------------------------------------------------------------- the rainbow arc (a plane: clear outside the bands)
export function arcP(o = {}) {
  const inner = o.inner ?? 0.5, bands = RAINBOW.map((k) => GOB[k].band);
  return (p, w, h) => {
    const cx = w / 2, cy = h, R = Math.min(w / 2, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / R; if (d > 1 || d < inner) continue;
      const i = Math.min(6, Math.floor(((1 - d) / (1 - inner)) * 7));
      p.px(x, y, (x + y) % 9 === 0 ? shift(bands[i], 0.25) : bands[i]);
    }
  };
}
// a diagonal ROYGBIV stripe band painted across a face
export function stripes(base, o = {}) {
  const bands = RAINBOW.map((k) => GOB[k].band), wd = o.width || 2, y0 = o.y0 ?? 0.35;
  return crisp((p, w, h, face, c) => {
    base(p, w, h, face, c);
    if (!side(face)) return;
    const top = Math.round(h * y0);
    for (let i = 0; i < 7; i++) for (let k = 0; k < wd; k++) for (let x = 0; x < w; x++) { const y = top + i * wd + k + Math.round(x * (o.slope || 0)); if (y >= 0 && y < h) p.px(x, y, bands[i]); }
  });
}

// ---------------------------------------------------------------- mech armour
// white armour plates: panel lines, rivets, a soft top light
export function armorP(o = {}) {
  const c = o.c || GK.armor, hi = o.hi || GK.armorHi, lo = o.lo || GK.armorLo, line = o.line || GK.armorDeep;
  return crisp((p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? hi : face === 'down' ? lo : ramp([hi, c, c, lo], y / Math.max(1, h - 1), x, y));
    if (!side(face) && face !== 'up') return;
    const gx = o.grid || 9;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((x % gx === gx - 1 && y % 4 !== 2) || (y % gx === gx - 1)) p.px(x, y, line);
    for (let y = 2; y < h; y += gx) for (let x = 2; x < w; x += gx) p.px(x, y, GK.armorDeep);
    if (o.trim && side(face)) for (let x = 0; x < w; x++) { p.px(x, 0, GOLD[1]); p.px(x, h - 1, GOLD[2]); }
  });
}
export const jointP = shade(GK.joint, { top: GK.jointHi, bottom: GK.jointLo, grain: 0.04 });
export const pistonP = gradient(['#ffffff', '#c8ccd8', '#8a8ea0', '#5a5e70']);
// glass: mostly clear (so the pilots behind show) with a few diagonal glints and a tinted rim
export const glassP = crisp((p, w, h) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const rim = x === 0 || y === 0 || x === w - 1 || y === h - 1, glint = (x + y) % 11 === 0 && x < w * 0.5 || (x + y) % 11 === 1 && x < w * 0.35;
    p.px(x, y, rim ? '#5ab8e8' : glint ? '#e8f8ff' : 0);
  }
});
// the cockpit bay behind the glass: dark with dials
export const bayP = crisp((p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'south' ? ((x + y) % 7 === 0 ? '#1e2434' : GK.screen) : GK.joint);
  if (face === 'south') for (let x = 2; x < w - 2; x += 5) { p.px(x, h - 3, '#3aff8a'); p.px(x + 1, h - 3, '#ff3a5a'); p.px(x + 2, h - 2, '#ffd23a'); }
});
// the speaker-grille mouth
export const grilleP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face !== 'south' ? GK.joint : y % 2 === 0 ? GK.jointLo : x % 2 ? GK.jointHi : GK.joint); };

// ---------------------------------------------------------------- the goblin-robot pilots
// a little robot goblin: a tinted tin head with two pointy antenna ears, LED eyes and a grille grin; a stubby body.
// Returns cubes centred on (x, y, z) = the bottom of its head, facing +z
export function pilot(c, x, y, z, o = {}) {
  const g = GOB[c], s = o.s || 1, head = shade(g.skin, { top: g.skinHi, bottom: g.skinLo, grain: 0 });
  const face = (p, w, h, f) => {
    head(p, w, h, f);
    if (f !== 'south') return;
    const e = Math.max(1, Math.round(w / 6)), ey = Math.round(h * 0.28);
    for (const ex of [Math.round(w * 0.22), Math.round(w * 0.78) - e]) { p.rect(ex - 1, ey - 1, e + 2, e + 2, GK.ink); p.rect(ex, ey, e, e, '#fff8a0'); p.px(ex + e - 1, ey + e - 1, '#ffb020'); }
    const my = Math.round(h * 0.68); for (let xx = Math.round(w * 0.25); xx < w * 0.75; xx++) { p.px(xx, my, GK.ink); if (xx % 2) p.px(xx, my + 1, '#fffaf0'); }
  };
  const ear = shade(g.skinLo, { top: g.skin, bottom: g.skinDeep, grain: 0 });
  return [
    B([x - 1.4 * s, y, z - 1.2 * s], [2.8 * s, 2.4 * s, 2.4 * s], face),
    B([x - 3.0 * s, y + 1.3 * s, z - 0.3 * s], [1.6 * s, 0.6 * s, 0.6 * s], ear, { pivot: [x - 1.4 * s, y + 1.6 * s, z], rot: [0, 0, -24] }),
    B([x + 1.4 * s, y + 1.3 * s, z - 0.3 * s], [1.6 * s, 0.6 * s, 0.6 * s], ear, { pivot: [x + 1.4 * s, y + 1.6 * s, z], rot: [0, 0, 24] }),
    B([x - 0.15 * s, y + 2.4 * s, z - 0.15 * s], [0.3 * s, 0.8 * s, 0.3 * s], shade(GOLD[1])),
    B([x - 1.1 * s, y - 1.8 * s, z - 0.9 * s], [2.2 * s, 1.8 * s, 1.8 * s], shade(g.cloth, { top: g.clothHi, bottom: g.clothLo, grain: 0 })),
  ];
}

// ---------------------------------------------------------------- particles
const sparkSpr = (c) => (p, w, h) => { const m = Math.floor(w / 2); for (let i = 0; i < w; i++) { p.px(i, m, c); p.px(m, i, c); } p.px(m, m, '#ffffff'); p.px(m - 1, m - 1, c).px(m + 1, m + 1, c).px(m - 1, m + 1, c).px(m + 1, m - 1, c); };
export const GBFX = Object.fromEntries(RAINBOW.map((k) => [k, defineFx('gb-' + k, { w: 7, h: 7, paint: sparkSpr(GOB[k].band), glow: true, life: [0.5, 0.9], size: [0.1, 0.03], speed: [0.4, 1.2], grav: -0.2, drag: 1.2, spread: 1, fade: true, spin: 3 })]));
// a little rainbow arc puff
export const ARCFX = defineFx('gb-arc', { w: 14, h: 7, paint: arcP({ inner: 0.45 }), life: [0.7, 1.1], size: [0.18, 0.3], speed: [0.3, 0.8], grav: -0.4, drag: 1.2, spread: 0.8, fade: true });

// ---------------------------------------------------------------- the ultra-drip form
// Painters shade and grain their colours, so the form classifies every colour by its NEAREST palette family
// (skin, cloth, metal…) instead of exact matches, then maps the family.
const rgb = (h) => { const n = parseInt(h.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
function families(table) {
  const pts = table.map(([h, f]) => [rgb(h), f]), cache = new Map();
  return (hex) => {
    if (cache.has(hex)) return cache.get(hex);
    const c = rgb(hex); let best = 'keep', bd = Infinity;
    for (const [q, f] of pts) { const d = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2 + (q[2] - c[2]) ** 2; if (d < bd) { bd = d; best = f; } }
    cache.set(hex, best); return best;
  };
}
const GOB_TABLE = [];
for (const k of RAINBOW) { const g = GOB[k]; for (const c of [g.skin, g.skinHi, g.skinLo, g.skinDeep, g.band, shift(g.band, 0.25)]) GOB_TABLE.push([c, 'keep']); for (const c of [g.cloth, g.clothHi, g.clothLo]) GOB_TABLE.push([c, 'cloth']); }
for (const c of [GK.leather, GK.leatherHi, GK.leatherLo, GK.rope, GK.ropeLo, '#e0b878', GK.tin, GK.tinHi, GK.tinLo, ...GOLD]) GOB_TABLE.push([c, 'gold']);
for (const c of [GK.ink, GK.hair, GK.hairHi, GK.tusk, GK.tuskLo, '#2a1a1e', '#ffffff', '#fffaf0', '#5a1424', '#ff7a90']) GOB_TABLE.push([c, 'keep']);
const gobFam = families(GOB_TABLE);
const famMap = (fam) => formMap(({ h, l }, glow, hex) => {
  if (glow) return undefined;                       // fire (the mech's boosters) burns blue, as in every form
  const f = fam(hex);
  return f === 'cloth' ? fromHsl(h, 0.45, 0.05 + l * 0.18) : f === 'black' ? fromHsl(250, 0.14, 0.05 + l * 0.14) : f;
});
// goblins: the skin keeps its rainbow colour (so the seven stay seven), cloth turns to a black lacquer tinted with
// its hue, leather, rope and tin turn gold
export const goblinForm = famMap(gobFam);
// the mech: white armour turns black lacquer, panel lines, pistons and trims gold, joints, glass and pilots stay
const MECH_TABLE = [...GOB_TABLE, [GK.armor, 'black'], [GK.armorHi, 'black'], [GK.armorLo, 'black'], [GK.armorDeep, 'gold'], [GK.panel, 'gold'], ['#c8ccd8', 'gold'], ['#8a8ea0', 'gold'],
  [GK.joint, 'keep'], [GK.jointHi, 'keep'], [GK.jointLo, 'keep'], [GK.screen, 'keep'], ['#1e2434', 'keep'], [GK.glass, 'keep'], ['#5ab8e8', 'keep'], ['#e8f8ff', 'keep']];
export const mechForm = famMap(families(MECH_TABLE));

// ---------------------------------------------------------------- eyes and mouths (full-res, hand drawn)
// Rainblin: a slanted, mischievous almond eye — sickly-yellow eyeball, a black slit pupil, a heavy lid flick
export const EYE_GOBLIN = {
  open: ['ll........', '.llll.....', '.lIIllll..', '.liiIIIlll', '.liiihkiil', '.liiikkiil', '..liikkil.', '...liiil..', '....lll...'],
  angry: ['..........', 'll........', '.llll.....', '.lIIllll..', '.liiIhllll', '.liiikkiil', '..liikkil.', '...liiil..', '....lll...'],
  sad: ['..........', '........ll', '.....lllll', '..llllIIll', '.llIIhkiil', '.liiikkiil', '..liikkil.', '...liiil..', '....lll...'],
  happy: ['..........', '..........', '..........', '...llll...', '..llllll..', '.ll....ll.', 'll......ll', '..........', '..........'],
  closed: ['..........', '..........', '..........', '..........', '..........', '.l......l.', '.llllllll.', '..llllll..', '..........'],
  shock: ['.lllll....', '.llllllll.', '.liiiiiil.', 'liiiiiiiil', 'liiiihiiil', 'liiiikiiil', '.liiiiiil.', '..liiiil..', '...llll...'],
  smug: ['..........', '..........', '..........', '..........', 'lllll.....', '.lllllllll', '.liiikkil.', '..liikil..', '...llll...'],
};
// Roygbot: wide LED visor eyes — a cyan screen with a dark visor line on top, a square pupil and two glints
export const EYE_MECH = {
  open: ['llllllllllll', 'lIIIIIIIIIIl', 'liiihhkkkiil', 'liiihkkkkiil', 'liiiikkkiiil', 'lcccccccccil', '.llllllllll.'],
  angry: ['lll.........', 'lIIlllll....', 'liiIIIIlllll', 'liiihkkkkIil', 'liiiikkkiiil', 'lcccccccccil', '.llllllllll.'],
  sad: ['.........lll', '....llllllIl', 'llllllIIIIil', 'liiihkkkkiil', 'liiiikkkiiil', 'lcccccccccil', '.llllllllll.'],
  happy: ['............', '............', '...llllll...', '..lllllllll.', '.lll....lll.', '.ll......ll.', '............'],
  closed: ['............', '............', '............', '............', 'llllllllllll', '.llllllllll.', '............'],
  shock: ['llllllllllll', 'liiiiiiiiiil', 'liiiiihkiiil', 'liiiiikkiiil', 'liiiiiiiiiil', 'lcccccccccil', '.llllllllll.'],
  smug: ['............', '............', 'llllllllllll', 'lIIIIIIIIIIl', 'liiiikkkiiil', 'lcccccccccil', '.llllllllll.'],
};
// goblin mouths: flat-block planes. l line · w tooth · m mouth · t tongue
const MP = { l: GK.ink, w: '#fffaf0', m: '#5a1424', t: '#ff7a90' };
const MOUTHS = {
  grin: ['l..........l', 'llllllllllll', '.lwwlwwlwwl.', '..llllllll..', '............'],
  laugh: ['llllllllllll', 'lwwlwwlwwlwl', '.lmmmmmmmml.', '..lmmttmml..', '...llllll...'],
  smirk: ['..........ll', '.........ll.', '.llllllllll.', '............', '............'],
  frown: ['............', '...llllll...', '.ll......ll.', 'l..........l', '............'],
  o: ['....llll....', '...lmmmml...', '...lmttml...', '....llll....', '............'],
  slurp: ['............', '.....ll.....', '....lmml....', '.....ll.....', '............'],
  grit: ['llllllllllll', 'lwlwlwlwlwll', 'llllllllllll', '............', '............'],
};
export const MOUTH_STATES = Object.keys(MOUTHS);
export const mouthP = (state) => crisp((p) => stamp(p, MOUTHS[state], MP, 0, 0));
