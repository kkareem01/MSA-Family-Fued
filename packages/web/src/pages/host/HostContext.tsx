import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { isActionAllowed, type Cue, type GameAction, type GameActionType, type GameState } from '@feud/shared';
import { useGameSocketContext } from '../../socket/GameSocketContext';
import { useHostSession } from '../../auth/HostPinContext';
import type { ToastTone } from '../../components/Toast';

export type HostValue = Readonly<{
  pin: string;
  state: GameState | null;
  seq: number;
  canUndo: boolean;
  connected: boolean;
  /** Sends a game action; false (and a toast) when the server rejected it. */
  send: (action: GameAction) => Promise<boolean>;
  allowed: (type: GameActionType) => boolean;
  notify: (message: string, tone?: ToastTone) => void;
  /** Plays a cue on this device (the host's phone or laptop); false when the browser refuses audio. */
  playCue: (cue: Cue) => Promise<boolean>;
}>;

const HostContext = createContext<HostValue | null>(null);

type ProviderProps = Readonly<{ notify: HostValue['notify']; playCue: HostValue['playCue']; children: ReactNode }>;

export function HostProvider({ notify, playCue, children }: ProviderProps) {
  const { pin } = useHostSession();
  const { envelope, connected, sendAction } = useGameSocketContext();
  const state = envelope?.state ?? null;

  const send = useCallback(
    async (action: GameAction): Promise<boolean> => {
      const ack = await sendAction(action);
      if (!ack.ok) {
        notify(ack.error, 'error');
        return false;
      }
      return true;
    },
    [sendAction, notify],
  );

  const allowed = useCallback((type: GameActionType) => (state ? isActionAllowed(state.phase, type) : false), [state]);

  const value = useMemo<HostValue>(
    () => ({ pin, state, seq: envelope?.seq ?? 0, canUndo: envelope?.canUndo ?? false, connected, send, allowed, notify, playCue }),
    [pin, state, envelope?.seq, envelope?.canUndo, connected, send, allowed, notify, playCue],
  );
  return <HostContext.Provider value={value}>{children}</HostContext.Provider>;
}

export function useHost(): HostValue {
  const value = useContext(HostContext);
  if (!value) throw new Error('useHost must be used inside HostProvider');
  return value;
}
