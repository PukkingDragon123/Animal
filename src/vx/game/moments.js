// Moments: time passing in the city, and the first look at each part of it.
//  · the day cycle: once the opening is over, the clock runs while you roam (a game hour ≈ 75 s; ?todrate=N sets
//    the seconds per hour, ?tod=H starts at hour H). The light follows it: day → golden hour → dusk → night → dawn.
//    A change of light waits for a moment that hides it (stepping through a door, a fast-travel fade), or eases in
//    under a soft veil after a few seconds.
//  · nightfall: the first time the clock reaches 8 PM while you're outdoors, a short cutscene — the camera cranes
//    up over the street, the sky goes dark and the lamps come on, a NIGHTFALL card; later nights get a shorter beat
//  · arrival vignettes: the first time you walk into each district, a two-second establishing crane down onto you
//    and the district's place card (once only; the opening establishes its own districts)
// Dev boots (?loc=…) leave the light alone and skip the vignettes unless asked (?tod=…, ?vignette=1), so other
// tools' screenshots don't change under them.
import * as THREE from '../../../vendor/three.module.js';
import * as S from '../../game/state.js';
import { clockText } from '../../game/time.js';
import { view } from './cinema.js';
import { E } from '../anim.js';

const V3 = THREE.Vector3, D2R = Math.PI / 180;
export const moodAt = (h) => { h = ((h % 24) + 24) % 24; return h >= 20 || h < 5 ? 'night' : h < 6.5 ? 'dusk' : h < 15.5 ? 'day' : h < 18.5 ? 'golden' : 'dusk'; };
// the districts: their zone name → card and the point an establishing shot looks at
const DISTRICTS = {
  home: { name: 'Sunset Row', sub: 'Home  ·  San Francisco', at: [52, 146] },
  'Alamo Hill Park': { name: 'Alamo Hill Park', sub: 'The Painted Ladies  ·  tall grass', at: [52, 64] },
  Chinatown: { name: 'Chinatown', sub: 'Lanterns, tea and the Golden Claw', at: [172, 64] },
  Downtown: { name: 'Downtown', sub: 'Market District  ·  the Street Arena', at: [172, 144] },
  'The Wharf': { name: 'The Wharf', sub: "Pier 39  ·  Fisherman's Wharf", at: [116, 12] },
};
// the opening already introduces these with its own establishing shots
const OPENING_SHOWS = new Set(['Downtown', 'The Wharf', 'Chinatown']);

export class Moments {
  constructor(app) {
    this.app = app; this.t = 0; this.pend = null; this.pendT = 0; this.xf = null; this.acc = 0; this.busy = false;
    const P = app.params || new URLSearchParams();
    this.dev = !!P.get('loc'); this.rate = +(P.get('todrate') || 75); this.force = P.get('tod') !== null ? +P.get('tod') : null; this.vigOn = !this.dev || !!P.get('vignette');
  }
  get w() { return this.app.world; }
  update(dt) {
    this.t += dt;
    const app = this.app, w = this.w;
    if (this.xf) this.crossfade(dt);
    if (!w || !w.ready || !w.city || !w.player || app.story.title || this.busy) return;
    if (app.battle && app.battle.active) return;
    this.cycle(dt);
    if (this.vigOn) this.vignettes();
  }
  /** the player is free to walk around (nothing else on screen) */
  free() { const app = this.app, w = this.w, cin = app.cinema; return w.free && app.roaming && !app.story.busy && !app.ui.dialog && !app.ui.modal && !(cin && cin.active) && !(app.phone && app.phone.open) && !app._travelling; }
  // ================================================================ the day cycle
  on() {
    const st = this.app.state;
    if (this.force !== null) return true;
    if (this.dev) return false;
    return !!(st.flags && (st.flags.phone || st.flags.todOn));
  }
  cycle(dt) {
    const app = this.app, st = app.state, w = this.w; if (!st.time || !this.on()) return;
    if (!st.flags.todOn) { st.flags.todOn = 1; if (this.force !== null) st.time.hour = this.force; else if (st.time.hour < 15) st.time.hour = 16.5; }
    if (this.force !== null && !this.forced) { this.forced = true; st.time.hour = this.force; }
    if (this.free()) {
      this.acc += dt / Math.max(0.5, this.rate);
      if (this.acc > 0.02) { const h = this.acc; this.acc = 0; S.passTime(st, h); }
    }
    const want = moodAt(st.time.hour);
    if (w.sc !== this.sc) { this.sc = w.sc; if (want !== w.mood) this.apply(want); return; }   // a fresh load (behind its fade): the light of the hour at once
    if (want === w.mood) { this.pend = null; return; }
    if (!this.free()) return;
    if (want === 'night' && w.mood !== 'night' && w.city.inside < 0) { this.nightfall(); return; }
    if (this.pend !== want) { this.pend = want; this.pendT = this.t; }
    if (this.t - this.pendT > (want === 'night' ? 2 : 8)) this.apply(want, { soft: true });
  }
  /** a moment that hides a change of light (a door, a fade) */
  cover() { if (this.pend) this.apply(this.pend, { soft: false }); }
  /** switch the city's light to a mood; soft: the light eases over under a gentle veil */
  apply(mood, o = {}) {
    const app = this.app, w = this.w, st = app.stage, cin = app.cinema;
    this.pend = null;
    if (!w || w.mood === mood) return;
    const from = { sunC: st.sun.color.clone(), sunI: st.sun.intensity, hemiC: st.hemi.color.clone(), hemiG: st.hemi.groundColor.clone(), hemiI: st.hemi.intensity, exp: st.r.toneMappingExposure };
    st.setMood(mood); w.mood = mood; app.setPost(mood);
    if (cin && cin.rebase) cin.rebase(mood);
    const au = app.audio, z = w.city && w.city.zone; if (au && au.bed) au.bed(mood === 'night' ? 'cicadas' : (z && z.bed) || null);
    if (o.soft) {
      const to = { sunC: st.sun.color.clone(), sunI: st.sun.intensity, hemiC: st.hemi.color.clone(), hemiG: st.hemi.groundColor.clone(), hemiI: st.hemi.intensity, exp: st.r.toneMappingExposure };
      this.xf = { t: 0, dur: 2.6, from, to };
      if (cin) { cin.veil.color = mood === 'night' ? '#141a34' : mood === 'dusk' ? '#4a3050' : '#fff0d8'; cin.veil.a = Math.max(cin.veil.a, 0.32); cin.veilTo(0, 1400); }
      this.crossfade(0);
    }
  }
  crossfade(dt) {
    const X = this.xf, st = this.app.stage; X.t += dt; const k = E.inout(Math.min(1, X.t / X.dur));
    st.sun.color.copy(X.from.sunC).lerp(X.to.sunC, k); st.sun.intensity = X.from.sunI + (X.to.sunI - X.from.sunI) * k;
    st.hemi.color.copy(X.from.hemiC).lerp(X.to.hemiC, k); st.hemi.groundColor.copy(X.from.hemiG).lerp(X.to.hemiG, k); st.hemi.intensity = X.from.hemiI + (X.to.hemiI - X.from.hemiI) * k;
    st.r.toneMappingExposure = X.from.exp + (X.to.exp - X.from.exp) * k;
    if (k >= 1) this.xf = null;
  }
  // ================================================================ nightfall
  nightfall() {
    const app = this.app, w = this.w, st = app.state, cin = app.cinema; if (!cin || this.busy) return;
    this.busy = true;
    app.story.run(async () => {
      const me = w.player, n = (st.flags.nightfall || 0) + 1; st.flags.nightfall = n;
      w.free = false; me.path = null; if (w.city) { w.city.vx = w.city.vz = 0; w.city.spd = 0; }
      const p = me.g.position.clone(), yaw = w.cam.yaw || 0, fx = -Math.sin(yaw * D2R), fz = -Math.cos(yaw * D2R);
      try {
        await cin.begin({ prefer: yaw, hush: false });
        cin.grade('dusk');
        if (n === 1) {
          // over your shoulder down the street, then a slow crane up over the rooftops as the sky goes dark
          await cin.cut(cin.safe(view([p.x + fx * 4, p.y + 1.7, p.z + fz * 4], 6.5, yaw, 7)));
          cin.focus(null, { band: 0.24, dof: 0.8 });
          const crane = cin.move(cin.safe(view([p.x + fx * 13, p.y + 3.2, p.z + fz * 13], 19, yaw + 8, 15)), { dur: 4.6, ease: E.inout });
          if (me.play) me.play('lookAround', { restart: true });
          await cin.wait(2000);
          await cin.veilTo(0.6, 600, '#0e1430');
          this.apply('night'); cin.grade('dusk');
          this.lampsOn();
          await cin.veilTo(0, 1300);
          cin.title('NIGHTFALL', 'The lamps come on across the city', { hold: 2800, y: 0.3, wait: false });
          await crane;
          await cin.wait(1400);
          // back down to you and your partner (who is getting sleepy)
          const b = w.partner;
          await cin.frame(me, { at: 'chest', yaw: yaw + 28, dist: 4.4, pitch: 9, dur: 1.2, push: 0.06, hold: 4 });
          me.play('yawn', { restart: true });
          if (b && app.feel) { app.feel.emote(b, 'zzz', 2); if (b.anim.clips.sleep) b.play(b.anim.clips.yawn ? 'yawn' : 'idle', { restart: true }); }
          await cin.wait(1600);
        } else {
          // later nights: the light changes behind a quick look at the sky, a card with the time
          await cin.cut(cin.safe(view([p.x + fx * 6, p.y + 2.6, p.z + fz * 6], 9, yaw + 6, 10)));
          await cin.veilTo(0.55, 500, '#0e1430');
          this.apply('night'); this.lampsOn();
          await cin.veilTo(0, 1000);
          cin.place('Nightfall', clockText(st.time), { wait: false, hold: 2400 });
          await cin.wait(1800);
        }
      } finally {
        if (w.mood !== 'night') this.apply('night');
        if (cin.active) await cin.end({ dur: 1.0 });
        w.free = true; this.busy = false;
        if (app.save) app.save();
      }
    });
  }
  /** the street lamps blink on (a chime, sparkles at the nearest few) */
  lampsOn() {
    const app = this.app, w = this.w, au = app.audio, me = w.player; if (!me) return;
    if (au && au.sfx) { au.sfx('furin', { vol: 0.6 }); setTimeout(() => au.sfx && au.sfx('sparkle', { vol: 0.5, pitch: 0.8 }), 250); }
    const lamps = (w.sc && w.sc.lamps) || [], p = me.g.position;
    const near = lamps.map((l) => (Array.isArray(l) ? new V3(l[0], l[1], l[2]) : l.isVector3 ? l : l.x !== undefined ? new V3(l.x, l.y, l.z) : null)).filter(Boolean).sort((a, b) => a.distanceTo(p) - b.distanceTo(p)).slice(0, 8);
    near.forEach((q, i) => setTimeout(() => w.fx && w.fx.emit('sparkle', q, { n: 6 }), 120 * i));
  }
  // ================================================================ arrival vignettes
  vignettes() {
    const app = this.app, w = this.w, st = app.state, z = w.city.zone, zn = z ? z.name : null;
    // only on walking (or travelling) into a district: not wherever a load or a resumed game puts you
    if (this.lastZone === undefined || this.vigSc !== w.sc) { this.lastZone = zn; this.vigSc = w.sc; return; }
    if (zn === this.lastZone || !this.free()) return;
    this.lastZone = zn;
    if (!z || !DISTRICTS[zn] || w.city.inside >= 0) return;
    const seen = st.flags.vig || (st.flags.vig = {});
    if (seen[z.name]) return;
    const Q = app.quests; if (Q && Q.has && (Q.has('day1') || Q.done('day1')) && OPENING_SHOWS.has(z.name)) { seen[z.name] = 1; return; }
    seen[z.name] = 1;
    this.vignette(DISTRICTS[z.name]);
  }
  vignette(D) {
    const app = this.app, w = this.w, cin = app.cinema; if (!cin) return;
    this.busy = true;
    app.story.run(async () => {
      const me = w.player; w.free = false; me.path = null; if (w.city) { w.city.vx = w.city.vz = 0; w.city.spd = 0; }
      const p = me.g.position, yaw = w.cam.yaw || 0;
      try {
        await cin.begin({ prefer: yaw, hush: false });
        // high over the district, swooping down onto you
        const c = [D.at[0] * 0.55 + p.x * 0.45, p.y + 2, D.at[1] * 0.55 + p.z * 0.45];
        const swoop = cin.establish([p.x, p.y + 1.2, p.z], { from: { dist: 44, yaw: yaw - 28, pitch: 44, at: c }, to: { dist: 9, yaw, pitch: 17 }, dur: 2.3, hold: 3, drift: 3 });
        await cin.wait(350);
        cin.place(D.name, D.sub, { wait: false, hold: 2600 });
        await swoop;
        if (me.play) me.play('lookAround', { restart: true });
        await cin.wait(500);
      } finally {
        if (cin.active) await cin.end({ dur: 0.9 });
        w.free = true; this.busy = false;
        if (me.anim && me.anim.cur === 'lookAround') setTimeout(() => { if (me.anim.cur === 'lookAround') me.play('idle', { fade: 0.3 }); }, 1800);
      }
    });
  }
}
