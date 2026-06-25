// HUD + menus. Mobile-first, large rounded controls, minimal in-play overlay
// (food / energy / life / objective). Drives DOM elements declared in
// index.html; injects menu / birth / death content. Player-visible text comes
// from strings.js (STR / EPITAPH).
import { STR, EPITAPH } from './strings.js';
import { SPECIES, SPECIES_LIST } from './species.js';
import { MUTATIONS } from './mutations.js';
import { questFor } from './quests.js';
import { Preview } from './preview.js';
import { expForLevel } from './evolution.js';
import { SKILLS, SKILL_TIERS, speciesSkills, applySkills, canUnlock, reqMet } from './skills.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export class Hud {
  constructor(handlers) {
    this.h = handlers;            // { onPick, onUnlock, onBegin, onAgain, onMenu, onResume, onToggleMute }
    this.els = {
      hud: $('hud'), obj: $('objective'), dna: $('dnaVal'), stage: $('stageLabel'), clock: $('clock'),
      score: $('score'), combo: $('combo'), genChip: $('genChip'),
      hearts: $('hearts'), foodRow: $('foodRow'), energy: $('fillEnergy'), life: $('fillLife'),
      warmthWrap: $('barWarmthWrap'), warmth: $('fillWarmth'),
      goals: $('goals'), xppop: $('xppop'), family: $('family'), carry: $('carryChip'),
      quip: $('quip'), vignette: $('vignette'), dietChip: $('dietChip'), tut: $('tut'),
      joystick: $('joystick'), knob: $('joyKnob'), run: $('runbtn'), atk: $('atkbtn'),
      screen: $('screen'), pauseBtn: $('pauseBtn'),
    };
    this._quipTimer = null; this._tutTimer = null; this.preview = null;
    const mk = (el, n, ch) => { const a = []; if (el) { el.innerHTML = ''; for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.textContent = ch; el.appendChild(s); a.push(s); } } return a; };
    this._hearts = mk(this.els.hearts, 10, '❤️');
    this._food = mk(this.els.foodRow, 10, '🍗');
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
    const a = this.els.atk;
    if (a) {
      const on = (e) => { this.h.setAttack?.(true); e.preventDefault(); };
      const off = () => this.h.setAttack?.(false);
      a.addEventListener('pointerdown', on); a.addEventListener('pointerup', off);
      a.addEventListener('pointercancel', off); a.addEventListener('pointerleave', off);
    }
    this.els.pauseBtn?.addEventListener('click', () => this.h.onPause?.());
  }

  // ---- in-play HUD ----
  showHud(show) { this.els.hud?.classList.toggle('show', show); if (!show) { this.setGoals(null); this.setCarry(null); } }
  setDna(n) { if (this.els.dna) this.els.dna.textContent = n; }
  setStage(stageKey) { if (this.els.stage) this.els.stage.textContent = STR.stage[stageKey] || ''; }
  setObjective(text) { if (this.els.obj) this.els.obj.textContent = text; }
  setDiet(icon, name) { if (this.els.dietChip) this.els.dietChip.innerHTML = `${icon} <b>${esc(name)}</b>`; }
  setClock(light) { if (this.els.clock) this.els.clock.textContent = light > 0.55 ? '☀️' : (light > 0.2 ? '🌇' : '🌙'); }
  setScore(n) { if (this.els.score) this.els.score.textContent = '★ ' + (n | 0); }
  flashCombo(c) {
    const el = this.els.combo; if (!el) return;
    el.textContent = `COMBO ×${c}!`; el.classList.add('show');
    clearTimeout(this._comboTimer); this._comboTimer = setTimeout(() => el.classList.remove('show'), 700);
  }

  showTutorial(text) {
    const t = this.els.tut; if (!t || !text) return;
    t.innerHTML = '💡 ' + esc(text); t.classList.add('show');
    clearTimeout(this._tutTimer);
    this._tutTimer = setTimeout(() => t.classList.remove('show'), 4400);
  }

  _disposePreview() { if (this.preview) { this.preview.dispose(); this.preview = null; } }

  // Minecraft-style vitals: hearts (health), drumsticks (food), stamina bar (energy).
  // hungerPct === null → this species cannot eat (mayfly/anglerfish): hide the food row.
  setVitals(healthPct, hungerPct, energyPct, lifePct, warmthPct) {
    const hf = Math.round(Math.max(0, healthPct) / 10);
    for (let i = 0; i < this._hearts.length; i++) this._hearts[i].classList.toggle('off', i >= hf);
    if (this.els.foodRow) {
      if (hungerPct == null) this.els.foodRow.style.display = 'none';
      else { this.els.foodRow.style.display = 'flex'; const ff = Math.round(Math.max(0, hungerPct) / 10); for (let i = 0; i < this._food.length; i++) this._food[i].classList.toggle('off', i >= ff); }
    }
    if (this.els.energy) this.els.energy.style.width = Math.max(0, energyPct) + '%';
    if (this.els.life) this.els.life.style.width = Math.max(0, Math.min(100, lifePct)) + '%';
    if (warmthPct != null && this.els.warmthWrap) {
      this.els.warmthWrap.style.display = 'flex';
      if (this.els.warmth) { this.els.warmth.style.width = Math.max(0, warmthPct) + '%'; this.els.warmth.style.background = warmthPct < 30 ? '#7fd0ff' : '#ffb84d'; }
    } else if (this.els.warmthWrap) this.els.warmthWrap.style.display = 'none';
  }

  setGeneration(gen) { if (this.els.genChip) { if (gen > 1) { this.els.genChip.style.display = 'block'; this.els.genChip.textContent = '⚭ Gen ' + gen; } else this.els.genChip.style.display = 'none'; } }

  // life-goals checklist — the quest you must complete in this life (re-renders on change)
  setGoals(goals, idx) {
    const el = this.els.goals; if (!el) return;
    if (!goals || !goals.length) { if (this._goalSig !== '') { el.innerHTML = ''; this._goalSig = ''; } return; }
    const sig = idx + '/' + goals.length + '/' + goals.filter(g => g.done).length;
    if (sig === this._goalSig) return;
    this._goalSig = sig;
    el.innerHTML = goals.map((g, i) => {
      const cls = g.done ? 'done' : (i === idx ? 'cur' : '');
      const k = g.done ? '✓' : (i === idx ? '▸' : '○');
      return `<div class="goalItem ${cls}"><span class="gk">${k}</span><span>${esc(g.label)}</span></div>`;
    }).join('');
  }

  // a "+N EXP" pop near the score when an action pays out
  xpPopup(n) {
    const el = this.els.xppop; if (!el || !n) return;
    el.textContent = '✦ +' + n + ' EXP'; el.classList.add('show');
    clearTimeout(this._xpTimer); this._xpTimer = setTimeout(() => el.classList.remove('show'), 1000);
  }

  // the realistic "family moment" card shown when you reproduce
  familyMoment(text) {
    const el = this.els.family; if (!el || !text) return;
    el.textContent = '👶 ' + text; el.classList.add('show');
    clearTimeout(this._famTimer); this._famTimer = setTimeout(() => el.classList.remove('show'), 5400);
  }

  // forager carry chip (worker bee): nectar load + lifetime deliveries
  setCarry(text) { const el = this.els.carry; if (!el) return; if (text == null) el.style.display = 'none'; else { el.style.display = 'block'; el.innerHTML = text; } }

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
        <div class="dnaBig">⭐ ${STR.levelLabel} <b>${save.level || 1}</b> · 🧬 <b>${save.genes || 0}</b> ${STR.genes}</div>
        <button class="btn big" id="btnPlay">${STR.tapToLive}</button>
        <button class="btn ghost" id="btnSelect">${STR.chooseSpecies}</button>
        <button class="btn ghost" id="btnEvolve">${STR.evolve}</button>
        <div class="muteRow"><button class="btn tiny" id="btnMute">🔊</button></div>
        <div class="hint">${esc(STR.hint)}<br>${esc(STR.hintKeys)}</div>
      </div>`);
    if (!s) return;
    $('btnPlay').onclick = () => this.h.onPick?.(null);     // null = random unlocked
    $('btnSelect').onclick = () => this.speciesSelect(save);
    $('btnEvolve').onclick = () => this.h.onEvolve?.(null);
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
            <div class="badges"><span class="rarity Common" id="spRarity"></span><span class="statusword" id="spStatus"></span></div>
            <div class="bignameRow"><span class="bigname" id="spName"></span><span class="bignum" id="spNum"></span></div>
            <div class="latin" id="spLatin"></div>
            <div class="bigdesc" id="spDesc"></div>
            <div class="dietRow"><span class="eats">${esc(STR.diet)}:</span> <span id="spDiet"></span></div>
            <div class="ability" id="spAbility"></div>
            <div class="evoMini" id="spEvo"></div>
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
    let idx = Math.max(0, SPECIES_LIST.indexOf(startId || SPECIES_LIST.find(id => save.unlocked.includes(id)) || 'turtle'));

    const pip = (label, val) => { let p = ''; for (let k = 0; k < 5; k++) p += `<i class="${k < val ? 'on' : ''}"></i>`; return `<div class="stat"><span>${label}</span><div class="pips">${p}</div></div>`; };

    const render = () => {
      const id = SPECIES_LIST[idx], sp = SPECIES[id], unlocked = save.unlocked.includes(id);
      $('spName').textContent = sp.name;
      $('spNum').textContent = `${idx + 1}/${SPECIES_LIST.length}`;
      $('spLatin').textContent = sp.latin || '';
      const st = $('spStatus'); st.textContent = sp.status || ''; st.className = 'statusword s' + (sp.status || '').replace(/\s/g, '');
      $('spDesc').textContent = sp.desc;
      $('spDiet').innerHTML = `${sp.dietIcon} <b>${esc(sp.dietName)}</b>`;
      $('spRarity').className = 'rarity ' + (sp.rarity || 'Common');
      $('spRarity').textContent = sp.rarity || 'Common';
      $('spAbility').innerHTML = `<b>${esc(STR.abilityLabel)}:</b> ${esc(sp.ability || '')}`;
      const sk = speciesSkills(save, id);
      $('spEvo').textContent = sk.length ? `🧬 Mutations: ${sk.length}` : '';
      $('spStats').innerHTML = pip(STR.statSpeed, sp.rating.speed) + pip(STR.statSize, sp.rating.size) + pip(STR.statLife, sp.rating.life);
      const act = $('spAction');
      if (unlocked) {
        act.innerHTML = `<div class="cardBtns"><button class="btn big" id="spPlay">${STR.play}</button><button class="btn big evo" id="spEvolve">${STR.evolve}</button></div>`;
        $('spPlay').onclick = () => this.h.onPick?.(id);
        $('spEvolve').onclick = () => this.h.onEvolve?.(id);
        $('previewCanvas').classList.remove('lockedPrev');
      } else {
        const q = questFor(id);
        act.innerHTML = `<div class="questBox"><div class="qlabel">🔒 ${esc(STR.questToUnlock)}</div><div class="qtext">${esc(q ? q.text : '???')}</div></div>`;
        $('previewCanvas').classList.add('lockedPrev');
      }
      this.els.screen.querySelectorAll('.dots i').forEach((d, i) => d.classList.toggle('cur', i === idx));
      this.preview.show(id, applySkills(speciesSkills(save, id)).visuals);
    };
    const move = (dir) => { idx = (idx + dir + SPECIES_LIST.length) % SPECIES_LIST.length; render(); };
    $('prevSp').onclick = () => move(-1);
    $('nextSp').onclick = () => move(1);
    this.els.screen.querySelectorAll('.dots i').forEach((d, i) => d.onclick = () => { idx = i; render(); });
    $('btnBack').onclick = () => this.menu(save);
    render();
  }

  // Mutation skill tree: spend genes on connected nodes that mutate the model
  evolution(save, speciesId) {
    this._disposePreview();
    const id = (speciesId && save.unlocked.includes(speciesId)) ? speciesId : (save.unlocked[save.unlocked.length - 1] || 'turtle');
    const sp = SPECIES[id];
    const need = expForLevel(save.level || 1);
    const tiers = []; for (let t = 0; t < SKILL_TIERS; t++) tiers.push([]);
    for (const nodeId in SKILLS) tiers[SKILLS[nodeId].tier].push(nodeId);
    this._screen(`
      <div class="panel selectC">
        <div class="ptitle">${esc(STR.evoTitle)} · ${esc(sp.name)}</div>
        <div class="evoTop">
          <span class="pill">⭐ ${STR.levelLabel} <b>${save.level || 1}</b></span>
          <span class="pill">🧬 <b id="evGenes">${save.genes || 0}</b> ${STR.genes}</span>
        </div>
        <div class="expbar"><div style="width:${Math.min(100, Math.round(100 * (save.exp || 0) / need))}%"></div></div>
        <canvas id="previewCanvas" class="preview"></canvas>
        <div class="bigdesc">${esc(STR.evoBlurb)}</div>
        <div class="tree" id="tree"></div>
        <button class="btn ghost" id="btnBack">${STR.back}</button>
      </div>`);
    this.preview = new Preview($('previewCanvas'));

    const refresh = () => {
      const u = speciesSkills(save, id);
      this.preview.show(id, applySkills(u).visuals);
      $('evGenes').textContent = save.genes || 0;
      $('tree').innerHTML = tiers.map(row => `<div class="tier">${row.map(nodeId => {
        const n = SKILLS[nodeId], owned = u.includes(nodeId), avail = !owned && reqMet(u, nodeId), afford = avail && (save.genes || 0) >= n.cost;
        const cls = owned ? 'owned' : (avail ? (afford ? 'avail' : 'cant') : 'locked');
        return `<button class="snode ${cls}" data-n="${nodeId}" title="${esc(n.desc)}" ${owned || !afford ? 'disabled' : ''}>
          <span class="sico">${n.icon}</span><span class="sname">${esc(n.name)}</span><span class="scost">${owned ? '✓ owned' : '🧬 ' + n.cost}</span></button>`;
      }).join('')}</div>`).join('<div class="tierLink"></div>');
      $('tree').querySelectorAll('.snode[data-n]').forEach(b => b.onclick = () => { if (this.h.onUnlockSkill?.(id, b.getAttribute('data-n'))) refresh(); });
    };
    refresh();
    $('btnBack').onclick = () => this.menu(save);
  }

  birth(speciesId, mutationIds, gen = 1) {
    this._disposePreview();
    const sp = SPECIES[speciesId];
    const muts = mutationIds.length
      ? mutationIds.map(id => { const m = MUTATIONS[id]; return `<div class="mut ${m.good ? 'good' : 'bad'}"><b>${esc(m.name)}</b><span>${esc(m.desc)}</span></div>`; }).join('')
      : `<div class="mut neutral">${esc(STR.birth.noMut)}</div>`;
    const genHtml = gen > 1 ? `<div class="levelup">⚭ ${STR.death.generation} ${gen} — the bloodline carries on, freshly mutated</div>` : '';
    this._screen(`
      <div class="panel birth">
        <div class="ptitle">${esc(STR.birth.youAre)} ${esc(sp.article)} <span class="hi">${esc(sp.name)}</span></div>
        <div class="latin">${esc(sp.latin || '')} · <span class="statusword s${esc((sp.status || '').replace(/\s/g, ''))}">${esc(sp.status || '')}</span></div>
        ${genHtml}
        <div class="fact">“${esc(sp.facts[Math.floor(Math.random() * sp.facts.length)])}”</div>
        <div class="mutLabel">${esc(STR.birth.aMut)}</div>
        <div class="muts">${muts}</div>
        <button class="btn big" id="btnBegin">${STR.birth.begin}</button>
      </div>`);
    $('btnBegin').onclick = () => this.h.onBegin?.();
  }

  death(result) {
    this._disposePreview();
    const ep = EPITAPH[result.cause] || 'Gone, but statistically expected.';
    const title = result.success ? STR.death.successTitle : STR.death.title;
    const unlockHtml = (result.newUnlocks && result.newUnlocks.length)
      ? `<div class="unlockNote">🎉 Unlocked: ${result.newUnlocks.map(esc).join(', ')}</div>` : '';
    const lvlHtml = result.levelUp ? `<div class="levelup">⭐ ${STR.death.levelUp} ${STR.levelLabel} ${result.level}</div>` : '';
    this._screen(`
      <div class="panel death ${result.success ? 'win' : ''}">
        <div class="ptitle">${esc(title)}</div>
        <div class="epitaph">${esc(ep)}</div>
        ${lvlHtml}
        <div class="rewards"><div class="rw">🧬 +${result.genes} ${STR.death.genesEarned}</div><div class="rw exp">✦ +${result.exp} ${STR.death.expEarned}</div></div>
        <div class="stats">
          <div class="dnaStat"><span>Score</span><b>★ ${result.score || 0}</b></div>
          ${result.generation > 1 ? `<div class="dnaStat"><span>${STR.death.dynasty} · ${STR.death.generation} ${result.generation}</span><b>★ ${result.dynastyScore}</b></div>` : ''}
          <div><span>${STR.death.livedFor}</span><b>${esc(result.lived)}</b></div>
          <div><span>${STR.death.ate}</span><b>${result.meals}</b></div>
          <div><span>${STR.death.babies}</span><b>${result.offspring}</b></div>
          <div><span>${STR.death.dnaEarned}</span><b>🧬 ${result.dna}</b></div>
        </div>
        ${unlockHtml}
        ${result.canContinue ? `<button class="btn big heir" id="btnContinue">⚭ ${STR.death.continueHeir} · ${STR.death.generation} ${result.nextGen}</button>` : ''}
        <div class="row">
          <button class="btn big" id="btnAgain">${STR.death.again}</button>
          <button class="btn big evo" id="btnEvolveD">${STR.death.evolve}</button>
        </div>
        <button class="btn ghost" id="btnMenu" style="margin-top:8px;width:100%">${STR.death.menu}</button>
      </div>`);
    if (result.canContinue) $('btnContinue').onclick = () => this.h.onContinue?.();
    $('btnAgain').onclick = () => this.h.onAgain?.();
    $('btnEvolveD').onclick = () => this.h.onEvolve?.(result.speciesId);
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
