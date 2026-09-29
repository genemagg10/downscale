import * as THREE from 'three/webgpu';
import RAPIER from '@dimforge/rapier3d-compat';
import { Game } from './game/Game';
import { bindKeyboard, bindLook, bindTouch, setKeyHandler } from './game/input';
import { createBedroom } from './game/worlds/bedroom';
import { createMicro } from './game/worlds/micro';
import { createWatch } from './game/worlds/watch';

const boot = document.getElementById('boot');
const play = document.getElementById('play') as HTMLButtonElement | null;
const lead = document.getElementById('lead');

async function makeRenderer(forceWebGL: boolean): Promise<THREE.WebGPURenderer> {
  const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL, alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  await Promise.race([
    renderer.init(),
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error('Renderer init timed out')), 8000);
    }),
  ]);
  return renderer;
}

function backendName(renderer: THREE.WebGPURenderer): string {
  const backend = renderer.backend as { isWebGPUBackend?: boolean };
  return backend.isWebGPUBackend ? 'WebGPU' : 'WebGL2';
}

async function main(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const forceWebGL = params.get('webgl') === '1';
  const tour = params.has('tour');

  let renderer: THREE.WebGPURenderer;
  try {
    renderer = await makeRenderer(forceWebGL);
  } catch (error) {
    console.warn('WebGPU path failed, forcing WebGL2', error);
    renderer = await makeRenderer(true);
  }

  document.body.prepend(renderer.domElement);
  await RAPIER.init();
  const worlds = [createBedroom(), createWatch(), createMicro()];
  const game = new Game(renderer, worlds, backendName(renderer), tour);
  const resize = (): void => game.resize(window.innerWidth, window.innerHeight);
  resize();
  window.addEventListener('resize', resize);

  bindKeyboard();
  bindLook(renderer.domElement);
  const touch = document.getElementById('touch');
  if (touch) bindTouch(touch);
  setKeyHandler((code) => game.onPress(code));

  const clock = new THREE.Clock();
  let started = false;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(0.05, clock.getDelta());
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
