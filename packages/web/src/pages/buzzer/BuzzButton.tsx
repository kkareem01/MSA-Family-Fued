import type { BuzzerView } from './buzzerStatus';

type Props = Readonly<{ view: BuzzerView; onBuzz: () => void }>;

export function BuzzButton({ view, onBuzz }: Props) {
  const active = view.status === 'open';
  return (
    <button
      type="button"
      className={`buzz-button status-${view.status}`}
      disabled={!active}
      onPointerDown={active ? onBuzz : undefined}
      aria-live="assertive"
    >
      <span className="buzz-title">{view.title}</span>
      <span className="buzz-hint">{view.hint}</span>
    </button>
  );
}
