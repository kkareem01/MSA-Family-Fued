import type { GameState, Phase, TeamId } from '@feud/shared';

export const PHASE_LABELS: Readonly<Record<Phase, string>> = {
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

function name(state: GameState, team: TeamId | null): string {
  return team ? state.teams[team].name : 'Nobody';
}

/** One plain sentence telling the host what to do right now. */
export function phaseGuideText(state: GameState): string {
  const { round } = state;
  switch (state.phase) {
    case 'idle':
      return round.index === 0 ? 'Pick a question to start round 1.' : `Pick a question for round ${round.index + 1}, or end the game.`;
    case 'round_intro':
      return 'Read the question out loud, get both players to the buzzers, then start the face-off.';
    case 'faceoff':
      return 'Buzzers are open. Wait for a phone buzz, or lock a team in yourself.';
    case 'faceoff_answering': {
      const who = name(state, round.faceoff.answeringTeam);
      return round.faceoff.attempts.length === 0
        ? `${who} answers first. Tap their answer on the board, or "Not on the board".`
        : `Now ${who} answers. Tap their answer, or "Not on the board".`;
    }
    case 'play_or_pass':
      return `${name(state, round.faceoff.winner)} won the face-off. Ask them: play or pass?`;
    case 'in_play': {
      const left = state.settings.maxStrikes - round.strikes;
      return `${name(state, round.controlTeam)} is in control with ${left} strike${left === 1 ? '' : 's'} left. Reveal answers or hit Strike.`;
    }
    case 'steal':
      return `${name(state, round.steal.stealingTeam)} gets one guess to steal. Reveal it if it's on the board, otherwise Steal failed.`;
    case 'round_over':
      return 'Round over. Reveal the remaining answers for the crowd, then go to the next round.';
    case 'game_over':
      return 'Game over. Start a new game when the next teams are ready.';
  }
}
