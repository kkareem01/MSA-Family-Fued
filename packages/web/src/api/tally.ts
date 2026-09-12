import type { BoardInput, TallyView } from '@feud/shared';
import { apiRequest } from './client';

const base = (id: string) => `/api/questions/${id}`;

export const getTally = (pin: string, id: string) => apiRequest<TallyView>(`${base(id)}/tally`, { pin });

export const mergeTally = (pin: string, id: string, sourceKey: string, targetKey: string) =>
  apiRequest<TallyView>(`${base(id)}/tally/merge`, { method: 'POST', body: { sourceKey, targetKey }, pin });

export const unmergeTally = (pin: string, id: string, key: string) =>
  apiRequest<TallyView>(`${base(id)}/tally/unmerge`, { method: 'POST', body: { key }, pin });

export const renameTally = (pin: string, id: string, key: string, displayText: string | null) =>
  apiRequest<TallyView>(`${base(id)}/tally/rename`, { method: 'POST', body: { key, displayText }, pin });

export const dropTally = (pin: string, id: string, key: string, dropped: boolean) =>
  apiRequest<TallyView>(`${base(id)}/tally/drop`, { method: 'POST', body: { key, dropped }, pin });

export const setTallyPoints = (pin: string, id: string, key: string, points: number | null) =>
  apiRequest<TallyView>(`${base(id)}/tally/points`, { method: 'POST', body: { key, points }, pin });

export const finalizeTally = (pin: string, id: string, topN: number) =>
  apiRequest<BoardInput>(`${base(id)}/finalize`, { method: 'POST', body: { topN }, pin });
