import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import confetti from 'canvas-confetti';
import type { GameState, MetaPayload } from '@feud/shared';
import { sampleBoard, stateInPhase } from '@feud/shared/testing';
import { DisplayScene } from './DisplayScene';
import { INITIAL_FX, type DisplayFx } from './fx';

vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,QQ==')) } }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const meta: MetaPayload = { publicUrl: 'https://abc.trycloudflare.com', lanUrl: 'http://192.168.1.2:3000', surveyPath: '/survey', buzzerPath: '/buzzer', spotlight: null };

function scene(state: GameState, fx: Partial<DisplayFx> = {}, metaValue: MetaPayload | null = meta) {
  return render(<DisplayScene state={state} meta={metaValue} fx={{ ...INITIAL_FX, ...fx }} />);
}

describe('DisplayScene', () => {
  it('shows the title, scores and survey QR while idle', async () => {
    scene(stateInPhase('idle', { scores: { A: 12 } }));
    expect(screen.getByText('MSA Family Feud')).toBeInTheDocument();
    expect(screen.getByText(/Team A · 12/u)).toBeInTheDocument();
    expect(await screen.findByAltText(/abc\.trycloudflare\.com\/survey/u)).toBeInTheDocument();
  });

  it('falls back to the LAN address and then to a placeholder', async () => {
    scene(stateInPhase('idle'), {}, { ...meta, publicUrl: null });
    expect(await screen.findByAltText(/192\.168\.1\.2:3000\/survey/u)).toBeInTheDocument();
    scene(stateInPhase('idle'), {}, null);
    expect(screen.getByText('Survey link not set yet')).toBeInTheDocument();
  });

  it('renders the board with eight slots, the question and the round intro', () => {
    const { container } = scene(stateInPhase('round_intro'));
    expect(container.querySelectorAll('.tile')).toHaveLength(8);
    expect(container.querySelectorAll('.tile-empty')).toHaveLength(3);
    expect(screen.getByText(/Name a food people order/u)).toBeInTheDocument();
    expect(screen.getByText('Get ready')).toBeInTheDocument();
    expect(container.querySelector('.overlay-title')).toHaveTextContent('Round 1');
    expect(screen.getByText('Buzz in when you know it')).toBeInTheDocument();
  });

  it('shows a multiplier on later rounds', () => {
    scene(stateInPhase('round_intro', { roundIndex: 3, multiplier: 2 }));
    expect(screen.getByText('Points ×2')).toBeInTheDocument();
    expect(screen.getByText('×2')).toBeInTheDocument();
  });

  it('walks the face-off banners', () => {
    const title = (r: ReturnType<typeof scene>) => r.container.querySelector('.phase-title')?.textContent;
    expect(title(scene(stateInPhase('faceoff')))).toBe('Buzz in!');
    expect(title(scene(stateInPhase('faceoff_answering')))).toBe('Team A answers');
    const flash = scene(stateInPhase('faceoff_answering'), { buzzFlash: { team: 'B', until: Infinity } });
    expect(flash.container.querySelector('.phase-kicker')).toHaveTextContent('Buzzed first');
    expect(title(flash)).toBe('Team B');
    expect(title(scene(stateInPhase('play_or_pass')))).toBe('Play or pass?');
  });

  it('highlights control, lights strikes and shows the pot in play', () => {
    const { container } = scene(stateInPhase('in_play', { board: sampleBoard(5, [1, 2]), strikes: 2, multiplier: 2 }));
    expect(container.querySelector('.score-left')).toHaveClass('control');
    expect(container.querySelectorAll('.strike-slot.lit')).toHaveLength(2);
    expect(screen.getByLabelText(/pot 120/u)).toBeInTheDocument();
    expect(container.querySelectorAll('.tile.revealed')).toHaveLength(2);
  });

  it('announces a steal', () => {
    scene(stateInPhase('steal'));
    expect(screen.getByText('Steal!')).toBeInTheDocument();
    expect(screen.getByText('Team B, one guess')).toBeInTheDocument();
  });

  it('flashes the strike overlay', () => {
    const { container } = scene(stateInPhase('in_play'), { strikeFlash: { count: 3, until: Infinity } });
    expect(container.querySelectorAll('.strike-x')).toHaveLength(3);
    expect(screen.getByLabelText('Strike 3')).toBeInTheDocument();
  });

  it('shows the round result toast while the cue is active', () => {
    const base = stateInPhase('round_over', { board: sampleBoard(3, [1]) });
    const state: GameState = { ...base, round: { ...base.round, result: { awardedTo: 'B', points: 38, reason: 'steal' } } };
    const shown = scene(state, { roundResultUntil: Infinity });
    expect(screen.getByText('Team B steals')).toBeInTheDocument();
    expect(screen.getByText('+38')).toBeInTheDocument();
    shown.unmount();
    scene(state, { roundResultUntil: null });
    expect(screen.queryByText('+38')).not.toBeInTheDocument();
  });

  it('crowns the winner with confetti, or calls a tie', async () => {
    const won = { ...stateInPhase('game_over', { scores: { A: 90, B: 20 } }), winner: 'A' as const };
    const first = scene(won, { confettiKey: 1 });
    expect(screen.getByText('Team A wins!')).toBeInTheDocument();
    await waitFor(() => expect(vi.mocked(confetti)).toHaveBeenCalled());
    first.unmount();
    scene({ ...won, winner: 'tie' });
    expect(screen.getByText("It's a tie!")).toBeInTheDocument();
  });
});
