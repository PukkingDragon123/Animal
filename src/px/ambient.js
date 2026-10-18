// Ambient particles painted over a scene in screen space: dust motes glinting
// in the sun, drifting sakura petals, night fireflies, rain. Pixel-crisp
// (1–2 px), parallax-free but seeded to the camera so they feel anchored.
const R = (a, b) => a + Math.random() * (b - a);

export function ambient(kind, o = {}) {
  const parts = [], n = o.count || { dust: 34, petals: 26, fireflies: 22, rain: 160, embers: 24 }[kind] || 30;
  let W = 480, H = 270, last = 0;
  const spawn = (p, init) => {
    p.x = R(0, W); p.y = init ? R(0, H) : kind === 'rain' ? R(-20, 0) : kind === 'petals' ? R(-12, -2) : R(0, H);
    p.vx = kind === 'petals' ? R(8, 22) : kind === 'rain' ? -40 : R(-3, 3); p.vy = kind === 'petals' ? R(10, 20) : kind === 'rain' ? R(260, 320) : kind === 'embers' ? R(-18, -8) : R(-2, 2);
    p.ph = R(0, 6.28); p.life = R(4, 10); p.t = 0; p.c = kind === 'petals' ? ['#ffc8dc', '#ffa8c4', '#fff0f4'][(Math.random() * 3) | 0] : kind === 'fireflies' ? '#d8ff7a' : kind === 'embers' ? '#ffb040' : kind === 'rain' ? 'rgba(170,190,230,0.5)' : '#fff2c8';
    return p;
  };
  return (ctx, cam, t) => {
    W = ctx.canvas.width; H = ctx.canvas.height;
    const dt = Math.min(0.05, last ? t - last : 0.016); last = t;
    if (parts.length < n) for (let i = parts.length; i < n; i++) parts.push(spawn({}, true));
    for (const p of parts) {
      p.t += dt;
      if (kind === 'petals') { p.x += (p.vx + Math.sin(t * 2 + p.ph) * 10) * dt; p.y += p.vy * dt; }
      else if (kind === 'fireflies' || kind === 'dust') { p.x += (p.vx + Math.sin(t * 0.7 + p.ph) * 4) * dt; p.y += (p.vy + Math.cos(t * 0.9 + p.ph) * 3) * dt; }
      else { p.x += p.vx * dt; p.y += p.vy * dt; }
      if (p.y > H + 4 || p.x > W + 8 || p.x < -8 || p.y < -30 || (kind !== 'rain' && kind !== 'petals' && p.t > p.life)) spawn(p, false);
      const a = kind === 'fireflies' ? 0.5 + 0.5 * Math.sin(t * 3 + p.ph * 3) : kind === 'dust' ? 0.35 + 0.35 * Math.sin(t * 2 + p.ph) : 1;
      if (a <= 0.05) continue;
      ctx.globalAlpha = a; ctx.fillStyle = p.c;
      if (kind === 'rain') { ctx.fillRect(p.x | 0, p.y | 0, 1, 4); continue; }
      if (kind === 'petals') { ctx.fillRect(p.x | 0, p.y | 0, 2, 1); ctx.fillRect((p.x + (Math.sin(t * 5 + p.ph) > 0 ? 1 : 0)) | 0, (p.y + 1) | 0, 1, 1); continue; }
      ctx.fillRect(p.x | 0, p.y | 0, 1, 1);
      if (kind === 'fireflies' && a > 0.7) { ctx.globalAlpha = a * 0.35; ctx.fillRect((p.x - 1) | 0, p.y | 0, 3, 1); ctx.fillRect(p.x | 0, (p.y - 1) | 0, 1, 3); }
    }
    ctx.globalAlpha = 1;
  };
}
