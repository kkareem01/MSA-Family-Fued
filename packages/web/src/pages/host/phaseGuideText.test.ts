import { describe, expect, it } from 'vitest';
import { PHASES } from '@feud/shared';
import { phaseGuideText } from './phaseGuideText';
import { stateInPhase } from '@feud/shared/testing';

describe('phaseGuideText', () => {
  it('has a sentence for every phase', () => {
    for (const phase of PHASES) {
      expect(phaseGuideText(stateInPhase(phase)).length).toBeGreaterThan(10);
    }
  });

  it('names the team that should act', () => {
    expect(phaseGuideText(stateInPhase('faceoff_answering'))).toContain('Team A');
    expect(phaseGuideText(stateInPhase('steal'))).toContain('Team B');
    expect(phaseGuideText(stateInPhase('in_play', { strikes: 2 }))).toContain('1 strike left');
  });
});
