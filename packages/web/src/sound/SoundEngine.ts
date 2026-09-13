import type { Cue, CueName } from '@feud/shared';
import { fetchSoundManifest, loadOverride, type FetchLike } from './fileOverrides';
import { SYNTHS, type AudioBus, type Synth, type SynthHandle } from './synth';

/** off: no audio context yet (or none available); locked: the browser is holding it; on: sound plays. */
export type SoundStatus = 'off' | 'locked' | 'on';
export type SoundListener = (status: SoundStatus) => void;

export type SoundEngine = Readonly<{
  /** Call from a user gesture. Creates and resumes the context; true when sound is on afterwards. Never throws. */
  unlock: () => Promise<boolean>;
  /** Looks for mp3 overrides; safe to call before or after unlock. */
  preload: () => Promise<void>;
  /** Plays a cue now, or as soon as a paused context resumes. Silent until the first unlock. */
  play: (cue: Cue) => void;
  stopTheme: () => void;
  status: () => SoundStatus;
  subscribe: (listener: SoundListener) => () => void;
  isUnlocked: () => boolean;
  hasOverride: (name: CueName) => boolean;
}>;

export type SoundEngineDeps = Readonly<{
  createContext?: () => AudioContext;
  fetchFn?: FetchLike;
  synths?: Readonly<Record<CueName, Synth>>;
}>;

type Overrides = Readonly<Partial<Record<CueName, AudioBuffer>>>;

/** Makeup gain into a gentle compressor: loud enough for a projector speaker, no clipping when cues overlap. */
const MASTER_GAIN = 1.4;
const COMPRESSOR = { threshold: -18, knee: 12, ratio: 4, attack: 0.003, release: 0.25 } as const;

function defaultContext(): AudioContext {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) throw new Error('Web Audio is not supported in this browser');
  return new Ctor();
}

function createBus(ctx: AudioContext): AudioBus {
  const gain = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();
  gain.gain.value = MASTER_GAIN;
  compressor.threshold.value = COMPRESSOR.threshold;
  compressor.knee.value = COMPRESSOR.knee;
  compressor.ratio.value = COMPRESSOR.ratio;
  compressor.attack.value = COMPRESSOR.attack;
  compressor.release.value = COMPRESSOR.release;
  gain.connect(compressor);
  compressor.connect(ctx.destination);
  return { ctx, out: gain };
}

function statusOf(bus: AudioBus | null): SoundStatus {
  if (!bus) return 'off';
  return bus.ctx.state === 'running' ? 'on' : 'locked';
}

function stopQuietly(node: AudioScheduledSourceNode): void {
  try {
    node.stop();
  } catch {
    /* already stopped */
  }
}

/**
 * Plays cues through the Web Audio API: an mp3 from the sounds folder when one exists,
 * otherwise a synthesized fallback. Everything runs through one master bus. The theme toggles on repeat plays.
 */
export function createSoundEngine({ createContext = defaultContext, fetchFn, synths = SYNTHS }: SoundEngineDeps = {}): SoundEngine {
  let bus: AudioBus | null = null;
  let overrides: Overrides = {};
  let theme: SynthHandle | null = null;
  let hadGesture = false;
  let lastStatus: SoundStatus = 'off';
  const listeners = new Set<SoundListener>();

  const notify = (): void => {
    const next = statusOf(bus);
    if (next === lastStatus) return;
    lastStatus = next;
    listeners.forEach((listener) => listener(next));
  };

  const ensureBus = (): AudioBus => {
    if (bus) return bus;
    const ctx = createContext();
    bus = createBus(ctx);
    ctx.onstatechange = notify;
    notify();
    return bus;
  };

  const playBuffer = (b: AudioBus, buffer: AudioBuffer, loop: boolean): AudioBufferSourceNode => {
    const source = b.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(b.out);
    source.start(b.ctx.currentTime);
    return source;
  };

  const stopTheme = (): void => {
    if (!theme) return;
    const current = theme;
    theme = null;
    current.stop();
  };

  const loopingTheme = (b: AudioBus, buffer: AudioBuffer): SynthHandle => {
    const source = playBuffer(b, buffer, true);
    return { endsAt: Number.POSITIVE_INFINITY, stop: () => stopQuietly(source) };
  };

  const playTheme = (b: AudioBus): void => {
    if (theme && b.ctx.currentTime < theme.endsAt) {
      stopTheme();
      return;
    }
    const buffer = overrides.theme;
    theme = buffer ? loopingTheme(b, buffer) : synths.theme(b, b.ctx.currentTime, { name: 'theme' });
  };

  const playNow = (b: AudioBus, cue: Cue): void => {
    if (cue.name === 'theme') {
      playTheme(b);
      return;
    }
    const buffer = overrides[cue.name];
    if (buffer) {
      playBuffer(b, buffer, false);
      return;
    }
    synths[cue.name](b, b.ctx.currentTime, cue);
  };

  const resumeThenPlay = (b: AudioBus, cue: Cue): void => {
    b.ctx
      .resume()
      .then(() => {
        if (b.ctx.state === 'running') playNow(b, cue);
      })
      .catch(() => undefined)
      .finally(notify);
  };

  return {
    async unlock() {
      try {
        const b = ensureBus();
        hadGesture = true;
        if (b.ctx.state !== 'running') await b.ctx.resume();
      } catch {
        /* no Web Audio, or the browser refused; the status says so */
      }
      notify();
      return statusOf(bus) === 'on';
    },
    async preload() {
      const { ctx } = ensureBus();
      const available = await fetchSoundManifest(fetchFn);
      const entries = await Promise.all(available.map(async (name) => [name, await loadOverride(ctx, name, fetchFn)] as const));
      overrides = Object.fromEntries(entries.filter(([, buffer]) => buffer !== null)) as Overrides;
    },
    play(cue) {
      if (!bus) return;
      if (bus.ctx.state === 'running') {
        playNow(bus, cue);
        return;
      }
      if (bus.ctx.state === 'suspended' && hadGesture) resumeThenPlay(bus, cue);
    },
    stopTheme,
    status: () => statusOf(bus),
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    isUnlocked: () => statusOf(bus) === 'on',
    hasOverride: (name) => overrides[name] !== undefined,
  };
}
