import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Phase } from '@feud/shared';
import { sampleBoardInput, stateInPhase } from '@feud/shared/testing';
import type { FakeSocket } from '../../socket/testing/fakeSocket';
import { HostPinContext } from '../../auth/HostPinContext';

const { sockets } = vi.hoisted(() => ({ sockets: [] as FakeSocket[] }));
vi.mock('../../socket/createSocket', async () => {
  const { FakeSocket } = await import('../../socket/testing/fakeSocket');
  return { createSocket: vi.fn(() => { const s = new FakeSocket(); sockets.push(s); return s; }) };
});
vi.mock('../../api/game', () => ({ getCandidates: vi.fn(), getGameState: vi.fn(), sendGameAction: vi.fn() }));
vi.mock('../../api/questions', () => ({ getBoard: vi.fn(), listQuestions: vi.fn(), createQuestion: vi.fn(), updateQuestion: vi.fn(), deleteQuestion: vi.fn(), setQuestionStatus: vi.fn() }));
vi.mock('../../api/settings', () => ({ getSettings: vi.fn(), setPublicUrl: vi.fn(), rotateBuzzerCodes: vi.fn() }));

const { getCandidates } = await import('../../api/game');
const { getBoard } = await import('../../api/questions');
const { getSettings, rotateBuzzerCodes, setPublicUrl } = await import('../../api/settings');
const { HostPage } = await import('./HostPage');

const question = { id: 'q1', prompt: 'Name a food', status: 'finalized' as const, sortOrder: 1, createdAt: 0, updatedAt: 0, openedAt: null, closedAt: null, finalizedAt: null, playedAt: null, responseCount: 9, hasBoard: true };
const settings = { publicUrl: null, lanUrl: 'http://192.168.1.5:3000', buzzerCodes: { A: 'ABCD', B: 'EFGH' } };

function renderHost(phase: Phase, overrides: Parameters<typeof stateInPhase>[1] = {}) {
  const signOut = vi.fn();
  render(
    <MemoryRouter>
      <HostPinContext.Provider value={{ pin: 'pin', signOut }}>
        <HostPage />
      </HostPinContext.Provider>
    </MemoryRouter>,
  );
  const socket = sockets.at(-1)!;
  act(() => {
    socket.serverEmit('connect');
    socket.serverEmit('state', { seq: 3, state: stateInPhase(phase, overrides), canUndo: true });
  });
  return { socket, signOut };
}

const button = (name: RegExp | string) => screen.getByRole('button', { name });

describe('HostPage', () => {
  beforeEach(() => {
    sockets.splice(0);
    vi.mocked(getCandidates).mockResolvedValue([question]);
    vi.mocked(getBoard).mockResolvedValue(sampleBoardInput(3));
    vi.mocked(getSettings).mockResolvedValue(settings);
    vi.mocked(setPublicUrl).mockResolvedValue({ ...settings, publicUrl: 'https://x.trycloudflare.com' });
    vi.mocked(rotateBuzzerCodes).mockResolvedValue({ ...settings, buzzerCodes: { A: 'QQQQ', B: 'RRRR' } });
  });

  it('waits for state, then loads a question from the picker', async () => {
    render(
      <MemoryRouter>
        <HostPinContext.Provider value={{ pin: 'pin', signOut: vi.fn() }}>
          <HostPage />
        </HostPinContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByText(/Waiting for the game state/u)).toBeInTheDocument();
    const socket = sockets[0]!;
    act(() => {
      socket.serverEmit('connect');
      socket.serverEmit('state', { seq: 1, state: stateInPhase('idle'), canUndo: false });
    });
    expect(screen.getByText('Pick a question to start round 1.')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Load' }));
    await waitFor(() => expect(socket.actions()).toContainEqual({ type: 'LOAD_QUESTION', board: sampleBoardInput(3) }));
    expect(button(/Undo/u)).toBeDisabled();
  });

  it('runs the round intro and face-off controls', () => {
    const { socket } = renderHost('round_intro');
    fireEvent.click(button(/Start face-off/u));
    fireEvent.click(button('×2'));
    expect(socket.actions()).toEqual([{ type: 'START_FACEOFF' }, { type: 'SET_MULTIPLIER', multiplier: 2 }]);
  });

  it('locks, resets and overrides during the face-off', () => {
    const { socket } = renderHost('faceoff');
    fireEvent.click(button('Lock in Team B'));
    fireEvent.click(button('Reset buzzers'));
    fireEvent.click(button('Give control to Team A'));
    const [lock, reset, control] = socket.actions() as { type: string; team?: string; source?: string }[];
    expect(lock).toMatchObject({ type: 'LOCK_BUZZER', team: 'B', source: 'host' });
    expect(reset).toEqual({ type: 'RESET_BUZZER' });
    expect(control).toEqual({ type: 'SET_CONTROL', team: 'A' });
  });

  it('handles the answering team: switch, reveal, not on the board', () => {
    const { socket } = renderHost('faceoff_answering');
    expect(button('Switch to Team A')).toBeDisabled();
    fireEvent.click(button('Switch to Team B'));
    fireEvent.click(screen.getByRole('button', { name: /Reveal answer 2/u }));
    fireEvent.click(button(/Not on the board/u));
    expect(socket.actions()).toEqual([
      expect.objectContaining({ type: 'LOCK_BUZZER', team: 'B' }),
      { type: 'REVEAL_ANSWER', rank: 2 },
      { type: 'STRIKE' },
    ]);
  });

  it('offers play or pass', () => {
    const { socket } = renderHost('play_or_pass');
    fireEvent.click(button(/^Play \(/u));
    fireEvent.click(button(/^Pass \(/u));
    expect(socket.actions()).toEqual([
      { type: 'CHOOSE_PLAY_OR_PASS', choice: 'play' },
      { type: 'CHOOSE_PLAY_OR_PASS', choice: 'pass' },
    ]);
  });

  it('strikes and ends a round early through the confirm sheet', () => {
    const { socket } = renderHost('in_play');
    fireEvent.click(button(/STRIKE/u));
    fireEvent.click(button(/End round early/u));
    fireEvent.click(button('Cancel'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(button(/End round early/u));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Award the pot to Team B' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(socket.actions()).toEqual([{ type: 'STRIKE' }, { type: 'END_ROUND', awardTo: 'B' }]);
  });

  it('resolves a steal either way', () => {
    const { socket } = renderHost('steal');
    expect(screen.getByText(/Steal: tap the answer Team B said/u)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Steal it answer 1/u }));
    fireEvent.click(button(/Steal failed/u));
    expect(socket.actions()).toEqual([{ type: 'REVEAL_ANSWER', rank: 1 }, { type: 'STRIKE' }]);
  });

  it('wraps up a round and the game', () => {
    const { socket } = renderHost('round_over');
    fireEvent.click(button('Reveal all remaining'));
    fireEvent.click(button(/Next round/u));
    fireEvent.click(button(/End game…/u));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'End game' }));
    expect(socket.actions()).toEqual([{ type: 'REVEAL_ALL' }, { type: 'NEXT_ROUND' }, { type: 'END_GAME' }]);
  });

  it('starts a new game after game over', () => {
    const { socket } = renderHost('game_over');
    fireEvent.click(button(/New game/u));
    fireEvent.click(button(/Reset scores, keep team names/u));
    expect(socket.actions()).toEqual([{ type: 'RESET_GAME' }]);
  });

  it('adjusts scores, renames teams, undoes and tests sounds', () => {
    const { socket, signOut } = renderHost('idle');
    fireEvent.click(screen.getAllByRole('button', { name: '+5' })[0]!);
    fireEvent.click(screen.getAllByTitle('Tap to rename')[1]!);
    const input = screen.getByLabelText('Team B name');
    fireEvent.change(input, { target: { value: 'Lions' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.click(button(/Undo/u));
    fireEvent.click(button(/Ding/u));
    expect(socket.actions()).toEqual([{ type: 'ADJUST_SCORE', team: 'A', delta: 5 }, { type: 'SET_TEAM_NAME', team: 'B', name: 'Lions' }, { type: 'UNDO' }]);
    expect(socket.lastEmitted('host:cue')?.args[0]).toEqual({ name: 'reveal' });
    fireEvent.click(button('Sign out'));
    expect(signOut).toHaveBeenCalled();
  });

  it('saves the public link, rotates codes and updates the rules', async () => {
    const { socket } = renderHost('idle');
    await screen.findByText(/Same-wifi fallback/u);
    fireEvent.change(screen.getByPlaceholderText('https://something.trycloudflare.com'), { target: { value: 'https://x.trycloudflare.com' } });
    fireEvent.click(button('Save'));
    await waitFor(() => expect(setPublicUrl).toHaveBeenCalledWith('pin', 'https://x.trycloudflare.com'));
    fireEvent.click(button('Issue new codes'));
    await waitFor(() => expect(rotateBuzzerCodes).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText('Strikes per round'), { target: { value: '4' } });
    fireEvent.click(button('Save rules'));
    await waitFor(() => expect(socket.actions()).toContainEqual({ type: 'UPDATE_SETTINGS', settings: { maxStrikes: 4, multipliers: [1, 1, 2, 3] } }));
  });

  it('shows a toast when the server rejects an action', async () => {
    const { socket } = renderHost('in_play');
    socket.autoAck = { ok: false, error: 'Nope, not now' };
    fireEvent.click(button(/STRIKE/u));
    expect(await screen.findByRole('alert')).toHaveTextContent('Nope, not now');
  });
});
