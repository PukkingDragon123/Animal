// Gateway Music & Gear (Chinatown): buy gear — picks, pedals, amps, sneakers — and equip it.
// Gear is a stat boost only (accessories/drip are earned, never sold). The shop is an overlay:
// a shelf of hand-pixelled gear on the left, the selected piece's card on the right
// (big icon, stats, price, BUY), then EQUIP hands it to a team member.
import { T } from '../../px/game/ui.js';
import { GEAR, GEAR_IDS } from '../../data/gear.js';
import { SPECIES } from '../../data/species.js';
import { gearSlots } from '../../game/elemon.js';
import * as S from '../../game/state.js';

// 16 × 16 icons. Palette letters per icon; '.' is empty, 'k' the ink outline.
const ICON = {
  guitar_pick: { p: { a: '#c8782a', b: '#7a3a18', c: '#f0b860' }, m: [
    '................', '...kkkkkkkkkk...', '..kaabaaabaaak..', '..kabbaacaabak..', '..kaaacbaaabak..', '..kcaaaabbaack..', '...kabaaacaak...', '...kaacbbaabk...',
    '....kaabaaak....', '....kbaacaak....', '.....kaabak.....', '.....kabaak.....', '......kaak......', '......kaak......', '.......kk.......', '................'] },
  heavy_pick: { p: { a: '#2a2a34', b: '#4a4a5a', c: '#e8e8f0' }, m: [
    '................', '...kkkkkkkkkk...', '..kaaaaaaaaaak..', '..kabbbbbbbbak..', '..kacccccccccak.', '..kabbbbbbbbak..', '...kaaaaaaaak...', '...kabbbbbbak...',
    '....kacccccak...', '....kabbbbak....', '.....kaaaak.....', '.....kabbak.....', '......kaak......', '......kaak......', '.......kk.......', '................'] },
  tube_amp: { p: { g: '#ffcf5a', o: '#ff8a30', w: '#e8dcc0', a: '#6a4a30', b: '#3a2418', r: '#c83030' }, m: [
    '....g......g....', '...kgk....kgk...', '...kok....kok...', '.kkkkkkkkkkkkkk.', '.kwwwwwwwwwwwwk.', '.kwaaaaaaaaaawk.', '.kwababababaawk.', '.kwaaaaaaaaaawk.',
    '.kwababababaawk.', '.kwaaaaaaaaaawk.', '.kwwwwwwwwwwwwk.', '.kwrwrwrwwwwwwk.', '.kwwwwwwwwwwwwk.', '.kkkkkkkkkkkkkk.', '..kk........kk..', '................'] },
  fuzz_pedal: { p: { o: '#e8603a', d: '#b03a20', s: '#d8dce4', w: '#ffffff', y: '#ffd850' }, m: [
    '................', '..kkkkkkkkkkkk..', '.kooooooooooook.', '.kokkoooooookkok', '.kokwkoooookwko.', '.kokkoooooookkok', '.kooooyyyyoooook', '.kooooyddyoooook',
    '.kooooyyyyoooook', '.kooooooooooook.', '.koookkkkkkoook.', '.kooksssssskook.', '.kooksssssskook.', '.kddkkkkkkkkddk.', '..kkkkkkkkkkkk..', '................'] },
  mic_stand: { p: { s: '#c8ccd4', d: '#7a7e88', g: '#4a4e58' }, m: [
    '......kkkk......', '.....ksdsdk.....', '.....kdsdsk.....', '.....ksdsdk.....', '......kkkk......', '.......kk.......', '......kggk......', '.......kk.......',
    '.......kk.......', '.......kk.......', '.......kk.......', '.......kk.......', '......kddk......', '.....kd..dk.....', '....kd....dk....', '...kk......kk...'] },
  road_case: { p: { b: '#2a2a32', d: '#3a3a44', s: '#d8dce4', h: '#8a8e98' }, m: [
    '................', '.....kkkkkk.....', '.....khhhhk.....', '.kkkkkkkkkkkkkk.', '.ksskbbbbbbkssk.', '.ksbbbdbbdbbbsk.', '.kbbbbbbbbbbbbk.', '.kssssssssssssk.',
    '.kbbbbbskbbbbbk.', '.kbbbbbskbbbbbk.', '.kbbbbbbbbbbbbk.', '.ksbbbdbbdbbbsk.', '.ksskbbbbbbkssk.', '.kkkkkkkkkkkkkk.', '................', '................'] },
  drumsticks: { p: { w: '#e8c890', d: '#b8904a', t: '#f8ecd0' }, m: [
    '.kk..........kk.', 'ktwk........kwtk', '.kwdk......kdwk.', '..kwdk....kdwk..', '...kwdk..kdwk...', '....kwdkkdwk....', '.....kwddwk.....', '......kwwk......',
    '.....kwddwk.....', '....kwdkkdwk....', '...kwdk..kdwk...', '..kwdk....kdwk..', '.kwdk......kdwk.', 'kwdk........kdwk', 'kkk..........kkk', '................'] },
  stage_sneakers: { p: { w: '#f6f4ee', r: '#e8343a', s: '#c8c4bc', l: '#2a2a32' }, m: [
    '................', '................', '....kkkkk.......', '...kwwwwwk......', '...kwlwlwk......', '...kwwlwwkk.....', '...kwlwlwwwkk...', '..kwwwwrrwwwwkk.',
    '..kwwrrrwwwwwwwk', '.kwrrwwwwwwwwwwk', '.kwwwwwwwwwwwwwk', '.kssssssssssssk.', '.kkkkkkkkkkkkkk.', '................', '................', '................'] },
  leather_jacket: { p: { b: '#2a2226', d: '#3e3438', s: '#d8dce4', z: '#a8acb4' }, m: [
    '................', '....kkk..kkk....', '...kbbdkkdbbk...', '..kbbbdkkdbbbk..', '.kbbbbdzzdbbbbk.', '.kbsbbbzzbbbsbk.', 'kbbbbbbzzbbbbbbk', 'kbbkbbbzzbbbkbbk',
    'kbbkbsbzzbsbkbbk', 'kbbkbbbzzbbbkbbk', 'kbbkbbbzzbbbkbbk', 'kbbkbbbzzbbbkbbk', 'kssk.kbzzbk.kssk', 'kkk..kkkkkk..kkk', '................', '................'] },
  setlist: { p: { w: '#f4f0e4', l: '#3a3a5a', t: '#e8d870' }, m: [
    '.....tttttt.....', '..kkktttttkkk...', '..kwwwwwwwwwk...', '..kwllllwwwwk...', '..kwwwwwwwwwk...', '..kwlllllwwwk...', '..kwwwwwwwwwk...', '..kwllllllwwk...',
    '..kwwwwwwwwwk...', '..kwlllwwwwwk...', '..kwwwwwwwwwk...', '..kwllllllwwk...', '..kwwwwwwwwwk...', '..kkkkkkkkkkk...', '................', '................'] },
  capo: { p: { s: '#d8dce4', d: '#8a8e98', r: '#2a2a32' }, m: [
    '................', '................', '..kkkkkkkkkkkk..', '.kssssssssssssk.', '.kddddddddddddk.', '.kk..........kk.', '.ks..........sk.', '.ks..........sk.',
    '.kdkk......kkdk.', '..kdsk....ksdk..', '...krrkkkkrrk...', '...krrrrrrrrk...', '....kkkkkkkk....', '................', '................', '................'] },
  whammy_bar: { p: { s: '#e8ecf4', d: '#9aa0aa', w: '#ffffff' }, m: [
    '............kkk.', '...........kwwk.', '..........kwwk..', '.........kwwk...', '........ksdk....', '.......ksdk.....', '......ksdk......', '.....ksdk.......',
    '....ksdk........', '...ksdk.........', '..ksdk..........', '..ksk...........', '..ksk...........', '..kdk...........', '..kkk...........', '................'] },
  aviator_shades: { p: { g: '#d8b050', d: '#1a2234', l: '#5a7aaa' }, m: [
    '................', '................', '................', '..kkkkkkkkkkkk..', '.kggggggkkggggk.', 'kgdddddgggdddddg', 'kgdlldddgddlldd.', 'kgdldddkgkdlddd.',
    '.kgddddk.kgdddk.', '..kgddk...kgddk.', '...kkk.....kkk..', '................', '................', '................', '................', '................'] },
  earplugs: { p: { o: '#ff8a3a', y: '#ffb860', c: '#3a6ab0' }, m: [
    '................', '...kkk....kkk...', '..kyook..kyook..', '..koook..koook..', '..koook..koook..', '..kyook..kyook..', '...kkk....kkk...', '....kc....kc....',
    '....kc....kc....', '.....kc..kc.....', '......kcck......', '.......kk.......', '................', '................', '................', '................'] },
  egg: { p: { w: '#f8f2e0', s: '#e0d4b8', h: '#ffffff' }, m: [
    '................', '......kkkk......', '.....kwwwwk.....', '....kwhwwwwk....', '...kwhwwwwwwk...', '...kwwwwwwwwk...', '..kwwwwwwwwwsk..', '..kwwwwwwwwwsk..',
    '..kwwwwwwwwwsk..', '..kwwwwwwwwssk..', '..kswwwwwwwssk..', '...kswwwwwssk...', '....kssssssk....', '.....kkkkkk.....', '................', '................'] },
  greasepaint_stone: { p: { b: '#1a1620', w: '#f4f0f8', g: '#5a5468' }, m: [
    '................', '.....kkkkkk.....', '....kbbbbbbk....', '...kbbbwbbbbk...', '..kbbbwwwbbbbk..', '..kbbwwwwwbbgk..', '..kbbbwwwbbbgk..', '..kbbwbbbwbbgk..',
    '..kbbbbbbbbbgk..', '..kgbbbbbbbggk..', '...kgbbbbbggk...', '....kggggggk....', '.....kkkkkk.....', '................', '................', '................'] },
};
const INK = '#141018';
export function drawGearIcon(ui, id, x, y, sc = 1) {
  const I = ICON[id]; if (!I) { ui.icon('gear', x + 4 * sc, y + 4 * sc, T.amber); return; }
  for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) {
    const ch = I.m[r][c]; if (ch === '.' || ch === undefined) continue;
    const col = ch === 'k' ? INK : I.p[ch]; if (!col) continue;
    if (sc === 1) ui.px(x + c, y + r, col); else ui.rect(x + c * sc, y + r * sc, sc, sc, col);
  }
}
const STAT = { dmg: 'Damage', elm: 'Element', def: 'Defense', spd: 'Speed', hp: 'Health' };
function lines(g) {
  const out = [];
  for (const [k, v] of Object.entries(g.stats || {})) out.push([`${v > 0 ? '+' : ''}${Math.round(v * 100)}% ${STAT[k]}`, v > 0 ? T.green : T.red]);
  const m = g.mods || {};
  if (m.costMul) out.push([`-${Math.round((1 - m.costMul) * 100)}% skill cost`, T.green]);
  if (m.cdMul) out.push([`-${Math.round((1 - m.cdMul) * 100)}% cooldowns`, T.green]);
  if (m.critChance) out.push([`+${Math.round(m.critChance * 100)}% crit chance`, T.green]);
  if (m.immune) out.push([`Immune: ${m.immune.join(', ')}`, T.cyan]);
  return out;
}

export class GearShop {
  constructor(app) { this.app = app; this.sel = GEAR_IDS[0]; this.mode = 'shop'; this.msg = null; this.t = 0; this.shake = 0; }
  open() { return new Promise((res) => { this.done = res; this.app.overlays.push(this.draw = this.draw.bind(this)); this.app.audio.sfx && this.app.audio.sfx('ui_tap'); }); }
  close() { const i = this.app.overlays.indexOf(this.draw); if (i >= 0) this.app.overlays.splice(i, 1); this.app.save(); this.done && this.done(); }
  sfx(n) { this.app.audio.sfx && this.app.audio.sfx(n); }
  draw(ui, dt) {
    this.t += dt; this.shake = Math.max(0, this.shake - dt);
    const s = this.app.state, W = ui.w, H = ui.h, pw = Math.min(W - 12, 420), ph = Math.min(H - 12, 240), px = (W - pw) >> 1, py = (H - ph) >> 1;
    ui.fade(0.55, '#0c0814');
    ui.panel(px, py, pw, ph, { dots: true });
    ui.banner(px + 6, py + 6, 'GATEWAY MUSIC & GEAR', { icon: 'gear', color: T.amber });
    ui.icon('coin', px + pw - 70, py + 9, T.amber); ui.text(`$${s.money}`, px + pw - 60, py + 9, T.amber);
    if (ui.button(px + pw - 22, py + 6, 16, 14, 'X', { color: T.red, hotkey: 'Escape' })) { this.close(); return; }
    const gx = px + 8, gy = py + 26, cols = 4, cell = 30, shelfW = cols * cell;
    // the shelf: wooden boards, gear on display
    for (let r = 0; r < Math.ceil(GEAR_IDS.length / cols); r++) { const y = gy + r * cell + cell - 4; ui.rect(gx - 2, y, shelfW + 2, 3, '#7a4a2a'); ui.rect(gx - 2, y + 3, shelfW + 2, 1, '#3a2214'); }
    GEAR_IDS.forEach((id, i) => {
      const x = gx + (i % cols) * cell, y = gy + Math.floor(i / cols) * cell, on = this.sel === id, own = s.bag[id] || 0;
      if (on) { ui.rrect(x - 1, y - 1, cell - 2, cell - 3, T.amber, 2); ui.rrect(x, y, cell - 4, cell - 5, '#2a2036', 1); }
      const bob = on ? Math.round(Math.sin(this.t * 5) * 1) : 0;
      drawGearIcon(ui, id, x + 5, y + 3 + bob);
      if (own) { ui.rect(x + cell - 12, y, 9, 7, T.green); ui.text(String(own), x + cell - 8, y, INK, { mini: true, align: 'center' }); }
      if (ui.inside(x, y, cell - 2, cell - 2) && ui.ptr.released) { ui.ptr.released = false; this.sel = id; this.mode = 'shop'; this.msg = null; this.sfx('ui_tap'); }
    });
    // the card
    const cx = gx + shelfW + 10, cw = px + pw - cx - 8, cy = gy, chh = ph - 34, g = GEAR[this.sel];
    ui.panel(cx, cy, cw, chh, { fill: T.panel2 });
    drawGearIcon(ui, this.sel, cx + 8, cy + 8, 3);
    ui.text(g.name, cx + 60, cy + 9, T.text);
    ui.text(`$${g.price}`, cx + 60 + (this.shake ? Math.round(Math.sin(this.t * 60) * 2) : 0), cy + 21, s.money >= g.price ? T.amber : T.red);
    if (s.bag[this.sel]) ui.text(`In bag: ${s.bag[this.sel]}`, cx + 60, cy + 33, T.green, { mini: true });
    let ly = cy + 60;
    for (const [str, col] of lines(g)) { ui.text(str, cx + 8, ly, col); ly += 10; }
    const flavour = (g.desc || '').split('. ').slice(1).join('. ');
    for (const l of ui.wrap(flavour, cw - 16, { mini: true }).slice(0, 3)) { ui.text(l, cx + 8, ly + 2, T.dim, { mini: true }); ly += 8; }
    if (this.mode === 'shop') {
      if (ui.button(cx + 6, cy + chh - 22, (cw >> 1) - 9, 18, 'BUY', { icon: 'coin', color: T.amber, disabled: false })) {
        if (S.buy(s, this.sel)) { this.sfx('reward'); this.msg = `Bought ${g.name}!`; this.app.toast(`Bought ${g.name}`, { icon: 'coin', color: T.amber, dur: 1.6 }); }
        else { this.sfx('ui_error'); this.shake = 0.35; this.msg = 'Not enough cash.'; }
      }
      if (ui.button(cx + (cw >> 1) + 3, cy + chh - 22, (cw >> 1) - 9, 18, 'EQUIP', { icon: 'team', color: T.cyan, disabled: !s.bag[this.sel] || !s.party.length })) { this.mode = 'equip'; this.sfx('ui_tap'); }
      if (this.msg) ui.text(this.msg, cx + 8, cy + chh - 32, this.msg.startsWith('Bought') ? T.green : T.red, { mini: true });
    } else {
      // pick who wears it
      ui.text('Equip on…', cx + 8, cy + chh - 22 - s.party.length * 0 - 4 - Math.min(s.party.length, 3) * 17, T.cyan, { mini: true });
      s.party.slice(0, 3).forEach((m, i) => {
        const y = cy + chh - 22 - (Math.min(s.party.length, 3) - 1 - i) * 17, sp = SPECIES[m.species], cur = (m.gear || []).map((gid) => (GEAR[gid] ? GEAR[gid].name.split(' ').pop() : gid)).join(', ');
        if (ui.button(cx + 6, y - 2, cw - 12, 16, `${m.nick || sp.name}`, { color: T.cyan, sub: cur ? `${cur} (${(m.gear || []).length}/${gearSlots(m)})` : `empty (0/${gearSlots(m)})` })) {
          if (S.equipGearItem(s, m, this.sel)) { this.sfx('ui_confirm'); this.app.toast(`${m.nick || sp.name} equipped ${g.name}`, { icon: 'check', color: T.green, dur: 1.8 }); }
          this.mode = 'shop';
        }
      });
    }
  }
}
