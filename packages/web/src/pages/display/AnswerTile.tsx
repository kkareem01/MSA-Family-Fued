import type { BoardAnswer } from '@feud/shared';

type Props = Readonly<{ answer: BoardAnswer | null }>;

const TEXT_SIZE_STEPS = [
  { maxLength: 12, size: 'lg' },
  { maxLength: 20, size: 'md' },
] as const;

/** Long answers shrink instead of getting cut off. */
export function textSizeFor(text: string): 'lg' | 'md' | 'sm' {
  return TEXT_SIZE_STEPS.find((step) => text.length <= step.maxLength)?.size ?? 'sm';
}

/** One board slot. Hidden face shows the rank; the reveal flips it to text and points. */
export function AnswerTile({ answer }: Props) {
  if (!answer) return <div className="tile tile-empty" aria-hidden="true" />;
  const label = answer.revealed ? `${answer.rank}. ${answer.text}, ${answer.points} points` : `Answer ${answer.rank}, hidden`;
  return (
    <div className={`tile${answer.revealed ? ' revealed' : ''}`} aria-label={label}>
      <div className="tile-inner">
        <div className="tile-face tile-front">
          <span className="tile-number">{answer.rank}</span>
        </div>
        <div className="tile-face tile-back">
          <span className={`tile-text text-${textSizeFor(answer.text)}`}>{answer.text}</span>
          <span className="tile-points">{answer.revealed ? answer.points : ''}</span>
        </div>
      </div>
    </div>
  );
}
