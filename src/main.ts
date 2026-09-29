import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Game, type ViewRenderer } from './game/Game';
import { bindKeyboard, bindLook, bindTouch, setKeyHandler } from './game/input';
import { createBedroom } from './game/worlds/bedroom';
import { createMicro } from './game/worlds/micro';
import { createWatch } from './game/worlds/watch';

const boot = document.getElementById('boot');
const play = document.getElementById('play') as HTMLButtonElement | null;
const lead = document.getElementById('lead');

function configure(renderer: ViewRenderer): void {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
}

/**
 * WebGPU when the browser actually has it. Otherwise the classic WebGL 2
 * renderer — the WebGPU renderer's own WebGL backend is much heavier.
 */
async function createView(forceWebGL: boolean): Promise<{ renderer: ViewRenderer; backend: string }> {
  if (!forceWebGL && navigator.gpu) {
    try {
      const webgpu = await import('three/webgpu');
      const gpu = new webgpu.WebGPURenderer({ antialias: true, alpha: false });
      await Promise.race([
        gpu.init(),
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error('WebGPU init timed out')), 6000);
        }),
      ]);
      const backend = gpu.backend as { isWebGPUBackend?: boolean };
      if (backend.isWebGPUBackend) {
        const renderer = gpu as unknown as ViewRenderer;
        configure(renderer);
        return { renderer, backend: 'WebGPU' };
      }
      gpu.dispose();
    } catch (error) {
      console.warn('WebGPU unavailable, using WebGL2', error);
    }
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  configure(renderer);
  return { renderer, backend: 'WebGL2' };
}

async function main(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const tour = params.has('tour');
  const { renderer, backend } = await createView(params.get('webgl') === '1');
  document.body.prepend(renderer.domElement);

  await RAPIER.init();
  const worlds = [createBedroom(), createWatch(), createMicro()];
  const game = new Game(renderer, worlds, backend, tour);
  const resize = (): void => game.resize(window.innerWidth, window.innerHeight);
  resize();
  window.addEventListener('resize', resize);

  bindKeyboard();
  bindLook(renderer.domElement);
  const touch = document.getElementById('touch');
  if (touch) bindTouch(touch);
  setKeyHandler((code) => game.onPress(code));

  const timer = new THREE.Timer();
  timer.connect(document);
  let started = false;
  renderer.setAnimationLoop((timestamp) => {
    timer.update(timestamp);
    const dt = Math.min(0.05, timer.getDelta());
    if (!started) {
      renderer.render(game.world.scene, game.camera);
      return;
    }
    game.frame(dt);
  });

  const begin = (): void => {
    if (started) return;
    started = true;
    game.start();
    boot?.classList.add('hidden');
    if (!tour) void renderer.domElement.requestPointerLock();
  };

  if (tour) {
    begin();
    return;
  }

  if (play) {
    play.disabled = false;
    play.textContent = 'Click to begin';
    play.addEventListener('click', begin);
  }
  boot?.addEventListener('click', (event) => {
    if (event.target === play) return;
    begin();
  });
}

main().catch((error: unknown) => {
  console.error(error);
  if (lead) {
    lead.textContent = error instanceof Error ? error.message : 'The spring jammed.';
  }
  if (play) {
    play.disabled = true;
    play.textContent = 'Could not start';
  }
});
