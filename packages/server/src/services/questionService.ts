import type { BoardInput, QuestionStatus } from '@feud/shared';
import type { QuestionPatch, QuestionRepo, QuestionRow, QuestionSummary } from '../repositories/questionRepo';
import type { BoardAnswerRepo } from '../repositories/boardAnswerRepo';
import { conflict, notFound } from './errors';
import { toBoardInput } from './boardMapper';

/** Manual status edges. `closed → finalized` happens only through finalize; `→ played` only through LOAD_QUESTION. */
const STATUS_EDGES: Readonly<Record<QuestionStatus, readonly QuestionStatus[]>> = {
  draft: ['open'],
  open: ['closed'],
  closed: ['open'],
  finalized: ['closed'],
  played: ['finalized'],
};

export type QuestionServiceDeps = Readonly<{ questions: QuestionRepo; boards: BoardAnswerRepo; now: () => number }>;

export function createQuestionService({ questions, boards, now }: QuestionServiceDeps) {
  const requireRow = (id: string): QuestionRow => {
    const row = questions.get(id);
    if (!row) throw notFound('Question');
    return row;
  };
  const summary = (id: string): QuestionSummary => {
    const row = questions.getSummary(id);
    if (!row) throw notFound('Question');
    return row;
  };

  const setStatus = (id: string, status: QuestionStatus): QuestionSummary => {
    const current = requireRow(id);
    if (!STATUS_EDGES[current.status].includes(status)) {
      throw conflict(`Cannot move a ${current.status} question to ${status}`);
    }
    if (status === 'finalized' && boards.getBoard(id).length === 0) {
      throw conflict('This question has no finalized board');
    }
    if (current.status === 'finalized' && status === 'closed') boards.clearForQuestion(id);
    questions.setStatus(id, status, now());
    return summary(id);
  };

  return {
    list: (): QuestionSummary[] => questions.list(),
    listByStatus: (status: QuestionStatus): QuestionSummary[] => questions.listByStatus(status),
    get: summary,
    create: (prompt: string): QuestionSummary => summary(questions.insert({ prompt }, now()).id),
    update(id: string, patch: QuestionPatch): QuestionSummary {
      requireRow(id);
      questions.update(id, patch, now());
      return summary(id);
    },
    remove(id: string): void {
      const row = requireRow(id);
      if (row.status === 'played') throw conflict('Played questions cannot be deleted');
      questions.remove(id);
    },
    setStatus,
    getBoard(id: string): BoardInput {
      const row = requireRow(id);
      const rows = boards.getBoard(id);
      if (rows.length === 0) throw notFound('Board');
      return toBoardInput(row, rows);
    },
    /** Called by the game when a question is put on the board. */
    markPlayed(id: string): void {
      const row = questions.get(id);
      if (row && row.status !== 'played') questions.setStatus(id, 'played', now());
    },
    /** Called when a load is undone or swapped; the question becomes selectable again. */
    revertPlayed(id: string): void {
      const row = questions.get(id);
      if (!row || row.status !== 'played') return;
      questions.setStatus(id, boards.getBoard(id).length > 0 ? 'finalized' : 'closed', now());
    },
  };
}

export type QuestionService = ReturnType<typeof createQuestionService>;
