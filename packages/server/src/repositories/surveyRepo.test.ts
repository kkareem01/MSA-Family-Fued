import { beforeEach, describe, expect, it } from 'vitest';
import { createSurveyRepo } from './surveyRepo';
import { createQuestionRepo } from './questionRepo';
import { createTestDb } from '../test/helpers';
import type { Database } from '../db/connection';

describe('surveyRepo', () => {
  let db: Database;
  let questionId: string;
  beforeEach(() => {
    db = createTestDb();
    questionId = createQuestionRepo(db).insert({ prompt: 'Q' }).id;
  });

  it('inserts and lists responses in arrival order', () => {
    const repo = createSurveyRepo(db);
    expect(repo.insert({ questionId, rawText: 'Pizza', normalizedText: 'pizza', submitterToken: 'tok-1', ipHash: 'h' }, 5)).toBe('inserted');
    expect(repo.insert({ questionId, rawText: 'Tacos', normalizedText: 'taco', submitterToken: 'tok-2', ipHash: null }, 6)).toBe('inserted');
    const rows = repo.listByQuestion(questionId);
    expect(rows.map((r) => r.rawText)).toEqual(['Pizza', 'Tacos']);
    expect(rows[0]).toMatchObject({ questionId, normalizedText: 'pizza', submitterToken: 'tok-1', createdAt: 5 });
    expect(repo.countByQuestion(questionId)).toBe(2);
  });

  it('rejects a second answer from the same token for the same question', () => {
    const repo = createSurveyRepo(db);
    repo.insert({ questionId, rawText: 'Pizza', normalizedText: 'pizza', submitterToken: 'tok-1', ipHash: null });
    expect(repo.insert({ questionId, rawText: 'Again', normalizedText: 'again', submitterToken: 'tok-1', ipHash: null })).toBe('duplicate');
    expect(repo.countByQuestion(questionId)).toBe(1);
  });

  it('cascades when the question is deleted', () => {
    const repo = createSurveyRepo(db);
    repo.insert({ questionId, rawText: 'Pizza', normalizedText: 'pizza', submitterToken: 'tok-1', ipHash: null });
    createQuestionRepo(db).remove(questionId);
    expect(repo.countByQuestion(questionId)).toBe(0);
  });
});
