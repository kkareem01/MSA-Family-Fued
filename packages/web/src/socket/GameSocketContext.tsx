import { createContext, useContext, type ReactNode } from 'react';
import type { Cue, SocketAuth } from '@feud/shared';
import { useGameSocket, type GameSocketValue } from './useGameSocket';

const GameSocketContext = createContext<GameSocketValue | null>(null);

export type GameSocketProviderProps = Readonly<{ auth: SocketAuth | null; onCue?: (cue: Cue) => void; children: ReactNode }>;

export function GameSocketProvider({ auth, onCue, children }: GameSocketProviderProps) {
  const value = useGameSocket(auth, { onCue });
  return <GameSocketContext.Provider value={value}>{children}</GameSocketContext.Provider>;
}

export function useGameSocketContext(): GameSocketValue {
  const value = useContext(GameSocketContext);
  if (!value) throw new Error('useGameSocketContext must be used inside a GameSocketProvider');
  return value;
}
