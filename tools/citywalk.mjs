// City test drive: node tools/citywalk.mjs "<query>" <out-prefix> '[steps]' [w] [h]
// query e.g. "loc=city&roam=1&at=26,116" ; steps: [{ keys: ['w','Shift'], ms: 1200 }, { shot: 'a' }, { eval: 'js' }, { wait: 500 }]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [,, q = 'loc=city&roam=1', out = 'city', stepsJson = '[{"shot":"0"}]', W = '1280', H = '720'] = process.argv;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css' };
const server = http.createServer((req, res) => { const p = path.join(root, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); res.end(d); }); });
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +W, height: +H } });
const logs = []; page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); }); page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message + '\n' + e.stack));
await page.goto(`http://localhost:${server.address().port}/index.html?${q}`);
await page.waitForFunction(() => window.__app && window.__app.roaming, null, { timeout: 120000 }).catch(() => logs.push('[timeout] roaming'));
await page.waitForTimeout(1500);
let n = 0;
for (const s of JSON.parse(stepsJson)) {
  if (s.keys) { for (const k of s.keys) await page.keyboard.down(k); await page.waitForTimeout(s.ms || 800); for (const k of s.keys) await page.keyboard.up(k); }
  if (s.press) await page.keyboard.press(s.press);
  if (s.eval) logs.push('eval: ' + JSON.stringify(await page.evaluate(s.eval)));
  if (s.wait) await page.waitForTimeout(s.wait);
  if (s.shot !== undefined) { await page.waitForTimeout(300); await page.screenshot({ path: `${out}_${s.shot || n++}.png` }); }
}
const st = await page.evaluate(() => { const a = window.__app, p = a.world.player && a.world.player.g.position; return { pos: p && [p.x.toFixed(2), p.y.toFixed(2), p.z.toFixed(2)], L: a.world.city && a.world.city.L, inside: a.world.city && a.world.city.inside, zone: a.world.zoneName }; });
console.log(JSON.stringify(st)); console.log(logs.slice(0, 30).join('\n'));
await browser.close(); server.close();
