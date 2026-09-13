import { handle, tone, type AudioBus, type SynthHandle } from './helpers';

const LENGTH = 0.75;

/** Harsh low buzz for a strike. Slightly detuned pair so it growls. */
export function playStrike(bus: AudioBus, at: number): SynthHandle {
  return handle(
    [
      tone(bus, { type: 'sawtooth', freq: 110, start: at, duration: LENGTH, gain: 0.35, attack: 0.005, filterFreq: 700 }),
      tone(bus, { type: 'sawtooth', freq: 116, start: at, duration: LENGTH, gain: 0.3, attack: 0.005, filterFreq: 700 }),
      tone(bus, { type: 'square', freq: 55, start: at, duration: 0.7, gain: 0.12, filterFreq: 400 }),
    ],
    at + LENGTH,
  );
}
