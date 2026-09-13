import { describe, expect, it } from 'vitest';
import type { PresencePayload, QuestionSummary } from '@feud/shared';
import { buildChecks, checkSummary } from './checks';

const presence = (over: Partial<PresencePayload> = {}): PresencePayload => ({ displays: 1, displaysWithSound: 1, hosts: 1, buzzers: { A: 1, B: 1 }, ...over });
const question = (over: Partial<QuestionSummary>): QuestionSummary => ({
  id: 'q', prompt: 'p', status: 'draft', sortOrder: 1, createdAt: 0, updatedAt: 0, openedAt: null, closedAt: null, finalizedAt: null, playedAt: null, responseCount: 0, hasBoard: false, ...over,
});
const meta = { publicUrl: 'https://abc.trycloudflare.com', lanUrl: 'http://10.0.0.2:3000', surveyPath: '/survey', buzzerPath: '/buzzer', spotlight: null as null };
const allGood = { connected: true, presence: presence(), meta, questions: [question({ status: 'finalized', hasBoard: true }), question({ id: 'o', status: 'open' })] };

describe('buildChecks', () => {
  it('passes everything when the room is ready', () => {
    const checks = buildChecks(allGood);
    expect(checks.map((c) => c.id)).toEqual(['host', 'display', 'sound', 'link', 'buzzerA', 'buzzerB', 'boards', 'surveys']);
    expect(checks.every((c) => c.ok)).toBe(true);
    expect(checkSummary(checks)).toBe('8 of 8 checks pass');
  });

  it('explains each failure with a fix', () => {
    const checks = buildChecks({ connected: false, presence: null, meta: null, questions: null });
    expect(checks.every((c) => !c.ok)).toBe(true);
    expect(checks.every((c) => c.fix !== undefined || c.id === 'host')).toBe(true);
    expect(checkSummary(checks)).toBe('0 of 8 checks pass');
  });

  it('separates a projector with no sound from no projector at all', () => {
    const silent = buildChecks({ ...allGood, presence: presence({ displaysWithSound: 0 }) });
    expect(silent.find((c) => c.id === 'display')?.ok).toBe(true);
    expect(silent.find((c) => c.id === 'sound')).toMatchObject({ ok: false, detail: expect.stringMatching(/click/iu) });
    const none = buildChecks({ ...allGood, presence: presence({ displays: 0, displaysWithSound: 0 }) });
    expect(none.find((c) => c.id === 'display')?.ok).toBe(false);
  });

  it('warns about the same-wifi link and missing buzzers or boards', () => {
    const checks = buildChecks({ ...allGood, meta: { ...meta, publicUrl: null }, presence: presence({ buzzers: { A: 0, B: 2 } }), questions: [question({})] });
    expect(checks.find((c) => c.id === 'link')).toMatchObject({ ok: false, detail: expect.stringMatching(/same-wifi/iu), fix: { to: '/host/share' } });
    expect(checks.find((c) => c.id === 'buzzerA')?.ok).toBe(false);
    expect(checks.find((c) => c.id === 'buzzerB')?.ok).toBe(true);
    expect(checks.find((c) => c.id === 'boards')).toMatchObject({ ok: false, fix: { to: '/host/questions' } });
    expect(checks.find((c) => c.id === 'surveys')?.ok).toBe(false);
  });
});
