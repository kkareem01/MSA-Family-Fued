import { handle, tone, type AudioBus, type SynthHandle } from './helpers';

const LENGTH = 0.42;

/** Face-off buzzer: a punchy square blip with a pitch drop. */
export function playBuzz(bus: AudioBus, at: number): SynthHandle {
  return handle(
    [
      tone(bus, { type: 'square', freq: 520, freqEnd: 380, start: at, duration: LENGTH, gain: 0.28, attack: 0.005, filterFreq: 2400 }),
      tone(bus, { type: 'square', freq: 260, freqEnd: 190, start: at, duration: LENGTH, gain: 0.14, attack: 0.005, filterFreq: 1200 }),
    ],
    at + LENGTH,
  );
}
