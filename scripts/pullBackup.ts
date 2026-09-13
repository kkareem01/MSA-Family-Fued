/**
 * Pulls every question and its tally out of a running server into a JSON file, using only
 * the host API that already exists. Nothing on the server changes.
 *
 *   node --import tsx scripts/pullBackup.ts <server url> <host pin> [output file]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { QuestionSummary, TallyView } from '@feud/shared';

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;
type Envelope<T> = { ok: boolean; data: T; error: { message: string } | null };

export type PulledQuestion = Readonly<{ question: QuestionSummary; tally: TallyView }>;
export type PulledBackup = Readonly<{ pulledAt: string; server: string; questions: readonly PulledQuestion[] }>;

async function getJson<T>(fetchFn: FetchLike, url: string, pin: string): Promise<T> {
  const response = await fetchFn(url, { headers: { 'x-host-pin': pin } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}. Wrong PIN or wrong address?`);
  const body = (await response.json()) as Envelope<T>;
  if (!body.ok) throw new Error(`${url}: ${body.error?.message ?? 'failed'}`);
  return body.data;
}

export async function pullBackup(serverUrl: string, pin: string, fetchFn: FetchLike = fetch): Promise<PulledBackup> {
  const base = serverUrl.replace(/\/+$/u, '');
  const questions = await getJson<QuestionSummary[]>(fetchFn, `${base}/api/questions`, pin);
  const pulled: PulledQuestion[] = [];
  for (const question of questions) {
    const tally = await getJson<TallyView>(fetchFn, `${base}/api/questions/${question.id}/tally`, pin);
    pulled.push({ question, tally });
  }
  return { pulledAt: new Date().toISOString(), server: base, questions: pulled };
}

export function summarize(backup: PulledBackup): string {
  const answers = backup.questions.reduce((n, q) => n + q.tally.totalResponses, 0);
  const lines = backup.questions.map((q) => `  ${q.tally.totalResponses.toString().padStart(3)}  ${q.question.status.padEnd(9)} ${q.question.prompt}`);
  return [`${backup.questions.length} questions, ${answers} answers`, ...lines].join('\n');
}

async function main(): Promise<void> {
  const [serverUrl, pin, output] = process.argv.slice(2);
  if (!serverUrl || !pin) {
    console.error('Usage: node --import tsx scripts/pullBackup.ts <server url> <host pin> [output file]');
    process.exit(2);
  }
  const backup = await pullBackup(serverUrl, pin);
  const file = resolve(output ?? `data/backups/pull-${backup.pulledAt.replace(/[:.]/gu, '-')}.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(backup, null, 2));
  console.log(summarize(backup));
  console.log(`\nSaved to ${file}`);
}

if (process.argv[1]?.endsWith('pullBackup.ts')) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
