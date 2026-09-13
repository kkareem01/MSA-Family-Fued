import type { Cue, CueName } from '@feud/shared';
import { playReveal } from './reveal';
import { playStrike } from './strike';
import { playBuzz } from './buzz';
import { playRoundStart } from './roundStart';
import { playRoundWin } from './roundWin';
import { playWin } from './win';
import { playTheme } from './theme';

export type Synth = (ctx: AudioContext, at: number, cue: Cue) => void;

export const SYNTHS: Readonly<Record<CueName, Synth>> = {
  reveal: (ctx, at) => playReveal(ctx, at),
  strike: (ctx, at) => playStrike(ctx, at),
  buzz: (ctx, at) => playBuzz(ctx, at),
  round_start: (ctx, at) => playRoundStart(ctx, at),
  round_win: (ctx, at) => playRoundWin(ctx, at),
  win: (ctx, at) => playWin(ctx, at),
  theme: (ctx, at) => {
    playTheme(ctx, at);
  },
};
