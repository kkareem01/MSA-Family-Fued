import { useCallback, useState } from 'react';
import type { Cue } from '@feud/shared';
import { GameSocketProvider, useGameSocketContext } from '../../socket/GameSocketContext';
import { useSoundEngine } from '../../sound/useSoundEngine';
import { Stage } from './Stage';
import { DisplayScene } from './DisplayScene';
import { AudioUnlockOverlay } from './AudioUnlockOverlay';
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

export function DisplayPage() {
  const [unlocked, setUnlocked] = useState(false);
  const { fx, onCue: onFxCue } = useDisplayFx();
  const sound = useSoundEngine();
  const onCue = useCallback(
    (cue: Cue) => {
      onFxCue(cue);
      sound.play(cue);
    },
    [onFxCue, sound],
  );
  const handleUnlock = () => {
    setUnlocked(true);
    void sound.unlock();
  };
  return (
    <GameSocketProvider auth={{ role: 'display' }} onCue={onCue}>
      <Stage>
        <DisplayContent fx={fx} />
        {unlocked ? null : <AudioUnlockOverlay onUnlock={handleUnlock} />}
      </Stage>
    </GameSocketProvider>
  );
}
