import type { Phase } from '@feud/shared';
import { useHost } from './HostContext';

const LABELS: Partial<Record<Phase, string>> = {
  faceoff_answering: '✕ Not on the board',
  in_play: '✕ STRIKE',
  steal: '✕ Steal failed',
};

export function StrikeButton({ phase }: { phase: Phase }) {
  const { send, allowed } = useHost();
  const label = LABELS[phase];
  if (!label) return null;
  return (
    <button type="button" className="btn btn-danger btn-big strike-button" disabled={!allowed('STRIKE')} onClick={() => void send({ type: 'STRIKE' })}>
      {label}
    </button>
  );
}
