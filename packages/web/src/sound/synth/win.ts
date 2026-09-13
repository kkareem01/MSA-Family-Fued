import { handle, midi, noiseBurst, tone, type AudioBus, type SynthHandle } from './helpers';

const RUN = [60, 64, 67, 72, 64, 67, 72, 76] as const;
const FINAL = [72, 76, 79, 84] as const;
const STEP = 0.12;
const CHORD_HOLD = 2.4;

/** Fanfare with a sparkle tail for the winner screen. */
export function playWin(bus: AudioBus, at: number): SynthHandle {
  const chordAt = at + RUN.length * STEP;
  const run = RUN.flatMap((note, i) => [
    tone(bus, { type: 'square', freq: midi(note), start: at + i * STEP, duration: 0.22, gain: 0.16, filterFreq: 3000 }),
    tone(bus, { type: 'triangle', freq: midi(note), start: at + i * STEP, duration: 0.25, gain: 0.2 }),
  ]);
  const chord = FINAL.flatMap((note) => [
    tone(bus, { type: 'sawtooth', freq: midi(note), start: chordAt, duration: 2.2, gain: 0.12, filterFreq: 2200 }),
    tone(bus, { type: 'triangle', freq: midi(note), start: chordAt, duration: CHORD_HOLD, gain: 0.18 }),
  ]);
  const sparkle = noiseBurst(bus, chordAt, 1.6, 0.12, 4000);
  return handle([...run, ...chord, sparkle], chordAt + CHORD_HOLD);
}
