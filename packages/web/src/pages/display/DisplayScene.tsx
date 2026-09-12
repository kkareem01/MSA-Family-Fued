import { selectPot, SURVEY_PATH, type GameState, type MetaPayload } from '@feud/shared';
import type { DisplayFx } from './fx';
import { QuestionBanner } from './QuestionBanner';
import { Board } from './Board';
import { ScorePanel } from './ScorePanel';
import { PotBadge } from './PotBadge';
import { StrikeRow } from './StrikeRow';
import { StrikeOverlay } from './StrikeOverlay';
import { PhaseBanner } from './PhaseBanner';
import { RoundIntro } from './RoundIntro';
import { RoundResult } from './RoundResult';
import { WinnerScreen } from './WinnerScreen';
import { IdleScreen } from './IdleScreen';
import { QrCorner } from './QrCorner';

type Props = Readonly<{ state: GameState; meta: MetaPayload | null; fx: DisplayFx }>;

function surveyUrlFrom(meta: MetaPayload | null): string | null {
  return meta?.publicUrl ? `${meta.publicUrl}${meta.surveyPath}` : null;
}

export function DisplayScene({ state, meta, fx }: Props) {
  const surveyUrl = surveyUrlFrom(meta) ?? (meta ? `${meta.lanUrl}${SURVEY_PATH}` : null);
  if (state.phase === 'idle') return <IdleScreen state={state} surveyUrl={surveyUrl} />;
  if (state.phase === 'game_over') return <WinnerScreen state={state} confettiKey={fx.confettiKey} />;

  const { round } = state;
  const control = state.phase === 'in_play' || state.phase === 'steal' ? round.controlTeam : null;
  const showRoundResult = state.phase === 'round_over' && fx.roundResultUntil !== null;
  return (
    <div className="scene">
      <QuestionBanner prompt={round.board?.prompt ?? null} />
      <ScorePanel team={state.teams.A} side="left" inControl={control === 'A'} />
      <Board board={round.board} />
      <ScorePanel team={state.teams.B} side="right" inControl={control === 'B'} />
      <footer className="bottom-bar">
        <StrikeRow strikes={round.strikes} maxStrikes={state.settings.maxStrikes} />
        <PotBadge roundIndex={round.index} multiplier={round.multiplier} pot={selectPot(round)} />
        <QrCorner url={surveyUrl} size="small" caption="Survey" />
      </footer>
      <PhaseBanner state={state} buzzFlashTeam={fx.buzzFlash?.team ?? null} />
      {state.phase === 'round_intro' ? <RoundIntro roundIndex={round.index} multiplier={round.multiplier} /> : null}
      {showRoundResult ? <RoundResult state={state} /> : null}
      {fx.strikeFlash ? <StrikeOverlay count={fx.strikeFlash.count} /> : null}
    </div>
  );
}
