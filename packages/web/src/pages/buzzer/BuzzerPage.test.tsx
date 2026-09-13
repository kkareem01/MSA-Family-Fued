import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeSocket } from '../../socket/testing/fakeSocket';

const { sockets } = vi.hoisted(() => ({ sockets: [] as FakeSocket[] }));
vi.mock('../../socket/createSocket', async () => {
  const { FakeSocket } = await import('../../socket/testing/fakeSocket');
  return { createSocket: vi.fn((auth: unknown) => { const s = new FakeSocket(); (s as FakeSocket & { auth?: unknown }).auth = auth; sockets.push(s); return s; }) };
});

const { BuzzerPage } = await import('./BuzzerPage');

const payload = (overrides: Record<string, unknown>) => ({ seq: 1, phase: 'idle', buzzersOpen: false, lockedTeam: null, yourTeam: 'A', teamName: 'Lions', ...overrides });

describe('BuzzerPage', () => {
  beforeEach(() => {
    localStorage.clear();
    sockets.splice(0);
  });

  it('joins from the link and walks through a face-off', () => {
    render(
      <MemoryRouter initialEntries={['/buzzer?team=a&code=abcd']}>
        <BuzzerPage />
      </MemoryRouter>,
    );
    const socket = sockets[0] as FakeSocket & { auth: unknown };
    expect(socket.auth).toEqual({ role: 'buzzer', team: 'A', code: 'ABCD' });
    act(() => socket.serverEmit('connect'));
    act(() => socket.serverEmit('buzzer_state', payload({})));
    expect(screen.getByText('Lions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wait/u })).toBeDisabled();

    act(() => socket.serverEmit('buzzer_state', payload({ seq: 2, phase: 'faceoff', buzzersOpen: true })));
    const buzz = screen.getByRole('button', { name: /BUZZ/u });
    expect(buzz).toBeEnabled();
    fireEvent.pointerDown(buzz);
    expect(socket.lastEmitted('buzzer:buzz')).toBeTruthy();
    expect(screen.getByText('Buzzed!')).toBeInTheDocument();

    act(() => socket.serverEmit('buzzer_state', payload({ seq: 3, phase: 'faceoff_answering', lockedTeam: 'A' })));
    expect(screen.getByText('You buzzed first!')).toBeInTheDocument();
    act(() => socket.serverEmit('buzzer_state', payload({ seq: 4, phase: 'faceoff_answering', lockedTeam: 'B' })));
    expect(screen.getByText('Too slow!')).toBeInTheDocument();
  });

  it('falls back to the form on a bad code and reconnects with new details', () => {
    render(
      <MemoryRouter initialEntries={['/buzzer?team=B&code=ZZZZ']}>
        <BuzzerPage />
      </MemoryRouter>,
    );
    act(() => sockets[0]!.serverEmit('connect_error', new Error('bad_code')));
    expect(screen.getByRole('alert')).toHaveTextContent(/not right/u);
    fireEvent.click(screen.getByRole('radio', { name: 'Team A' }));
    fireEvent.change(screen.getByLabelText('Team code'), { target: { value: 'wxyz' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(sockets).toHaveLength(2);
    expect((sockets[1] as FakeSocket & { auth: unknown }).auth).toEqual({ role: 'buzzer', team: 'A', code: 'WXYZ' });
    expect(localStorage.getItem('feud.buzzerJoin')).toContain('WXYZ');
  });

  it('starts on the form without a link and can leave again', () => {
    render(
      <MemoryRouter initialEntries={['/buzzer']}>
        <BuzzerPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Join' })).toBeDisabled();
    expect(sockets).toHaveLength(0);
    fireEvent.change(screen.getByLabelText('Team code'), { target: { value: 'ABCD' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(sockets).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Change team or code' }));
    expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
    expect(localStorage.getItem('feud.buzzerJoin')).toBeNull();
  });
});
