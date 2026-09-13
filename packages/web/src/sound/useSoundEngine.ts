import { useCallback, useRef } from 'react';
import type { Cue } from '@feud/shared';
import { createSoundEngine, type SoundEngine } from './SoundEngine';

/** One engine per page; unlock from a click, then hand `play` to the socket's cue handler. */
export function useSoundEngine() {
  const engineRef = useRef<SoundEngine | null>(null);
  const engine = (): SoundEngine => {
    if (!engineRef.current) engineRef.current = createSoundEngine();
    return engineRef.current;
  };
  const unlock = useCallback(async () => {
    try {
      await engine().unlock();
      await engine().preload();
    } catch {
      /* no Web Audio; the show goes on silently */
    }
  }, []);
  const play = useCallback((cue: Cue) => {
    try {
      engine().play(cue);
    } catch {
      /* a broken cue must never crash the projector */
    }
  }, []);
  return { unlock, play };
}
