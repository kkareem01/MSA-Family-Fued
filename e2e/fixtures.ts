import type { APIRequestContext, Page } from '@playwright/test';
import { E2E_PIN } from '../playwright.config';

const HOST_HEADERS = { 'x-host-pin': E2E_PIN };

type Envelope<T> = { ok: boolean; data: T; error: { message: string } | null };

export async function api<T = unknown>(request: APIRequestContext, method: 'get' | 'post' | 'put', path: string, data?: unknown): Promise<T> {
  const response = await request[method](path, { headers: HOST_HEADERS, data });
  if (response.status() === 204) return undefined as T;
  const body = (await response.json()) as Envelope<T>;
  if (!body.ok) throw new Error(`${method.toUpperCase()} ${path}: ${body.error?.message ?? 'failed'}`);
  return body.data;
}

export const act = (request: APIRequestContext, action: unknown) => api(request, 'post', '/api/game/action', { action });

/** Creates a question, opens it, submits answers, and finalizes a board. Returns question id and board. */
export async function seedFinalizedQuestion(request: APIRequestContext, prompt: string, answers: readonly string[]) {
  const question = await api<{ id: string }>(request, 'post', '/api/questions', { prompt });
  await api(request, 'post', `/api/questions/${question.id}/status`, { status: 'open' });
  for (const [i, text] of answers.entries()) {
    await request.post('/api/survey/responses', { data: { token: `e2e-token-${question.id}-${i}`, answers: [{ questionId: question.id, text }] } });
  }
  const board = await api(request, 'post', `/api/questions/${question.id}/finalize`, { topN: 8 });
  return { id: question.id, board };
}

export async function hostSignIn(page: Page, path = '/host'): Promise<void> {
  await page.goto(path);
  await page.fill('input[type=password]', E2E_PIN);
  await page.click('button[type=submit]');
}

export async function openDisplay(page: Page): Promise<void> {
  await page.goto('/display');
  await page.click('.unlock-overlay');
}

export const resetGame = (request: APIRequestContext) => act(request, { type: 'RESET_GAME' });
