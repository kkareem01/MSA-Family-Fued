import type { GameState } from '@feud/shared';
import { PHASE_LABELS, phaseGuideText } from './phaseGuideText';

export function PhaseGuide({ state }: { state: GameState }) {
  return (
    <section className="phase-guide" aria-live="polite">
      <span className="pill pill-phase">{PHASE_LABELS[state.phase]}</span>
      <p>{phaseGuideText(state)}</p>
    </section>
  );
}
