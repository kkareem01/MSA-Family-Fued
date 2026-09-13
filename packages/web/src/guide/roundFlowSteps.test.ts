import { describe, expect, it } from 'vitest';
import { PHASES } from '@feud/shared';
import { ROUND_FLOW, stepIndexForPhase } from './roundFlowSteps';

describe('round flow steps', () => {
  it('maps every phase to exactly one step', () => {
    for (const phase of PHASES) {
      const matches = ROUND_FLOW.filter((step) => step.phases.includes(phase));
      expect(matches, phase).toHaveLength(1);
      expect(ROUND_FLOW[stepIndexForPhase(phase)]).toBe(matches[0]);
    }
  });

  it('starts by picking a question and ends with the game over', () => {
    expect(ROUND_FLOW[0]?.phases).toEqual(['idle']);
    expect(ROUND_FLOW.at(-1)?.phases).toEqual(['game_over']);
    expect(ROUND_FLOW.every((s) => s.label.length > 0 && s.detail.length > 0)).toBe(true);
  });
});
