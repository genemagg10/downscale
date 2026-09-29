/// <reference types="vite/client" />

import type { DownscaleState } from './game/Game';

declare global {
  interface Window {
    __DOWNSCALE__?: DownscaleState;
  }
}

export {};
