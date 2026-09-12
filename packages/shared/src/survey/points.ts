import { POINTS_SCALE } from '../constants';

/** Family Feud style points: the share of kept responses, out of 100. */
export function computePoints(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * POINTS_SCALE);
}
