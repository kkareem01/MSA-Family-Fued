import { handle, tone, type AudioBus, type SynthHandle } from './helpers';

const SECOND_NOTE_AT = 0.09;
const SECOND_NOTE_LEN = 0.45;

/** Bright two-note "ding" when a tile flips. */
export function playReveal(bus: AudioBus, at: number): SynthHandle {
  return handle(
    [
      tone(bus, { type: 'sine', freq: 880, start: at, duration: 0.16, gain: 0.3 }),
      tone(bus, { type: 'sine', freq: 1320, start: at + SECOND_NOTE_AT, duration: SECOND_NOTE_LEN, gain: 0.32 }),
      tone(bus, { type: 'triangle', freq: 2640, start: at + SECOND_NOTE_AT, duration: 0.3, gain: 0.08 }),
    ],
    at + SECOND_NOTE_AT + SECOND_NOTE_LEN,
  );
}
