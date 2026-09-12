import type { TeamId } from '../game/types';

export const ROOM_DISPLAY = 'display';
export const ROOM_HOST = 'host';

export function buzzerRoom(team: TeamId): string {
  return `buzzer:${team}`;
}
