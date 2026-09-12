import { openDatabase, type Database } from '../db/connection';
import { runMigrations } from '../db/migrations';
import { buildApp, type BuiltApp } from '../app';
import type { ServerConfig } from '../config';

export const TEST_PIN = 'test-pin';

export function createTestDb(): Database {
  const db = openDatabase(':memory:');
  runMigrations(db);
  return db;
}

export function testConfig(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    hostPin: TEST_PIN,
    port: 0,
    dbPath: ':memory:',
    soundsDir: '/nonexistent/sounds',
    webDist: '/nonexistent/dist',
    publicUrl: null,
    logLevel: 'silent',
    nodeEnv: 'test',
    repoRoot: '/nonexistent',
    ...overrides,
  };
}

export type TestApp = BuiltApp & { db: Database; hostHeaders: Readonly<Record<string, string>> };

export async function buildTestApp(options: { db?: Database; surveyRateLimitMax?: number } = {}): Promise<TestApp> {
  const db = options.db ?? createTestDb();
  const built = await buildApp({
    config: testConfig(),
    db,
    rateLimits: { surveyMax: options.surveyRateLimitMax ?? 1000, globalMax: 100000, timeWindowMs: 60_000 },
  });
  await built.app.ready();
  return { ...built, db, hostHeaders: { 'x-host-pin': TEST_PIN } };
}

export async function seedQuestion(app: TestApp, prompt = 'Name a food', status?: 'open' | 'closed'): Promise<string> {
  const created = await app.app.inject({ method: 'POST', url: '/api/questions', headers: app.hostHeaders, payload: { prompt } });
  const id = (created.json() as { data: { id: string } }).data.id;
  if (status) {
    await app.app.inject({ method: 'POST', url: `/api/questions/${id}/status`, headers: app.hostHeaders, payload: { status: 'open' } });
  }
  if (status === 'closed') {
    await app.app.inject({ method: 'POST', url: `/api/questions/${id}/status`, headers: app.hostHeaders, payload: { status: 'closed' } });
  }
  return id;
}

export async function seedResponses(app: TestApp, questionId: string, texts: readonly string[]): Promise<void> {
  for (const [i, text] of texts.entries()) {
    await app.app.inject({
      method: 'POST',
      url: '/api/survey/responses',
      payload: { token: `token-${i}-${text.replace(/\W/gu, '')}`, answers: [{ questionId, text }] },
    });
  }
}

/** Creates, opens, fills, closes and finalizes a question; returns its id. */
export async function seedFinalizedQuestion(app: TestApp, texts: readonly string[] = ['Pizza', 'Pizza', 'Burgers', 'Tacos']): Promise<string> {
  const id = await seedQuestion(app, 'Name a food', 'open');
  await seedResponses(app, id, texts);
  await app.app.inject({ method: 'POST', url: `/api/questions/${id}/finalize`, headers: app.hostHeaders, payload: { topN: 8 } });
  return id;
}
