// UI core: fades, captions, title cards, banners, toasts, dialogue with live
// 3D portraits + voice babble, choices, narration, world labels, damage
// numbers, callouts, anime cut-ins and tutorial callouts.
import { h, clear, wait, tapBtn, escapeHtml } from './dom.js';

export class UI {
  constructor(opts = {}) {
    this.audio = opts.audio || null;
    this.gfx = opts.gfx || null;
    this.root = document.getElementById('ui');
    this.L = {};
    for (const id of ['labels', 'hud', 'bhud', 'cine', 'dlgl', 'tut', 'qte', 'modal', 'title', 'toasts', 'fade']) this.L[id] = document.getElementById(id);
    this.dlg = document.getElementById('dlg');
    this.choicesEl = document.getElementById('choices');
    this.captionEl = document.getElementById('caption');
    this.titleEl = document.getElementById('titlecard');
    this.bannerEl = document.getElementById('banner');
    this.narrEl = document.getElementById('narr');
    this.fadeEl = this.L.fade;
    this.typing = null;
    this.speedMul = 1;
    this.labelPool = [];
    this.onAdvanceKey = null;
    addEventListener('keydown', (e) => { if ((e.code === 'Space' || e.code === 'Enter') && this.onAdvanceKey) { e.preventDefault(); this.onAdvanceKey(); } });
  }
  sfx(n, o) { if (this.audio) this.audio.sfx(n, o); }

  // ------------------------------------------------------------ fades & cinema text
  fade(on, ms = 450) {
    this.fadeEl.style.transition = `opacity ${ms}ms`;
    this.fadeEl.classList.toggle('on', on);
    return wait(ms + 30);
  }
  async caption(text, ms = 3200) {
    this.captionEl.innerHTML = fmt(text);
    this.captionEl.classList.add('show');
    await wait(ms);
    this.captionEl.classList.remove('show');
    await wait(500);
  }
  captionOn(text) { this.captionEl.innerHTML = fmt(text); this.captionEl.classList.add('show'); }
  captionOff() { this.captionEl.classList.remove('show'); }
  async titleCard(big, sub = '', ms = 3000) {
    clear(this.titleEl).append(h('div.big', {}, big), sub ? h('div.sub', {}, sub) : '');
    this.titleEl.classList.add('show');
    await wait(ms);
    this.titleEl.classList.remove('show');
    await wait(800);
  }
  banner(title, small = '', ms = 2600) {
    clear(this.bannerEl).append(small ? h('small', {}, small) : '', title);
    this.bannerEl.classList.add('show');
    clearTimeout(this._bt);
    this._bt = setTimeout(() => this.bannerEl.classList.remove('show'), ms);
  }
  toast(text, cls = '', ms = 2400) {
    const t = h('div.toast' + (cls ? '.' + cls : ''), { html: fmt(text) });
    this.L.toasts.append(t);
    setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 450); }, ms);
  }
  narrate(text) {
    return new Promise((res) => {
      this.narrEl.innerHTML = fmt(text);
      this.narrEl.classList.add('show');
      const done = () => { this.narrEl.classList.remove('show'); this.narrEl.onpointerup = null; this.onAdvanceKey = null; res(); };
      setTimeout(() => { this.narrEl.onpointerup = done; this.onAdvanceKey = done; }, 350);
    });
  }

  // ------------------------------------------------------------ dialogue
  // spk: { name, color, portrait: { model, anim, frame, colors } | null, voice }
  say(spk, text, opts = {}) {
    return new Promise((res) => {
      const d = this.dlg;
      clear(d);
      d.classList.add('show');
      const hasP = !!(spk && spk.portrait);
      d.classList.toggle('noportrait', !hasP);
      const port = h('div.portrait' + (hasP ? '' : '.empty'));
      const textEl = h('div.text');
      const more = h('div.more', {}, '▼');
      more.style.visibility = 'hidden';
      const box = h('div.box', {}, spk && spk.name ? h('div.name', { style: { background: spk.color || 'var(--pink)' } }, h('span', {}, spk.name)) : '', textEl, more);
      d.append(port, box);
      if (hasP && this.gfx) {
        const p = spk.portrait;
        this.gfx.portraits.show('dlg', p.model, p.anim, port, p.frame || {}, p.colors);
        if (p.anim) p.anim.talk(true);
        if (p.expr && p.anim) p.anim.setFace(p.expr, 99);
        if (p.play && p.anim) p.anim.play(p.play);
      } else if (this.gfx) this.gfx.portraits.hide('dlg');
      const full = fmt(text);
      const plain = text.replace(/\*/g, '');
      let i = 0, done = false;
      const speed = (opts.speed || 1) * this.speedMul;
      const finishTyping = () => {
        done = true; textEl.innerHTML = full; more.style.visibility = 'visible';
        clearInterval(this.typing);
        if (hasP && spk.portrait.anim) spk.portrait.anim.talk(false);
      };
      this.typing = setInterval(() => {
        i += 1;
        if (i >= plain.length) { finishTyping(); return; }
        textEl.innerHTML = fmt(partial(text, i));
        const ch = plain[i];
        if (this.audio && spk && spk.voice && i % 2 === 0 && /[\w぀-ヿ一-龯]/.test(ch)) this.audio.voice(spk.voice, ch);
      }, 26 / speed);
      const adv = () => {
        if (!done) { finishTyping(); return; }
        d.onpointerup = null; this.onAdvanceKey = null;
        this.sfx('ui_tap', { vol: 0.5 });
        if (!opts.keep) this.closeDialogue();
        res();
      };
      setTimeout(() => { d.onpointerup = (e) => { e.stopPropagation(); adv(); }; this.onAdvanceKey = adv; }, 120);
      if (opts.auto) setTimeout(() => { if (done) adv(); else { finishTyping(); setTimeout(adv, opts.auto); } }, plain.length * 26 / speed + opts.auto);
    });
  }
  closeDialogue() {
    this.dlg.classList.remove('show');
    clearInterval(this.typing);
    if (this.gfx) this.gfx.portraits.hide('dlg');
  }
  choose(options, opts = {}) {
    return new Promise((res) => {
      clear(this.choicesEl);
      options.forEach((o, i) => {
        const label = typeof o === 'string' ? o : o.label;
        const b = h('button.btn' + (i === 0 ? '.primary' : ''), { style: { animationDelay: i * 60 + 'ms' } }, h('span', {}, label));
        tapBtn(b, () => { clear(this.choicesEl); this.sfx('ui_confirm'); this.closeDialogue(); res(i); });
        this.choicesEl.append(b);
      });
    });
  }

  // ------------------------------------------------------------ labels & numbers
  label(cls = '') {
    const el = this.labelPool.pop() || h('div.lab');
    el.className = 'lab ' + cls;
    el.style.display = '';
    this.L.labels.append(el);
    return el;
  }
  freeLabel(el) { if (!el) return; el.remove(); el.innerHTML = ''; this.labelPool.push(el); }
  place(el, x, y, visible = true) {
    if (!visible) { el.style.display = 'none'; return; }
    el.style.display = '';
    el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%)`;
  }
  pop(x, y, text, cls = '') {
    const el = h('div.dmg' + (cls ? '.' + cls.split(' ').join('.') : ''), {}, text);
    el.style.left = x + (Math.random() - 0.5) * 30 + 'px'; el.style.top = y + 'px';
    this.L.labels.append(el);
    setTimeout(() => el.remove(), 950);
  }
  callout(text, sub = '', color = '#fff', ms = 1100) {
    let c = document.getElementById('callout');
    if (!c) { c = h('div', { id: 'callout' }); this.L.bhud.parentNode.insertBefore(c, this.L.bhud.nextSibling); c.style.position = 'absolute'; }
    clear(c).append(h('div.cut', { style: { color } }, text, sub ? h('small', {}, sub) : ''));
    clearTimeout(this._ct);
    this._ct = setTimeout(() => clear(c), ms);
  }
  async cutin(who, what, colors = ['#ff4fa8', '#8a5aff'], ms = 1300) {
    let c = document.getElementById('cutin');
    if (!c) { c = h('div', { id: 'cutin' }); this.L.cine.append(c); }
    clear(c).append(h('div.stripe', { style: { background: `linear-gradient(90deg,transparent,${colors[0]}ee 12%,${colors[1]}ee 88%,transparent)` } }), h('div.who', {}, who), h('div.what', {}, what));
    c.classList.add('show');
    this.sfx('ult_start', { vol: 0.8 });
    await wait(ms);
    c.classList.remove('show');
  }

  // ------------------------------------------------------------ tutorials
  // target: element | {x,y,r}; returns a promise resolved by tutDone() or a tap
  tutorial(o) {
    const t = clear(this.L.tut);
    const box = h('div.tutbox', {}, h('span.k', {}, o.kicker || 'Tutorial'), h('div', { html: fmt(o.text) }));
    if (o.title) box.prepend(h('div', { style: { fontFamily: 'var(--display)', fontSize: '18px', marginBottom: '2px' } }, o.title));
    t.append(box);
    if (o.target) {
      const r = o.target.getBoundingClientRect ? o.target.getBoundingClientRect() : null;
      const cx = r ? r.left + r.width / 2 : o.target.x, cy = r ? r.top + r.height / 2 : o.target.y, rad = r ? Math.max(r.width, r.height) * 0.7 : (o.target.r || 50);
      t.append(h('div.tutring', { style: { left: cx + 'px', top: cy + 'px', width: rad * 2 + 'px', height: rad * 2 + 'px' } }));
      if (o.hand !== false) t.append(h('div.tuthand', { style: { left: cx + 'px', top: cy + 'px' } }, '👆'));
    }
    if (o.top != null) box.style.top = o.top;
    this.sfx('notification');
    return new Promise((res) => {
      this._tutRes = res;
      if (o.tap) { box.onpointerup = () => this.tutDone(); this._tutKey = () => this.tutDone(); this.onAdvanceKey = this._tutKey; box.append(h('div', { style: { textAlign: 'right', fontSize: '12px', color: 'var(--violet)', marginTop: '4px' } }, 'Tap to continue ▶')); }
    });
  }
  tutDone() { clear(this.L.tut); if (this._tutKey && this.onAdvanceKey === this._tutKey) this.onAdvanceKey = null; this._tutKey = null; const r = this._tutRes; this._tutRes = null; if (r) r(); }

  // ------------------------------------------------------------ modal sheets
  modal(content, opts = {}) {
    const m = clear(this.L.modal);
    m.classList.add('show');
    m.classList.toggle('clear', !!opts.clear);
    m.append(content);
    return m;
  }
  closeModal() { clear(this.L.modal); this.L.modal.classList.remove('show'); if (this.gfx) for (const k of [...this.gfx.portraits.slots.keys()]) if (k !== 'dlg') this.gfx.portraits.hide(k); }
  sheet(title, body, opts = {}) {
    const close = h('button.iconbtn', { title: 'Close' }, '✕');
    const head = h('div.sheet-head', {}, h('h2', {}, title), opts.tabs || '', opts.noClose ? '' : close);
    const sh = h('div.sheet.panel', {}, head, h('div.sheet-body', {}, body));
    if (!opts.noClose) tapBtn(close, () => { this.sfx('ui_back'); if (opts.onClose) opts.onClose(); else this.closeModal(); });
    return sh;
  }
}

// *emphasis* markup and basic escaping
function fmt(s) { return escapeHtml(String(s)).replace(/\*(.+?)\*/g, '<span class="em">$1</span>').replace(/\n/g, '<br>'); }
function partial(s, n) {
  // reveal n plain characters while keeping *markup* balanced
  let out = '', count = 0, open = false;
  for (const ch of s) { if (ch === '*') { out += ch; open = !open; continue; } if (count >= n) break; out += ch; count++; }
  if (open) out += '*';
  return out;
}
