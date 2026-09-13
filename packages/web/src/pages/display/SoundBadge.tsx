import type { SoundStatus } from '../../sound/SoundEngine';

type Props = Readonly<{ status: SoundStatus; onRetry: () => void }>;

const LABELS: Record<Exclude<SoundStatus, 'on'>, string> = {
  off: 'Sound is off',
  locked: 'Sound is paused',
};

/** Small corner notice on the projector whenever the browser is not letting audio play. */
export function SoundBadge({ status, onRetry }: Props) {
  if (status === 'on') return null;
  return (
    <button type="button" className="sound-badge" onClick={onRetry}>
      <span aria-hidden="true">🔇</span> {LABELS[status]} — click to turn it on
    </button>
  );
}
