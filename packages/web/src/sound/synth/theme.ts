import { handle, midi, tone, type AudioBus, type SynthHandle } from './helpers';

const BASS = [48, 48, 55, 55, 53, 53, 55, 50] as const;
const LEAD = [72, 76, 79, 76, 74, 77, 79, 74, 72, 76, 79, 83, 81, 79, 77, 74] as const;
const BEAT = 0.22;

/** A short upbeat riff, played once per trigger. Drop a theme.mp3 in the sounds folder for the real thing. */
export function playTheme(bus: AudioBus, at: number): SynthHandle {
  const bass = BASS.map((note, i) => tone(bus, { type: 'square', freq: midi(note), start: at + i * BEAT * 2, duration: BEAT * 1.6, gain: 0.14, filterFreq: 900 }));
  const lead = LEAD.map((note, i) => tone(bus, { type: 'triangle', freq: midi(note), start: at + i * BEAT, duration: BEAT * 0.9, gain: 0.2 }));
  return handle([...bass, ...lead], at + LEAD.length * BEAT);
}
