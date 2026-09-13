import { handle, midi, tone, type AudioBus, type SynthHandle } from './helpers';

const NOTES = [72, 76, 79, 84] as const; // C5 E5 G5 C6
const STEP = 0.11;
const TAIL_LEN = 0.7;

/** Rising arpeggio when a new question hits the board. */
export function playRoundStart(bus: AudioBus, at: number): SynthHandle {
  const tailAt = at + NOTES.length * STEP;
  const notes = NOTES.map((note, i) => tone(bus, { type: 'triangle', freq: midi(note), start: at + i * STEP, duration: 0.35, gain: 0.26 }));
  const tail = tone(bus, { type: 'sine', freq: midi(84), start: tailAt, duration: TAIL_LEN, gain: 0.22 });
  return handle([...notes, tail], tailAt + TAIL_LEN);
}
