import { MIN_MULTIPLIER, MAX_MULTIPLIER, type GameState } from '@feud/shared';
import { useHost } from './HostContext';
import { QuestionPicker } from './QuestionPicker';
import { BoardPreview } from './BoardPreview';
import { StrikeButton } from './StrikeButton';
import { FaceoffControls } from './FaceoffControls';
import { PlayOrPassControls } from './PlayOrPassControls';
import { RoundControls } from './RoundControls';

const MULTIPLIER_CHOICES = Array.from({ length: MAX_MULTIPLIER - MIN_MULTIPLIER + 1 }, (_, i) => MIN_MULTIPLIER + i);

function RoundIntroControls({ state }: { state: GameState }) {
  const { send, allowed } = useHost();
  return (
    <section className="panel stack">
      <button type="button" className="btn btn-primary btn-big" onClick={() => void send({ type: 'START_FACEOFF' })}>
        Start face-off ▶
      </button>
      <div className="row">
        <span className="muted small">Points this round:</span>
        {MULTIPLIER_CHOICES.map((m) => (
          <button
            key={m}
            type="button"
            className={`btn btn-step${state.round.multiplier === m ? ' btn-gold' : ' btn-ghost'}`}
            disabled={!allowed('SET_MULTIPLIER')}
            onClick={() => void send({ type: 'SET_MULTIPLIER', multiplier: m })}
          >
            ×{m}
          </button>
        ))}
      </div>
    </section>
  );
}

function StealHint({ state }: { state: GameState }) {
  const team = state.round.steal.stealingTeam;
  if (!team) return null;
  return <p className="steal-hint">Steal: tap the answer {state.teams[team].name} said if it is on the board.</p>;
}

/** Everything the host can do in the current phase, top to bottom in the order they will need it. */
export function HostControls({ state }: { state: GameState }) {
  const { send, allowed } = useHost();
  const { phase, round } = state;
  const board = round.board;
  const showBoard = board !== null && phase !== 'idle' && phase !== 'game_over';

  return (
    <div className="stack stack-lg">
      {phase === 'idle' ? <QuestionPicker title={round.index === 0 ? 'Start the game' : `Round ${round.index + 1}`} /> : null}
      {phase === 'round_intro' ? <RoundIntroControls state={state} /> : null}
      {phase === 'faceoff' || phase === 'faceoff_answering' ? <FaceoffControls state={state} /> : null}
      {phase === 'play_or_pass' ? <PlayOrPassControls state={state} /> : null}
      {phase === 'steal' ? <StealHint state={state} /> : null}
      <StrikeButton phase={phase} />
      {showBoard && board ? (
        <BoardPreview board={board} phase={phase} canReveal={allowed('REVEAL_ANSWER')} onReveal={(rank) => void send({ type: 'REVEAL_ANSWER', rank })} />
      ) : null}
      {phase === 'round_intro' ? <QuestionPicker title="Swap the question" /> : null}
      <RoundControls state={state} />
    </div>
  );
}
