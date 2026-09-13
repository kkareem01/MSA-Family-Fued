import type { Phase } from '@feud/shared';

export type RoundFlowStep = Readonly<{ label: string; detail: string; phases: readonly Phase[] }>;

/** The round as the host experiences it, in order. Each phase belongs to exactly one step. */
export const ROUND_FLOW: readonly RoundFlowStep[] = [
  { label: 'Pick', detail: 'Choose a finalized board for this round.', phases: ['idle'] },
  { label: 'Read', detail: 'Read the question, get both players to their phones, start the face-off.', phases: ['round_intro'] },
  { label: 'Face-off', detail: 'First buzz answers. Tap their answer or “Not on the board”.', phases: ['faceoff', 'faceoff_answering'] },
  { label: 'Play or pass', detail: 'The face-off winner chooses to play or pass.', phases: ['play_or_pass'] },
  { label: 'In play', detail: 'Reveal right answers, Strike wrong ones.', phases: ['in_play'] },
  { label: 'Steal', detail: 'After the last strike the other team gets one guess.', phases: ['steal'] },
  { label: 'Round over', detail: 'Reveal the rest for the crowd, then next round.', phases: ['round_over'] },
  { label: 'Game over', detail: 'The winner is crowned. New game resets the scores.', phases: ['game_over'] },
];

export function stepIndexForPhase(phase: Phase): number {
  return ROUND_FLOW.findIndex((step) => step.phases.includes(phase));
}
