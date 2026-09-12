import { Link } from 'react-router-dom';
import { APP_NAME } from '@feud/shared';
import { useHostSession } from '../../auth/HostPinContext';
import { GameSocketProvider, useGameSocketContext } from '../../socket/GameSocketContext';
import { ConnectionBadge } from '../../components/ConnectionBadge';

function HostShell() {
  const { signOut } = useHostSession();
  const { envelope, connected, connectError } = useGameSocketContext();
  return (
    <main className="page page-narrow stack">
      <div className="row row-between">
        <h1 className="display-title">{APP_NAME} host</h1>
        <button className="btn btn-ghost" type="button" onClick={signOut}>Sign out</button>
      </div>
      <ConnectionBadge connected={connected} error={connectError} />
      <p>Phase: {envelope?.state.phase ?? '—'}</p>
      <Link to="/host/questions">Manage questions</Link>
    </main>
  );
}

export function HostPage() {
  const { pin } = useHostSession();
  return (
    <GameSocketProvider auth={{ role: 'host', pin }}>
      <HostShell />
    </GameSocketProvider>
  );
}
