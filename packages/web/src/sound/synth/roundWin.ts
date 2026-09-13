import { handle, midi, tone, type AudioBus, type SynthHandle } from './helpers';

const CHORD = [67, 71, 74, 79] as const; // G4 B4 D5 G5
const STAGGER = 0.07;
const HOLD = 1.1;

/** Quick major sweep into a held chord for a round win. */
export function playRoundWin(bus: AudioBus, at: number): SynthHandle {
  const nodes = CHORD.flatMap((note, i) => [
    tone(bus, { type: 'triangle', freq: midi(note), start: at + i * STAGGER, duration: HOLD, gain: 0.2 }),
    tone(bus, { type: 'sine', freq: midi(note + 12), start: at + i * STAGGER + 0.05, duration: 0.9, gain: 0.07 }),
  ]);
  return handle(nodes, at + (CHORD.length - 1) * STAGGER + HOLD);
}
