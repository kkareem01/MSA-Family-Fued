import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stateInPhase } from '@feud/shared/testing';
import type { FakeSocket } from '../../socket/testing/fakeSocket';

const { sockets } = vi.hoisted(() => ({ sockets: [] as FakeSocket[] }));
vi.mock('../../socket/createSocket', async () => {
  const { FakeSocket } = await import('../../socket/testing/fakeSocket');
  return { createSocket: vi.fn(() => { const s = new FakeSocket(); sockets.push(s); return s; }) };
});
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,QQ==')) } }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const { DisplayPage } = await import('./DisplayPage');

describe('DisplayPage', () => {
  beforeEach(() => sockets.splice(0));

  it('starts behind the click-to-start overlay and then mirrors the game', () => {
    const { container } = render(<DisplayPage />);
    expect(screen.getByText('Click anywhere to start the show')).toBeInTheDocument();
    expect(screen.getByText('Connecting…')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /start the show/u }));
    expect(screen.queryByText('Click anywhere to start the show')).not.toBeInTheDocument();

    const socket = sockets[0]!;
    act(() => {
      socket.serverEmit('connect');
      socket.serverEmit('state', { seq: 1, state: stateInPhase('round_intro'), canUndo: false });
    });
    expect(screen.getByText('Get ready')).toBeInTheDocument();
    act(() => socket.serverEmit('cue', { name: 'strike', strikes: 2 }));
    expect(container.querySelectorAll('.strike-x')).toHaveLength(2);
  });

  it('reports connection problems', () => {
    render(<DisplayPage />);
    act(() => sockets[0]!.serverEmit('connect_error', new Error('bad_auth')));
    expect(screen.getByText('Connection problem')).toBeInTheDocument();
    expect(screen.getByText('bad_auth')).toBeInTheDocument();
  });
});
