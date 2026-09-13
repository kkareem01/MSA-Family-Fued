import type { PresencePayload } from '@feud/shared';

/** One line under the sound test telling the host why the projector might be silent. */
export function projectorSoundHint(presence: PresencePayload | null): string {
  if (!presence || presence.displays === 0) return 'No projector connected. Open /display on the laptop and click "Start the show".';
  if (presence.displaysWithSound === 0) return 'Projector connected, but its sound is off. Click the projector screen once.';
  return 'Projector sound is on ✓';
}
