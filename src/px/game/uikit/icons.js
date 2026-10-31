// Pixel icons, two sizes:
//  • small: 7×7 single-colour glyphs (rows of bits) drawn with an automatic bevel
//    (lit top edges, shaded bottom edges) and a 1px drop shadow — what ui.icon()
//    has always drawn, so every existing layout keeps its spacing.
//  • big: ~12×12 full-colour pixel art. Masks are authored WITHOUT outline: the
//    renderer adds the 1px ink outline and auto-shades each colour region
//    (top edges lit, bottom/right edges shaded) so the set stays consistent.
//    Mask letters: '.' empty · 'o' ink · 'w' white · '*' soft light (no outline)
//    b/B tint + its dark · a/A secondary + dark · fixed colours (lower = auto-shaded,
//    UPPER = dark tone): r red, y gold, c cyan, g green, n wood, k dark plum,
//    m metal, l paper, p pink, s skin, v violet, f coral, e blue.
import { P } from '../../surface.js';
import { T, sh, mx } from './theme.js';

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
export const ICON_NAMES = [...new Set([...Object.keys(BIG), ...Object.keys(SMALL)])];

const FIXED = {
  r: '#ff5a64', y: '#ffcf5a', c: '#5fd8e8', g: '#6fd36a', n: '#b07040', k: '#5a3a22', m: '#b8aa98', l: '#f4ead8', p: '#ff8ab8', s: '#ffd2b0', v: '#9b7cf0', f: '#ff8a6a', e: '#4a7ae8',
};

// ---------------------------------------------------------------- drawing
// small icon: auto-bevelled single colour + optional 1px drop shadow
export function drawSmall(s, name, x, y, c = T.text, shadow = T.ink) {
  const g = SMALL[name] || SMALL[ALIAS[name]];
  if (!g) { if (BIG[iconName(name)]) drawBig(s, name, x - 2, y - 2, c, { outline: true }); return; }
  x |= 0; y |= 0;
  const on = (r, k) => r >= 0 && r < 7 && k >= 0 && k < 7 && (g[r] & (1 << (6 - k)));
  if (shadow) { const sv = P(shadow); for (let r = 0; r < 7; r++) for (let k = 0; k < 7; k++) if (on(r, k)) px(s, x + k + 1, y + r + 1, sv); }
  const lit = P(sh(c, 0.9)), base = P(c), dark = P(sh(c, -0.7));
  for (let r = 0; r < 7; r++) for (let k = 0; k < 7; k++) {
    if (!on(r, k)) continue;
    const up = !on(r - 1, k), dn = !on(r + 1, k);
    px(s, x + k, y + r, up && !dn ? lit : dn && !up ? dark : base);
  }
}
function px(s, x, y, v) { if (x >= 0 && y >= 0 && x < s.w && y < s.h) s.data[y * s.w + x] = v; }

// big icon. o: { scale, outline (default true), shadow (default true), tint2, dim (0..1 desaturate toward panel) }
const bigCache = new Map();
function compile(name, c, a, dim) {
  const key = name + '|' + c + '|' + a + '|' + dim;
  let out = bigCache.get(key);
  if (out) return out;
  const I = BIG[name]; const m = I.m;
  const H = m.length, W = Math.max(...m.map((r) => r.length));
  const at = (i, j) => (j >= 0 && j < H && i >= 0 && i < W ? m[j][i] || '.' : '.');
  const solid = (ch) => ch !== '.' && ch !== '*';
  const colorful = (ch) => solid(ch) && ch !== 'o';
  const tone = (ch) => {
    const lo = ch.toLowerCase();
    if (ch === 'h') { const hc = dim ? mx(sh(c, 0.9), '#7a5a40', dim) : sh(c, 0.9); return [hc, hc, hc]; }
    let base = lo === 'b' ? c : lo === 'a' ? a : FIXED[lo] || c;
    if (dim) base = mx(base, '#7a5a40', dim);
    return ch !== lo ? [sh(base, -1.6), sh(base, -1.2), sh(base, -0.8)] : [sh(base, -0.75), base, sh(base, 0.85)];
  };
  // canvas with a 1px border for the outline
  const cells = [];
  for (let j = -1; j <= H; j++) for (let i = -1; i <= W; i++) {
    const ch = at(i, j);
    let col = null;
    if (ch === 'o') col = T.ink;
    else if (ch === 'w') col = dim ? mx('#ffffff', '#b89a78', dim) : '#ffffff';
    else if (ch === '*') col = dim ? '#9a7a58' : '#fff0d0';
    else if (colorful(ch)) {
      const [d, bb, l] = tone(ch);
      const up = !colorful(at(i, j - 1));
      const dn = !colorful(at(i, j + 1));
      const rt = !colorful(at(i + 1, j));
      col = up && !dn ? l : dn && !up ? d : rt && !up ? d : bb;
    } else if (!solid(ch)) {
      // outline: empty cell 4-adjacent to a coloured cell
      if (colorful(at(i - 1, j)) || colorful(at(i + 1, j)) || colorful(at(i, j - 1)) || colorful(at(i, j + 1))) col = 'OUT';
    }
    if (col) cells.push(i + 1, j + 1, col);
  }
  out = { w: W + 2, h: H + 2, cells };
  bigCache.set(key, out);
  return out;
}
export function bigSize(name) { const I = BIG[iconName(name)]; if (!I) return { w: 12, h: 12 }; return { w: Math.max(...I.m.map((r) => r.length)) + 2, h: I.m.length + 2 }; }
// draws centred inside a 12×12 box at (x, y) (scaled: a 12k box)
export function drawBig(s, name, x, y, c, o = {}) {
  const n = iconName(name), I = BIG[n];
  if (!I) { if (SMALL[n]) drawSmall(s, n, x + 2, y + 2, c || T.text, T.ink); return; }
  const sc = o.scale || 1, ink = P(o.ink || T.ink), shadowV = o.shadow === false ? 0 : P(o.shadowColor || '#1a0d04');
  const C = compile(n, c || I.c, o.tint2 || I.a || (c ? sh(c, -0.8) : I.c), o.dim || 0);
  const ox = (x | 0) + ((12 - C.w) >> 1) * sc, oy = (y | 0) + ((12 - C.h) >> 1) * sc;
  const put = (i, j, v) => { for (let a2 = 0; a2 < sc; a2++) for (let b2 = 0; b2 < sc; b2++) px(s, ox + i * sc + a2, oy + j * sc + b2, v); };
  const cells = C.cells;
  if (shadowV) for (let k = 0; k < cells.length; k += 3) if (cells[k + 2] === 'OUT' && o.outline !== false) { /* shadow below outline */ put(cells[k], cells[k + 1] + 1, shadowV); }
  for (let k = 0; k < cells.length; k += 3) {
    const col = cells[k + 2];
    if (col === 'OUT') { if (o.outline !== false) put(cells[k], cells[k + 1], ink); continue; }
    put(cells[k], cells[k + 1], P(col));
  }
}
