import { APP_NAME, type GameState } from '@feud/shared';
import { QrCorner } from './QrCorner';

type Props = Readonly<{ state: GameState; surveyUrl: string | null }>;

export function IdleScreen({ state, surveyUrl }: Props) {
  const played = state.round.index > 0;
  return (
    <div className="idle-screen">
      <div className="idle-title-block">
        <span className="idle-kicker">{played ? 'Next round coming up' : 'Welcome to'}</span>
        <h1 className="idle-title">{APP_NAME}</h1>
        <div className="idle-scores">
          <span>{state.teams.A.name} · {state.teams.A.score}</span>
          <span>{state.teams.B.name} · {state.teams.B.score}</span>
        </div>
      </div>
      <div className="idle-qr">
        {surveyUrl ? (
          <QrCorner url={surveyUrl} size="large" caption="Scan to answer the survey" />
        ) : (
          <div className="idle-qr-placeholder">Survey link not set yet</div>
        )}
      </div>
    </div>
  );
}
