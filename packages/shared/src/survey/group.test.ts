import { describe, expect, it } from 'vitest';
import { buildTally } from './group';
import { normalizeAnswer } from './normalize';
import type { SurveyResponse, TallyDecision } from './types';

let seq = 0;
function response(rawText: string, questionId = 'q1'): SurveyResponse {
  seq += 1;
  return {
    id: `r${seq}`,
    questionId,
    rawText,
    normalizedText: normalizeAnswer(rawText),
    submitterToken: `t${seq}`,
    createdAt: seq,
  };
}

function decision(partial: Partial<TallyDecision> & { key: string }): TallyDecision {
  return { displayText: null, mergedIntoKey: null, dropped: false, pointsOverride: null, ...partial };
}

const RESPONSES = [
  response('Pizza'),
  response('pizza'),
  response('Pizzas'),
  response('Burgers'),
  response('burger'),
  response('Shawarma'),
];

describe('buildTally', () => {
  it('buckets by normalized key with counts, ids and spelling variants', () => {
    const view = buildTally('q1', 'closed', RESPONSES, []);
    expect(view.totalResponses).toBe(6);
    expect(view.keptResponses).toBe(6);
    expect(view.groups.map((g) => [g.key, g.count])).toEqual([
      ['pizza', 3],
      ['burger', 2],
      ['shawarma', 1],
    ]);
    const pizza = view.groups[0]!;
    expect(pizza.responseIds).toHaveLength(3);
    expect(pizza.variants).toEqual([
      { text: 'Pizza', count: 1 },
      { text: 'Pizzas', count: 1 },
      { text: 'pizza', count: 1 },
    ]);
    expect(pizza.displayText).toBe('Pizza');
    expect(pizza.points).toBe(50);
    expect(view.hidden).toEqual([]);
  });

  it('sorts by count then key and capitalizes the top variant by default', () => {
    const view = buildTally('q1', 'closed', [response('zebra'), response('apple'), response('apple'), response('mango')], []);
    expect(view.groups.map((g) => g.displayText)).toEqual(['Apple', 'Mango', 'Zebra']);
  });

  it('folds merged groups into their root and lists the child as hidden', () => {
    const view = buildTally('q1', 'closed', RESPONSES, [decision({ key: 'shawarma', mergedIntoKey: 'burger' })]);
    const burger = view.groups.find((g) => g.key === 'burger')!;
    expect(burger.count).toBe(3);
    expect(burger.mergedKeys).toEqual(['shawarma']);
    expect(burger.responseIds).toHaveLength(3);
    expect(burger.variants.map((v) => v.text)).toContain('Shawarma');
    expect(view.groups.map((g) => g.key)).toEqual(['burger', 'pizza']);
    expect(view.hidden).toEqual([expect.objectContaining({ key: 'shawarma', mergedInto: 'burger', count: 1 })]);
  });

  it('resolves merge chains to the final root', () => {
    const view = buildTally('q1', 'closed', RESPONSES, [
      decision({ key: 'shawarma', mergedIntoKey: 'burger' }),
      decision({ key: 'burger', mergedIntoKey: 'pizza' }),
    ]);
    expect(view.groups).toHaveLength(1);
    expect(view.groups[0]).toMatchObject({ key: 'pizza', count: 6, points: 100 });
    expect([...view.groups[0]!.mergedKeys].sort()).toEqual(['burger', 'shawarma']);
  });

  it('survives a merge cycle by leaving both keys as roots', () => {
    const view = buildTally('q1', 'closed', RESPONSES, [
      decision({ key: 'burger', mergedIntoKey: 'pizza' }),
      decision({ key: 'pizza', mergedIntoKey: 'burger' }),
    ]);
    expect(view.groups.map((g) => g.key).sort()).toEqual(['burger', 'pizza', 'shawarma']);
  });

  it('excludes dropped groups from kept responses so points rescale', () => {
    const view = buildTally('q1', 'closed', RESPONSES, [decision({ key: 'shawarma', dropped: true })]);
    expect(view.keptResponses).toBe(5);
    expect(view.groups.map((g) => [g.key, g.points])).toEqual([
      ['pizza', 60],
      ['burger', 40],
    ]);
    expect(view.hidden).toEqual([expect.objectContaining({ key: 'shawarma', dropped: true, mergedInto: null })]);
  });

  it('applies renames and point overrides', () => {
    const view = buildTally('q1', 'closed', RESPONSES, [
      decision({ key: 'pizza', displayText: 'Pizza (any kind)', pointsOverride: 45 }),
    ]);
    expect(view.groups[0]).toMatchObject({ displayText: 'Pizza (any kind)', points: 45, pointsOverride: 45 });
  });

  it('ignores decisions for keys with no responses and responses for other questions', () => {
    const view = buildTally('q1', 'open', [...RESPONSES, response('Sushi', 'q2')], [decision({ key: 'ghost', dropped: true })]);
    expect(view.totalResponses).toBe(6);
    expect(view.groups.map((g) => g.key)).not.toContain('ghost');
    expect(view.groups.map((g) => g.key)).not.toContain('sushi');
    expect(view.status).toBe('open');
  });

  it('handles no responses', () => {
    const view = buildTally('q1', 'draft', [], []);
    expect(view).toMatchObject({ totalResponses: 0, keptResponses: 0, groups: [], hidden: [] });
  });
});
