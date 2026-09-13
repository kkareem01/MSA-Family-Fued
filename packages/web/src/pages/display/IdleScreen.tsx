import { APP_NAME, type GameState } from '@feud/shared';
import { QrCorner } from './QrCorner';

type Props = Readonly<{ state: GameState; surveyUrl: string | null; openCount?: number | null }>;

function openLine(count: number | null | undefined): string | null {
  if (!count) return null;
  return `${count} question${count === 1 ? '' : 's'} open right now`;
}

export function IdleScreen({ state, surveyUrl, openCount }: Props) {
  const played = state.round.index > 0;
  const open = openLine(openCount);
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
        {open ? <span className="idle-open">{open}</span> : null}
      </div>
    </div>
  );
}
