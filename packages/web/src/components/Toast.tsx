import { useCallback, useState } from 'react';
import { TOAST_MS } from '../config';

export type ToastTone = 'info' | 'error' | 'ok';
export type ToastItem = Readonly<{ id: number; message: string; tone: ToastTone }>;

export function useToasts() {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([]);
  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), TOAST_MS);
  }, []);
  return { toasts, notify };
}

export function Toasts({ toasts }: { toasts: readonly ToastItem[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
