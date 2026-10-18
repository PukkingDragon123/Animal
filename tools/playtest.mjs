// Scripted play test in headless Chromium: node tools/playtest.mjs <url> <outprefix> <steps-json> [w] [h]
// steps: [{ wait: ms }, { until: 'js condition' }, { skip: 'js condition' (advances dialogue until true) },
//         { key: 'Enter' }, { hold: 'ArrowLeft', ms }, { click: [x, y] }, { eval: 'js' }, { shot: 'name' }]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [,, url, out, stepsJson = '[]', W = '1440', H = '810'] = process.argv;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => { const p = path.join(root, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); res.end(d); }); });
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +W, height: +H } });
const logs = []; page.on('console', (m) => { if (!/GPU stall|GL Driver/.test(m.text())) logs.push(`[${m.type()}] ${m.text()}`); }); page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto(`http://localhost:${server.address().port}/${url}`, { waitUntil: 'domcontentloaded' });
const steps = JSON.parse(stepsJson); let n = 0;
for (const s of steps) {
  if (s.wait) await page.waitForTimeout(s.wait);
  if (s.until) { try { await page.waitForFunction(s.until, null, { timeout: s.timeout || 120000, polling: 500 }); } catch (e) { logs.push('[timeout] ' + s.until); } }
  if (s.skip) { // advance dialogue until the condition holds
    const t0 = Date.now();
    while (Date.now() - t0 < (s.timeout || 150000)) {
      const ok = await page.evaluate((c) => { const a = window.__app; if (!a) return false; try { if (eval(c)) return true; } catch (e) {} if (a.ui.dialog) { const d = a.ui.dialog; d.shown = d.str.length; a.ui.closeDialog(d.choices ? (d.pickDefault || 0) : null); } return false; }, s.skip);
      if (ok) break; await page.waitForTimeout(250);
    }
  }
  if (s.key) await page.keyboard.press(s.key);
  if (s.hold) { await page.keyboard.down(s.hold); await page.waitForTimeout(s.ms || 500); await page.keyboard.up(s.hold); }
  if (s.click) await page.mouse.click(s.click[0], s.click[1]);
  if (s.eval) { const r = await page.evaluate(s.eval); if (r !== undefined) logs.push('[eval] ' + JSON.stringify(r)); }
  if (s.shot) await page.screenshot({ path: `${out}_${String(++n).padStart(2, '0')}_${s.shot}.png`, timeout: 180000 });
}
const el = await page.$('#err'); if (el) { const t = await el.textContent(); if (t) logs.push('[#err] ' + t); }
console.log(logs.join('\n')); await browser.close(); server.close();
