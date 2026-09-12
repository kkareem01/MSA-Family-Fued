import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { GameState } from '@feud/shared';

type Props = Readonly<{ state: GameState; confettiKey: number }>;

const BURSTS = 6;
const BURST_GAP_MS = 450;

function fireConfetti(): () => void {
  const timers = Array.from({ length: BURSTS }, (_, i) =>
    setTimeout(() => {
      void confetti({ particleCount: 140, spread: 80, startVelocity: 55, origin: { x: 0.2 + (i % 3) * 0.3, y: 0.55 }, colors: ['#f6b400', '#ffffff', '#2f63ff', '#e11d2b'] });
    }, i * BURST_GAP_MS),
  );
  return () => timers.forEach(clearTimeout);
}

export function WinnerScreen({ state, confettiKey }: Props) {
  useEffect(() => fireConfetti(), [confettiKey]);
  const winner = state.winner;
  const title = winner === 'tie' || winner === null ? "It's a tie!" : `${state.teams[winner].name} wins!`;
  return (
    <div className="winner-screen" role="status">
      <span className="overlay-kicker">Game over</span>
      <span className="winner-title">{title}</span>
      <div className="winner-scores">
        <span className={winner === 'A' ? 'champion' : ''}>{state.teams.A.name} · {state.teams.A.score}</span>
        <span className={winner === 'B' ? 'champion' : ''}>{state.teams.B.name} · {state.teams.B.score}</span>
      </div>
    </div>
  );
}
