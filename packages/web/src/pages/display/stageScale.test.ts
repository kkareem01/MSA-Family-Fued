import { describe, expect, it } from 'vitest';
import { computeStageScale } from './stageScale';

describe('computeStageScale', () => {
  it('fits by the tighter dimension', () => {
    expect(computeStageScale(1920, 1080)).toBe(1);
    expect(computeStageScale(960, 1080)).toBe(0.5);
    expect(computeStageScale(1920, 540)).toBe(0.5);
    expect(computeStageScale(3840, 2160)).toBe(2);
  });
  it('guards against empty viewports', () => {
    expect(computeStageScale(0, 0)).toBe(1);
  });
});
