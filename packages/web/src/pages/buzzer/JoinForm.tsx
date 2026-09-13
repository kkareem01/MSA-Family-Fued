import { useState, type FormEvent } from 'react';
import { APP_NAME, TEAM_IDS, type TeamId } from '@feud/shared';
import type { BuzzerJoin } from './useBuzzerJoin';

type Props = Readonly<{ onJoin: (join: BuzzerJoin) => void; error: string | null }>;

const CODE_LEN = 4;

export function JoinForm({ onJoin, error }: Props) {
  const [team, setTeam] = useState<TeamId>('A');
  const [code, setCode] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onJoin({ team, code });
  };
  return (
    <form className="buzzer-join" onSubmit={submit}>
      <span className="survey-kicker">Buzzer</span>
      <h1 className="survey-title">{APP_NAME}</h1>
      <p className="survey-sub">Ask the host for your team's 4-letter code.</p>
      <div className="buzzer-team-pick" role="radiogroup" aria-label="Team">
        {TEAM_IDS.map((id) => (
          <button key={id} type="button" role="radio" aria-checked={team === id} className={`buzzer-team${team === id ? ' selected' : ''}`} onClick={() => setTeam(id)}>
            Team {id}
          </button>
        ))}
      </div>
      <input
        className="input buzzer-code"
        value={code}
        maxLength={CODE_LEN}
        placeholder="CODE"
        autoCapitalize="characters"
        autoComplete="off"
        inputMode="text"
        aria-label="Team code"
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />
      {error ? <p className="survey-error" role="alert">{error}</p> : null}
      <button type="submit" className="survey-submit" disabled={code.trim().length !== CODE_LEN}>Join</button>
      <ul className="buzzer-how">
        <li>The button lights up when the host starts a face-off.</li>
        <li>Tap it when you know the answer. First tap wins.</li>
        <li>Say your answer out loud; the host taps it in.</li>
      </ul>
    </form>
  );
}
