import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, type StateEnvelope } from '@feud/shared';
import { FakeSocket } from './testing/fakeSocket';

const sockets: FakeSocket[] = [];
vi.mock('./createSocket', () => ({
  createSocket: vi.fn(() => {
    const socket = new FakeSocket();
    sockets.push(socket);
    return socket;
  }),
}));

const { useGameSocket } = await import('./useGameSocket');

function envelope(seq: number, phase = 'idle'): StateEnvelope {
  return { seq, state: { ...createInitialState(), phase: phase as StateEnvelope['state']['phase'] }, canUndo: false };
}

describe('useGameSocket', () => {
  beforeEach(() => sockets.splice(0));

  it('does nothing without auth', () => {
    const { result } = renderHook(() => useGameSocket(null));
    expect(result.current.connected).toBe(false);
    expect(sockets).toHaveLength(0);
  });

  it('tracks connection, meta and state with a sequence guard', () => {
    const { result } = renderHook(() => useGameSocket({ role: 'display' }));
    const socket = sockets[0]!;
    act(() => socket.serverEmit('connect'));
    expect(result.current.connected).toBe(true);
    act(() => socket.serverEmit('meta', { publicUrl: null, lanUrl: 'http://x', surveyPath: '/survey', buzzerPath: '/buzzer' }));
    expect(result.current.meta?.lanUrl).toBe('http://x');
    act(() => socket.serverEmit('state', envelope(5, 'round_intro')));
    act(() => socket.serverEmit('state', envelope(3, 'faceoff')));
    expect(result.current.envelope?.seq).toBe(5);
    expect(result.current.envelope?.state.phase).toBe('round_intro');
    act(() => socket.serverEmit('state', envelope(6, 'faceoff')));
    expect(result.current.envelope?.state.phase).toBe('faceoff');
    act(() => socket.serverEmit('disconnect', 'transport close'));
    expect(result.current.connected).toBe(false);
  });

  it('reports connect errors', () => {
    const { result } = renderHook(() => useGameSocket({ role: 'host', pin: 'bad' }));
    act(() => sockets[0]!.serverEmit('connect_error', new Error('unauthorized')));
    expect(result.current.connectError).toBe('unauthorized');
  });

  it('forwards cues to the latest handler', () => {
    const onCue = vi.fn();
    const { rerender } = renderHook(({ handler }) => useGameSocket({ role: 'display' }, { onCue: handler }), { initialProps: { handler: onCue } });
    act(() => sockets[0]!.serverEmit('cue', { name: 'reveal', rank: 1 }));
    expect(onCue).toHaveBeenCalledWith({ name: 'reveal', rank: 1 });
    const later = vi.fn();
    rerender({ handler: later });
    act(() => sockets[0]!.serverEmit('cue', { name: 'strike', strikes: 2 }));
    expect(later).toHaveBeenCalledWith({ name: 'strike', strikes: 2 });
    expect(sockets).toHaveLength(1);
  });

  it('sends actions and resolves with the ack', async () => {
    const { result } = renderHook(() => useGameSocket({ role: 'host', pin: 'good' }));
    const socket = sockets[0]!;
    socket.autoAck = null;
    const pending = result.current.sendAction({ type: 'STRIKE' });
    const call = socket.lastEmitted('host:action')!;
    expect(call.args[0]).toEqual({ action: { type: 'STRIKE' } });
    (call.args[1] as (r: unknown) => void)({ ok: true, seq: 9, changed: true });
    await expect(pending).resolves.toEqual({ ok: true, seq: 9, changed: true });
    result.current.sendCue('win');
    expect(socket.lastEmitted('host:cue')?.args[0]).toEqual({ name: 'win' });
    result.current.buzz();
    expect(socket.lastEmitted('buzzer:buzz')).toBeTruthy();
  });

  it('keeps buzzer state and disconnects on unmount', () => {
    const { result, unmount } = renderHook(() => useGameSocket({ role: 'buzzer', team: 'A', code: 'ABCD' }));
    const socket = sockets[0]!;
    act(() => socket.serverEmit('buzzer_state', { seq: 2, phase: 'faceoff', buzzersOpen: true, lockedTeam: null, yourTeam: 'A', teamName: 'Lions' }));
    act(() => socket.serverEmit('buzzer_state', { seq: 1, phase: 'idle', buzzersOpen: false, lockedTeam: null, yourTeam: 'A', teamName: 'Lions' }));
    expect(result.current.buzzerState?.phase).toBe('faceoff');
    const spy = vi.spyOn(socket, 'disconnect');
    unmount();
    expect(spy).toHaveBeenCalled();
  });
});
