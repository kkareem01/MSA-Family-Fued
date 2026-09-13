import { tone } from './helpers';

/** Bright two-note "ding" when a tile flips. */
export function playReveal(ctx: AudioContext, at: number): void {
  tone(ctx, { type: 'sine', freq: 880, start: at, duration: 0.16, gain: 0.3 });
  tone(ctx, { type: 'sine', freq: 1320, start: at + 0.09, duration: 0.45, gain: 0.32 });
  tone(ctx, { type: 'triangle', freq: 2640, start: at + 0.09, duration: 0.3, gain: 0.08 });
}
