import { useEffect, useState } from 'react';
import { SOCKET_ERRORS } from '@feud/shared';
import { useGameSocket } from '../../socket/useGameSocket';
import { ConnectionBadge } from '../../components/ConnectionBadge';
import { useBuzzerJoin } from './useBuzzerJoin';
import { JoinForm } from './JoinForm';
import { BuzzButton } from './BuzzButton';
import { buzzerView } from './buzzerStatus';
import '../survey/survey.css';
import './buzzer.css';

const ERROR_TEXT: Record<string, string> = {
  [SOCKET_ERRORS.badCode]: 'That code is not right. Check it with the host.',
  [SOCKET_ERRORS.badAuth]: 'Could not join. Try the link again.',
};

const VIBRATE_MS = 200;

function vibrate(): void {
  try {
    navigator.vibrate?.(VIBRATE_MS);
  } catch {
    /* not supported */
  }
}

export function BuzzerPage() {
  const { join, start, leave } = useBuzzerJoin();
  const [tapped, setTapped] = useState(false);
  const auth = join ? ({ role: 'buzzer', team: join.team, code: join.code } as const) : null;
  const { buzzerState, connected, connectError, buzz } = useGameSocket(auth);
  const view = buzzerView(buzzerState, connected, tapped);

  /** A new open face-off resets the local tap; a win buzzes the phone. */
  useEffect(() => {
    if (view.status === 'open' || view.status === 'closed') setTapped(false);
    if (view.status === 'you') vibrate();
  }, [view.status]);

  if (!join || (connectError && ERROR_TEXT[connectError])) {
    const error = connectError ? (ERROR_TEXT[connectError] ?? null) : null;
    return (
      <main className="survey-page buzzer-page">
        <JoinForm onJoin={start} error={error} />
      </main>
    );
  }

  const handleBuzz = () => {
    setTapped(true);
    buzz();
  };

  return (
    <main className={`survey-page buzzer-page status-${view.status}`}>
      <header className="buzzer-header">
        <span className="survey-kicker">{buzzerState?.teamName ?? `Team ${join.team}`}</span>
        <ConnectionBadge connected={connected} error={connectError} />
      </header>
      <BuzzButton view={view} onBuzz={handleBuzz} />
      <button type="button" className="buzzer-leave" onClick={leave}>Change team or code</button>
    </main>
  );
}
