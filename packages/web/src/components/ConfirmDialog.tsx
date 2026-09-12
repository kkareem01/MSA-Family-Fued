import type { ReactNode } from 'react';

export type ConfirmChoice = Readonly<{ label: string; tone?: 'primary' | 'danger' | 'default'; onChoose: () => void }>;

type Props = Readonly<{ title: string; children?: ReactNode; choices: readonly ConfirmChoice[]; onCancel: () => void }>;

/** Blocking choice sheet for destructive or irreversible host actions. */
export function ConfirmDialog({ title, children, choices, onCancel }: Props) {
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div className="dialog card stack" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
        <div className="stack">
          {choices.map((choice) => (
            <button
              key={choice.label}
              type="button"
              className={`btn btn-big ${choice.tone === 'danger' ? 'btn-danger' : choice.tone === 'primary' ? 'btn-primary' : ''}`}
              onClick={choice.onChoose}
            >
              {choice.label}
            </button>
          ))}
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
