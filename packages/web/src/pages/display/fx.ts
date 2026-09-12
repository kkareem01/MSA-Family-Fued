import type { Cue, TeamId } from '@feud/shared';
import { BUZZ_FLASH_MS, ROUND_RESULT_MS, STRIKE_FLASH_MS } from '../../config';

/** Transient, cue-driven visuals layered over the state-driven board. */
export type DisplayFx = Readonly<{
  strikeFlash: Readonly<{ count: number; until: number }> | null;
  buzzFlash: Readonly<{ team: TeamId; until: number }> | null;
  roundResultUntil: number | null;
  confettiKey: number;
}>;

export type FxEvent = Readonly<{ type: 'cue'; cue: Cue; now: number }> | Readonly<{ type: 'tick'; now: number }>;

export const INITIAL_FX: DisplayFx = { strikeFlash: null, buzzFlash: null, roundResultUntil: null, confettiKey: 0 };

function applyCue(fx: DisplayFx, cue: Cue, now: number): DisplayFx {
  switch (cue.name) {
    case 'strike':
      return { ...fx, strikeFlash: { count: cue.strikes ?? 1, until: now + STRIKE_FLASH_MS } };
    case 'buzz':
      return cue.team ? { ...fx, buzzFlash: { team: cue.team, until: now + BUZZ_FLASH_MS } } : fx;
    case 'round_win':
      return { ...fx, roundResultUntil: now + ROUND_RESULT_MS };
    case 'win':
      return { ...fx, confettiKey: fx.confettiKey + 1 };
    default:
      return fx;
  }
}

function expire(fx: DisplayFx, now: number): DisplayFx {
  const strikeFlash = fx.strikeFlash && fx.strikeFlash.until > now ? fx.strikeFlash : null;
  const buzzFlash = fx.buzzFlash && fx.buzzFlash.until > now ? fx.buzzFlash : null;
  const roundResultUntil = fx.roundResultUntil !== null && fx.roundResultUntil > now ? fx.roundResultUntil : null;
  if (strikeFlash === fx.strikeFlash && buzzFlash === fx.buzzFlash && roundResultUntil === fx.roundResultUntil) return fx;
  return { ...fx, strikeFlash, buzzFlash, roundResultUntil };
}

export function fxReducer(fx: DisplayFx, event: FxEvent): DisplayFx {
  return event.type === 'cue' ? applyCue(fx, event.cue, event.now) : expire(fx, event.now);
}

/** Earliest pending expiry, so the ticker can sleep until something actually changes. */
export function nextExpiry(fx: DisplayFx): number | null {
  const times = [fx.strikeFlash?.until, fx.buzzFlash?.until, fx.roundResultUntil].filter((t): t is number => typeof t === 'number');
  return times.length === 0 ? null : Math.min(...times);
}
