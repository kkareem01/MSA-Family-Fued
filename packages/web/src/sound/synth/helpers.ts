export type ToneOptions = Readonly<{
  type: OscillatorType;
  freq: number;
  start: number;
  duration: number;
  gain?: number;
  attack?: number;
  freqEnd?: number;
  detune?: number;
  filterFreq?: number;
}>;

const DEFAULT_GAIN = 0.25;
const DEFAULT_ATTACK = 0.01;
const MIN_GAIN = 0.0001;

/** One enveloped oscillator note, optionally sliding in pitch and passed through a lowpass. */
export function tone(ctx: AudioContext, o: ToneOptions): void {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = o.type;
  osc.frequency.setValueAtTime(o.freq, o.start);
  if (o.freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, o.start + o.duration);
  if (o.detune !== undefined) osc.detune.setValueAtTime(o.detune, o.start);
  const peak = o.gain ?? DEFAULT_GAIN;
  const attack = o.attack ?? DEFAULT_ATTACK;
  env.gain.setValueAtTime(MIN_GAIN, o.start);
  env.gain.linearRampToValueAtTime(peak, o.start + attack);
  env.gain.exponentialRampToValueAtTime(MIN_GAIN, o.start + o.duration);
  if (o.filterFreq !== undefined) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(o.filterFreq, o.start);
    osc.connect(filter);
    filter.connect(env);
  } else {
    osc.connect(env);
  }
  env.connect(ctx.destination);
  osc.start(o.start);
  osc.stop(o.start + o.duration + 0.05);
}

const NOISE_SECONDS = 1;

/** Short filtered white-noise burst, for sparkle and crowd-ish texture. */
export function noiseBurst(ctx: AudioContext, start: number, duration: number, gain: number, filterFreq: number): void {
  const length = Math.floor(ctx.sampleRate * NOISE_SECONDS);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(filterFreq, start);
  const env = ctx.createGain();
  env.gain.setValueAtTime(MIN_GAIN, start);
  env.gain.linearRampToValueAtTime(gain, start + 0.02);
  env.gain.exponentialRampToValueAtTime(MIN_GAIN, start + duration);
  source.connect(filter);
  filter.connect(env);
  env.connect(ctx.destination);
  source.start(start);
  source.stop(start + duration + 0.05);
}

/** Equal-tempered frequency for a MIDI note number. */
export function midi(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}
