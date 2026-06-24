// HUD + menus. Mobile-first, large rounded controls, minimal in-play overlay
// (food / energy / life / objective). Drives DOM elements declared in
// index.html; injects menu / birth / death content. Player-visible text comes
// from strings.js (STR / EPITAPH).
import { STR, EPITAPH } from './strings.js';
import { SPECIES, SPECIES_LIST } from './species.js';
import { MUTATIONS } from './mutations.js';
import { questFor } from './quests.js';
import { Preview } from './preview.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export class Hud {
  constructor(handlers) {
    this.h = handlers;            // { onPick, onUnlock, onBegin, onAgain, onMenu, onResume, onToggleMute }
    this.els = {
      hud: $('hud'), obj: $('objective'), dna: $('dnaVal'), stage: $('stageLabel'),
      hunger: $('fillHunger'), energy: $('fillEnergy'), life: $('fillLife'),
      warmthWrap: $('barWarmthWrap'), warmth: $('fillWarmth'),
      quip: $('quip'), vignette: $('vignette'), dietChip: $('dietChip'), tut: $('tut'),
      joystick: $('joystick'), knob: $('joyKnob'), run: $('runbtn'),
      screen: $('screen'), pauseBtn: $('pauseBtn'),
    };
    this._quipTimer = null; this._tutTimer = null; this.preview = null;
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
  setDiet(icon, name) { if (this.els.dietChip) this.els.dietChip.innerHTML = `${icon} <b>${esc(name)}</b>`; }

  showTutorial(text) {
    const t = this.els.tut; if (!t || !text) return;
    t.innerHTML = '💡 ' + esc(text); t.classList.add('show');
    clearTimeout(this._tutTimer);
    this._tutTimer = setTimeout(() => t.classList.remove('show'), 4400);
  }

  _disposePreview() { if (this.preview) { this.preview.dispose(); this.preview = null; } }

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
  hideScreen() { this._disposePreview(); const s = this.els.screen; if (s) { s.classList.remove('show'); s.innerHTML = ''; } }
  _screen(html) { const s = this.els.screen; if (!s) return; s.innerHTML = html; s.classList.add('show'); return s; }

  menu(save) {
    this._disposePreview();
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

  // Slay-the-Spire-style carousel: one big species at a time, live 3D preview,
  // diet + stat bars, and either PLAY (unlocked) or the quest needed to unlock.
  speciesSelect(save, startId) {
    this._disposePreview();
    const dots = SPECIES_LIST.map((id, i) => `<i data-dot="${i}" class="${save.unlocked.includes(id) ? '' : 'lk'}"></i>`).join('');
    this._screen(`
      <div class="panel selectC">
        <div class="ptitle">${esc(STR.chooseSpecies)}</div>
        <div class="carousel">
          <button class="navArrow" id="prevSp" aria-label="Previous">‹</button>
          <div class="bigcard">
            <canvas id="previewCanvas" class="preview"></canvas>
            <div class="bignameRow"><span class="bigname" id="spName"></span><span class="bignum" id="spNum"></span></div>
            <div class="bigdesc" id="spDesc"></div>
            <div class="dietRow"><span class="eats">${esc(STR.diet)}:</span> <span id="spDiet"></span></div>
            <div class="stats3" id="spStats"></div>
            <div class="spAction" id="spAction"></div>
          </div>
          <button class="navArrow" id="nextSp" aria-label="Next">›</button>
        </div>
        <div class="dots">${dots}</div>
        <button class="btn ghost" id="btnBack">${STR.back}</button>
      </div>`);

    const canvas = $('previewCanvas');
    this.preview = new Preview(canvas);
    let idx = Math.max(0, SPECIES_LIST.indexOf(startId || SPECIES_LIST.find(id => save.unlocked.includes(id)) || 'rabbit'));

    const pip = (label, val) => { let p = ''; for (let k = 0; k < 5; k++) p += `<i class="${k < val ? 'on' : ''}"></i>`; return `<div class="stat"><span>${label}</span><div class="pips">${p}</div></div>`; };

    const render = () => {
      const id = SPECIES_LIST[idx], sp = SPECIES[id], unlocked = save.unlocked.includes(id);
      $('spName').textContent = sp.name;
      $('spNum').textContent = `${idx + 1}/${SPECIES_LIST.length}`;
      $('spDesc').textContent = sp.desc;
      $('spDiet').innerHTML = `${sp.dietIcon} <b>${esc(sp.dietName)}</b>`;
      $('spStats').innerHTML = pip(STR.statSpeed, sp.rating.speed) + pip(STR.statSize, sp.rating.size) + pip(STR.statLife, sp.rating.life);
      const act = $('spAction');
      if (unlocked) {
        act.innerHTML = `<button class="btn big" id="spPlay">${STR.play}</button>`;
        $('spPlay').onclick = () => { const s = id; this.h.onPick?.(s); };
        $('previewCanvas').classList.remove('lockedPrev');
      } else {
        const q = questFor(id);
        act.innerHTML = `<div class="questBox"><div class="qlabel">🔒 ${esc(STR.questToUnlock)}</div><div class="qtext">${esc(q ? q.text : '???')}</div></div>`;
        $('previewCanvas').classList.add('lockedPrev');
      }
      this.els.screen.querySelectorAll('.dots i').forEach((d, i) => d.classList.toggle('cur', i === idx));
      this.preview.show(id);
    };
    const move = (dir) => { idx = (idx + dir + SPECIES_LIST.length) % SPECIES_LIST.length; render(); };
    $('prevSp').onclick = () => move(-1);
    $('nextSp').onclick = () => move(1);
    this.els.screen.querySelectorAll('.dots i').forEach((d, i) => d.onclick = () => { idx = i; render(); });
    $('btnBack').onclick = () => this.menu(save);
    render();
  }

  birth(speciesId, mutationIds) {
    this._disposePreview();
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
