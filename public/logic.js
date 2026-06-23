// Platform rules module. This is a solo, client-side real-time game — all
// simulation runs in the browser (public/src/sim.js). The hosting platform
// still requires a code module at the archive root, so this is the canonical
// no-op stub for solo games (no server authority, no timers, no imports).
export const meta = { game: 'why-it-sucks-to-be-a', minPlayers: 1, maxPlayers: 1 };
export function setup() { return {}; }
export function validateAction() { return { ok: true }; }
export function applyAction(state) { return state; }
export function isGameOver() { return { over: false }; }
export function viewFor(state) { return state; }
