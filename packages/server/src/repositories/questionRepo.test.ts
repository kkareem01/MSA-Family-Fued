import { beforeEach, describe, expect, it } from 'vitest';
import { createQuestionRepo } from './questionRepo';
import { createSurveyRepo } from './surveyRepo';
import { createBoardAnswerRepo } from './boardAnswerRepo';
import { createTestDb } from '../test/helpers';
import type { Database } from '../db/connection';

describe('questionRepo', () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
  });

  it('inserts drafts in order and lists them with counts', () => {
    const repo = createQuestionRepo(db);
    const first = repo.insert({ prompt: 'Name a fruit' }, 100);
    const second = repo.insert({ prompt: 'Name a city' }, 200);
    expect(first.status).toBe('draft');
    expect(first.sortOrder).toBeLessThan(second.sortOrder);
    const list = repo.list();
    expect(list.map((q) => q.prompt)).toEqual(['Name a fruit', 'Name a city']);
    expect(list[0]).toMatchObject({ responseCount: 0, hasBoard: false, createdAt: 100 });
  });

  it('counts responses and detects a finalized board', () => {
    const repo = createQuestionRepo(db);
    const q = repo.insert({ prompt: 'Q' });
    createSurveyRepo(db).insert({ questionId: q.id, rawText: 'a', normalizedText: 'a', submitterToken: 't1', ipHash: null }, 1);
    createSurveyRepo(db).insert({ questionId: q.id, rawText: 'b', normalizedText: 'b', submitterToken: 't2', ipHash: null }, 2);
    createBoardAnswerRepo(db).replaceForQuestion(q.id, [{ rank: 1, text: 'A', points: 100, responseCount: 2, sourceKeys: ['a'] }]);
    expect(repo.list()[0]).toMatchObject({ responseCount: 2, hasBoard: true });
    expect(repo.listByStatus('draft')).toHaveLength(1);
    expect(repo.listByStatus('open')).toHaveLength(0);
  });

  it('gets, updates and removes', () => {
    const repo = createQuestionRepo(db);
    const q = repo.insert({ prompt: 'Q' });
    expect(repo.get(q.id)?.prompt).toBe('Q');
    expect(repo.get('nope')).toBeNull();
    const updated = repo.update(q.id, { prompt: 'Q2', sortOrder: 5 }, 999);
    expect(updated).toMatchObject({ prompt: 'Q2', sortOrder: 5, updatedAt: 999 });
    expect(repo.update('nope', { prompt: 'x' })).toBeNull();
    expect(repo.remove(q.id)).toBe(true);
    expect(repo.remove(q.id)).toBe(false);
  });

  it('stamps status timestamps', () => {
    const repo = createQuestionRepo(db);
    const q = repo.insert({ prompt: 'Q' });
    expect(repo.setStatus(q.id, 'open', 10)).toMatchObject({ status: 'open', openedAt: 10 });
    expect(repo.setStatus(q.id, 'closed', 20)).toMatchObject({ status: 'closed', closedAt: 20 });
    expect(repo.setStatus(q.id, 'finalized', 30)).toMatchObject({ status: 'finalized', finalizedAt: 30 });
    expect(repo.setStatus('nope', 'open', 1)).toBeNull();
  });
});
