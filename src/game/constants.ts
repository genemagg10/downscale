/** Player-scale constants. Every world resets to these units — the traveler does not shrink. */
export const CAPSULE_RADIUS = 0.28;
export const CAPSULE_HALF = 0.4;
/** Distance from feet to the capsule center. */
export const BODY_CENTER = CAPSULE_RADIUS + CAPSULE_HALF;
export const EYE_HEIGHT = 1.55;
export const PLAY_FOV = 68;
export const ZOOM_FOV = 34;

/**
 * Keys are this tall in traveler-space in every world.
 * Scene swaps reset the coordinate system, so a key never becomes
 * microscopic or planetary — it stays something you could hold.
 */
export const KEY_HEIGHT = 0.66;

export const WALK_SPEED = 4.25;
export const RUN_SPEED = 7.3;

export function smootherstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
