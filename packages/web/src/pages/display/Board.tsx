import { MAX_BOARD_ANSWERS, type Board as BoardModel } from '@feud/shared';
import { AnswerTile } from './AnswerTile';

type Props = Readonly<{ board: BoardModel | null }>;

const SLOTS = Array.from({ length: MAX_BOARD_ANSWERS }, (_, i) => i + 1);
const ROWS = MAX_BOARD_ANSWERS / 2;

/** Two columns read top-to-bottom: ranks 1-4 on the left, 5-8 on the right. Unused slots stay blank so tiles keep one size. */
export function Board({ board }: Props) {
  const answerAt = (rank: number) => board?.answers.find((a) => a.rank === rank) ?? null;
  const left = SLOTS.filter((rank) => rank <= ROWS);
  const right = SLOTS.filter((rank) => rank > ROWS);
  return (
    <section className="board" aria-label="Answer board">
      <div className="board-column">{left.map((rank) => <AnswerTile key={rank} answer={answerAt(rank)} />)}</div>
      <div className="board-column">{right.map((rank) => <AnswerTile key={rank} answer={answerAt(rank)} />)}</div>
    </section>
  );
}
