import { Brand } from '../components/Brand';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useHostPin } from './useHostPin';
import { HostPinContext } from './HostPinContext';

type PinFormProps = Readonly<{ onSubmit: (pin: string) => Promise<boolean>; error: string | null; busy: boolean }>;

function PinForm({ onSubmit, error, busy }: PinFormProps) {
  const [value, setValue] = useState('');
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void onSubmit(value);
  };
  return (
    <main className="page page-center">
      <form className="card stack" onSubmit={handleSubmit} aria-label="Host sign in">
        <h1 className="display-title"><Brand /></h1>
        <p className="muted">Enter the host PIN to open the control panel.</p>
        <label className="field">
          <span>Host PIN</span>
          <input
            type="password"
            inputMode="text"
            autoComplete="off"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={busy}
          />
        </label>
        {error ? <p className="error-text" role="alert">{error}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={busy || value.trim().length === 0}>
          {busy ? 'Checking…' : 'Open host panel'}
        </button>
      </form>
    </main>
  );
}

/** Wraps host-only pages: shows a PIN form until the server confirms the PIN. */
export function PinGate({ children }: { children: ReactNode }) {
  const host = useHostPin();
  if (host.status === 'signed_in' && host.pin) {
    return <HostPinContext.Provider value={{ pin: host.pin, signOut: host.signOut }}>{children}</HostPinContext.Provider>;
  }
  return <PinForm onSubmit={host.signIn} error={host.error} busy={host.status === 'checking'} />;
}
