// HUD + menus. Mobile-first, large rounded controls, minimal in-play overlay
// (food / energy / life / objective). Drives DOM elements declared in
// index.html; injects menu / birth / death content. Player-visible text comes
// from strings.js (STR / EPITAPH).
import { STR, EPITAPH } from './strings.js';
import { SPECIES, SPECIES_LIST } from './species.js';
import { MUTATIONS } from './mutations.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export class Hud {
  constructor(handlers) {
    this.h = handlers;            // { onPick, onUnlock, onBegin, onAgain, onMenu, onResume, onToggleMute }
    this.els = {
      hud: $('hud'), obj: $('objective'), dna: $('dnaVal'), stage: $('stageLabel'),
      hunger: $('fillHunger'), energy: $('fillEnergy'), life: $('fillLife'),
      warmthWrap: $('barWarmthWrap'), warmth: $('fillWarmth'),
      quip: $('quip'), vignette: $('vignette'),
      joystick: $('joystick'), knob: $('joyKnob'), run: $('runbtn'),
      screen: $('screen'), pauseBtn: $('pauseBtn'),
    };
    this._quipTimer = null;
    this._wireStatic();
  }

  _wireStatic() {
    const r = this.els.run;
    if (r) {
      const on = (e) => { this.h.setSprint?.(true); e.preventDefault(); };
      const off = (e) => { this.h.setSprint?.(false); };
      r.addEventListener('pointerdown', on); r.addEventListener('pointerup', off);
      r.addEventListener('pointercancel', off); r.addEventListener('pointerleave', off);
    }
    this.els.pauseBtn?.addEventListener('click', () => this.h.onPause?.());
  }

  // ---- in-play HUD ----
  showHud(show) { this.els.hud?.classList.toggle('show', show); }
  setDna(n) { if (this.els.dna) this.els.dna.textContent = n; }
  setStage(stageKey) { if (this.els.stage) this.els.stage.textContent = STR.stage[stageKey] || ''; }
  setObjective(text) { if (this.els.obj) this.els.obj.textContent = text; }

  setNeeds(hungerPct, energyPct, lifePct, warmthPct) {
    if (this.els.hunger) this.els.hunger.style.width = Math.max(0, hungerPct) + '%';
    if (this.els.energy) this.els.energy.style.width = Math.max(0, energyPct) + '%';
    if (this.els.life) this.els.life.style.width = Math.max(0, Math.min(100, lifePct)) + '%';
    if (this.els.hunger) this.els.hunger.style.background = hungerPct < 25 ? '#ff6b5e' : (hungerPct < 50 ? '#ffcf5e' : '#7fd66a');
    if (warmthPct != null && this.els.warmthWrap) {
      this.els.warmthWrap.style.display = 'flex';
      if (this.els.warmth) { this.els.warmth.style.width = Math.max(0, warmthPct) + '%'; this.els.warmth.style.background = warmthPct < 30 ? '#7fd0ff' : '#ffb84d'; }
    } else if (this.els.warmthWrap) this.els.warmthWrap.style.display = 'none';
  }

  setVignette(danger) {
    if (this.els.vignette) this.els.vignette.style.opacity = Math.min(0.7, danger * 0.7);
  }

  updateJoystick(vis) {
    const j = this.els.joystick, k = this.els.knob;
    if (!j || !k) return;
    if (!vis) { j.style.display = 'none'; return; }
    j.style.display = 'block';
    j.style.left = vis.ox + 'px'; j.style.top = vis.oy + 'px';
    k.style.left = (vis.kx - vis.ox) + 'px'; k.style.top = (vis.ky - vis.oy) + 'px';
  }

  showQuip(text) {
    const q = this.els.quip; if (!q || !text) return;
    q.textContent = text; q.classList.add('show');
    clearTimeout(this._quipTimer);
    this._quipTimer = setTimeout(() => q.classList.remove('show'), 3200);
  }

  // ---- screens ----
  hideScreen() { const s = this.els.screen; if (s) { s.classList.remove('show'); s.innerHTML = ''; } }
  _screen(html) { const s = this.els.screen; if (!s) return; s.innerHTML = html; s.classList.add('show'); return s; }

  menu(save) {
    const s = this._screen(`
      <div class="panel menu">
        <div class="logo">${esc(STR.title)}</div>
        <div class="tagline">${esc(STR.tagline)}</div>
        <div class="dnaBig">🧬 <b>${save.dna}</b> ${STR.dna}</div>
        <button class="btn big" id="btnPlay">${STR.tapToLive}</button>
        <button class="btn ghost" id="btnSelect">${STR.chooseSpecies}</button>
        <div class="muteRow"><button class="btn tiny" id="btnMute">🔊</button></div>
        <div class="hint">${esc(STR.hint)}<br>${esc(STR.hintKeys)}</div>
      </div>`);
    if (!s) return;
    $('btnPlay').onclick = () => this.h.onPick?.(null);     // null = random unlocked
    $('btnSelect').onclick = () => this.speciesSelect(save);
    $('btnMute').onclick = (e) => { const m = this.h.onToggleMute?.(); e.target.textContent = m ? '🔇' : '🔊'; };
  }

  speciesSelect(save) {
    const cards = SPECIES_LIST.map((id) => {
      const sp = SPECIES[id];
      const unlocked = save.unlocked.includes(id);
      const canBuy = !unlocked && save.dna >= sp.unlockCost;
      const col = '#' + sp.colors.body.toString(16).padStart(6, '0');
      return `<div class="card ${unlocked ? '' : 'locked'}" data-id="${id}">
        <div class="swatch" style="background:${col}"></div>
        <div class="cname">${esc(sp.name)}</div>
        <div class="cdesc">${esc(sp.desc)}</div>
        ${unlocked
          ? `<button class="btn small play" data-play="${id}">${STR.play}</button>`
          : `<button class="btn small ${canBuy ? '' : 'disabled'}" data-buy="${id}">${STR.unlock} · 🧬${sp.unlockCost}</button>`}
      </div>`;
    }).join('');
    this._screen(`
      <div class="panel select">
        <div class="ptitle">${esc(STR.chooseSpecies)}</div>
        <div class="dnaBig">🧬 <b>${save.dna}</b> ${STR.dna}</div>
        <div class="grid">${cards}</div>
        <button class="btn ghost" id="btnBack">${STR.back}</button>
      </div>`);
    $('btnBack').onclick = () => this.menu(save);
    this.els.screen.querySelectorAll('[data-play]').forEach(b => b.onclick = () => this.h.onPick?.(b.getAttribute('data-play')));
    this.els.screen.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { if (!b.classList.contains('disabled')) this.h.onUnlock?.(b.getAttribute('data-buy')); });
  }

  birth(speciesId, mutationIds) {
    const sp = SPECIES[speciesId];
    const muts = mutationIds.length
      ? mutationIds.map(id => { const m = MUTATIONS[id]; return `<div class="mut ${m.good ? 'good' : 'bad'}"><b>${esc(m.name)}</b><span>${esc(m.desc)}</span></div>`; }).join('')
      : `<div class="mut neutral">${esc(STR.birth.noMut)}</div>`;
    this._screen(`
      <div class="panel birth">
        <div class="ptitle">${esc(STR.birth.youAre)} ${esc(sp.article)} <span class="hi">${esc(sp.name)}</span></div>
        <div class="fact">“${esc(sp.facts[Math.floor(Math.random() * sp.facts.length)])}”</div>
        <div class="mutLabel">${esc(STR.birth.aMut)}</div>
        <div class="muts">${muts}</div>
        <button class="btn big" id="btnBegin">${STR.birth.begin}</button>
      </div>`);
    $('btnBegin').onclick = () => this.h.onBegin?.();
  }

  death(result) {
    const ep = EPITAPH[result.cause] || 'Gone, but statistically expected.';
    const title = result.success ? STR.death.successTitle : STR.death.title;
    const unlockHtml = (result.newUnlocks && result.newUnlocks.length)
      ? `<div class="unlockNote">🎉 Unlocked: ${result.newUnlocks.map(esc).join(', ')}</div>` : '';
    this._screen(`
      <div class="panel death ${result.success ? 'win' : ''}">
        <div class="ptitle">${esc(title)}</div>
        <div class="epitaph">${esc(ep)}</div>
        <div class="stats">
          <div><span>${STR.death.livedFor}</span><b>${esc(result.lived)}</b></div>
          <div><span>${STR.death.ate}</span><b>${result.meals}</b></div>
          <div><span>${STR.death.babies}</span><b>${result.offspring}</b></div>
          <div class="dnaStat"><span>${STR.death.dnaEarned}</span><b>🧬 ${result.dna}</b></div>
        </div>
        ${unlockHtml}
        <div class="row">
          <button class="btn big" id="btnAgain">${STR.death.again}</button>
          <button class="btn ghost" id="btnMenu">${STR.death.menu}</button>
        </div>
      </div>`);
    $('btnAgain').onclick = () => this.h.onAgain?.();
    $('btnMenu').onclick = () => this.h.onMenu?.();
  }

  pause() {
    this._screen(`
      <div class="panel pause">
        <div class="ptitle">${esc(STR.pausedTitle)}</div>
        <div class="row">
          <button class="btn big" id="btnResume">${STR.resume}</button>
          <button class="btn ghost" id="btnQuit">${STR.menu}</button>
        </div>
      </div>`);
    $('btnResume').onclick = () => this.h.onResume?.();
    $('btnQuit').onclick = () => this.h.onMenu?.();
  }
}
