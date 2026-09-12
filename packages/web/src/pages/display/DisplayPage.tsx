import { APP_NAME } from '@feud/shared';
import { GameSocketProvider, useGameSocketContext } from '../../socket/GameSocketContext';
import { ConnectionBadge } from '../../components/ConnectionBadge';

function DisplayShell() {
  const { envelope, connected, connectError } = useGameSocketContext();
  return (
    <main className="page stack">
      <h1 className="display-title">{APP_NAME}</h1>
      <ConnectionBadge connected={connected} error={connectError} />
      <p>Phase: {envelope?.state.phase ?? '—'}</p>
    </main>
  );
}

export function DisplayPage() {
  return (
    <GameSocketProvider auth={{ role: 'display' }}>
      <DisplayShell />
    </GameSocketProvider>
  );
}
