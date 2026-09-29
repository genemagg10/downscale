# Downscale

A browser prototype of an infinite-zoom adventure. The bedroom contains a watch. The watch contains a scratch. The scratch contains a world — and a golden key the same size you are.

**Play:** [https://genemagg10.github.io/downscale/](https://genemagg10.github.io/downscale/)

## Controls

Desktop:

- Click the scene to capture the mouse, or drag to look
- **WASD** or **arrow keys** to move
- **Shift** to run, **Space** to jump
- **E** to zoom into the watch, then into the scratch
- **Q** to zoom back out
- **M** to mute

The same hints sit on screen while you play. On a phone, drag to look and use the on-screen buttons. Mobile is usable, not polished.

## The loop

1. Cross the bedroom to the watch on the desk.
2. Press **E**. The dial fills the view and opens into the mechanism.
3. Walk through the gears to the glowing scratch.
4. Press **E** again.
5. Follow the warm light and take the key.
6. Press **Q** to climb back to the watch, and **Q** again to return to the room.

## Stack

- TypeScript and Vite
- Three.js — WebGPU when the browser has an adapter, classic WebGL 2 otherwise
- Rapier for the player capsule and the solid parts of each world

Each scale is its own scene and its own physics world. A zoom dollies the camera into a surface, washes the frame in that surface's color, and reveals the next scene from a matching close-up. The coordinate system resets, so the key stays traveler-sized instead of shrinking with the world.

The corner label shows whether the frame was drawn with WebGPU or WebGL 2.

## Prototype, not the full game

This build is the feeling: *I had no idea that was a world.*

In this build:

- Three nested worlds (bedroom, watch mechanism, microscopic metal)
- One golden key
- A continuous zoom in and back out

Not in this build:

- The other six keys
- Anchors
- Future-You and the ending choice
- Authored Blender scenes
- A finished mobile layout

## Develop

```bash
npm install
npm run dev
npm run build
npm run preview
```

`npm run dev` serves at `/`. The production build uses `/downscale/` so GitHub Pages can host it at the play URL above. Pages deploys from `main` via `.github/workflows/pages.yml`.

Useful query flags:

| Flag | Effect |
| --- | --- |
| `?tour=1` | Plays the whole loop on its own |
| `?webgl=1` | Forces the WebGL 2 backend |
| `?mute=1` | Starts silent |
| `?world=watch` or `?world=micro` | Starts in a deeper world, with a way back out |
