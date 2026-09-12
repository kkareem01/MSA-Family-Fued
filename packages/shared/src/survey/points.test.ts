import { describe, expect, it } from 'vitest';
import { computePoints } from './points';

describe('computePoints', () => {
  it('scales a count to a whole-number share of 100', () => {
    expect(computePoints(38, 100)).toBe(38);
    expect(computePoints(1, 3)).toBe(33);
    expect(computePoints(2, 3)).toBe(67);
    expect(computePoints(7, 7)).toBe(100);
  });

  it('returns zero when there are no responses', () => {
    expect(computePoints(0, 0)).toBe(0);
    expect(computePoints(5, 0)).toBe(0);
  });
});
