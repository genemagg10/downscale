import * as THREE from 'three';

export interface TourHost {
  worldId: string;
  transitioning: boolean;
  hasKey: boolean;
  teleport(x: number, z: number): void;
  setLook(yaw: number, pitch: number): void;
}

/** Scripted walk of the prototype loop. Used by `?tour=1` and browser checks. */
export class Tour {
  done = false;
  wants: 'in' | 'out' | null = null;
  stuck: string | null = null;
  private phase = 0;
  private time = 0;
  private hold = 0;
  private armed = false;
  private tag = 'bedroom';

  label(): string {
    return this.stuck ?? this.tag;
  }

  update(dt: number, host: TourHost): void {
    if (this.done || this.stuck) return;
    this.time += dt;

    switch (this.phase) {
      case 0:
        this.tag = 'bedroom';
        host.setLook(-0.45, -0.16);
        if (this.time > 1.2) this.next();
        break;
      case 1: {
        this.tag = 'moving';
        const u = Math.min(1, this.time / 2.3);
        const e = u * u * (3 - 2 * u);
        host.teleport(THREE.MathUtils.lerp(0, 1.05, e), THREE.MathUtils.lerp(1.7, -1.42, e));
        host.setLook(THREE.MathUtils.lerp(-0.45, 0, e), THREE.MathUtils.lerp(-0.16, -0.67, e));
        if (u >= 1) this.next();
        break;
      }
      case 2:
        this.tag = 'transition';
        this.arm('in');
        this.next();
        break;
      case 3:
        this.waitFor(dt, host, 'watch', 'watch', 1.35);
        break;
      case 4: {
        this.tag = 'moving';
        const points = [
          new THREE.Vector3(0, 0, 14),
          new THREE.Vector3(-8, 0, 10),
          new THREE.Vector3(-14, 0, 2),
          new THREE.Vector3(-20, 0, -4),
          new THREE.Vector3(-20, 0, -9.15),
        ];
        const u = Math.min(1, this.time / 4.4);
        const pos = new THREE.Vector3();
        pointOnPath(points, u, pos);
        host.teleport(pos.x, pos.z);
        host.setLook(0, u > 0.9 ? -1.04 : -0.22);
        if (u >= 1) {
          host.teleport(-20, -9.15);
          host.setLook(0, -1.04);
          this.next();
        }
        break;
      }
      case 5:
        this.tag = 'transition';
        this.arm('in');
        this.next();
        break;
      case 6:
        this.waitFor(dt, host, 'micro', 'micro', 1.35);
        break;
      case 7: {
        this.tag = 'moving';
        const u = Math.min(1, this.time / 2.5);
        const e = u * u * (3 - 2 * u);
        host.teleport(0, THREE.MathUtils.lerp(16, -6.45, e));
        host.setLook(0, THREE.MathUtils.lerp(-0.12, -0.42, e));
        if (u >= 1) {
          host.teleport(0, -6.45);
          host.setLook(0, -0.42);
          this.next();
        }
        break;
      }
      case 8:
        host.teleport(0, -6.45);
        host.setLook(0, -0.42);
        if (!host.hasKey) {
          this.tag = 'approaching-key';
          return;
        }
        this.hold += dt;
        this.tag = 'key';
        if (this.hold > 1.45) this.next();
        break;
      case 9:
        this.tag = 'transition';
        this.arm('out');
        this.next();
        break;
      case 10:
        this.waitFor(dt, host, 'watch', 'back-watch', 1.15);
        break;
      case 11:
        this.tag = 'transition';
        this.arm('out');
        this.next();
        break;
      case 12:
        if (this.waitFor(dt, host, 'bedroom', 'back-room', 0.9)) {
          this.done = true;
          this.tag = 'done';
        }
        break;
      default:
        this.done = true;
        this.tag = 'done';
    }
  }

  private arm(dir: 'in' | 'out'): void {
    if (!this.armed) {
      this.wants = dir;
      this.armed = true;
    }
  }

  private waitFor(dt: number, host: TourHost, world: string, tag: string, seconds: number): boolean {
    if (host.transitioning || host.worldId !== world) {
      this.tag = 'transition';
      this.hold = 0;
      return false;
    }
    this.hold += dt;
    this.tag = tag;
    if (this.hold > seconds) {
      this.next();
      return true;
    }
    return false;
  }

  private next(): void {
    this.phase += 1;
    this.time = 0;
    this.hold = 0;
    this.armed = false;
  }
}

function pointOnPath(points: THREE.Vector3[], u: number, out: THREE.Vector3): void {
  const sections = points.length - 1;
  const x = Math.min(sections - 1e-4, Math.max(0, u) * sections);
  const i = Math.floor(x);
  const t = x - i;
  const a = points[i];
  const b = points[i + 1];
  if (!a || !b) return;
  out.lerpVectors(a, b, t);
}
