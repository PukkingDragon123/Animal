// Seeded deterministic RNG (mulberry32) — logic stays reproducible from a seed.
// Visual-only randomness uses a separate stream so it never desyncs the sim.

export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,                                   // [0,1)
    range: (lo, hi) => lo + (hi - lo) * next(),
    int: (lo, hi) => Math.floor(lo + (hi - lo + 1) * next()),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    sign: () => (next() < 0.5 ? -1 : 1),
    seed: a,
  };
}

// A non-deterministic-ish seed for a fresh run (time + counter).
let _c = 0;
export function freshSeed() {
  _c = (_c + 1) | 0;
  return (Date.now() ^ (_c * 0x9e3779b1)) >>> 0;
}
