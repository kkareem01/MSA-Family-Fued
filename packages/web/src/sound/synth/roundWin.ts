import { midi, tone } from './helpers';

const CHORD = [67, 71, 74, 79] as const; // G4 B4 D5 G5

/** Quick major sweep into a held chord for a round win. */
export function playRoundWin(ctx: AudioContext, at: number): void {
  CHORD.forEach((note, i) => {
    tone(ctx, { type: 'triangle', freq: midi(note), start: at + i * 0.07, duration: 1.1, gain: 0.2 });
    tone(ctx, { type: 'sine', freq: midi(note + 12), start: at + i * 0.07 + 0.05, duration: 0.9, gain: 0.07 });
  });
}
