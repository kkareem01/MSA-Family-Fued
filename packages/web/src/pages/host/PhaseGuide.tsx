import type { GameState } from '@feud/shared';
import { phaseGuideText } from './phaseGuideText';

const PHASE_LABELS: Record<GameState['phase'], string> = {
  idle: 'Between rounds',
  round_intro: 'Round intro',
  faceoff: 'Face-off',
  faceoff_answering: 'Face-off answer',
  play_or_pass: 'Play or pass',
  in_play: 'In play',
  steal: 'Steal',
  round_over: 'Round over',
  game_over: 'Game over',
};

export function PhaseGuide({ state }: { state: GameState }) {
  return (
    <section className="phase-guide" aria-live="polite">
      <span className="pill pill-phase">{PHASE_LABELS[state.phase]}</span>
      <p>{phaseGuideText(state)}</p>
    </section>
  );
}
