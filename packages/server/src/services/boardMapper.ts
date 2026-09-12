import type { BoardInput } from '@feud/shared';
import type { QuestionRow } from '../repositories/questionRepo';
import type { BoardAnswerRow } from '../repositories/boardAnswerRepo';

export function toBoardInput(question: QuestionRow, rows: readonly BoardAnswerRow[]): BoardInput {
  return {
    questionId: question.id,
    prompt: question.prompt,
    answers: rows.map((r) => ({ id: r.id, rank: r.rank, text: r.text, points: r.points })),
  };
}
