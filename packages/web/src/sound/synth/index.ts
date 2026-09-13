import type { Cue, CueName } from '@feud/shared';
import type { AudioBus, SynthHandle } from './helpers';
import { playReveal } from './reveal';
import { playStrike } from './strike';
import { playBuzz } from './buzz';
import { playRoundStart } from './roundStart';
import { playRoundWin } from './roundWin';
import { playWin } from './win';
import { playTheme } from './theme';

export type { AudioBus, StopFn, SynthHandle } from './helpers';

export type Synth = (bus: AudioBus, at: number, cue: Cue) => SynthHandle;

export const SYNTHS: Readonly<Record<CueName, Synth>> = {
  reveal: (bus, at) => playReveal(bus, at),
  strike: (bus, at) => playStrike(bus, at),
  buzz: (bus, at) => playBuzz(bus, at),
  round_start: (bus, at) => playRoundStart(bus, at),
  round_win: (bus, at) => playRoundWin(bus, at),
  win: (bus, at) => playWin(bus, at),
  theme: (bus, at) => playTheme(bus, at),
};
