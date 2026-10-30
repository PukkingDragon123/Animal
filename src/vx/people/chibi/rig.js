// The blocky chibi people's skeleton and proportions: a big cube head (about 2.8 heads tall overall), a short
// boxy body, short arms and legs, chunky shoes. Bones rest unrotated (a straight stance, arms nearly at the
// sides), so each body part is a rigid box skinned 100% to one bone. +x is the character's left, +z forward.

export const BONES = ['root', 'hips', 'spine', 'chest', 'neck', 'head', 'uaL', 'faL', 'hL', 'uaR', 'faR', 'hR', 'thL', 'shL', 'ftL', 'thR', 'shR', 'ftR', 'skirt', 'tailL', 'tailR', 'ahoge'];
export const PARENT = { hips: 'root', spine: 'hips', chest: 'spine', neck: 'chest', head: 'neck', uaL: 'chest', faL: 'uaL', hL: 'faL', uaR: 'chest', faR: 'uaR', hR: 'faR', thL: 'hips', shL: 'thL', ftL: 'shL', thR: 'hips', shR: 'thR', ftR: 'shR', skirt: 'hips', tailL: 'head', tailR: 'head', ahoge: 'head' };
export const BI = Object.fromEntries(BONES.map((b, i) => [b, i]));

export function dims(spec) {
  const f = spec.sex === 'f', kid = spec.age === 'kid', old = spec.age === 'elder', adult = spec.age === 'adult' || old, b = spec.build || 1;
  const tall = Math.max(0.85, Math.min(1.2, spec.H ? spec.H / (kid ? 1.25 : f ? 1.58 : 1.68) : 1));
  const hs = kid ? 0.42 : old ? 0.44 : 0.46;                                     // the head cube's height
  const legL = (kid ? 0.28 : old ? 0.38 : adult ? (f ? 0.44 : 0.48) : (f ? 0.38 : 0.4)) * tall;
  const torso = (kid ? 0.16 : adult || old ? (f ? 0.21 : 0.24) : (f ? 0.19 : 0.21)) * (0.9 + 0.1 * tall);
  const pelvis = kid ? 0.1 : 0.12;
  const D = { f, kid, old, adult, b, hu: hs, tall };
  D.ankle = 0.075; D.knee = D.ankle + legL / 2; D.hipJ = D.ankle + legL; D.crotch = D.hipJ - 0.03;
  D.waist = D.hipJ + pelvis; D.shY = D.waist + torso; D.neckBase = D.shY; D.chin = D.shY + 0.025; D.chest = D.waist + torso * 0.5;
  D.H = D.chin + hs;
  D.torso = torso; D.pelvis = pelvis; D.legL = legL;
  const bw = (kid ? 0.27 : f ? 0.29 : 0.33) * (0.86 + 0.14 * b), bd = (kid ? 0.17 : 0.18) * (0.88 + 0.12 * b) + (spec.belly || 0) * 0.07;
  D.bw = bw; D.bd = bd; D.pw = bw * (f ? 1.02 : 0.96); D.pd = bd * 0.96;
  D.aw = (kid ? 0.095 : f ? 0.095 : 0.11) * (0.9 + 0.1 * b); D.lw = (kid ? 0.11 : f ? 0.115 : 0.125) * (0.92 + 0.08 * b);
  D.shX = bw / 2 + D.aw / 2 + 0.004; D.hipX = D.lw / 2 + 0.012;
  D.uarm = (kid ? 0.12 : adult ? 0.17 : 0.15) * (0.92 + 0.08 * tall); D.farm = (kid ? 0.11 : adult ? 0.15 : 0.14) * (0.92 + 0.08 * tall); D.hand = 0.08;
  D.hw = hs * 0.55; D.hd = hs * 0.5; D.hcz = 0;                                    // half sizes of the head cube
  // what the animator reads
  D.r = { thigh: D.lw / 2 }; D.td = { hip: bd / 2 }; D.tw = { hip: D.pw / 2 };
  const a = 0.06;
  D.armDir = [Math.sin(a), -Math.cos(a), 0];
  return D;
}

export function joints(D, spec) {
  const J = {}, ad = D.armDir, hair = (spec.hair || {}).style, hs = D.hu;
  J.root = [0, 0, 0]; J.hips = [0, D.hipJ + D.pelvis * 0.3, 0]; J.spine = [0, D.waist, 0]; J.chest = [0, D.waist + D.torso * 0.4, 0];
  J.neck = [0, D.shY, 0]; J.head = [0, D.chin, 0];
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) {
    const sh = [s * D.shX, D.shY - 0.035, 0], el = [sh[0] + s * ad[0] * D.uarm, sh[1] + ad[1] * D.uarm, 0], wr = [el[0] + s * ad[0] * D.farm, el[1] + ad[1] * D.farm, 0];
    J['ua' + k] = sh; J['fa' + k] = el; J['h' + k] = wr;
    J['th' + k] = [s * D.hipX, D.hipJ, 0]; J['sh' + k] = [s * D.hipX, D.knee, 0]; J['ft' + k] = [s * D.hipX, D.ankle, 0];
  }
  J.skirt = [0, D.waist - 0.01, 0];
  if (hair === 'ponytail') { J.tailL = [0, D.chin + hs * 0.72, -(D.hd + 0.05)]; J.tailR = J.tailL.slice(); }
  else if (hair === 'twintails' || hair === 'pigtails') { J.tailL = [D.hw + 0.05, D.chin + hs * 0.72, -0.05]; J.tailR = [-(D.hw + 0.05), D.chin + hs * 0.72, -0.05]; }
  else { J.tailL = [0, D.chin + hs * 0.66, -(D.hd + 0.02)]; J.tailR = J.tailL.slice(); }   // long hair hangs from here
  J.ahoge = [0, D.H + 0.04, D.hd * 0.25];
  return J;
}
