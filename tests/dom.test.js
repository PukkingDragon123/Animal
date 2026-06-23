// DOM-layer smoke test (jsdom, no WebGL). Loads the real index.html so every
// element id the HUD expects is present, then exercises menus, screens, button
// wiring and the input command object.
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { pretendToBeVisual: true, runScripts: 'outside-only' });
const { window } = dom;
// expose the globals the modules use
global.window = window; global.document = window.document;
global.innerWidth = 800; global.innerHeight = 600;
global.addEventListener = window.addEventListener.bind(window);
global.removeEventListener = window.removeEventListener.bind(window);
window.innerWidth = 800; window.innerHeight = 600;

const { Hud } = await import('../public/src/hud.js');
const { Input } = await import('../public/src/input.js');

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error('  FAIL:', n); } };
const $ = (id) => window.document.getElementById(id);

console.log('dom tests');

const calls = {};
const handlers = {};
for (const k of ['onPick', 'onUnlock', 'onBegin', 'onAgain', 'onMenu', 'onResume', 'onPause', 'onToggleMute', 'setSprint'])
  handlers[k] = (...a) => { calls[k] = (calls[k] || 0) + 1; calls[k + '_arg'] = a[0]; return false; };

let hud;
try { hud = new Hud(handlers); ok('Hud constructs', true); }
catch (e) { console.error(' THROW Hud', e.message); fail++; }

const save = { dna: 500, unlocked: ['rabbit', 'bee'], runs: 3 };

// menu
hud.menu(save);
ok('menu: screen shown', $('screen').classList.contains('show'));
ok('menu: play button', !!$('btnPlay'));
$('btnPlay').click();
ok('menu: play → onPick', calls.onPick === 1);

// species select + unlock + play
hud.speciesSelect(save);
ok('select: has cards', $('screen').querySelectorAll('.card').length === 7);
const playBtn = $('screen').querySelector('[data-play]');
ok('select: a play button exists', !!playBtn);
playBtn.click();
ok('select: play → onPick(id)', typeof calls.onPick_arg === 'string');
hud.speciesSelect(save);
const buyBtn = $('screen').querySelector('[data-buy]');
if (buyBtn) { buyBtn.click(); ok('select: unlock → onUnlock', calls.onUnlock >= 1); } else ok('select: unlock button present', false);

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

// death screen
hud.death({ success: true, cause: 'oldAge', lived: 'Elder · 100%', meals: 12, offspring: 3, dna: 240, newUnlocks: ['Bee'] });
ok('death: shows DNA', /240/.test($('screen').textContent));
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
window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'KeyD' }));
ok('input: D → right (+x)', input.get().mx > 0.5);
window.dispatchEvent(new window.KeyboardEvent('keyup', { code: 'KeyD' }));
input.setSprintButton(true); ok('input: run button → sprint', input.get().sprint === true);
input.setSprintButton(false);
// diagonal normalization
window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'KeyW' }));
window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'KeyD' }));
cmd = input.get();
ok('input: diagonal normalized', Math.abs(Math.hypot(cmd.mx, cmd.mz) - 1) < 0.001);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
