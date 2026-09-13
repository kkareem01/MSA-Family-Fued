import type { Cue, CueName } from '@feud/shared';
import { fetchSoundManifest, loadOverride, type FetchLike } from './fileOverrides';
import { SYNTHS, type Synth } from './synth';

export type SoundEngine = Readonly<{
  /** Must be called from a user gesture; creates and resumes the audio context. */
  unlock: () => Promise<void>;
  /** Looks for mp3 overrides; safe to call before or after unlock. */
  preload: () => Promise<void>;
  play: (cue: Cue) => void;
  stopTheme: () => void;
  isUnlocked: () => boolean;
  hasOverride: (name: CueName) => boolean;
}>;

export type SoundEngineDeps = Readonly<{
  createContext?: () => AudioContext;
  fetchFn?: FetchLike;
  synths?: Readonly<Record<CueName, Synth>>;
}>;

type Overrides = Readonly<Partial<Record<CueName, AudioBuffer>>>;

function defaultContext(): AudioContext {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) throw new Error('Web Audio is not supported in this browser');
  return new Ctor();
}

/**
 * Plays cues through the Web Audio API: an mp3 from the sounds folder when one exists,
 * otherwise a synthesized fallback. The theme loops when it is a file and toggles on repeat plays.
 */
export function createSoundEngine({ createContext = defaultContext, fetchFn, synths = SYNTHS }: SoundEngineDeps = {}): SoundEngine {
  let ctx: AudioContext | null = null;
  let overrides: Overrides = {};
  let theme: AudioBufferSourceNode | null = null;

  const ensureContext = (): AudioContext => {
    if (!ctx) ctx = createContext();
    return ctx;
  };

  const playBuffer = (buffer: AudioBuffer, loop: boolean): AudioBufferSourceNode => {
    const context = ensureContext();
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(context.destination);
    source.start(context.currentTime);
    return source;
  };

  const stopTheme = (): void => {
    if (!theme) return;
    try {
      theme.stop();
    } catch {
      /* already stopped */
    }
    theme = null;
  };

  const playTheme = (): void => {
    if (theme) {
      stopTheme();
      return;
    }
    const buffer = overrides.theme;
    if (buffer) {
      theme = playBuffer(buffer, true);
      theme.onended = () => {
        theme = null;
      };
      return;
    }
    synths.theme(ensureContext(), ensureContext().currentTime, { name: 'theme' });
  };

  return {
    async unlock() {
      const context = ensureContext();
      if (context.state !== 'running') await context.resume();
    },
    async preload() {
      const context = ensureContext();
      const available = await fetchSoundManifest(fetchFn);
      const entries = await Promise.all(available.map(async (name) => [name, await loadOverride(context, name, fetchFn)] as const));
      overrides = Object.fromEntries(entries.filter(([, buffer]) => buffer !== null)) as Overrides;
    },
    play(cue) {
      if (!ctx || ctx.state !== 'running') return;
      if (cue.name === 'theme') {
        playTheme();
        return;
      }
      const buffer = overrides[cue.name];
      if (buffer) {
        playBuffer(buffer, false);
        return;
      }
      synths[cue.name](ctx, ctx.currentTime, cue);
    },
    stopTheme,
    isUnlocked: () => ctx !== null && ctx.state === 'running',
    hasOverride: (name) => overrides[name] !== undefined,
  };
}
