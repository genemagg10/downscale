import * as THREE from 'three/webgpu';
import RAPIER from '@dimforge/rapier3d-compat';
import { ZOOM_FOV } from '../constants';
import { createKeyMesh } from '../geom';
import { addBlob, addBox, addCylinder, addPlayer, mat } from '../stage';
import { oxidationTexture } from '../textures';
import type { KeyPickup, ScaleWorld } from '../world';

const VEIL = '#143e48';

/**
 * World 3 — the scratch, from the inside. Oxidized metal as a landscape.
 * The golden Key waits in a clearing. It is traveler-sized, not microscopic.
 *
 * STORY HOOK (not this build): this is the first of seven Keys. Later keys
 * open Anchors. The choice to follow Future-You does not exist yet.
 */
export function createMicro(): ScaleWorld {
  const scene = new THREE.Scene();
  const fogColor = new THREE.Color('#0c1e26');
  const fog = new THREE.FogExp2(fogColor, 0.03);
  scene.fog = fog;
  scene.background = new THREE.Color('#07141c');

  const physics = new RAPIER.World({ x: 0, y: -22, z: 0 });

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(42, 48),
    mat({
      color: '#ffffff',
      map: oxidationTexture(),
      roughness: 0.78,
      metalness: 0.35,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const floorBody = physics.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.12, 0));
  physics.createCollider(RAPIER.ColliderDesc.cuboid(40, 0.12, 40), floorBody);

  const entryDisc = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 36),
    mat({
      color: VEIL,
      emissive: '#0e4c56',
      emissiveIntensity: 0.7,
      roughness: 0.32,
      metalness: 0.62,
    }),
  );
  entryDisc.rotation.x = -Math.PI / 2;
  entryDisc.position.set(0, 0.04, 16);
  scene.add(entryDisc);

  // The scratch, seen from underneath, as a slit of sky.
  const slit = new THREE.Mesh(
    new THREE.BoxGeometry(22, 0.18, 0.55),
    mat({ color: '#d7fff8', emissive: '#b6fff0', emissiveIntensity: 1.6, roughness: 0.2 }),
  );
  slit.position.set(0, 16, -2);
  scene.add(slit);

  const hemi = new THREE.HemisphereLight('#245868', '#140816', 0.55);
  scene.add(hemi);
  const fill = new THREE.PointLight('#7fd0c8', 8, 22, 2);
  fill.position.set(0, 3.2, 8);
  scene.add(fill);
  const slitLight = new THREE.DirectionalLight('#d6fff8', 0.95);
  slitLight.position.set(0, 18, -2);
  slitLight.target.position.set(0, 0, -4);
  scene.add(slitLight, slitLight.target);

  const colors = ['#2ad4c4', '#7a5cff', '#ff5d9a', '#f0c14a', '#3ec1ff', '#1d6e66'];
  const rand = mulberry32(11);
  for (let i = 0; i < 78; i++) {
    const x = (rand() - 0.5) * 52;
    const z = (rand() - 0.5) * 52;
    const shrine = Math.hypot(x, z + 8) < 2.5;
    const corridor = Math.abs(x) < 2.6 && z < 20 && z > -7.4;
    if (shrine || corridor) continue;
    const height = 0.6 + rand() * (rand() > 0.82 ? 6.5 : 2.8);
    const radius = 0.18 + rand() * 0.55;
    const color = colors[Math.floor(rand() * colors.length)] ?? '#2ad4c4';
    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(radius, height, 5),
      mat({
        color,
        emissive: color,
        emissiveIntensity: 0.18 + rand() * 0.25,
        roughness: 0.22,
        metalness: 0.55,
      }),
    );
    crystal.position.set(x, height / 2, z);
    crystal.rotation.y = rand() * Math.PI;
    crystal.castShadow = false;
    crystal.receiveShadow = true;
    scene.add(crystal);
    if (height > 1.6) {
      const body = physics.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(x, height * 0.28, z),
      );
      physics.createCollider(RAPIER.ColliderDesc.cylinder(height * 0.28, radius * 0.85), body);
    }
  }

  // Low dunes outside the corridor.
  const dunes: Array<[number, number, number, number]> = [
    [10, 4, 7, 1.3],
    [-12, -1, 8, 1.5],
    [8, -18, 9, 1.8],
    [-9, 12, 6, 1.1],
  ];
  for (const [x, z, radius, height] of dunes) {
    const dune = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 18, 12),
      mat({ color: '#1e4d46', roughness: 0.7, metalness: 0.4 }),
    );
    dune.scale.y = height / radius;
    dune.position.set(x, height * 0.15, z);
    dune.receiveShadow = true;
    scene.add(dune);
  }

  // Thin-film puddles.
  for (const [x, z, radius, color] of [
    [1.6, 6, 1.1, '#ff5d9a'],
    [-1.8, 1, 0.8, '#f0c14a'],
    [2.1, -3, 0.9, '#7a5cff'],
  ] as const) {
    const puddle = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 20),
      mat({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.8,
        transparent: true,
        opacity: 0.55,
      }),
    );
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(x, 0.03, z);
    scene.add(puddle);
  }

  addBox(scene, physics, 1.2, 4, 70, -32, 2, 0, { color: '#0c1e26', collider: true, cast: false });
  addBox(scene, physics, 1.2, 4, 70, 32, 2, 0, { color: '#0c1e26', collider: true, cast: false });
  addBox(scene, physics, 70, 4, 1.2, 0, 2, -32, { color: '#0c1e26', collider: true, cast: false });
  addBox(scene, physics, 70, 4, 1.2, 0, 2, 32, { color: '#0c1e26', collider: true, cast: false });

  // Shrine
  const shrineColors = ['#2ad4c4', '#7a5cff', '#ff5d9a', '#f0c14a'];
  const shrineSpots: Array<[number, number, number]> = [
    [-2.7, -8, 3.4],
    [2.7, -8, 3.8],
    [-1.9, -10.4, 2.8],
    [1.9, -10.4, 3.1],
    [0, -10.8, 4.2],
    [-2.4, -6.4, 2.2],
    [2.4, -6.4, 2.5],
  ];
  shrineSpots.forEach(([x, z, height], index) => {
    const color = shrineColors[index % shrineColors.length] ?? '#2ad4c4';
    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(0.38, height, 5),
      mat({ color, emissive: color, emissiveIntensity: 0.4, roughness: 0.18, metalness: 0.5 }),
    );
    crystal.position.set(x, height / 2, z);
    scene.add(crystal);
    const body = physics.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, height * 0.3, z));
    physics.createCollider(RAPIER.ColliderDesc.cylinder(height * 0.3, 0.32), body);
    if (index % 2 === 0) {
      const light = new THREE.PointLight(color, 3.5, 6, 2);
      light.position.set(x, height * 0.6, z);
      scene.add(light);
    }
  });

  addCylinder(scene, physics, 0.72, 0.36, 0, 0.18, -8, {
    color: '#1a3a40',
    roughness: 0.45,
    metalness: 0.55,
    collider: true,
  });
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.035, 8, 28),
    mat({ color: '#ffd56a', emissive: '#ffb020', emissiveIntensity: 0.8, metalness: 0.8, roughness: 0.25 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.05, -8);
  scene.add(ring);

  const keyMesh = createKeyMesh();
  const keyBaseY = 0.95;
  keyMesh.position.set(0, keyBaseY, -8);
  scene.add(keyMesh);
  const keyLight = new THREE.PointLight('#ffd15a', 14, 16, 2);
  keyLight.position.set(0, 1.4, -8);
  scene.add(keyLight);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 16, 12),
    new THREE.MeshBasicMaterial({ color: '#ffd56a', transparent: true, opacity: 0.18, depthWrite: false }),
  );
  halo.position.set(0, 1.05, -8);
  scene.add(halo);

  const moteCount = 280;
  const motePositions = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    motePositions[i * 3] = (rand() - 0.5) * 40;
    motePositions[i * 3 + 1] = rand() * 6;
    motePositions[i * 3 + 2] = (rand() - 0.5) * 40;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  const motes = new THREE.Points(
    moteGeo,
    new THREE.PointsMaterial({
      color: '#ffe1a8',
      size: 0.055,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    }),
  );
  scene.add(motes);

  const keyState: KeyPickup & { elapsed: number } = {
    point: new THREE.Vector3(0, keyBaseY, -8),
    radius: 1.7,
    collected: false,
    elapsed: -1,
    collect(elapsed: number) {
      this.collected = true;
      this.elapsed = elapsed;
    },
  };

  const { body, collider, controller } = addPlayer(physics, 0, 16);
  const blob = addBlob(scene);

  return {
    id: 'micro',
    label: 'Dust',
    scene,
    physics,
    body,
    collider,
    controller,
    spawn: new THREE.Vector3(0, 0, 16),
    spawnYaw: 0,
    spawnPitch: -0.12,
    entry: {
      pos: new THREE.Vector3(0, 2.05, 16),
      look: new THREE.Vector3(0, 0.04, 16),
      fov: ZOOM_FOV,
    },
    veil: VEIL,
    fog,
    baseFog: 0.03,
    fogColor,
    blob,
    zoomTarget: null,
    key: keyState,
    update(_dt: number, elapsed: number) {
      const attr = moteGeo.getAttribute('position');
      const pos = attr.array as Float32Array;
      for (let i = 0; i < moteCount; i++) {
        const y = pos[i * 3 + 1] ?? 0;
        pos[i * 3 + 1] = y > 6 ? 0.1 : y + 0.008;
      }
      attr.needsUpdate = true;

      if (keyState.elapsed < 0) {
        keyMesh.visible = true;
        keyMesh.scale.setScalar(1);
        keyMesh.position.y = keyBaseY + Math.sin(elapsed * 2) * 0.08;
        keyMesh.rotation.y = elapsed * 0.7;
      } else {
        const u = elapsed - keyState.elapsed;
        let scale = 1;
        if (u < 0.22) scale = 1 + u * 1.1;
        else if (u < 1.15) scale = 1.24;
        else scale = Math.max(0, 1.24 * (1 - (u - 1.15) / 0.4));
        keyMesh.scale.setScalar(scale);
        keyMesh.rotation.y += 0.03;
        keyMesh.visible = scale > 0.02;
      }
      halo.position.y = keyMesh.position.y;
      keyLight.intensity = keyState.collected ? 8 : 14;
    },
  };
}

function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
