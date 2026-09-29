import * as THREE from 'three/webgpu';
import RAPIER from '@dimforge/rapier3d-compat';
import { BODY_CENTER, CAPSULE_HALF, CAPSULE_RADIUS } from './constants';

export interface MatOpts {
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  map?: THREE.Texture;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
}

export function mat(opts: MatOpts): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: opts.color,
    roughness: opts.roughness ?? 0.72,
    metalness: opts.metalness ?? 0.02,
    emissive: opts.emissive ?? '#000000',
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    map: opts.map,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
  });
}

export function addBox(
  scene: THREE.Scene,
  physics: RAPIER.World | null,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  opts: MatOpts & { collider?: boolean; cast?: boolean; receive?: boolean; rotY?: number },
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(opts));
  mesh.position.set(x, y, z);
  mesh.rotation.y = opts.rotY ?? 0;
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  scene.add(mesh);
  if (physics && opts.collider !== false) {
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), opts.rotY ?? 0);
    const body = physics.createRigidBody(
      RAPIER.RigidBodyDesc.fixed()
        .setTranslation(x, y, z)
        .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }),
    );
    physics.createCollider(RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2), body);
  }
  return mesh;
}

export function addCylinder(
  scene: THREE.Scene,
  physics: RAPIER.World | null,
  radius: number,
  height: number,
  x: number,
  y: number,
  z: number,
  opts: MatOpts & { collider?: boolean; cast?: boolean; receive?: boolean; segments?: number; open?: boolean },
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, opts.segments ?? 20, 1, opts.open ?? false),
    mat(opts),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  scene.add(mesh);
  if (physics && opts.collider) {
    const body = physics.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z));
    physics.createCollider(RAPIER.ColliderDesc.cylinder(height / 2, radius), body);
  }
  return mesh;
}

export function addPlayer(physics: RAPIER.World, x: number, z: number): {
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  controller: RAPIER.KinematicCharacterController;
} {
  const body = physics.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, BODY_CENTER, z),
  );
  const collider = physics.createCollider(
    RAPIER.ColliderDesc.capsule(CAPSULE_HALF, CAPSULE_RADIUS),
    body,
  );
  const controller = physics.createCharacterController(0.02);
  controller.enableAutostep(0.35, 0.18, true);
  controller.enableSnapToGround(0.28);
  controller.setSlideEnabled(true);
  controller.setMaxSlopeClimbAngle(Math.PI / 4);
  return { body, collider, controller };
}

export function addBlob(scene: THREE.Scene): THREE.Mesh {
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 18),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28, depthWrite: false }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.025;
  blob.receiveShadow = false;
  scene.add(blob);
  return blob;
}
