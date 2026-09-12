import { useHost } from './HostContext';

export function UndoButton() {
  const { canUndo, send } = useHost();
  return (
    <button type="button" className="btn btn-ghost" disabled={!canUndo} onClick={() => void send({ type: 'UNDO' })} title="Undo the last action">
      ↶ Undo
    </button>
  );
}
