// Quick-time events: timing rings, rhythm beats, mash meters, escapes.
// run(q) resolves to a score 0..1.
import { h, clear } from './dom.js';

export class QteUI {
  constructor(ui) { this.ui = ui; this.root = ui.L.qte; this.active = null; }
  run(q, opts = {}) {
    if (this.active) this.active.cancel();
    const type = q.type, n = Math.max(1, q.n || 1);
    if (type === 'mash' || q.kind === 'escape') return this.mash(q, n, opts);
    if (type === 'rhythm') return this.rings(q, n, { rhythm: true, period: 60 / (opts.bpm || 120), ...opts });
    return this.rings(q, n, opts);
  }
  _open(label, sub) {
    const r = clear(this.root);
    r.classList.add('show');
    r.append(h('div.veil'), h('div.lbl', {}, label, sub ? h('small', {}, sub) : ''));
    return r;
  }
  _close() { clear(this.root); this.root.classList.remove('show'); this.active = null; }
  rings(q, n, opts) {
    return new Promise((res) => {
      const label = opts.label || (opts.rhythm ? 'HIT THE BEAT!' : q.kind === 'capture' ? 'THROW!' : q.kind === 'team' ? 'SYNC UP!' : n > 1 ? 'FIRE!' : 'NOW!');
      const r = this._open(label, opts.sub || (opts.rhythm ? `Tap when the ring meets the circle — ${n} beats` : 'Tap when the rings line up'));
      const W = innerWidth, H = innerHeight;
      const results = [];
      let i = 0, t0 = performance.now(), raf = 0, cur = null, done = false;
      const dur = opts.rhythm ? opts.period * 2 : (q.kind === 'capture' ? 1.3 : 1.05);
      const R = Math.min(W, H) * 0.09 + 26;
      const spawn = () => {
        const cx = n > 1 && !opts.rhythm ? W * (0.3 + Math.random() * 0.4) : W / 2;
        const cy = n > 1 && !opts.rhythm ? H * (0.38 + Math.random() * 0.24) : H * 0.52;
        const target = h('div.qring.target', { style: { left: cx + 'px', top: cy + 'px', width: R * 2 + 'px', height: R * 2 + 'px' } });
        const shrink = h('div.qring.shrink', { style: { left: cx + 'px', top: cy + 'px' } });
        const tap = h('div.qtap', { style: { left: cx + 'px', top: cy + 'px', width: R * 1.3 + 'px', height: R * 1.3 + 'px' } }, opts.rhythm ? '♪' : 'TAP');
        r.append(target, shrink, tap);
        cur = { cx, cy, target, shrink, tap, t: performance.now() };
      };
      const judge = (late) => {
        if (!cur) return;
        const el = (performance.now() - cur.t) / 1000;
        const k = el / dur; // ring radius = R * (2.6 - 1.6k): meets R at k = 1
        const rr = R * (2.6 - 1.6 * Math.min(1.3, k));
        const off = Math.abs(rr - R);
        let sc, txt;
        if (late) { sc = 0.15; txt = 'MISS'; }
        else if (off < R * 0.12) { sc = 1; txt = 'PERFECT!'; }
        else if (off < R * 0.32) { sc = 0.7; txt = 'GREAT'; }
        else if (off < R * 0.6) { sc = 0.45; txt = 'GOOD'; }
        else { sc = 0.15; txt = 'MISS'; }
        results.push(sc);
        this.ui.sfx(sc >= 1 ? 'qte_perfect' : sc >= 0.45 ? 'qte_good' : 'qte_miss');
        const fx = h('div.qres', { style: { left: cur.cx + 'px', top: cur.cy - R + 'px' } }, txt);
        r.append(fx); setTimeout(() => fx.remove(), 800);
        cur.target.remove(); cur.shrink.remove(); cur.tap.remove(); cur = null;
        i++;
        if (i >= n) finish(); else setTimeout(spawn, opts.rhythm ? 0 : 150);
      };
      const finish = () => { if (done) return; done = true; cancelAnimationFrame(raf); removeEventListener('pointerdown', onTap, true); removeEventListener('keydown', onKey, true); setTimeout(() => { this._close(); res(results.reduce((a, b) => a + b, 0) / n); }, 380); };
      const onTap = (e) => { e.stopPropagation(); e.preventDefault(); judge(false); };
      const onKey = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); judge(false); } };
      const tick = () => {
        if (done) return;
        if (cur) {
          const el = (performance.now() - cur.t) / 1000, k = el / dur;
          const rr = R * (2.6 - 1.6 * k);
          cur.shrink.style.width = cur.shrink.style.height = Math.max(0, rr * 2) + 'px';
          if (k > 1.3) judge(true);
        }
        raf = requestAnimationFrame(tick);
      };
      setTimeout(() => { addEventListener('pointerdown', onTap, true); addEventListener('keydown', onKey, true); spawn(); t0 = performance.now(); tick(); }, 220);
      this.active = { cancel: () => { results.push(0.3); i = n; finish(); } };
    });
  }
  mash(q, n, opts) {
    return new Promise((res) => {
      const escape = q.kind === 'escape';
      const r = this._open(escape ? 'BREAK FREE!' : (opts.label || 'MASH!'), escape ? 'Tap as fast as you can!' : 'Tap rapidly to power up');
      const fill = h('i'); r.append(h('div.mashbar', {}, fill));
      const btn = h('div.qtap', { style: { left: '50%', top: '48%', width: '120px', height: '120px', fontSize: '24px' } }, 'TAP!');
      r.append(btn);
      let taps = 0, done = false;
      const dur = (q.dur || (escape ? 1.6 : 2.4)) * 1000, t0 = performance.now();
      const need = n || 10;
      const onTap = (e) => { e.stopPropagation(); e.preventDefault(); taps++; this.ui.sfx('ui_tap', { pitch: 1 + taps * 0.04 }); btn.style.transform = 'translate(-50%,-50%) scale(.9)'; setTimeout(() => (btn.style.transform = 'translate(-50%,-50%)'), 60); fill.style.width = Math.min(100, (taps / need) * 100) + '%'; if (taps >= need) finish(); };
      const onKey = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); onTap(e); } };
      const finish = () => { if (done) return; done = true; removeEventListener('pointerdown', onTap, true); removeEventListener('keydown', onKey, true); clearTimeout(to); setTimeout(() => { this._close(); res(Math.min(1, taps / need)); }, 200); };
      const to = setTimeout(finish, dur);
      setTimeout(() => { addEventListener('pointerdown', onTap, true); addEventListener('keydown', onKey, true); }, 120);
      this.active = { cancel: finish };
    });
  }
}
