import { describe, expect, it } from 'vitest';
import { createTestDb } from '../test/helpers';
import { createBackupRepo } from './backupRepo';
import { createQuestionRepo } from './questionRepo';
import { createSurveyRepo } from './surveyRepo';
import { createSettingsRepo } from './settingsRepo';

describe('backupRepo', () => {
  it('dumps every table so nothing is lost even if the server is', () => {
    const db = createTestDb();
    const questions = createQuestionRepo(db);
    const q = questions.insert({ prompt: 'Name a fruit' }, 1);
    createSurveyRepo(db).insert({ questionId: q.id, rawText: 'Mango', normalizedText: 'mango', submitterToken: 'tok-1', ipHash: null }, 2);
    createSettingsRepo(db).set('public_url', 'https://x.example', 3);

    const dump = createBackupRepo(db).dumpAll(99);
    expect(dump.exportedAt).toBe(99);
    expect(dump.questions).toHaveLength(1);
    expect(dump.questions[0]).toMatchObject({ prompt: 'Name a fruit' });
    expect(dump.surveyResponses[0]).toMatchObject({ raw_text: 'Mango', question_id: q.id });
    expect(dump.settings).toEqual([{ key: 'public_url', value: 'https://x.example', updated_at: 3 }]);
    expect(dump.tallyDecisions).toEqual([]);
    expect(dump.boardAnswers).toEqual([]);
    expect(dump.gameState).toEqual([]);
  });
});
