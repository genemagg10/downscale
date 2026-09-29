import type { WorldId } from './world';

/** Small synthesized beds — no sample files, so GitHub Pages stays self-contained. */
export class Soundscape {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambient: GainNode | null = null;
  private nodes: AudioNode[] = [];
  muted = false;

  start(): void {
    if (!this.ctx) {
      const ctx = new AudioContext();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.28;
      this.master.connect(ctx.destination);
      this.ambient = ctx.createGain();
      this.ambient.gain.value = 0.9;
      this.ambient.connect(this.master);
    }
    void this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.28;
  }

  toggle(): void {
    this.setMuted(!this.muted);
  }

  setWorld(id: WorldId): void {
    if (!this.ctx || !this.ambient) return;
    for (const node of this.nodes) {
      try {
        node.disconnect();
      } catch {
        /* already stopped */
      }
    }
    this.nodes = [];
    const ctx = this.ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.connect(this.ambient);
    this.nodes.push(filter);

    const pads: Array<[number, OscillatorType, number]> =
      id === 'bedroom'
        ? [
            [220, 'sine', 0.05],
            [277.18, 'sine', 0.03],
            [329.63, 'triangle', 0.02],
          ]
        : id === 'watch'
          ? [
              [110, 'triangle', 0.05],
              [164.81, 'sine', 0.035],
              [220, 'sine', 0.02],
            ]
          : [
              [392, 'sine', 0.03],
              [493.88, 'sine', 0.025],
              [587.33, 'triangle', 0.02],
              [1568, 'sine', 0.012],
            ];
    filter.frequency.value = id === 'micro' ? 2200 : id === 'watch' ? 520 : 900;

    for (const [freq, type, gain] of pads) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.value = gain;
      osc.connect(g).connect(filter);
      osc.start();
      this.nodes.push(osc, g);
    }
  }

  blip(freq = 140, dur = 0.03, gain = 0.05): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  whoosh(): void {
    if (!this.ctx || !this.master || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const length = Math.floor(ctx.sampleRate * 0.7);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(180, t);
    filter.frequency.exponentialRampToValueAtTime(2200, t + 0.55);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + 0.72);
  }

  chime(): void {
    if (!this.ctx || !this.master || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const notes = [880, 1174.66, 1567.98, 1975.53];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = t + i * 0.07;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
      osc.connect(g).connect(this.master!);
      osc.start(start);
      osc.stop(start + 1.15);
    });
  }
}
