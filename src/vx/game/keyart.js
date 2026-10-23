// Title key art: a smooth, high-resolution logo and the three starters as real 3D renders (sticker-cut),
// on an HTML canvas layered between the 3D view and the pixel UI (z-index 1). Fades in, removed on start.
import { monShot } from '../posters.js';
import { loadSignFonts } from '../decals.js';

const TAU = Math.PI * 2;
export async function showKeyArt(app) {
  const cv = document.createElement('canvas'), W = 1600, H = 900;
  cv.width = W; cv.height = H;
  Object.assign(cv.style, { position: 'fixed', left: '0', top: '0', width: '100vw', height: '100vh', objectFit: 'contain', zIndex: '1', pointerEvents: 'none', opacity: '0', transition: 'opacity 1.2s ease' });
  document.body.appendChild(cv);
  const g = cv.getContext('2d');
  await loadSignFonts('TOKONMON SAN FRANCISCO').catch(() => {});
  const shots = await Promise.all([
    monShot(app.stage, 'bubblion', { clip: 'win', t: 1.1, yaw: 28, w: 520, h: 520 }),
    monShot(app.stage, 'chilichick', { clip: 'dance', t: 1.35, yaw: 8, w: 600, h: 600 }),
    monShot(app.stage, 'strawbaa', { clip: 'win', t: 1.0, yaw: -28, w: 520, h: 520 }),
  ].map((p) => p.catch(() => null)));
  paint(g, W, H, shots);
  requestAnimationFrame(() => { cv.style.opacity = '1'; });
  return { remove() { cv.style.opacity = '0'; setTimeout(() => cv.remove(), 1300); } };
}

function paint(g, W, H, shots) {
  g.clearRect(0, 0, W, H);
  // a soft vignette glow behind the logo
  const glow = g.createRadialGradient(W / 2, H * 0.24, 20, W / 2, H * 0.24, W * 0.42);
  glow.addColorStop(0, 'rgba(255,170,70,0.38)'); glow.addColorStop(1, 'rgba(255,120,60,0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  // sunburst rays behind the logo
  g.save(); g.translate(W / 2, H * 0.24); g.globalAlpha = 0.12;
  for (let i = 0; i < 24; i++) { g.rotate(TAU / 24); g.fillStyle = i % 2 ? '#ffd27a' : '#ff8a4a'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W * 0.5, -40); g.lineTo(W * 0.5, 40); g.closePath(); g.fill(); }
  g.restore();
  // the logo: chunky display type, a hot gradient fill, a double ink/white stroke, a slight tilt and a shine
  g.save(); g.translate(W / 2, H * 0.26); g.rotate(-0.035);
  const font = (px) => `${px}px "Bebas Neue", "Oswald", Impact, sans-serif`;
  g.font = font(230); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  g.fillStyle = 'rgba(10,6,20,0.55)'; g.fillText('TOKONMON', 10, 14);
  g.lineWidth = 34; g.strokeStyle = '#1a0e1e'; g.strokeText('TOKONMON', 0, 0);
  g.lineWidth = 16; g.strokeStyle = '#fff6e0'; g.strokeText('TOKONMON', 0, 0);
  const fill = g.createLinearGradient(0, -190, 0, 10); fill.addColorStop(0, '#fff07a'); fill.addColorStop(0.45, '#ffb030'); fill.addColorStop(1, '#ff5a2a');
  g.fillStyle = fill; g.fillText('TOKONMON', 0, 0);
  g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-W, -170, W * 2, 26); g.restore();
  // the ribbon: SAN FRANCISCO
  g.translate(0, 70); g.fillStyle = '#1a2a6a'; g.beginPath(); g.moveTo(-330, -46); g.lineTo(330, -46); g.lineTo(360, 0); g.lineTo(330, 46); g.lineTo(-330, 46); g.lineTo(-360, 0); g.closePath(); g.fill();
  g.lineWidth = 6; g.strokeStyle = '#fff6e0'; g.stroke();
  g.font = font(76); g.fillStyle = '#7ae8ff'; g.fillText('SAN FRANCISCO', 0, 27);
  g.restore();
  // sparkles
  for (const [x, y, r] of [[0.2, 0.12, 22], [0.82, 0.1, 18], [0.86, 0.34, 14], [0.15, 0.36, 12], [0.7, 0.05, 10]]) star(g, W * x, H * y, r);
  // the starters along the bottom, big and close, chick in front
  const place = (pic, cx, cy, h) => { if (!pic) return; const w = (pic.width / pic.height) * h; g.save(); g.globalAlpha = 0.4; g.filter = 'blur(8px)'; g.drawImage(pic, cx - w / 2 + 14, cy - h / 2 + 18, w, h); g.restore(); g.drawImage(pic, cx - w / 2, cy - h / 2, w, h); };
  place(shots[0], W * 0.24, H * 0.72, H * 0.42);
  place(shots[2], W * 0.76, H * 0.72, H * 0.42);
  place(shots[1], W * 0.5, H * 0.7, H * 0.5);
}
function star(g, x, y, r) { g.save(); g.translate(x, y); g.fillStyle = '#fff6d0'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, rr = i % 2 ? r * 0.28 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.restore(); }
