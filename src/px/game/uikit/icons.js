// Pixel-art icons, rendered in HIGH DEFINITION. The masks below (7×7 glyphs, 12 px BIG art, 14 px HQ art in
// icons16.js) are the designs; at draw time each is upscaled to the size it is shown at on screen (Scale2x /
// Scale3x, so diagonals stay clean), then every colour region is shaded like hand-made pixel art: a bevel from
// a distance field (lit rims top-left, shaded rims bottom-right), a 5-step colour ramp with dithered volume,
// speculars on shiny materials (metal, glass, gold), wood grain, darker separation lines where regions meet,
// a crisp 1-px near-black outline and a soft drop shadow. Cached per name / size / tint.
//  • drawSmall(s, name, x, y, c): a single-colour glyph in an 8-unit box
//  • drawBig(s, name, x, y, c, o): full-colour art in a 12·scale-unit box (HQ art when it exists)
//  • drawEmblem(s, name, cx, cy, …): a big sticker (white rim) version
import { P } from '../../surface.js';
import { HQ, HQ_ALIAS } from './icons16.js';
import { pixelCanvas, blit, blitP, PX, PY } from './gfx.js';
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



const FIXED = { r: '#ff5a64', y: '#ffcf5a', c: '#5fd8e8', g: '#6fd36a', n: '#b07040', k: '#5a3a22', m: '#b8aa98', l: '#f4ead8', p: '#ff8ab8', s: '#ffd2b0', v: '#9b7cf0', f: '#ff8a6a', e: '#4a7ae8' };
const FIX16 = { r: '#ff4d5e', f: '#ff8a3a', y: '#ffd23a', g: '#5fd84a', c: '#3ad8f0', e: '#4a7aff', v: '#a07aff', p: '#ff8ac8', n: '#c07a44', l: '#fff4d8', k: '#3a3a5a', m: '#c8cce0', s: '#ffd0a8' };
const SHINY = new Set(['m', 'c', 'y', 'e']);
export const hqName = (n) => (HQ[n] ? n : HQ_ALIAS[n] && HQ[HQ_ALIAS[n]] ? HQ_ALIAS[n] : null);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

// ---------------------------------------------------------------- label grids
// a design → { w, h, lab: Int32Array of region codes (0 empty), info: Map(code → { col, kind }) }
function labels(m, pal, c, a, dimK) {
  const H = m.length, W = Math.max(...m.map((r) => r.length)), lab = new Int32Array(W * H), info = new Map();
  const dimC = (col) => (dimK ? mx(col, '#8a8070', dimK) : col);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const ch = m[j][i] || '.'; if (ch === '.') continue;
    const code = ch.charCodeAt(0); lab[j * W + i] = code;
    if (info.has(code)) continue;
    const lo = ch.toLowerCase();
    let col, kind = lo;
    if (ch === 'o') { col = T.ink; kind = 'ink'; }
    else if (ch === 'w' || ch === 'h') { col = '#ffffff'; kind = 'white'; }
    else if (ch === '*') { col = '#fff6d8'; kind = 'white'; }
    else { col = lo === 'b' ? c : lo === 'a' ? a : pal[lo] || c; if (ch !== lo) col = sh(col, -1.1); }
    info.set(code, { col: dimC(col), kind, mat: lo === 'b' || lo === 'a' ? 'tint' : lo });
  }
  return { w: W, h: H, lab, info };
}
// Scale2x / Scale3x on label grids (diagonals stay crisp)
function scale2(L, w, h) {
  const W = w * 2, o = new Int32Array(W * h * 2), at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : L[y * w + x]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const E = L[y * w + x], B = at(x, y - 1), D = at(x - 1, y), F = at(x + 1, y), H = at(x, y + 1), i = y * 2 * W + x * 2;
    if (B !== H && D !== F) { o[i] = D === B ? D : E; o[i + 1] = B === F ? F : E; o[i + W] = D === H ? D : E; o[i + W + 1] = H === F ? F : E; }
    else { o[i] = o[i + 1] = o[i + W] = o[i + W + 1] = E; }
  }
  return { L: o, w: W, h: h * 2 };
}
function scale3(L, w, h) {
  const W = w * 3, o = new Int32Array(W * h * 3), at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : L[y * w + x]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const A = at(x - 1, y - 1), B = at(x, y - 1), C = at(x + 1, y - 1), D = at(x - 1, y), E = L[y * w + x], F = at(x + 1, y), G = at(x - 1, y + 1), H = at(x, y + 1), I = at(x + 1, y + 1);
    let e = [E, E, E, E, E, E, E, E, E];
    if (B !== H && D !== F) {
      e = [D === B ? D : E, (D === B && E !== C) || (B === F && E !== A) ? B : E, B === F ? F : E, (D === B && E !== G) || (D === H && E !== A) ? D : E, E, (B === F && E !== I) || (H === F && E !== C) ? F : E, D === H ? D : E, (D === H && E !== I) || (H === F && E !== G) ? H : E, H === F ? F : E];
    }
    const i0 = y * 3 * W + x * 3;
    for (let k = 0; k < 9; k++) o[i0 + Math.floor(k / 3) * W + (k % 3)] = e[k];
  }
  return { L: o, w: W, h: h * 3 };
}
function upscale(L, w, h, f) {
  let G = { L, w, h };
  const steps = f === 2 ? [2] : f === 3 ? [3] : f === 4 ? [2, 2] : f === 6 ? [2, 3] : f === 8 ? [2, 2, 2] : f === 9 ? [3, 3] : f === 12 ? [2, 2, 3] : [];
  for (const s of steps) G = s === 2 ? scale2(G.L, G.w, G.h) : scale3(G.L, G.w, G.h);
  return G;
}
const FACTORS = [1, 2, 3, 4, 6, 8, 9, 12];
export const pickFactor = (want) => { let f = 1; for (const q of FACTORS) if (q <= want) f = q; return f; };

// ---------------------------------------------------------------- the shader
// paint a label grid as HD pixel art; o: { outline, shadow, ring (white sticker rim px) } → canvas
function shade(G, info, f, o = {}) {
  const { L, w, h } = G, pad = (o.ring || 0) + 3, W = w + pad * 2, H = h + pad * 2 + 1;
  // distance (in px) from each pixel to its region's edge, capped
  const D = new Uint8Array(w * h), CAP = Math.max(3, Math.round(f * 1.5) + 1);
  for (let i = 0; i < w * h; i++) D[i] = L[i] ? CAP : 0;
  const lab = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : L[y * w + x]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x, l = L[i]; if (!l) continue; let d = D[i]; if (lab(x - 1, y) !== l) d = 1; else d = Math.min(d, D[i - 1] + 1); if (lab(x, y - 1) !== l) d = 1; else d = Math.min(d, D[i - w] + 1); D[i] = d; }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x, l = L[i]; if (!l) continue; let d = D[i]; if (lab(x + 1, y) !== l) d = 1; else d = Math.min(d, D[i + 1] + 1); if (lab(x, y + 1) !== l) d = 1; else d = Math.min(d, D[i + w] + 1); D[i] = d; }
  const dist = (x, y, l) => (x < 0 || y < 0 || x >= w || y >= h || L[y * w + x] !== l ? 0 : D[y * w + x]);
  // region bounding boxes (for the volume shading)
  const box = new Map();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const l = L[y * w + x]; if (!l) continue; let B = box.get(l); if (!B) box.set(l, (B = [y, y])); if (y < B[0]) B[0] = y; if (y > B[1]) B[1] = y; }
  const ramps = new Map();
  const rampOf = (l) => { let R = ramps.get(l); if (!R) { const c = info.get(l).col; R = [P(sh(c, -1.25)), P(sh(c, -0.6)), P(c), P(sh(c, 0.55)), P(mx(c, '#ffffff', 0.62))]; ramps.set(l, R); } return R; };
  const ink = P(T.ink), shadow = pa(T.shade, 0.32), white = P('#ffffff'), bevel = Math.max(1, Math.round(f * 0.75));
  return pixelCanvas(W, H, (d) => {
    const put = (x, y, v) => { d[(y + pad) * W + x + pad] = v; };
    // shadow, outline(s)
    const solid = (x, y) => lab(x, y) !== 0;
    for (let y = -pad; y < h + pad; y++) for (let x = -pad; x < w + pad; x++) {
      if (solid(x, y)) continue;
      let near = false; for (let q = -1; q <= 1 && !near; q++) for (let p = -1; p <= 1; p++) if ((p || q) && Math.abs(p) + Math.abs(q) === 1 && solid(x + p, y + q)) { near = true; break; }
      if (near && o.outline !== false) put(x, y, ink);
    }
    if (o.ring) {
      // white sticker rim, then ink again
      const isIn = (x, y) => solid(x, y) || (x >= -pad && y >= -pad && x < w + pad && y < h + pad && d[(y + pad) * W + x + pad] === ink);
      const ringPx = [];
      for (let y = -pad + 1; y < h + pad - 1; y++) for (let x = -pad + 1; x < w + pad - 1; x++) { if (isIn(x, y)) continue; let dd = 9; for (let q = -o.ring; q <= o.ring; q++) for (let p = -o.ring; p <= o.ring; p++) if (Math.hypot(p, q) <= o.ring + 0.3 && isIn(x + p, y + q)) dd = Math.min(dd, Math.hypot(p, q)); if (dd < 9) ringPx.push(x, y); }
      for (let k = 0; k < ringPx.length; k += 2) put(ringPx[k], ringPx[k + 1], white);
      for (let y = -pad + 1; y < h + pad - 1; y++) for (let x = -pad + 1; x < w + pad - 1; x++) { if (d[(y + pad) * W + x + pad]) continue; if (d[(y + pad - 1) * W + x + pad] === white || d[(y + pad + 1) * W + x + pad] === white || d[(y + pad) * W + x + pad - 1] === white || d[(y + pad) * W + x + pad + 1] === white) put(x, y, ink); }
    }
    if (o.shadow !== false) for (let y = -pad; y < h + pad - 1; y++) for (let x = -pad; x < w + pad - 1; x++) { const i = (y + pad) * W + x + pad; if (d[i]) continue; const s1 = (y + pad - 1 >= 0 && x + pad - 1 >= 0) ? d[(y + pad - 1) * W + x + pad - 1] : 0; if (s1 && s1 !== shadow) d[i] = shadow; }
    // the regions
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const l = L[y * w + x]; if (!l) continue;
      const I = info.get(l);
      if (I.kind === 'ink') { put(x, y, ink); continue; }
      const R = rampOf(l), dd = D[y * w + x];
      // inward normal from the distance field → how lit this rim is (light from the top-left)
      const nx = dist(x + 1, y, l) - dist(x - 1, y, l), ny = dist(x, y + 1, l) - dist(x, y - 1, l), nl = Math.hypot(nx, ny) || 1;
      const lit = (nx * 0.55 + ny * 0.83) / nl;     // > 0: the rim faces the light
      let t = 2;
      if (dd <= bevel) t = lit > 0.35 ? 3 : lit < -0.35 ? 1 : 2;
      if (dd === 1) t = lit > 0.5 ? 4 : lit < -0.3 ? 0 : t;
      if (dd > bevel) { const B = box.get(l), v = (y - B[0]) / Math.max(1, B[1] - B[0]); if (v < 0.3 && bay(x, y) < (0.3 - v) * 2.2) t = 3; else if (v > 0.7 && bay(x, y) < (v - 0.7) * 2.2) t = 1; }
      // speculars on shiny materials; grain on wood; specks on paper
      if (SHINY.has(I.mat) && dd >= bevel && dd <= bevel + Math.max(1, f >> 1) && lit > 0.6) t = 4;
      if (I.mat === 'n' && dd > bevel && ((y + ((x * 5) >> 3)) % Math.max(3, f * 2)) === 0 && bay(x, y) < 0.7) t = Math.min(t, 1);
      if (I.kind === 'white') t = Math.min(4, t + 1) === 4 && dd > 1 ? 4 : t;
      let v = I.kind === 'white' ? (t <= 1 ? P('#d8d8e4') : t === 2 ? P('#f0f0f6') : white) : R[t];
      // a darker separation line where this region meets another one below / right of it
      const below = lab(x, y + 1), right = lab(x + 1, y);
      if ((below && below !== l && info.get(below).kind !== 'ink' && y > 0) || (right && right !== l && info.get(right).kind !== 'ink')) { if (f >= 2) v = R[0]; }
      put(x, y, v);
    }
  });
}
// the sprite for an icon at factor f → { cv, artW, artH (scaled art size without padding), pad }
const hdCache = new Map();
function hdIcon(name, f, c, o) {
  const hq = !o.lo && hqName(name), n = iconName(name);
  const key = (hq || n) + '|' + f + '|' + (c || '') + '|' + (o.tint2 || '') + '|' + (o.dim || 0) + (o.shadow === false ? 'n' : '') + (o.outline === false ? 'x' : '') + '|' + (o.ring || 0);
  let S = hdCache.get(key);
  if (S) return S;
  let Lb;
  if (hq) { const I = HQ[hq]; Lb = labels(I.m, FIX16, c || I.c, o.tint2 || I.a || (c ? sh(c, -0.8) : I.c), o.dim || 0); }
  else if (BIG[n]) { const I = BIG[n]; Lb = labels(I.m, FIXED, c || I.c, o.tint2 || I.a || (c ? sh(c, -0.8) : I.c), o.dim || 0); }
  else return null;
  const G = upscale(Lb.lab, Lb.w, Lb.h, f), pad = (o.ring || 0) + 3;
  S = { cv: shade(G, Lb.info, f, o), pad, artW: G.w, artH: G.h };
  if (hdCache.size > 800) hdCache.clear();
  hdCache.set(key, S);
  return S;
}
// a 7×7 glyph as a label grid of one colour
const smallCache = new Map();
function smallIcon(name, f, c, shadow) {
  const g0 = SMALL[name] || SMALL[ALIAS[name]]; if (!g0) return null;
  const key = name + f + c + (shadow ? 's' : '');
  let S = smallCache.get(key);
  if (S) return S;
  const L = new Int32Array(49); for (let r = 0; r < 7; r++) for (let k = 0; k < 7; k++) if (g0[r] & (1 << (6 - k))) L[r * 7 + k] = 98;
  const G = upscale(L, 7, 7, f);
  S = { cv: shade(G, new Map([[98, { col: c, kind: 'b', mat: 'tint' }]]), f, { shadow: !!shadow }), pad: 3, artW: G.w, artH: G.h };
  if (smallCache.size > 800) smallCache.clear();
  smallCache.set(key, S);
  return S;
}
// draw a sprite so its art (not its padding) is centred on (cx, cy) in units, at its own physical size
function place(ui, S, cx, cy) {
  if (ui.ta === ui.k && ui.td === ui.k) blitP(ui, S.cv, PX(ui, cx) - Math.round(S.artW / 2) - S.pad, PY(ui, cy) - Math.round(S.artH / 2) - S.pad);
  else { const wU = S.cv.width / ui.k, hU = S.cv.height / ui.k, pU = S.pad / ui.k; blit(ui, S.cv, cx - S.artW / ui.k / 2 - pU, cy - S.artH / ui.k / 2 - pU, wU, hU); }
}

// ---------------------------------------------------------------- drawing
// small icon: a single-colour glyph shaded in HD, in an 8-unit box (shadow: draw its soft shadow)
export function drawSmall(s, name, x, y, c = T.text, shadow = T.ink) {
  if (!s || !s.ui) return;
  const ui = s.ui;
  if (!SMALL[name] && !SMALL[ALIAS[name]]) { if (BIG[iconName(name)] || hqName(name)) drawBig(s, name, x - 2, y - 2, c, { outline: true }); return; }
  const f = pickFactor(Math.floor((7 * ui.k) / 7)), S = smallIcon(SMALL[name] ? name : ALIAS[name], f, c, shadow); if (!S) return;
  place(ui, S, x + 3.5, y + 3.5);
}
export function bigSize(name) { const h = hqName(name); const I = h ? HQ[h] : BIG[iconName(name)]; if (!I) return { w: 12, h: 12 }; return { w: Math.max(...I.m.map((r) => r.length)) + 2, h: I.m.length + 2 }; }
// full-colour art in a 12·scale-unit box at (x, y). c: tint (null → the icon's own colours)
// o: { scale, outline (default true), shadow (default true), tint2, dim (0..1), lo (force the 12 px art), ring }
export function drawBig(s, name, x, y, c, o = {}) {
  if (!s || !s.ui) return;
  const ui = s.ui, n = iconName(name), hq = !o.lo && hqName(name);
  if (!hq && !BIG[n]) { if (SMALL[n]) drawSmall(s, n, x + 2, y + 2, c || T.text, T.ink); return; }
  const I = hq ? HQ[hq] : BIG[n], aw = Math.max(...I.m.map((r) => r.length)), ah = I.m.length;
  const box = 12 * (o.scale || 1), want = Math.floor((box * ui.k - 2) / Math.max(aw, ah));
  const S = hdIcon(name, pickFactor(Math.max(1, want)), c, o); if (!S) return;
  place(ui, S, x + box / 2, y + box / 2);
}
// an icon at any size: fits the art into a size×size box (centred)
export function drawIconFit(s, name, x, y, size, c, o = {}) { drawBig(s, name, x, y, c, Object.assign({}, o, { scale: size / 12 })); }
// a big sticker: the icon with a white rim (size: the box in units)
export function drawEmblem(s, name, cx, cy, scale = 4, tint = null, size = 0) {
  if (!s || !s.ui) return;
  const box = size || scale * 9;
  drawBig(s, name, cx - box / 2, cy - box / 2, tint, { scale: box / 12, ring: Math.max(2, Math.round(s.ui.k * 1.2)) });
}
export function emblemSprite() { return null; }
