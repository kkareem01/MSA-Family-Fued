import { Link } from 'react-router-dom';
import { APP_NAME } from '@feud/shared';
import { useHostSession } from '../../auth/HostPinContext';
import { GameSocketProvider, useGameSocketContext } from '../../socket/GameSocketContext';
import { ConnectionBadge } from '../../components/ConnectionBadge';
import { Toasts, useToasts } from '../../components/Toast';
import { HostProvider, useHost } from './HostContext';
import { PhaseGuide } from './PhaseGuide';
import { Scoreboard } from './Scoreboard';
import { HostControls } from './HostControls';
import { UndoButton } from './UndoButton';
import { SoundTest } from './SoundTest';
import { SettingsPanel } from './SettingsPanel';
import './host.css';

function HostHeader() {
  const { signOut } = useHostSession();
  const { connected, connectError } = useGameSocketContext();
  const { seq } = useHost();
  return (
    <header className="host-header">
      <div className="row row-between">
        <h1 className="display-title">{APP_NAME}</h1>
        <div className="row">
          <Link className="btn btn-ghost btn-inline" to="/host/questions">Questions</Link>
          <button className="btn btn-ghost btn-inline" type="button" onClick={signOut}>Sign out</button>
        </div>
      </div>
      <div className="row row-between">
        <ConnectionBadge connected={connected} error={connectError} />
        <span className="muted small">#{seq}</span>
        <UndoButton />
      </div>
    </header>
  );
}

function HostBody() {
  const { state } = useHost();
  if (!state) return <p className="muted">Waiting for the game state…</p>;
  return (
    <>
      <PhaseGuide state={state} />
      <Scoreboard state={state} />
      <HostControls state={state} />
      <SoundTest />
      <SettingsPanel state={state} />
    </>
  );
}

function HostShell() {
  const { toasts, notify } = useToasts();
  return (
    <HostProvider notify={notify}>
      <main className="page page-narrow host-page stack stack-lg">
        <HostHeader />
        <HostBody />
      </main>
      <Toasts toasts={toasts} />
    </HostProvider>
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
