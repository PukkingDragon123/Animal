// Pixel-art icons, drawn as crisp sprite canvases scaled to whole physical pixels:
//  • small: 7×7 single-colour glyphs with an automatic bevel and a 1 px drop shadow (ui.icon)
//  • big: ~12 px full-colour pixel art in a 12-unit box (ui.bigIcon). Where a detailed icon exists in
//    icons16.js (HQ) it is drawn instead, at about 3 screen pixels per art pixel on a 1080p screen.
//    Masks are authored WITHOUT the outline: the renderer adds the ink outline, auto-shades every
//    colour region (lit top edges, shaded bottom edges) and bakes a soft drop shadow.
//    BIG mask letters: "." empty, "o" ink, "w" white, "*" soft light, b/B tint + dark, a/A secondary,
//    fixed colours (lower = auto-shaded, UPPER = dark tone): r red, y gold, c cyan, g green, n wood,
//    k dark plum, m metal, l paper, p pink, s skin, v violet, f coral, e blue.
//  • emblems: an icon upscaled with Scale2x into a smooth sticker (ink + white rims)
import { P } from '../../surface.js';
import { HQ, HQ_ALIAS } from './icons16.js';
import { pixelCanvas } from './gfx.js';
import { T, sh, mx, pa } from './theme.js';

const b = (...rows) => rows.map((r) => parseInt(r, 2));
export const SMALL = {
  heart: [0b0110110, 0b1111111, 0b1111111, 0b1111111, 0b0111110, 0b0011100, 0b0001000],
  bolt: [0b0000110, 0b0001100, 0b0011000, 0b0111110, 0b0001100, 0b0011000, 0b0110000],
  star: [0b0001000, 0b0001000, 0b1111111, 0b0111110, 0b0011100, 0b0110110, 0b1000001],
  phone: [0b0111110, 0b0100010, 0b0100010, 0b0100010, 0b0100010, 0b0111110, 0b0001000],
  bag: [0b0011100, 0b0100010, 0b1111111, 0b1000001, 0b1011101, 0b1000001, 0b1111111],
  team: [0b0110110, 0b0110110, 0b0000000, 0b1111111, 0b1111111, 0b1111111, 0b0000000],
  map: [0b1110111, 0b1010101, 0b1110111, 0b1010101, 0b1110111, 0b1010101, 0b1110111],
  gear: [0b0101010, 0b1111111, 0b0110110, 0b1100011, 0b0110110, 0b1111111, 0b0101010],
  disc: [0b0011100, 0b0111110, 0b1110111, 0b1101011, 0b1110111, 0b0111110, 0b0011100],
  fist: [0b0000000, 0b0111110, 0b1111111, 0b1111111, 0b1111111, 0b0111110, 0b0011100],
  shield: [0b1111111, 0b1111111, 0b1111111, 0b0111110, 0b0111110, 0b0011100, 0b0001000],
  swap: [0b0010000, 0b0111111, 0b0010000, 0b0000000, 0b0000100, 0b1111110, 0b0000100],
  dodge: [0b0001100, 0b0011110, 0b0101101, 0b0001100, 0b0010010, 0b0100001, 0b1000000],
  link: [0b0110110, 0b1001001, 0b1001001, 0b0110110, 0b0001000, 0b0011100, 0b0001000],
  talk: [0b1111111, 0b1000001, 0b1010101, 0b1000001, 0b1111111, 0b0110000, 0b0100000],
  door: [0b0111110, 0b0100010, 0b0100010, 0b0100110, 0b0100010, 0b0100010, 0b0111110],
  eye: [0b0000000, 0b0111110, 0b1100011, 0b1001001, 0b1100011, 0b0111110, 0b0000000],
  bowl: [0b0000000, 0b0101010, 0b0000000, 0b1111111, 0b0111110, 0b0011100, 0b0111110],
  smile: [0b0111110, 0b1000001, 0b1010101, 0b1000001, 0b1011101, 0b1000001, 0b0111110],
  flame: [0b0001000, 0b0011000, 0b0011100, 0b0111110, 0b1101111, 0b1101011, 0b0111110],
  drop: [0b0001000, 0b0011100, 0b0011100, 0b0111110, 0b1111011, 0b1111111, 0b0111110],
  leaf: [0b0000111, 0b0011111, 0b0111111, 0b0111110, 0b1111100, 0b1011000, 0b1000000],
  play: [0b1000000, 0b1110000, 0b1111100, 0b1111111, 0b1111100, 0b1110000, 0b1000000],
  check: [0b0000001, 0b0000011, 0b1000110, 0b1101100, 0b0111000, 0b0010000, 0b0000000],
  cross: [0b1000001, 0b0100010, 0b0010100, 0b0001000, 0b0010100, 0b0100010, 0b1000001],
  coin: [0b0011100, 0b0111110, 0b1101011, 0b1100011, 0b1101011, 0b0111110, 0b0011100],
  up: [0b0001000, 0b0011100, 0b0111110, 0b1111111, 0b0011100, 0b0011100, 0b0011100],
  // added
  house: b('0001000', '0011100', '0111110', '1111111', '0111110', '0110110', '0110110'),
  save: b('1111110', '1011011', '1011011', '1111111', '1000001', '1000001', '1111111'),
  hand: b('0010000', '0010000', '0011110', '0011111', '1011111', '0111111', '0011110'),
  bed: b('0000000', '1000000', '1110000', '1111111', '1111111', '1000001', '0000000'),
  tv: b('0100010', '0010100', '1111111', '1000101', '1000111', '1000101', '1111111'),
  fridge: b('0111110', '0100010', '0100110', '0111110', '0100110', '0100010', '0111110'),
  book: b('1111110', '1000011', '1011011', '1000011', '1011011', '1000011', '1111111'),
  pc: b('1111111', '1000001', '1000001', '1111111', '0001000', '0111110', '0000000'),
  music: b('0011111', '0010001', '0010001', '0010001', '1110111', '1110111', '0000000'),
  cat: b('1000001', '1100011', '1111111', '1010101', '1111111', '1101011', '0111110'),
  clock: b('0111110', '1001001', '1001001', '1001111', '1000001', '1000001', '0111110'),
  sun: b('0001000', '0100010', '0011100', '1011101', '0011100', '0100010', '0001000'),
  moon: b('0011110', '0111000', '1110000', '1110000', '1110000', '0111000', '0011110'),
  exclaim: b('0011100', '0011100', '0011100', '0001000', '0001000', '0000000', '0001000'),
  question: b('0111110', '1100011', '0000110', '0001100', '0001100', '0000000', '0001100'),
  down: b('0011100', '0011100', '0011100', '1111111', '0111110', '0011100', '0001000'),
  left: b('0001000', '0011000', '0111111', '1111111', '0111111', '0011000', '0001000'),
  right: b('0001000', '0001100', '1111110', '1111111', '1111110', '0001100', '0001000'),
  shoe: b('0011000', '0011100', '0011110', '0111111', '1111111', '1111111', '0000000'),
  menu: b('0000000', '1111111', '0000000', '1111111', '0000000', '1111111', '0000000'),
  cloud: b('0000000', '0011000', '0111110', '1111111', '1111111', '0111110', '0000000'),
  rain: b('0011000', '0111110', '1111111', '0000000', '0100100', '1001001', '0010010'),
  storm: b('0011000', '0111110', '1111111', '0001100', '0011000', '0001100', '0011000'),
  fog: b('0000000', '1111110', '0000000', '0111111', '0000000', '1111110', '0000000'),
  pin: b('0011100', '0111110', '0110110', '0111110', '0011100', '0001000', '0001000'),
  dpad: b('0011100', '0011100', '1111111', '1110111', '1111111', '0011100', '0011100'),
  back: b('0001000', '0011000', '0111111', '1111111', '0111111', '0011000', '0001000'),
  bell: b('0001000', '0011100', '0111110', '0111110', '0111110', '1111111', '0001000'),
};

// ---------------------------------------------------------------- big icons
// {c: default tint, a: default secondary, m: mask rows}
export const BIG = {
  heart: { c: '#ff5a64', m: ['.bbb.bbb.', 'bwwbbbbbb', 'bwbbbbbbb', 'bbbbbbbbb', '.bbbbbbb.', '..bbbbb..', '...bbb...', '....b....'] },
  star: { c: '#ffcf5a', m: ['....b....', '...bbb...', '...bwb...', 'bbbbbbbbb', '.bbbbbbb.', '..bbbbb..', '..bbbbb..', '.bbb.bbb.', '.bb...bb.'] },
  coin: { c: '#ffd75a', a: '#e8a63a', m: ['..bbbbb..', '.bwhhhhb.', 'bwaaaaaab', 'bhaayaaab', 'bhayyyaab', 'bhaayaaab', 'baaaaaaab', '.bYaaaYb.', '..YYYYY..'] },
  house: { c: '#ff7a5a', m: ['....bb....', '...bbbb...', '..bbbbbb..', '.bbbbbbbb.', 'bbbbbbbbbb', '.llllllll.', '.lcwllnnl.', '.lccllnnl.', '.lllllnyl.', '.lllllnnl.'] },
  door: { c: '#c07a44', m: ['mmmmmmmm', 'mnnnnnnm', 'mnNNNNnm', 'mnNNNNnm', 'mnnnnnnm', 'mnnnnnym', 'mnNNNNnm', 'mnNNNNnm', 'mnnnnnnm', 'mmmmmmmm'] },
  bag: { c: '#f08a50', a: '#c0603e', m: ['...nnnn...', '..n....n..', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbbbbbbbbb', 'BBBByyBBBB', 'aaaayyaaaa', 'aaaaaaaaaa', 'aaaaaaaaaa', '.aaaaaaaa.'] },
  party: { c: '#ffb35a', a: '#5fd8e8', m: ['......aa.a..', '.....aaaaa..', '.....aaaaaa.', 'bb..bawaawa.', 'bbbbbaoaaoa.', 'bbbbbbaaaaa.', 'bwobbwoaaa..', 'boobboobb...', 'bpbbbbbpb...', 'bbbbobbbb...', '.bbbbbbb....'] },
  save: { c: '#5f78e8', m: ['bbbbbbbbb.', 'bbmmmmmbbb', 'bbmmMmmbbb', 'bbmmmmmbbb', 'bbbbbbbbbb', 'bllllllllb', 'blLLLLLLlb', 'bllllllllb', 'blLLLLLLlb', 'bbbbbbbbbb'] },
  gear: { c: '#cdbb9c', m: ['....bb....', '.bb.bb.bb.', '.bwbbbbbb.', '..bbbbbb..', 'bbbb..bbbb', 'bbbb..bbbb', '..bbbbbb..', '.bbbbbbbb.', '.bb.bb.bb.', '....bb....'] },
  map: { c: '#f4ead8', a: '#d8c8a8', m: ['bbbaaabbbaaa', 'bggaaabbbaca', 'bgggaarrbaca', 'bbggaaarbcca', 'bbbgaaarrcaa', 'bbbbaaaaraaa', 'bbbbaaaaayaa', 'bbbbaaaayyya', 'bbbbaaaaayaa', 'bbbaaabbbaaa'] },
  check: { c: '#7ce07a', m: ['........bb', '.......bbb', '......bbb.', 'bb...bbb..', 'bbb.bbb...', '.bbbbb....', '..bbb.....', '...b......'] },
  cross: { c: '#ff5a64', m: ['bb....bb', 'bbb..bbb', '.bbbbbb.', '..bbbb..', '..bbbb..', '.bbbbbb.', 'bbb..bbb', 'bb....bb'] },
  talk: { c: '#8fd8e8', m: ['.bbbbbbb.', 'bbbbbbbbb', 'bbbbbbbbb', 'bbobobobb', 'bbbbbbbbb', '.bbbbbbb.', '..bbb....', '..bb.....', '.b.......'] },
  phone: { c: '#4f8a86', m: ['.bbbbb.', 'bbbobbb', 'bwcccbb', 'bcwcccb', 'bcccccb', 'bcccccb', 'bCCCCCb', 'bCCCCCb', 'bbbybbb', '.bbbbb.'] },
  eye: { c: '#5fd8e8', m: ['...llll...', '.llbbbbll.', 'llbwoobbll', 'llbboobbll', '.llbbbbll.', '...llll...'] },
  hand: { c: '#ffd2b0', m: ['...bb.....', '...bb.....', '...bb.....', '...bbbbbb.', '.b.bBbBbBb', 'bbbbbbbbbb', 'bbbbbbbbbb', '.bbbbbbbb.', '..bbbbbb..'] },
  bed: { c: '#ff7ab8', m: ['nn........', 'nn........', 'nnll......', 'nnllbbbbbb', 'nnllbbbbbb', 'nnnnnnnnnn', 'n........n'] },
  tv: { c: '#9a7a5a', m: ['.*....*...', '..*..*....', '...**.....', 'bbbbbbbbbb', 'bwcccccbmb', 'bccccccbbb', 'bccccccbmb', 'bCCCCCCbbb', 'bbbbbbbbbb', '.b......b.'] },
  fridge: { c: '#d8eef4', m: ['.bbbbbb.', 'bbbbbbbb', 'bbbbbbmb', 'bbbbbbmb', 'bbbbbbbb', 'BBBBBBBB', 'bbbbbbbb', 'bbbbbbmb', 'bbbbbbmb', 'bbbbbbbb', '.B....B.'] },
  book: { c: '#7a5ae0', m: ['Bbbbbbbb..', 'Bbbbbbbbl.', 'Bbbyybbbl.', 'Bbyyyybbl.', 'Bbbyybbbl.', 'Bbbbbbbbl.', 'Bbbbbbbbl.', 'Bbbbbbbbl.', '.lllllllL.'] },
  pc: { c: '#9ab0b0', m: ['bbbbbbbbbb', 'bwcccccccb', 'bcCCCcCccb', 'bccccccccb', 'bcCCcCCCcb', 'bccccccccb', 'bbbbbbbbbb', '....bb....', '..bbbbbb..'] },
  music: { c: '#ff7ab8', m: ['...bbbbbbb', '...bbbbbbb', '...b.....b', '...b.....b', '...b.....b', '.bbb...bbb', 'bbbb..bbbb', 'bbbb..bbbb', '.bb....bb.'] },
  cat: { c: '#f0b878', m: ['b........b', 'bp......pb', 'bbbbbbbbbb', 'bbbbbbbbbb', 'bbobbbbobb', 'bbobbbbobb', 'bbbbppbbbb', 'bbbobbobbb', '.bbbbbbbb.'] },
  clock: { c: '#ffcf5a', m: ['...bbbb...', '.bbllllbb.', '.blllolllb', 'bllllolllb', 'bllllolllb', 'bllllooolb', 'bllllllllb', '.bllllllb.', '.bbllllbb.', '...bbbb...'] },
  sun: { c: '#ffc23a', m: ['....b....', '.b.....b.', '...bbb...', '..bwbbb..', 'b.bbbbb.b', '..bbbbb..', '...bbb...', '.b.....b.', '....b....'] },
  moon: { c: '#ffe89a', m: ['..bbbb...', '.bbbb...*', 'bbbb.....', 'bbb...*..', 'bbb......', 'bbb......', 'bbbb...b.', '.bbbbbbb.', '..bbbbb..'] },
  exclaim: { c: '#ffcf5a', m: ['.bb.', 'bbbb', 'bbbb', 'bbbb', '.bb.', '.bb.', '....', '.bb.', '.bb.'] },
  question: { c: '#5fd8e8', m: ['.bbbb.', 'bb..bb', '....bb', '...bb.', '..bb..', '..bb..', '......', '..bb..', '..bb..'] },
  up: { c: '#fff4dc', m: ['....b....', '...bbb...', '..bbbbb..', '.bbbbbbb.', 'bbbbbbbbb', '...bbb...', '...bbb...', '...bbb...'] },
  shoe: { c: '#ff6a5a', m: ['...bbbb.....', '...bwbbb....', '...blblbb...', '..bblblbbbb.', '.bbbbbbbbbbb', 'bbbbbbbbbbbb', 'llllllllllll', '.LLLLLLLLLL.'] },
  bolt: { c: '#ffe23a', m: ['....bbb', '...bbb.', '..bbb..', '.bbbbbb', '...bbb.', '..bbb..', '.bb....', 'b......'] },
  disc: { c: '#ff8a6a', m: ['..kkkkk..', '.kwkkkkk.', 'kkkbbbkkk', 'kkbbobbkk', 'kkbbbbbkk', 'kkkbbbkKk', '.kkkkKkk.', '..kkkkk..'] },
  fist: { c: '#ffd2b0', m: ['.bbbbbbb.', 'bbBbbBbBb', 'bbBbbBbBb', 'bbbbbbbbb', 'BBBBbbbbb', 'bbbBbbbbb', '.bbbbbbb.', '..bbbbb..', '..rrrrr..'] },
  shield: { c: '#5fd8e8', a: '#ffcf5a', m: ['aaaaaaaa', 'abbbbbba', 'abwbbbba', 'abbbbbba', 'abbbbbba', '.abbbba.', '..abba..', '...aa...'] },
  swap: { c: '#fff4dc', m: ['..b......', '.bbbbbbb.', '..b......', '.........', '......b..', '.bbbbbbb.', '......b..'] },
  dodge: { c: '#8ff0c0', m: ['...bbbbb..', '.......b..', 'bbbbbbbb..', '..........', '.bbbbbbbbb', '........b.', '..bbbbbb..'] },
  link: { c: '#5fd8e8', a: '#ff7ab8', m: ['bb.bb.....', 'bbbbb.....', '.bbbaa.aa.', '..baaaaaaa', '....aaaaa.', '.....aaa..', '......a...'] },
  bowl: { c: '#ff5a64', m: ['..*..*....', '...*..*...', '..*..*....', 'yyyyyyyyyy', 'bbbbbbbbbb', 'bwbbbbbbbb', '.bbbbbbbb.', '..bbbbbb..', '...BBBB...'] },
  smile: { c: '#ffcf5a', m: ['..bbbbb..', '.bbbbbbb.', 'bbobbbobb', 'bbobbbobb', 'bbbbbbbbb', 'bobbbbbob', 'bbooooobb', '.bbbbbbb.', '..bbbbb..'] },
  flame: { c: '#ff6a2b', a: '#ffcf5a', m: ['....b.....', '...bb.....', '...bbb....', '..bbbb.b..', '.bbbabbbb.', '.bbaaabbb.', 'bbbaaaabbb', 'bbaawaaabb', '.bbaaaabb.', '..bbbbbb..'] },
  drop: { c: '#2fa8ff', m: ['...b...', '...b...', '..bbb..', '.bbbbb.', 'bwbbbbb', 'bwbbbbb', 'bbbbbbb', '.bbbbb.', '..bbb..'] },
  leaf: { c: '#5fd35a', m: ['.....bbbb', '...bbbbbb', '..bbbbbGb', '.bbbbbGbb', '.bbbbGbbb', 'bbbbGbbb.', 'bbbGbbb..', 'bbGbbb...', 'G........'] },
  play: { c: '#ffcf5a', m: ['b......', 'bbb....', 'bbbbb..', 'bbbbbbb', 'bbbbb..', 'bbb....', 'b......'] },
  menu: { c: '#fff4dc', m: ['bbbbbbbbb', 'bbbbbbbbb', '.........', 'bbbbbbbbb', 'bbbbbbbbb', '.........', 'bbbbbbbbb', 'bbbbbbbbb'] },
  cloud: { c: '#f6f4ee', m: ['...bbb....', '..bbbbbbb.', '.bbbbbbbbb', 'bbbbbbbbbb', 'bbbbbbbbbb', '.bbbbbbbb.'] },
  rain: { c: '#d8dce4', m: ['...bbb....', '..bbbbbbb.', '.bbbbbbbbb', 'bbbbbbbbbb', '.bbbbbbbb.', '..........', '.c..c..c..', 'c..c..c...'] },
  storm: { c: '#9aa0b0', m: ['...bbb....', '..bbbbbbb.', '.bbbbbbbbb', 'bbbbbbbbbb', '.bbbyybbb.', '....yy....', '...yy.....', '....y.....'] },
  fog: { c: '#dcdcd4', m: ['.bbbbbbb..', '..........', '...bbbbbbb', '..........', 'bbbbbbbb..', '..........', '..bbbbbbbb'] },
  pin: { c: '#ff6a5a', m: ['..bbb..', '.bbbbb.', 'bbbwbbb', 'bbwwwbb', 'bbbwbbb', '.bbbbb.', '..bbb..', '...b...'] },
  dpad: { c: '#f2e2c4', m: ['...bbb...', '...bwb...', '...bbb...', 'bbbbbbbbb', 'bwbbBbbwb', 'bbbbbbbbb', '...bbb...', '...bwb...', '...bbb...'] },
  zoom: { c: '#c07a44', a: '#7fd0e6', m: ['.bbbb.....', 'bawaab....', 'bwaaab....', 'baaaab....', '.bbbbn....', '.....nn...', '......nn..', '.......nn.', '........n.'] },
  bell: { c: '#ffcf5a', m: ['....b....', '...bbb...', '..bwbbb..', '..bbbbb..', '.bbbbbbb.', '.bbbbbbb.', 'bbbbbbbbb', '....B....'] },
};
BIG.down = { c: BIG.up.c, m: BIG.up.m.slice().reverse() };
BIG.left = { c: BIG.up.c, m: transpose(BIG.up.m) };
BIG.right = { c: BIG.up.c, m: transpose(BIG.up.m).map((r) => [...r].reverse().join('')) };
BIG.back = BIG.left;
function transpose(m) { const W = Math.max(...m.map((r) => r.length)); const out = []; for (let i = 0; i < W; i++) { let s = ''; for (let j = 0; j < m.length; j++) s += m[j][i] || '.'; out.push(s); } return out; }

// aliases (names callers may use)
const ALIAS = { magnify: 'zoom', camera: 'eye', move: 'dpad', team: 'party', chat: 'talk', examine: 'eye', use: 'hand', run: 'shoe', exclamation: 'exclaim', options: 'gear', settings: 'gear', close: 'cross', quest: 'star', money: 'coin', location: 'pin', home: 'house', bond: 'link', food: 'bowl', computer: 'pc', note: 'music', time: 'clock', night: 'moon', day: 'sun', arrows: 'dpad', keys: 'dpad', weather: 'cloud' };
export const iconName = (n) => (BIG[n] || SMALL[n] ? n : ALIAS[n] || n);
export const ICON_NAMES = [...new Set([...Object.keys(HQ), ...Object.keys(BIG), ...Object.keys(SMALL)])];


const FIXED = {
  r: '#ff5a64', y: '#ffcf5a', c: '#5fd8e8', g: '#6fd36a', n: '#b07040', k: '#5a3a22', m: '#b8aa98', l: '#f4ead8', p: '#ff8ab8', s: '#ffd2b0', v: '#9b7cf0', f: '#ff8a6a', e: '#4a7ae8',
};
const FIX16 = {
  r: '#ff4d5e', f: '#ff8a3a', y: '#ffd23a', g: '#5fd84a', c: '#3ad8f0', e: '#4a7aff', v: '#a07aff', p: '#ff8ac8', n: '#c07a44', l: '#fff4d8', k: '#3a3a5a', m: '#c8cce0', s: '#ffd0a8',
};
export const hqName = (n) => (HQ[n] ? n : HQ_ALIAS[n] && HQ[HQ_ALIAS[n]] ? HQ_ALIAS[n] : null);

// ---------------------------------------------------------------- compile a mask into a packed-colour grid
// returns { w, h, cells: Uint32Array (w×h incl. a 1 px outline ring), solid: Uint8Array }
const gridCache = new Map();
function compileGrid(m, pal, c, a, dim, hq) {
  const H = m.length, W = Math.max(...m.map((r) => r.length)), w = W + 2, h = H + 2;
  const at = (i, j) => (j >= 0 && j < H && i >= 0 && i < W ? m[j][i] || '.' : '.');
  const solid = (ch) => ch !== '.' && ch !== '*';
  const colorful = (ch) => solid(ch) && ch !== 'o';
  const dimC = (col) => (dim ? mx(col, '#8088b0', dim) : col);
  const tone = (ch) => {
    const lo = ch.toLowerCase();
    if (ch === 'h') { const hc = hq ? '#ffffff' : sh(c, 0.9); return [hc, hc, hc]; }
    const base = dimC(lo === 'b' ? c : lo === 'a' ? a : pal[lo] || c);
    return ch !== lo ? [sh(base, -1.5), sh(base, -1.1), sh(base, -0.8)] : [sh(base, -0.7), base, sh(base, 0.8)];
  };
  const cells = new Uint32Array(w * h), out = new Uint8Array(w * h), ink = P(T.ink);
  for (let j = -1; j <= H; j++) for (let i = -1; i <= W; i++) {
    const ch = at(i, j), k = (j + 1) * w + (i + 1);
    let col = null;
    if (ch === 'o') col = T.ink;
    else if (ch === 'w') col = dimC('#ffffff');
    else if (ch === '*') col = dim ? '#a0a8c8' : '#fff6d8';
    else if (colorful(ch)) {
      const [d, bb, l] = tone(ch), up = !colorful(at(i, j - 1)), dn = !colorful(at(i, j + 1)), rt = !colorful(at(i + 1, j));
      col = up && !dn ? l : dn && !up ? d : rt && !up ? d : bb;
    } else if (colorful(at(i - 1, j)) || colorful(at(i + 1, j)) || colorful(at(i, j - 1)) || colorful(at(i, j + 1))) { cells[k] = ink; out[k] = 1; continue; }
    if (col) cells[k] = P(col);
  }
  return { w, h, cells, out };
}
// the sprite canvas for an icon: { cv, w, h } in art pixels (outline included; one extra row for the shadow)
const spriteCache = new Map();
function iconSprite(name, c, o) {
  const hq = !o.lo && hqName(name), shadow = o.shadow !== false, outline = o.outline !== false, dim = o.dim || 0;
  const key = (hq ? 'H' : 'B') + (hq || name) + '|' + (c || '') + '|' + (o.tint2 || '') + '|' + dim + (shadow ? 's' : '') + (outline ? 'o' : '') + (o.ink || '');
  let S = spriteCache.get(key);
  if (S) return S;
  let G;
  if (hq) { const I = HQ[hq]; G = compileGrid(I.m, FIX16, c || I.c, o.tint2 || I.a || (c ? sh(c, -0.8) : I.c), dim, true); }
  else { const I = BIG[name]; if (!I) return null; G = compileGrid(I.m, FIXED, c || I.c, o.tint2 || I.a || (c ? sh(c, -0.8) : I.c), dim, false); }
  const w = G.w, h = G.h + 1, inkV = o.ink ? P(o.ink) : P(T.ink), shV = pa(T.shade, 0.38);
  const cv = pixelCanvas(w, h, (d) => {
    if (shadow) for (let j = 0; j < G.h; j++) for (let i = 0; i < w; i++) if (G.cells[j * w + i]) d[(j + 1) * w + i] = shV;
    for (let j = 0; j < G.h; j++) for (let i = 0; i < w; i++) {
      const v = G.cells[j * w + i]; if (!v) continue;
      if (G.out[j * w + i]) { if (outline) d[j * w + i] = inkV; else if (!shadow) d[j * w + i] = 0; }
      else d[j * w + i] = v;
    }
  });
  S = { cv, w, h, hq: !!hq };
  if (spriteCache.size > 600) spriteCache.clear();
  spriteCache.set(key, S);
  return S;
}
// whole-pixel placement on the art grid: q art pixels per icon pixel
function blitArt(s, S, x, y, q) {
  const g = s.ui.g; g.imageSmoothingEnabled = false;
  g.drawImage(S.cv, Math.round(x), Math.round(y), S.w * q, S.h * q);
}

// ---------------------------------------------------------------- drawing
// small icon: auto-bevelled single colour + optional 1px drop shadow, in an 8-unit box
const smallCache = new Map();
export function drawSmall(s, name, x, y, c = T.text, shadow = T.ink) {
  if (!s || !s.ui) return;
  const g0 = SMALL[name] || SMALL[ALIAS[name]];
  if (!g0) { if (BIG[iconName(name)] || hqName(name)) drawBig(s, name, x - 2, y - 2, c, { outline: true }); return; }
  const key = (SMALL[name] ? name : ALIAS[name]) + '|' + c + '|' + (shadow || '');
  let S = smallCache.get(key);
  if (!S) {
    const on = (r, k) => r >= 0 && r < 7 && k >= 0 && k < 7 && (g0[r] & (1 << (6 - k)));
    const lit = P(sh(c, 0.9)), base = P(c), dark = P(sh(c, -0.7)), sv = shadow ? P(shadow) : 0;
    const cv = pixelCanvas(8, 8, (d) => {
      if (sv) for (let r = 0; r < 7; r++) for (let k = 0; k < 7; k++) if (on(r, k)) d[(r + 1) * 8 + k + 1] = sv;
      for (let r = 0; r < 7; r++) for (let k = 0; k < 7; k++) { if (!on(r, k)) continue; const up = !on(r - 1, k), dn = !on(r + 1, k); d[r * 8 + k] = up && !dn ? lit : dn && !up ? dark : base; }
    });
    S = { cv, w: 8, h: 8 };
    if (smallCache.size > 600) smallCache.clear();
    smallCache.set(key, S);
  }
  blitArt(s, S, x, y, 1);
}
export function bigSize(name) { const h = hqName(name); const I = h ? HQ[h] : BIG[iconName(name)]; if (!I) return { w: 12, h: 12 }; return { w: Math.max(...I.m.map((r) => r.length)) + 2, h: I.m.length + 2 }; }
// draws centred inside a 12×12 box at (x, y) (o.scale: a 12·scale box). c: tint (null → the icon's own colours)
// o: { scale, outline (default true), shadow (default true), tint2, dim (0..1), lo (force the 12 px art), ink }
export function drawBig(s, name, x, y, c, o = {}) {
  if (!s || !s.ui) return;
  const n = iconName(name), box = 12 * (o.scale || 1), useHQ = !o.lo && hqName(name) && (box >= 14 || !BIG[n]);
  if (!useHQ && !BIG[n]) { if (SMALL[n]) drawSmall(s, n, x + 2, y + 2, c || T.text, T.ink); return; }
  const S = iconSprite(useHQ ? name : n, c, o); if (!S || !S.cv) return;
  // HQ art fills the box in whole pixels; the 12 px art scales by the box in whole steps
  const q = S.hq ? Math.max(1, Math.floor((box + 3) / Math.max(S.w, S.h - 1))) : Math.max(1, Math.round(box / 12));
  const dw = S.w * q, dh = (S.h - 1) * q;
  blitArt(s, S, x + (box - dw) / 2, y + (box - dh) / 2, q);
}
// an icon at any size: fits the art into a size×size box (centred), crisp
export function drawIconFit(s, name, x, y, size, c, o = {}) { drawBig(s, name, x, y, c, Object.assign({}, o, { scale: size / 12 })); }

// ---------------------------------------------------------------- emblems: Scale2x stickers
const emblemCache = new Map();
export function emblemSprite(name, scale = 4, tint = null) {
  const key = name + scale + tint;
  let E = emblemCache.get(key);
  if (E) return E;
  const n = iconName(name), hq = hqName(name), I = hq ? HQ[hq] : BIG[n];
  if (!I) return null;
  const G = compileGrid(I.m, hq ? FIX16 : FIXED, tint || I.c, I.a || (tint ? sh(tint, -0.8) : I.c), 0, !!hq);
  let w = G.w, h = G.h, d = new Uint32Array(w * h);
  for (let i = 0; i < d.length; i++) d[i] = G.out[i] ? 0 : G.cells[i];
  for (let k = 2; k <= scale; k *= 2) { const r = scale2x(d, w, h); d = r.d; w = r.w; h = r.h; }
  // ink, white, ink rings
  let pad = 4, W = w + pad * 2, Hh = h + pad * 2, D = new Uint32Array(W * Hh);
  for (let j = 0; j < h; j++) D.set(d.subarray(j * w, j * w + w), (j + pad) * W + pad);
  for (const col of [T.ink, '#ffffff', T.ink]) D = ring(D, W, Hh, P(col));
  const cv = pixelCanvas(W, Hh, (o) => o.set(D));
  E = { cv, w: W, h: Hh };
  emblemCache.set(key, E);
  return E;
}
function ring(D, W, H, v) {
  const out = D.slice();
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (D[j * W + i]) continue;
    if ((i > 0 && D[j * W + i - 1]) || (i < W - 1 && D[j * W + i + 1]) || (j > 0 && D[(j - 1) * W + i]) || (j < H - 1 && D[(j + 1) * W + i])) out[j * W + i] = v;
  }
  return out;
}
// Scale2x / EPX: doubles pixel art while keeping diagonals crisp
function scale2x(d, w, h) {
  const W = w * 2, o = new Uint32Array(W * h * 2);
  const at = (x, y) => d[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P0 = d[y * w + x], a = at(x, y - 1), b2 = at(x + 1, y), c = at(x - 1, y), e = at(x, y + 1), i = y * 2 * W + x * 2;
    o[i] = c === a && c !== e && a !== b2 ? a : P0;
    o[i + 1] = a === b2 && a !== c && b2 !== e ? b2 : P0;
    o[i + W] = e === c && e !== b2 && c !== a ? c : P0;
    o[i + W + 1] = b2 === e && b2 !== a && e !== c ? e : P0;
  }
  return { d: o, w: W, h: h * 2 };
}
// draw an emblem centred on (cx, cy), one unit per art pixel (whole screen pixels)
export function drawEmblem(s, name, cx, cy, scale = 4, tint = null, size = 0) {
  if (!s || !s.ui) return;
  const E = emblemSprite(name, scale, tint); if (!E) return;
  const q = size ? Math.max(1, Math.floor(size / E.w + 0.3)) : 1;
  const dw = E.w * q, dh = E.h * q;
  blitArt(s, E, cx - dw / 2, cy - dh / 2, q);
}
