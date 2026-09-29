import * as THREE from 'three/webgpu';
import {
  BODY_CENTER,
  EYE_HEIGHT,
  PLAY_FOV,
  RUN_SPEED,
  WALK_SPEED,
  ZOOM_FOV,
  damp,
  smootherstep,
} from './constants';
import { consumeLook, moveAxis } from './input';
import { Soundscape } from './audio';
import { Tour, type TourHost } from './tour';
import type { Pose, ScaleWorld, WorldId, ZoomTarget } from './world';

export interface DownscaleState {
  ready: boolean;
  world: WorldId;
  hasKey: boolean;
  transitioning: boolean;
  tag: string;
  tourDone: boolean;
  backend: string;
  position: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
  aim: string;
}

interface Anchor {
  index: number;
  feet: THREE.Vector3;
  yaw: number;
  pitch: number;
}

type ZoomMode = 'idle' | 'dolly' | 'reveal' | 'rise' | 'pull';

const _look = new THREE.Vector3();

/**
 * Separate scenes per scale. A zoom is a dolly into a surface, a color-matched
 * veil, then a reveal inside the next scene — never one giant coordinate system.
 *
 * STORY HOOK: seven Keys, Anchors, and Future-You are later. This loop wakes the first Key.
 */
export class Game {
  readonly camera: THREE.PerspectiveCamera;
  readonly audio = new Soundscape();
  hasKey = false;
  private readonly worlds: ScaleWorld[];
  private index = 0;
  private yaw = 0;
  private pitch = 0;
  private hx = 0;
  private hz = 0;
  private vy = -2;
  private grounded = true;
  private jumpHeld = false;
  private bob = 0;
  private elapsed = 0;
  private tick = 0;
  private zoomFails = 0;
  private aim = '';
  private readonly anchors: Anchor[] = [];
  private readonly zoom = new ZoomDirector();
  private readonly tour: Tour | null;
  private readonly motion: number;
  private readonly veilEl: HTMLElement;
  private readonly promptEl: HTMLElement;
  private readonly toastEl: HTMLElement;
  private readonly keyEl: HTMLElement;
  private readonly backendEl: HTMLElement;
  private readonly depthItems: HTMLElement[];

  constructor(
    private readonly renderer: THREE.WebGPURenderer,
    worlds: ScaleWorld[],
    backendName: string,
    tour: boolean,
  ) {
    this.worlds = worlds;
    this.tour = tour ? new Tour() : null;
    this.camera = new THREE.PerspectiveCamera(PLAY_FOV, 1, 0.05, 240);
    this.motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.55 : 1;
    this.veilEl = must('veil');
    this.promptEl = must('prompt');
    this.toastEl = must('toast');
    this.keyEl = must('keybadge');
    this.backendEl = must('backend');
    this.backendEl.textContent = backendName;
    this.depthItems = [...document.querySelectorAll<HTMLElement>('#depth li')];

    const params = new URLSearchParams(location.search);
    const start = params.get('world');
    if (start === 'watch') this.index = 1;
    if (start === 'micro') this.index = 2;
    if (this.index > 0) {
      const room = worlds[0];
      const watch = worlds[1];
      if (room) {
        this.anchors.push({
          index: 0,
          feet: room.spawn.clone(),
          yaw: room.spawnYaw,
          pitch: room.spawnPitch,
        });
      }
      if (this.index > 1 && watch) {
        this.anchors.push({
          index: 1,
          feet: watch.spawn.clone(),
          yaw: watch.spawnYaw,
          pitch: watch.spawnPitch,
        });
      }
    }

    const world = this.world;
    this.yaw = world.spawnYaw;
    this.pitch = world.spawnPitch;
    this.place(world, world.spawn.x, world.spawn.z);
    this.exposure();
    this.depth();
    this.updateCamera(0);
    this.audio.setMuted(params.has('mute') || tour);
  }

  get world(): ScaleWorld {
    const world = this.worlds[this.index];
    if (!world) throw new Error('No active world');
    return world;
  }

  start(): void {
    this.audio.start();
    this.audio.setWorld(this.world.id);
    if (!this.tour) this.toast('The ticking is coming from the desk.');
  }

  onPress(code: string): void {
    if (code === 'KeyM') this.audio.toggle();
    if (this.zoom.active || (this.tour && !this.tour.done)) return;
    if (code === 'KeyE') this.tryZoomIn();
    if (code === 'KeyQ') this.tryZoomOut();
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(width, height);
  }

  frame(dt: number): void {
    this.elapsed += dt;
    if (this.zoom.active) {
      this.zoom.update(dt, this.camera, this.veilEl, this.world);
      this.world.update(dt, this.elapsed);
      this.tickAudio(dt);
      this.render();
      this.publish();
      return;
    }

    const touring = this.tour && !this.tour.done;
    const look = consumeLook();
    if (!touring) {
      this.yaw -= look.dx * 0.0022;
      this.pitch -= look.dy * 0.0022;
      const limit = Math.PI / 2 - 0.08;
      this.pitch = Math.max(-limit, Math.min(limit, this.pitch));
      this.movePlayer(dt);
    } else if (this.tour) {
      const host: TourHost = {
        worldId: this.world.id,
        transitioning: false,
        hasKey: this.hasKey,
        teleport: (x, z) => this.place(this.world, x, z),
        setLook: (yaw, pitch) => {
          this.yaw = yaw;
          this.pitch = pitch;
        },
      };
      this.tour.update(dt, host);
    }

    this.updateCamera(dt);
    if (this.tour?.wants) {
      const ok = this.tour.wants === 'in' ? this.tryZoomIn() : this.tryZoomOut();
      if (ok) {
        this.tour.wants = null;
        this.zoomFails = 0;
      } else {
        this.zoomFails += dt;
        if (this.zoomFails > 1.25) this.tour.stuck = `zoom-${this.tour.wants}-failed ${this.aim}`;
      }
    }

    this.world.blob.position.set(this.world.body.translation().x, 0.03, this.world.body.translation().z);
    this.world.update(dt, this.elapsed);
    if (!touring) this.updatePrompt();
    else this.setPrompt('');
    this.checkKey();
    this.tickAudio(dt);
    this.render();
    this.publish();
  }

  private movePlayer(dt: number): void {
    const input = moveAxis();
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw);
    const rz = -Math.sin(this.yaw);
    let wishX = 0;
    let wishZ = 0;
    const len = Math.hypot(input.f, input.s);
    const speed = input.run ? RUN_SPEED : WALK_SPEED;
    if (len > 0) {
      const f = input.f / len;
      const s = input.s / len;
      wishX = (fx * f + rx * s) * speed;
      wishZ = (fz * f + rz * s) * speed;
    }
    this.hx = damp(this.hx, wishX, 14, dt);
    this.hz = damp(this.hz, wishZ, 14, dt);
    if (this.grounded && this.vy < 0) this.vy = -2;
    if (input.jump && !this.jumpHeld && this.grounded) this.vy = 5.3;
    this.jumpHeld = input.jump;
    this.vy = Math.max(-18, this.vy - 24 * dt);

    const world = this.world;
    world.controller.computeColliderMovement(world.collider, {
      x: this.hx * dt,
      y: this.vy * dt,
      z: this.hz * dt,
    });
    const movement = world.controller.computedMovement();
    const pos = world.body.translation();
    world.body.setNextKinematicTranslation({
      x: pos.x + movement.x,
      y: pos.y + movement.y,
      z: pos.z + movement.z,
    });
    this.grounded = world.controller.computedGrounded();
    world.physics.timestep = Math.min(Math.max(dt, 1 / 120), 0.05);
    world.physics.step();
  }

  private updateCamera(dt: number): void {
    const pos = this.world.body.translation();
    const speed = Math.hypot(this.hx, this.hz);
    this.bob += dt * Math.max(speed, 0) * 1.5;
    const bob = Math.sin(this.bob) * 0.012 * (speed > 0.45 ? 1 : 0);
    this.camera.position.set(pos.x, pos.y - BODY_CENTER + EYE_HEIGHT + bob, pos.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = 0;
    if (!this.zoom.active) {
      this.camera.fov = PLAY_FOV;
      this.camera.updateProjectionMatrix();
    }
  }

  private tryZoomIn(): boolean {
    if (this.zoom.active) return false;
    const target = this.world.zoomTarget;
    const next = this.worlds[this.index + 1];
    if (!target || !next || !this.aimed(target)) return false;
    const feet = this.feet();
    this.anchors.push({ index: this.index, feet, yaw: this.yaw, pitch: this.pitch });
    this.audio.whoosh();
    const veil = next.veil;
    this.zoom.start('dolly', capture(this.camera), closePose(target), 1.7 * this.motion, veil, () => {
      this.index += 1;
      const arrived = this.world;
      this.place(arrived, arrived.spawn.x, arrived.spawn.z);
      this.audio.setWorld(arrived.id);
      this.exposure();
      this.depth();
      this.zoom.start(
        'reveal',
        arrived.entry,
        standPose(arrived.spawn, arrived.spawnYaw, arrived.spawnPitch),
        1.9 * this.motion,
        veil,
        () => {
          this.yaw = arrived.spawnYaw;
          this.pitch = arrived.spawnPitch;
          this.camera.fov = PLAY_FOV;
          this.camera.updateProjectionMatrix();
          this.toast(arrived.id === 'watch' ? 'The glass was a floor.' : 'The scratch is a country.');
        },
      );
    });
    return true;
  }

  private tryZoomOut(): boolean {
    if (this.zoom.active || this.index === 0) return false;
    const anchor = this.anchors[this.anchors.length - 1];
    if (!anchor) return false;
    const child = this.world;
    this.audio.whoosh();
    this.zoom.start('rise', capture(this.camera), child.entry, 1.35 * this.motion, child.veil, () => {
      this.anchors.pop();
      this.index = anchor.index;
      const parent = this.world;
      this.place(parent, anchor.feet.x, anchor.feet.z);
      this.yaw = anchor.yaw;
      this.pitch = anchor.pitch;
      const target = parent.zoomTarget;
      if (!target) return;
      this.audio.setWorld(parent.id);
      this.exposure();
      this.depth();
      this.zoom.start(
        'pull',
        closePose(target),
        standPose(anchor.feet, anchor.yaw, anchor.pitch),
        1.55 * this.motion,
        child.veil,
        () => {
          this.camera.fov = PLAY_FOV;
          this.camera.updateProjectionMatrix();
          this.toast(parent.id === 'bedroom' ? 'The room did not grow. You did.' : 'Back among the teeth.');
        },
      );
    });
    return true;
  }

  private aimed(target: ZoomTarget): boolean {
    const delta = target.point.clone().sub(this.camera.position);
    const dist = delta.length();
    if (dist < 1e-4) return false;
    delta.multiplyScalar(1 / dist);
    const forward = this.camera.getWorldDirection(new THREE.Vector3());
    const dot = forward.dot(delta);
    this.aim = `d=${dist.toFixed(2)} dot=${dot.toFixed(2)}`;
    return dist < target.range && (dot > 0.62 || dist < 1.05);
  }

  private updatePrompt(): void {
    const target = this.world.zoomTarget;
    if (target) {
      const dist = target.point.distanceTo(this.camera.position);
      if (this.aimed(target)) {
        this.setPrompt(target.prompt);
        return;
      }
      if (dist < target.range * 1.4) {
        this.setPrompt('Look closer');
        return;
      }
    }
    const key = this.world.key;
    if (key && !key.collected) {
      const pos = this.world.body.translation();
      const dist = Math.hypot(pos.x - key.point.x, pos.z - key.point.z);
      if (dist < 7) {
        this.setPrompt('The warm light is a key');
        return;
      }
    }
    this.setPrompt(this.index > 0 ? 'Q  —  zoom out' : '');
  }

  private checkKey(): void {
    const key = this.world.key;
    if (!key || key.collected || this.zoom.active) return;
    const pos = this.world.body.translation();
    const dx = pos.x - key.point.x;
    const dz = pos.z - key.point.z;
    if (dx * dx + dz * dz > key.radius * key.radius) return;
    key.collect(this.elapsed);
    this.hasKey = true;
    this.keyEl.hidden = false;
    this.audio.chime();
    this.toast('A key — the same size you are.');
  }

  private tickAudio(dt: number): void {
    this.tick += dt;
    const interval = this.world.id === 'watch' ? 0.5 : 0.9;
    if (this.tick < interval) return;
    this.tick = 0;
    if (this.world.id === 'watch') this.audio.blip(78, 0.04, 0.045);
    else if (this.world.id === 'bedroom' && this.world.zoomTarget) {
      const pos = this.world.body.translation();
      const target = this.world.zoomTarget.point;
      const dist = Math.hypot(pos.x - target.x, pos.z - target.z);
      if (dist < 4.5) this.audio.blip(150, 0.02, 0.03 * (1 - dist / 4.5));
    }
  }

  private place(world: ScaleWorld, x: number, z: number): void {
    const y = BODY_CENTER;
    world.body.setTranslation({ x, y, z }, true);
    world.body.setNextKinematicTranslation({ x, y, z });
    this.hx = 0;
    this.hz = 0;
    this.vy = -2;
    this.bob = 0;
  }

  private feet(): THREE.Vector3 {
    const pos = this.world.body.translation();
    return new THREE.Vector3(pos.x, pos.y - BODY_CENTER, pos.z);
  }

  private exposure(): void {
    const id = this.world.id;
    this.renderer.toneMappingExposure = id === 'micro' ? 1.22 : id === 'watch' ? 1.12 : 1.05;
  }

  private depth(): void {
    const order: WorldId[] = ['bedroom', 'watch', 'micro'];
    for (const item of this.depthItems) {
      const at = order.indexOf((item.dataset.w ?? '') as WorldId);
      item.classList.toggle('on', at === this.index);
      item.classList.toggle('past', at >= 0 && at < this.index);
    }
  }

  private setPrompt(text: string): void {
    if (this.promptEl.textContent !== text) this.promptEl.textContent = text;
    this.promptEl.classList.toggle('show', text.length > 0);
  }

  private toast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.remove('show');
    void this.toastEl.offsetWidth;
    this.toastEl.classList.add('show');
  }

  private render(): void {
    try {
      this.renderer.render(this.world.scene, this.camera);
    } catch (error) {
      if (!this.renderer.shadowMap.enabled) throw error;
      console.warn('Shadows disabled after a render error', error);
      this.renderer.shadowMap.enabled = false;
      for (const world of this.worlds) {
        world.scene.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          }
        });
      }
    }
  }

  private publish(): void {
    const pos = this.world.body.translation();
    const state: DownscaleState = {
      ready: true,
      world: this.world.id,
      hasKey: this.hasKey,
      transitioning: this.zoom.active,
      tag: this.tour ? this.tour.label() : this.world.id,
      tourDone: this.tour ? this.tour.done : false,
      backend: this.backendEl.textContent ?? '',
      position: {
        x: Math.round(pos.x * 100) / 100,
        y: Math.round((pos.y - BODY_CENTER) * 100) / 100,
        z: Math.round(pos.z * 100) / 100,
      },
      yaw: Math.round(this.yaw * 100) / 100,
      pitch: Math.round(this.pitch * 100) / 100,
      aim: this.aim,
    };
    window.__DOWNSCALE__ = state;
  }
}

class ZoomDirector {
  mode: ZoomMode = 'idle';
  private elapsed = 0;
  private duration = 1;
  private from: Pose | null = null;
  private to: Pose | null = null;
  private veil = '#ffffff';
  private onDone: (() => void) | null = null;

  get active(): boolean {
    return this.mode !== 'idle';
  }

  start(mode: ZoomMode, from: Pose, to: Pose, duration: number, veil: string, onDone: () => void): void {
    this.mode = mode;
    this.elapsed = 0;
    this.duration = duration;
    this.from = from;
    this.to = to;
    this.veil = veil;
    this.onDone = onDone;
  }

  update(dt: number, camera: THREE.PerspectiveCamera, veilEl: HTMLElement, world: ScaleWorld): void {
    if (!this.from || !this.to || this.mode === 'idle') return;
    this.elapsed += dt;
    const u = Math.min(1, this.elapsed / this.duration);
    applyPose(this.from, this.to, smootherstep(u), camera);
    this.paint(veilEl, u);
    if (this.mode === 'dolly' || this.mode === 'rise') {
      const k = smootherstep(Math.max(0, (u - 0.28) / 0.72));
      world.fog.color.set(this.veil);
      world.fog.density = world.baseFog + (0.62 - world.baseFog) * k;
    }
    if (u < 1) return;
    const done = this.onDone;
    world.fog.color.copy(world.fogColor);
    world.fog.density = world.baseFog;
    this.mode = 'idle';
    this.onDone = null;
    done?.();
    if (this.mode !== 'idle' && this.from && this.to) {
      applyPose(this.from, this.to, 0, camera);
      this.paint(veilEl, 0);
    }
  }

  private paint(veilEl: HTMLElement, u: number): void {
    veilEl.style.background = this.veil;
    const opacity =
      this.mode === 'dolly' || this.mode === 'rise'
        ? smootherstep(Math.max(0, (u - 0.4) / 0.6)) * 0.96
        : (1 - smootherstep(Math.min(1, u / 0.5))) * 0.96;
    veilEl.style.opacity = String(opacity);
  }
}

function applyPose(from: Pose, to: Pose, t: number, camera: THREE.PerspectiveCamera): void {
  camera.position.lerpVectors(from.pos, to.pos, t);
  _look.lerpVectors(from.look, to.look, t);
  camera.lookAt(_look);
  camera.fov = THREE.MathUtils.lerp(from.fov, to.fov, t);
  camera.updateProjectionMatrix();
}

function capture(camera: THREE.PerspectiveCamera): Pose {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  return {
    pos: camera.position.clone(),
    look: camera.position.clone().add(dir.multiplyScalar(4)),
    fov: camera.fov,
  };
}

function closePose(target: ZoomTarget): Pose {
  return {
    pos: target.point.clone().addScaledVector(target.normal, target.closeDistance),
    look: target.point.clone(),
    fov: ZOOM_FOV,
  };
}

function standPose(feet: THREE.Vector3, yaw: number, pitch: number): Pose {
  const pos = new THREE.Vector3(feet.x, feet.y + EYE_HEIGHT, feet.z);
  const cp = Math.cos(pitch);
  const forward = new THREE.Vector3(-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp);
  return { pos, look: pos.clone().add(forward.multiplyScalar(4)), fov: PLAY_FOV };
}

function must(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
}
