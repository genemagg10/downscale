export const keys = new Set<string>();
export const pointer = { dx: 0, dy: 0 };

let onPress: (code: string) => void = () => {};

export function setKeyHandler(fn: (code: string) => void): void {
  onPress = fn;
}

export function bindKeyboard(): void {
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.add(event.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === 'KeyE' || event.code === 'KeyQ' || event.code === 'KeyM') onPress(event.code);
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => keys.clear());
}

export function bindLook(canvas: HTMLCanvasElement): void {
  let dragging = false;
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    dragging = true;
    canvas.setPointerCapture(event.pointerId);
    if (event.pointerType === 'mouse') void canvas.requestPointerLock();
  });
  window.addEventListener('pointermove', (event) => {
    const locked = document.pointerLockElement === canvas;
    if (!locked && !dragging) return;
    pointer.dx += event.movementX;
    pointer.dy += event.movementY;
  });
  const release = (): void => {
    dragging = false;
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
}

export function consumeLook(): { dx: number; dy: number } {
  const sample = { dx: pointer.dx, dy: pointer.dy };
  pointer.dx = 0;
  pointer.dy = 0;
  return sample;
}

export function moveAxis(): { f: number; s: number; run: boolean; jump: boolean } {
  const f =
    (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) -
    (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  const s =
    (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
    (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  return {
    f,
    s,
    run: keys.has('ShiftLeft') || keys.has('ShiftRight'),
    jump: keys.has('Space'),
  };
}

export function bindTouch(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-k]').forEach((button) => {
    const code = button.dataset.k ?? '';
    const down = (event: Event): void => {
      event.preventDefault();
      if (!keys.has(code)) onPress(code);
      keys.add(code);
    };
    const up = (event: Event): void => {
      event.preventDefault();
      keys.delete(code);
    };
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointerleave', up);
    button.addEventListener('pointercancel', up);
  });
}
