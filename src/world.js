// Builds the BOUNDED, handcrafted environment for one level: a round ground
// disc sized to the arena, a gradient sky dome + sun/moon, ambient scenery
// scattered within the bounds (seeded, NOT streamed), and the level's signature
// landmark props placed at their hand-authored spots. Static — render.js no
// longer follows or wraps it. Own seeded RNG stream.
import * as THREE from '../vendor/three.module.js';
import { CONFIG as C } from './config.js';
import { makeRng } from './rng.js';
import { buildPropGeometry, propMaterial } from './props.js';

export function buildEnvironment(biome, seed, level) {
  const rng = makeRng((seed ^ 0x9e37) >>> 0);
  const group = new THREE.Group();
  const R = (level && level.radius) || C.world.radius;     // arena radius
  const GR = R + 16;                                        // ground disc extends past the soft wall

  // --- round ground disc with a soft radial gradient (darkens at the rim) ---
  const groundGeo = new THREE.CircleGeometry(GR, 56);
  groundGeo.rotateX(-Math.PI / 2);
  {
    const pos = groundGeo.attributes.position, col = new Float32Array(pos.count * 3);
    const cc = new THREE.Color(biome.ground), ce = new THREE.Color(biome.groundEdge), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const d = Math.min(1, Math.hypot(pos.getX(i), pos.getZ(i)) / GR);
      tmp.copy(cc).lerp(ce, d * d);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
  ground.receiveShadow = true;
  group.add(ground); group.userData.ground = ground;

  // --- sky dome (vertical gradient, unlit) + sun/moon disc ---
  const skyGeo = new THREE.SphereGeometry(280, 16, 12);
  {
    const pos = skyGeo.attributes.position, col = new Float32Array(pos.count * 3);
    const top = new THREE.Color(biome.skyTop), bot = new THREE.Color(biome.skyBottom), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = Math.min(1, Math.max(0, (pos.getY(i) / 280) * 0.5 + 0.5));
      tmp.copy(bot).lerp(top, t);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    skyGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
  group.add(sky); group.userData.sky = sky;

  const sun = new THREE.Mesh(new THREE.CircleGeometry(14, 20), new THREE.MeshBasicMaterial({ color: 0xfff4d6, fog: false, transparent: true, opacity: 0.9 }));
  group.add(sun); group.userData.sunMesh = sun;

  // --- ambient scenery: scattered within the arena (bounded, static) ---
  for (const def of biome.props) {
    const count = Math.min(def.count, C.caps.groundProps);
    const inst = new THREE.InstancedMesh(buildPropGeometry(def.build), propMaterial, count);
    inst.castShadow = true; inst.receiveShadow = false;
    inst.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    const d = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = rng.next() * 6.283, rad = Math.sqrt(rng.range(0.02, 1)) * (R - 1);
      const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
      const ry = rng.next() * 6.283, s = rng.range(def.scale[0], def.scale[1]), sy = s * rng.range(0.9, 1.15);
      d.position.set(x, 0, z); d.rotation.set(0, ry, 0); d.scale.set(s, sy, s); d.updateMatrix();
      inst.setMatrixAt(i, d.matrix);
      const v = rng.range(0.86, 1.12); inst.instanceColor.setXYZ(i, v, v, v);
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.frustumCulled = false;
    group.add(inst);
  }

  // --- hand-placed landmark props from the level ---
  if (level && level.props) {
    for (const p of level.props) {
      const m = new THREE.Mesh(buildPropGeometry(p.build), propMaterial);
      m.castShadow = true; m.position.set(p.x, 0, p.z);
      m.rotation.y = (p.x * 1.3 + p.z * 0.7);
      const s = p.s || 1; m.scale.set(s, s * 1.04, s);
      group.add(m);
    }
  }

  group.userData.dispose = () => {
    group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material !== propMaterial) { Array.isArray(o.material) ? o.material.forEach(m => m.dispose()) : o.material.dispose(); }
    });
  };
  return group;
}
