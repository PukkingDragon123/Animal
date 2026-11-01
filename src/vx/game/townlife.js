// Town life: the walkable city's street trade, and the little scenes its people play out with their Tokonmon.
//
//  · Ten scenes at sidewalk / plaza / lawn spots, each a person paired with a Tokonmon doing the work:
//      Cluck & Burn (Market St at Aoi Plaza, facing the Dragon Gate): Inez's hot-sauce stand. Encore, her Riffrooster
//        (her Chilichick, grown up), fire-roasts the peppers on a brazier; Pip the Chilichick keeps "testing" the stock;
//        a queue of customers buys, tastes (fire breath, tears), takes selfies with Encore and walks off. You can buy
//        three sauces, take the taste test, watch Encore roast, or share a bottle with your partner (a Pyro partner gets
//        big friendship; it counts as spicy food toward Chilichick's Fire Breath).
//      Slap Happy (Aoi Plaza): Jojo's street act. Slapjack the Funkadoodle slaps the bass and dances, puffs fire on the
//        beat; a crowd gathers, claps and takes selfies. Tip, dance along with your partner, or pay for the fire encore.
//      Wok & Roll (Chinatown, Jackson Lane): Chef Bao's noodle cart. Turbo the Hellcoon revs flames under the wok,
//        diners eat on stools; a takeaway queue and a lantern ghost after dark (the night market).
//      Pier Pressure (the Wharf fish market's empty stall): Marisol and Chomps the Thrashark, who fillets (and gets the
//        scraps). Captain Crumb the Pidgun steals a fish now and then and Marisol chases it round the promenade:
//        grab the thief to help.
//      Bubble Moon cart (Wharf promenade): Pearl and Zest the Lemmo, who shakes every drink with a jolt.
//      Petal Pushers (the park's south gate): Fern's flower cart; Clover the Cabbunny waters the buckets.
//      Fetch (park east lawn): Hana and Volt the Zapkit. Throw the ball yourself, or race your partner against Volt.
//      Practice match (park east lawn): Kenji & Fuse (Dynacoon) vs Aiko & Pinchy (Kanizumo), round after round with
//        sparks and splashes, comparing partners in between. Watch it, or challenge one of them to a real battle.
//      Nap pile (park west lawn): five Tokonmon and Grandpa Moku asleep on a blanket. Join them (heals the team).
//      Swift Wing Express (Aoi Plaza): Dot the courier. Express the Pidgun flies parcels to Inez's stand; take a
//        parcel across town to another vendor for a reward (a marker shows the way).
//  · Schedules: every stand has opening hours (shutter down and the Tokonmon asleep when it's shut), crowds thicken at
//    lunch (11:30–13:30) and the food stands run a night market after dark. The hour is the day cycle's (moments.js);
//    when that isn't running it follows the light (day ≈ lunchtime, golden ≈ 5 PM, dusk ≈ 7:30, night ≈ 10:30 PM).
//    ?tlhour=H forces it, ?notown=1 turns the module off, ?tldebug=1 logs.
//  · Performance: the stalls and carts are voxel props sculpted once (registered as city prop kinds) and shared; a
//    scene's people and Tokonmon load only when you come within ~46 m, animate within ~30 m and are detached past
//    ~54 m (the same LOD as life.js); its Tokonmon are baked (life.js bakeModel). Each scene's scripts run on its own
//    clock, which stops while it's frozen and while you're talking to it.
//  · UI: the shop menus are the kit's choices dialog plus a square-cornered item card drawn as an app overlay;
//    no round shapes anywhere (cards, markers, signs and particle sprites are all rectilinear).
// Hooks (world.js, marked [townlife]): load() makes and starts a TownLife for the city, update() ticks it,
// clear() disposes it.
import * as THREE from '../../../vendor/three.module.js';
import { GLOW } from '../fine.js';
import { PROPS, geoFor, partMat } from '../city/voxprops.js';
import { signBoard } from '../city/districts/dt_pix.js';
import { defineFx } from '../fx.js';
import { humanSpec } from '../people/human.js';
import { bakeModel, VOICE } from './life.js';
import { ITEMS } from '../../data/items.js';
import { SPECIES, elemsOf } from '../../data/species.js';
import * as ST from '../../game/state.js';
import { addFriendship } from '../../game/elemon.js';
import { ensureProg, checkUnlocks } from '../../data/progress.js';
import { T } from '../../px/game/ui.js';

const PI = Math.PI, V3 = THREE.Vector3, NOOP = () => {};
// LOD radii (m) round a scene's centre: load its cast, animate (hysteresis), keep it in the scene (hysteresis)
const LOAD = 46, ANIM = 30, ANIM2 = 34, VIS = 54, VIS2 = 60;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const yieldNow = () => new Promise((r) => setTimeout(r, 0));
const flags = (st) => st.flags || (st.flags = {});
const lead = (app) => (app.state.party && app.state.party[0]) || null;
const nameOfMon = (m) => (m && (m.nick || (SPECIES[m.species] && SPECIES[m.species].name))) || 'your partner';
const elems = (sp) => (SPECIES[sp] ? elemsOf(SPECIES[sp]) : []);
const short = (id) => (ITEMS[id] ? ITEMS[id].name.replace(/\s*×\d+$/, '') : id);
const sayW = (app) => (app.wait ? app.wait.bind(app) : (ms) => new Promise((r) => setTimeout(r, ms)));

// ==================================================================================== voxel props
// Sculpted with the city's Fine voxel API at 16 voxels per metre (32 for the small hand-held things), registered into
// the city's prop kinds (voxprops PROPS) so they're meshed once with its AO mesher and shared between every copy.
// Front = +z, centred on x / z, standing on y = 0.
const disc = (F, cx, cz, y0, y1, r, c) => { for (let y = y0; y <= y1; y++) for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x - cx) ** 2 + (z - cz) ** 2 <= r * r) F.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); };
const ball = (F, cx, cy, cz, r, c) => { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2 <= r * r) F.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); };
// a cart wheel in the y–z plane, x0..x1 thick: tyre, four spokes, a hub
const wheel = (F, x0, x1, cy, cz, r, tyre, hub) => { for (let x = x0; x <= x1; x++) for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let z = Math.floor(cz - r); z <= cz + r; z++) { const d = Math.hypot(y - cy, z - cz); if (d > r) continue; if (d > r - 1.3) F.set(x, y, z, tyre); else if (d < 1.3 || Math.abs(y - cy) < 0.6 || Math.abs(z - cz) < 0.6) F.set(x, y, z, hub); } };
// a striped canvas awning sloping from the back (zb, yb) down to the front (zf, yf), with a notched valance
function awning(F, x0, x1, zb, zf, yb, yf, a, b, w = 3) {
  for (let z = zb; z <= zf; z++) { const y = Math.round(yb + ((yf - yb) * (z - zb)) / Math.max(1, zf - zb)); F.box(x0, y, z, x1, y + 1, z, (x) => ((Math.floor((x - x0) / w) & 1) ? b : a)); }
  for (let x = x0; x <= x1; x++) { const s = Math.floor((x - x0) / w) & 1, deep = (x - x0) % w === Math.floor(w / 2); F.box(x, yf - (deep ? 3 : 2), zf, x, yf - 1, zf, s ? b : a); }
}
const KINDS = {
  // Cluck & Burn: a plank counter with a flame-painted front, rows of sauce bottles, a striped awning, a chili garland
  // and a sign board above the front posts (its lettering is a texture, see the scene)
  tl_saucestall: { size: [44, 46, 22], r: 0, build(F) {
    const wd = F.c('#a8683a'), wd2 = F.c('#8a5230'), top = F.c('#d8a868'), red = F.c('#c8322a'), red2 = F.c('#7a1a16'), yel = F.c('#f0c040'), org = F.c('#f07a1a'), cream = F.c('#f6ecd6'),
      post = F.c('#6a4028'), ch = F.c('#d8202a'), chD = F.c('#8a1018'), stem = F.c('#3a8a3a'), lab = F.c('#f4ecd8'), cap = F.c('#2a2226'), gold = F.c('#f0b030'), grn = F.c('#3a9a3a');
    F.box(1, 0, 4, 42, 14, 17, (x, y) => (y % 4 === 3 ? wd2 : wd));
    F.box(2, 1, 18, 41, 13, 18, (x, y) => { const fl = 6 + Math.round(2.2 * Math.sin(x * 0.85)); return y === 1 || y === 13 ? yel : y < fl ? org : y === fl ? yel : red; });
    F.box(0, 15, 3, 43, 16, 19, top);
    const SAUCE = [ch, org, grn, gold, chD]; let k = 0;
    for (const [z, h, x0] of [[12, 4, 11], [15, 3, 12]]) for (let x = x0; x <= 38; x += 3) { const c = SAUCE[k++ % SAUCE.length]; F.box(x, 17, z, x + 1, 16 + h, z + 1, (xx, y) => (y === 18 ? lab : c)); F.box(x, 17 + h, z, x + 1, 17 + h, z + 1, cap); }
    F.box(18, 17, 6, 25, 17, 9, wd2); F.box(19, 18, 7, 24, 22, 8, (x, y) => (y % 2 ? gold : ch));   // a little pyramid of gift boxes at the back
    for (const x of [1, 41]) { F.box(x, 17, 3, x + 1, 39, 4, post); F.box(x, 17, 18, x + 1, 45, 19, post); }
    awning(F, 0, 43, 2, 21, 40, 33, red, cream, 3);
    for (let x = 4; x <= 39; x += 3) { F.box(x, 29, 20, x, 31, 20, x % 2 ? ch : chD); F.set(x, 32, 20, stem); }
    F.box(2, 39, 19, 41, 45, 19, red2);
  } },
  // the roller shutter pulled down over the counter when the stall is shut
  tl_shutter: { size: [44, 17, 2], r: 0, build(F) { const a = F.c('#8a96a6'), b = F.c('#6a7484'), r = F.c('#c8322a'); F.box(1, 0, 0, 42, 16, 1, (x, y) => (y === 16 ? r : y % 2 ? a : b)); } },
  // a charcoal brazier with glowing coals and peppers blistering on the grate
  tl_grill: { size: [12, 15, 12], r: 0, build(F) {
    const ir = F.c('#3a3a42'), ir2 = F.c('#5a5a64'), coal = F.c('#ff7a20', GLOW), coal2 = F.c('#d8461a', GLOW), ch = F.c('#d8202a'), ch2 = F.c('#e8602a'), gr = F.c('#3a8a3a');
    for (const [x, z] of [[2, 2], [9, 2], [2, 9], [9, 9]]) F.box(x, 0, z, x, 7, z, ir);
    for (let y = 7; y <= 10; y++) disc(F, 5.5, 5.5, y, y, 4.0 + (y - 7) * 0.55, ir);
    disc(F, 5.5, 5.5, 10, 10, 4.2, (x, y, z) => ((x + z) % 3 ? coal : coal2));
    for (let x = 1; x <= 10; x += 2) F.box(x, 12, 1, x, 12, 10, ir2);
    for (const [x, z, c] of [[2, 3, ch], [4, 6, ch2], [6, 2, ch], [8, 5, ch], [5, 8, ch2]]) { F.box(x, 13, z, x, 13, z + 2, c); F.set(x, 13, z + 3, gr); }
  } },
  tl_pepcrate: { size: [12, 11, 10], r: 0, build(F) {
    const w = F.c('#b08050'), d = F.c('#8a6038'), ch = F.c('#d8202a'), ch2 = F.c('#f05a2a'), gr = F.c('#3a8a3a'), yl = F.c('#f0c030');
    F.box(0, 0, 0, 11, 6, 9, (x, y, z) => (x === 0 || x === 11 || z === 0 || z === 9 ? (y % 3 === 2 ? d : w) : d));
    for (let x = 1; x <= 10; x++) for (let z = 1; z <= 8; z++) F.box(x, 7, z, x, 7 + ((x * 7 + z * 3) % 3 === 0 ? 1 : 0), z, (x + z) % 5 === 0 ? gr : (x * 3 + z) % 4 === 0 ? ch2 : (x + z * 2) % 7 === 0 ? yl : ch);
  } },
  // Wok & Roll: a lacquered red cart on two wheels, a steel top, a wok on its burner, steamer baskets, a stack of bowls,
  // a banner on two poles and three paper lanterns
  tl_wokcart: { size: [38, 42, 18], r: 0, build(F) {
    const red = F.c('#b8282a'), red2 = F.c('#8a1a1e'), gold = F.c('#e8b840'), steel = F.c('#c8ccd4'), iron = F.c('#2e2e34'), tyre = F.c('#26262c'), hub = F.c('#8a8e98'),
      bam = F.c('#d8b878'), bam2 = F.c('#b08a4a'), bowl = F.c('#f4f0e8'), blue = F.c('#3a6ab8'), nood = F.c('#f0d070'), chili = F.c('#d82a2a'), pole = F.c('#4a2c1e'),
      cloth = F.c('#c8282a'), lan = F.c('#ff4a2a', GLOW), lanG = F.c('#ffc040', GLOW), flame = F.c('#5a8aff', GLOW);
    F.box(2, 5, 2, 35, 16, 14, (x, y, z) => (y === 5 || y === 16 || x === 2 || x === 35 ? gold : z === 14 && (x % 8 === 0 || y === 10) ? red2 : red));
    wheel(F, 0, 1, 5, 8, 5, tyre, hub); wheel(F, 36, 37, 5, 8, 5, tyre, hub);
    F.box(1, 17, 1, 36, 17, 15, steel);
    disc(F, 29, 8, 18, 18, 3.4, iron); disc(F, 29, 8, 18, 18, 2.2, flame);
    for (let y = 19; y <= 22; y++) { const r = 2.6 + (y - 19) * 1.05; disc(F, 29, 8, y, y, r, (x, yy, z) => ((x - 29) ** 2 + (z - 8) ** 2 > (r - 1.2) ** 2 || y === 19 ? iron : 0)); }
    disc(F, 29, 8, 21, 21, 4.0, (x, y, z) => ((x * 3 + z) % 5 === 0 ? chili : nood));
    F.box(34, 22, 8, 37, 22, 8, pole);
    for (let y = 18; y <= 27; y++) disc(F, 7, 8, y, y, 4, y % 3 === 0 ? bam2 : bam);
    disc(F, 7, 8, 28, 28, 4.3, bam2); F.box(7, 29, 8, 7, 29, 8, bam2);
    for (let y = 18; y <= 23; y++) disc(F, 16, 9, y, y, 2.6, y % 2 ? bowl : blue);
    for (const x of [1, 36]) F.box(x, 17, 1, x, 41, 2, pole);
    F.box(0, 36, 0, 37, 41, 8, (x, y, z) => (y === 36 || y === 41 ? gold : cloth));
    for (const x of [8, 19, 29]) { F.box(x, 33, 4, x, 35, 4, pole); F.box(x - 2, 29, 3, x + 2, 32, 5, (xx, yy) => (yy === 29 || yy === 32 ? lanG : lan)); }
  } },
  tl_cover: { size: [36, 9, 16], r: 0, build(F) { const a = F.c('#4a5a8a'), b = F.c('#3a4870'); F.box(0, 0, 0, 35, 8, 15, (x, y, z) => ((x >> 2) % 2 ? a : b)); } },
  tl_stool: { size: [8, 8, 8], r: 0, build(F) { const leg = F.c('#5a3a2a'), seat = F.c('#c83a2a'), seat2 = F.c('#e85a3a'); for (const [x, z] of [[2, 2], [5, 2], [2, 5], [5, 5]]) F.box(x, 0, z, x, 5, z, leg); F.box(1, 6, 1, 6, 7, 6, (x, y) => (y === 7 ? seat2 : seat)); } },
  // Bubble Moon cart: mint with a pink stripe, cups lined up on the counter, a shaker, an awning and a giant cup on top
  tl_bobacart: { size: [36, 46, 18], r: 0, build(F) {
    const mint = F.c('#8ad8c0'), mint2 = F.c('#5ab89a'), pink = F.c('#f49ac0'), pink2 = F.c('#e86a9a'), wht = F.c('#f8f4ee'), tea = F.c('#c8986a'), taro = F.c('#b89ae0'), mat = F.c('#8ac860'),
      pearl = F.c('#3a2418'), tyre = F.c('#2a2a32'), hub = F.c('#d8dce4'), straw = F.c('#e84a6a'), lid = F.c('#e8e0f0'), pole = F.c('#e8e0d8'), silver = F.c('#c8ccd4');
    F.box(2, 5, 2, 33, 16, 14, (x, y, z) => (y === 10 || y === 11 ? pink : z === 14 && (x + y) % 6 === 0 ? pink2 : y === 5 ? mint2 : mint));
    wheel(F, 0, 1, 5, 8, 5, tyre, hub); wheel(F, 34, 35, 5, 8, 5, tyre, hub);
    F.box(1, 17, 1, 34, 17, 15, wht);
    const D = [tea, taro, mat, tea, pink];
    for (let i = 0; i < 5; i++) { const x = 4 + i * 4; F.box(x, 18, 11, x + 1, 18, 12, pearl); F.box(x, 19, 11, x + 1, 21, 12, D[i]); F.box(x, 22, 11, x + 1, 22, 12, lid); F.set(x, 23, 11, straw); F.set(x, 24, 11, straw); }
    F.box(25, 18, 5, 27, 23, 7, silver); F.box(25, 24, 6, 27, 24, 6, silver);
    for (const x of [1, 34]) F.box(x, 18, 1, x, 36, 2, pole);
    awning(F, 0, 35, 1, 17, 37, 32, pink, wht, 3);
    F.box(14, 38, 6, 21, 39, 11, pearl); F.box(13, 40, 5, 22, 43, 12, (x, y) => (y === 43 ? lid : tea)); F.box(17, 44, 8, 18, 45, 9, straw);
  } },
  // Petal Pushers: a wooden cart on two big wheels with two tiers of buckets full of flowers
  tl_flowercart: { size: [36, 30, 20], r: 0, build(F) {
    const wd = F.c('#b8844a'), wd2 = F.c('#8a5e30'), tyre = F.c('#3a2a22'), hub = F.c('#c8a060'), buck = F.c('#9aa8b4'), buck2 = F.c('#7a8894'), stem = F.c('#3a8a3a'), leaf = F.c('#5aa848');
    const HEAD = ['#e83a4a', '#f8c830', '#f49ac0', '#f8f4ee', '#9a6ad8', '#f08a30', '#e83a4a'].map((c) => F.c(c)), eye = F.c('#6a3a1a');
    F.box(3, 6, 3, 32, 12, 16, (x, y) => (y % 3 === 0 ? wd2 : wd));
    wheel(F, 0, 1, 7, 10, 6.5, tyre, hub); wheel(F, 34, 35, 7, 10, 6.5, tyre, hub);
    for (const x of [6, 29]) F.box(x, 11, 0, x, 11, 3, wd2);
    F.box(4, 13, 4, 31, 15, 8, wd2);
    for (let i = 0; i < 6; i++) {
      const x = 5 + i * 5;
      F.box(x, 13, 11, x + 3, 16, 14, (xx, y) => (y === 16 ? buck2 : buck)); F.box(x, 16, 5, x + 3, 19, 8, (xx, y) => (y === 19 ? buck2 : buck));
      for (const [bz, by] of [[12, 17], [6, 20]]) {
        const c = HEAD[(i + (by > 18 ? 3 : 0)) % HEAD.length];
        F.box(x + 1, by, bz, x + 2, by + 2, bz + 1, stem); F.set(x, by + 1, bz, leaf); F.set(x + 3, by + 1, bz + 1, leaf);
        F.box(x, by + 3, bz, x + 3, by + 4, bz + 1, c); F.box(x + 1, by + 5, bz, x + 2, by + 5, bz + 1, c);
        if (c === HEAD[1]) F.box(x + 1, by + 3, bz + 1, x + 2, by + 4, bz + 1, eye);
      }
    }
  } },
  // a square butcher's block with a fish waiting on it
  tl_block: { size: [9, 12, 9], r: 0, build(F) {
    const bark = F.c('#6a4a2e'), wood = F.c('#c8985a'), ring = F.c('#a87a42'), fish = F.c('#c8d4dc'), back = F.c('#5a6a7a'), eye = F.c('#1e1e24');
    F.box(0, 0, 0, 8, 8, 8, (x, y, z) => (x === 0 || x === 8 || z === 0 || z === 8 ? (y % 3 === 1 ? ring : bark) : y === 8 ? (z % 2 ? ring : wood) : wood));
    F.box(1, 9, 4, 6, 9, 4, fish); F.box(2, 10, 4, 5, 10, 4, back); F.box(0, 9, 3, 0, 10, 5, back); F.set(6, 10, 4, eye);
  } },
  // a busker's kit: a cajón box drum and an open instrument case with a few coins in it
  tl_busk: { size: [20, 11, 12], r: 0, build(F) {
    const wd = F.c('#c08850'), dk = F.c('#2a1a14'), shell = F.c('#1e1a20'), vel = F.c('#9a1e3a'), coin = F.c('#f0c040');
    F.box(0, 0, 2, 7, 10, 9, (x, y, z) => (z === 9 && x >= 2 && x <= 5 && y >= 5 && y <= 8 ? dk : wd));
    F.box(9, 0, 0, 19, 1, 11, (x, y, z) => (y === 1 && x > 9 && x < 19 && z > 0 && z < 11 ? vel : shell));
    for (const [x, z] of [[11, 3], [14, 6], [16, 2], [12, 8], [17, 9]]) F.set(x, 2, z, coin);
  } },
  // a courier's hand truck stacked with parcels
  tl_parcelcart: { size: [16, 22, 12], r: 0, build(F) {
    const fr = F.c('#3a4a6a'), pl = F.c('#8a909a'), tyre = F.c('#26262c'), hub = F.c('#c8ccd4'), box = F.c('#c89a5a'), box2 = F.c('#b0844a'), tape = F.c('#ead8a8'), lab = F.c('#f8f4ec');
    F.box(2, 0, 1, 13, 1, 7, pl); for (const x of [2, 13]) F.box(x, 0, 0, x, 20, 1, fr); F.box(2, 20, 0, 13, 20, 1, fr);
    wheel(F, 0, 1, 3, 3, 3, tyre, hub); wheel(F, 14, 15, 3, 3, 3, tyre, hub);
    const P = (x0, y0, z0, x1, y1, z1, c) => { F.box(x0, y0, z0, x1, y1, z1, (x, y, z) => (x === Math.round((x0 + x1) / 2) || y === y1 ? tape : c)); F.box(x0 + 1, y0 + 1, z1, x0 + 3, y0 + 2, z1, lab); };
    P(3, 2, 2, 12, 7, 10, box); P(4, 8, 3, 11, 13, 9, box2); P(5, 14, 4, 10, 17, 8, box);
  } },
  // a checked picnic blanket (32 voxels per metre: thin)
  tl_blanket: { vpm: 32, size: [72, 1, 56], r: 0, build(F) { const a = F.c('#d84a3a'), b = F.c('#f4ecd8'), c = F.c('#e89a8a'); F.box(0, 0, 0, 71, 0, 55, (x, y, z) => { const p = (Math.floor(x / 6) & 1) + (Math.floor(z / 6) & 1); return p === 1 ? c : p ? a : b; }); } },
  // little hand-held things (32 voxels per metre)
  tl_bottle: { vpm: 32, size: [4, 11, 4], r: 0, build(F) { const r = F.c('#d8202a'), l = F.c('#f4ecd8'), c = F.c('#2a2226'), n = F.c('#a81418'); F.box(0, 0, 0, 3, 6, 3, (x, y) => (y >= 2 && y <= 4 ? l : r)); F.box(1, 7, 1, 2, 9, 2, n); F.box(1, 10, 1, 2, 10, 2, c); } },
  tl_cup: { vpm: 32, size: [5, 11, 5], r: 0, build(F) { const p = F.c('#3a2418'), t = F.c('#c8986a'), l = F.c('#f0e8f4'), s = F.c('#e84a6a'); F.box(0, 0, 0, 4, 1, 4, p); F.box(0, 2, 0, 4, 6, 4, t); F.box(0, 7, 0, 4, 7, 4, l); F.box(2, 8, 2, 2, 10, 2, s); } },
  tl_bowl: { vpm: 32, size: [8, 5, 8], r: 0, build(F) { const w = F.c('#f4f0e8'), b = F.c('#3a6ab8'), n = F.c('#f0d070'), c = F.c('#d82a2a'); F.box(2, 0, 2, 5, 0, 5, w); F.box(1, 1, 1, 6, 1, 6, w); F.box(0, 2, 0, 7, 3, 7, (x, y) => (y === 2 ? b : w)); F.box(1, 4, 1, 6, 4, 6, (x, y, z) => ((x + z * 2) % 5 === 0 ? c : n)); } },
  tl_fish: { vpm: 32, size: [11, 4, 4], r: 0, build(F) { const s = F.c('#c8d4dc'), d = F.c('#5a6a7a'), e = F.c('#1e1e24'); F.box(3, 0, 1, 9, 2, 2, s); F.box(3, 3, 1, 8, 3, 2, d); F.box(0, 0, 0, 1, 3, 3, d); F.box(2, 1, 1, 2, 2, 2, s); F.set(9, 2, 2, e); } },
  tl_ball: { vpm: 32, size: [5, 5, 5], r: 0, build(F) { const y = F.c('#d8e84a'), w = F.c('#f8f8e8'); F.box(0, 0, 0, 4, 4, 4, (x, yy, z) => (x === 2 || z === 2 ? w : y)); } },
  tl_parcel: { vpm: 32, size: [8, 7, 8], r: 0, build(F) { const b = F.c('#c89a5a'), t = F.c('#ead8a8'), l = F.c('#f8f4ec'); F.box(0, 0, 0, 7, 6, 7, (x, y, z) => (x === 3 || x === 4 || y === 6 && (z === 3 || z === 4) ? t : b)); F.box(1, 2, 7, 2, 4, 7, l); } },
  tl_can: { vpm: 32, size: [10, 8, 5], r: 0, build(F) { const g = F.c('#3aa86a'), g2 = F.c('#2a8a54'), s = F.c('#c8ccd4'); F.box(1, 0, 0, 6, 5, 4, (x, y) => (y === 0 ? g2 : g)); F.box(7, 3, 2, 8, 4, 2, g); F.box(9, 4, 1, 9, 5, 3, s); F.box(2, 6, 2, 5, 7, 2, g2); } },
};
let KINDS_IN = false;
function registerKinds() { if (KINDS_IN) return; KINDS_IN = true; for (const [k, v] of Object.entries(KINDS)) if (!PROPS[k]) PROPS[k] = v; }
/** a voxel prop of a registered kind as a little group of meshes (the geometry is shared) */
function voxObj(mats, kind, o = {}) {
  const g = new THREE.Group(), parts = PROPS[kind] && geoFor(kind);
  if (parts) for (const part of ['opaque', 'glow']) {
    const geo = parts[part]; if (!geo) continue;
    const m = new THREE.Mesh(geo, partMat(kind, part, mats)); m.castShadow = part === 'opaque' && o.shadow !== false; m.receiveShadow = part === 'opaque'; m.userData.keep = true; g.add(m);
  }
  g.userData.kind = kind;
  return g;
}

// ==================================================================================== signs + particles
// sign boards: the downtown bitmap lettering (dt_pix.js) on a rectangular board; a little chili / noodle / wave / leaf /
// wing painted in square pixels at the left (never a round shape)
const ICONS = {
  chili: (P, W, H) => { const y0 = Math.round(H / 2) - 3; for (let i = 0; i < 7; i++) P.rect(4 + i, y0 + Math.round(i * 0.6), 2, 2, i < 5 ? '#d8202a' : '#a81418'); P.rect(4, y0 - 2, 2, 2, '#3a9a3a'); P.rect(3, y0 - 3, 2, 1, '#3a9a3a'); },
  noodle: (P, W, H) => { const y0 = Math.round(H / 2); P.rect(3, y0, 9, 3, '#f4f0e8'); P.rect(4, y0 + 3, 7, 1, '#3a6ab8'); for (let i = 0; i < 4; i++) P.rect(4 + i * 2, y0 - 2 - (i & 1), 1, 2, '#f0d070'); P.rect(11, y0 - 5, 1, 5, '#8a5230'); P.rect(12, y0 - 6, 1, 6, '#8a5230'); },
  fish: (P, W, H) => { const y0 = Math.round(H / 2) - 1; P.rect(5, y0, 7, 3, '#c8d4dc'); P.rect(6, y0 - 1, 5, 1, '#5a6a7a'); P.rect(3, y0 - 1, 2, 5, '#5a6a7a'); P.rect(10, y0, 1, 1, '#1e1e24'); },
  cup: (P, W, H) => { const y0 = Math.round(H / 2) - 4; P.rect(5, y0, 6, 1, '#f0e8f4'); P.rect(5, y0 + 1, 6, 6, '#c8986a'); P.rect(5, y0 + 7, 6, 2, '#3a2418'); P.rect(8, y0 - 3, 1, 3, '#e84a6a'); },
  flower: (P, W, H) => { const y0 = Math.round(H / 2) - 3; P.rect(7, y0 + 2, 1, 6, '#3a8a3a'); P.rect(5, y0, 5, 3, '#e83a4a'); P.rect(6, y0 - 1, 3, 5, '#e83a4a'); P.rect(7, y0 + 1, 1, 1, '#f8c830'); P.rect(8, y0 + 5, 2, 1, '#5aa848'); },
  wing: (P, W, H) => { const y0 = Math.round(H / 2) - 2; for (let i = 0; i < 4; i++) P.rect(3 + i * 2, y0 + i, 8 - i * 2, 1, '#f8f4ec'); P.rect(11, y0 + 1, 3, 3, '#c89a5a'); },
};
const SIGNMATS = new Map();
function signMesh(st, tex, w, h) {
  let m = SIGNMATS.get(tex);
  if (!m) { m = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, roughness: 0.8, side: THREE.DoubleSide }); SIGNMATS.set(tex, m); }
  if (st && st.glowMat) st.glowMat(m, 0.55);                        // lit up after dark, like the city's shop signs
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
const sign = (key, text, sub, w, h, bg, fg, icon, o = {}) => () => signBoard('tl_' + key, text, w, h, { bg, fg, frame: o.frame, sub, subCol: o.subCol, stripe: o.stripe, icon: ICONS[icon], dx: icon ? 6 : 0, ppm: o.ppm || 40, bolts: false });
let FX_IN = false;
function defineParticles() {
  if (FX_IN) return; FX_IN = true;
  // a chili popping off the grill
  defineFx('tl_pepper', { w: 7, h: 7, frames: [0, 1].map((k) => (p) => { const R = k ? '#e8302a' : '#c81e1e'; for (const [x, y] of [[1, 5], [2, 5], [2, 4], [3, 4], [3, 3], [4, 3], [4, 2], [5, 2]]) p.px(x, y, R); p.px(2, 4, '#ff8a6a'); p.px(5, 1, '#3a9a3a'); p.px(6, 1, '#3a9a3a'); p.px(6, 0, '#3a9a3a'); }), life: [0.6, 1.0], size: [0.08, 0.08], speed: [1.4, 2.4], grav: 7, drag: 0.5, spread: 0.7, spin: 7 });
  // a tossed strand of noodles
  defineFx('tl_noodle', { w: 9, h: 7, frames: [0, 1].map((k) => (p) => { for (let x = 0; x < 9; x++) { const y = 3 + Math.round(Math.sin(x * 1.3 + k * 1.5) * 2); p.px(x, y, '#f0d070'); if (x % 3 === 0) p.px(x, y + 1, '#c8a040'); } }), life: [0.45, 0.7], size: [0.1, 0.1], speed: [1.8, 2.8], grav: 8, drag: 0.4, spread: 0.35, spin: 4 });
  // a phone's camera flash: a four-point star
  defineFx('tl_flash', { w: 9, h: 9, paint: (p) => { for (let i = 0; i < 9; i++) { p.px(4, i, '#ffffff'); p.px(i, 4, '#ffffff'); } for (const [x, y] of [[3, 3], [5, 5], [3, 5], [5, 3]]) p.px(x, y, '#fff6c8'); }, glow: true, life: [0.14, 0.2], size: [0.18, 0.55], speed: [0, 0], grav: 0, pop: true, fade: true });
}

// ==================================================================================== the people
// Gacha Garage street presets with overrides (the vendors wear their partner Tokonmon's colours)
const CAST = {
  inez: ['mom', 301, { sex: 'f', age: 'adult', H: 1.64, skin: 0xb98058, hair: { style: 'ponytail', col: 0x22140f }, top: { kind: 'tee', col: 0xd8392a }, bottom: { kind: 'jeans', col: 0x283452 }, shoes: { kind: 'sneaker', col: 0xf2f0ea, col2: 0xd8392a }, hat: { kind: 'headband', col: 0xf0c040 }, acc: [{ kind: 'apron', col: 0x2a2226, col2: [240, 190, 60] }], glasses: null }],
  jojo: ['tourist', 302, { sex: 'm', age: 'adult', H: 1.78, skin: 0x8a5a3e, hair: { style: 'messy', col: 0x2ab8a8 }, top: { kind: 'jacket', col: 0x6a3ab8, shirt: 0xf0c040 }, bottom: { kind: 'jeans', col: 0x2a2a34 }, shoes: { kind: 'sneaker', col: 0xf2f0ea, col2: 0xe8603a }, hat: { kind: 'cap', col: 0xe8603a, col2: 0xf0c040 }, acc: [], glasses: null }],
  bao: ['salaryman', 303, { sex: 'm', age: 'adult', H: 1.72, build: 1.18, belly: 0.6, skin: 0xe2b28c, hair: { style: 'buzz', col: 0x2a2422 }, top: { kind: 'shirt', col: 0xf2f0ea }, bottom: { kind: 'slacks', col: 0x2a2a30 }, shoes: { kind: 'sneaker', col: 0x2a2a30, col2: 0xb8282a }, hat: { kind: 'headband', col: 0xb8282a }, acc: [{ kind: 'apron', col: 0xf4f0e8, col2: [184, 40, 42] }], glasses: null }],
  marisol: ['mom', 304, { sex: 'f', age: 'adult', H: 1.67, skin: 0xc68e66, hair: { style: 'bob', col: 0x3a2418 }, top: { kind: 'workjacket', col: 0xf0c838, sleeve: 'long' }, bottom: { kind: 'cargo', col: 0x2e4a5a }, shoes: { kind: 'boots', col: 0x2e6a5a }, hat: { kind: 'bucket', col: 0x2e6a5a }, acc: [{ kind: 'apron', col: 0x2e6a5a, col2: [240, 240, 236] }], glasses: null }],
  pearl: ['gyaru', 305, { sex: 'f', age: 'teen', H: 1.6, skin: 0xf2cdb0, hair: { style: 'twintails', col: 0xe88ab0 }, top: { kind: 'blouse', col: 0x8ad8c0 }, bottom: { kind: 'skirt', col: 0xf49ac0 }, shoes: { kind: 'sneaker', col: 0xf8f4ee, col2: 0xf49ac0 }, acc: [{ kind: 'apron', col: 0xf8f4ee, col2: [244, 154, 192] }], hat: null, glasses: null }],
  fern: ['grandma', 306, { hair: { style: 'bun', col: 0xc8c4bc }, top: { kind: 'cardigan', col: 0x5aa848, shirt: 0xf4ecd8 }, bottom: { kind: 'skirt', col: 0x6a4a3a }, hat: { kind: 'sunhat', col: 0xe8d8a8 }, acc: [{ kind: 'apron', col: 0x3a6a3a, col2: [240, 236, 220] }] }],
  hana: ['kid', 307, { sex: 'f', age: 'kid', H: 1.22, skin: 0xe8c0a0, hair: { style: 'twintails', col: 0x3a2418 }, top: { kind: 'tee', col: 0xf0c840 }, bottom: { kind: 'shorts', col: 0x3a5a8a }, shoes: { kind: 'sneaker', col: 0xe84a3a, col2: 0xf4f0ea }, acc: [], hat: { kind: 'cap', col: 0x3ab8d8, col2: 0xf0c840 }, glasses: null }],
  kenji: ['schoolboy', 308, { sex: 'm', age: 'teen', H: 1.72, skin: 0xe2b28c, hair: { style: 'messy', col: 0x1e1612 }, top: { kind: 'jacket', col: 0xf08a20, shirt: 0x2a2a30 }, bottom: { kind: 'jeans', col: 0x2a3450 }, shoes: { kind: 'sneaker', col: 0xf2f0ea, col2: 0xf08a20 }, acc: [{ kind: 'backpack', col: 0x2a2a30 }], hat: null, glasses: null }],
  aiko: ['schoolgirl', 309, { sex: 'f', age: 'teen', H: 1.6, skin: 0xf0c8a4, hair: { style: 'ponytail', col: 0x3a221c }, top: { kind: 'cardigan', col: 0x2a8ab8, shirt: 0xf4ecd8 }, bottom: { kind: 'skirt', col: 0x2a3a5a }, legs: 'kneesocks', shoes: { kind: 'sneaker', col: 0xf2f0ea, col2: 0x2a8ab8 }, acc: [], hat: null, glasses: null }],
  moku: ['grandpa', 310, { hat: { kind: 'flatcap', col: 0x5a6a4a } }],
  dot: ['delivery', 311, { sex: 'f', H: 1.63, build: 0.95, skin: 0xd8a882, hair: { style: 'ponytail', col: 0x2a1a14 }, face: { stubble: 0 } }],
};
const SPECS = new Map();
const specOf = (k) => { if (!SPECS.has(k)) { const [p, seed, over] = CAST[k]; SPECS.set(k, humanSpec(p, seed, { ...over, id: 'tl_' + k })); } return SPECS.get(k); };
// cries for the species the city's residents table doesn't voice
const VOICE2 = { hellcoon: ['VRRM-VRRM!', 1.0, null], thrashark: ['Chomp-chomp!', 1.1, null], dynacoon: ['Fssss-POP!', 1.5, null], riffrooster: ['BAWK-A-DOODLE!', 1.3, null], funkadoodle: ['Bwa-bwa-BWAAK!', 1.5, null] };

// ==================================================================================== a scene
class Scene {
  constructor(T, def) {
    this.T = T; this.def = def; this.id = def.id; this.name = def.name;
    this.x = def.at[0]; this.z = def.at[1]; this.yaw = def.yaw || 0; this.cs = Math.cos(this.yaw); this.sn = Math.sin(this.yaw);
    this.y = T.nav.ground(this.x, this.z, 0);
    this.state = 'idle'; this.cast = new Map(); this.all = new Set(); this.timers = []; this.tweens = []; this.its = []; this.named = {}; this.whens = [];
    this.t = 0; this.n = 0; this.shown = false; this.live = false; this.busy = false; this.hold = false; this.dead = false; this.open = true; this.ev = {}; this.queue = [];
  }
  get w() { return this.T.w; }
  get app() { return this.T.app; }
  get nav() { return this.T.nav; }
  get me() { return this.T.w.player; }
  // local (lx along the scene's right, lz towards its front) ↔ world
  P(lx, lz) { return [this.x + lx * this.cs + lz * this.sn, this.z - lx * this.sn + lz * this.cs]; }
  L(x, z) { const dx = x - this.x, dz = z - this.z; return [dx * this.cs - dz * this.sn, dx * this.sn + dz * this.cs]; }
  V(lx, lz, y = 0) { const [x, z] = this.P(lx, lz); return new V3(x, this.nav.ground(x, z, 0) + y, z); }
  Y(ly = 0) { return this.yaw + ly; }
  near(a, r = 16) { const me = this.me; if (!me || !a) return false; const p = a.g ? a.g.position : a; return Math.hypot(p.x - me.g.position.x, p.z - me.g.position.z) < r; }
  // ---------------------------------------------------------------- the set: props, signs, lamps, prompts
  build() {
    const g = this.g = new THREE.Group(); g.name = 'tl-' + this.id; this.T.root.add(g);
    for (const p of this.def.props || []) this.prop(p);
    for (const s of this.def.signs || []) {
      const m = signMesh(this.w.st, s.tex(), s.w, s.h), v = this.V(s.at[0], s.at[1], s.y);
      m.position.copy(v); m.rotation.y = this.Y(s.yaw || 0); g.add(m);
      if (s.when) this.whens.push([m, s.when]);
    }
    for (const L of this.def.lamps || []) { const v = this.V(L[0], L[1], L[2]); this.w.st.lamp(v.x, v.y, v.z, L[3] ?? 0xffb060, L[4] ?? 18, L[5] ?? 9); }
  }
  prop(p) {
    const v = this.V(p.at[0], p.at[1], p.y || 0), m = voxObj(this.T.mats, p.k);
    m.position.copy(v); m.rotation.y = this.Y(p.yaw || 0); if (p.s) m.scale.setScalar(p.s);
    this.g.add(m);
    if (p.block) this.block(p.at, p.block, p.yaw || 0);
    if (p.id) this.named[p.id] = m;
    if (p.when) this.whens.push([m, p.when]);
    return m;
  }
  /** keep the player out of a rectangle (local centre, half sizes, local turn) */
  block([lx, lz], [hw, hd], ly = 0) {
    const c = Math.cos(ly), s = Math.sin(ly); let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
    for (const [a, b] of [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]]) { const [x, z] = this.P(lx + a * c + b * s, lz - a * s + b * c); x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    this.nav.block(x0, z0, x1, z1, 0);
  }
  /** an [E] prompt: on a person of the cast (who: talking frames a conversation), on a Tokonmon (mon: it follows it), or at a point */
  item(o) {
    const it = { x: 0, z: 0, L: 0, y: this.y + (o.h ?? 1.1), r: o.r || 1.8, icon: o.icon || 'talk', label: o.label, base: o.label, tl: o,
      when: () => !this.dead && this.shown && this.state === 'ok' && !this.busy && (!o.when || o.when(this)), act: (app) => this.use(o.act, o) };
    if (o.who) { const a = this.cast.get(o.who); if (!a) return null; it.npc = a.id; }
    else if (o.mon) { if (!this.cast.get(o.mon)) return null; it.follow = o.mon; }
    else { const [x, z] = this.P(o.at[0], o.at[1]); it.x = x; it.z = z; }
    this.its.push(it); this.T.c.inter.push(it);
    return it;
  }
  async use(fn, o = {}) {
    if (this.busy) return;
    this.busy = true; this.hold = o.hold !== false;
    const b = this.w.partner;
    try { await fn(this.app, this); }
    catch (e) { console.warn('[townlife]', this.id, e); }
    finally {
      this.busy = false; this.hold = false;
      if (b && b.tlBusy) { b.tlBusy = false; b.busy = false; b.path = null; b.play('idle', { fade: 0.25 }); }
      const me = this.me; if (me && me.anim && me.anim.cur !== 'idle') me.play('idle', { fade: 0.3 });
    }
  }
  // ---------------------------------------------------------------- the cast
  async person(key, who, [lx, lz, ly = 0], o = {}) {
    if (this.dead) return null;
    const id = `tl-${this.id}-${key}-${this.n++}`, [x, z] = this.P(lx, lz);
    const a = this.w.addPerson(id, typeof who === 'string' && CAST[who] ? specOf(who) : who, [x, z, this.Y(ly)]);
    a.tl = this; a.tlKey = key; a.speed = o.speed || 1.25; a.tlVoice = o.voice || 'friend';
    if (o.name) a.npc = { id, name: o.name, clip: 'tl' };            // a non-idle clip: the street's chit-chat leaves vendors be
    if (o.clip) this.pose(a, o.clip, o.lock);
    if (o.when) a.tlWhen = () => o.when(this);
    if (!o.temp) this.cast.set(key, a);
    this.add(a);
    await yieldNow();
    return this.dead ? null : a;
  }
  async mon(key, sp, [lx, lz, ly = 0], o = {}) {
    if (this.dead) return null;
    const id = `tl-${this.id}-${key}-${this.n++}`, [x, z] = this.P(lx, lz);
    let a; try { a = await this.w.addMon(id, sp, [x, z, this.Y(ly)]); } catch (e) { console.warn('[townlife] mon', sp, e); return null; }
    if (this.dead || this.w.actors.get(id) !== a) { if (this.w.actors.get(id) === a) this.w.remove(id); return null; }
    a.tl = this; a.tlKey = key; a.sp = o.as || sp; a.speed = o.speed || 1.3; a.tlName = o.name || (SPECIES[a.sp] && SPECIES[a.sp].name) || sp;
    if (o.drip) a.m.drip(o.drip[0], o.drip[1]);
    if (o.scale) a.g.scale.multiplyScalar(o.scale);
    if (o.y !== undefined) a.g.position.y = this.nav.ground(x, z, 0) + o.y;
    a.tlTop = headTop(a.m);                                          // where carried things sit (found before the bake merges the cubes)
    a.baked = bakeModel(a.m, a.anim.spec);
    a.tlPose = o.clip || 'idle'; a.idleClip = a.anim.clips[a.tlPose] ? a.tlPose : 'idle';
    a.play(a.idleClip, { fade: 0 }); for (let i = 0; i < 3; i++) a.anim.update(0.1, {});
    if (o.when) a.tlWhen = () => o.when(this);
    this.cast.set(key, a); this.add(a);
    await yieldNow();
    return this.dead ? null : a;
  }
  add(a) {
    this.all.add(a);
    if (!this.shown || (a.tlWhen && !a.tlWhen())) a.g.removeFromParent();
    if (!this.live) a.update = NOOP;
  }
  drop(a) {
    if (!a) return;
    this.all.delete(a); if (this.cast.get(a.tlKey) === a) this.cast.delete(a.tlKey);
    if (a.baked) a.baked.dispose();
    if (this.w.actors.get(a.id) === a) this.w.remove(a.id); else a.g.removeFromParent();
  }
  /** a person's resting clip (lock: put it back whenever something else plays one, e.g. the street chatter's 'talk' on a seated diner) */
  pose(a, clip, lock) { a.tlPose = clip; if (lock !== undefined) a.tlLock = lock; a.play(clip, { fade: 0.2 }); }
  setShown(on) {
    this.shown = on;
    for (const a of this.all) { const v = on && (!a.tlWhen || a.tlWhen()); if (v && !a.g.parent) this.w.st.actors.add(a.g); else if (!v && a.g.parent) a.g.removeFromParent(); }
  }
  setLive(on) { this.live = on; for (const a of this.all) { if (on) delete a.update; else a.update = NOOP; } }
  applyWhens() {
    for (const [m, f] of this.whens) m.visible = !!f(this);
    if (this.shown) this.setShown(true);
  }
  checkOpen(h) {
    const [o, c] = this.def.hours || [0, 24], open = c > 24 ? h >= o || h < c - 24 : h >= o && h < c;
    if (open !== this.open || this.night !== this.T.night()) { this.open = open; this.night = this.T.night(); if (this.def.onOpen && this.state === 'ok') this.def.onOpen(this, open); this.applyWhens(); }
  }
  async load() {
    this.state = 'loading';
    try { if (this.def.setup) await this.def.setup(this); } catch (e) { console.warn('[townlife] setup', this.id, e); }
    if (this.dead) return;
    this.state = 'ok';
    for (const o of this.def.items ? this.def.items(this) : []) this.item(o);
    this.applyWhens(); if (this.def.onOpen) this.def.onOpen(this, this.open);
    if (this.def.run) this.def.run(this);
    if (this.T.debug) console.log('[townlife] loaded', this.id, this.all.size, 'actors');
  }
  // ---------------------------------------------------------------- the scene's clock: scripts, waits, tweens
  go(fn) { Promise.resolve().then(() => fn(this)).catch((e) => { if (!this.dead) console.warn('[townlife]', this.id, e); }); }
  sleep(s) { return new Promise((r) => { if (!this.dead) this.timers.push([this.t + s, r]); }); }
  tween(dur, fn) { return new Promise((r) => { if (!this.dead) this.tweens.push({ t: 0, dur: Math.max(0.01, dur), fn, r }); }); }
  async walk(a, x, z, o = {}) {
    if (this.dead || !a) return;
    const p = a.g.position; let pts = null;
    if (!o.direct) { const path = this.nav.path({ x: p.x, y: p.y, z: p.z }, { x, y: p.y, z }); if (path && path.length > 1) pts = path.slice(1).map(([px, pz]) => [px, pz]); }
    if (!pts) pts = [[x, z]];
    pts[pts.length - 1] = [x, z];
    const run = a.walkTo(pts, { speed: o.speed || a.speed, clip: o.clip });
    if (o.anim && a.anim.cur && a.anim.cur.speed !== undefined) a.anim.cur.speed = o.anim;
    await run;
  }
  walkL(a, lx, lz, o) { const [x, z] = this.P(lx, lz); return this.walk(a, x, z, o); }
  faceL(a, lx, lz) { if (!a) return; const [x, z] = this.P(lx, lz); a.faceTo(x, z); }
  // ---------------------------------------------------------------- little touches
  say(a, text, voice) {
    if (!a || !this.near(a, 15) || !this.w.actors.has(a.id)) return;
    const B = this.w.bubbles || (this.w.bubbles = []);
    for (let i = B.length - 1; i >= 0; i--) if (B[i].a === a) B.splice(i, 1);
    B.push({ a, text, t: 0, n: 0, dur: 1.6 + text.length * 0.06, voice: voice || a.tlVoice || 'friend' });
  }
  cry(a, vol = 0.8, text) { if (!a) return; const V = VOICE2[a.sp] || VOICE[a.sp] || ['!', 1.5]; this.say(a, text || V[0], { pitch: V[1], timbre: 'triangle', speed: 1.5, level: 0.8 * vol }); if (V[2]) this.sfx(V[2], a, 0.5 * vol); }
  sfx(name, at, vol = 1, pitch = 1) {
    const me = this.me, au = this.app.audio; if (!me || !au || !au.sfx || !at) return;
    const p = at.g ? at.g.position : at, d = Math.hypot(p.x - me.g.position.x, p.z - me.g.position.z); if (d > 18) return;
    au.sfx(name, { vol: vol * (1 - d / 20), pitch });
  }
  fx(kind, at, o = {}) { if (!this.live) return; this.w.fx.emit(kind, at.g ? at.headPos() : at, o); }
  emote(a, kind, dur = 1.4) { const f = this.app.feel; if (f && f.emote && a && this.near(a, 18)) f.emote(a, kind, dur); }
  // ---------------------------------------------------------------- per frame (while live)
  tick(dt) {
    if (!this.hold) { this.t += dt; for (let i = this.timers.length - 1; i >= 0; i--) if (this.timers[i][0] <= this.t) { const r = this.timers[i][1]; this.timers.splice(i, 1); r(); } }
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const q = this.tweens[i]; q.t += dt; const k = Math.min(1, q.t / q.dur);
      try { q.fn(k, dt); } catch (e) { if (this.T.debug) console.warn(e); }
      if (k >= 1) { this.tweens.splice(i, 1); q.r(); }
    }
    for (const a of this.all) if (a.tlLock && a.tlPose && a.kind === 'person' && a.anim.cur !== a.tlPose && !a.path) a.play(a.tlPose, { fade: 0.2 });
    for (const it of this.its) {
      if (it.follow) { const a = this.cast.get(it.follow); if (a) { const p = a.g.position; it.x = p.x; it.z = p.z; it.y = p.y + 0.9; } }
      if (it.tl.dyn) it.label = it.tl.dyn(this) || it.base;
    }
    if (this.def.tick) this.def.tick(this, dt);
  }
  dispose() {
    this.dead = true; this.timers = []; this.tweens = [];
    for (const a of [...this.all]) this.drop(a);
    for (const it of this.its) { const i = this.T.c.inter.indexOf(it); if (i >= 0) this.T.c.inter.splice(i, 1); }
    this.its = [];
    if (this.g) this.g.removeFromParent();
  }
}

// ---------------------------------------------------------------- bodies: mouths, carried and held things
const fwd = (a, up = 0) => new V3(Math.sin(a.yaw), up, Math.cos(a.yaw)).normalize();
/** a point in front of the face (fire breath, a sip, a camera flash) */
function mouth(a, ahead = 0.15, drop = 0.1) { const h = a.headPos(); const s = a.g.scale.x / ((a.m && a.m.scale) || 1); h.addScaledVector(fwd(a), ahead * s); h.y -= drop * s; return h; }
/** where a Tokonmon carries things on its head: [bone, local point], found before the bake */
function headTop(m) {
  const head = m.bones[(m.def.anim && m.def.anim.look && m.def.anim.look.bone) || 'head'] || m.bones.head || m.bones.body || m.group;
  m.group.updateMatrixWorld(true);
  const box = new THREE.Box3(); head.traverse((o) => { if (o.isMesh && o.visible && !o.userData.hull) box.expandByObject(o); });
  if (box.isEmpty()) box.setFromObject(m.group);
  const p = new V3((box.min.x + box.max.x) / 2, box.max.y - 0.01, (box.min.z + box.max.z) / 2); head.worldToLocal(p);
  return { bone: head, p };
}
function carry(S, a, kind) {
  drop(a); if (!a || !a.tlTop) return null;
  const g = voxObj(S.T.mats, kind, { shadow: false }), ws = new V3(); a.tlTop.bone.getWorldScale(ws);
  g.scale.setScalar(1 / (ws.x || 1)); g.position.copy(a.tlTop.p); a.tlTop.bone.add(g); a.tlHeld = g;
  return g;
}
/** a person holds something in a hand (the hand bone of the Gacha Garage rig) */
function hold(S, a, kind, side = 'R') {
  drop(a);
  const b = a && a.m && a.m.h && a.m.h.b && a.m.h.b['hand' + side]; if (!b) return null;
  const g = voxObj(S.T.mats, kind, { shadow: false }); g.position.set(0, -0.08, 0.035); g.rotation.x = PI; b.add(g); a.tlHeld = g;
  return g;
}
function drop(a) { if (a && a.tlHeld) { a.tlHeld.removeFromParent(); a.tlHeld = null; } }
/** a short hop through the air (Pidgun flights): along an arc to a point, flapping */
async function fly(S, a, to, h = 1.4, speed = 4) {
  const p0 = a.g.position.clone(), d = p0.distanceTo(to), dur = clamp(d / speed, 0.5, 3);
  a.path = null; a.faceTo(to.x, to.z); a.play('walk', { restart: true, speed: 2.8 }); S.sfx('flap', a, 0.5);
  await S.tween(dur, (k, dt) => {
    a.g.position.lerpVectors(p0, to, k); a.g.position.y += Math.sin(k * PI) * h;
    if (Math.random() < dt * 3) S.fx('feather', a, { n: 1, scale: 0.7 });
  });
  a.play('idle', { fade: 0.2 });
}
/** a burst of fire breath from a Tokonmon (or a person) towards a point / along its facing */
function breath(S, a, dur, o = {}) {
  const key = 'tl' + a.id + Math.random();
  return S.tween(dur, (k, dt) => {
    const m = mouth(a, o.ahead ?? 0.18, o.drop ?? 0.1), dir = o.to ? o.to.clone().sub(m).normalize() : fwd(a, o.up ?? -0.1);
    S.w.fx.emit(o.kind || 'breath', m, { dt, rate: o.rate || 55, dir, speed: o.speed || 0.55, spread: o.spread ?? 0.2, scale: o.scale || 0.6, key });
    if (o.to && Math.random() < dt * 8) S.w.fx.emit('ember', o.to, { n: 1 });
  });
}
/** a phone selfie: the flash and the shutter */
function flash(S, a) { const p = mouth(a, 0.42, -0.05); S.fx('tl_flash', p, { n: 1 }); S.fx('sparkle', p, { n: 4, scale: 0.6 }); S.sfx('camera', a, 0.6); }

// ==================================================================================== customers
// a queue at a counter. Q: { spots [[lx, lz]], look [lx, lz], ends [[lx, lz], [lx, lz]], gap [s, s], food, max(S),
// serve(S, c), after(S, c) }
async function customers(S, Q) {
  await S.sleep(rnd(0.3, 1.5));
  for (;;) {
    if (S.dead) return;
    const max = S.open ? Q.max(S) : 0;
    if (S.live && S.queue.length < max && S.all.size < S.cast.size + max + 2) S.go(() => customer(S, Q));
    await S.sleep(rnd(Q.gap[0], Q.gap[1]) / Math.max(0.5, S.T.crowd(Q.food)));
  }
}
async function customer(S, Q) {
  const from = Math.random() < 0.5 ? 0 : 1, [ex, ez] = Q.ends[from], [ox, oz] = Q.ends[1 - from];
  const c = await S.person('c', 'passerby' + (1 + Math.floor(Math.random() * 400)), [ex, ez, 0], { temp: true, speed: rnd(1.1, 1.4) });
  if (!c) return;
  S.queue.push(c);
  let served = false;
  try {
    let lastI = -1;
    for (;;) {
      if (S.dead) return;
      const i = S.queue.indexOf(c);
      if (i !== lastI) { lastI = i; const [lx, lz] = Q.spots[Math.min(i, Q.spots.length - 1)]; await S.walkL(c, lx + (i >= Q.spots.length ? rnd(-0.3, 0.3) : 0), lz); S.faceL(c, Q.look[0], Q.look[1]); continue; }
      if (i === 0 || !S.open) break;
      await S.sleep(0.6);
    }
    if (S.open && S.queue[0] === c) { S.serving = c; await Q.serve(S, c); served = true; }
  } finally { if (S.serving === c) S.serving = null; const k = S.queue.indexOf(c); if (k >= 0) S.queue.splice(k, 1); }
  if (served && Q.after) await Q.after(S, c);
  await S.walkL(c, ox, oz);
  S.drop(c);
}
/** a vendor serves a customer: the order, the handover, the coins */
async function serveAt(S, c, o) {
  const v = S.cast.get(o.vendor);
  c.play('talk', { restart: true }); S.say(c, pick(o.orders), 'friend');
  if (v) { v.face(c); v.play('nod', { restart: true }); }
  await S.sleep(1.6);
  if (o.prepare) await o.prepare(S, c); else await S.sleep(1.0);
  if (v) { v.play('point', { restart: true }); S.say(v, pick(o.thanks)); }
  S.sfx('coin', c, 0.35);
  hold(S, c, o.hand);
  c.play('nod', { restart: true });
  await S.sleep(1.3);
  if (v) { v.play('idle', { fade: 0.3 }); S.faceL(v, 0, 3); }
}
/** onlookers who drift in, watch a while and wander off (busker crowd, the match's fans) */
async function onlookers(S, o) {
  const taken = new Set();
  for (;;) {
    await S.sleep(rnd(o.gap[0], o.gap[1]));
    if (S.dead) return;
    const free = o.spots.map((_, i) => i).filter((i) => !taken.has(i));
    if (!S.live || !S.open || !free.length || (o.when && !o.when(S))) continue;
    const i = pick(free); taken.add(i);
    S.go(async () => {
      const [ex, ez] = pick(o.ends), [lx, lz, ly] = o.spots[i];
      const c = await S.person('fan', 'passerby' + (1 + Math.floor(Math.random() * 400)), [ex, ez, 0], { temp: true, speed: rnd(1.0, 1.3) });
      if (!c) { taken.delete(i); return; }
      try {
        await S.walkL(c, lx, lz); c.targetYaw = S.Y(ly);
        const until = S.t + rnd(o.stay[0], o.stay[1]);
        while (S.t < until && S.open && !S.dead) await o.watch(S, c, i);
      } finally { taken.delete(i); }
      await S.walkL(c, ...pick(o.ends));
      S.drop(c);
    });
  }
}

// ==================================================================================== the player's side: shops, sharing, deliveries
/** a vendor's menu: the kit's choices dialog (an item card overlay shows what's highlighted) until you say bye */
async function shop(app, S, o) {
  const st = app.state;
  for (;;) {
    const ex = (o.extras || []).filter((e) => !e.when || e.when());
    const opts = o.goods.map((id) => `${short(id)}  $${ITEMS[id].price}`).concat(ex.map((e) => e.label), ['Bye']);
    const k = await app.choose(o.prompt ? o.prompt() : `What can I get you? (You have $${st.money})`, opts, { name: o.vendor, tlShop: { title: o.title, goods: o.goods, extras: ex } });
    if (k === null || k === undefined || k >= opts.length - 1) return;
    if (k < o.goods.length) {
      const id = o.goods[k], it = ITEMS[id];
      if (ST.buy(st, id)) { app.audio.sfx && app.audio.sfx('coin'); if (app.save) app.save(); if (o.bought) await o.bought(id); }
      else { app.audio.sfx && app.audio.sfx('ui_error'); await app.say(o.vendor, pick([`That one's $${it.price}. Come back when your wallet's warmer.`, 'A little short, friend. No credit — sorry!'])); }
      if (o.once) return;
      continue;
    }
    const e = ex[k - o.goods.length]; if (!e) return;
    const r = await e.fn(); if (r === 'close') return;
  }
}
/** your partner tries something from the stall: friendship (more for the element it likes), healing, and spicy
 *  things count as spicy food for its moves (ensureProg / checkUnlocks: Chilichick's Fire Breath) */
async function sharePick(app, S, ids, verb = 'share') {
  const st = app.state, have = ids.filter((id) => (st.bag[id] || 0) > 0);
  if (!have.length) return null;
  if (have.length === 1) return have[0];
  const k = await app.choose(`Which one will you ${verb}?`, have.map(short).concat(['Never mind']));
  return k !== null && k !== undefined && k < have.length ? have[k] : null;
}
async function share(app, S, id, o = {}) {
  const st = app.state, w = S.w, b = w.partner, me = w.player, m = lead(app), it = ITEMS[id]; if (!it) return;
  ST.addItem(st, id, -1);
  const sp = (m && m.species) || (b && b.m && b.m.def && String(b.m.def.name || '').toLowerCase()) || 'chilichick', el = elems(sp);
  const fan = Object.entries(it.likes || {}).find(([e]) => el.includes(e)), nm = m ? nameOfMon(m) : 'Your partner';
  const wait = sayW(app);
  if (b && me) {
    b.busy = true; b.tlBusy = true; b.path = null;
    const q = me.g.position, tx = q.x + Math.sin(me.yaw) * 0.8, tz = q.z + Math.cos(me.yaw) * 0.8;
    me.play('point', { restart: true });
    const path = w.nav.path({ x: b.g.position.x, y: b.g.position.y, z: b.g.position.z }, { x: tx, y: q.y, z: tz });
    if (path && path.length > 1) await Promise.race([b.walkTo(path.slice(1).map(([x, z]) => [x, z]), { speed: 2 }), wait(2500)]);
    b.path = null; b.face(me);
    const c = b.anim.clips, clip = it.spicy && c.sip ? 'sip' : c.munch ? 'munch' : c.lick ? 'lick' : c.dance ? 'dance' : 'win';
    b.play(clip, { restart: true }); app.audio.sfx && app.audio.sfx('plop', { vol: 0.5 });
    await wait(clip === 'sip' ? 2100 : 1100);
    if (it.spicy) {
      if (el.includes('pyro')) { await breath(S, b, 1.1, { up: 0.6, rate: 70, scale: 0.75 }); app.audio.sfx && app.audio.sfx('pyro', { vol: 0.5 }); }
      else { w.fx.emit('steam', b.headPos(), { n: 10 }); w.fx.emit('sweat', b.headPos(), { n: 3 }); b.play(c.cry ? 'cry' : 'hurt', { restart: true }); }
    } else w.fx.emit('heart', b.headPos(), { n: 4 });
    if (fan) { w.fx.emit('heart', b.headPos(), { n: 5 }); w.fx.emit('sparkle', b.headPos(), { n: 8 }); }
    await wait(900);
  }
  const msg = [];
  if (m) {
    addFriendship(m, (it.friend || 2) + (fan ? fan[1] : 0)); if (it.heal) m.hp = Math.min(1, (m.hp ?? 1) + it.heal);
    if (it.spicy) {
      const p = ensureProg(m); p.eat.tags.spicy = (p.eat.tags.spicy || 0) + 1; p.eat.tags.hot = (p.eat.tags.hot || 0) + 1; p.eat.foods[id] = (p.eat.foods[id] || 0) + 1;
      for (const u of checkUnlocks(m, {}, st.unlocks && st.unlocks.slots)) msg.push(`${nm} learned ${u.name}!`);
    }
    if (m.counters && m.counters.foods && !m.counters.foods.includes(id)) m.counters.foods.push(id);
  }
  if (app.save) app.save();
  const line = o.line ? o.line(nm, !!fan) : fan ? `${nm} loves it! It wolfs down the ${short(id)} and asks for more with its whole face.` : `${nm} gives the ${short(id)} a careful taste… and decides it's fine. Mostly.`;
  await app.say('', line);
  app.toast(`${nm}: friendship +${(it.friend || 2) + (fan ? fan[1] : 0)}`, { icon: 'heart', color: T.pink, dur: 2.2 });
  for (const s of msg) { app.toast(s, { icon: 'sparkle', color: T.green, dur: 3 }); app.audio.sfx && app.audio.sfx('reward'); }
}
// courier jobs: Dot hands you a parcel for one of the stands; deliver it by talking to that vendor
const JOBS = {
  wok: { name: 'Wok & Roll', where: 'Chinatown, Jackson Lane', who: 'Chef Bao', pay: 160, gift: 'chili_noodles', vendor: 'bao', line: 'My new wok lid! Turbo dented the old one revving at it. Here — dinner\'s on me.' },
  fish: { name: 'Pier Pressure', where: 'the Wharf fish market', who: 'Marisol', pay: 140, gift: 'fish_skewer', vendor: 'marisol', line: 'A net-mender\'s kit! Perfect. Take a skewer for the road — and keep it away from Crumb.' },
  boba: { name: 'Bubble Moon cart', where: 'the Wharf promenade', who: 'Pearl', pay: 130, gift: 'boba_tea', vendor: 'pearl', line: 'Fresh tapioca! Zest, we\'re back in business! Here, a drink on the house.' },
  flowers: { name: 'Petal Pushers', where: 'the park\'s south gate', who: 'Fern', pay: 120, gift: 'sweet_peas', vendor: 'fern', line: 'My seed order, at last. Clover will be thrilled. Take a posy, dear.' },
};
const jobOf = (app) => { const j = flags(app.state).tlJob; return j && JOBS[j.to] ? j : null; };
async function deliverHere(app, S) {
  const j = jobOf(app); if (!j || j.to !== S.id) return false;
  const J = JOBS[j.to], st = app.state, me = S.me;
  if (me) { me.play('point', { restart: true }); }
  await app.say(J.who, 'A parcel? From Dot? Oh, wonderful!', J.line);
  delete flags(st).tlJob; flags(st).tlJobs = (flags(st).tlJobs || 0) + 1;
  st.money += J.pay; ST.addItem(st, J.gift, 1);
  app.audio.sfx && app.audio.sfx('reward');
  app.toast(`Delivery done: +$${J.pay}`, { icon: 'bag', color: T.green, dur: 2.6 });
  if (app.save) app.save();
  return true;
}
const partnerName = (app) => { const m = lead(app); return m ? nameOfMon(m) : 'your partner'; };
async function closedSign(app, name, line) { await app.say('', `${name} — CLOSED.`, line); }

// ==================================================================================== the scenes
// at: centre (world x, z); yaw: the way the scene faces (front = local +z); hours: [open, close] (close > 24 runs past
// midnight). Layouts are in local metres (lx along the right, lz towards the front).
const SAUCES = ['hot_sauce_mild', 'hot_sauce', 'hot_sauce_ghost'];
const SCENES = [
  // ------------------------------------------------------------------------------------------ Cluck & Burn
  {
    id: 'hotsauce', name: 'Cluck & Burn', at: [138.6, 111.45], yaw: PI, hours: [9, 23.5], notice: 'heart',
    props: [
      { k: 'tl_saucestall', at: [0, 0], block: [1.4, 0.62] },
      { k: 'tl_grill', at: [2.15, 0.6], block: [0.4, 0.4] },
      { k: 'tl_pepcrate', at: [-1.9, -0.35], yaw: 0.25, block: [0.42, 0.36] },
      { k: 'tl_pepcrate', at: [-1.95, 0.5], yaw: -0.2, s: 0.8, block: [0.34, 0.3] },
      { k: 'sandwich', at: [4.15, 1.4], yaw: 0.35 },
      { k: 'tl_shutter', at: [0, 0.6], y: 1.06, when: (S) => !S.open },
      { k: 'lantern', at: [-0.9, 0.62], y: 1.62, s: 0.45, when: (S) => S.T.night() },
      { k: 'lantern', at: [0.9, 0.62], y: 1.62, s: 0.45, when: (S) => S.T.night() },
    ],
    signs: [{ tex: sign('cluck', 'CLUCK & BURN', 'FIRE-ROASTED HOT SAUCE', 2.5, 0.42, '#c8322a', '#fff2c8', 'chili', { frame: '#5a1210', subCol: '#ffd860' }), at: [0, 0.575], y: 2.66, w: 2.5, h: 0.42 }],
    lamps: [[0, 1.0, 2.2, 0xff9a50, 16, 8]],
    async setup(S) {
      await S.person('inez', 'inez', [0, -0.98, 0], { name: 'Inez', voice: 'friend', when: (S) => S.open });
      await S.mon('encore', 'chilichick', [3.05, 0.2, -PI / 2], { name: 'Encore', as: 'riffrooster', drip: [3, [0, 0, 1]], scale: 1.42 });
      await S.mon('pip', 'chilichick', [-0.92, 0.12, 0.5], { name: 'Pip', y: 1.06 });
    },
    items: () => [
      { who: 'inez', label: 'Shop at Cluck & Burn', icon: 'bag', when: (S) => S.open, act: hotsauceTalk, dyn: (S) => (jobOf(S.app) && jobOf(S.app).to === 'hotsauce' ? 'Deliver the parcel' : null) },
      { mon: 'encore', label: 'Watch Encore roast', icon: 'flame', r: 1.5, when: (S) => S.open, act: encoreRoast },
      { mon: 'pip', label: 'Pet Pip', icon: 'heart', r: 1.4, h: 1.6, act: petPip },
      { at: [0, 1.0], label: 'Read the shutter', icon: 'eye', when: (S) => !S.open, act: (app) => closedSign(app, 'Cluck & Burn', 'Back at 9 AM. Encore needs his beauty sleep. — Inez') },
    ],
    onOpen(S, open) { for (const k of ['encore', 'pip']) { const a = S.cast.get(k); if (a) { a.tlPose = open ? 'idle' : 'sleep'; a.idleClip = a.tlPose; a.play(a.tlPose, { fade: 0.4 }); } } },
    run(S) {
      S.go(inezLoop); S.go(encoreLoop); S.go(pipLoop);
      S.go(() => customers(S, {
        spots: [[0, 1.3], [-1.15, 1.75], [-2.3, 2.0], [-3.45, 2.1]], look: [0, 0], ends: [[11, 2.5], [-12, 2.5]], gap: [6, 12], food: true,
        max: (S) => Math.round(clamp(2 * S.T.crowd(true), 1, 4)),
        serve: (S, c) => serveAt(S, c, { vendor: 'inez', hand: 'tl_bottle', orders: ['One Riffrooster Red, please!', 'The mild one. For… a friend.', 'Ghost Gold. I\'m feeling brave today.', 'Two bottles! My Kissmet loves it.'], thanks: ['Enjoy! Not in your eyes.', 'Fire-roasted this morning!', 'Come back if you survive!'] }),
        after: sauceReact,
      }));
    },
    tick(S) { sauceSmoke(S); },
  },
  // ------------------------------------------------------------------------------------------ Slap Happy
  {
    id: 'busker', name: 'Slap Happy', at: [139.4, 123.7], yaw: PI / 2, hours: [10, 22], notice: 'note',
    props: [{ k: 'tl_busk', at: [0.95, 0.4], yaw: 0.2 }],
    async setup(S) {
      await S.person('jojo', 'jojo', [0, -0.65, 0], { name: 'Jojo', voice: 'punk', when: (S) => S.open });
      await S.mon('slap', 'chilichick', [0, 0.75, 0], { name: 'Slapjack', as: 'funkadoodle', drip: [3, [1, 1, 0]], scale: 1.38 });
    },
    items: () => [
      { who: 'jojo', label: 'Talk to Jojo', icon: 'music', when: (S) => S.open, act: buskerTalk },
      { mon: 'slap', label: 'Cheer for Slapjack', icon: 'star', r: 1.5, when: (S) => S.open, act: cheerSlap },
    ],
    onOpen(S, open) { const a = S.cast.get('slap'); if (a) { a.tlPose = open ? 'idle' : 'sleep'; a.idleClip = a.tlPose; a.play(a.tlPose, { fade: 0.4 }); } },
    run(S) {
      S.go(buskerShow);
      S.go(() => onlookers(S, { spots: [[-1.45, 3.1, PI], [0.1, 3.5, PI], [1.55, 3.0, PI], [-0.5, 4.3, PI]], ends: [[-6, 8], [7, 7], [-2, -5]], gap: [3, 8], stay: [18, 40], watch: fanWatch }));
    },
    tick(S, dt) {
      const a = S.cast.get('slap'); if (!a || !S.open || !S.ev.playing) return;
      if ((S.ev.noteT = (S.ev.noteT || 0) - dt) <= 0) { S.ev.noteT = 0.54; S.fx('note', a, { n: 1, scale: 0.9 }); }
    },
  },
  // ------------------------------------------------------------------------------------------ Wok & Roll
  {
    id: 'wok', name: 'Wok & Roll', at: [135.8, 59.95], yaw: 0, hours: [11, 25.5], notice: 'heart',
    props: [
      { k: 'tl_wokcart', at: [0, 0], block: [1.2, 0.6] },
      { k: 'tl_stool', at: [-1.05, 1.55] }, { k: 'tl_stool', at: [0.1, 1.6] }, { k: 'tl_stool', at: [1.25, 1.55] },
      { k: 'tl_cover', at: [0, 0], y: 1.08, when: (S) => !S.open },
      { k: 'lantern', at: [-2.0, 1.0], y: 2.4, s: 0.55, when: (S) => S.T.night() },
      { k: 'lantern', at: [2.4, 1.0], y: 2.4, s: 0.55, when: (S) => S.T.night() },
    ],
    signs: [{ tex: sign('wok', 'WOK & ROLL', 'NOODLES  NIGHT MARKET', 2.2, 0.34, '#b8282a', '#ffe8a0', 'noodle', { frame: '#e8b840', subCol: '#fff4d8' }), at: [0, 0.02], y: 2.44, w: 2.2, h: 0.34 }],
    lamps: [[0, 0.5, 2.0, 0xff7a40, 16, 8]],
    async setup(S) {
      await S.person('bao', 'bao', [-0.3, -0.95, 0], { name: 'Chef Bao', voice: 'coach', when: (S) => S.open });
      await S.mon('turbo', 'hellcoon', [1.85, -0.45, -1.2], { name: 'Turbo' });
      await S.mon('ghost', 'chochobake', [0.3, 0.3, 0], { name: 'Chochobake', y: 2.0, when: (S) => S.T.night() && S.open });
    },
    items: () => [
      { who: 'bao', label: 'Order at Wok & Roll', icon: 'bag', when: (S) => S.open, act: wokTalk, dyn: (S) => (jobOf(S.app) && jobOf(S.app).to === 'wok' ? 'Deliver the parcel' : null) },
      { mon: 'turbo', label: 'Pet Turbo', icon: 'heart', r: 1.4, act: petTurbo },
      { at: [0, 1.0], label: 'Read the cover', icon: 'eye', when: (S) => !S.open, act: (app) => closedSign(app, 'Wok & Roll', 'Open 11 AM till late. The night market starts at sundown!') },
    ],
    onOpen(S, open) { const a = S.cast.get('turbo'); if (a) { a.tlPose = open ? 'idle' : 'sleep'; a.idleClip = a.tlPose; a.play(a.tlPose, { fade: 0.4 }); } },
    run(S) {
      S.go(wokCook);
      for (let i = 0; i < 3; i++) S.go(() => diner(S, i));
      S.go(() => customers(S, {
        spots: [[2.5, 1.2], [3.5, 1.5], [4.4, 1.7]], look: [0.7, 0], ends: [[-9, 3.0], [11, 3.0]], gap: [8, 14], food: true,
        max: (S) => (S.T.night() ? 3 : S.T.lunch() ? 2 : 1),
        serve: (S, c) => serveAt(S, c, { vendor: 'bao', hand: 'tl_bowl', orders: ['Chili noodles to go!', 'Extra chili, extra Turbo!', 'One bowl, please. The big one.'], thanks: ['Hot hot hot! Mind the bowl!', 'Wok-fired, Turbo-powered!'], prepare: (S) => toss(S, 1) }),
        after: async (S, c) => { c.play('cheer', { restart: true }); S.say(c, pick(['Smells amazing!', 'Night market noodles, best noodles.', 'Turbo, you\'re a legend!'])); await S.sleep(1.2); },
      }));
    },
    tick(S, dt) {
      const g = S.cast.get('ghost'); if (!g || !g.g.parent) return;
      S.ev.th = (S.ev.th || 0) + dt * 0.5; const [x, z] = S.P(0.3 + Math.cos(S.ev.th) * 1.6, 0.4 + Math.sin(S.ev.th) * 1.0);
      g.g.position.set(x, S.y + 2.0 + Math.sin(S.t * 1.7) * 0.15, z); g.targetYaw = S.ev.th + PI;
      if ((S.ev.gT = (S.ev.gT || 0) - dt) <= 0) { S.ev.gT = rnd(0.6, 1.2); S.fx('ghostfire', g.g.position, { n: 1, scale: 0.6 }); }
    },
  },
  // ------------------------------------------------------------------------------------------ Pier Pressure (the fish market's empty stall)
  {
    id: 'fish', name: 'Pier Pressure', at: [38.5, 18.3], yaw: PI, hours: [6, 18.5], notice: '!',
    props: [{ k: 'tl_block', at: [-3.3, 0.5], block: [0.3, 0.3] }],
    signs: [{ tex: sign('fish', 'PIER PRESSURE', 'CATCH OF THE DAY', 2.2, 0.42, '#2a6a7a', '#f8f0d8', 'fish', { frame: '#f8f0d8', subCol: '#ffd860' }), at: [0, 1.74], y: 2.5, w: 2.2, h: 0.42 }],
    async setup(S) {
      await S.person('marisol', 'marisol', [0, -1.05, 0], { name: 'Marisol', voice: 'rival', when: (S) => S.open });
      await S.mon('chomps', 'thrashark', [-3.3, -0.3, 0], { name: 'Chomps' });
      const [px, pz] = S.L(44.6, 13.2); S.ev.perch = [px, pz];
      await S.mon('crumb', 'pidgun', [px, pz, 2.4], { name: 'Captain Crumb' });
    },
    items: () => [
      { who: 'marisol', label: 'Talk to Marisol', icon: 'bag', when: (S) => S.open && !S.ev.chase, act: fishTalk, dyn: (S) => (jobOf(S.app) && jobOf(S.app).to === 'fish' ? 'Deliver the parcel' : null) },
      { mon: 'chomps', label: 'Watch Chomps work', icon: 'eye', r: 1.5, when: (S) => S.open, act: watchChomps },
      { mon: 'crumb', label: 'Grab the thief!', icon: 'fist', r: 1.9, when: (S) => !!S.ev.chase, act: grabThief, hold: false },
      { mon: 'crumb', label: 'Eye the Pidgun', icon: 'eye', r: 1.5, when: (S) => !S.ev.chase, act: eyeCrumb },
    ],
    onOpen(S, open) { const a = S.cast.get('chomps'); if (a) { a.tlPose = open ? 'idle' : 'sleep'; a.idleClip = a.tlPose; a.play(a.tlPose, { fade: 0.4 }); } },
    run(S) {
      S.go(fishWork); S.go(thief);
      S.go(() => customers(S, {
        spots: [[0, 1.45], [1.15, 1.85], [2.3, 2.1]], look: [0, 0], ends: [[12, 3.0], [-14, 3.2]], gap: [8, 15], food: false,
        max: (S) => (S.ev.chase ? 0 : S.T.lunch() ? 3 : 2),
        serve: (S, c) => serveAt(S, c, { vendor: 'marisol', hand: 'tl_fish', orders: ['Two rock cod, please.', 'What\'s fresh today?', 'Something for my Kappachi?'], thanks: ['Caught this morning!', 'Chomps cleaned it himself!'], prepare: async (S) => { const a = S.cast.get('chomps'); if (a) { a.play('snap', { restart: true }); S.sfx('blade', a, 0.4); } await S.sleep(1.1); } }),
        after: async (S, c) => { c.play(pick(['nod', 'cheer']), { restart: true }); await S.sleep(1.0); },
      }));
    },
  },
  // ------------------------------------------------------------------------------------------ Bubble Moon cart
  {
    id: 'boba', name: 'Bubble Moon cart', at: [86.6, 18.55], yaw: PI, hours: [10, 21], notice: 'note',
    props: [{ k: 'tl_bobacart', at: [0, 0], block: [1.15, 0.58] }, { k: 'tl_cover', at: [0, 0], y: 1.13, when: (S) => !S.open }],
    signs: [{ tex: sign('boba', 'BUBBLE MOON', 'BOBA CART  PIER BRANCH', 1.7, 0.36, '#f49ac0', '#ffffff', 'cup', { frame: '#5ab89a', subCol: '#3a2418' }), at: [0, 0.45], y: 0.68, w: 1.7, h: 0.36 }],
    async setup(S) {
      await S.person('pearl', 'pearl', [0, -0.95, 0], { name: 'Pearl', voice: 'friend', when: (S) => S.open });
      await S.mon('zest', 'lemmo', [0.45, 0.05, 0], { name: 'Zest', y: 1.13 });
    },
    items: () => [
      { who: 'pearl', label: 'Order at Bubble Moon', icon: 'bag', when: (S) => S.open, act: bobaTalk, dyn: (S) => (jobOf(S.app) && jobOf(S.app).to === 'boba' ? 'Deliver the parcel' : null) },
      { mon: 'zest', label: 'Pet Zest', icon: 'heart', r: 1.5, h: 1.6, act: petZest },
    ],
    onOpen(S, open) { const a = S.cast.get('zest'); if (a) { a.tlPose = open ? 'idle' : 'sleep'; a.idleClip = a.tlPose; a.play(a.tlPose, { fade: 0.4 }); } },
    run(S) {
      S.go(() => customers(S, {
        spots: [[0, 1.3], [-1.1, 1.65], [-2.2, 1.9]], look: [0, 0], ends: [[12, 3.0], [-12, 3.0]], gap: [7, 13], food: true,
        max: (S) => (S.T.lunch() ? 3 : 2),
        serve: (S, c) => serveAt(S, c, { vendor: 'pearl', hand: 'tl_cup', orders: ['Brown sugar boba, please!', 'Something fizzy!', 'Taro, half sugar, extra pearls.'], thanks: ['Shaken, not stirred!', 'Zest says enjoy!'], prepare: (S) => shake(S, 1.2) }),
        after: bobaReact,
      }));
      S.go(async (S) => { for (;;) { await S.sleep(rnd(9, 15)); if (S.open && !S.serving) await shake(S, 1.0); } });
    },
  },
  // ------------------------------------------------------------------------------------------ Petal Pushers
  {
    id: 'flowers', name: 'Petal Pushers', at: [34.6, 95.9], yaw: -PI / 2, hours: [8, 19], notice: 'heart',
    props: [{ k: 'tl_flowercart', at: [0, 0], block: [1.12, 0.62] }],
    signs: [{ tex: sign('petal', 'PETAL PUSHERS', 'FRESH FROM SUNSET ROW', 1.7, 0.36, '#3a6a3a', '#fff4d8', 'flower', { frame: '#e8d8a8', subCol: '#f8c830' }), at: [0, 0.42], y: 0.6, w: 1.7, h: 0.36 }],
    async setup(S) {
      await S.person('fern', 'fern', [0, -1.0, 0], { name: 'Fern', voice: 'elder', when: (S) => S.open });
      await S.mon('clover', 'cabbunny', [-0.8, 0.95, 0], { name: 'Clover', speed: 0.6 });
      carry(S, S.cast.get('clover'), 'tl_can');
    },
    items: () => [
      { who: 'fern', label: 'Talk to Fern', icon: 'leaf', when: (S) => S.open, act: flowerTalk, dyn: (S) => (jobOf(S.app) && jobOf(S.app).to === 'flowers' ? 'Deliver the parcel' : null) },
      { mon: 'clover', label: 'Pet Clover', icon: 'heart', r: 1.4, act: petClover },
    ],
    onOpen(S, open) { const a = S.cast.get('clover'); if (a) { a.tlPose = open ? 'idle' : 'sleep'; a.idleClip = a.tlPose; a.play(a.tlPose, { fade: 0.4 }); } },
    run(S) {
      S.go(water);
      S.go(async (S) => { for (;;) { await S.sleep(rnd(10, 18)); const v = S.cast.get('fern'); if (!v || !S.open) continue; v.play(pick(['wave', 'explain']), { restart: true }); S.say(v, pick(['Sweet peas! Fresh this morning!', 'Flowers for your partner, dear?', 'Clover, not the tulips, please.', 'Bio Tokonmon love these, you know.'])); await S.sleep(2.4); v.play('idle'); } });
      S.go(() => customers(S, {
        spots: [[0, 1.4], [-1.0, 1.8]], look: [0, 0], ends: [[3, 8], [-6, 3]], gap: [14, 24], food: false, max: () => 1,
        serve: (S, c) => serveAt(S, c, { vendor: 'fern', hand: 'tl_bottle', orders: ['A posy for my mum, please.', 'Sunflower seeds for my Pidgun!'], thanks: ['Lovely choice, dear.', 'Water them daily!'] }),
        after: async (S, c) => { drop(c); c.play('peace', { restart: true }); S.emote(c, 'heart'); await S.sleep(1.4); },
      }));
    },
  },
  // ------------------------------------------------------------------------------------------ Fetch
  {
    id: 'fetch', name: 'Fetch', at: [93.5, 54.5], yaw: PI / 2, hours: [8, 18.5], notice: '!',
    async setup(S) {
      await S.person('hana', 'hana', [0, 0, 0], { name: 'Hana', voice: 'kid', when: (S) => S.open });
      await S.mon('volt', 'zapkit', [0.7, 0.6, 0], { name: 'Volt', speed: 3.4, when: (S) => S.open });
      S.ball = voxObj(S.T.mats, 'tl_ball'); S.ball.visible = false; S.g.add(S.ball);
    },
    items: () => [
      { who: 'hana', label: 'Talk to Hana', icon: 'talk', when: (S) => S.open, act: fetchTalk },
      { mon: 'volt', label: 'Pet Volt', icon: 'heart', r: 1.4, when: (S) => S.open, act: petVolt },
    ],
    run(S) { S.go(fetchLoop); },
  },
  // ------------------------------------------------------------------------------------------ Practice match
  {
    id: 'spar', name: 'Practice match', at: [81.0, 73.4], yaw: 0, hours: [8, 19], notice: 'star',
    async setup(S) {
      await S.person('kenji', 'kenji', [-3.9, 0, PI / 2], { name: 'Kenji', voice: 'rival', when: (S) => S.open });
      await S.person('aiko', 'aiko', [3.9, 0, -PI / 2], { name: 'Aiko', voice: 'friend', when: (S) => S.open });
      await S.mon('fuse', 'dynacoon', [-1.6, 0, PI / 2], { name: 'Fuse', when: (S) => S.open });
      await S.mon('pinchy', 'kanizumo', [1.6, 0, -PI / 2], { name: 'Pinchy', when: (S) => S.open });
    },
    items: () => [
      { who: 'kenji', label: 'Talk to Kenji', icon: 'fist', when: (S) => S.open, act: (app, S) => sparTalk(app, S, 'kenji') },
      { who: 'aiko', label: 'Talk to Aiko', icon: 'fist', when: (S) => S.open, act: (app, S) => sparTalk(app, S, 'aiko') },
    ],
    run(S) {
      S.go(sparLoop);
      S.go(() => onlookers(S, { spots: [[-0.6, 2.8, PI], [0.7, 2.9, PI], [0.2, -2.8, 0]], ends: [[-8, 6], [9, 5], [2, -8]], gap: [6, 14], stay: [25, 50], watch: matchWatch }));
    },
  },
  // ------------------------------------------------------------------------------------------ Nap pile
  {
    id: 'nap', name: 'Nap pile', at: [20.5, 84.5], yaw: 0, hours: [0, 24], notice: 'zzz',
    props: [{ k: 'tl_blanket', at: [0, 0] }, { k: 'tl_stool', at: [-1.45, -0.6] }],
    async setup(S) {
      await S.mon('snooze', 'snoozaque', [0, 0, 0.3], { clip: 'sleep', scale: 1.1 });
      await S.mon('lemmo', 'lemmo', [0.05, 0.12, 0.6], { clip: 'sleep', y: 0.42 });
      await S.mon('bunny', 'cabbunny', [-0.75, 0.4, 1.2], { clip: 'sleep' });
      await S.mon('bub', 'woodbub', [0.72, 0.5, -0.8], { clip: 'sleep' });
      await S.mon('kappa', 'kappachi', [0.35, -0.62, 2.6], { clip: 'sleep' });
      await S.person('moku', 'moku', [-1.45, -0.6, 0.9], { name: 'Grandpa Moku', voice: 'elder', clip: 'wheeze', lock: true });
    },
    items: () => [
      { at: [0, 0.9], label: 'Join the nap pile', icon: 'bed', r: 2.0, act: napJoin },
      { who: 'moku', label: 'Talk to Grandpa Moku', icon: 'talk', act: mokuTalk },
    ],
    run(S) { S.go(napLoop); },
  },
  // ------------------------------------------------------------------------------------------ Swift Wing Express
  {
    id: 'courier', name: 'Swift Wing Express', at: [146.4, 117.4], yaw: -PI / 2, hours: [8, 20], notice: '?',
    props: [{ k: 'tl_parcelcart', at: [0, 0], block: [0.5, 0.4] }, { k: 'sandwich', at: [0.9, 0.55], yaw: -0.3 }],
    signs: [{ tex: sign('wing', 'SWIFT WING', 'EXPRESS COURIER', 1.2, 0.3, '#3a4a6a', '#f8f4ec', 'wing', { frame: '#f0c040', subCol: '#f0c040' }), at: [0, 0.42], y: 1.5, w: 1.2, h: 0.3 }],
    async setup(S) {
      await S.person('dot', 'dot', [0.8, -0.25, 0], { name: 'Dot', voice: 'friend', when: (S) => S.open });
      await S.mon('express', 'pidgun', [0, 0, 0], { name: 'Express', y: 1.14 });
    },
    items: () => [
      { who: 'dot', label: 'Talk to Dot', icon: 'bag', when: (S) => S.open, act: dotTalk },
      { mon: 'express', label: 'Pet Express', icon: 'heart', r: 1.5, h: 1.7, act: petExpress },
    ],
    run(S) { S.go(courierLoop); },
  },
];

// ==================================================================================== scene behaviours
// ---------------------------------------------------------------- Cluck & Burn
async function inezLoop(S) {
  const PITCH = ['Hot sauce! Roasted by a real Riffrooster!', 'Three heats: mild, wild and "why"!', 'Free taste test, if you dare!', 'Small batch! Big burn!'];
  for (;;) {
    await S.sleep(rnd(7, 13));
    const v = S.cast.get('inez'); if (!v || !S.open || S.serving) continue;
    const r = Math.random();
    if (r < 0.5) { v.play('explain', { restart: true }); S.say(v, pick(PITCH)); await S.sleep(2.6); }
    else if (r < 0.8) { const e = S.cast.get('encore'); if (e) v.face(e); v.play('point', { restart: true }); S.say(v, pick(['Encore! Batch three!', 'More peppers, Encore!', 'Low and slow this time, Encore.'])); S.ev.roast = true; await S.sleep(2.2); }
    else { v.play('think', { restart: true }); await S.sleep(2.4); }
    v.play('idle', { fade: 0.3 }); S.faceL(v, 0, 3);
  }
}
async function encoreLoop(S) {
  for (;;) {
    await S.sleep(S.ev.roast ? 0.8 : rnd(6, 11));
    const e = S.cast.get('encore'); if (!e) continue;
    if (!S.open) { S.fx('z', e, { n: 1 }); continue; }
    S.ev.roast = false;
    await roast(S, e, 1.5);
    if (Math.random() < 0.35) { e.play('win', { restart: true }); S.cry(e, 0.6, pick(['COCKA-DOODLE-ROAST!', 'BAWK!'])); }
  }
}
async function roast(S, e, dur) {
  const grill = S.V(2.15, 0.6, 0.85);
  e.faceTo(grill.x, grill.z); e.play('hiccup', { restart: true }); S.sfx('fire', e, 0.6);
  await breath(S, e, dur, { to: grill, rate: 60, scale: 0.6, speed: 0.55 });
  S.fx('smoke', grill, { n: 3, scale: 0.6 }); S.fx('tl_pepper', grill, { n: 2 }); S.sfx('pyro', e, 0.3);
  S.faceL(e, 2.6, 3);
}
function sauceSmoke(S) {
  if (!S.open) return;
  if ((S.ev.smT = (S.ev.smT || 0) - 1 / 60) <= 0) { S.ev.smT = rnd(0.5, 1.1); S.fx('smoke', S.V(2.15, 0.6, 0.95), { n: 1, scale: 0.45 }); if (Math.random() < 0.4) S.fx('ember', S.V(2.15, 0.6, 0.9), { n: 1 }); }
}
async function pipLoop(S) {
  for (;;) {
    await S.sleep(rnd(14, 24));
    const p = S.cast.get('pip'), v = S.cast.get('inez'); if (!p || !S.open) continue;
    p.play('sip', { restart: true }); S.sfx('fire', p, 0.3, 1.3);
    await S.sleep(2.2);
    if (v && Math.random() < 0.6 && !S.serving) { v.face(p); v.play('facepalm', { restart: true }); S.say(v, pick(['Pip! That\'s inventory!', 'Again, Pip? That was a full bottle.', 'Every. Single. Batch.'])); await S.sleep(2.2); v.play('idle'); S.faceL(v, 0, 3); }
    await S.sleep(1.0); p.play('hiccup', { restart: true });
  }
}
async function sauceReact(S, c) {
  const r = Math.random(), e = S.cast.get('encore');
  if (r < 0.4) {                                                       // tastes it on the spot
    S.faceL(c, c.g.position.x > S.x ? -6 : 6, 5); c.play('nod', { restart: true }); await S.sleep(0.9);
    c.play('shock', { restart: true }); S.emote(c, '!', 1.1); S.sfx('pyro', c, 0.4);
    await breath(S, c, 0.9, { ahead: 0.12, drop: 0.08, up: 0.1, rate: 45 });
    S.fx('steam', c, { n: 8 }); S.fx('sweat', c, { n: 3 });
    c.play(pick(['cry', 'laugh', 'pump']), { restart: true }); S.say(c, pick(['HOT HOT HOT!', 'My ears are steaming!', 'Worth it. WORTH IT.', '…I can see sounds.']));
    if (e && Math.random() < 0.5) { e.play('win', { restart: true }); S.cry(e, 0.5); }
    await S.sleep(2.2);
  } else if (r < 0.65 && e) {                                          // a selfie with Encore
    const ep = e.g.position, [lx, lz] = S.L(ep.x, ep.z);
    await S.walkL(c, lx - 0.15, lz + 1.05); c.faceTo(2 * c.g.position.x - ep.x, 2 * c.g.position.z - ep.z);
    c.play('selfie', { restart: true }); await S.sleep(0.9);
    e.play('win', { restart: true }); await S.sleep(0.7); flash(S, c); await S.sleep(0.8);
    c.play('peace', { restart: true }); S.say(c, pick(['Posting this!', 'Encore! Look here!', 'Best. Rooster. Ever.'])); await S.sleep(1.6);
  } else { c.play(pick(['cheer', 'clap', 'nod']), { restart: true }); S.say(c, pick(['For my mom. She puts it on cereal.', 'Riffrooster Red, baby!', 'Ghost Gold… wish me luck.'])); await S.sleep(1.6); }
}
async function hotsauceTalk(app, S) {
  const v = S.cast.get('inez'), me = S.me, st = app.state, f = flags(st);
  if (v && me) { v.face(me); v.play('wave', { restart: true }); }
  if (await deliverHere(app, S)) return;
  if (!f.tlInez) { f.tlInez = 1; await app.say('Inez', 'Welcome to Cluck & Burn! Every pepper in every bottle gets fire-roasted by Encore, my Riffrooster.', 'He was a tiny Chilichick who kept drinking my stock. Now he runs the grill. Pip over there is… in training.'); }
  else await app.say('Inez', pick(['Back for more heat?', 'The Ghost Gold just came off the grill.', 'Encore says hi. That\'s what the smoke means.']));
  const BOUGHT = { hot_sauce_mild: 'Chick Drizzle! Sweet heat. Perfect on eggs, rice, and Tokonmon treats.', hot_sauce: 'Riffrooster Red — the house favourite. Encore roasted that batch personally.', hot_sauce_ghost: 'Ghost Gold. Sign here to say I warned you. …Kidding. Mostly.' };
  await shop(app, S, {
    vendor: 'Inez', title: 'CLUCK & BURN', goods: SAUCES,
    extras: [
      { label: 'Free taste test', icon: 'flame', hint: 'One drop. On the tip of your tongue.', fn: () => tasteTest(app, S) },
      { label: `Share a sauce with ${partnerName(app)}`, icon: 'heart', hint: 'Pyro Tokonmon love it. It counts as spicy food!', when: () => !!S.w.partner && SAUCES.some((id) => (st.bag[id] || 0) > 0), fn: async () => { const id = await sharePick(app, S, SAUCES); if (id) await share(app, S, id); } },
    ],
    bought: async (id) => { if (v) v.play('point', { restart: true }); const p = S.cast.get('pip'); if (p && Math.random() < 0.5) p.play('dance', { restart: true }); await app.say('Inez', BOUGHT[id]); },
  });
  if (v) { v.play('idle'); S.faceL(v, 0, 3); }
}
async function tasteTest(app, S) {
  const w = S.w, me = w.player, v = S.cast.get('inez'), cin = app.cinema, b = w.partner, f = flags(app.state), wait = sayW(app);
  const own = cin && !cin.active; if (own) await cin.begin({ bars: 0.6, hush: false, fov: 32 });
  if (v) v.play('point', { restart: true });
  await app.say('Inez', pick(['One drop of Riffrooster Red. Tip of the tongue. Ready?', 'Taste test! Tip of the tongue. Don\'t be a hero.']));
  if (cin) cin.close(me, { dur: 0.5 });
  me.play('nod', { restart: true }); app.audio.sfx && app.audio.sfx('plop', { vol: 0.5 });
  await wait(1000);
  me.play('shock', { restart: true }); app.feel && app.feel.emote && app.feel.emote(me, '!', 1.2);   // a beat of nothing… then the heat
  if (cin) cin.push(me, { shake: 0.3 });
  app.audio.sfx && app.audio.sfx('pyro_boom', { vol: 0.7 });
  await breath(S, me, 1.3, { ahead: 0.12, drop: 0.07, up: 0.15, rate: 75, scale: 0.85, speed: 0.7 });
  w.fx.emit('steam', me.headPos(), { n: 14, scale: 1.2 }); w.fx.emit('sweat', me.headPos(), { n: 5 }); w.fx.emit('tear', me.headPos(), { n: 4 });
  me.play('cry', { restart: true });
  const e = S.cast.get('encore'); if (e) { e.face(me); e.play('win', { restart: true }); S.cry(e, 0.9, 'BAWK-HA-HA!'); }
  if (b) {                                                             // your partner wants in
    b.busy = true; b.tlBusy = true; b.path = null; b.face(me);
    if (b.anim.clips.sip) { b.play('sip', { restart: true }); }        // a Chilichick squirts the whole bottle into its beak
    else { b.play(b.anim.clips.cry ? 'cry' : 'hurt', { restart: true }); w.fx.emit('sweat', b.headPos(), { n: 3 }); }
  }
  await wait(1700);
  if (cin) cin.ots(v || me, me, { dur: 0.6 });
  await app.say('Inez', pick(['That was the MILD one.', 'Ha! You\'re crying in Riffrooster Red. Respect.', 'Drink some milk. Or don\'t. Encore never does.']));
  if (b && b.anim.clips.sip) await app.say('', `${partnerName(app)} drained the rest of the sample bottle and is breathing little smoke rings. Very proud of itself.`);
  if (!f.tlTaste) { f.tlTaste = 1; const m = lead(app); if (m) addFriendship(m, 2); app.toast('Survived the Cluck & Burn taste test!', { icon: 'flame', color: T.coral, dur: 2.6 }); }
  me.play('idle', { fade: 0.3 });
  if (own) await cin.end();
}
async function encoreRoast(app, S) {
  const e = S.cast.get('encore'), w = S.w, cin = app.cinema, f = flags(app.state), wait = sayW(app);
  const own = cin && !cin.active; if (own) await cin.begin({ bars: 0.7, hush: false, fov: 30 });
  if (cin) cin.hero(e, { dur: 0.9 });
  S.cry(e, 1, 'BAWK!');
  await wait(800);
  const grill = S.V(2.15, 0.6, 0.85);
  e.faceTo(grill.x, grill.z); e.play('hiccup', { restart: true }); app.audio.sfx && app.audio.sfx('fire', { vol: 0.8 });
  await breath(S, e, 2.2, { to: grill, rate: 85, scale: 0.75, speed: 0.6 });
  w.fx.emit('tl_pepper', grill, { n: 6 }); w.fx.emit('smoke', grill, { n: 6 }); w.fx.emit('ember', grill, { n: 10 });
  if (cin) cin.shake(0.12); app.audio.sfx && app.audio.sfx('pyro', { vol: 0.6 });
  e.play('win', { restart: true });
  await wait(600);
  await app.say('Inez', 'Blistered in four seconds flat. That smoky note in every bottle? That\'s all Encore.');
  if (!f.tlRoast) { f.tlRoast = 1; ST.addItem(app.state, 'hot_sauce_mild', 1); await app.say('Inez', 'Here: your first bottle\'s on the house. Don\'t tell Pip.'); }
  S.faceL(e, 2.6, 3);
  if (own) await cin.end();
}
async function petPip(app, S) {
  const p = S.cast.get('pip'), w = S.w, wait = sayW(app);
  p.face(w.player); p.play('hiccup', { restart: true }); app.audio.sfx && app.audio.sfx('fire', { vol: 0.5, pitch: 1.3 });
  await wait(700); w.fx.emit('sweat', w.player.headPos(), { n: 2 });
  await app.say('', 'You reach out to pat Pip. Pip hiccups a little fireball past your ear, then nuzzles your hand like nothing happened.');
  w.fx.emit('heart', p.headPos(), { n: 3 });
}
// ---------------------------------------------------------------- Slap Happy
async function buskerShow(S) {
  for (;;) {
    await S.sleep(1);
    const j = S.cast.get('jojo'), a = S.cast.get('slap'); if (!j || !a || !S.open) { S.ev.playing = false; continue; }
    // a song: about twenty seconds of slapping and dancing, fire puffs on the big beats
    S.ev.playing = true; S.pose(j, 'dance'); S.say(j, pick(['One, two, one-two-three-FOUR!', 'This one\'s called "Hot Wing Stomp"!', 'Slapjack, hit it!']), 'punk');
    const end = S.t + rnd(18, 26);
    while (S.t < end && S.open && !S.dead) {
      a.play('dance', { restart: true });
      await S.sleep(2.4);
      if (Math.random() < 0.3) { a.play('hiccup', { restart: true }); S.sfx('fire', a, 0.35, 1.2); await S.sleep(2.2); }
    }
    S.ev.playing = false;
    if (!S.open) continue;
    a.play('win', { restart: true }); ring(S, a, 'fire', 10, 0.7);
    S.sfx('crowd_cheer', a, 0.5); S.pose(j, 'cheer'); S.say(j, pick(['Thank you, Aoi Plaza!', 'Give it up for SLAPJACK!', 'Tips go in the case, love you all!']), 'punk');
    S.ev.cheer = S.t;
    await S.sleep(2.4); S.pose(j, 'bow'); await S.sleep(2.2); S.pose(j, 'idle');
    await S.sleep(rnd(4, 8));
  }
}
/** a square burst of particles round a Tokonmon (the encore's fire burst, a cheer) */
function ring(S, a, kind, n, r) { const p = a.g.position; for (let i = 0; i < n; i++) { const u = (i / n) * 4, side = Math.floor(u), f = (u - side) * 2 - 1, [dx, dz] = side === 0 ? [f, -1] : side === 1 ? [1, f] : side === 2 ? [-f, 1] : [-1, -f]; S.fx(kind, new V3(p.x + dx * r, p.y + 0.15, p.z + dz * r), { n: 2, scale: 0.9 }); } }
async function fanWatch(S, c) {
  const a = S.cast.get('slap');
  if (S.ev.cheer && S.t - S.ev.cheer < 3) { c.play(pick(['cheer', 'clap']), { restart: true }); S.say(c, pick(['WOOO!', 'Encore!', 'Slapjack!!']), 'kid'); await S.sleep(2); return; }
  if (S.ev.playing && a && Math.random() < 0.12) {                     // a selfie with the star
    const p0 = c.g.position.clone(), ap = a.g.position, [lx, lz] = S.L(ap.x, ap.z);
    await S.walkL(c, lx + (Math.random() < 0.5 ? 0.85 : -0.85), lz + 0.75); c.faceTo(2 * c.g.position.x - ap.x, 2 * c.g.position.z - ap.z);
    c.play('selfie', { restart: true }); await S.sleep(1.2); flash(S, c); await S.sleep(0.9); c.play('peace', { restart: true }); await S.sleep(1.2);
    await S.walk(c, p0.x, p0.z); c.face(a); return;
  }
  c.play(S.ev.playing ? pick(['clap', 'dance', 'clap', 'nod']) : pick(['idle', 'talk']), { restart: true });
  if (S.ev.playing && Math.random() < 0.2) S.say(c, pick(['Go Slapjack!', 'That bassline!', 'Ow!']), 'friend');
  await S.sleep(rnd(2.5, 4.5));
}
async function buskerTalk(app, S) {
  const j = S.cast.get('jojo'), st = app.state, f = flags(st), me = S.me;
  if (j && me) { j.face(me); S.pose(j, 'wave'); }
  if (!f.tlJojo) { f.tlJojo = 1; await app.say('Jojo', 'Yo! Jojo and Slapjack — Slap Happy, the hottest two-piece in the city.', 'He was a Chilichick who slapped every table in my apartment. Then he evolved and grew a bass. Funkadoodle, baby.'); }
  else await app.say('Jojo', pick(['Back for the second set?', 'Slapjack\'s warmed up. Literally.', 'Request line\'s open!']));
  for (;;) {
    const opts = ['Tip $20', 'Dance along', 'Request the fire encore ($50)', 'Bye'];
    const k = await app.choose(`Slap Happy (You have $${st.money})`, opts, { name: 'Jojo' });
    if (k === 0) {
      if (!ST.spend(st, 20)) { app.audio.sfx && app.audio.sfx('ui_error'); await app.say('Jojo', 'Hey, applause is free too!'); continue; }
      app.audio.sfx && app.audio.sfx('coin'); const a = S.cast.get('slap');
      if (j) S.pose(j, 'bow'); if (a) { a.play('win', { restart: true }); S.w.fx.emit('note', a.headPos(), { n: 5 }); }
      f.tlTips = (f.tlTips || 0) + 1; const m = lead(app); if (m) addFriendship(m, 1);
      await app.say('Jojo', pick(['Much love! Slapjack, a little something for our friend!', 'You\'re a legend. This next one\'s for you.']));
      if (app.save) app.save();
    } else if (k === 1) await danceAlong(app, S);
    else if (k === 2) {
      if (!ST.spend(st, 50)) { app.audio.sfx && app.audio.sfx('ui_error'); await app.say('Jojo', 'The fire encore costs fifty. Fire\'s expensive, man.'); continue; }
      app.audio.sfx && app.audio.sfx('coin'); await fireEncore(app, S);
    } else break;
  }
  if (j) S.pose(j, 'idle');
}
async function danceAlong(app, S) {
  const w = S.w, b = w.partner, me = w.player, cin = app.cinema, a = S.cast.get('slap'), wait = sayW(app), f = flags(app.state);
  const own = cin && !cin.active; if (own) await cin.begin({ bars: 0.6, hush: false, fov: 34 });
  if (b) { b.busy = true; b.tlBusy = true; b.path = null; const [x, z] = S.P(0.9, 1.6); b.place(x, z, S.Y(0)); }
  me.play('dance', { restart: true }); if (a) a.play('dance', { restart: true });
  if (cin && a) cin.orbit(a, { deg: 80, time: 6 });
  S.sfx('crowd_cheer', a || me, 0.6);
  for (let i = 0; i < 3; i++) {
    if (b) { b.play(b.anim.clips.dance ? 'dance' : 'win', { restart: true }); w.fx.emit('note', b.headPos(), { n: 2 }); }
    if (a) { a.play(i === 2 ? 'hiccup' : 'dance', { restart: true }); }
    for (const c of S.all) if (c.tlKey === 'fan') c.play(pick(['clap', 'cheer', 'dance']), { restart: true });
    await wait(2300);
  }
  me.play('cheer', { restart: true }); if (a) { a.play('win', { restart: true }); ring(S, a, 'note', 8, 0.8); }
  const last = f.tlDance || 0, now = Date.now(); let line = 'The crowd goes wild. Jojo points at you: "Give it up for our guest dancer!"';
  if (now - last > 3600e3) { f.tlDance = now; const m = lead(app); if (m) { addFriendship(m, 3); app.toast(`${nameOfMon(m)} had a blast: friendship +3`, { icon: 'heart', color: T.pink }); } }
  await wait(900); await app.say('', line);
  if (own) await cin.end();
}
async function fireEncore(app, S) {
  const a = S.cast.get('slap'), cin = app.cinema, w = S.w, wait = sayW(app), j = S.cast.get('jojo');
  const own = cin && !cin.active; if (own) await cin.begin({ bars: 0.75, hush: false, fov: 30 });
  if (j) { S.pose(j, 'point'); S.say(j, 'Ladies and gentlemen… THE FIRE ENCORE!', 'punk'); }
  if (cin) cin.hero(a, { dur: 0.8 });
  await wait(1200);
  a.play('special', { restart: true }); app.audio.sfx && app.audio.sfx('charge_release', { vol: 0.6 });
  await wait(700);
  for (let k = 0; k < 3; k++) { ring(S, a, 'fire', 14, 0.6 + k * 0.5); app.audio.sfx && app.audio.sfx(k === 2 ? 'pyro_boom' : 'pyro', { vol: 0.6 }); if (cin) cin.shake(0.1 + k * 0.06); await wait(330); }
  if (cin) cin.flash('#fff0c0', 0.25, 0.5);
  a.play('win', { restart: true }); w.fx.emit('note', a.headPos(), { n: 8 }); app.audio.sfx && app.audio.sfx('crowd_cheer', { vol: 0.8 });
  for (const c of S.all) if (c.tlKey === 'fan') c.play('cheer', { restart: true });
  await wait(1200);
  await app.say('Jojo', 'SLAPJACK, EVERYBODY!', 'That\'s a Funkadoodle for you. Slaps the bass, breathes fire, never misses a beat.');
  const m = lead(app); if (m) addFriendship(m, 2);
  if (own) await cin.end();
}
async function cheerSlap(app, S) {
  const a = S.cast.get('slap'), me = S.me, wait = sayW(app);
  me.play('cheer', { restart: true }); a.face(me); a.play('win', { restart: true }); S.w.fx.emit('note', a.headPos(), { n: 4 }); S.cry(a, 0.8);
  await wait(900);
  await app.say('', 'Slapjack spins, slaps a funky lick on its flame-painted bass and points a wing at you. You have been acknowledged.');
}
// ---------------------------------------------------------------- Wok & Roll
async function toss(S, n = 1) {
  const v = S.cast.get('bao'), t = S.cast.get('turbo'), wok = S.V(0.69, -0.06, 1.35);
  for (let i = 0; i < n; i++) {
    if (t) { t.faceTo(wok.x, wok.z); t.play(t.anim.clips.rev ? 'rev' : 'attack', { restart: true }); S.fx('fire', S.V(0.69, -0.06, 1.12), { n: 10, scale: 0.9 }); S.sfx('pyro', t, 0.35); }
    if (v) v.play('cheer', { restart: true });
    S.fx('tl_noodle', wok, { n: 5 }); S.fx('steam', wok, { n: 4 }); S.sfx('fire', wok, 0.35, 1.3);
    await S.sleep(1.1);
    if (v) v.play('idle', { fade: 0.3 });
  }
}
async function wokCook(S) {
  for (;;) {
    await S.sleep(rnd(4, 7));
    const v = S.cast.get('bao'), t = S.cast.get('turbo'); if (!v || !S.open) continue;
    if (Math.random() < 0.3) { v.play('explain', { restart: true }); S.say(v, pick(['Hot noodles! Hot hot hot!', 'Turbo, more heat!', 'Order up!', 'Night market special: extra chili!']), 'coach'); await S.sleep(2.2); v.play('idle'); continue; }
    if (t && Math.random() < 0.3) { t.play(t.anim.clips.rev ? 'rev' : 'win', { restart: true }); S.cry(t, 0.5); }
    await toss(S, 1);
    if (Math.random() < 0.3) { await S.sleep(0.6); await toss(S, 1); }
  }
}
async function diner(S, i) {
  const seats = [[-1.05, 1.55], [0.1, 1.6], [1.25, 1.55]];
  await S.sleep(rnd(0.5, 6) + i * 2);
  for (;;) {
    await S.sleep(rnd(4, 12));
    const cap = S.T.night() ? 3 : S.T.lunch() ? 3 : 2;
    if (!S.open || !S.live || i >= cap) continue;
    const [sx, sz] = seats[i], end = pick([[-9, 3.0], [11, 3.0]]);
    const c = await S.person('diner', 'passerby' + (1 + Math.floor(Math.random() * 400)), [end[0], end[1], 0], { temp: true, speed: rnd(1.1, 1.3) });
    if (!c) continue;
    await S.walkL(c, sx, sz + 0.25); c.targetYaw = S.Y(PI); c.g.position.set(...(() => { const [x, z] = S.P(sx, sz + 0.05); return [x, S.y, z]; })());
    S.pose(c, 'sit', true);
    const bao = S.cast.get('bao'); if (bao) { bao.face(c); S.say(bao, pick(['One chili noodle, coming up!', 'Sit, sit! Two minutes!']), 'coach'); }
    await S.sleep(2.5); await toss(S, 1); hold(S, c, 'tl_bowl', 'L');
    const until = S.t + rnd(22, 40);
    while (S.t < until && S.open && !S.dead) {
      await S.sleep(rnd(3, 6));
      if (Math.random() < 0.5) S.fx('steam', mouth(c, 0.3, 0.45), { n: 2, scale: 0.6 });
      if (Math.random() < 0.3) { S.pose(c, 'sitTalk'); S.say(c, pick(['So good…', 'Mmmph!', 'Spicy! Spicy!', 'Turbo, you\'re a genius.'])); await S.sleep(2.2); S.pose(c, 'sit'); }
    }
    drop(c); c.tlLock = false; c.tlPose = null; c.play('idle', { fade: 0.3 });
    await S.sleep(0.6); S.say(c, pick(['Thanks, Bao!', 'Same time tomorrow!']));
    await S.walkL(c, end[0] > 0 ? -9 : 11, 3.0);
    S.drop(c);
  }
}
async function wokTalk(app, S) {
  const v = S.cast.get('bao'), me = S.me, f = flags(app.state);
  if (v && me) { v.face(me); v.play('wave', { restart: true }); }
  if (await deliverHere(app, S)) return;
  if (!f.tlBao) { f.tlBao = 1; await app.say('Chef Bao', 'Welcome to Wok & Roll! Forty years of noodles, and the last five with Turbo.', 'A Hellcoon revs hotter than any gas burner. Wok hei, my friend. Breath of the wok!'); }
  else await app.say('Chef Bao', pick(['Hungry? Of course you are.', 'Turbo\'s in a good mood. Extra smoky tonight.', 'Sit, sit!']));
  await shop(app, S, {
    vendor: 'Chef Bao', title: 'WOK & ROLL', goods: ['chili_noodles'],
    extras: [
      { label: 'Watch Turbo fire the wok', icon: 'flame', hint: 'Breath of the wok, Hellcoon style.', fn: () => wokShow(app, S) },
      { label: `Share noodles with ${partnerName(app)}`, icon: 'heart', hint: 'Smoky and a little spicy.', when: () => !!S.w.partner && (app.state.bag.chili_noodles || 0) > 0, fn: () => share(app, S, 'chili_noodles') },
    ],
    bought: async () => { await wokShow(app, S, true); },
  });
  if (v) { v.play('idle'); S.faceL(v, 0, 3); }
}
async function wokShow(app, S, order) {
  const t = S.cast.get('turbo'), v = S.cast.get('bao'), cin = app.cinema, w = S.w, wait = sayW(app), wok = S.V(0.69, -0.06, 1.3);
  const own = cin && !cin.active; if (own) await cin.begin({ bars: 0.7, hush: false, fov: 30 });
  if (cin && t) cin.two(t, v || S.me, { dur: 0.8 });
  if (v) { v.play('point', { restart: true }); }
  await app.say('Chef Bao', order ? 'Turbo! One bowl, full throttle!' : 'Turbo! Show them the breath of the wok!');
  if (t) { t.faceTo(wok.x, wok.z); t.play(t.anim.clips.rev ? 'rev' : 'attack', { restart: true }); S.cry(t, 1); }
  app.audio.sfx && app.audio.sfx('pyro', { vol: 0.7 });
  await S.tween(1.6, (k, dt) => { w.fx.emit('fire', S.V(0.69, -0.06, 1.12), { dt, rate: 50, speed: 1.2, scale: 1.1, key: 'tl-wok' }); });
  w.fx.emit('fire', wok, { n: 18, scale: 1.4 }); w.fx.emit('tl_noodle', wok, { n: 10 }); w.fx.emit('steam', wok, { n: 10 }); app.audio.sfx && app.audio.sfx('pyro_boom', { vol: 0.6 });
  if (cin) cin.shake(0.15);
  if (v) v.play('cheer', { restart: true });
  await wait(1200);
  if (order) { if (v) v.play('point', { restart: true }); await app.say('Chef Bao', 'Wok-fired chili noodles! Careful, the bowl is hotter than Turbo.'); }
  else await app.say('', 'A column of flame licks round the wok and the noodles leap a metre into the air. Every one of them lands back in the wok. Turbo looks extremely pleased with itself.');
  if (own) await cin.end();
}
async function petTurbo(app, S) {
  const t = S.cast.get('turbo'), w = S.w;
  t.face(w.player); t.play('win', { restart: true }); S.cry(t, 0.8); w.fx.emit('heart', t.headPos(), { n: 3 }); w.fx.emit('sweat', w.player.headPos(), { n: 2 });
  await app.say('', S.open ? 'Turbo\'s fur is warm as a stovetop. It revs happily under your hand… and singes your sleeve a little.' : 'Turbo is curled up under the cart, still warm from the evening rush. It purrs like an idling engine.');
}
// ---------------------------------------------------------------- Pier Pressure
async function fishWork(S) {
  for (;;) {
    await S.sleep(rnd(3, 6));
    const v = S.cast.get('marisol'), a = S.cast.get('chomps'); if (!S.open || S.ev.chase) continue;
    const r = Math.random();
    if (a && r < 0.55) { const b = S.V(-3.3, 0.5, 0.7); a.faceTo(b.x, b.z); a.play('snap', { restart: true }); S.sfx('blade', a, 0.35); await S.sleep(0.5); S.fx('splash', b, { n: 4, scale: 0.6 }); }
    else if (v && a && r < 0.75) { v.face(a); v.play('throw', { restart: true }); S.say(v, pick(['Scraps for Chomps!', 'Good boy, Chomps.']), 'rival'); await S.sleep(0.5); a.play('snap', { restart: true }); S.cry(a, 0.5); S.fx('heart', a, { n: 2 }); await S.sleep(1.2); v.play('idle'); S.faceL(v, 0, 3); }
    else if (v && !S.serving) { v.play('explain', { restart: true }); S.say(v, pick(['Fresh catch! Pier to plate in an hour!', 'Rock cod! Sand dabs! Ask about the crab!', 'Watch your fish around that Pidgun!']), 'rival'); await S.sleep(2.4); v.play('idle'); }
  }
}
const CHASE = [[37.2, 16.0], [32.5, 14.4], [27.5, 14.9], [29.5, 12.9], [36.5, 12.8], [42.5, 13.6], [43.5, 15.5], [39.5, 16.1]];
async function thief(S) {
  await S.sleep(rnd(20, 35));
  for (;;) {
    await S.sleep(rnd(45, 80));
    const c = S.cast.get('crumb'), v = S.cast.get('marisol'); if (!c || !v || !S.open || !S.live || S.busy) continue;
    // swoop onto the counter, snatch a fish
    await fly(S, c, S.V(-0.4, 0.95, 0.82), 1.6, 3.5);
    carry(S, c, 'tl_fish'); S.sfx('grab', c, 0.6); S.cry(c, 0.8, 'Coo-HEH!');
    v.face(c); v.play('shock', { restart: true }); S.emote(v, '!', 1.4); S.say(v, pick(['HEY! THAT\'S MY HALIBUT!', 'CRUMB! DROP IT!', 'NOT AGAIN!']), 'rival');
    await S.sleep(0.6);
    await fly(S, c, new V3(36.0, S.nav.ground(36, 15.4, 0), 15.4), 0.9, 4);
    // round the promenade, Marisol on its tail (two laps at most)
    S.ev.chase = true; v.tlWhen = null;
    const laps = 2, pts = [];
    for (let l = 0; l < laps; l++) pts.push(...CHASE);
    let caught = false;
    for (const [x, z] of pts) {
      if (S.ev.caught) { caught = true; break; }
      c.speed = 3.0; const cw = S.walk(c, x, z, { speed: 3.0, direct: true });
      if (c.anim.cur) c.anim.cur.speed = 2.2;
      S.walk(v, c.g.position.x, c.g.position.z, { speed: 2.7, direct: true });
      if (Math.random() < 0.25) S.say(v, pick(['Come back here!', 'You feathered menace!', 'Somebody grab that Pidgun!']), 'rival');
      await cw;
      if (Math.random() < 0.3) S.fx('feather', c, { n: 2 });
    }
    if (S.ev.caught) caught = true;
    S.ev.chase = false;
    while (S.busy && !S.dead) await S.sleep(0.4);                       // you're handing the fish back: let that play out
    if (!caught) {
      // it gets away: back up to its perch with the fish, and a gulp
      await fly(S, c, S.V(S.ev.perch[0], S.ev.perch[1], 0), 1.8, 4);
      drop(c); c.play('peck', { restart: true }); S.cry(c, 0.6);
      v.play('sigh', { restart: true }); S.say(v, pick(['Every. Single. Day.', 'Fine. Keep it. Choke on the bones.', 'Chomps, why didn\'t you help?']), 'rival');
      await S.sleep(1.6);
    }
    S.ev.caught = false;
    await S.walkL(v, 0, -1.05); S.faceL(v, 0, 3); v.play('idle'); v.tlWhen = () => S.open;
    if (c.g.position.distanceTo(S.V(S.ev.perch[0], S.ev.perch[1], 0)) > 0.5) await fly(S, c, S.V(S.ev.perch[0], S.ev.perch[1], 0), 1.5, 4);
  }
}
async function grabThief(app, S) {
  const c = S.cast.get('crumb'), v = S.cast.get('marisol'), cin = app.cinema, w = S.w, me = w.player, f = flags(app.state), wait = sayW(app);
  S.ev.caught = true; c.path = null; if (c.arrive) { const r = c.arrive; c.arrive = null; r(); }
  v.path = null; if (v.arrive) { const r = v.arrive; v.arrive = null; r(); }
  const own = cin && !cin.active; if (own) await cin.begin({ bars: 0.7, hush: false, fov: 32 });
  me.face(c); me.play('throw', { restart: true });
  if (cin) { cin.push(c, { shake: 0.2 }); cin.hitStop(160); }
  app.audio.sfx && app.audio.sfx('grab', { vol: 0.8 });
  c.play('hurt', { restart: true }); w.fx.emit('feather', c.headPos(), { n: 10 }); w.fx.emit('star', c.headPos(), { n: 4 });
  drop(c); hold(S, me, 'tl_fish');
  await wait(900);
  S.cry(c, 0.8, 'Coo… coo.'); w.fx.emit('sweat', c.headPos(), { n: 2 });
  await S.walk(v, me.g.position.x + 0.9, me.g.position.z + 0.4, { speed: 2.4, direct: true });
  v.face(me); me.face(v);
  if (cin) cin.two(v, me, { dur: 0.6 });
  drop(me);
  await app.say('Marisol', 'You CAUGHT him! Nobody catches Captain Crumb!', pick(['Here — a reward, and a skewer on the house.', 'You\'ve got quicker hands than Chomps. Take this!']));
  app.state.money += 150; ST.addItem(app.state, 'fish_skewer', 1); f.tlThief = (f.tlThief || 0) + 1;
  app.audio.sfx && app.audio.sfx('reward');
  if (f.tlThief === 1) app.toast('Caught the fish thief!', { icon: 'star', color: T.amber, dur: 2.6 });
  if (app.save) app.save();
  await app.say('', 'Captain Crumb waddles off in a huff. It looks back once, the way a Pidgun looks back when it is already planning tomorrow.');
  if (own) await cin.end();
}
async function fishTalk(app, S) {
  const v = S.cast.get('marisol'), me = S.me, f = flags(app.state);
  if (v && me) { v.face(me); v.play('wave', { restart: true }); }
  if (await deliverHere(app, S)) return;
  if (!f.tlMarisol) { f.tlMarisol = 1; await app.say('Marisol', 'Pier Pressure, best fish on the Wharf. That\'s Chomps. Thrashark. Fillets faster than any knife.', 'And THAT, up on the railing, is Captain Crumb. Do not make eye contact.'); }
  else await app.say('Marisol', pick(['What\'ll it be?', 'Crumb\'s been quiet today. Too quiet.', 'Chomps already ate breakfast. Twice.']));
  await shop(app, S, {
    vendor: 'Marisol', title: 'PIER PRESSURE', goods: ['fish_skewer', 'kelp_chips'],
    extras: [
      { label: 'Ask about Captain Crumb', icon: 'eye', hint: 'The Pidgun on the railing.', fn: async () => { await app.say('Marisol', 'Three years that Pidgun has robbed me. Same time, same fish, same smug little coo.', 'If you ever see him running off with my catch, grab him. There\'s a reward in it.'); } },
      { label: `Share a snack with ${partnerName(app)}`, icon: 'heart', hint: 'Hydro Tokonmon love the salt.', when: () => !!S.w.partner && ['fish_skewer', 'kelp_chips'].some((id) => (app.state.bag[id] || 0) > 0), fn: async () => { const id = await sharePick(app, S, ['fish_skewer', 'kelp_chips']); if (id) await share(app, S, id); } },
    ],
    bought: async () => { const a = S.cast.get('chomps'); if (a) { a.play('snap', { restart: true }); S.cry(a, 0.6); } await app.say('Marisol', pick(['Chomps, wrap it up!', 'Fresh as it gets.'])); },
  });
  if (v) { v.play('idle'); S.faceL(v, 0, 3); }
}
async function watchChomps(app, S) {
  const a = S.cast.get('chomps'), wait = sayW(app), b = S.V(-3.3, 0.5, 0.7);
  a.faceTo(b.x, b.z);
  for (let i = 0; i < 3; i++) { a.play('snap', { restart: true }); app.audio.sfx && app.audio.sfx('blade', { vol: 0.5, pitch: 1 + i * 0.1 }); S.w.fx.emit('splash', b, { n: 4, scale: 0.6 }); await wait(650); }
  S.cry(a, 0.8);
  await app.say('', 'Chomp. Chomp. Chomp. Three perfect fillets, and Chomps eats the fourth piece as a fee.');
}
async function eyeCrumb(app, S) {
  const c = S.cast.get('crumb'); c.face(S.me); c.play('puff', { restart: true }); S.cry(c, 0.7);
  await app.say('', 'Captain Crumb puffs up and stares at the fish stall. It is not looking at you. It is never looking at you.');
}
// ---------------------------------------------------------------- Bubble Moon cart
async function shake(S, dur = 1.2) {
  const z = S.cast.get('zest'); if (!z) return;
  const base = z.g.position.clone();
  z.play(z.anim.clips.zap ? 'zap' : 'dance', { restart: true }); S.sfx('volto', z, 0.35, 1.3);
  await S.tween(dur, (k, dt) => {
    z.g.position.set(base.x + (Math.random() - 0.5) * 0.05, base.y + Math.abs(Math.sin(k * 40)) * 0.03, base.z + (Math.random() - 0.5) * 0.05);
    if (Math.random() < dt * 8) S.fx(Math.random() < 0.5 ? 'bolt' : 'spark', z, { n: 1, scale: 0.7 });
  });
  z.g.position.copy(base); S.fx('bubble', z, { n: 4, scale: 0.7 });
}
async function bobaReact(S, c) {
  const z = S.cast.get('zest');
  c.play('sip', { restart: true }); await S.sleep(1.4);
  if (z && Math.random() < 0.35) {                                     // feeding Zest a pearl
    c.face(z); c.play('point', { restart: true }); z.play(z.anim.clips.pucker ? 'pucker' : 'win', { restart: true }); S.fx('heart', z, { n: 2 }); S.say(c, 'One pearl for you, Zest!'); await S.sleep(1.6);
  } else { c.play(pick(['cheer', 'nod']), { restart: true }); S.say(c, pick(['It\'s crackling!', 'Perfect shake!', 'Pearls on point.'])); await S.sleep(1.2); }
}
async function bobaTalk(app, S) {
  const v = S.cast.get('pearl'), me = S.me, f = flags(app.state);
  if (v && me) { v.face(me); v.play('wave', { restart: true }); }
  if (await deliverHere(app, S)) return;
  if (!f.tlPearl) { f.tlPearl = 1; await app.say('Pearl', 'Hi hi! Bubble Moon\'s pier branch! Downtown does the café, I do the sea breeze.', 'Zest shakes every drink. Lemmo static makes the pearls bouncy. It\'s science! Probably.'); }
  else await app.say('Pearl', pick(['Thirsty?', 'Zest is extra zappy today.', 'Try the fizz!']));
  await shop(app, S, {
    vendor: 'Pearl', title: 'BUBBLE MOON', goods: ['boba_tea', 'lemmo_fizz'],
    extras: [
      { label: 'Ask Zest for an extra-fizzy shake', icon: 'bolt', hint: 'Free! But stand back.', fn: () => extraShake(app, S) },
      { label: `Share a drink with ${partnerName(app)}`, icon: 'heart', hint: 'Volto Tokonmon get giddy.', when: () => !!S.w.partner && ['boba_tea', 'lemmo_fizz'].some((id) => (app.state.bag[id] || 0) > 0), fn: async () => { const id = await sharePick(app, S, ['boba_tea', 'lemmo_fizz']); if (id) await share(app, S, id); } },
    ],
    bought: async () => { await shake(S, 1.0); if (v) v.play('point', { restart: true }); await app.say('Pearl', pick(['Shaken by Zest! Enjoy!', 'Here you go! Careful, it fizzes.'])); },
  });
  if (v) { v.play('idle'); S.faceL(v, 0, 3); }
}
async function extraShake(app, S) {
  const z = S.cast.get('zest'), cin = app.cinema, f = flags(app.state), wait = sayW(app);
  const own = cin && !cin.active; if (own) await cin.begin({ bars: 0.6, hush: false, fov: 30 });
  if (cin) cin.close(z, { dur: 0.6 });
  await app.say('Pearl', 'Zest! Maximum shake!');
  await shake(S, 2.2);
  S.w.fx.emit('bolt', z.headPos(), { n: 6 }); S.w.fx.emit('spark', z.headPos(), { n: 10 }); S.w.fx.emit('bubble', z.headPos(), { n: 12 });
  app.audio.sfx && app.audio.sfx('volto', { vol: 0.8 }); if (cin) { cin.shake(0.15); cin.flash('#f0f8ff', 0.2, 0.5); }
  z.play('win', { restart: true });
  await wait(700);
  const day = Math.floor(Date.now() / 864e5);
  if (f.tlFizz !== day) { f.tlFizz = day; ST.addItem(app.state, 'lemmo_fizz', 1); await app.say('Pearl', 'Whoa, the lid popped clean off! That one\'s too fizzy to sell. It\'s yours!'); }
  else await app.say('Pearl', 'Ha! That\'s enough excitement for one day, Zest.');
  if (own) await cin.end();
}
async function petZest(app, S) {
  const z = S.cast.get('zest'), w = S.w;
  z.face(w.player); z.play(z.anim.clips.zap ? 'zap' : 'win', { restart: true }); S.cry(z, 0.8); w.fx.emit('bolt', w.player.headPos(), { n: 2 }); app.audio.sfx && app.audio.sfx('volto', { vol: 0.4, pitch: 1.5 });
  await app.say('', 'Zap! Your hair stands straight up. Zest puckers proudly; that is how it says hello.');
}
// ---------------------------------------------------------------- Petal Pushers
async function water(S) {
  for (;;) {
    const c = S.cast.get('clover'); if (!c) return;
    if (!S.open) { await S.sleep(3); continue; }
    for (const lx of [-0.8, -0.27, 0.27, 0.8]) {
      if (!S.open || S.dead) break;
      await S.walkL(c, lx, 0.95, { speed: 0.6 }); S.faceL(c, lx, 0); await S.sleep(0.3);
      const can = c.tlHeld; if (can) can.rotation.z = -0.6;
      for (let k = 0; k < 4; k++) { S.fx('drop', S.V(lx, 0.55, 0.95), { n: 2, scale: 0.6 }); await S.sleep(0.35); }
      if (can) can.rotation.z = 0;
      if (Math.random() < 0.3) { S.fx('petal', S.V(lx, 0.45, 1.4), { n: 3 }); c.play(pick(['thump', 'peek', 'dance']), { restart: true }); await S.sleep(1.2); }
    }
    await S.sleep(rnd(3, 6));
    const v = S.cast.get('fern');
    if (v && Math.random() < 0.4) { v.face(c); v.play('point', { restart: true }); S.say(v, 'Here, Clover, a leaf for you.', 'elder'); c.play(c.anim.clips.thump ? 'thump' : 'win', { restart: true }); S.fx('heart', c, { n: 2 }); await S.sleep(2); v.play('idle'); S.faceL(v, 0, 3); }
  }
}
async function flowerTalk(app, S) {
  const v = S.cast.get('fern'), me = S.me, f = flags(app.state);
  if (v && me) { v.face(me); v.play('wave', { restart: true }); }
  if (await deliverHere(app, S)) return;
  if (!f.tlFern) { f.tlFern = 1; await app.say('Fern', 'Hello, dear. Petal Pushers: everything grown on Sunset Row, wheeled up here every morning.', 'Clover does the watering. Bit too much watering, sometimes. Mind your shoes.'); }
  else await app.say('Fern', pick(['Lovely day for flowers.', 'Clover\'s been very good today.', 'The sweet peas are fragrant this morning.']));
  await shop(app, S, {
    vendor: 'Fern', title: 'PETAL PUSHERS', goods: ['sweet_peas', 'sunflower_seeds'],
    extras: [{ label: `Share a treat with ${partnerName(app)}`, icon: 'heart', hint: 'Bio and Aero Tokonmon love these.', when: () => !!S.w.partner && ['sweet_peas', 'sunflower_seeds'].some((id) => (app.state.bag[id] || 0) > 0), fn: async () => { const id = await sharePick(app, S, ['sweet_peas', 'sunflower_seeds']); if (id) await share(app, S, id); } }],
    bought: async () => { if (v) v.play('point', { restart: true }); await app.say('Fern', pick(['Wrapped with a ribbon. There you are.', 'They\'ll keep a week in water.'])); },
  });
  if (v) { v.play('idle'); S.faceL(v, 0, 3); }
}
async function petClover(app, S) {
  const c = S.cast.get('clover'), w = S.w;
  c.face(w.player); c.play(c.anim.clips.thump ? 'thump' : 'win', { restart: true }); w.fx.emit('drop', w.player.headPos(), { n: 8 }); w.fx.emit('heart', c.headPos(), { n: 2 });
  await app.say('', 'Clover tilts its watering can and gives your head a gentle sprinkle. Congratulations. You are a flower now.');
}
// ---------------------------------------------------------------- Fetch
function throwBall(S, from, to, h = 1.8) {
  const b = S.ball, p0 = from.clone(), d = p0.distanceTo(to);
  b.visible = true; b.position.copy(p0);
  return S.tween(clamp(d / 7, 0.6, 1.4), (k) => { b.position.lerpVectors(p0, to, k); b.position.y += Math.sin(k * PI) * h; b.rotation.x += 0.4; }).then(() => {
    const q = b.position.clone(); return S.tween(0.35, (k) => { b.position.set(q.x + k * 0.3, q.y + Math.sin(k * PI) * 0.18, q.z); });
  });
}
async function fetchRun(S, runner, o = {}) {
  const b = S.ball, bp = b.position;
  runner.path = null;
  const run = S.walk(runner, bp.x, bp.z, { speed: o.speed || 3.4, direct: true });
  if (runner.anim.cur) runner.anim.cur.speed = 1.8;
  await run;
  if (S.ballTaken) return false;
  S.ballTaken = runner;
  runner.play(runner.anim.clips.pounce ? 'pounce' : 'win', { restart: true }); b.visible = false; carry(S, runner, 'tl_ball'); S.sfx('boing', runner, 0.4);
  return true;
}
async function fetchLoop(S) {
  for (;;) {
    await S.sleep(rnd(2, 4));
    const k = S.cast.get('hana'), v = S.cast.get('volt'); if (!k || !v || !S.open || S.busy) continue;
    S.faceL(k, 0, 3); k.play('throw', { restart: true }); S.say(k, pick(['Fetch, Volt!', 'Go long!', 'Ready… GO!']), 'kid');
    await S.sleep(0.3);
    const to = S.V(rnd(-2.5, 2.5), rnd(3.2, 7.5), 0.05); S.ballTaken = null;
    await throwBall(S, S.V(0, 0.25, 1.15), to);
    await fetchRun(S, v);
    const hp = k.g.position; await S.walk(v, hp.x + Math.sin(k.yaw) * 0.6, hp.z + Math.cos(k.yaw) * 0.6, { speed: 3.0, direct: true });
    v.face(k); drop(v); S.ball.visible = true; S.ball.position.copy(S.V(0, 0.45, 0.05)).y = S.y + 0.05;
    v.play(v.anim.clips.ho ? 'ho' : 'win', { restart: true }); k.play('cheer', { restart: true }); S.say(k, pick(['Good boy!', 'Best Zapkit ever!', 'Again? AGAIN!']), 'kid');
    if (Math.random() < 0.35) { await S.sleep(1.2); k.face(v); k.play('bow', { restart: true }); S.fx('heart', v, { n: 3 }); S.cry(v, 0.6); }
    await S.sleep(1.5); S.ball.visible = false;
  }
}
async function fetchTalk(app, S) {
  const k = S.cast.get('hana'), me = S.me, f = flags(app.state);
  if (k && me) { k.face(me); k.play('wave', { restart: true }); }
  if (!f.tlHana) { f.tlHana = 1; await app.say('Hana', 'This is Volt! He\'s the fastest Zapkit on the whole hill. Wanna see?'); }
  else await app.say('Hana', pick(['Volt wants to play again!', 'Bet your partner can\'t beat Volt!']));
  const opts = ['Throw the ball for Volt', ...(S.w.partner ? [`Race ${partnerName(app)} against Volt`] : []), 'Bye'];
  const c = await app.choose('Fetch?', opts, { name: 'Hana' });
  if (c === 0) await playerThrow(app, S, false);
  else if (c === 1 && S.w.partner) await playerThrow(app, S, true);
}
async function playerThrow(app, S, race) {
  const w = S.w, me = w.player, v = S.cast.get('volt'), k = S.cast.get('hana'), b = w.partner, cin = app.cinema, wait = sayW(app), f = flags(app.state);
  const own = cin && !cin.active; if (own) await cin.begin({ bars: 0.55, hush: false, fov: 34 });
  me.faceTo(...S.P(0, 6)); me.play('throw', { restart: true }); app.audio.sfx && app.audio.sfx('whoosh', { vol: 0.6 });
  if (race && b) { b.busy = true; b.tlBusy = true; b.path = null; }
  await wait(250);
  const to = S.V(rnd(-2, 2), rnd(4.5, 7.5), 0.05); S.ballTaken = null;
  const from = me.headPos(); from.y -= 0.2;
  if (cin) cin.track(v, { dist: 6.5, pitch: 14, dur: 0.6 });
  await throwBall(S, from, to, 2.2);
  const runs = [fetchRun(S, v, { speed: race ? rnd(3.0, 3.6) : 3.4 })];
  if (race && b) runs.push(fetchRun(S, b, { speed: rnd(3.0, 3.8) }));
  await Promise.all(runs);
  const winner = S.ballTaken;
  await wait(500);
  if (winner) { const p = me.g.position; await S.walk(winner, p.x + Math.sin(me.yaw) * 0.7, p.z + Math.cos(me.yaw) * 0.7, { speed: 3, direct: true }); winner.face(me); drop(winner); winner.play('win', { restart: true }); w.fx.emit('star', winner.headPos(), { n: 4 }); }
  if (cin) cin.two(me, k || me, { dur: 0.6 });
  const m = lead(app);
  if (race && winner === b) { await app.say('Hana', `No way! ${partnerName(app)} beat Volt! Rematch tomorrow. You're on!`); if (m) addFriendship(m, 3); f.tlRaceWin = (f.tlRaceWin || 0) + 1; app.toast('Won the fetch race!', { icon: 'star', color: T.amber }); }
  else if (race) { await app.say('Hana', pick(['Volt wins! Your partner was SO close though.', 'Zap! Too fast! Good try!'])); if (m) addFriendship(m, 2); }
  else { await app.say('Hana', pick(['Nice arm! Volt LOVES you now.', 'Whoa, that went far!'])); if (m) addFriendship(m, 1); }
  if (b && race) { b.play(winner === b ? 'win' : b.anim.clips.cry ? 'cry' : 'idle', { restart: true }); }
  if (own) await cin.end();
}
async function petVolt(app, S) {
  const v = S.cast.get('volt'), w = S.w;
  v.face(w.player); v.play(v.anim.clips.ho ? 'ho' : 'win', { restart: true }); S.cry(v, 0.8); w.fx.emit('heart', v.headPos(), { n: 3 }); w.fx.emit('bolt', v.headPos(), { n: 2 });
  await app.say('', 'Volt rolls over for a belly rub, crackling with static. Hana: "He likes you! He only zaps people he likes."');
}
// ---------------------------------------------------------------- Practice match
const SPAR = { fuse: { trainer: 'kenji', move: ['Spark Rush!', 'Short fuse!', 'Pop pop POP!'], fx: 'spark', boast: 'Fuse got a nine-second fuse this week. Nine!' }, pinchy: { trainer: 'aiko', move: ['Bubble Pinch!', 'Salt Spray!', 'Claw Slap!'], fx: 'water', boast: 'Pinchy\'s claws are freshly polished. Look at that shine!' } };
async function shoot(S, from, to, kind) {
  const C = { spark: ['spark', 'bolt', 'volto'], water: ['bubble', 'splash', 'hydro'] }[kind];
  const a = mouth(from, 0.2), b = to.headPos(); b.y -= 0.15;
  S.sfx('whoosh', from, 0.4, 1.3);
  await S.tween(0.4, (k, dt) => { const p = a.clone().lerp(b, k); p.y += Math.sin(k * PI) * 0.35; S.w.fx.emit(C[0], p, { dt, rate: 80, speed: 0.3, scale: 0.9, key: 'sp' + from.id }); });
  S.fx(C[1], b, { n: 10 }); S.fx('star', b, { n: 3 }); S.sfx(C[2], to, 0.5); S.sfx('hit_light', to, 0.4);
}
async function sparLoop(S) {
  for (;;) {
    await S.sleep(rnd(3, 6));
    const K = S.cast.get('kenji'), A = S.cast.get('aiko'), F = S.cast.get('fuse'), P = S.cast.get('pinchy');
    if (!K || !A || !F || !P || !S.open) continue;
    S.ev.match = true;
    // comparing partners
    K.play('explain', { restart: true }); S.say(K, SPAR.fuse.boast, 'rival'); F.play(F.anim.clips.fuse ? 'fuse' : 'win', { restart: true }); await S.sleep(2.6); K.play('idle');
    A.play('explain', { restart: true }); S.say(A, SPAR.pinchy.boast, 'friend'); P.play(P.anim.clips.shimmy ? 'shimmy' : 'win', { restart: true }); await S.sleep(2.6); A.play('idle');
    K.play('bow', { restart: true }); A.play('bow', { restart: true }); S.say(K, 'Practice match. Three hits wins!', 'rival'); await S.sleep(2.2);
    const hits = { fuse: 0, pinchy: 0 }; let n = 0;
    while (hits.fuse < 3 && hits.pinchy < 3 && S.open && !S.dead) {
      const [atk, def, ak] = (n++ % 2 === 0) === (Math.random() < 0.8) ? [F, P, 'fuse'] : [P, F, 'pinchy'];
      const tr = S.cast.get(SPAR[ak].trainer), other = tr === K ? A : K;
      tr.play('command', { restart: true }); S.say(tr, pick(SPAR[ak].move), tr === K ? 'rival' : 'friend');
      atk.face(def); def.face(atk);
      await S.sleep(0.5); atk.play('attack', { restart: true }); await S.sleep(0.25);
      const dodge = Math.random() < 0.25;
      if (dodge) { S.sfx('dodge', def, 0.4); const p = def.g.position, s = Math.random() < 0.5 ? 1 : -1; await S.tween(0.3, (k) => { def.g.position.z = p.z + Math.sin(k * PI) * 0.5 * s; }); other.play('pump', { restart: true }); }
      else { await shoot(S, atk, def, SPAR[ak].fx); def.play('hurt', { restart: true }); hits[ak]++; tr.play('pump', { restart: true }); other.play('flinch', { restart: true }); }
      await S.sleep(1.6);
    }
    if (!S.open) { S.ev.match = false; continue; }
    const win = hits.fuse >= 3 ? 'fuse' : 'pinchy', W = S.cast.get(win), L_ = win === 'fuse' ? P : F, wt = S.cast.get(SPAR[win].trainer), lt = wt === K ? A : K;
    W.play('win', { restart: true }); S.fx('star', W, { n: 6 }); S.cry(W, 0.8); L_.play(L_.anim.clips.faint ? 'faint' : 'hurt', { restart: true });
    wt.play('cheer', { restart: true }); lt.play('defeat', { restart: true }); S.ev.winner = SPAR[win].trainer; S.ev.cheer = S.t;
    S.say(wt, pick(['YES! Good job!', 'That\'s my partner!']), wt === K ? 'rival' : 'friend');
    await S.sleep(3);
    L_.play('idle'); lt.play('idle'); S.say(lt, pick(['Next time!', 'Good match. Seriously.']), lt === K ? 'rival' : 'friend');
    K.play('bow', { restart: true }); A.play('bow', { restart: true }); F.play('dance', { restart: true }); P.play('dance', { restart: true });
    await S.sleep(2.5);
    for (const [a, lx] of [[K, -3.9], [A, 3.9], [F, -1.6], [P, 1.6]]) { a.play('idle'); a.targetYaw = S.Y(lx < 0 ? PI / 2 : -PI / 2); }
    S.ev.match = false;
    await S.sleep(rnd(6, 10));
  }
}
async function matchWatch(S, c) {
  if (S.ev.cheer && S.t - S.ev.cheer < 3) { c.play('cheer', { restart: true }); S.say(c, pick(['What a finish!', 'Rematch! Rematch!']), 'kid'); await S.sleep(2.5); return; }
  c.play(S.ev.match ? pick(['clap', 'cheer', 'nod', 'idle']) : pick(['idle', 'talk', 'phone']), { restart: true });
  await S.sleep(rnd(3, 5));
}
async function sparTalk(app, S, who) {
  const p = S.cast.get(who), me = S.me, other = who === 'kenji' ? 'aiko' : 'kenji', name = who === 'kenji' ? 'Kenji' : 'Aiko', mon = who === 'kenji' ? 'fuse' : 'pinchy', sp = who === 'kenji' ? 'dynacoon' : 'kanizumo';
  if (p && me) { p.face(me); p.play('wave', { restart: true }); }
  await app.say(name, who === 'kenji' ? 'Yo. Aiko and I spar here every day. Fuse is a Dynacoon. Short temper, shorter fuse.' : 'Hi! Pinchy and I train against Kenji and Fuse. Water beats fire… mostly.');
  const st = app.state, opts = ['Watch the next match', `Challenge ${name} to a battle`, 'Bye'];
  const k = await app.choose(`${name} & ${who === 'kenji' ? 'Fuse' : 'Pinchy'}`, opts, { name });
  if (k === 0) await watchMatch(app, S);
  else if (k === 1) {
    if (!st.party || !st.party.length || !ST.battleTeam(st).length) { await app.say(name, 'You\'ll need a healthy Tokonmon of your own first!'); return; }
    const lv = clamp(Math.round(((st.party[0] && st.party[0].level) || 5) + rnd(-1, 1)), 3, 60);
    await app.say(name, pick(['A real battle? You\'re on!', 'Okay! Practice is over, this is the real thing!']));
    const res = await app.startBattle({ foe: { name, team: [[sp, lv]] }, title: 'STREET MATCH', subtitle: `${name} & ${who === 'kenji' ? 'Fuse' : 'Pinchy'}`, money: 120 + lv * 10 });
    await app.fade(0, 400);
    const win = res && res.winner === 0;
    flags(st)['tlBeat_' + who] = win ? 1 : flags(st)['tlBeat_' + who] || 0;
    await app.say(name, win ? pick(['That was awesome! You\'re really good.', 'We lost… but I learned SO much.']) : pick(['Good battle! Come back any time.', 'Ha! Practice pays off!']));
    const o = S.cast.get(other); if (o) o.play(win ? 'clap' : 'cheer', { restart: true });
    void mon;
  }
}
async function watchMatch(app, S) {
  const cin = app.cinema, wait = sayW(app), center = S.V(0, 0, 0.6);
  S.hold = false;                                                      // the match keeps going while you watch
  const own = cin && !cin.active; if (own) await cin.begin({ bars: 0.75, hush: false, fov: 34 });
  if (cin) cin.orbit(center, { deg: 120, time: 18, at: 'chest' });
  await app.say('', 'You find a spot at the edge of the lawn. Kenji and Aiko bow to each other, and their partners square up.');
  const t0 = Date.now();
  while (!S.ev.match && Date.now() - t0 < 12000) await wait(250);
  const t1 = Date.now();
  while (S.ev.match && Date.now() - t1 < 40000) await wait(250);
  await wait(800);
  await app.say('', `${S.ev.winner === 'kenji' ? 'Kenji and Fuse' : 'Aiko and Pinchy'} take it! The two of them shake hands while their partners do a little victory dance.`);
  const m = lead(app); if (m) addFriendship(m, 1);
  if (own) await cin.end();
}
// ---------------------------------------------------------------- Nap pile
async function napLoop(S) {
  for (;;) {
    await S.sleep(rnd(1.8, 3.2));
    const list = ['snooze', 'lemmo', 'bunny', 'bub', 'kappa'].map((k) => S.cast.get(k)).filter(Boolean); if (!list.length) continue;
    const a = pick(list); S.fx('z', a, { n: 1 });
    if (Math.random() < 0.12) { const y = a.anim.clips.yawn ? 'yawn' : a.anim.clips.doze ? 'doze' : null; if (y) { a.play(y, { restart: true }); await S.sleep(2); a.play('sleep', { fade: 0.4 }); } }
    const g = S.cast.get('moku'); if (g && Math.random() < 0.15) { S.fx('z', g, { n: 1 }); if (Math.random() < 0.3) S.say(g, 'Zzz… five more minutes…', 'elder'); }
  }
}
async function napJoin(app, S) {
  const w = S.w, me = w.player, b = w.partner, st = app.state, f = flags(st), wait = sayW(app);
  await app.say('', 'The pile breathes in, and out, very slowly. There is exactly one person-sized gap on the blanket.');
  const k = await app.choose('Lie down for a nap?', ['Nap', 'Not now']); if (k !== 0) return;
  if (b) { b.busy = true; b.tlBusy = true; b.path = null; const [x, z] = S.P(0.9, -0.3); b.place(x, z, S.Y(0)); b.play(b.anim.clips.sleep ? 'sleep' : 'idle'); }
  me.play('yawn', { restart: true }); app.feel && app.feel.emote && app.feel.emote(me, 'zzz', 2);
  await app.fade(1, 900);
  ST.healParty(st, 1); for (const m of st.party || []) addFriendship(m, 1);
  if (st.time && app.moments && app.moments.on && app.moments.on()) st.time.hour = (st.time.hour + 1) % 24;
  await wait(900);
  await app.fade(0, 900);
  me.play('stretch', { restart: true });
  if (b) { b.play(b.anim.clips.dance ? 'dance' : 'win', { restart: true }); w.fx.emit('heart', b.headPos(), { n: 3 }); }
  await app.say('', pick(['You wake up with a Woodbub on your face and a Lemmo in your pocket. Everyone looks very refreshed.', 'You wake up an hour later. Grandpa Moku has put his hat on you. Nobody remembers falling asleep.']));
  if (!f.tlNap) { f.tlNap = 1; app.toast('Joined the nap pile', { icon: 'bed', color: T.violet, dur: 2.4 }); }
  app.toast('Your team is fully rested', { icon: 'heart', color: T.green, dur: 2.4 });
  if (app.save) app.save();
}
async function mokuTalk(app, S) {
  await app.say('Grandpa Moku', '…mm? Oh. Hello. I came to read the paper. That was… three naps ago.', 'Mochi\'s cousins found me. Or I found them. Hard to say. Sit, sit. Plenty of blanket.');
}
// ---------------------------------------------------------------- Swift Wing Express
async function courierLoop(S) {
  for (;;) {
    await S.sleep(rnd(18, 30));
    const e = S.cast.get('express'), d = S.cast.get('dot'), H = S.T.scene('hotsauce'); if (!e || !d || !S.open) continue;
    const inez = H && H.state === 'ok' && H.live && H.open && H.cast.get('inez');
    if (!inez) continue;
    d.face(e); d.play('point', { restart: true }); S.say(d, pick(['Express! Peppers for Inez!', 'Another crate for Cluck & Burn!']), 'friend');
    await S.sleep(0.8); carry(S, e, 'tl_parcel');
    const home = e.g.position.clone(), to = H.V(0, -0.35, 1.12);
    await fly(S, e, to, 2.4, 4.5);
    inez.face(e); inez.play('wave', { restart: true }); H.say(inez, pick(['Thanks, Express!', 'Fresh chilies! Encore, look!'])); drop(e); S.sfx('cloth', e, 0.4);
    await S.sleep(1.2);
    await fly(S, e, home, 2.4, 4.5); e.faceTo(...S.P(0, 3)); d.play('idle');
  }
}
async function dotTalk(app, S) {
  const d = S.cast.get('dot'), me = S.me, st = app.state, f = flags(st), j = jobOf(app);
  if (d && me) { d.face(me); d.play('wave', { restart: true }); }
  if (j) { const J = JOBS[j.to]; await app.say('Dot', `That parcel's for ${J.who} at ${J.name}, ${J.where}. Express already has six more to fly!`); return; }
  if (!f.tlDot) { f.tlDot = 1; await app.say('Dot', 'Swift Wing Express! If it fits on a Pidgun, it gets there by lunch.', 'Express does the short hops. The long ones… honestly, I could use a hand.'); }
  const k = await app.choose('Help Dot with a delivery?', ['Take a parcel', 'Not right now']);
  if (k !== 0) { await app.say('Dot', 'No worries! I\'ll be here.'); return; }
  const to = pick(Object.keys(JOBS).filter((id) => id !== f.tlLastJob)), J = JOBS[to];
  f.tlJob = { to }; f.tlLastJob = to;
  if (d) d.play('point', { restart: true });
  await app.say('Dot', `This one goes to ${J.who} at ${J.name}, ${J.where}. They'll pay you on delivery!`);
  app.toast(`Parcel for ${J.name}`, { icon: 'bag', color: T.cyan, dur: 2.6 });
  if (app.save) app.save();
}
async function petExpress(app, S) {
  const e = S.cast.get('express'), w = S.w;
  e.face(w.player); e.play(e.anim.clips.puff ? 'puff' : 'win', { restart: true }); S.cry(e, 0.8); w.fx.emit('feather', e.headPos(), { n: 3 });
  await app.say('', 'Express puffs up its chest and taps the parcel label with its beak. Signed, sealed, very nearly delivered.');
}

// ==================================================================================== the manager
export class TownLife {
  constructor(world, city) {
    this.w = world; this.app = world.app; this.c = city; this.nav = city.nav; this.mats = world.st.mats;
    const P = this.app.params;
    this.debug = !!(P && P.get('tldebug')); this.off = !!(P && P.get('notown'));
    this.scenes = []; this.started = false; this.disposed = false; this.loading = null; this.hT = 0; this.h = 12;
    this.root = new THREE.Group(); this.root.name = 'townlife';
    this.overlay = (ui, dt) => this.drawOverlay(ui, dt);
  }
  /** build the stalls, carts and signs (cheap: shared voxel geometry); the people and Tokonmon come later, near you */
  start() {
    if (this.started || this.disposed || this.off) return; this.started = true;
    registerKinds(); defineParticles();
    this.w.st.scene.add(this.root);
    if (this.app.overlays) this.app.overlays.push(this.overlay);
    this.h = this.hour();
    for (const def of SCENES) { const S = new Scene(this, def); this.scenes.push(S); try { S.build(); } catch (e) { console.warn('[townlife] build', def.id, e); } S.checkOpen(this.h); }
  }
  scene(id) { return this.scenes.find((S) => S.id === id) || null; }
  /** the hour of the day: the day cycle's clock, or the light's when the cycle isn't running (?tlhour=H forces it) */
  hour() {
    const P = this.app.params, f = P && P.get('tlhour');
    if (f !== null && f !== undefined && f !== '') return +f;
    const M = this.app.moments, st = this.app.state;
    if (M && M.on && M.on() && st.time) return st.time.hour;
    return { day: 12.5, golden: 17, dusk: 19.5, night: 22.5 }[this.w.mood] ?? 12.5;
  }
  night() { const h = this.h; return h >= 19 || h < 5.5; }
  lunch() { const h = this.h; return h >= 11.5 && h < 13.5; }
  /** how busy the street is now: the lunch rush, the night market (food stands), the small hours */
  crowd(food) { const h = this.h; if (this.lunch()) return 2; if (food && (h >= 18 || h < 1)) return 1.6; if (h >= 22 || h < 7) return 0.5; return 1; }
  update(dt) {
    if (!this.started || this.disposed) return;
    const app = this.app, w = this.w;
    if (app.battle && app.battle.active) return;
    if ((this.hT -= dt) <= 0) { this.hT = 1; this.h = this.hour(); for (const S of this.scenes) S.checkOpen(this.h); }
    const me = w.player; if (!me) return;
    const f = me.g.position, hushed = !!(w.life && w.life.hushed);
    for (const S of this.scenes) {
      const d = Math.hypot(S.x - f.x, S.z - f.z);
      if (S.state === 'idle' && d < LOAD && !this.loading) { this.loading = S; S.load().finally(() => { if (this.loading === S) this.loading = null; }); }
      if (S.state !== 'ok') continue;
      const vis = !hushed && d < (S.shown ? VIS2 : VIS), live = vis && d < (S.live ? ANIM2 : ANIM);
      if (vis !== S.shown) S.setShown(vis);
      if (live !== S.live) S.setLive(live);
      if (!live) continue;
      S.tick(dt);
      // your partner notices a scene the first time you walk up to it (and again a few minutes later)
      if (d < 7 && (S.noticed ?? -1e9) < this.t - 180 && w.partner && !app.story.busy && app.feel && app.feel.emote) { S.noticed = this.t; app.feel.emote(w.partner, S.def.notice || '!', 1.6); }
    }
    this.t = (this.t || 0) + dt;
  }
  stats() { const o = {}; for (const S of this.scenes) o[S.id] = { state: S.state, open: S.open, shown: S.shown, live: S.live, actors: S.all.size, queue: S.queue.length, t: +S.t.toFixed(1) }; return { hour: this.h, night: this.night(), scenes: o }; }
  // ---------------------------------------------------------------- UI: the shop's item card, the parcel objective and marker
  drawOverlay(ui) {
    const app = this.app; if (this.disposed || !this.w.player || (app.battle && app.battle.active) || app.story.title) return;
    const D = ui.dialog;
    if (D && D.o && D.o.tlShop && D.choices && D.shown >= D.str.length) this.drawCard(ui, D);
    const j = jobOf(app);
    if (j && !D && !(app.phone && app.phone.open) && !(app.cinema && app.cinema.active) && app.roaming) this.drawJob(ui, j);
  }
  /** a square-cornered card beside the menu: the highlighted item's name, price, what it does, how many you have */
  drawCard(ui, D) {
    const o = D.o.tlShop, st = this.app.state, i = D.pick || 0, id = o.goods[i], w = 156, x = 8, y = Math.max(30, Math.round(ui.h * 0.14));
    const it = id && ITEMS[id], ex = !id && o.extras[i - o.goods.length];
    const lines = ui.wrap(it ? it.desc || '' : ex ? ex.hint || '' : 'See you next time!', w - 16, { mini: true }).slice(0, 4), h = 46 + lines.length * 8;
    ui.rect(x + 2, y + 2, w, h, 'rgba(12,8,9,0.45)');
    ui.rect(x, y, w, h, T.copperD); ui.rect(x + 1, y + 1, w - 2, h - 2, T.copper); ui.rect(x + 2, y + 2, w - 4, h - 4, T.cream);
    ui.rect(x + 2, y + 2, w - 4, 11, T.copperL);
    ui.text(o.title, x + 6, y + 5, '#ffffff', { mini: true, bold: true });
    ui.text(`$${st.money}`, x + w - 6, y + 5, '#ffffff', { mini: true, bold: true, align: 'right' });
    const icon = it ? (it.spicy ? 'flame' : /boba|fizz/.test(id) ? 'soda' : /pea|seed/.test(id) ? 'leaf' : 'bowl') : ex ? ex.icon || 'star' : 'close';
    ui.rect(x + 6, y + 17, 20, 20, T.creamD); ui.rect(x + 7, y + 18, 18, 18, T.panel);
    ui.bigIcon(icon, x + 9, y + 20);
    ui.text(it ? short(id) : ex ? ex.label : 'Bye', x + 31, y + 18, T.text, { bold: true });
    if (it) {
      ui.text(`$${it.price}`, x + 31, y + 29, st.money >= it.price ? T.amber2 : T.red, { bold: true });
      const own = st.bag[id] || 0; if (own) ui.text(`In bag: ${own}`, x + w - 6, y + 30, T.leafD, { mini: true, align: 'right' });
    }
    let ly = y + 42; for (const l of lines) { ui.text(l, x + 7, ly, T.dim, { mini: true }); ly += 8; }
  }
  /** the parcel you're carrying: a strip at the bottom, and a bobbing square marker over the vendor it's for */
  drawJob(ui, j) {
    const J = JOBS[j.to], S = this.scene(j.to), str = `Parcel for ${J.who} · ${J.name}`, tw = ui.tw(str) + 22, x = Math.round(ui.w / 2 - tw / 2), y = ui.h - 22;
    ui.rect(x, y, tw, 14, T.copperD); ui.rect(x + 1, y + 1, tw - 2, 12, T.cream);
    ui.rect(x + 4, y + 3, 9, 8, '#c89a5a'); ui.rect(x + 8, y + 3, 1, 8, '#ead8a8'); ui.rect(x + 4, y + 6, 9, 1, '#ead8a8');
    ui.text(str, x + 17, y + 4, T.text);
    const a = S && S.state === 'ok' && S.cast.get(J.vendor), p = a && a.g.parent ? a.headPos() : S ? S.V(0, 0, 2.6) : null;
    if (!p) return;
    p.y += 0.7;
    const s = this.w.project(p); if (!s.vis) return;
    const me = this.w.player.g.position, d = Math.round(Math.hypot(p.x - me.x, p.z - me.z)), bob = Math.round(Math.sin(this.app.t * 4) * 2), mx = Math.round(s.x), my = Math.round(s.y) - 10 + bob;
    ui.rect(mx - 6, my - 6, 12, 11, T.copperD); ui.rect(mx - 5, my - 5, 10, 9, '#c89a5a'); ui.rect(mx - 1, my - 5, 2, 9, '#ead8a8'); ui.rect(mx - 5, my - 2, 10, 1, '#ead8a8');
    ui.rect(mx - 1, my + 5, 2, 3, T.copperD);
    if (d > 4) ui.text(`${d} m`, mx, my + 10, '#ffffff', { mini: true, align: 'center', outline: T.ink });
  }
  dispose() {
    this.disposed = true;
    for (const S of this.scenes) S.dispose();
    this.scenes = [];
    this.root.removeFromParent();
    const o = this.app.overlays, i = o ? o.indexOf(this.overlay) : -1; if (i >= 0) o.splice(i, 1);
    const gm = this.w.st && this.w.st.glowMats; if (gm) for (const m of SIGNMATS.values()) gm.delete(m);
  }
}
