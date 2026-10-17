// Friends & bond ranks (state helpers). Data: src/data/social.js.
//   s.social = { friends: { id: { pts, met } }, chats: { id: [{ from, text, day, hour, read }] } }
import { FRIENDS, RANK_PTS, MAX_RANK, CHATTER } from '../data/social.js';
import { checkReq } from './state.js';

export function ensureSocial(s) {
  if (!s.social) s.social = { friends: {}, chats: {} };
  for (const id of Object.keys(FRIENDS)) {
    if (!s.social.friends[id]) s.social.friends[id] = { pts: 0, met: false, hangouts: [] };
    if (!s.social.chats[id]) s.social.chats[id] = [];
    const f = s.social.friends[id];
    if (!f.met && checkReq(s, FRIENDS[id].met)) f.met = true;
  }
  return s.social;
}
export function rankOfPts(pts) { let r = 1; for (let i = 0; i < RANK_PTS.length; i++) if (pts >= RANK_PTS[i]) r = i + 1; return Math.min(MAX_RANK, r); }

// [{ id, name, role, color, rank, pts, next, met, perks: [{ rank, text, on }], unread, last }]
export function friendList(s) {
  ensureSocial(s);
  return Object.entries(FRIENDS).map(([id, F]) => {
    const f = s.social.friends[id], rank = rankOfPts(f.pts);
    const chat = s.social.chats[id];
    return {
      id, name: F.name, role: F.role, color: F.color, partner: F.partner, rank, pts: f.pts, met: f.met,
      next: rank < MAX_RANK ? RANK_PTS[rank] : null, prev: RANK_PTS[rank - 1],
      perks: Object.entries(F.perks).map(([r, text]) => ({ rank: +r, text, on: rank >= +r })),
      unread: chat.filter((m) => !m.read && m.from === id).length, last: chat[chat.length - 1] || null,
      hangouts: F.hangouts.map((h) => ({ id: h.id, title: h.title, place: h.place, done: f.hangouts.includes(h.id) })),
      quest: F.quest,
    };
  });
}
export const hasPerk = (s, id, rank) => { ensureSocial(s); return rankOfPts(s.social.friends[id].pts) >= rank; };

export function addBond(s, id, n) {
  ensureSocial(s);
  const f = s.social.friends[id]; if (!f) return null;
  const before = rankOfPts(f.pts);
  f.pts = Math.max(0, f.pts + n);
  const after = rankOfPts(f.pts);
  return { id, rank: after, rankUp: after > before, perk: after > before ? FRIENDS[id].perks[after] || null : null };
}
export function meet(s, id) { ensureSocial(s); s.social.friends[id].met = true; }

export function chat(s, id) { ensureSocial(s); return s.social.chats[id] || []; }
export function pushMessage(s, id, text, from = id) {
  ensureSocial(s);
  const m = { from, text, day: s.time.day, hour: s.time.hour, read: from !== id };
  s.social.chats[id].push(m);
  if (s.social.chats[id].length > 60) s.social.chats[id].shift();
  return m;
}
export function markRead(s, id) { ensureSocial(s); for (const m of s.social.chats[id]) m.read = true; }
// a friend texts you now and then (call when time passes)
export function maybeChatter(s, rng = Math.random) {
  ensureSocial(s);
  const met = Object.keys(FRIENDS).filter((id) => s.social.friends[id].met);
  if (!met.length || rng() > 0.35) return null;
  const id = met[Math.floor(rng() * met.length)];
  const lines = CHATTER[id] || [];
  const text = lines[Math.floor(rng() * lines.length)];
  return text ? { id, msg: pushMessage(s, id, text) } : null;
}

// Hangout: returns the scene descriptor { friend, hangout } the story director plays,
// then call finishHangout(s, id, hangoutId, chosenOption) → bond result.
export function hangout(s, id, hid) {
  const F = FRIENDS[id]; if (!F) return null;
  const h = F.hangouts.find((x) => x.id === hid) || F.hangouts[0];
  return { friend: id, name: F.name, hangout: h };
}
export function finishHangout(s, id, hid, option) {
  ensureSocial(s);
  const f = s.social.friends[id];
  const first = !f.hangouts.includes(hid);
  if (first) f.hangouts.push(hid);
  const likes = FRIENDS[id].likes;
  const n = 8 + (first ? 4 : 0) + (option && (option.good || likes.includes(option.tag)) ? 6 : 0);
  return addBond(s, id, n);
}
