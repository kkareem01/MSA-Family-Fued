import type { OpenQuestion, SurveySubmitResult } from '@feud/shared';

export type AnsweredMap = Readonly<Record<string, true>>;

/** Open questions this phone has not answered yet, in the host's order. */
export function pendingQuestions(open: readonly OpenQuestion[], answered: AnsweredMap): readonly OpenQuestion[] {
  return open.filter((q) => !answered[q.id]);
}

/** Accepted and duplicate answers both mean "this phone is done with that question". */
export function markAnswered(answered: AnsweredMap, results: readonly SurveySubmitResult[]): AnsweredMap {
  const done = results.filter((r) => r.status === 'accepted' || r.status === 'duplicate').map((r) => r.questionId);
  return done.reduce<AnsweredMap>((acc, id) => ({ ...acc, [id]: true }), answered);
}

export function parseAnswered(raw: string | null): AnsweredMap {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.keys(parsed).map((k) => [k, true as const]));
  } catch {
    return {};
  }
}

/** Only non-empty drafts are worth sending. */
export function draftsToSend(drafts: Readonly<Record<string, string>>, pending: readonly OpenQuestion[]) {
  return pending
    .map((q) => ({ questionId: q.id, text: (drafts[q.id] ?? '').trim() }))
    .filter((a) => a.text.length > 0);
}
