import { TEAM_IDS, type GameState, type TeamId } from '@feud/shared';
import { useHost } from './HostContext';

export function FaceoffControls({ state }: { state: GameState }) {
  const { send } = useHost();
  const { faceoff } = state.round;
  const answering = state.phase === 'faceoff_answering';
  const canRelock = (team: TeamId) => !answering || (faceoff.attempts.length === 0 && faceoff.lockedTeam !== team);
  const status = answering
    ? `${state.teams[faceoff.lockedTeam ?? 'A'].name} buzzed first${faceoff.lockedBy === 'host' ? ' (set by host)' : ''}.`
    : 'Buzzers are open on the players’ phones.';

  return (
    <section className="panel stack">
      <h2>Face-off</h2>
      <p className="muted">{status}</p>
      <div className="button-grid">
        {TEAM_IDS.map((team) => (
          <button
            key={team}
            type="button"
            className="btn btn-gold"
            disabled={!canRelock(team)}
            onClick={() => void send({ type: 'LOCK_BUZZER', team, source: 'host', at: Date.now() })}
          >
            {answering ? 'Switch to' : 'Lock in'} {state.teams[team].name}
          </button>
        ))}
        <button type="button" className="btn btn-ghost" onClick={() => void send({ type: 'RESET_BUZZER' })}>
          Reset buzzers
        </button>
        <span className="muted small full-row">Skip the face-off and hand control straight to a team:</span>
        {TEAM_IDS.map((team) => (
          <button key={`ctl-${team}`} type="button" className="btn" onClick={() => void send({ type: 'SET_CONTROL', team })}>
            Give control to {state.teams[team].name}
          </button>
        ))}
      </div>
    </section>
  );
}
