import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Cue, CueName } from '@feud/shared';
import { createSoundEngine, type SoundEngine, type SoundEngineDeps, type SoundStatus } from './SoundEngine';

export type SoundControls = Readonly<{
  status: SoundStatus;
  /** Call from a click or key press; true when sound is on afterwards. */
  unlock: () => Promise<boolean>;
  /** For cues arriving from the server: plays when sound is on, otherwise stays quiet. */
  play: (cue: Cue) => void;
  /** For buttons: unlocks inside the same gesture, then plays. */
  playNow: (cue: Cue) => Promise<boolean>;
  hasOverride: (name: CueName) => boolean;
}>;

/** One engine per page. Nothing touches the browser until the first unlock, so it is safe everywhere. */
export function useSoundEngine(deps?: SoundEngineDeps): SoundControls {
  const engineRef = useRef<SoundEngine | null>(null);
  const depsRef = useRef(deps);
  const preloaded = useRef(false);
  const [status, setStatus] = useState<SoundStatus>('off');

  const engine = useCallback((): SoundEngine => {
    if (!engineRef.current) engineRef.current = createSoundEngine(depsRef.current);
    return engineRef.current;
  }, []);

  useEffect(() => {
    setStatus(engine().status());
    return engine().subscribe(setStatus);
  }, [engine]);

  const preloadOnce = useCallback(async (): Promise<void> => {
    if (preloaded.current) return;
    preloaded.current = true;
    try {
      await engine().preload();
    } catch {
      /* mp3 overrides are optional */
    }
  }, [engine]);

  const unlock = useCallback(async (): Promise<boolean> => {
    const ok = await engine().unlock();
    if (ok) await preloadOnce();
    return ok;
  }, [engine, preloadOnce]);

  const play = useCallback(
    (cue: Cue) => {
      try {
        engine().play(cue);
      } catch {
        /* a broken cue must never crash the page */
      }
    },
    [engine],
  );

  const playNow = useCallback(
    async (cue: Cue): Promise<boolean> => {
      const ok = await engine().unlock();
      if (!ok) return false;
      void preloadOnce();
      play(cue);
      return true;
    },
    [engine, preloadOnce, play],
  );

  const hasOverride = useCallback((name: CueName) => engine().hasOverride(name), [engine]);

  return useMemo(() => ({ status, unlock, play, playNow, hasOverride }), [status, unlock, play, playNow, hasOverride]);
}
