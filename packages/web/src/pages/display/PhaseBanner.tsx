import { otherTeam, type GameState, type TeamId } from '@feud/shared';

type Props = Readonly<{ state: GameState; buzzFlashTeam: TeamId | null }>;

type Banner = Readonly<{ kicker: string; title: string; tone: 'gold' | 'red' | 'blue' }>;

function bannerFor(state: GameState, buzzFlashTeam: TeamId | null): Banner | null {
  const name = (team: TeamId | null) => (team ? state.teams[team].name : '');
  const { faceoff, steal, controlTeam } = state.round;
  switch (state.phase) {
    case 'faceoff':
      return { kicker: 'Face-off', title: 'Buzz in!', tone: 'gold' };
    case 'faceoff_answering':
      return buzzFlashTeam
        ? { kicker: 'Buzzed first', title: name(buzzFlashTeam), tone: 'gold' }
        : { kicker: 'Face-off', title: `${name(faceoff.answeringTeam)} answers`, tone: 'blue' };
    case 'play_or_pass':
      return { kicker: name(faceoff.winner), title: 'Play or pass?', tone: 'gold' };
    case 'steal':
      return { kicker: 'Steal!', title: `${name(steal.stealingTeam)}, one guess`, tone: 'red' };
    case 'in_play':
      return controlTeam ? { kicker: 'In control', title: name(controlTeam), tone: 'blue' } : null;
    default:
      return null;
  }
}

export function PhaseBanner({ state, buzzFlashTeam }: Props) {
  const banner = bannerFor(state, buzzFlashTeam);
  if (!banner) return null;
  const subtle = state.phase === 'in_play' || (state.phase === 'faceoff_answering' && !buzzFlashTeam);
  return (
    <div className={`phase-banner tone-${banner.tone}${subtle ? ' subtle' : ''}`} role="status">
      <span className="phase-kicker">{banner.kicker}</span>
      <span className="phase-title">{banner.title}</span>
    </div>
  );
}

export { otherTeam };
