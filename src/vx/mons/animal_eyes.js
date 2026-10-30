// Animal-accurate eyes. Every Tokonmon gets the eye of the animal it is built on, never a human-like
// white eye with a round iris. The eyes are painted per texel at full texture resolution:
// - birds: a coloured iris round a black pupil inside a dark rim
// - raptors: the same with a hard brow
// - owls: a huge iris
// - cats: an almond eye with a slit pupil
// - reptiles: a narrow slit and flecked iris
// - goats and sheep: a horizontal bar pupil
// - frogs: an oval pupil
// - bears, raccoons and rodents: glossy dark beads
// - dogs: an almond brown eye
// - fish: a flat round eye with a big pupil
// - insects and shrimp: faceted compound eyes
// - primates: deep-set brown eyes
// - objects: simple glossy dots
// Expressions come from lids (the cut part is transparent, so the skin underneath shows) and line states.
// model.js applies this to every cube listed in a model's `eyes` face slot when ANIMAL_EYES names its species.

const K = {
  bird:     { shape: 'round', iris: '#f08a2a', dark: '#b8501a', rim: '#2a1a14', pupil: 0.42 },
  raptor:   { shape: 'round', iris: '#f2c23a', dark: '#c0841a', rim: '#24160e', pupil: 0.4, brow: 0.32 },
  owl:      { shape: 'round', iris: '#ffb21a', dark: '#e0700c', rim: '#1e140e', pupil: 0.56, rimW: 0.12 },
  duck:     { shape: 'round', iris: '#4a2a18', dark: '#2a160c', rim: '#140c08', pupil: 0.6 },
  cat:      { shape: 'almond', iris: '#e8c040', dark: '#a87818', rim: '#1a120c', slit: 0.13 },
  reptile:  { shape: 'almond', iris: '#d8b030', dark: '#7a5a10', rim: '#16100a', slit: 0.07, fleck: '#f6e27a' },
  goat:     { shape: 'round', iris: '#d8a040', dark: '#9a6a1c', rim: '#2a1c12', bar: true },
  frog:     { shape: 'round', iris: '#e0c060', dark: '#94701e', rim: '#1e1a0c', bar: true, barH: 0.3 },
  beady:    { shape: 'round', bead: '#14100e', sheen: '#3a2a22' },
  seal:     { shape: 'round', bead: '#100c10', sheen: '#2e2a3a' },
  canine:   { shape: 'almond', iris: '#7a4a22', dark: '#3e2210', rim: '#120c08', pupil: 0.5 },
  fish:     { shape: 'round', iris: '#e8d088', dark: '#a88838', rim: '#c8ccd4', pupil: 0.62, rimW: 0.12 },
  compound: { shape: 'round', bead: '#16141e', sheen: '#3a3650', facet: '#4a4664' },
  mantis:   { shape: 'round', bead: '#1a2a3a', sheen: '#2a7aa0', facet: '#3ab0d8', band: '#ffd23a' },
  primate:  { shape: 'almond', iris: '#5a3218', dark: '#341c0c', rim: '#1a100a', pupil: 0.55, sclera: '#6a4a3a', brow: 0.22 },
  dot:      { shape: 'round', bead: '#1a1218', sheen: '#4a3a48' },
};
// species → [kind, overrides]. Species not listed keep their own eyes (e.g. Yeezilla's shutter shades).
export const ANIMAL_EYES = {
  chilichick: ['bird', { iris: '#ff7a1a', dark: '#c8401a' }], pidgun: ['bird'], pidrose: ['bird', { iris: '#ff5a64', dark: '#b8283c' }],
  jungeon: ['bird', { iris: '#ffc23a' }], jungeon_rose: ['bird', { iris: '#ff4a6a', dark: '#a81c3a' }], paradove: ['bird', { iris: '#ffe07a', dark: '#ff9a2a', glowy: true }],
  wheezowl: ['owl'], dreadrake: ['duck'], woodbub: ['bird', { iris: '#3a2418', dark: '#1e120a', pupil: 0.55 }],
  starstrut: ['raptor'], talonaka: ['raptor'], takaptain: ['raptor'], hawkabunga: ['raptor', { iris: '#ffd04a' }],
  zapkit: ['cat'], thundersabre: ['cat', { iris: '#ffd23a', dark: '#e0901a' }], chochobake: ['cat', { iris: '#b088f0', dark: '#6a3ab8' }],
  kissmet: ['cat', { iris: '#e8d040' }], kissmera: ['cat', { iris: '#ff4a3a', dark: '#a81810' }], purrcussion: ['cat', { iris: '#7ad85a', dark: '#2e8a2a' }],
  demonaconda: ['reptile', { iris: '#ff5a1a', dark: '#a81c0a', fleck: '#ffd27a' }], spaceshell: ['reptile', { iris: '#c8d0dc', dark: '#6a7280', fleck: '#ffffff' }],
  metalfang: ['reptile', { iris: '#ffc23a' }], wyvillain: ['reptile', { iris: '#9aff3a', dark: '#3a8a10', fleck: '#e8ffb0' }], doomsdrake: ['reptile', { iris: '#9aff3a', dark: '#3a8a10', fleck: '#e8ffb0' }],
  strawbaa: ['goat', { iris: '#f0c070' }], kappachi: ['frog', { iris: '#e0d070', dark: '#5a8a2a' }],
  gradcub: ['beady'], bearbreak: ['beady'], polobruin: ['beady'], trashcoon: ['beady'], dynacoon: ['beady'], hellcoon: ['beady', { bead: '#2a0606', sheen: '#ff3a1a', glowy: true }],
  studrat: ['beady', { sheen: '#5a2a2a' }], zapanda: ['beady'], cabbunny: ['beady', { sheen: '#4a2a3a' }], walrusk: ['beady'], moshbull: ['beady', { sheen: '#4a2416' }],
  kanizumo: ['beady', { sheen: '#3a3a4a' }], blowhale: ['beady'], tartanic: ['beady'], thrashark: ['beady', { sheen: '#2a3a5a' }],
  barkorious: ['seal'], barkorious_forced: ['seal', { bead: '#2a0606', sheen: '#ff2a2a', glowy: true }],
  mopzart: ['canine'], bubblion: ['fish', { iris: '#c8a8ff', dark: '#7a50d8' }], weirdfin: ['fish', { iris: '#3ad0e0', dark: '#2456c8', rim: '#7a80d0' }],
  beatlet: ['compound'], pepperhorn: ['compound'], abbeyhorn: ['compound', { facet: '#6a6a7a' }], foopod: ['compound', { sheen: '#4a2a3a', facet: '#7a4a5a' }], everpunch: ['mantis'],
  snoozaque: ['primate', { sleepy: true }], piledrilla: ['primate', { sleepy: true }], fluorescape: ['primate', { sleepy: true, iris: '#b06aff', dark: '#5a2aa8', sclera: '#3a2a5a' }],
  lemmo: ['dot'], creepetal: ['dot', { sheen: '#6a5aa8' }], plastree: ['dot', { sheen: '#3a6a3a' }], grenaday: ['dot', { sheen: '#4a6a2a' }], armagreddon: ['dot', { bead: '#2a0a0a', sheen: '#ff4a2a', glowy: true }],
};

// painter for one eye state. Plane x = 0 is the outer corner (eyeRig convention), y = 0 the top.
export function animalEye(kind, state, over = {}) {
  const k = { ...K[kind], ...over };
  return (p, w, h) => {
    const cx = (w - 1) / 2, cy = (h - 1) / 2, rx = w * 0.46, ry = h * 0.44, put = (x, y, c) => { if (x >= 0 && y >= 0 && x < w && y < h) p.px(x, y, c); };
    // the eye's outline: round or almond (pointed at the corners)
    const inside = (x, y) => {
      const u = (x - cx) / rx, v = (y - cy) / ry;
      if (k.shape === 'almond') return v * v <= Math.max(0, 1 - u * u) * (1 - 0.35 * u * u) && Math.abs(u) <= 1;
      return u * u + v * v <= 1;
    };
    const line = k.rim || '#1a120c', T = Math.max(1, Math.round(Math.min(w, h) / 9));   // line thickness in texels
    // line-only states
    const arc = (up, thick = T) => { for (let x = 0; x < w; x++) { const u = (x - cx) / rx; if (Math.abs(u) > 1) continue; const y = Math.round(cy + (up ? -1 : 1) * (1 - u * u) * ry * 0.45 - (up ? -ry * 0.15 : ry * 0.1)); for (let t = 0; t < thick; t++) put(x, y + t, line); } };
    if (state === 'closed' || state === 'shut') { arc(false); return; }
    if (state === 'happy') { arc(true, T + 1); return; }
    if (state === 'x') { for (let i = 0; i < Math.min(w, h); i++) { const a = Math.round(i * w / Math.min(w, h)), b = Math.round(i * h / Math.min(w, h)); for (let t = 0; t < T; t++) { put(a + t, b, line); put(w - 1 - a - t, b, line); } } return; }
    if (state === 'heart' || state === 'star') { const c = state === 'heart' ? '#ff4a7a' : '#ffd23a'; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = (x - cx) / rx, v = (y - cy) / ry; const ins = state === 'heart' ? Math.pow(u * u + v * v - 0.5, 3) - u * u * Math.pow(-v, 3) * 0.9 < 0 : Math.abs(u) + Math.abs(v) < 0.75 || (Math.abs(u) < 0.22 || Math.abs(v) < 0.22) && u * u + v * v < 1; if (ins) put(x, y, c); } return; }
    if (state === 'swirl') { for (let a = 0; a < 18; a += 0.05) { const r = a / 18; put(Math.round(cx + Math.cos(a) * rx * r), Math.round(cy + Math.sin(a) * ry * r), line); } return; }
    // lids: where the open eye is cut (transparent above the line, the skin shows)
    const lidY = (x) => {
      const t = x / Math.max(1, w - 1);                                   // 0 outer → 1 inner
      if (state === 'angry') return cy - ry + ry * (0.25 + 0.75 * t);
      if (state === 'sad') return cy - ry + ry * (0.95 - 0.7 * t);
      if (state === 'sleepy' || (k.sleepy && (state === 'open' || state === 'glint' || state === 'teary'))) return cy - ry * 0.1;
      if (state === 'smug') return cy - ry * 0.25 + ry * 0.2 * t;
      if (k.brow) return cy - ry + ry * k.brow * 2 * (0.6 + 0.4 * t);     // a permanent brow (raptors, primates)
      return -1e9;
    };
    const shock = state === 'shock' || state === 'wide';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!inside(x, y) || y < lidY(x)) continue;
      const u = (x - cx) / rx, v = (y - cy) / ry, d = Math.sqrt(u * u + v * v);
      let c;
      if (k.bead) {                                                       // glossy beads, dots, compound eyes
        c = v > 0.35 ? k.sheen : k.bead;
        if (k.facet && ((x >> 1) + (y >> 1)) % 2 === 0 && d < 0.9) c = k.facet;
        if (k.band && Math.abs(v) < 0.18) c = k.band;
      } else {
        const rimW = k.rimW || 0.1;
        if (d > 1 - rimW * (k.shape === 'almond' ? 1.6 : 1)) c = line;                                   // the dark rim
        else if (k.sclera && Math.abs(u) > 0.62) c = k.sclera;                                          // primates: dark, not white
        else {
          c = v < -0.25 ? k.dark : k.iris;                                                              // iris, shaded under the lid
          if (k.fleck && ((x * 7 + y * 13) % 11 === 0)) c = k.fleck;
          const ps = shock ? 0.55 : 1;
          let pupil;
          if (k.slit) pupil = Math.abs(u) < k.slit * (shock ? 3.5 : 1) * (1 - 0.4 * v * v) && Math.abs(v) < 0.92;
          else if (k.bar) pupil = Math.abs(v) < (k.barH || 0.2) * ps && Math.abs(u) < 0.62 * ps;
          else pupil = d < (k.pupil || 0.45) * ps;
          if (pupil) c = '#0c0a0c';
        }
      }
      put(x, y, c);
    }
    // the lid line along a cut, and the highlights
    for (let x = 0; x < w; x++) { const ly = lidY(x); if (ly <= -1e8) continue; for (let y = Math.ceil(ly); y < Math.ceil(ly) + T; y++) if (inside(x, y)) put(x, y, line); }
    const hs = Math.max(1, Math.round(Math.min(w, h) * (state === 'glint' ? 0.22 : 0.15))), hx = Math.round(cx - rx * 0.32), hy = Math.round(cy - ry * 0.38);
    for (let j = 0; j < hs; j++) for (let i = 0; i < hs; i++) if (inside(hx + i, hy + j) && hy + j >= lidY(hx + i) + T) put(hx + i, hy + j, '#ffffff');
    const s2 = Math.max(1, Math.round(hs / 2)), lx = Math.round(cx + rx * 0.3), ly2 = Math.round(cy + ry * 0.3);
    for (let j = 0; j < s2; j++) for (let i = 0; i < s2; i++) if (inside(lx + i, ly2 + j) && ly2 + j >= lidY(lx + i) + T) put(lx + i, ly2 + j, k.glowy ? '#ffe8c0' : '#d8e0ec');
    if (state === 'teary') for (let x = 0; x < w; x++) for (let y = h - 1; y >= 0; y--) if (inside(x, y)) { put(x, y, '#8ad8ff'); break; }
  };
}
// the cubes a model's `eyes` face slot shows, keyed by id → the state they belong to
export function eyeIds(def) {
  const slot = def.anim && def.anim.faces && def.anim.faces.eyes, out = new Map();
  if (!slot || !slot.states) return out;
  for (const [st, ids] of Object.entries(slot.states)) for (const id of ids || []) if (!out.has(id)) out.set(id, st);
  return out;
}
