import * as THREE from 'three';
import { KEY_HEIGHT } from './constants';

/** Flat gear in the XZ plane, bottom at y = 0, spinning around Y. */
export function createGearGeometry(
  teeth: number,
  radius: number,
  thickness: number,
  toothDepth: number,
  holeRadius = radius * 0.22,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const tooth = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * tooth;
    const pts: Array<[number, number]> = [
      [a + tooth * 0.06, radius],
      [a + tooth * 0.22, radius + toothDepth],
      [a + tooth * 0.48, radius + toothDepth],
      [a + tooth * 0.66, radius],
    ];
    pts.forEach(([ang, r], idx) => {
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      if (i === 0 && idx === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, holeRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * A ceremonial key built to KEY_HEIGHT in traveler units.
 * Drop it in any world and it stays the same size relative to the player.
 */
export function createKeyMesh(): THREE.Group {
  const gold = new THREE.MeshStandardMaterial({
    color: '#ffd56a',
    emissive: '#ffb020',
    emissiveIntensity: 0.65,
    metalness: 0.95,
    roughness: 0.22,
  });
  const group = new THREE.Group();
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.048, 12, 22), gold);
  bow.position.y = 0.46;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.034, 0.5, 12), gold);
  shaft.position.y = 0.18;
  const bit1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.055, 0.045), gold);
  bit1.position.set(0.08, 0.02, 0);
  const bit2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.045), gold);
  bit2.position.set(0.06, 0.1, 0);
  const bit3 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.045), gold);
  bit3.position.set(0.045, -0.05, 0);
  group.add(bow, shaft, bit1, bit2, bit3);
  const built = 0.62;
  group.scale.setScalar(KEY_HEIGHT / built);
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
  return group;
}
