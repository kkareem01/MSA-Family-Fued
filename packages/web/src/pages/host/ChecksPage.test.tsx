import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { FakeSocket } from '../../socket/testing/fakeSocket';
import { HostPinContext } from '../../auth/HostPinContext';

const { sockets } = vi.hoisted(() => ({ sockets: [] as FakeSocket[] }));
vi.mock('../../socket/createSocket', async () => {
  const { FakeSocket } = await import('../../socket/testing/fakeSocket');
  return { createSocket: vi.fn(() => { const s = new FakeSocket(); sockets.push(s); return s; }) };
});
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,QQ==')) } }));
vi.mock('../../api/questions', () => ({ listQuestions: vi.fn(), createQuestion: vi.fn(), deleteQuestion: vi.fn(), setQuestionStatus: vi.fn(), getBoard: vi.fn(), updateQuestion: vi.fn() }));
vi.mock('../../api/settings', () => ({ getSettings: vi.fn(), setPublicUrl: vi.fn(), rotateBuzzerCodes: vi.fn(), setSpotlight: vi.fn() }));

const { listQuestions } = await import('../../api/questions');
const { getSettings } = await import('../../api/settings');
const { ChecksPage } = await import('./ChecksPage');

const question = { id: 'q1', prompt: 'Name a food', status: 'finalized' as const, sortOrder: 1, createdAt: 0, updatedAt: 0, openedAt: null, closedAt: null, finalizedAt: null, playedAt: null, responseCount: 9, hasBoard: true };
const meta = { publicUrl: 'https://abc.trycloudflare.com', lanUrl: 'http://10.0.0.2:3000', surveyPath: '/survey', buzzerPath: '/buzzer', spotlight: null };

function renderPage() {
  render(
    <MemoryRouter>
      <HostPinContext.Provider value={{ pin: 'pin', signOut: vi.fn() }}>
        <ChecksPage />
      </HostPinContext.Provider>
    </MemoryRouter>,
  );
  return sockets.at(-1)!;
}

describe('ChecksPage', () => {
  beforeEach(() => {
    sockets.splice(0);
    vi.mocked(listQuestions).mockResolvedValue([question, { ...question, id: 'q2', status: 'open', hasBoard: false }]);
    vi.mocked(getSettings).mockResolvedValue({ ...meta, buzzerCodes: { A: 'ABCD', B: 'EFGH' } });
  });

  it('shows live pass and fail rows with fixes, and updates as people connect', async () => {
    const socket = renderPage();
    expect(await screen.findByText('0 of 8 checks pass')).toBeInTheDocument();
    act(() => {
      socket.serverEmit('connect');
      socket.serverEmit('meta', meta);
      socket.serverEmit('presence', { displays: 0, displaysWithSound: 0, hosts: 1, buzzers: { A: 0, B: 0 } });
    });
    expect(await screen.findByText('4 of 8 checks pass')).toBeInTheDocument();
    for (const link of screen.getAllByRole('link', { name: /Open the projector/u })) expect(link).toHaveAttribute('href', '/display');
    expect(screen.getByText(/EFGH/u)).toBeInTheDocument();
    act(() => socket.serverEmit('presence', { displays: 1, displaysWithSound: 1, hosts: 1, buzzers: { A: 1, B: 1 } }));
    expect(await screen.findByText('8 of 8 checks pass')).toBeInTheDocument();
  });

  it('plays a test ding on the projector from the sound row', async () => {
    const socket = renderPage();
    act(() => socket.serverEmit('connect'));
    fireEvent.click(await screen.findByRole('button', { name: /Play test ding/u }));
    expect(socket.lastEmitted('host:cue')?.args[0]).toEqual({ name: 'reveal' });
  });
});
