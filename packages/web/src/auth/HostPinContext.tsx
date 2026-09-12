import { createContext, useContext } from 'react';

export type HostSession = Readonly<{ pin: string; signOut: () => void }>;

export const HostPinContext = createContext<HostSession | null>(null);

export function useHostSession(): HostSession {
  const session = useContext(HostPinContext);
  if (!session) throw new Error('useHostSession must be used inside a PinGate');
  return session;
}
