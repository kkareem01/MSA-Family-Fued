import { describe, expect, it } from 'vitest';
import { fxReducer, INITIAL_FX, nextExpiry } from './fx';
import { BUZZ_FLASH_MS, ROUND_RESULT_MS, STRIKE_FLASH_MS } from '../../config';

describe('fxReducer', () => {
  it('starts a strike flash with the strike count and clears it after the flash time', () => {
    const lit = fxReducer(INITIAL_FX, { type: 'cue', cue: { name: 'strike', strikes: 2 }, now: 1000 });
    expect(lit.strikeFlash).toEqual({ count: 2, until: 1000 + STRIKE_FLASH_MS });
    expect(fxReducer(lit, { type: 'tick', now: 1000 + STRIKE_FLASH_MS - 1 })).toBe(lit);
    expect(fxReducer(lit, { type: 'tick', now: 1000 + STRIKE_FLASH_MS }).strikeFlash).toBeNull();
  });

  it('defaults a strike cue without a count to one X', () => {
    expect(fxReducer(INITIAL_FX, { type: 'cue', cue: { name: 'strike' }, now: 0 }).strikeFlash?.count).toBe(1);
  });

  it('flashes the buzzing team and the round result', () => {
    const buzzed = fxReducer(INITIAL_FX, { type: 'cue', cue: { name: 'buzz', team: 'B' }, now: 5 });
    expect(buzzed.buzzFlash).toEqual({ team: 'B', until: 5 + BUZZ_FLASH_MS });
    const won = fxReducer(buzzed, { type: 'cue', cue: { name: 'round_win', team: 'A' }, now: 10 });
    expect(won.roundResultUntil).toBe(10 + ROUND_RESULT_MS);
    expect(nextExpiry(won)).toBe(5 + BUZZ_FLASH_MS);
    expect(fxReducer(won, { type: 'tick', now: 99_999 })).toEqual({ ...INITIAL_FX });
  });

  it('bumps the confetti key on a win and ignores unrelated cues', () => {
    const win = fxReducer(INITIAL_FX, { type: 'cue', cue: { name: 'win', team: 'A' }, now: 0 });
    expect(win.confettiKey).toBe(1);
    expect(fxReducer(win, { type: 'cue', cue: { name: 'reveal', rank: 1 }, now: 0 })).toBe(win);
    expect(fxReducer(INITIAL_FX, { type: 'cue', cue: { name: 'buzz' }, now: 0 })).toBe(INITIAL_FX);
    expect(nextExpiry(INITIAL_FX)).toBeNull();
  });
});
