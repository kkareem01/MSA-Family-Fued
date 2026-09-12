import { CUE_NAMES, type CueName } from '@feud/shared';
import { useGameSocketContext } from '../../socket/GameSocketContext';

const LABELS: Record<CueName, string> = {
  reveal: 'Ding',
  strike: 'Strike',
  buzz: 'Buzzer',
  round_start: 'Round start',
  round_win: 'Round win',
  win: 'Winner',
  theme: 'Theme',
};

/** Plays a cue on the projector without touching the game. */
export function SoundTest() {
  const { sendCue } = useGameSocketContext();
  return (
    <details className="panel">
      <summary>Sound test</summary>
      <div className="button-grid compact">
        {CUE_NAMES.map((name) => (
          <button key={name} type="button" className="btn" onClick={() => sendCue(name)}>
            🔊 {LABELS[name]}
          </button>
        ))}
      </div>
    </details>
  );
}
