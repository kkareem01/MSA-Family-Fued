import { describe, expect, it, vi } from 'vitest';
import { describeResult, restoreBackup } from './restoreBackup';

describe('restoreBackup', () => {
  it('posts the file with the PIN and summarizes what came back', async () => {
    const result = { restored: [{ id: 'q1', prompt: 'Name a fruit', answers: 6, decisions: 1, note: null }], skipped: [{ id: 'q2', prompt: 'Name a city', reason: 'already exists' }] };
    const fetchFn = vi.fn((url: string, init?: RequestInit) => {
      expect(url).toBe('https://x.example/api/restore');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(String(init?.body))).toEqual({ questions: [] });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, data: result }) } as unknown as Response);
    });
    const out = await restoreBackup('https://x.example/', 'pin', { questions: [] }, fetchFn);
    expect(describeResult(out)).toBe('Restored 1 questions, 6 answers\n  +  6 answers  Name a fruit\n  skipped (already exists)  Name a city');
  });

  it('explains a refusal', async () => {
    const fetchFn = vi.fn(() => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({ ok: false, error: { message: 'Unauthorized' } }) } as unknown as Response));
    await expect(restoreBackup('https://x.example', 'bad', {}, fetchFn)).rejects.toThrow(/401.*Unauthorized/u);
  });
});
