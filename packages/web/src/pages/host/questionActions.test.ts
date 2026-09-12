import { describe, expect, it } from 'vitest';
import type { QuestionSummary } from '@feud/shared';
import { questionActions } from './questionActions';

function question(status: QuestionSummary['status'], hasBoard = false): QuestionSummary {
  return { id: 'q', prompt: 'P', status, sortOrder: 1, createdAt: 0, updatedAt: 0, openedAt: null, closedAt: null, finalizedAt: null, playedAt: null, responseCount: 0, hasBoard };
}

describe('questionActions', () => {
  it('offers the right moves per status', () => {
    expect(questionActions(question('draft')).map((a) => a.kind)).toEqual(['open', 'delete']);
    expect(questionActions(question('open')).map((a) => a.kind)).toEqual(['close', 'tally']);
    expect(questionActions(question('closed')).map((a) => a.kind)).toEqual(['tally', 'reopen', 'delete']);
    expect(questionActions(question('finalized')).map((a) => a.kind)).toEqual(['tally', 'unfinalize', 'delete']);
    expect(questionActions(question('played', true)).map((a) => a.kind)).toEqual(['restore']);
    expect(questionActions(question('played', false))).toEqual([]);
  });

  it('carries the target status for status moves', () => {
    expect(questionActions(question('draft'))[0]?.status).toBe('open');
    expect(questionActions(question('finalized'))[1]?.status).toBe('closed');
  });
});
