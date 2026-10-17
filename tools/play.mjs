// Automated play-test: boots the game in headless Chromium and plays the
// opening chapter by itself (advances dialogue, picks choices, walks to
// objectives, fights battles with keyboard commands), taking screenshots.
//   node tools/play.mjs <outDir> [seconds=600] [query=auto=new] [w=1280] [h=720]
// Battles are shortened (enemy HP capped) after a while so a run fits a time budget.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [,, outDir = 'play-out', secs = '600', query = 'auto=new&dev', W = '1280', H = '720', stopAt = ''] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
});
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +W, height: +H } });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
// scenario: inject a save file and continue from it (see tools/scenarios/make.mjs)
if (process.env.SAVE) { const save = fs.readFileSync(process.env.SAVE, 'utf8'); await page.addInitScript((sv) => { try { localStorage.setItem('elemon.save.v1', sv); } catch (e) { /* ignore */ } }, save); }
if (process.env.NOENGAGE) await page.addInitScript(() => { window.__noEngage = true; });
await page.goto(`http://localhost:${server.address().port}/index.html?${query}`);

let n = 0;
const shot = async (name) => {
  const f = path.join(outDir, `${String(n++).padStart(3, '0')}_${name}.png`);
  try { await page.evaluate(() => { window.__forceRender = true; }); await page.waitForTimeout(1200); await page.evaluate(() => { window.__hold = true; }); await page.waitForTimeout(100); await page.screenshot({ path: f, timeout: 20000 }); }
  catch (e) { logs.push('[shot] ' + e.message.split('\n')[0]); }
  await page.evaluate(() => { window.__hold = false; }).catch(() => {});
  return f;
};
const t0 = Date.now();
let lastShot = 0, lastBeat = '', battleT = 0, battleShots = 0, stuck = 0, lastSig = '';
const seen = new Set();

const state = () => page.evaluate(() => {
  const app = window.__app; const q = (s) => document.querySelector(s);
  if (!app || !app.state) return { boot: true };
  const modal = q('#modal');
  const s = app.state, w = app.world;
  const p = w.actor && w.actor('player');
  return {
    dlg: q('#dlg').classList.contains('show'), choices: document.querySelectorAll('#choices button').length,
    narr: q('#narr').classList.contains('show'), tut: q('#tut').textContent.slice(0, 80), tutTap: !!q('#tut .tutbox') && q('#tut').textContent.includes('Tap to continue'),
    modal: modal.classList.contains('show'), modalText: modal.textContent.slice(0, 160), title: q('#title').classList.contains('show'),
    battle: app.battle.active, control: w.control, busy: app.busy, cut: app.director.cutscene,
    flags: Object.keys(s.flags).filter((k) => s.flags[k]).join(','), beat: s.story.beat, map: w.mapId, day: s.time.day, hour: +s.time.hour.toFixed(2),
    obj: app.hud.objective, err: q('#err').textContent.slice(0, 2000), party: s.party.map((m) => m.species + m.level).join(' '),
    league: s.league.points, fps: app._fps ? +app._fps.toFixed(1) : null, pos: p ? [+p.pos.x.toFixed(1), +p.pos.z.toFixed(1)] : null,
  };
});
const click = async (sel) => { const el = await page.$(sel); if (el) { await el.click({ force: true }).catch(() => {}); return true; } return false; };
const clickText = async (text) => { const el = page.locator('#modal button', { hasText: text }).first(); if (await el.count()) { await el.click({ force: true }).catch(() => {}); return true; } return false; };

while ((Date.now() - t0) / 1000 < +secs) {
  let st;
  try { st = await state(); } catch (e) { logs.push('[driver] ' + e.message); await page.waitForTimeout(500); continue; }
  if (st.err && !seen.has(st.err)) { seen.add(st.err); logs.push('[ERR panel] ' + st.err); await shot('error'); }
  if (st.boot) { await page.waitForTimeout(400); continue; }
  const beat = `${st.map}|${st.beat}|${st.flags.split(',').length}`;
  if (beat !== lastBeat) { lastBeat = beat; console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] day${st.day} ${st.hour}h map=${st.map} fps=${st.fps} beat=${st.beat} party=${st.party} pts=${st.league} obj="${st.obj}" flags=${st.flags}`); }
  if (stopAt && st.flags.split(',').includes(stopAt)) { await shot('stop_' + stopAt); break; }
  if (Date.now() - lastShot > 9000) { lastShot = Date.now(); await shot(st.battle ? 'battle' : (st.map || 'x') + (st.cut ? '_cut' : '')); }
  // ---- battle
  if (st.battle) {
    battleT += 0.25;
    if (battleShots < 3 && battleT > 3 + battleShots * 5) { battleShots++; await shot('battle_' + st.map); }
    const tut = st.tut;
    if (st.tutTap) await page.keyboard.press('Enter');
    else if (/ATTACK/.test(tut)) await page.keyboard.press('Space');
    else if (/Skills!/.test(tut)) await page.keyboard.press('Digit1');
    else if (/Swipe/.test(tut)) await page.keyboard.press('ShiftLeft');
    else if (/PARRY/.test(tut)) await page.keyboard.press('KeyE');
    else if (/Combos/.test(tut)) { await page.keyboard.press('KeyQ'); await page.waitForTimeout(150); await page.keyboard.press('KeyE'); await page.waitForTimeout(150); await page.keyboard.press('Space'); }
    else if (/Switch!/.test(tut)) await page.keyboard.press('Tab');
    else if (/TEAM/.test(tut)) await page.keyboard.press('KeyT');
    else {
      const keys = ['Space', 'Space', 'Digit1', 'Space', 'Digit2', 'KeyE', 'Space', 'KeyT', 'Digit3', 'KeyF'];
      await page.keyboard.press(keys[Math.floor(Math.random() * keys.length)]);
    }
    // capturable and weak → throw the keychain
    const cap = await page.evaluate(() => { const st = window.__app.battle.st; if (!st || !st.rules.capture || st.qte) return false; const f = st.units.find((u) => u.side === 1 && u.onField && u.state !== 'faint'); return !!f && f.hp / f.maxHp < 0.35; }).catch(() => false);
    if (cap) { await page.keyboard.press('KeyC'); console.log('   driver: capture throw'); }
    // QTE: tap the centre a few times
    const qte = await page.$('#qte *');
    if (qte) { await page.mouse.click(+W / 2, +H / 2); await page.keyboard.press('Space'); }
    if (battleT > 22) await page.evaluate(() => { const st = window.__app.battle.st; if (st) for (const u of st.units) if (u.side === 1 && u.hp > 8) u.hp = 8; });
    await page.waitForTimeout(250);
    continue;
  }
  battleT = 0; battleShots = 0;
  // ---- overlays
  if (st.choices) { await page.waitForTimeout(300); const k = await page.$$('#choices button'); const i = Math.floor(Math.random() * k.length); await k[i].click({ force: true }).catch(() => {}); await page.waitForTimeout(300); continue; }
  if (st.modal) {
    const t = st.modalText;
    if (t.includes('Who are you')) { await shot('creator'); await clickText("That's me"); }
    else if (t.includes('Choose your partner')) { await shot('starter_select'); const which = +(process.env.STARTER || 0); for (let i = 0; i < which; i++) await click('.cscene .iconbtn:last-of-type'); await page.waitForTimeout(800); await shot('starter_pick'); await clickText('Choose this partner'); await page.waitForTimeout(300); await clickText('Yes!'); }
    else if (t.includes('LEVEL UP')) { await shot('levelup'); const c = await page.$$('#modal .copt'); if (c.length) await c[0].click({ force: true }); await page.waitForTimeout(200); await clickText('Continue'); }
    else if (await page.$('#modal .copt')) { await shot('choice'); const c = await page.$$('#modal .copt:not(.picked)'); if (c.length) await c[Math.floor(Math.random() * c.length)].click({ force: true }); }
    else if (t.includes('Yes!') || t.includes('Go home')) { await clickText(t.includes('Go home') ? 'Go home' : 'Yes!'); }
    else if (t.includes('Osaka 2050')) { await click('#modal .sheet-head .iconbtn'); }
    else if (t.includes('Menu')) { await shot('menu'); await click('#modal .sheet-head .iconbtn'); }
    else { await page.waitForTimeout(300); }
    await page.waitForTimeout(350);
    continue;
  }
  if (st.title) { await click('#title .btn.primary'); continue; }
  if (st.dlg || st.narr || st.tutTap) { await page.waitForTimeout(450); await page.keyboard.press('Enter'); await page.waitForTimeout(200); await page.keyboard.press('Enter'); continue; }
  // ---- free roam: steer toward the objective
  if (st.control && !st.busy && !st.cut) {
    const sig = JSON.stringify([st.pos, st.flags, st.map]);
    stuck = sig === lastSig ? stuck + 1 : 0; lastSig = sig;
    const goal = await page.evaluate(() => {
      const app = window.__app, F = (k) => !!app.state.flags[k], w = app.world, m = w.mapId, s = app.state;
      const go = (pt, r = 1) => { const p = w.resolvePoint(pt); if (p) w.walkTo('player', p[0] + (Math.random() - 0.5) * r, p[1] + (Math.random() - 0.5) * r); return 'walk ' + pt; };
      if (m === 'castle_park' && !F('met_coach')) return go('coach');
      if (m === 'castle_park' && F('fought_kaito') && !F('icecream')) { app.travel('dotonbori'); return 'travel dotonbori'; }
      if (m === 'dotonbori' && !F('icecream')) return go('icecream');
      if (F('day1_done') && !F('license') && m !== 'umeda') { app.travel('umeda'); return 'travel umeda'; }
      if (F('free_time') && !F('pt_shinsekai')) { app.state.flags.pt_shinsekai = 1; app.travel('shinsekai'); return 'travel shinsekai'; }
      if (F('free_time') && m === 'shinsekai' && !F('pt_dojo')) { app.state.flags.pt_dojo = 1; const r = w.rec('dojo_master'); if (r) { w.interact(r); return 'dojo'; } }
      if (F('free_time') && m === 'shinsekai' && !F('pt_onsen')) { app.state.flags.pt_onsen = 1; const r = w.rec('onsen_staff'); if (r) { w.interact(r); return 'onsen'; } }
      if (F('free_time') && !F('pt_minoh')) { app.state.flags.pt_minoh = 1; app.travel('minoh_maple'); return 'travel minoh'; }
      if (F('free_time') && m === 'minoh_maple' && !F('pt_ranger')) { app.state.flags.pt_ranger = 1; const r = w.rec('ranger'); if (r) { w.interact(r); return 'ranger'; } }
      if (F('free_time') && s.league.points >= 100 && !F('rookie_cup') && s.time.day >= 5 && m !== 'umeda') { app.travel('umeda'); return 'travel umeda (cup)'; }
      if (F('free_time') && !F('pt_menu')) { app.state.flags.pt_menu = 1; return 'menu'; }
      if (F('free_time') && m && m.startsWith('minoh') && w.safari && !window.__noEngage) {
        const wild = w.safari.wild.find((x) => !x.wild.boss);
        if (wild) { app.state.flags.pt_wild = (app.state.flags.pt_wild || 0) + 1; w.safari.engage(wild); return 'engage ' + wild.wild.species; }
      }
      if (F('free_time') && !F('pt_umeda')) { app.state.flags.pt_umeda = 1; app.travel('umeda'); return 'travel umeda'; }
      if (F('free_time') && m === 'umeda' && app.state.league.matchesToday < 3) { const r = w.rec('receptionist'); if (r) { w.interact(r); return 'rank'; } }
      return 'idle';
    });
    if (goal !== 'idle' && !goal.startsWith('walk')) console.log('   driver:', goal);
    if (goal === 'menu') {
      // tour the pause menu tabs
      await page.evaluate(() => { window.__app.openMenu('team'); }); await page.waitForTimeout(800); await shot('menu_team');
      await page.evaluate(() => { const a = window.__app; a.screens.menu('mon', a.state.party[0].uid); }); await page.waitForTimeout(900); await shot('menu_mon');
      for (const sub of ['Skills', 'Astral']) { const b = page.locator('#modal button', { hasText: sub }).first(); if (await b.count()) { await b.click({ force: true }).catch(() => {}); await page.waitForTimeout(700); await shot('menu_mon_' + sub.toLowerCase()); } }
      for (const tab of ['bag', 'quests', 'style', 'dex']) { await page.evaluate((t) => { window.__app.screens.menu(t); }, tab); await page.waitForTimeout(700); await shot('menu_' + tab); }
      await page.evaluate(() => { window.__app.screens.worldMap(); }); await page.waitForTimeout(700); await shot('worldmap');
      await click('#modal .sheet-head .iconbtn'); await page.waitForTimeout(300);
      await page.evaluate(() => { const a = window.__app; a.screens.close(); a.onMenuClosed(); });
    }
    if (stuck > 30) { console.log('   driver: stuck at', st.pos, st.obj); await shot('stuck'); stuck = 0; }
    await page.waitForTimeout(goal.startsWith('walk') ? 1500 : 800);
    continue;
  }
  await page.waitForTimeout(300);
}
await shot('end');
const final = await state().catch(() => ({}));
console.log('FINAL', JSON.stringify(final).slice(0, 600));
console.log('--- logs ---\n' + [...new Set(logs)].slice(0, 60).join('\n'));
await browser.close(); server.close();
