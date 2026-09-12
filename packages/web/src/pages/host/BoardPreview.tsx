import type { Board, Phase } from '@feud/shared';

type Props = Readonly<{
  board: Board;
  phase: Phase;
  canReveal: boolean;
  onReveal: (rank: number) => void;
}>;

export function revealLabel(phase: Phase): string {
  if (phase === 'round_over') return 'Show';
  if (phase === 'steal') return 'Steal it';
  return 'Reveal';
}

/** The host sees every answer with its points; tapping one reveals it on the projector. */
export function BoardPreview({ board, phase, canReveal, onReveal }: Props) {
  return (
    <section className="board-preview" aria-label="Answers">
      <p className="board-prompt">{board.prompt}</p>
      <ol className="answer-list">
        {board.answers.map((a) => (
          <li key={a.id} className={`answer-row${a.revealed ? ' revealed' : ''}`}>
            <span className="answer-rank">{a.rank}</span>
            <span className="answer-text">{a.text}</span>
            <span className="answer-points">{a.points}</span>
            <button
              type="button"
              className={`btn ${a.revealed ? 'btn-ghost' : 'btn-gold'}`}
              disabled={a.revealed || !canReveal}
              onClick={() => onReveal(a.rank)}
              aria-label={`${revealLabel(phase)} answer ${a.rank}: ${a.text}`}
            >
              {a.revealed ? (a.scored ? '✓' : '👁') : revealLabel(phase)}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
