import { tone } from './helpers';

/** Harsh low buzz for a strike. Slightly detuned pair so it growls. */
export function playStrike(ctx: AudioContext, at: number): void {
  tone(ctx, { type: 'sawtooth', freq: 110, start: at, duration: 0.75, gain: 0.35, attack: 0.005, filterFreq: 700 });
  tone(ctx, { type: 'sawtooth', freq: 116, start: at, duration: 0.75, gain: 0.3, attack: 0.005, filterFreq: 700 });
  tone(ctx, { type: 'square', freq: 55, start: at, duration: 0.7, gain: 0.12, filterFreq: 400 });
}
