import { CUE_NAMES, type CueName } from '@feud/shared';
import { useGameSocketContext } from '../../socket/GameSocketContext';
import { useHost } from './HostContext';

const LABELS: Record<CueName, string> = {
  reveal: 'Ding',
  strike: 'Strike',
  buzz: 'Buzzer',
  round_start: 'Round start',
  round_win: 'Round win',
  win: 'Winner',
  theme: 'Theme',
};

/** Plays a cue on this device and on the projector without touching the game. */
export function SoundTest() {
  const { sendCue } = useGameSocketContext();
  const { playCue } = useHost();
  const test = (name: CueName) => {
    void playCue({ name });
    sendCue(name);
  };
  return (
    <details className="panel">
      <summary>Sound test</summary>
      <p className="muted small">Plays on this device and on the projector. Tap Theme again to stop it.</p>
      <div className="button-grid compact">
        {CUE_NAMES.map((name) => (
          <button key={name} type="button" className="btn" onClick={() => test(name)}>
            🔊 {LABELS[name]}
          </button>
        ))}
      </div>
    </details>
  );
}
