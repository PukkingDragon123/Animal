// DOM-layer smoke test (jsdom, no WebGL). Loads the real index.html so every
// element id the HUD expects is present, then exercises menus, screens, button
// wiring and the input command object.
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { pretendToBeVisual: true, runScripts: 'outside-only' });
const { window } = dom;
// expose the globals the modules use
global.window = window; global.document = window.document;
global.innerWidth = 800; global.innerHeight = 600;
global.addEventListener = window.addEventListener.bind(window);
global.removeEventListener = window.removeEventListener.bind(window);
window.innerWidth = 800; window.innerHeight = 600;

const { Hud } = await import('../src/hud.js');
const { Input } = await import('../src/input.js');

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error('  FAIL:', n); } };
const $ = (id) => window.document.getElementById(id);

console.log('dom tests');

const calls = {};
const handlers = {};
for (const k of ['onPick', 'onUnlock', 'onBegin', 'onAgain', 'onMenu', 'onResume', 'onPause', 'onToggleMute', 'setSprint', 'setAttack', 'onEvolve', 'onUnlockSkill'])
  handlers[k] = (...a) => { calls[k] = (calls[k] || 0) + 1; calls[k + '_arg'] = a[0]; return k === 'onUnlockSkill'; };

let hud;
try { hud = new Hud(handlers); ok('Hud constructs', true); }
catch (e) { console.error(' THROW Hud', e.message); fail++; }

const save = { dna: 500, genes: 200, exp: 10, level: 2, evolution: {}, skills: {}, unlocked: ['rabbit', 'bee'], runs: 3 };

// menu
hud.menu(save);
ok('menu: screen shown', $('screen').classList.contains('show'));
ok('menu: play button', !!$('btnPlay'));
$('btnPlay').click();
ok('menu: play → onPick', calls.onPick === 1);

// species select carousel (preview is a no-op in jsdom: no WebGL)
hud.speciesSelect(save);
ok('select: preview canvas present', !!$('previewCanvas'));
ok('select: shows a species name', $('spName').textContent.length > 0);
ok('select: nav arrows present', !!$('prevSp') && !!$('nextSp'));
const nm = $('spName').textContent; $('nextSp').click();
ok('select: next changes species', $('spName').textContent !== nm);
hud.speciesSelect(save);                 // restart at first unlocked (rabbit)
ok('select: PLAY shown for unlocked', !!$('spPlay'));
$('spPlay').click();
ok('select: PLAY → onPick(id)', typeof calls.onPick_arg === 'string');
hud.speciesSelect(save);
$('nextSp').click(); $('nextSp').click();   // rabbit → bee → penguin (locked)
ok('select: locked shows quest box', !!document.querySelector('.questBox'));
$('btnBack').click();
ok('select: back returns to menu', !!$('btnPlay'));

// birth card with mutations
hud.birth('rabbit', ['fast', 'frail']);
ok('birth: shows species', /Rabbit/.test($('screen').textContent));
ok('birth: shows mutations', $('screen').querySelectorAll('.mut').length === 2);
$('btnBegin').click();
ok('birth: begin → onBegin', calls.onBegin === 1);

// in-play HUD updates
hud.showHud(true);
ok('hud: shown', $('hud').classList.contains('show'));
hud.setNeeds(80, 40, 33, null);
ok('hud: hunger width set', $('fillHunger').style.width === '80%');
ok('hud: warmth hidden when null', $('barWarmthWrap').style.display === 'none');
hud.setNeeds(20, 10, 90, 25);
ok('hud: warmth shown for cold', $('barWarmthWrap').style.display === 'flex');
ok('hud: low hunger turns red', $('fillHunger').style.background.includes('255') || $('fillHunger').style.background.includes('#ff'));
hud.setObjective('Find food'); ok('hud: objective text', $('objective').textContent === 'Find food');
hud.setDna(123); ok('hud: dna text', $('dnaVal').textContent === '123');
hud.setStage('adult'); ok('hud: stage text', $('stageLabel').textContent === 'Adult');
hud.setVignette(0.5); ok('hud: vignette opacity', parseFloat($('vignette').style.opacity) > 0);
hud.showQuip('Hello'); ok('hud: quip shown', $('quip').classList.contains('show') && $('quip').textContent === 'Hello');
hud.updateJoystick({ ox: 100, oy: 200, kx: 130, ky: 180, maxR: 64 });
ok('hud: joystick visible', $('joystick').style.display === 'block');
hud.updateJoystick(null); ok('hud: joystick hidden', $('joystick').style.display === 'none');
hud.setDiet('🌿', 'Grass'); ok('hud: diet chip set', /Grass/.test($('dietChip').innerHTML));
hud.showTutorial('Move with the left side'); ok('hud: tutorial shows', $('tut').classList.contains('show') && /Move with/.test($('tut').textContent));

// evolution lab — mutation skill tree (preview no-op in jsdom)
hud.evolution(save, 'rabbit');
ok('evo: title shows', /EVOLUTION/.test($('screen').textContent));
ok('evo: skill nodes rendered', $('screen').querySelectorAll('.snode').length >= 8);
ok('evo: tree tiers rendered', $('screen').querySelectorAll('.tier').length >= 3);
const node = $('screen').querySelector('.snode[data-n]:not([disabled])');
ok('evo: a root node is unlockable', !!node);
node && node.click();
ok('evo: click → onUnlockSkill', calls.onUnlockSkill >= 1);
$('btnBack').click(); ok('evo: back → menu', !!$('btnPlay'));

// death screen with rewards
hud.death({ success: true, cause: 'oldAge', speciesId: 'rabbit', lived: 'Elder · 100%', meals: 12, offspring: 3, dna: 240, genes: 18, exp: 40, levelUp: true, level: 3, newUnlocks: ['Bee'] });
ok('death: shows DNA', /240/.test($('screen').textContent));
ok('death: shows genes reward', /18/.test($('screen').textContent));
ok('death: level-up banner', /LEVEL UP/.test($('screen').textContent));
ok('death: evolve button', !!$('btnEvolveD'));
$('btnEvolveD').click(); ok('death: evolve → onEvolve', calls.onEvolve >= 1);
ok('death: again button', !!$('btnAgain'));
$('btnAgain').click(); ok('death: again → onAgain', calls.onAgain === 1);

// pause
hud.pause(); $('btnResume').click(); ok('pause: resume → onResume', calls.onResume === 1);
hud.hideScreen(); ok('hideScreen clears', !$('screen').classList.contains('show'));

// ---- Input ----
const canvas = $('c');
const input = new Input(canvas);
input.enabled = true;
// keyboard (physical codes)
window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'KeyW' }));
let cmd = input.get();
ok('input: W → forward (+z)', cmd.mz > 0.5);
window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'ShiftLeft' }));
ok('input: Shift → sprint', input.get().sprint === true);
window.dispatchEvent(new window.KeyboardEvent('keyup', { code: 'KeyW' }));
window.dispatchEvent(new window.KeyboardEvent('keyup', { code: 'ShiftLeft' }));
cmd = input.get();
ok('input: released → idle', Math.abs(cmd.mz) < 0.01 && cmd.sprint === false);
// horizontal: A and D move opposite ways (camera maps +X to screen-left, so the
// command X is negated — D and A must just be opposite & non-zero)
window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'KeyD' }));
const dRight = input.get().mx;
window.dispatchEvent(new window.KeyboardEvent('keyup', { code: 'KeyD' }));
window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'KeyA' }));
const dLeft = input.get().mx;
window.dispatchEvent(new window.KeyboardEvent('keyup', { code: 'KeyA' }));
ok('input: A and D are opposite horizontally', dRight !== 0 && Math.sign(dRight) === -Math.sign(dLeft));
input.setSprintButton(true); ok('input: run button → sprint', input.get().sprint === true);
input.setSprintButton(false);
input.setAttackButton(true); ok('input: attack button → attack', input.get().attack === true);
input.setAttackButton(false);
window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'Space' }));
ok('input: Space → attack', input.get().attack === true);
window.dispatchEvent(new window.KeyboardEvent('keyup', { code: 'Space' }));
// diagonal normalization
window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'KeyW' }));
window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'KeyD' }));
cmd = input.get();
ok('input: diagonal normalized', Math.abs(Math.hypot(cmd.mx, cmd.mz) - 1) < 0.001);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
