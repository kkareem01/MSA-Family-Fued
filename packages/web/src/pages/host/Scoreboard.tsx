import { useState } from 'react';
import { selectPot, TEAM_NAME_MAX_LEN, type GameState, type TeamId } from '@feud/shared';
import { useHost } from './HostContext';

const STEPS = [-5, -1, 1, 5] as const;

function TeamCard({ state, team }: { state: GameState; team: TeamId }) {
  const { send } = useHost();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(state.teams[team].name);
  const info = state.teams[team];
  const inControl = state.round.controlTeam === team && (state.phase === 'in_play' || state.phase === 'steal');

  const commitName = async () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== info.name) await send({ type: 'SET_TEAM_NAME', team, name: draft.trim() });
  };

  return (
    <div className={`team-card${inControl ? ' control' : ''}`}>
      {editing ? (
        <input
          className="input team-name-input"
          value={draft}
          maxLength={TEAM_NAME_MAX_LEN}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commitName()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void commitName();
            if (e.key === 'Escape') setEditing(false);
          }}
          aria-label={`Team ${team} name`}
        />
      ) : (
        <button type="button" className="team-name" onClick={() => { setDraft(info.name); setEditing(true); }} title="Tap to rename">
          {info.name} <span className="muted small">✎</span>
        </button>
      )}
      <div className="team-score">{info.score}</div>
      <div className="score-steps">
        {STEPS.map((delta) => (
          <button key={delta} type="button" className="btn btn-ghost btn-step" onClick={() => void send({ type: 'ADJUST_SCORE', team, delta })}>
            {delta > 0 ? `+${delta}` : delta}
          </button>
        ))}
      </div>
      {inControl ? <span className="pill pill-finalized">In control</span> : null}
    </div>
  );
}

export function Scoreboard({ state }: { state: GameState }) {
  const pot = selectPot(state.round);
  return (
    <section className="scoreboard" aria-label="Scores">
      <TeamCard state={state} team="A" />
      <div className="pot-mini">
        <span className="muted small">Round {state.round.index || '–'}{state.round.multiplier > 1 ? ` · ×${state.round.multiplier}` : ''}</span>
        <span className="pot-mini-value">{pot}</span>
        <span className="muted small">pot</span>
      </div>
      <TeamCard state={state} team="B" />
    </section>
  );
}
