import { useState } from 'react';
import { TEAM_IDS, type GameState } from '@feud/shared';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useHost } from './HostContext';

type Dialog = 'end_round' | 'end_game' | 'new_game' | null;

/** Round and game level navigation; irreversible choices go through a confirm sheet. */
export function RoundControls({ state }: { state: GameState }) {
  const { send, allowed } = useHost();
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);
  const run = (action: Parameters<typeof send>[0]) => () => {
    close();
    void send(action);
  };
  const showEndRound = allowed('END_ROUND');
  const showEndGame = allowed('END_GAME') && state.round.index > 0;
  if (state.phase !== 'round_over' && state.phase !== 'game_over' && !showEndRound && !showEndGame) return null;

  return (
    <section className="panel stack">
      <div className="button-grid">
        {state.phase === 'round_over' ? (
          <>
            <button type="button" className="btn btn-gold" disabled={!allowed('REVEAL_ALL')} onClick={() => void send({ type: 'REVEAL_ALL' })}>
              Reveal all remaining
            </button>
            <button type="button" className="btn btn-primary btn-big" onClick={() => void send({ type: 'NEXT_ROUND' })}>
              Next round ▶
            </button>
          </>
        ) : null}
        {showEndRound ? (
          <button type="button" className="btn btn-ghost" onClick={() => setDialog('end_round')}>End round early…</button>
        ) : null}
        {showEndGame ? (
          <button type="button" className="btn btn-ghost" onClick={() => setDialog('end_game')}>End game…</button>
        ) : null}
        {state.phase === 'game_over' ? (
          <button type="button" className="btn btn-primary btn-big" onClick={() => setDialog('new_game')}>New game…</button>
        ) : null}
      </div>

      {dialog === 'end_round' ? (
        <ConfirmDialog
          title="End this round early"
          onCancel={close}
          choices={[
            ...TEAM_IDS.map((team) => ({ label: `Award the pot to ${state.teams[team].name}`, tone: 'primary' as const, onChoose: run({ type: 'END_ROUND', awardTo: team }) })),
            { label: 'End with no points', tone: 'danger', onChoose: run({ type: 'END_ROUND', awardTo: null }) },
          ]}
        />
      ) : null}
      {dialog === 'end_game' ? (
        <ConfirmDialog title="End the game and show the winner?" onCancel={close} choices={[{ label: 'End game', tone: 'primary', onChoose: run({ type: 'END_GAME' }) }]} />
      ) : null}
      {dialog === 'new_game' ? (
        <ConfirmDialog title="Start a new game?" onCancel={close} choices={[{ label: 'Reset scores, keep team names', tone: 'danger', onChoose: run({ type: 'RESET_GAME' }) }]}>
          <p className="muted">Played questions stay used up. Rename the teams afterwards if new families are playing.</p>
        </ConfirmDialog>
      ) : null}
    </section>
  );
}
