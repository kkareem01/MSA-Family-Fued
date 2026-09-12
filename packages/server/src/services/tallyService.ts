import { buildTally, MERGE_CHAIN_MAX_DEPTH, type BoardInput, type TallyDecision, type TallyView } from '@feud/shared';
import type { QuestionRepo, QuestionRow } from '../repositories/questionRepo';
import type { SurveyRepo } from '../repositories/surveyRepo';
import type { TallyDecisionRepo } from '../repositories/tallyDecisionRepo';
import type { BoardAnswerRepo } from '../repositories/boardAnswerRepo';
import { badRequest, conflict, notFound } from './errors';
import { toBoardInput } from './boardMapper';

export type TallyServiceDeps = Readonly<{
  questions: QuestionRepo;
  responses: SurveyRepo;
  decisions: TallyDecisionRepo;
  boards: BoardAnswerRepo;
  now: () => number;
}>;

/** Follows merge pointers from `start`; returns the root, or null if the chain reaches `forbidden`. */
function resolveRoot(decisions: readonly TallyDecision[], start: string, forbidden: string): string | null {
  const byKey = new Map(decisions.map((d) => [d.key, d]));
  const walk = (key: string, depth: number): string | null => {
    if (key === forbidden) return null;
    const next = byKey.get(key)?.mergedIntoKey;
    if (!next || depth >= MERGE_CHAIN_MAX_DEPTH) return key;
    return walk(next, depth + 1);
  };
  return walk(start, 0);
}

export function createTallyService({ questions, responses, decisions, boards, now }: TallyServiceDeps) {
  const requireQuestion = (id: string): QuestionRow => {
    const row = questions.get(id);
    if (!row) throw notFound('Question');
    return row;
  };

  const getTally = (questionId: string): TallyView => {
    const question = requireQuestion(questionId);
    return buildTally(questionId, question.status, responses.listByQuestion(questionId), decisions.listByQuestion(questionId));
  };

  const finalize = (questionId: string, topN: number): BoardInput => {
    const question = requireQuestion(questionId);
    if (question.status === 'draft' || question.status === 'played') {
      throw conflict(`A ${question.status} question cannot be finalized`);
    }
    const top = getTally(questionId).groups.slice(0, topN);
    if (top.length === 0) throw conflict('There are no answers to put on the board');
    boards.replaceForQuestion(
      questionId,
      top.map((g, i) => ({ rank: i + 1, text: g.displayText, points: g.points, responseCount: g.count, sourceKeys: [g.key, ...g.mergedKeys] })),
    );
    if (question.status === 'open') questions.setStatus(questionId, 'closed', now());
    questions.setStatus(questionId, 'finalized', now());
    return toBoardInput(requireQuestion(questionId), boards.getBoard(questionId));
  };

  return {
    getTally,
    merge(questionId: string, sourceKey: string, targetKey: string): TallyView {
      requireQuestion(questionId);
      if (sourceKey === targetKey) throw badRequest('Cannot merge an answer into itself');
      const root = resolveRoot(decisions.listByQuestion(questionId), targetKey, sourceKey);
      if (root === null) throw badRequest('That merge would create a loop');
      decisions.setMergedInto(questionId, sourceKey, root, now());
      decisions.repointMerges(questionId, sourceKey, root, now());
      return getTally(questionId);
    },
    unmerge(questionId: string, key: string): TallyView {
      requireQuestion(questionId);
      decisions.setMergedInto(questionId, key, null, now());
      return getTally(questionId);
    },
    rename(questionId: string, key: string, displayText: string | null): TallyView {
      requireQuestion(questionId);
      decisions.setDisplayText(questionId, key, displayText, now());
      return getTally(questionId);
    },
    drop(questionId: string, key: string, dropped: boolean): TallyView {
      requireQuestion(questionId);
      decisions.setDropped(questionId, key, dropped, now());
      return getTally(questionId);
    },
    setPoints(questionId: string, key: string, points: number | null): TallyView {
      requireQuestion(questionId);
      decisions.setPointsOverride(questionId, key, points, now());
      return getTally(questionId);
    },
    finalize,
  };
}

export type TallyService = ReturnType<typeof createTallyService>;
