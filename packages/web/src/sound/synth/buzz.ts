import { tone } from './helpers';

/** Face-off buzzer: a punchy square blip with a pitch drop. */
export function playBuzz(ctx: AudioContext, at: number): void {
  tone(ctx, { type: 'square', freq: 520, freqEnd: 380, start: at, duration: 0.42, gain: 0.28, attack: 0.005, filterFreq: 2400 });
  tone(ctx, { type: 'square', freq: 260, freqEnd: 190, start: at, duration: 0.42, gain: 0.14, attack: 0.005, filterFreq: 1200 });
}
