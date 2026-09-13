import type { BuzzerStatePayload } from '@feud/shared';

export type BuzzerStatus = 'connecting' | 'closed' | 'open' | 'tapped' | 'you' | 'other';

export type BuzzerView = Readonly<{ status: BuzzerStatus; title: string; hint: string }>;

/** What the giant button should show, derived from the server payload plus a local "already tapped" flag. */
export function buzzerView(state: BuzzerStatePayload | null, connected: boolean, tapped: boolean): BuzzerView {
  if (!connected || !state) return { status: 'connecting', title: 'Connecting…', hint: 'Hold on' };
  if (state.lockedTeam === state.yourTeam) return { status: 'you', title: 'You buzzed first!', hint: 'Give your answer' };
  if (state.lockedTeam !== null) return { status: 'other', title: 'Too slow!', hint: 'The other team is answering' };
  if (state.phase === 'faceoff' && state.buzzersOpen) {
    return tapped ? { status: 'tapped', title: 'Buzzed!', hint: 'Waiting for the host' } : { status: 'open', title: 'BUZZ', hint: 'Tap when you know it' };
  }
  return { status: 'closed', title: 'Wait', hint: 'The button lights up at the face-off' };
}
