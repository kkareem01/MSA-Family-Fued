import {
  createHistory,
  createInitialState,
  cuesFor,
  historyReducer,
  toPublicState,
  type Cue,
  type GameAction,
  type GameHistory,
  type GameState,
  type StateEnvelope,
} from '@feud/shared';
import type { GameStateRepo } from '../repositories/gameStateRepo';
import type { QuestionService } from './questionService';

export type GameEvent = Readonly<{
  envelope: StateEnvelope;
  publicEnvelope: StateEnvelope;
  cues: readonly Cue[];
  action: GameAction;
}>;
export type DispatchResult = Readonly<{ seq: number; changed: boolean }>;
export type GameListener = (event: GameEvent) => void;
type Logger = Readonly<{ error: (obj: unknown, msg?: string) => void }>;

export type GameServiceDeps = Readonly<{
  gameState: GameStateRepo;
  questionService: QuestionService;
  now: () => number;
  log?: Logger;
}>;

function diffIds(before: readonly string[], after: readonly string[]): readonly string[] {
  return after.filter((id) => !before.includes(id));
}

/** Owns the authoritative game state: reduce, persist, sync question statuses, notify. */
export function createGameService({ gameState, questionService, now, log }: GameServiceDeps) {
  const loaded = gameState.load();
  let history: GameHistory = loaded?.history ?? createHistory(createInitialState());
  let seq = loaded?.seq ?? 0;
  const listeners = new Set<GameListener>();

  const envelope = (): StateEnvelope => ({ seq, state: history.present, canUndo: history.past.length > 0 });
  const publicEnvelope = (): StateEnvelope => ({ seq, state: toPublicState(history.present), canUndo: history.past.length > 0 });

  const syncQuestionStatuses = (prev: GameState, next: GameState, action: GameAction): void => {
    try {
      diffIds(prev.playedQuestionIds, next.playedQuestionIds).forEach((id) => questionService.markPlayed(id));
      if (action.type !== 'RESET_GAME') {
        diffIds(next.playedQuestionIds, prev.playedQuestionIds).forEach((id) => questionService.revertPlayed(id));
      }
    } catch (error) {
      log?.error({ err: error }, 'Failed to sync question statuses');
    }
  };

  const notify = (event: GameEvent): void => {
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        log?.error({ err: error }, 'Game listener threw');
      }
    });
  };

  return {
    dispatch(action: GameAction): DispatchResult {
      const prev = history;
      const next = historyReducer(prev, action);
      if (next === prev) return { seq, changed: false };
      history = next;
      seq += 1;
      gameState.save(history, seq, now());
      syncQuestionStatuses(prev.present, next.present, action);
      notify({ envelope: envelope(), publicEnvelope: publicEnvelope(), cues: cuesFor(prev.present, next.present, action), action });
      return { seq, changed: true };
    },
    getEnvelope: envelope,
    getPublicEnvelope: publicEnvelope,
    getState: (): GameState => history.present,
    getSeq: (): number => seq,
    subscribe(listener: GameListener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type GameService = ReturnType<typeof createGameService>;
