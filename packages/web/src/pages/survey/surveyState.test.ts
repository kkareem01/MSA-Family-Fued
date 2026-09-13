import { describe, expect, it } from 'vitest';
import { draftsToSend, markAnswered, parseAnswered, pendingQuestions } from './surveyState';

const open = [
  { id: 'q1', prompt: 'One' },
  { id: 'q2', prompt: 'Two' },
];

describe('survey state helpers', () => {
  it('filters answered questions out of the pending list', () => {
    expect(pendingQuestions(open, { q1: true }).map((q) => q.id)).toEqual(['q2']);
  });

  it('marks accepted and duplicate results as answered, not invalid or closed', () => {
    const next = markAnswered({}, [
      { questionId: 'q1', status: 'accepted' },
      { questionId: 'q2', status: 'duplicate' },
      { questionId: 'q3', status: 'invalid' },
      { questionId: 'q4', status: 'closed' },
    ]);
    expect(next).toEqual({ q1: true, q2: true });
  });

  it('parses stored state defensively', () => {
    expect(parseAnswered(null)).toEqual({});
    expect(parseAnswered('{bad')).toEqual({});
    expect(parseAnswered('[1]')).toEqual({});
    expect(parseAnswered('{"q1":true,"q2":1}')).toEqual({ q1: true, q2: true });
  });

  it('sends only non-empty drafts for pending questions', () => {
    expect(draftsToSend({ q1: '  Pizza ', q2: '   ', q9: 'stale' }, open)).toEqual([{ questionId: 'q1', text: 'Pizza' }]);
  });
});
