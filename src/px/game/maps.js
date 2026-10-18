// Map registry for the 2D game: each map builds its HD-2D scene and returns the
// gameplay layer — walkable areas, blockers, spawns, hotspots, exits, NPCs.
import { buildPlaza } from '../../data/scenes/plaza.js';
import * as S from '../../game/state.js';

const say = (app, name, ...lines) => lines.reduce((p, l) => p.then(() => app.ui.say(name, l)), Promise.resolve());

export const MAPS = {
  plaza: {
    name: 'Tsutenkaku-shita Plaza', music: 'park', ambience: 'city',
    build(o) {
      const scene = buildPlaza({ viewW: o.viewW, viewH: o.viewH, night: o.night });
      // gameplay tags on the scene's sprites
      for (const s of scene.sprites) {
        const h = s.cv.height, w = s.cv.width;
        if (h < 16) s.solid = false;                                  // weeds, small clutter
        else if (h > 140) s.foot = [4, 2];                           // utility poles
        else if (w > 60 && h > 80 && s.y > 200) s.foot = [7, 3];     // trees: just the trunk
      }
      return {
        scene, terrain: scene.terrain,
        walk: [
          [[0, 121], [640, 121], [640, 139], [0, 139]],             // upper sidewalk
          [[38, 136], [122, 136], [122, 224], [38, 224]],           // left stairs
          [[516, 136], [600, 136], [600, 224], [516, 224]],         // right stairs
          [[0, 220], [640, 220], [640, 414], [0, 414]],             // lower plaza
        ],
        block: [[156, 210, 132, 44]],                                // subway entrance building
        spawns: { start: [330, 340], stairsL: [80, 228], stairsR: [558, 228], upper: [330, 130], subway: [222, 262] },
        hotspots: [
          { id: 'subway', x: 222, y: 258, label: 'Subway', icon: 'door', bubbleH: 50, act: (app) => say(app, '', 'The Midosuji Line gate is sealed with a bright League notice:', '"Platforms reserved for registered Tokonmon trainers during the Osaka League season."') },
          { id: 'takoyaki', x: 524, y: 282, r: 26, label: 'Takoyaki', icon: 'bowl', act: (app) => app.shop([['takoyaki', 300], ['ramune', 150]], 'Takoyaki Taisho flips a row of golden balls without looking. "Eight for three hundred! Hot hot hot!"') },
          { id: 'gacha', x: 98, y: 262, r: 22, label: 'Capsules', icon: 'star', act: (app) => say(app, '', 'Capsule toys: "TOKONMON MINI FIGURE — SERIES 7". The machine is out of order. Someone has stuck a sad face sticker on it.') },
          { id: 'jizo', x: 302, y: 246, r: 20, label: 'Jizo', icon: 'heart', act: (app) => say(app, '', 'Two little stone jizo in red bibs watch over the plaza. Someone left them two mikan and fresh flowers.', 'Your partner bows its head too.') },
          { id: 'cat', x: 34, y: 340, r: 18, label: 'Cat', icon: 'heart', act: (app) => say(app, '', 'A stray cat is asleep on the crates, belly to the sun.', 'It opens one eye, decides you are fine, and goes back to sleep.') },
          { id: 'vend', x: 182, y: 142, r: 24, label: 'Vending', icon: 'coin', act: (app) => app.shop([['ramune', 150], ['matcha', 220], ['takoyaki', 300]], 'The machine hums a little jingle.') },
          { id: 'ramen', x: 107, y: 124, r: 20, label: 'Ramen', icon: 'bowl', act: (app) => app.eatAt('ramen') },
          { id: 'kissa', x: 33, y: 124, r: 20, label: 'Kissa', icon: 'bowl', act: (app) => app.eatAt('kissa') },
          { id: 'izakaya', x: 590, y: 124, r: 20, label: 'Izakaya', icon: 'bowl', act: (app) => say(app, '', 'A paper sign on the door: "Opens at 17:00. Tokonmon welcome, no fire breathing at the counter."') },
          { id: 'mural', x: 375, y: 226, r: 30, label: 'Mural', icon: 'eye', act: (app) => say(app, '', 'A faded mural of a crowned lionfish, so old the paint is peeling.', 'Under it someone has scratched an older picture: two dragons, one shaped like a prism splitting light, one black as a record. "The gods of light," the caption says.') },
          { id: 'bench', x: 360, y: 302, r: 22, label: 'Rest', icon: 'heart', act: (app) => app.rest() },
          { id: 'barber', x: 470, y: 132, r: 18, label: 'Barber', icon: 'talk', act: (app) => say(app, 'Barber', 'Sorry, we only trim Tokonmon fur on Tuesdays.') },
        ],
        exits: [],
        npcs: [],
      };
    },
  },
};
export { say };

// optional maps painted in their own modules (loaded if present)
export async function loadMaps() {
  const extra = [['dotonbori', '../../data/scenes/dotonbori.js', 'DOTONBORI_MAP'], ['castle_park', '../../data/scenes/castle_park.js', 'CASTLE_PARK_MAP']];
  for (const [id, path, key] of extra) {
    try { const m = await import(path); if (m[key]) MAPS[id] = Object.assign({ night: id === 'dotonbori', ambientFx: id === 'castle_park' ? 'petals' : id === 'dotonbori' ? 'embers' : null }, m[key], { music: id === 'dotonbori' ? 'dotonbori' : 'park', ambience: id === 'dotonbori' ? 'canal_night' : 'park' }); } catch (e) { /* not painted yet */ }
  }
  try { const m = await import('../../data/scenes/stadium.js'); MAPS.stadium = m.STADIUM_MAP; } catch (e) { /* not painted yet */ }
}
