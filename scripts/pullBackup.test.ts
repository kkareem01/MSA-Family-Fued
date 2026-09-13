import { describe, expect, it, vi } from 'vitest';
import { pullBackup, summarize } from './pullBackup';

const tally = (groups: { key: string; variants: { text: string; count: number }[] }[]) => ({
  questionId: 'q', status: 'open', totalResponses: groups.flatMap((g) => g.variants).reduce((n, v) => n + v.count, 0), keptResponses: 0, groups, hidden: [],
});

describe('pullBackup', () => {
  it('reads every question and its tally through the host API', async () => {
    const calls: string[] = [];
    const fetchFn = vi.fn((url: string, init?: RequestInit) => {
      calls.push(url);
      expect((init?.headers as Record<string, string>)['x-host-pin']).toBe('pin');
      const body = url.endsWith('/api/questions')
        ? { ok: true, data: [{ id: 'q1', prompt: 'Name a fruit', status: 'open', responseCount: 3 }, { id: 'q2', prompt: 'Name a city', status: 'draft', responseCount: 0 }] }
        : { ok: true, data: tally([{ key: 'mango', variants: [{ text: 'Mango', count: 2 }, { text: 'mangos', count: 1 }] }]) };
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as unknown as Response);
    });
    const backup = await pullBackup('https://x.example/', 'pin', fetchFn);
    expect(calls).toEqual(['https://x.example/api/questions', 'https://x.example/api/questions/q1/tally', 'https://x.example/api/questions/q2/tally']);
    expect(backup.questions).toHaveLength(2);
    expect(backup.questions[0]?.tally.groups[0]?.variants).toEqual([{ text: 'Mango', count: 2 }, { text: 'mangos', count: 1 }]);
    expect(summarize(backup)).toMatch(/2 questions, 6 answers/u);
  });

  it('fails loudly on a wrong PIN', async () => {
    const fetchFn = vi.fn(() => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({ ok: false, error: { message: 'Unauthorized' } }) } as unknown as Response));
    await expect(pullBackup('https://x.example', 'bad', fetchFn)).rejects.toThrow(/401/u);
  });
});
