import { describe, expect, it } from 'vitest';
import { defaultTopN, variantsSummary } from './tallyHelpers';

describe('tally helpers', () => {
  it('clamps the default board size to 1..8', () => {
    expect(defaultTopN(0)).toBe(1);
    expect(defaultTopN(5)).toBe(5);
    expect(defaultTopN(12)).toBe(8);
  });

  it('summarizes spelling variants compactly', () => {
    expect(variantsSummary([{ text: 'Pizza', count: 3 }, { text: 'pizza', count: 1 }])).toBe('Pizza ×3, pizza ×1');
    const many = Array.from({ length: 6 }, (_, i) => ({ text: `v${i}`, count: 1 }));
    expect(variantsSummary(many)).toMatch(/\+2 more$/u);
  });
});
