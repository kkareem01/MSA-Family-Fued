import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  BuzzerStatePayload,
  Cue,
  CueName,
  GameAction,
  HostActionAck,
  MetaPayload,
  PresencePayload,
  SocketAuth,
  StateEnvelope,
} from '@feud/shared';
import { ACTION_ACK_TIMEOUT_MS } from '../config';
import { createSocket, type FeudClientSocket } from './createSocket';

export type GameSocketHandlers = Readonly<{ onCue?: (cue: Cue) => void }>;

type Snapshot = Readonly<{
  envelope: StateEnvelope | null;
  meta: MetaPayload | null;
  presence: PresencePayload | null;
  buzzerState: BuzzerStatePayload | null;
  connected: boolean;
  connectError: string | null;
}>;

export type GameSocketValue = Snapshot &
  Readonly<{
    sendAction: (action: GameAction) => Promise<HostActionAck>;
    sendCue: (name: CueName) => void;
    buzz: () => void;
    /** Displays only: tells the server whether audio is running on this screen. */
    sendDisplayStatus: (audioUnlocked: boolean) => void;
  }>;

const INITIAL: Snapshot = { envelope: null, meta: null, presence: null, buzzerState: null, connected: false, connectError: null };

function bindListeners(socket: FeudClientSocket, set: (update: (s: Snapshot) => Snapshot) => void, handlers: React.RefObject<GameSocketHandlers>) {
  let lastSeq = -1;
  let lastBuzzerSeq = -1;
  socket.on('connect', () => set((s) => ({ ...s, connected: true, connectError: null })));
  socket.on('disconnect', () => set((s) => ({ ...s, connected: false })));
  socket.on('connect_error', (error) => set((s) => ({ ...s, connected: false, connectError: error.message })));
  socket.on('meta', (meta) => set((s) => ({ ...s, meta })));
  socket.on('presence', (presence) => set((s) => ({ ...s, presence })));
  socket.on('state', (envelope) => {
    if (envelope.seq <= lastSeq) return;
    lastSeq = envelope.seq;
    set((s) => ({ ...s, envelope }));
  });
  socket.on('buzzer_state', (buzzerState) => {
    if (buzzerState.seq < lastBuzzerSeq) return;
    lastBuzzerSeq = buzzerState.seq;
    set((s) => ({ ...s, buzzerState }));
  });
  socket.on('cue', (cue) => handlers.current.onCue?.(cue));
}

/**
 * One socket per page, keyed by the auth payload. The server is the store; this hook only mirrors it,
 * dropping out-of-order envelopes by sequence number.
 */
export function useGameSocket(auth: SocketAuth | null, handlers: GameSocketHandlers = {}): GameSocketValue {
  const [snapshot, setSnapshot] = useState<Snapshot>(INITIAL);
  const socketRef = useRef<FeudClientSocket | null>(null);
  const handlersRef = useRef<GameSocketHandlers>(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const authKey = auth ? JSON.stringify(auth) : null;
  const stableAuth = useMemo<SocketAuth | null>(() => (authKey ? (JSON.parse(authKey) as SocketAuth) : null), [authKey]);

  useEffect(() => {
    if (!stableAuth) return undefined;
    const socket = createSocket(stableAuth);
    socketRef.current = socket;
    bindListeners(socket, setSnapshot, handlersRef);
    socket.connect();
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setSnapshot(INITIAL);
    };
  }, [stableAuth]);

  const sendAction = useCallback(
    (action: GameAction) =>
      new Promise<HostActionAck>((resolve) => {
        const socket = socketRef.current;
        if (!socket) return resolve({ ok: false, error: 'Not connected' });
        const timer = setTimeout(() => resolve({ ok: false, error: 'No response from the server' }), ACTION_ACK_TIMEOUT_MS);
        socket.emit('host:action', { action }, (ack) => {
          clearTimeout(timer);
          resolve(ack);
        });
        return undefined;
      }),
    [],
  );

  const sendCue = useCallback((name: CueName) => {
    socketRef.current?.emit('host:cue', { name });
  }, []);

  const buzz = useCallback(() => {
    socketRef.current?.emit('buzzer:buzz');
  }, []);

  const sendDisplayStatus = useCallback((audioUnlocked: boolean) => {
    socketRef.current?.emit('display:status', { audioUnlocked });
  }, []);

  return { ...snapshot, sendAction, sendCue, buzz, sendDisplayStatus };
}
