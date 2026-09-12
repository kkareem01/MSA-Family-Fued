import { beforeEach, describe, expect, it } from 'vitest';
import { createBoardAnswerRepo } from './boardAnswerRepo';
import { createQuestionRepo } from './questionRepo';
import { createTestDb } from '../test/helpers';
import type { Database } from '../db/connection';

describe('boardAnswerRepo', () => {
  let db: Database;
  let qid: string;
  beforeEach(() => {
    db = createTestDb();
    qid = createQuestionRepo(db).insert({ prompt: 'Q' }).id;
  });

  it('replaces the board atomically and reads it back sorted by rank', () => {
    const repo = createBoardAnswerRepo(db);
    repo.replaceForQuestion(qid, [
      { rank: 2, text: 'B', points: 30, responseCount: 3, sourceKeys: ['b'] },
      { rank: 1, text: 'A', points: 70, responseCount: 7, sourceKeys: ['a', 'aa'] },
    ]);
    expect(repo.getBoard(qid).map((a) => a.text)).toEqual(['A', 'B']);
    expect(repo.getBoard(qid)[0]).toMatchObject({ rank: 1, points: 70, responseCount: 7, sourceKeys: ['a', 'aa'] });
    repo.replaceForQuestion(qid, [{ rank: 1, text: 'Only', points: 100, responseCount: 1, sourceKeys: [] }]);
    expect(repo.getBoard(qid)).toHaveLength(1);
    expect(repo.getBoard(qid)[0]?.id).toBeTruthy();
  });

  it('rolls back when a rank is duplicated', () => {
    const repo = createBoardAnswerRepo(db);
    repo.replaceForQuestion(qid, [{ rank: 1, text: 'Keep', points: 100, responseCount: 1, sourceKeys: [] }]);
    expect(() =>
      repo.replaceForQuestion(qid, [
        { rank: 1, text: 'X', points: 50, responseCount: 1, sourceKeys: [] },
        { rank: 1, text: 'Y', points: 50, responseCount: 1, sourceKeys: [] },
      ]),
    ).toThrow();
    expect(repo.getBoard(qid).map((a) => a.text)).toEqual(['Keep']);
  });

  it('clears a board', () => {
    const repo = createBoardAnswerRepo(db);
    repo.replaceForQuestion(qid, [{ rank: 1, text: 'A', points: 100, responseCount: 1, sourceKeys: [] }]);
    repo.clearForQuestion(qid);
    expect(repo.getBoard(qid)).toEqual([]);
  });
});
