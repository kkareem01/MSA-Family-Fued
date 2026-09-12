import { beforeEach, describe, expect, it } from 'vitest';
import { createTallyDecisionRepo } from './tallyDecisionRepo';
import { createQuestionRepo } from './questionRepo';
import { createTestDb } from '../test/helpers';
import type { Database } from '../db/connection';

describe('tallyDecisionRepo', () => {
  let db: Database;
  let qid: string;
  beforeEach(() => {
    db = createTestDb();
    qid = createQuestionRepo(db).insert({ prompt: 'Q' }).id;
  });

  it('upserts individual fields without clobbering the others', () => {
    const repo = createTallyDecisionRepo(db);
    repo.setDisplayText(qid, 'pizza', 'Pizza!');
    repo.setPointsOverride(qid, 'pizza', 40);
    repo.setDropped(qid, 'pizza', true);
    repo.setMergedInto(qid, 'pizza', 'food');
    expect(repo.get(qid, 'pizza')).toEqual({ key: 'pizza', displayText: 'Pizza!', mergedIntoKey: 'food', dropped: true, pointsOverride: 40 });
    repo.setDropped(qid, 'pizza', false);
    repo.setMergedInto(qid, 'pizza', null);
    expect(repo.get(qid, 'pizza')).toMatchObject({ displayText: 'Pizza!', mergedIntoKey: null, dropped: false, pointsOverride: 40 });
    expect(repo.get(qid, 'missing')).toBeNull();
  });

  it('lists per question and repoints merges', () => {
    const repo = createTallyDecisionRepo(db);
    repo.setMergedInto(qid, 'a', 'x');
    repo.setMergedInto(qid, 'b', 'x');
    repo.setMergedInto(qid, 'c', 'y');
    repo.repointMerges(qid, 'x', 'z');
    const merged = Object.fromEntries(repo.listByQuestion(qid).map((d) => [d.key, d.mergedIntoKey]));
    expect(merged).toEqual({ a: 'z', b: 'z', c: 'y' });
    const other = createQuestionRepo(db).insert({ prompt: 'Other' }).id;
    expect(repo.listByQuestion(other)).toEqual([]);
  });
});
