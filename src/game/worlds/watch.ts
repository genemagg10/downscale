import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { ZOOM_FOV } from '../constants';
import { createGearGeometry } from '../geom';
import { addBlob, addBox, addCylinder, addPlayer, mat } from '../stage';
import type { ScaleWorld } from '../world';

const VEIL = '#f4d7a6';
const MICRO = '#143e48';

interface Spin {
  mesh: THREE.Object3D;
  speed: number;
}

/**
 * World 2 — inside the wristwatch. Gears are architecture.
 * A scratch in the plate is the next door.
 */
export function createWatch(): ScaleWorld {
  const scene = new THREE.Scene();
  const fogColor = new THREE.Color('#e4c07a');
  const fog = new THREE.FogExp2(fogColor, 0.02);
  scene.fog = fog;
  scene.background = new THREE.Color('#c9924a');

  const physics = new RAPIER.World({ x: 0, y: -22, z: 0 });

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(27, 64),
    mat({ color: '#8a5a28', roughness: 0.55, metalness: 0.45 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const floorBody = physics.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.1, 0));
  physics.createCollider(RAPIER.ColliderDesc.cuboid(30, 0.1, 30), floorBody);

  // The surface you arrive through — same cream as the bedroom dial.
  const entryDisc = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 40),
    mat({
      color: VEIL,
      emissive: '#f0cc90',
      emissiveIntensity: 0.35,
      roughness: 0.4,
      metalness: 0.35,
    }),
  );
  entryDisc.rotation.x = -Math.PI / 2;
  entryDisc.position.set(0, 0.03, 14);
  entryDisc.receiveShadow = true;
  scene.add(entryDisc);

  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(27, 27, 12, 48, 1, true),
    mat({ color: '#3a2414', roughness: 0.62, metalness: 0.48, side: THREE.BackSide }),
  );
  wall.position.y = 5.2;
  scene.add(wall);

  const crystal = new THREE.Mesh(
    new THREE.CircleGeometry(26.5, 48),
    mat({
      color: '#ffe3b0',
      emissive: '#ffd089',
      emissiveIntensity: 0.9,
      roughness: 0.12,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
  );
  crystal.rotation.x = -Math.PI / 2;
  crystal.position.y = 10.4;
  scene.add(crystal);

  const hemi = new THREE.HemisphereLight('#ffe0b5', '#3a2010', 0.45);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffe0b0', 1.35);
  sun.position.set(4, 12, 6);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 36;
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.bias = -0.001;
  scene.add(sun, sun.target);

  const spins: Spin[] = [];
  const gears: Array<[number, number, number, number, string, number]> = [
    // x, z, radius, thickness, color, speed
    [0, 0, 5.4, 0.7, '#e0a84a', 0.22],
    [7.2, 6.4, 3.1, 0.55, '#f0d090', -0.38],
    [10.5, -3.5, 2.5, 0.45, '#c0c6cc', 0.5],
    [-3.5, -12, 3.6, 0.6, '#d4784a', -0.28],
    [2.2, -16.5, 2.3, 0.4, '#e6b15a', 0.44],
    [16, 7.5, 3.3, 0.55, '#e0a84a', -0.2],
    [-15.5, 11.5, 2.1, 0.4, '#d7dde4', 0.55],
    [5.2, 1.6, 1.55, 0.35, '#f2d48a', -0.7],
    [-6.2, -5.8, 1.9, 0.4, '#c9a15a', 0.48],
    [12.5, 14, 1.7, 0.35, '#b9c4ce', -0.6],
  ];

  for (const [x, z, radius, thickness, color, speed] of gears) {
    const mesh = new THREE.Mesh(
      createGearGeometry(radius > 4 ? 16 : 12, radius, thickness, radius * 0.16),
      mat({ color, roughness: 0.32, metalness: 0.82 }),
    );
    mesh.position.set(x, 0.02, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    spins.push({ mesh, speed });

    const body = physics.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(x, thickness / 2, z),
    );
    physics.createCollider(RAPIER.ColliderDesc.cylinder(thickness / 2, radius * 0.92), body);

    const axle = addCylinder(scene, null, 0.16, thickness + 0.55, x, (thickness + 0.55) / 2, z, {
      color: '#d5dbe2',
      metalness: 0.85,
      roughness: 0.25,
      collider: false,
    });
    axle.castShadow = true;
  }

  // Jewels on a few axles.
  const jewels: Array<[number, number, string, string]> = [
    [0, 0, '#ff2d55', '#ff6b88'],
    [7.2, 6.4, '#ff2d55', '#ff6b88'],
    [-3.5, -12, '#3dfff2', '#9dfff4'],
    [16, 7.5, '#ff2d55', '#ff6b88'],
  ];
  jewels.forEach(([x, z, color, emissive], index) => {
    const jewel = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 12),
      mat({ color, emissive, emissiveIntensity: 0.85, roughness: 0.12, metalness: 0.2 }),
    );
    jewel.position.set(x, 1.15, z);
    scene.add(jewel);
    if (index < 3) {
      const light = new THREE.PointLight(emissive, 6, 7, 2);
      light.position.copy(jewel.position);
      scene.add(light);
    }
  });

  // Bridges overhead — walk under them.
  addBox(scene, null, 8.2, 0.18, 0.55, 3.6, 2.7, 3.2, {
    color: '#c5ced6',
    metalness: 0.75,
    roughness: 0.28,
    collider: false,
    rotY: 0.4,
  });
  addBox(scene, null, 7.4, 0.16, 0.48, -2, 2.85, -6, {
    color: '#d5dbe2',
    metalness: 0.7,
    roughness: 0.3,
    collider: false,
    rotY: -0.5,
  });
  addBox(scene, null, 6, 0.16, 0.42, 8, 2.6, -9, {
    color: '#e6b15a',
    metalness: 0.8,
    roughness: 0.28,
    collider: false,
    rotY: 0.2,
  });

  // Balance wheel, off the walking path.
  const balance = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.35, 0.08, 10, 28),
    mat({ color: '#d5dbe2', metalness: 0.85, roughness: 0.22 }),
  );
  ring.rotation.x = Math.PI / 2;
  const spokeA = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 0.06, 0.12),
    mat({ color: '#e6eef4', metalness: 0.8, roughness: 0.25 }),
  );
  const spokeB = spokeA.clone();
  spokeB.rotation.y = Math.PI / 2;
  balance.add(ring, spokeA, spokeB);
  balance.position.set(9.2, 1.35, -11.5);
  scene.add(balance);

  // Circular boundary so you stay inside the case.
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const x = Math.cos(a) * 25;
    const z = Math.sin(a) * 25;
    const blocker = addBox(scene, physics, 13.5, 8, 1.4, x, 4, z, {
      color: '#3a2414',
      roughness: 0.7,
      metalness: 0.4,
      rotY: a + Math.PI / 2,
      collider: true,
      cast: false,
    });
    blocker.visible = false;
  }

  // The scratch. Up close it is a plate of the micro-world's color.
  const scratch = new THREE.Group();
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.06, 1.5),
    mat({ color: MICRO, emissive: '#0e4c56', emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.7 }),
  );
  plate.position.y = 0.05;
  const slit = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.08, 1.15),
    mat({ color: '#d7fff8', emissive: '#9ff6ea', emissiveIntensity: 1.3, roughness: 0.2, metalness: 0.4 }),
  );
  slit.position.y = 0.08;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.035, 8, 28),
    mat({ color: '#7a5cff', emissive: '#c9a0ff', emissiveIntensity: 0.7, roughness: 0.25, metalness: 0.4 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.1;
  scratch.add(plate, slit, rim);
  scratch.position.set(-20, 0, -10);
  scene.add(scratch);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.55, 7, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: '#7ff3ff',
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  beam.position.set(-20, 3.6, -10);
  scene.add(beam);
  const scratchLight = new THREE.PointLight('#7ff3ff', 8, 12, 2);
  scratchLight.position.set(-20, 1.2, -10);
  scene.add(scratchLight);

  const { body, collider, controller } = addPlayer(physics, 0, 14);
  const blob = addBlob(scene);

  const world: ScaleWorld = {
    id: 'watch',
    label: 'Watch',
    scene,
    physics,
    body,
    collider,
    controller,
    spawn: new THREE.Vector3(0, 0, 14),
    spawnYaw: 0,
    spawnPitch: -0.18,
    entry: {
      pos: new THREE.Vector3(0, 2.05, 14),
      look: new THREE.Vector3(0, 0.03, 14),
      fov: ZOOM_FOV,
    },
    veil: VEIL,
    fog,
    baseFog: 0.02,
    fogColor,
    blob,
    zoomTarget: {
      point: new THREE.Vector3(-20, 0.1, -10),
      normal: new THREE.Vector3(0, 1, 0),
      closeDistance: 0.55,
      range: 2.25,
      prompt: 'E  —  into the scratch',
    },
    key: null,
    update(dt: number, elapsed: number) {
      for (const spin of spins) spin.mesh.rotation.y += spin.speed * dt;
      balance.rotation.y = Math.sin(elapsed * 6.5) * 1.05;
      const pulse = 0.45 + Math.sin(elapsed * 3) * 0.25;
      const plateMat = plate.material;
      if (plateMat instanceof THREE.MeshStandardMaterial) plateMat.emissiveIntensity = pulse;
    },
  };
  return world;
}
