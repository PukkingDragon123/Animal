// Build-layer smoke test: exercises all procedural geometry/mesh/animation code
// without a WebGL context (geometries + meshes don't need GL; only the renderer
// does). Catches Three.js API misuse, NaNs, and missing builders.
import * as THREE from '../vendor/three.module.js';
import { buildCreature, buildInteractable } from '../src/meshes.js';
import { buildFoodGeometry, buildPropGeometry } from '../src/props.js';
import { buildEnvironment } from '../src/world.js';
import { animateCreature } from '../src/animator.js';
import { FX } from '../src/fx.js';
import { BIOMES } from '../src/biomes.js';
import { SPECIES, FOODS } from '../src/species.js';

let pass = 0, fail = 0, totalTris = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error('  FAIL:', n); } };

function triCount(obj) {
  let t = 0;
  obj.traverse(o => { if (o.isMesh && o.geometry) { const g = o.geometry; const c = (o.isInstancedMesh ? o.count : 1); t += ((g.index ? g.index.count : g.attributes.position.count) / 3) * c; } });
  return Math.round(t);
}
const finiteVec = (v) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);

console.log('build tests');

// 1) every creature builds + animates without NaN
const CREATURES = ['rabbit', 'fox', 'bee', 'penguin', 'turtle', 'salmon', 'shark', 'bird', 'seal', 'bear', 'fish', 'squirrel', 'butterfly', 'frog', 'meerkat', 'mayfly', 'angler'];
for (const key of CREATURES) {
  let g;
  try { g = buildCreature(key, { body: 0xc08040, belly: 0xfff0d0, accent: 0x884422, eye: 0x111111 }); }
  catch (e) { console.error('  THROW build', key, e.message); fail++; continue; }
  ok(`${key}: is Group`, g && g.isGroup);
  ok(`${key}: has parts`, !!g.userData.parts && !!g.userData.parts.gait);
  ok(`${key}: has meshes`, g.children.length > 0);
  const tris = triCount(g); totalTris += tris;
  ok(`${key}: reasonable tris (${tris})`, tris > 30 && tris < 1500);
  // animate idle + moving across phases
  try {
    g.userData.baseY = key === 'shark' ? 0.7 : 0;
    for (let i = 0; i < 200; i++) {
      const moving = i % 40 < 25;
      animateCreature(g, 1 / 60, i / 60, { dt: 1 / 60, time: i / 60, speed: moving ? 6 : 0, moving, diving: i % 80 < 10 });
    }
    ok(`${key}: finite after animate`, finiteVec(g.position) && Number.isFinite(g.rotation.x) && Number.isFinite(g.rotation.y));
  } catch (e) { console.error('  THROW animate', key, e.message); fail++; }
}

// 2) every food geometry from the species table
for (const f of Object.values(FOODS)) {
  let geo; try { geo = buildFoodGeometry(f.build, f.color); } catch (e) { console.error('  THROW food', f.build, e.message); fail++; continue; }
  const c = geo?.attributes?.position?.count || 0;
  ok(`food ${f.build}: has verts`, c > 0);
  ok(`food ${f.build}: has color attr`, !!geo.attributes.color && geo.attributes.color.count === c);
}

// 3) every prop geometry referenced by any biome
const propKeys = new Set();
for (const b of Object.values(BIOMES)) b.props.forEach(p => propKeys.add(p.build));
for (const key of propKeys) {
  let geo; try { geo = buildPropGeometry(key); } catch (e) { console.error('  THROW prop', key, e.message); fail++; continue; }
  ok(`prop ${key}: has verts`, geo?.attributes?.position?.count > 0);
  ok(`prop ${key}: has color attr`, !!geo.attributes.color);
}

// 4) every biome environment builds + disposes
for (const id of Object.keys(BIOMES)) {
  let env; try { env = buildEnvironment(BIOMES[id], 12345); } catch (e) { console.error('  THROW env', id, e.message); fail++; continue; }
  ok(`biome ${id}: group with children`, env.isGroup && env.children.length >= 3);
  const insts = env.children.filter(o => o.isInstancedMesh);
  ok(`biome ${id}: has instanced props`, insts.length >= 1);
  try { env.userData.dispose(); pass++; } catch (e) { console.error('  THROW dispose', id, e.message); fail++; }
}

// 5) species reference valid builds + diet targets
for (const sp of Object.values(SPECIES)) {
  ok(`species ${sp.id}: build exists`, CREATURES.includes(sp.build));
  if (sp.diet.kind === 'graze') ok(`species ${sp.id}: food exists`, !!FOODS[sp.diet.food]);
  else ok(`species ${sp.id}: prey build exists`, CREATURES.includes(sp.diet.preyBuild));
  if (sp.predatorBuild) ok(`species ${sp.id}: predator build exists`, CREATURES.includes(sp.predatorBuild));
}

// 6) FX pool: emit + update without GL
{
  const scene = new THREE.Scene();
  const fx = new FX(scene, 60);
  ok('fx: instanced mesh', fx.mesh.isInstancedMesh && fx.mesh.count === 60);
  fx.burst(1, 1, 1, 0x44ff88, 12); fx.sparkleRing(0, 0, 0, 0xff88cc, 12);
  for (let i = 0; i < 120; i++) fx.update(1 / 60);
  fx.reset();
  ok('fx: survived update + reset', true);
}

// 7) interactive object meshes + twig pickup geometry
for (const t of ['fruitTree', 'mushroom', 'hive', 'burrow', 'mud']) {
  let g; try { g = buildInteractable(t); } catch (e) { console.error('  THROW interactable', t, e.message); fail++; continue; }
  ok(`interactable ${t}: group with meshes`, g && g.isGroup && g.children.length > 0);
}
{
  const tw = buildFoodGeometry('twig', 0x8a6038);
  ok('twig geometry: verts + color', tw.attributes.position.count > 0 && !!tw.attributes.color);
}

console.log(`\nApprox tris for all 11 creatures: ${totalTris}`);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
