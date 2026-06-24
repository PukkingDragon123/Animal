// Procedural, code-driven animation per creature gait. Exaggerated and lively
// (cute, readable from a distance). Locomotion amplitude/frequency scale with
// movement speed; idle gets breathing + micro-motion. No clips, no rig — the
// "non-rigged props animated in code" path. render.js sets x/z/heading + baseY
// first; the animator then drives part transforms and the vertical bob.

const lerp = (a, b, t) => a + (b - a) * t;

export function animateCreature(group, dt, time, ctx) {
  const ud = group.userData;
  const parts = ud.parts;
  if (!parts) return;
  const speed = ctx.speed || 0;
  const moving = !!ctx.moving;
  const norm = Math.min(speed / 7, 1.4);            // 0..~1.4
  const baseY = ud.baseY || 0;

  // advance a gait phase whose rate rises with speed
  ud.phase = (ud.phase || 0) + dt * (3 + norm * 7);
  const ph = ud.phase;
  const idle = time * 1.6;

  let bob = 0;

  switch (parts.gait) {
    case 'hop': {
      const moveAmp = moving ? 0.14 + norm * 0.26 : 0.0;
      bob = Math.abs(Math.sin(ph)) * moveAmp + Math.sin(idle) * 0.012;
      const lean = moving ? Math.sin(ph) * 0.18 * norm : 0;
      group.rotation.x = lerp(group.rotation.x || 0, lean, 0.3);
      if (parts.ears) parts.ears.forEach((e, i) => { e.rotation.x = -0.1 + Math.sin(ph + i) * (moving ? 0.4 : 0.12) * (0.4 + norm); });
      if (parts.legs) parts.legs.forEach((l, i) => { l.position.y = 0.12 + (moving ? Math.max(0, Math.sin(ph)) * 0.12 : 0); });
      if (parts.tail) parts.tail.position.y = 0.5 + bob * 0.3;
      break;
    }
    case 'trot': {
      bob = (moving ? Math.abs(Math.sin(ph * 2)) * (0.04 + norm * 0.06) : Math.sin(idle) * 0.01);
      if (parts.legs) parts.legs.forEach((l, i) => { const diag = (i === 0 || i === 3) ? 0 : Math.PI; l.rotation.x = moving ? Math.sin(ph * 2 + diag) * (0.5 + norm * 0.4) : 0; });
      if (parts.tail) { parts.tail.rotation.y = Math.sin(ph * 0.8 + 0.5) * 0.35 + Math.sin(idle) * 0.1; parts.tail.rotation.x = -0.2 + Math.sin(ph) * 0.08; }
      if (parts.head) parts.head.rotation.x = Math.sin(ph * 2) * 0.06 * (moving ? 1 : 0.3);
      if (parts.ears) parts.ears.forEach((e, i) => e.rotation.x = Math.sin(idle + i) * 0.08);
      break;
    }
    case 'fly': {
      bob = 0.5 + Math.sin(time * 4) * 0.08;          // hover height
      if (parts.wings) parts.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (0.3 + Math.sin(time * 60) * 0.5); });
      if (parts.body) parts.body.rotation.x = lerp(parts.body.rotation.x || 0, moving ? norm * 0.3 : 0, 0.2);
      group.position.y = (ud.baseY || 0); // bob added below via 'bob'
      break;
    }
    case 'waddle': {
      const rock = moving ? Math.sin(ph) * (0.22 + norm * 0.22) : Math.sin(idle) * 0.04;
      if (parts.body) { parts.body.rotation.z = rock; parts.body.rotation.x = moving ? norm * 0.12 : 0; }
      bob = moving ? Math.abs(Math.sin(ph)) * 0.06 : 0;
      if (parts.flippers) parts.flippers.forEach((f, i) => { f.rotation.x = Math.sin(ph + (i ? Math.PI : 0)) * (moving ? 0.7 : 0.15); });
      if (parts.feet) parts.feet.forEach((ft, i) => { ft.position.z = 0.1 + Math.sin(ph + (i ? Math.PI : 0)) * (moving ? 0.16 : 0); });
      break;
    }
    case 'paddle': {
      bob = Math.sin(time * 2) * 0.05;
      group.rotation.x = lerp(group.rotation.x || 0, moving ? -0.12 : 0, 0.1);
      if (parts.flippers) parts.flippers.forEach((f, i) => { f.rotation.x = Math.sin(ph * 1.2 + (i % 2 ? Math.PI : 0)) * (moving ? 0.6 : 0.2); });
      if (parts.head) parts.head.rotation.y = Math.sin(idle * 0.7) * 0.1;
      break;
    }
    case 'swimfish': {
      // NOTE: render.js owns group.rotation.y (heading) — never touch it here.
      bob = Math.sin(time * 2.2) * 0.05;
      if (parts.tail) parts.tail.rotation.y = Math.sin(ph) * (0.4 + norm * 0.5);
      if (parts.body) parts.body.rotation.y = Math.sin(ph - 0.6) * (0.06 + norm * 0.08);
      if (parts.fins) parts.fins.forEach((f, i) => { f.rotation.z = (i ? -1 : 1) * (0.5 + Math.sin(ph * 2 + i) * 0.3); });
      group.rotation.z = Math.sin(ph) * (0.04 + norm * 0.04);
      break;
    }
    case 'flap': {
      bob = 0.6 + Math.sin(time * 3) * 0.12;          // gulls hover/dive
      if (parts.wings) parts.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (0.2 + Math.sin(time * 16) * 0.7); });
      if (ctx.diving) group.rotation.x = lerp(group.rotation.x || 0, 0.5, 0.2);
      else group.rotation.x = lerp(group.rotation.x || 0, 0, 0.15);
      break;
    }
    case 'undulate': {
      bob = Math.abs(Math.sin(ph)) * (moving ? 0.12 : 0.02);
      group.rotation.x = Math.sin(ph) * (moving ? 0.12 : 0.03);
      if (parts.flippers) parts.flippers.forEach((f, i) => f.rotation.x = Math.sin(ph + (i ? Math.PI : 0)) * (moving ? 0.5 : 0.15));
      break;
    }
    case 'lumber': {
      bob = moving ? Math.abs(Math.sin(ph)) * 0.06 : 0;
      if (parts.legs) parts.legs.forEach((l, i) => { const diag = (i === 0 || i === 3) ? 0 : Math.PI; l.rotation.x = moving ? Math.sin(ph + diag) * (0.4 + norm * 0.3) : 0; });
      if (parts.head) parts.head.rotation.x = Math.sin(ph) * 0.08;
      group.rotation.z = moving ? Math.sin(ph) * 0.06 : 0;
      break;
    }
    default:
      bob = Math.sin(idle) * 0.02;
  }

  group.position.y = baseY + bob;
}
