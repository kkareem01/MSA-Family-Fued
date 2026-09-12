import { useCallback, useEffect, useReducer } from 'react';
import type { Cue } from '@feud/shared';
import { fxReducer, INITIAL_FX, nextExpiry, type DisplayFx } from './fx';

/** Keeps transient flashes alive exactly as long as they should be, then clears them. */
export function useDisplayFx(): { fx: DisplayFx; onCue: (cue: Cue) => void } {
  const [fx, dispatch] = useReducer(fxReducer, INITIAL_FX);
  const onCue = useCallback((cue: Cue) => dispatch({ type: 'cue', cue, now: Date.now() }), []);

  useEffect(() => {
    const expiry = nextExpiry(fx);
    if (expiry === null) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'tick', now: Date.now() }), Math.max(0, expiry - Date.now()));
    return () => clearTimeout(timer);
  }, [fx]);

  return { fx, onCue };
}
