/** Where every synth plugs in: the context plus the master bus node that leads to the speakers. */
export type AudioBus = Readonly<{ ctx: AudioContext; out: AudioNode }>;
export type StopFn = () => void;
/** What a synth hands back: a way to cut it short, and when it would end on its own. */
export type SynthHandle = Readonly<{ stop: StopFn; endsAt: number }>;
type Stoppable = Readonly<{ stop: (when?: number) => void }>;

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
const RELEASE_TAIL = 0.05;

/** Bundles scheduled nodes into one handle; stopping twice or after the end is harmless. */
export function handle(nodes: readonly Stoppable[], endsAt: number): SynthHandle {
  return {
    endsAt,
    stop: () =>
      nodes.forEach((node) => {
        try {
          node.stop();
        } catch {
          /* already stopped */
        }
      }),
  };
}

function envelope(ctx: AudioContext, start: number, peak: number, attack: number, duration: number): GainNode {
  const env = ctx.createGain();
  env.gain.setValueAtTime(MIN_GAIN, start);
  env.gain.linearRampToValueAtTime(peak, start + attack);
  env.gain.exponentialRampToValueAtTime(MIN_GAIN, start + duration);
  return env;
}

/** One enveloped oscillator note, optionally sliding in pitch and passed through a lowpass. */
export function tone({ ctx, out }: AudioBus, o: ToneOptions): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = o.type;
  osc.frequency.setValueAtTime(o.freq, o.start);
  if (o.freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, o.start + o.duration);
  if (o.detune !== undefined) osc.detune.setValueAtTime(o.detune, o.start);
  const env = envelope(ctx, o.start, o.gain ?? DEFAULT_GAIN, o.attack ?? DEFAULT_ATTACK, o.duration);
  if (o.filterFreq !== undefined) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(o.filterFreq, o.start);
    osc.connect(filter);
    filter.connect(env);
  } else {
    osc.connect(env);
  }
  env.connect(out);
  osc.start(o.start);
  osc.stop(o.start + o.duration + RELEASE_TAIL);
  return osc;
}

const NOISE_SECONDS = 1;
const NOISE_ATTACK = 0.02;

/** Short filtered white-noise burst, for sparkle and crowd-ish texture. */
export function noiseBurst({ ctx, out }: AudioBus, start: number, duration: number, gain: number, filterFreq: number): AudioBufferSourceNode {
  const length = Math.floor(ctx.sampleRate * NOISE_SECONDS);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(filterFreq, start);
  const env = envelope(ctx, start, gain, NOISE_ATTACK, duration);
  source.connect(filter);
  filter.connect(env);
  env.connect(out);
  source.start(start);
  source.stop(start + duration + RELEASE_TAIL);
  return source;
}

/** Equal-tempered frequency for a MIDI note number. */
export function midi(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}
