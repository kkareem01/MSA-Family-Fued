import { midi, noiseBurst, tone } from './helpers';

const RUN = [60, 64, 67, 72, 64, 67, 72, 76] as const;
const FINAL = [72, 76, 79, 84] as const;
const STEP = 0.12;

/** Fanfare with a sparkle tail for the winner screen. */
export function playWin(ctx: AudioContext, at: number): void {
  RUN.forEach((note, i) => {
    tone(ctx, { type: 'square', freq: midi(note), start: at + i * STEP, duration: 0.22, gain: 0.16, filterFreq: 3000 });
    tone(ctx, { type: 'triangle', freq: midi(note), start: at + i * STEP, duration: 0.25, gain: 0.2 });
  });
  const chordAt = at + RUN.length * STEP;
  FINAL.forEach((note) => {
    tone(ctx, { type: 'sawtooth', freq: midi(note), start: chordAt, duration: 2.2, gain: 0.12, filterFreq: 2200 });
    tone(ctx, { type: 'triangle', freq: midi(note), start: chordAt, duration: 2.4, gain: 0.18 });
  });
  noiseBurst(ctx, chordAt, 1.6, 0.12, 4000);
}
