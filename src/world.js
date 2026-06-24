// Builds the static biome environment: gradient ground disc, gradient sky dome,
// frozen-lake patches, and instanced props (one draw call per type). Uses its
// own seeded RNG stream so visuals are reproducible but independent of the sim.
import * as THREE from '../vendor/three.module.js';
import { CONFIG as C } from './config.js';
import { makeRng } from './rng.js';
import { buildPropGeometry, propMaterial } from './props.js';

export function buildEnvironment(biome, seed) {
  const rng = makeRng((seed ^ 0x9e37) >>> 0);
  const group = new THREE.Group();
  const R = C.world.radius + 6;

  // --- ground disc with center→edge gradient (catches light) ---
  const groundGeo = new THREE.CircleGeometry(R, 48);
  groundGeo.rotateX(-Math.PI / 2);
  {
    const pos = groundGeo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const cc = new THREE.Color(biome.ground), ce = new THREE.Color(biome.groundEdge), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const d = Math.min(1, Math.hypot(pos.getX(i), pos.getZ(i)) / R);
      tmp.copy(cc).lerp(ce, d * d);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
  ground.receiveShadow = true;
  group.add(ground);

  // --- frozen lakes / water patches ---
  if (biome.cold || biome.water) {
    const patchMat = new THREE.MeshStandardMaterial({ color: biome.waterColor || 0x4f7fb0, roughness: 0.3, metalness: 0.0, transparent: true, opacity: biome.underwater ? 0.0 : 0.7 });
    if (!biome.underwater) {
      const n = biome.cold ? 4 : 0;
      for (let i = 0; i < n; i++) {
        const a = rng.next() * 6.283, r = rng.range(6, R * 0.7);
        const patch = new THREE.Mesh(new THREE.CircleGeometry(rng.range(3, 6), 18), patchMat);
        patch.rotation.x = -Math.PI / 2; patch.position.set(Math.cos(a) * r, 0.02, Math.sin(a) * r);
        group.add(patch);
      }
    }
  }

  // --- sky dome with vertical gradient (unlit, ignores fog) ---
  const skyGeo = new THREE.SphereGeometry(260, 16, 12);
  {
    const pos = skyGeo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const top = new THREE.Color(biome.skyTop), bot = new THREE.Color(biome.skyBottom), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = Math.min(1, Math.max(0, (pos.getY(i) / 260) * 0.5 + 0.5));
      tmp.copy(bot).lerp(top, t);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    skyGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
  group.add(sky); group.userData.sky = sky;

  // sun/moon disc — repositioned + tinted each frame by the day/night cycle
  const sun = new THREE.Mesh(new THREE.CircleGeometry(14, 20), new THREE.MeshBasicMaterial({ color: 0xfff4d6, fog: false, transparent: true, opacity: 0.9 }));
  sun.position.set(-60, 80, -120); sun.lookAt(0, 0, 0);
  group.add(sun); group.userData.sunMesh = sun;

  // --- instanced props ---
  const propMeshes = [];
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  for (const def of biome.props) {
    const count = Math.min(def.count, C.caps.groundProps);
    const geo = buildPropGeometry(def.build);
    const inst = new THREE.InstancedMesh(geo, propMaterial, count);
    inst.castShadow = true; inst.receiveShadow = false;
    const icol = new Float32Array(count * 3);
    inst.instanceColor = new THREE.InstancedBufferAttribute(icol, 3);
    for (let i = 0; i < count; i++) {
      const a = rng.next() * 6.283;
      const r = Math.sqrt(rng.range(16, (R - 2) * (R - 2)));   // ring, keep center clearer
      const s = rng.range(def.scale[0], def.scale[1]);
      dummy.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      dummy.rotation.set(0, rng.next() * 6.283, 0);
      dummy.scale.set(s, s * rng.range(0.9, 1.15), s);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      const v = rng.range(0.88, 1.12);
      tint.setRGB(v, v, v);
      inst.instanceColor.setXYZ(i, tint.r, tint.g, tint.b);
    }
    inst.instanceMatrix.needsUpdate = true;
    group.add(inst);
    propMeshes.push(inst);
  }

  group.userData.dispose = () => {
    group.traverse((o) => {
      if (o.geometry && o.geometry !== groundGeo) { /* dispose below */ }
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material !== propMaterial) {
        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
        else o.material.dispose();
      }
    });
  };
  return group;
}
