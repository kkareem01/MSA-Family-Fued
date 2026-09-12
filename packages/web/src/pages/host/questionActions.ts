import type { QuestionStatus, QuestionSummary } from '@feud/shared';

export type QuestionActionKind = 'open' | 'close' | 'reopen' | 'tally' | 'unfinalize' | 'restore' | 'delete';

export type QuestionAction = Readonly<{
  kind: QuestionActionKind;
  label: string;
  tone: 'primary' | 'gold' | 'danger' | 'default';
  /** For status changes: the status to move to. */
  status?: QuestionStatus;
}>;

const OPEN: QuestionAction = { kind: 'open', label: 'Open survey', tone: 'primary', status: 'open' };
const CLOSE: QuestionAction = { kind: 'close', label: 'Close survey', tone: 'default', status: 'closed' };
const REOPEN: QuestionAction = { kind: 'reopen', label: 'Reopen survey', tone: 'default', status: 'open' };
const TALLY: QuestionAction = { kind: 'tally', label: 'Tally and build board', tone: 'gold' };
const UNFINALIZE: QuestionAction = { kind: 'unfinalize', label: 'Unfinalize', tone: 'default', status: 'closed' };
const RESTORE: QuestionAction = { kind: 'restore', label: 'Make playable again', tone: 'default', status: 'finalized' };
const DELETE: QuestionAction = { kind: 'delete', label: 'Delete', tone: 'danger' };

/** What the host can do with a question, in the order the buttons should appear. */
export function questionActions(question: QuestionSummary): readonly QuestionAction[] {
  switch (question.status) {
    case 'draft':
      return [OPEN, DELETE];
    case 'open':
      return [CLOSE, TALLY];
    case 'closed':
      return [TALLY, REOPEN, DELETE];
    case 'finalized':
      return [TALLY, UNFINALIZE, DELETE];
    case 'played':
      return question.hasBoard ? [RESTORE] : [];
  }
}

export const STATUS_HINTS: Readonly<Record<QuestionStatus, string>> = {
  draft: 'Not visible to the audience yet.',
  open: 'Audience can answer this right now.',
  closed: 'Survey closed. Build the board from the tally.',
  finalized: 'Board is ready to load from the host panel.',
  played: 'Already played on the board.',
};
