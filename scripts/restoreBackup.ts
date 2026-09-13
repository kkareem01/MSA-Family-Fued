/**
 * Loads a file written by pullBackup.ts into a server. Questions that already exist are skipped,
 * so running it twice is safe.
 *
 *   node --import tsx scripts/restoreBackup.ts <server url> <host pin> <backup file>
 */
import { readFileSync } from 'node:fs';
import type { RestoreResult } from '@feud/shared';

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;
type Envelope<T> = { ok: boolean; data: T; error: { message: string } | null };

export async function restoreBackup(serverUrl: string, pin: string, backup: unknown, fetchFn: FetchLike = fetch): Promise<RestoreResult> {
  const base = serverUrl.replace(/\/+$/u, '');
  const response = await fetchFn(`${base}/api/restore`, {
    method: 'POST',
    headers: { 'x-host-pin': pin, 'content-type': 'application/json' },
    body: JSON.stringify(backup),
  });
  const body = (await response.json().catch(() => null)) as Envelope<RestoreResult> | null;
  if (!response.ok || !body?.ok) throw new Error(`Restore failed (${response.status}): ${body?.error?.message ?? 'no details'}`);
  return body.data;
}

export function describeResult(result: RestoreResult): string {
  const answers = result.restored.reduce((n, q) => n + q.answers, 0);
  const lines = result.restored.map((q) => `  +${q.answers.toString().padStart(3)} answers  ${q.prompt}${q.note ? `  (${q.note})` : ''}`);
  const skipped = result.skipped.map((q) => `  skipped (${q.reason})  ${q.prompt}`);
  return [`Restored ${result.restored.length} questions, ${answers} answers`, ...lines, ...skipped].join('\n');
}

async function main(): Promise<void> {
  const [serverUrl, pin, file] = process.argv.slice(2);
  if (!serverUrl || !pin || !file) {
    console.error('Usage: node --import tsx scripts/restoreBackup.ts <server url> <host pin> <backup file>');
    process.exit(2);
  }
  const backup = JSON.parse(readFileSync(file, 'utf8')) as unknown;
  console.log(describeResult(await restoreBackup(serverUrl, pin, backup)));
}

if (process.argv[1]?.endsWith('restoreBackup.ts')) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
