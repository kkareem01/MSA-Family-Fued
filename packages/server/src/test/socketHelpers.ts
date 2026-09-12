import { io as ioClient, type Socket } from 'socket.io-client';
import { SOCKET_PATH, type ClientToServerEvents, type ServerToClientEvents, type SocketAuth } from '@feud/shared';
import type { TestApp } from './helpers';

export type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const CONNECT_TIMEOUT_MS = 3000;

/** Real clients register listeners before connecting; tests await `connect`, so we keep the latest payload per event. */
const latestByEvent = new WeakMap<ClientSocket, Map<string, unknown>>();

export async function listenTestApp(t: TestApp): Promise<number> {
  await t.app.listen({ port: 0, host: '127.0.0.1' });
  const address = t.app.server.address();
  if (!address || typeof address === 'string') throw new Error('No TCP address');
  return address.port;
}

export function connectClient(port: number, auth: SocketAuth | Record<string, unknown>): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket: ClientSocket = ioClient(`http://127.0.0.1:${port}`, {
      path: SOCKET_PATH,
      auth,
      transports: ['websocket'],
      reconnection: false,
      timeout: CONNECT_TIMEOUT_MS,
    });
    const latest = new Map<string, unknown>();
    latestByEvent.set(socket, latest);
    socket.onAny((event: string, payload: unknown) => latest.set(event, payload));
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (error) => {
      socket.close();
      reject(error);
    });
  });
}

type PayloadOf<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

/** Resolves with the latest or next payload of `event` that satisfies `predicate`. */
export function waitFor<E extends keyof ServerToClientEvents>(
  socket: ClientSocket,
  event: E,
  predicate: (payload: PayloadOf<E>) => boolean = () => true,
  timeoutMs = CONNECT_TIMEOUT_MS,
): Promise<PayloadOf<E>> {
  const cached = latestByEvent.get(socket)?.get(event) as PayloadOf<E> | undefined;
  if (cached !== undefined && predicate(cached)) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler as never);
      reject(new Error(`Timed out waiting for ${String(event)}`));
    }, timeoutMs);
    const handler = (payload: PayloadOf<E>) => {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler as never);
      resolve(payload);
    };
    socket.on(event, handler as never);
  });
}

export function sendAction(socket: ClientSocket, action: unknown) {
  return new Promise<{ ok: boolean; seq?: number; changed?: boolean; error?: string }>((resolve) => {
    socket.emit('host:action', { action } as never, (result) => resolve(result));
  });
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
