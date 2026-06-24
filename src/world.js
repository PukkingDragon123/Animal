// Builds the biome environment for an INFINITE world: a large ground plane that
// follows the player, a gradient sky dome + sun/moon (repositioned each frame by
// render.js), and instanced props scattered in a tile that render.js wraps
// toroidally around the player so scenery is endless. Own seeded RNG stream.
import * as THREE from '../vendor/three.module.js';
import { CONFIG as C } from './config.js';
import { makeRng } from './rng.js';
import { buildPropGeometry, propMaterial } from './props.js';

export function buildEnvironment(biome, seed) {
  const rng = makeRng((seed ^ 0x9e37) >>> 0);
  const group = new THREE.Group();
  const T = C.world.tile;
  const SIZE = 2 * (C.world.despawnR + T);          // covers the whole visible area

  // --- big ground plane (follows the player) with a soft radial gradient ---
  const groundGeo = new THREE.PlaneGeometry(SIZE, SIZE, 24, 24);
  groundGeo.rotateX(-Math.PI / 2);
  {
    const pos = groundGeo.attributes.position, col = new Float32Array(pos.count * 3);
    const cc = new THREE.Color(biome.ground), ce = new THREE.Color(biome.groundEdge), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const d = Math.min(1, Math.hypot(pos.getX(i), pos.getZ(i)) / (SIZE * 0.5));
      tmp.copy(cc).lerp(ce, d * d);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
  ground.receiveShadow = true;
  group.add(ground); group.userData.ground = ground;

  // --- sky dome (vertical gradient, unlit) ---
  const skyGeo = new THREE.SphereGeometry(260, 16, 12);
  {
    const pos = skyGeo.attributes.position, col = new Float32Array(pos.count * 3);
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

  const sun = new THREE.Mesh(new THREE.CircleGeometry(14, 20), new THREE.MeshBasicMaterial({ color: 0xfff4d6, fog: false, transparent: true, opacity: 0.9 }));
  group.add(sun); group.userData.sunMesh = sun;

  // --- instanced props scattered in a T×T tile (render wraps them around the player) ---
  for (const def of biome.props) {
    const count = Math.min(def.count, C.caps.groundProps);
    const inst = new THREE.InstancedMesh(buildPropGeometry(def.build), propMaterial, count);
    inst.castShadow = true; inst.receiveShadow = false;
    inst.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    const bases = [];
    const d = new THREE.Object3D(), tint = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const x = rng.range(-T / 2, T / 2), z = rng.range(-T / 2, T / 2);
      const ry = rng.next() * 6.283, s = rng.range(def.scale[0], def.scale[1]), sy = s * rng.range(0.9, 1.15);
      bases.push({ x, z, ry, s, sy });
      d.position.set(x, 0, z); d.rotation.set(0, ry, 0); d.scale.set(s, sy, s); d.updateMatrix();
      inst.setMatrixAt(i, d.matrix);
      const v = rng.range(0.88, 1.12); tint.setRGB(v, v, v); inst.instanceColor.setXYZ(i, v, v, v);
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.frustumCulled = false;
    inst.userData.bases = bases; inst.userData.tile = T; inst.userData.isProp = true;
    group.add(inst);
  }

  group.userData.dispose = () => {
    group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material !== propMaterial) { Array.isArray(o.material) ? o.material.forEach(m => m.dispose()) : o.material.dispose(); }
    });
  };
  return group;
}
