import { otherTeam, type GameState } from '@feud/shared';
import { useHost } from './HostContext';

export function PlayOrPassControls({ state }: { state: GameState }) {
  const { send } = useHost();
  const winner = state.round.faceoff.winner;
  if (!winner) return null;
  const winnerName = state.teams[winner].name;
  const otherName = state.teams[otherTeam(winner)].name;
  return (
    <section className="panel stack">
      <h2>{winnerName} won the face-off</h2>
      <div className="button-grid">
        <button type="button" className="btn btn-primary btn-big" onClick={() => void send({ type: 'CHOOSE_PLAY_OR_PASS', choice: 'play' })}>
          Play ({winnerName} keeps it)
        </button>
        <button type="button" className="btn btn-gold btn-big" onClick={() => void send({ type: 'CHOOSE_PLAY_OR_PASS', choice: 'pass' })}>
          Pass (to {otherName})
        </button>
      </div>
    </section>
  );
}
