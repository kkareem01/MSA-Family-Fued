import { midi, tone } from './helpers';

const NOTES = [72, 76, 79, 84] as const; // C5 E5 G5 C6
const STEP = 0.11;

/** Rising arpeggio when a new question hits the board. */
export function playRoundStart(ctx: AudioContext, at: number): void {
  NOTES.forEach((note, i) => {
    tone(ctx, { type: 'triangle', freq: midi(note), start: at + i * STEP, duration: 0.35, gain: 0.26 });
  });
  tone(ctx, { type: 'sine', freq: midi(84), start: at + NOTES.length * STEP, duration: 0.7, gain: 0.22 });
}
