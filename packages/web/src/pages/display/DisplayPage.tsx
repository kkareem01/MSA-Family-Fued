import { useCallback, useEffect, useState } from 'react';
import type { Cue } from '@feud/shared';
import { GameSocketProvider, useGameSocketContext } from '../../socket/GameSocketContext';
import { useSoundEngine } from '../../sound/useSoundEngine';
import { Stage } from './Stage';
import { DisplayScene } from './DisplayScene';
import { AudioUnlockOverlay } from './AudioUnlockOverlay';
import { SoundBadge } from './SoundBadge';
import { useDisplayFx } from './useDisplayFx';
import './display.css';

function ConnectingScreen({ error }: { error: string | null }) {
  return (
    <div className="connecting-screen">
      <span className="overlay-kicker">MSA Family Feud</span>
      <span className="overlay-title">{error ? 'Connection problem' : 'Connecting…'}</span>
      {error ? <span className="overlay-sub">{error}</span> : null}
    </div>
  );
}

function DisplayContent({ fx }: { fx: ReturnType<typeof useDisplayFx>['fx'] }) {
  const { envelope, meta, connectError } = useGameSocketContext();
  if (!envelope) return <ConnectingScreen error={connectError} />;
  return <DisplayScene state={envelope.state} meta={meta} fx={fx} />;
}

/** Tells the server whether this screen can make sound, on connect and whenever that changes. */
function SoundReporter({ on }: { on: boolean }) {
  const { connected, sendDisplayStatus } = useGameSocketContext();
  useEffect(() => {
    if (connected) sendDisplayStatus(on);
  }, [connected, on, sendDisplayStatus]);
  return null;
}

/** Any key press retries audio while the browser keeps it paused, so the host never needs the mouse. */
function useKeyRetry(active: boolean, retry: () => void): void {
  useEffect(() => {
    if (!active) return undefined;
    window.addEventListener('keydown', retry);
    return () => window.removeEventListener('keydown', retry);
  }, [active, retry]);
}

export function DisplayPage() {
  const [unlocked, setUnlocked] = useState(false);
  const { fx, onCue: onFxCue } = useDisplayFx();
  const { play, unlock, status } = useSoundEngine();
  const onCue = useCallback(
    (cue: Cue) => {
      onFxCue(cue);
      play(cue);
    },
    [onFxCue, play],
  );
  const handleUnlock = () => {
    setUnlocked(true);
    void unlock();
  };
  const retry = useCallback(() => {
    if (status !== 'on') void unlock();
  }, [status, unlock]);
  useKeyRetry(unlocked && status !== 'on', retry);
  return (
    <GameSocketProvider auth={{ role: 'display' }} onCue={onCue}>
      <SoundReporter on={status === 'on'} />
      <Stage>
        <div className="stage-input" onClick={retry}>
          <DisplayContent fx={fx} />
          {unlocked ? <SoundBadge status={status} onRetry={retry} /> : null}
        </div>
        {unlocked ? null : <AudioUnlockOverlay onUnlock={handleUnlock} />}
      </Stage>
    </GameSocketProvider>
  );
}
