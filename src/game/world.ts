import type * as THREE from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';

export type WorldId = 'bedroom' | 'watch' | 'micro';

export interface Pose {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
}

export interface ZoomTarget {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  closeDistance: number;
  range: number;
  prompt: string;
}

export interface KeyPickup {
  readonly point: THREE.Vector3;
  readonly radius: number;
  collected: boolean;
  collect(elapsed: number): void;
}

/**
 * One optimized scene per scale. Zoom never shares a coordinate system —
 * the camera approaches a surface, the veil matches that surface, then the
 * next scene opens with the traveler at normal size again.
 */
export interface ScaleWorld {
  readonly id: WorldId;
  readonly label: string;
  readonly scene: THREE.Scene;
  readonly physics: RAPIER.World;
  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  readonly controller: RAPIER.KinematicCharacterController;
  readonly spawn: THREE.Vector3;
  readonly spawnYaw: number;
  readonly spawnPitch: number;
  readonly entry: Pose;
  readonly veil: string;
  readonly fog: THREE.FogExp2;
  readonly baseFog: number;
  readonly fogColor: THREE.Color;
  readonly blob: THREE.Mesh;
  zoomTarget: ZoomTarget | null;
  key: KeyPickup | null;
  update(dt: number, elapsed: number): void;
}
