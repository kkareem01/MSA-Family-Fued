import { capitalizeFirst, normalizeAnswer, type RestoreBackupInput, type RestoreResult, type RestoredQuestion } from '@feud/shared';
import type { Database } from '../db/connection';
import { withTransaction } from '../db/connection';
import type { QuestionRepo } from '../repositories/questionRepo';
import type { SurveyRepo } from '../repositories/surveyRepo';
import type { TallyService } from './tallyService';

export type RestoreServiceDeps = Readonly<{ db: Database; questions: QuestionRepo; responses: SurveyRepo; tally: TallyService; now: () => number }>;

type BackupQuestion = RestoreBackupInput['questions'][number];
type Group = BackupQuestion['tally']['groups'][number];

/** Merged children are already folded into their root's variants; only roots and dropped roots carry answers. */
function answerGroups(tally: BackupQuestion['tally']): readonly Group[] {
  return [...tally.groups, ...tally.hidden.filter((g) => g.mergedInto === null)];
}

/** A board cannot be rebuilt from a tally, so finalized/played questions come back as closed, ready to re-finalize. */
function restorableStatus(status: BackupQuestion['question']['status']): { status: BackupQuestion['question']['status']; note: string | null } {
  if (status === 'finalized' || status === 'played') return { status: 'closed', note: `was ${status}; finalize it again from the tally` };
  return { status, note: null };
}

export function createRestoreService({ db, questions, responses, tally, now }: RestoreServiceDeps) {
  const insertAnswers = (questionId: string, groups: readonly Group[]): number =>
    groups.reduce((total, group) => {
      const inserted = group.variants.reduce((n, variant) => {
        for (let i = 0; i < variant.count; i += 1) {
          responses.insert(
            { questionId, rawText: variant.text, normalizedText: normalizeAnswer(variant.text), submitterToken: `restore-${questionId}-${total + n + i}`, ipHash: null },
            now(),
          );
        }
        return n + variant.count;
      }, 0);
      return total + inserted;
    }, 0);

  const applyDecisions = (questionId: string, backup: BackupQuestion['tally']): number => {
    const merges = backup.hidden.filter((g) => g.mergedInto !== null);
    merges.forEach((g) => tally.merge(questionId, g.key, g.mergedInto as string));
    const drops = backup.hidden.filter((g) => g.mergedInto === null && g.dropped);
    drops.forEach((g) => tally.drop(questionId, g.key, true));
    const renamed = backup.groups.filter((g) => g.displayText !== undefined && g.displayText !== capitalizeFirst(g.variants[0]?.text ?? g.key));
    renamed.forEach((g) => tally.rename(questionId, g.key, g.displayText ?? null));
    const pointed = backup.groups.filter((g) => g.pointsOverride !== null);
    pointed.forEach((g) => tally.setPoints(questionId, g.key, g.pointsOverride));
    return merges.length + drops.length + renamed.length + pointed.length;
  };

  const restoreOne = (entry: BackupQuestion): RestoredQuestion => {
    const { status, note } = restorableStatus(entry.question.status);
    questions.insertExisting({ id: entry.question.id, prompt: entry.question.prompt, status, sortOrder: entry.question.sortOrder }, now());
    const answers = insertAnswers(entry.question.id, answerGroups(entry.tally));
    const decisions = applyDecisions(entry.question.id, entry.tally);
    return { id: entry.question.id, prompt: entry.question.prompt, answers, decisions, note };
  };

  return {
    /** Adds every question from the backup that does not exist yet; existing ones are left untouched. All or nothing. */
    restore(backup: RestoreBackupInput): RestoreResult {
      return withTransaction(db, () =>
        backup.questions.reduce<RestoreResult>(
          (acc, entry) =>
            questions.get(entry.question.id)
              ? { ...acc, skipped: [...acc.skipped, { id: entry.question.id, prompt: entry.question.prompt, reason: 'already exists' }] }
              : { ...acc, restored: [...acc.restored, restoreOne(entry)] },
          { restored: [], skipped: [] },
        ),
      );
    },
  };
}

export type RestoreService = ReturnType<typeof createRestoreService>;
