import { Brand } from '../../components/Brand';
import { useHostSession } from '../../auth/HostPinContext';
import { GameSocketProvider, useGameSocketContext } from '../../socket/GameSocketContext';
import { useSoundEngine } from '../../sound/useSoundEngine';
import { ConnectionBadge } from '../../components/ConnectionBadge';
import { Toasts, useToasts } from '../../components/Toast';
import { HostProvider, useHost } from './HostContext';
import { PhaseGuide } from './PhaseGuide';
import { RoundFlow } from './RoundFlow';
import { HostNav } from './HostNav';
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
        <h1 className="display-title"><Brand /></h1>
        <button className="btn btn-ghost btn-inline" type="button" onClick={signOut}>Sign out</button>
      </div>
      <HostNav />
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
      <RoundFlow phase={state.phase} />
      <Scoreboard state={state} />
      <HostControls state={state} />
      <SoundTest />
      <SettingsPanel state={state} />
    </>
  );
}

function HostShell() {
  const { toasts, notify } = useToasts();
  const { playNow } = useSoundEngine();
  return (
    <HostProvider notify={notify} playCue={playNow}>
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
