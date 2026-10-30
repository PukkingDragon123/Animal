// Hair and hats as a few chunky shells around the cranium (all on the head bone, except long hair below the
// nape which rides on the chest, and pony / twin tails which hang from spring-driven tail bones).
import { seg } from './body.js';

/** Cranium cross-section at height y, grown by (ex, ez) and shifted by dz. */
function cs(P, y, ex = 0, ez = 0, dz = 0) {
  const sl = 0.06 * P.hu, t = Math.max(0, Math.min(1, (y - P.noseY) / (P.crown - P.noseY)));
  return [0, P.hcz - sl * 0.6 * t + dz, P.hw * (1 - 0.1 * t) + ex, P.hd - sl * 0.4 * t + ez];
}

/** Grow a top section [cx, cz, hx, hz] so it still encloses the cranium's crown (no scalp poking through). */
function enclose(P, c, m = 0.01 * P.hu, ch = 0.3) {
  const k = cs(P, P.crown);
  m += Math.max(0, ch - 0.3) * 0.22 * P.hu; // a bigger corner chamfer than the skull's needs more room
  const front = Math.max(c[1] + c[3], k[1] + k[3] + m), back = Math.min(c[1] - c[3], k[1] - k[3] - m);
  return [c[0], (front + back) / 2, Math.max(c[2], k[2] + m), (front - back) / 2];
}

export function hairSegments(spec, P, J) {
  const S = [], hu = P.hu, st = spec.hair.style, hat = spec.hat?.kind;
  const add = (part, bone, mat, y0, y1, b, t, o) => { const x = seg(part, bone, mat, y0, y1, b, t, o); S.push(x); return x; };
  const vol = spec.hair.volume || 1;
  // --- the hair
  const cap = (th, y0, o = {}) => add('hairCap', 'head', 'hair', y0, P.crown + th * 0.9, cs(P, y0, th, th, o.dz || 0), (() => { const c = cs(P, P.crown, th * 0.75, th * 0.8, (o.dz || 0) - th * 0.15); c[2] *= o.round ?? 0.9; c[3] *= o.round ?? 0.9; return enclose(P, c, 0.004 * hu, o.ch ?? 0.38); })(), { ch: o.ch ?? 0.38, caps: 'top' });
  const sides = (th, y0, y1, zf, flare = 0) => {
    const zb = P.hcz - P.hd - th * 0.6, mid = (zf + zb) / 2, hz = (zf - zb) / 2;
    const x0 = cs(P, y0)[2], x1 = cs(P, y1)[2];
    add('hairSide', 'head', 'hair', y0, y1, [x0 + th * (0.5 + flare) - 0.004, mid, th * (0.5 + flare) + 0.004, hz], [x1 + th * 0.5 - 0.004, mid, th * 0.5 + 0.004, hz], { ch: 0.3, mirror: true, caps: 'bot' });
  };
  const back = (th, y0, y1, w = 1, flare = 0) => {
    const c0 = cs(P, y0), c1 = cs(P, y1);
    add('hairBack', 'head', 'hair', y0, y1, [0, c0[1] - c0[3] + 0.03 * hu - th * (1 + flare) / 2, (c0[2] + th) * w + flare * th, th * (1 + flare) / 2 + 0.03 * hu], [0, c1[1] - c1[3] + 0.03 * hu - th / 2, (c1[2] + th) * w, th / 2 + 0.03 * hu], { ch: 0.35, caps: 'bot' });
  };
  const bangs = (yb, w = 0.86, th = 0.035 * hu, cut = 'straight') => {
    const c = cs(P, P.hairY);
    add('bangs', 'head', 'hair', yb, P.hairY + 0.06 * hu, [0, P.zf + th / 2 - 0.01 * hu, P.hw * w, th / 2], [0, c[1] + c[3] + th / 2 - 0.004, c[2] * w * 0.98, th / 2], { ch: 0.3, caps: 'bot', cut });
  };
  const tail = (bone, len, w, x, y, z) => {
    J[bone] = [x, y, z];
    add('tail', bone, 'hair', y - len, y + 0.02 * hu, [x, z - 0.03 * hu, w * 0.55, w * 0.5], [x, z, w, w * 0.9], { ch: 0.4, rot: { p: [x, y, z], e: [-0.12, 0, x > 0 ? -0.1 : x < 0 ? 0.1 : 0] } });
  };
  if (!hat || hat === 'headband') {
    if (st === 'mohawk') {
      // shaved sides + a tall spiky crest from the hairline to the nape
      cap(0.012 * hu, P.hairY - 0.01 * hu, { round: 0.95 });
      sides(0.01 * hu, P.earTop - 0.02 * hu, P.hairY, P.zf - 0.2 * hu);
      back(0.012 * hu, P.napeY, P.hairY);
      const k = cs(P, P.crown), hz = k[3] * 0.98;
      add('crest', 'head', 'hair', P.crown - 0.12 * hu, P.crown + 0.3 * hu * vol, [0, k[1] + 0.02 * hu, 0.035 * hu, hz], [0, k[1] - 0.04 * hu, 0.012 * hu, hz * 0.7], { ch: 0.35, caps: 'top', cut: 'messy' });
    } else if (st === 'short' || st === 'sidepart') {
      cap(0.05 * hu * vol, P.hairY - 0.015 * hu, { dz: 0.005 * hu });
      sides(0.032 * hu, P.earTop - 0.03 * hu, P.hairY, P.zf - 0.2 * hu);
      back(0.04 * hu, P.napeY, P.hairY);
      if (st === 'sidepart') add('fringe', 'head', 'hair', P.hairY - 0.07 * hu, P.hairY + 0.07 * hu, [spec.hair.part * P.hw * 0.32, P.zf + 0.012 * hu, P.hw * 0.42, 0.022 * hu], [spec.hair.part * P.hw * 0.28, P.zf - 0.01 * hu, P.hw * 0.52, 0.03 * hu], { ch: 0.4, caps: 'none', cut: 'swept' });
    } else if (st === 'buzz') {
      cap(0.016 * hu, P.hairY - 0.01 * hu, { round: 0.95 });
      sides(0.012 * hu, P.earTop - 0.02 * hu, P.hairY, P.zf - 0.2 * hu);
      back(0.014 * hu, P.napeY, P.hairY);
    } else if (st === 'messy' || st === 'mushroom' || st === 'bowl') {
      const th = (st === 'bowl' ? 0.05 : 0.07) * hu;
      cap(th, P.hairY - 0.03 * hu, { dz: 0.006 * hu, round: 0.88, ch: 0.45 });
      sides((st === 'messy' ? 0.028 : 0.035) * hu, P.earTop - (st === 'mushroom' ? 0.08 : st === 'messy' ? 0 : 0.03) * hu, P.hairY, P.zf - (st === 'messy' ? 0.19 : 0.16) * hu, st === 'messy' ? 0 : 0.15);
      back(0.04 * hu, P.napeY - 0.02 * hu, P.hairY, 1, 0.15);
      bangs(P.browY + (st === 'messy' ? 0.06 : 0.02) * hu, 0.88, 0.04 * hu, st === 'messy' ? 'messy' : 'straight');
    } else if (st === 'bob' || st === 'long' || st === 'pigtails' || st === 'twintails' || st === 'ponytail' || st === 'bun') {
      const tight = st === 'ponytail' || st === 'bun' || st === 'twintails' || st === 'pigtails';
      const th = (tight ? 0.035 : 0.055) * hu * vol;
      cap(th, P.hairY - 0.025 * hu, { dz: 0.004 * hu });
      if (st === 'bob' || st === 'long') {
        const yb = P.chin + (st === 'bob' ? 0.08 : -0.02) * hu;
        sides((st === 'long' ? 0.042 : 0.055) * hu * vol, yb, P.hairY, P.zf - (st === 'long' ? 0.12 : 0.07) * hu, st === 'long' ? 0.15 : 0.35);
        back(0.055 * hu * vol, yb, P.hairY, 1.02, st === 'long' ? 0.2 : 0.35);
        bangs(P.browY + 0.03 * hu, 0.86, 0.04 * hu, st === 'long' && spec.hair.part ? 'side' : 'straight');
        if (st === 'long') {
          // the rest of the length rides on the chest so the head can turn freely
          const w = P.hw * 1.05 * vol, zb = -P.chestZ * 0.62;
          add('hairLong', 'chest', 'hair', P.bustY - 0.03 * P.H * (spec.age === 'teen' ? 0 : 1), P.neckBase + 0.05 * hu, [0, zb - 0.03 * hu, w * 1.1, 0.045 * hu * vol], [0, zb - 0.045 * hu, w, 0.06 * hu * vol], { ch: 0.35, caps: 'bot' });
        }
      } else {
        sides(0.03 * hu, P.earTop - 0.02 * hu, P.hairY, P.zf - 0.16 * hu);
        back(0.035 * hu, P.napeY, P.hairY);
        bangs(P.browY + 0.05 * hu, 0.84, 0.035 * hu, 'side');
        const zb = P.hcz - P.hd;
        if (st === 'ponytail') tail('tailL', P.H * (spec.age === 'kid' ? 0.11 : 0.15) * vol, 0.026 * P.H * Math.sqrt(vol), 0, P.eyeY + 0.12 * hu, zb - 0.02 * hu);
        else if (st === 'bun') add('bun', 'head', 'hair', P.crown - 0.32 * hu, P.crown - 0.02 * hu, [0, zb - 0.06 * hu, 0.17 * hu, 0.13 * hu], [0, zb - 0.02 * hu, 0.14 * hu, 0.11 * hu], { ch: 0.45 });
        else {
          const len = P.H * (st === 'pigtails' ? 0.07 : 0.14) * vol, w = (st === 'pigtails' ? 0.017 : 0.019) * P.H * Math.sqrt(vol);
          for (const sx of [1, -1]) tail(sx > 0 ? 'tailL' : 'tailR', len, w, sx * (P.hw + 0.03 * hu), P.earTop + 0.06 * hu, P.hcz - 0.3 * hu);
        }
      }
    } else if (st === 'perm') {
      const th = 0.1 * hu;
      cap(th, P.hairY - 0.04 * hu, { dz: -0.01 * hu, round: 0.85, ch: 0.45 });
      sides(0.07 * hu, P.earBot + 0.06 * hu, P.hairY, P.zf - 0.17 * hu, 0.2);
      back(0.08 * hu, P.napeY + 0.02 * hu, P.hairY, 1.04, 0.2);
      add('fringe', 'head', 'hair', P.hairY - 0.08 * hu, P.hairY + 0.05 * hu, [0, P.zf + 0.01 * hu, P.hw * 0.8, 0.03 * hu], [0, P.zf - 0.02 * hu, P.hw * 0.86, 0.04 * hu], { ch: 0.45, caps: 'none', cut: 'curly' });
    } else if (st === 'bald') {
      sides(0.014 * hu, P.earBot + 0.02 * hu, P.earTop + 0.12 * hu, P.zf - 0.25 * hu);
      back(0.016 * hu, P.napeY, P.earTop + 0.1 * hu);
    }
  }
  // springy hair accessories: ribbons on the tail ties, an ahoge, a barrette
  const H0 = spec.hair;
  if (!hat || hat === 'headband') {
    const bow = (bone, x, y, z, side, col) => {
      const r = 0.19 * hu, o = { ch: 0.4, col };
      const loops = side ? [[0, 0, 1], [0, 0, -1]] : [[1, 0, 0], [-1, 0, 0]];   // side bows face outward, back bows face back
      add('knot', bone, 'deco', y - r * 0.32, y + r * 0.32, [x, z, r * 0.3, r * 0.3], null, o);
      for (const [ax, , az] of loops) {
        const cx = x + ax * r * 0.95, cz = z + az * r * 0.95;
        add('bowLoop', bone, 'deco', y - r * 0.55, y + r * 0.6, [cx, cz, side ? r * 0.18 : r * 0.7, side ? r * 0.7 : r * 0.18], [cx + ax * r * 0.25, cz + az * r * 0.25, side ? r * 0.14 : r * 0.85, side ? r * 0.85 : r * 0.14],
          { ...o, rot: { p: [x, y, z], e: side ? [az * 0.45, 0, 0] : [0, 0, -ax * 0.45] } });
      }
      // two streamers on the ribbon bone, hanging under the knot
      const rb = bone === 'tailR' ? 'ribR' : 'ribL';
      J[rb] = [x, y - r * 0.2, z];
      for (const k of [1, -1]) {
        const ox = side ? 0 : k * r * 0.35, oz = side ? k * r * 0.35 : 0;
        add('streamer', rb, 'deco', y - r * 2.6, y - r * 0.2, [x + ox * 1.6, z + oz * 1.6, side ? r * 0.06 : r * 0.24, side ? r * 0.24 : r * 0.06], [x + ox, z + oz, side ? r * 0.05 : r * 0.17, side ? r * 0.17 : r * 0.05], { ...o, ch: 0.2, cut: 'vee' });
      }
    };
    if (H0.ribbon) {
      if (st === 'twintails' || st === 'pigtails') for (const sx of [1, -1]) bow(sx > 0 ? 'tailL' : 'tailR', sx * (P.hw + 0.06 * hu), P.earTop + 0.1 * hu, P.hcz - 0.3 * hu, true, H0.ribbon);
      else if (st === 'ponytail') bow('tailL', 0, P.eyeY + 0.14 * hu, P.hcz - P.hd - 0.1 * hu, false, H0.ribbon);
      else bow('head', P.hw * 0.75, P.hairY + 0.06 * hu, P.hcz + 0.02 * hu, true, H0.ribbon);
    }
    // anime side locks: flat chunky locks framing the face, down past the chin
    if (spec.anime && ['long', 'bob', 'twintails', 'pigtails', 'ponytail'].includes(st)) {
      const yb = st === 'bob' ? P.chin - 0.05 * hu : P.chin - 0.4 * hu;
      for (const sx of [1, -1]) {
        const x = sx * P.hw * 0.95, z = P.zf - 0.14 * hu;
        add('tail', 'head', 'hair', yb, P.earTop + 0.06 * hu, [x, z - 0.01 * hu, 0.03 * hu, 0.035 * hu], [x - sx * 0.01 * hu, z - 0.03 * hu, 0.07 * hu, 0.06 * hu], { ch: 0.3, caps: 'bot' });
      }
    }
    // animal ears in the hair colour (cat / fox)
    if (H0.ears) for (const sx of [1, -1]) {
      const x = sx * P.hw * 0.58, y0 = P.crown - 0.1 * hu, z = P.hcz - 0.04 * hu, tall = H0.ears === 'fox' ? 0.36 : 0.28;
      add('tail', 'head', 'hair', y0, P.crown + tall * hu, [x, z, 0.15 * hu, 0.07 * hu], [x + sx * 0.04 * hu, z - 0.01 * hu, 0.012 * hu, 0.01 * hu], { ch: 0.2, caps: 'top', rot: { p: [x, y0, z], e: [0, 0, -sx * 0.28] } });
    }
    if (H0.ahoge && st !== 'bald' && st !== 'buzz' && st !== 'mohawk') {
      // a springy strand sticking up from the crown, curling forward
      const y = P.crown - 0.02 * hu, z = P.hcz + 0.05 * hu;
      J.ahoge = [0, y, z];
      add('tail', 'ahoge', 'hair', y - 0.04 * hu, y + 0.2 * hu, [0.01 * hu, z, 0.045 * hu, 0.05 * hu], [0.02 * hu, z + 0.02 * hu, 0.018 * hu, 0.022 * hu], { ch: 0.3, rot: { p: [0, y, z], e: [-0.25, 0, -0.2] } });
      add('tail', 'ahoge', 'hair', y + 0.15 * hu, y + 0.32 * hu, [0.06 * hu, z + 0.02 * hu, 0.02 * hu, 0.024 * hu], [0.07 * hu, z + 0.04 * hu, 0.006 * hu, 0.008 * hu], { ch: 0.3, rot: { p: [0.05 * hu, y + 0.15 * hu, z], e: [0.6, 0, -0.5] } });
    }
    if (H0.clip) {
      // barrette: two crossed bars above the left temple
      const x = P.hw + 0.035 * hu, y = P.browY + 0.14 * hu, z = P.zf - 0.16 * hu;
      for (const a of [0.6, -0.6]) add('clip', 'head', 'deco', y - 0.06 * hu, y + 0.06 * hu, [x, z, 0.012 * hu, 0.018 * hu], null, { ch: 0.4, col: H0.clip, rot: { p: [x, y, z], e: [a, 0, 0] } });
    }
  }
  // a rounder skull top for bald heads (skin)
  if (st === 'bald' && (!hat || hat === 'headband')) add('scalp', 'head', 'head', P.hairY + 0.02 * hu, P.crown + 0.04 * hu, cs(P, P.hairY + 0.02 * hu, 0.003 * hu, 0.003 * hu), (() => { const c = cs(P, P.crown, 0, 0, -0.04 * hu); c[2] *= 0.62; c[3] *= 0.64; return c; })(), { ch: 0.45, caps: 'top' });
  if (!hat) return S;
  // --- hats (hair below the hat band still shows)
  if (hat !== 'headband') {
    const th = st === 'perm' ? 0.08 * hu : 0.03 * hu;
    const yHat = P.browY + (hat === 'schoolhat' || hat === 'bucket' || hat === 'sunhat' ? 0.15 : 0.2) * hu;
    if (st !== 'bald' && st !== 'none') {
      // only the hair below the hat band (kept inside the crown so it never pokes through)
      sides(0.026 * hu, P.earTop - 0.03 * hu, yHat + 0.015 * hu, P.zf - 0.2 * hu);
      back(0.03 * hu, P.napeY, yHat + 0.015 * hu);
    } else if (st === 'bald') {
      sides(0.014 * hu, P.earBot + 0.02 * hu, P.earTop + 0.1 * hu, P.zf - 0.25 * hu);
      back(0.016 * hu, P.napeY, P.earTop + 0.08 * hu);
    }
    const y0 = P.browY + (hat === 'schoolhat' || hat === 'bucket' || hat === 'sunhat' ? 0.15 : 0.2) * hu;
    if (hat === 'cap') {
      add('hatCrown', 'head', 'hat', y0, P.crown + 0.05 * hu, cs(P, y0, th + 0.012 * hu, th + 0.01 * hu), (() => { const c = cs(P, P.crown, th * 0.6, th * 0.6, -0.02 * hu); c[2] *= 0.82; c[3] *= 0.84; return enclose(P, c, 0.01 * hu, 0.42); })(), { ch: 0.42, caps: 'top' });
      add('visor', 'head', 'hat2', y0 - 0.005 * hu, y0 + 0.022 * hu, [0, P.zf + 0.2 * hu, P.hw * 0.78, 0.2 * hu], [0, P.zf + 0.2 * hu, P.hw * 0.78, 0.2 * hu], { ch: 0.5, rot: { p: [0, y0, P.zf], e: [0.18, 0, 0] } });
    } else if (hat === 'flatcap') {
      add('hatCrown', 'head', 'hat', y0, P.crown + 0.01 * hu, cs(P, y0, th + 0.015 * hu, th + 0.02 * hu), (() => { const c = cs(P, P.crown, th, th, 0.06 * hu); c[2] *= 0.95; c[3] *= 0.85; return enclose(P, c, 0.01 * hu, 0.4); })(), { ch: 0.4, caps: 'top' });
      add('visor', 'head', 'hat2', y0 - 0.01 * hu, y0 + 0.02 * hu, [0, P.zf + 0.1 * hu, P.hw * 0.86, 0.1 * hu], null, { ch: 0.5, rot: { p: [0, y0, P.zf], e: [0.22, 0, 0] } });
    } else if (hat === 'schoolhat' || hat === 'bucket' || hat === 'sunhat') {
      const brim = hat === 'sunhat' ? 0.36 * hu : hat === 'schoolhat' ? 0.24 * hu : 0.2 * hu;
      add('hatCrown', 'head', 'hat', y0, P.crown + 0.07 * hu, cs(P, y0, th + 0.02 * hu, th + 0.02 * hu, -0.01 * hu), (() => { const c = cs(P, P.crown, th, th, -0.02 * hu); c[2] *= 0.86; c[3] *= 0.86; return enclose(P, c, 0.01 * hu, 0.5); })(), { ch: 0.5, caps: 'top' });
      const c = cs(P, y0, th + brim, th + brim, -0.01 * hu);
      add('brim', 'head', 'hat2', y0 - 0.025 * hu, y0 + 0.004 * hu, [c[0], c[1], c[2] * 1.02, c[3] * 1.02], c, { ch: 0.42, dens: 0.8 });
    } else if (hat === 'hardhat') {
      add('hatCrown', 'head', 'hat', y0, P.crown + 0.1 * hu, cs(P, y0, th + 0.035 * hu, th + 0.04 * hu), (() => { const c = cs(P, P.crown, th, th, -0.01 * hu); c[2] *= 0.78; c[3] *= 0.8; return enclose(P, c, 0.01 * hu, 0.5); })(), { ch: 0.5, caps: 'top' });
      const c = cs(P, y0, th + 0.07 * hu, th + 0.09 * hu, 0.03 * hu);
      add('brim', 'head', 'hat2', y0 - 0.02 * hu, y0 + 0.008 * hu, c, c, { ch: 0.45, dens: 0.8 });
    }
  } else {
    // tenugui headband just above the brows
    add('headband', 'head', 'hat', P.browY + 0.1 * hu, P.browY + 0.2 * hu, cs(P, P.browY + 0.1 * hu, 0.012 * hu, 0.012 * hu), cs(P, P.browY + 0.2 * hu, 0.012 * hu, 0.012 * hu), { ch: 0.32, caps: 'none' });
  }
  return S;
}
