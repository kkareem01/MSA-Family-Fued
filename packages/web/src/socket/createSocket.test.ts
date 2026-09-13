import { describe, expect, it, vi } from 'vitest';

vi.mock('socket.io-client', () => ({ io: vi.fn(() => ({ fake: true })) }));
const { io } = await import('socket.io-client');
const { createSocket } = await import('./createSocket');

describe('createSocket', () => {
  it('creates a same-origin socket that does not connect until asked', () => {
    const socket = createSocket({ role: 'host', pin: 'abcd' });
    expect(socket).toEqual({ fake: true });
    expect(io).toHaveBeenCalledWith({ path: '/socket.io', auth: { role: 'host', pin: 'abcd' }, autoConnect: false });
  });
});
