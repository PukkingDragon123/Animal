// Minimal test harness (no dependencies).
let pass = 0, fail = 0;
export function ok(name, cond, extra) { if (cond) pass++; else { fail++; console.error('  FAIL:', name, extra !== undefined ? JSON.stringify(extra) : ''); } }
export function section(name) { console.log('— ' + name); }
export function done(label) { console.log(`${label}: ${pass} passed, ${fail} failed`); if (fail) process.exitCode = 1; }
