import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stateInPhase } from '@feud/shared/testing';
import type { FakeSocket } from '../../socket/testing/fakeSocket';
import { FakeAudioContext } from '../../sound/testing/fakeAudio';

const { sockets } = vi.hoisted(() => ({ sockets: [] as FakeSocket[] }));
vi.mock('../../socket/createSocket', async () => {
  const { FakeSocket } = await import('../../socket/testing/fakeSocket');
  return { createSocket: vi.fn(() => { const s = new FakeSocket(); sockets.push(s); return s; }) };
});
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,QQ==')) } }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../../api/survey', () => ({ getOpenQuestions: vi.fn(() => Promise.resolve([{ id: 'q1', prompt: 'Name a fruit' }])), submitSurvey: vi.fn() }));

const { DisplayPage } = await import('./DisplayPage');

const startButton = () => screen.getByRole('button', { name: /start the show/u });

describe('DisplayPage', () => {
  beforeEach(() => sockets.splice(0));
  afterEach(() => vi.unstubAllGlobals());

  it('starts behind the click-to-start overlay and then mirrors the game', async () => {
    const { container } = render(<DisplayPage />);
    expect(screen.getByText('Click anywhere to start the show')).toBeInTheDocument();
    expect(screen.getByText('Connecting…')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(startButton());
    });
    expect(screen.queryByText('Click anywhere to start the show')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sound is off/u })).toBeInTheDocument();

    const socket = sockets[0]!;
    act(() => {
      socket.serverEmit('connect');
      socket.serverEmit('state', { seq: 1, state: stateInPhase('round_intro'), canUndo: false });
    });
    expect(screen.getByText('Get ready')).toBeInTheDocument();
    act(() => socket.serverEmit('cue', { name: 'strike', strikes: 2 }));
    expect(container.querySelectorAll('.strike-x')).toHaveLength(2);
    expect(socket.lastEmitted('display:status')?.args[0]).toEqual({ audioUnlocked: false });
  });

  it('hides the sound badge once the browser lets audio run, and tells the server', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    render(<DisplayPage />);
    const socket = sockets[0]!;
    act(() => socket.serverEmit('connect'));
    expect(socket.lastEmitted('display:status')?.args[0]).toEqual({ audioUnlocked: false });
    await act(async () => {
      fireEvent.click(startButton());
    });
    expect(screen.queryByRole('button', { name: /Sound is/u })).not.toBeInTheDocument();
    expect(socket.lastEmitted('display:status')?.args[0]).toEqual({ audioUnlocked: true });
  });

  it('keeps a badge while audio stays paused and retries from a click or a key', async () => {
    const contexts: FakeAudioContext[] = [];
    vi.stubGlobal(
      'AudioContext',
      class extends FakeAudioContext {
        constructor() {
          super();
          this.resumable = false;
          contexts.push(this);
        }
      },
    );
    render(<DisplayPage />);
    await act(async () => {
      fireEvent.click(startButton());
    });
    expect(contexts).toHaveLength(1);
    expect(contexts[0]!.resumed).toBe(1);
    const badge = screen.getByRole('button', { name: /Sound is paused/u });
    await act(async () => {
      fireEvent.keyDown(window, { key: ' ' });
    });
    expect(contexts[0]!.resumed).toBe(2);
    contexts[0]!.resumable = true;
    await act(async () => {
      fireEvent.click(badge);
    });
    expect(screen.queryByRole('button', { name: /Sound is/u })).not.toBeInTheDocument();
    expect(contexts).toHaveLength(1);
  });

  it('puts the survey spotlight over any phase when the host asks for it', async () => {
    render(<DisplayPage />);
    const socket = sockets[0]!;
    const meta = { publicUrl: 'https://abc.trycloudflare.com', lanUrl: 'http://192.168.1.2:3000', surveyPath: '/survey', buzzerPath: '/buzzer', spotlight: 'survey' };
    act(() => {
      socket.serverEmit('connect');
      socket.serverEmit('state', { seq: 1, state: stateInPhase('in_play'), canUndo: false });
      socket.serverEmit('meta', meta);
    });
    const codes = await screen.findAllByAltText('QR code for https://abc.trycloudflare.com/survey');
    expect(codes.some((img) => img.classList.contains('spotlight-code'))).toBe(true);
    expect(screen.getByText(/Scan to answer/u)).toBeInTheDocument();
    expect(screen.getByText('Name a fruit')).toBeInTheDocument();
    act(() => socket.serverEmit('meta', { ...meta, spotlight: null }));
    expect(screen.queryByText(/Scan to answer/u)).not.toBeInTheDocument();
  });

  it('reports connection problems', () => {
    render(<DisplayPage />);
    act(() => sockets[0]!.serverEmit('connect_error', new Error('bad_auth')));
    expect(screen.getByText('Connection problem')).toBeInTheDocument();
    expect(screen.getByText('bad_auth')).toBeInTheDocument();
  });
});
