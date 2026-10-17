// Scripted probe: boot the game (optionally from a save), run steps, take screenshots.
//   SAVE=save.json node tools/probe.mjs <outDir> <steps.mjs> [query=auto=continue] [w=1280] [h=720]
// steps.mjs default-exports async (ctx) => {...} with ctx = { page, shot(name), wait(ms), ev(fn, arg) }.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [,, outDir = 'probe-out', stepsFile, query = 'auto=continue', W = '1280', H = '720'] = process.argv;
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
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning' || m.text().startsWith('[probe]')) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
if (process.env.SAVE) { const save = fs.readFileSync(process.env.SAVE, 'utf8'); await page.addInitScript((sv) => { try { localStorage.setItem('elemon.save.v1', sv); } catch (e) { /* ignore */ } }, save); }
await page.goto(`http://localhost:${server.address().port}/index.html?${query}`);
let n = 0;
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => {
  const f = path.join(outDir, `${String(n++).padStart(2, '0')}_${name}.png`);
  try { await page.evaluate(() => { window.__forceRender = true; }); await wait(900); await page.evaluate(() => { window.__hold = true; }); await wait(80); await page.screenshot({ path: f }); }
  catch (e) { logs.push('[shot] ' + e.message.split('\n')[0]); }
  await page.evaluate(() => { window.__hold = false; }).catch(() => {});
  console.log('shot', f);
  return f;
};
const ev = (fn, arg) => page.evaluate(fn, arg);
try {
  await page.waitForFunction(() => window.__app && window.__app.state && window.__app.world && window.__app.world.def, null, { timeout: 120000 });
  const steps = (await import(path.resolve(stepsFile))).default;
  await steps({ page, shot, wait, ev, logs });
} catch (e) { logs.push('[probe] ' + (e.stack || e.message)); }
console.log(logs.join('\n'));
await browser.close();
server.close();
