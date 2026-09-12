import type { GameAction, QuestionSummary, StateEnvelope } from '@feud/shared';
import { apiRequest } from './client';

export type DispatchResult = Readonly<{ seq: number; changed: boolean }>;

export const getGameState = (pin: string) => apiRequest<StateEnvelope>('/api/game/state', { pin });

export const sendGameAction = (pin: string, action: GameAction) =>
  apiRequest<DispatchResult>('/api/game/action', { method: 'POST', body: { action }, pin });

export const getCandidates = (pin: string) => apiRequest<QuestionSummary[]>('/api/game/candidates', { pin });
