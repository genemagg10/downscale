import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { PLAY_FOV } from '../constants';
import { addBlob, addBox, addCylinder, addPlayer } from '../stage';
import { dialTexture, nightTexture, noteTexture, posterTexture, rugTexture, woodTexture } from '../textures';
import type { ScaleWorld } from '../world';

const DIAL = '#f4d7a6';

/**
 * World 1 — a stylized bedroom. The wristwatch on the desk is the first door.
 */
export function createBedroom(): ScaleWorld {
  const scene = new THREE.Scene();
  const fogColor = new THREE.Color('#f6d2bc');
  const fog = new THREE.FogExp2(fogColor, 0.045);
  scene.fog = fog;
  scene.background = new THREE.Color('#e7b89a');

  const physics = new RAPIER.World({ x: 0, y: -22, z: 0 });

  const floorMap = woodTexture();
  addBox(scene, physics, 9.4, 0.2, 7.2, 0, -0.1, 0, {
    color: '#ffffff',
    map: floorMap,
    roughness: 0.86,
    collider: true,
    cast: false,
    receive: true,
  });
  addBox(scene, physics, 9.4, 0.16, 7.2, 0, 3.22, 0, {
    color: '#fff1df',
    roughness: 0.9,
    collider: true,
    cast: false,
  });

  // North wall is night-blue; the others are warm plaster.
  addBox(scene, physics, 9.6, 3.2, 0.22, 0, 1.55, -3.61, {
    color: '#243e66',
    roughness: 0.9,
    collider: true,
  });
  addBox(scene, physics, 9.6, 3.2, 0.22, 0, 1.55, 3.61, {
    color: '#f2b48a',
    roughness: 0.92,
    collider: true,
  });
  addBox(scene, physics, 0.22, 3.2, 7.4, -4.71, 1.55, 0, {
    color: '#e89a70',
    roughness: 0.92,
    collider: true,
  });
  addBox(scene, physics, 0.22, 3.2, 7.4, 4.71, 1.55, 0, {
    color: '#f2b48a',
    roughness: 0.92,
    collider: true,
  });

  // Baseboards
  for (const [w, d, x, z] of [
    [9.2, 0.08, 0, -3.42],
    [9.2, 0.08, 0, 3.42],
    [0.08, 7.0, -4.52, 0],
    [0.08, 7.0, 4.52, 0],
  ] as const) {
    addBox(scene, null, w, 0.16, d, x, 0.08, z, { color: '#6b3a28', roughness: 0.7, collider: false });
  }

  const hemi = new THREE.HemisphereLight('#ffe0c4', '#6f8cae', 0.72);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight('#cfe4ff', 1.05);
  moon.position.set(-1.5, 6.5, -5.5);
  moon.target.position.set(0.4, 0.5, 0.5);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 22;
  moon.shadow.camera.left = -8;
  moon.shadow.camera.right = 8;
  moon.shadow.camera.top = 8;
  moon.shadow.camera.bottom = -8;
  moon.shadow.bias = -0.0006;
  scene.add(moon, moon.target);

  // Window
  const night = nightTexture();
  addBox(scene, null, 1.7, 1.35, 0.05, -0.15, 1.7, -3.46, {
    color: '#ffffff',
    map: night,
    roughness: 1,
    collider: false,
    cast: false,
  });
  addBox(scene, null, 1.9, 0.08, 0.1, -0.15, 2.42, -3.42, { color: '#f7efe4', roughness: 0.6, collider: false });
  addBox(scene, null, 1.9, 0.08, 0.1, -0.15, 0.98, -3.42, { color: '#f7efe4', roughness: 0.6, collider: false });
  addBox(scene, null, 0.08, 1.5, 0.1, -1.05, 1.7, -3.42, { color: '#f7efe4', roughness: 0.6, collider: false });
  addBox(scene, null, 0.08, 1.5, 0.1, 0.75, 1.7, -3.42, { color: '#f7efe4', roughness: 0.6, collider: false });
  addBox(scene, null, 0.28, 1.7, 0.06, -1.28, 1.65, -3.4, { color: '#f4efe6', roughness: 0.85, collider: false });
  addBox(scene, null, 0.28, 1.7, 0.06, 0.98, 1.65, -3.4, { color: '#f4efe6', roughness: 0.85, collider: false });
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.62, 1.22),
    new THREE.MeshStandardMaterial({
      color: '#9fd0ea',
      transparent: true,
      opacity: 0.22,
      roughness: 0.05,
      metalness: 0.1,
    }),
  );
  glass.position.set(-0.15, 1.7, -3.43);
  scene.add(glass);
  const windowLight = new THREE.PointLight('#9ec9ff', 10, 8, 2);
  windowLight.position.set(-0.15, 1.8, -2.6);
  scene.add(windowLight);

  // Bed
  addBox(scene, physics, 1.85, 0.28, 2.35, -2.55, 0.28, -0.35, {
    color: '#6b3a2a',
    roughness: 0.7,
    collider: true,
  });
  addBox(scene, null, 1.7, 0.28, 2.15, -2.55, 0.52, -0.35, {
    color: '#f7f1e8',
    roughness: 0.9,
    collider: false,
  });
  addBox(scene, null, 1.62, 0.16, 1.35, -2.55, 0.68, -0.15, {
    color: '#ef5d4a',
    roughness: 0.85,
    collider: false,
  });
  addBox(scene, null, 0.55, 0.16, 0.32, -2.95, 0.74, -1.15, { color: '#f3e7c8', roughness: 0.8, collider: false });
  addBox(scene, null, 0.5, 0.14, 0.3, -2.2, 0.76, -1.18, { color: '#2aa89a', roughness: 0.8, collider: false });

  // Desk — the watch sits on the near-left corner, clear of the lamp.
  addBox(scene, physics, 1.7, 0.08, 0.78, 1.28, 0.74, -2.32, {
    color: '#8d4b30',
    roughness: 0.55,
    metalness: 0.05,
    collider: true,
  });
  for (const [x, z] of [
    [0.55, -2.6],
    [2.0, -2.6],
    [0.55, -2.05],
    [2.0, -2.05],
  ] as const) {
    addBox(scene, physics, 0.08, 0.7, 0.08, x, 0.35, z, { color: '#6b3a28', collider: true, cast: true });
  }

  // Chair, off the path from the door-side of the room to the watch.
  addBox(scene, physics, 0.46, 0.08, 0.46, 2.35, 0.48, -1.15, { color: '#c46a3a', collider: true });
  for (const [x, z] of [
    [2.18, -1.32],
    [2.52, -1.32],
    [2.18, -0.98],
    [2.52, -0.98],
  ] as const) {
    addBox(scene, null, 0.06, 0.48, 0.06, x, 0.24, z, { color: '#6b3a28', collider: false });
  }
  addBox(scene, physics, 0.46, 0.5, 0.08, 2.35, 0.78, -1.38, { color: '#d97848', collider: true });

  // Rug
  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 28),
    new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 0.95 }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.15, 0.02, 0.35);
  rug.receiveShadow = true;
  scene.add(rug);

  // Shelf and books
  addBox(scene, physics, 0.34, 1.7, 1.15, -4.4, 0.85, 0.4, { color: '#7a4630', roughness: 0.7, collider: true });
  const spines = ['#ef5d4a', '#2aa89a', '#f0c14d', '#3d5a80', '#e07a3d', '#f7f1e8'];
  spines.forEach((color, i) => {
    addBox(scene, null, 0.08, 0.32, 0.22, -4.22, 1.35, -0.05 + i * 0.16, {
      color,
      roughness: 0.6,
      collider: false,
    });
  });

  // Poster
  addBox(scene, null, 0.72, 0.96, 0.04, -4.55, 1.85, -1.5, {
    color: '#ffffff',
    map: posterTexture(),
    roughness: 0.8,
    collider: false,
    cast: false,
  });

  // Plant
  addCylinder(scene, physics, 0.18, 0.28, 3.55, 0.14, 1.55, {
    color: '#e07a3d',
    roughness: 0.7,
    collider: true,
  });
  addCylinder(scene, null, 0.16, 0.06, 3.55, 0.3, 1.55, { color: '#3a2a1c', collider: false, cast: false });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#2f9e6b', roughness: 0.55 });
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), leafMat);
    const a = (i / 6) * Math.PI * 2;
    leaf.position.set(3.55 + Math.cos(a) * 0.12, 0.55 + (i % 3) * 0.12, 1.55 + Math.sin(a) * 0.12);
    leaf.scale.set(1, 1.4, 0.7);
    leaf.castShadow = true;
    scene.add(leaf);
  }

  // Desk clutter
  addBox(scene, null, 0.28, 0.06, 0.2, 1.7, 0.81, -2.15, { color: '#3d5a80', roughness: 0.5, collider: false });
  addBox(scene, null, 0.26, 0.05, 0.18, 1.72, 0.86, -2.16, { color: '#ef5d4a', roughness: 0.5, collider: false });
  addCylinder(scene, null, 0.07, 0.1, 1.85, 0.83, -2.05, { color: '#f7f1e8', roughness: 0.4, collider: false });

  const note = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.28),
    new THREE.MeshStandardMaterial({ map: noteTexture(), roughness: 0.9 }),
  );
  note.rotation.x = -Math.PI / 2;
  note.position.set(1.48, 0.785, -2.2);
  note.receiveShadow = true;
  scene.add(note);

  // Lamp
  addCylinder(scene, null, 0.08, 0.04, 1.95, 0.8, -2.55, { color: '#6b3a28', metalness: 0.4, roughness: 0.4, collider: false });
  addCylinder(scene, null, 0.025, 0.42, 1.95, 1.02, -2.55, { color: '#d9c2a0', metalness: 0.6, roughness: 0.3, collider: false });
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.22, 16, 1, true),
    new THREE.MeshStandardMaterial({
      color: '#ffd27a',
      emissive: '#ffb15a',
      emissiveIntensity: 0.7,
      side: THREE.DoubleSide,
      roughness: 0.45,
    }),
  );
  shade.position.set(1.95, 1.28, -2.55);
  scene.add(shade);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 10, 8),
    new THREE.MeshStandardMaterial({ color: '#fff4d2', emissive: '#fff1c4', emissiveIntensity: 1.4 }),
  );
  bulb.position.set(1.95, 1.22, -2.55);
  scene.add(bulb);
  const lamp = new THREE.PointLight('#ffb15a', 28, 7.5, 2);
  lamp.position.copy(bulb.position);
  lamp.castShadow = false;
  scene.add(lamp);
  const bedFill = new THREE.PointLight('#ff8d6b', 4, 4.5, 2);
  bedFill.position.set(-2.4, 1.2, 0.2);
  scene.add(bedFill);

  // The watch — hero zoom target.
  const watch = buildWatch();
  watch.position.set(1.05, 0.78, -2.28);
  scene.add(watch);
  watch.updateWorldMatrix(true, true);
  const dial = watch.getObjectByName('dial');
  const dialPoint = new THREE.Vector3();
  dial?.getWorldPosition(dialPoint);

  const second = watch.getObjectByName('second');
  const minute = watch.getObjectByName('minute');

  const { body, collider, controller } = addPlayer(physics, 0, 1.7);
  const blob = addBlob(scene);

  const world: ScaleWorld = {
    id: 'bedroom',
    label: 'Room',
    scene,
    physics,
    body,
    collider,
    controller,
    spawn: new THREE.Vector3(0, 0, 1.7),
    spawnYaw: -0.45,
    spawnPitch: -0.16,
    entry: {
      pos: new THREE.Vector3(0, 1.55, 1.7),
      look: new THREE.Vector3(0.6, 1.1, -1.2),
      fov: PLAY_FOV,
    },
    veil: DIAL,
    fog,
    baseFog: 0.045,
    fogColor,
    blob,
    zoomTarget: {
      point: dialPoint,
      normal: new THREE.Vector3(0, 1, 0),
      closeDistance: 0.16,
      range: 1.75,
      prompt: 'E  —  into the watch',
    },
    key: null,
    update(_dt: number, elapsed: number) {
      if (second) second.rotation.y = -elapsed * 0.8;
      if (minute) minute.rotation.y = -elapsed * 0.06;
      const dialMat = dial instanceof THREE.Mesh ? dial.material : null;
      if (dialMat instanceof THREE.MeshStandardMaterial) {
        dialMat.emissiveIntensity = 0.18 + Math.sin(elapsed * 2.2) * 0.08;
      }
    },
  };
  return world;
}

function buildWatch(): THREE.Group {
  const group = new THREE.Group();
  const strap = new THREE.MeshStandardMaterial({ color: '#6b3f2c', roughness: 0.72 });
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.035, 0.22), strap);
  left.position.set(-0.2, 0.02, 0);
  const right = left.clone();
  right.position.x = 0.2;
  const caseMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.155, 0.155, 0.07, 28),
    new THREE.MeshStandardMaterial({ color: '#e6b15a', metalness: 0.85, roughness: 0.28 }),
  );
  caseMesh.position.y = 0.05;
  caseMesh.castShadow = true;
  const bezel = new THREE.Mesh(
    new THREE.TorusGeometry(0.145, 0.018, 8, 28),
    new THREE.MeshStandardMaterial({ color: '#f2d48a', metalness: 0.9, roughness: 0.22 }),
  );
  bezel.rotation.x = Math.PI / 2;
  bezel.position.y = 0.085;
  const dial = new THREE.Mesh(
    new THREE.CircleGeometry(0.132, 32),
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: dialTexture(),
      emissive: DIAL,
      emissiveIntensity: 0.2,
      roughness: 0.42,
      metalness: 0.15,
    }),
  );
  dial.name = 'dial';
  dial.rotation.x = -Math.PI / 2;
  dial.position.y = 0.088;
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(0.132, 32),
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.18,
      roughness: 0.05,
      metalness: 0.05,
    }),
  );
  glass.rotation.x = -Math.PI / 2;
  glass.position.y = 0.094;

  const handMat = new THREE.MeshStandardMaterial({ color: '#2a1c14', roughness: 0.4, metalness: 0.3 });
  const minute = new THREE.Group();
  minute.name = 'minute';
  minute.position.y = 0.1;
  const minuteMesh = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 0.09), handMat);
  minuteMesh.position.z = -0.04;
  minute.add(minuteMesh);
  const second = new THREE.Group();
  second.name = 'second';
  second.position.y = 0.108;
  const secondMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.005, 0.008, 0.11),
    new THREE.MeshStandardMaterial({ color: '#ef5d4a', roughness: 0.35 }),
  );
  secondMesh.position.z = -0.045;
  second.add(secondMesh);
  const pin = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#e6b15a', metalness: 0.8, roughness: 0.25 }),
  );
  pin.position.y = 0.11;
  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.04, 10),
    new THREE.MeshStandardMaterial({ color: '#f0d090', metalness: 0.85, roughness: 0.25 }),
  );
  crown.rotation.z = Math.PI / 2;
  crown.position.set(0.17, 0.05, 0);

  group.add(left, right, caseMesh, bezel, dial, glass, minute, second, pin, crown);
  return group;
}
