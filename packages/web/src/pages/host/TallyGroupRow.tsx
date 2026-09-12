import { useState } from 'react';
import { ANSWER_TEXT_MAX_LEN, MAX_ANSWER_POINTS, type TallyGroup } from '@feud/shared';
import { variantsSummary } from './tallyHelpers';

export type GroupHandlers = Readonly<{
  rename: (key: string, displayText: string | null) => void;
  setPoints: (key: string, points: number | null) => void;
  merge: (sourceKey: string, targetKey: string) => void;
  drop: (key: string) => void;
}>;

type Props = Readonly<{ group: TallyGroup; rank: number; others: readonly TallyGroup[]; busy: boolean; handlers: GroupHandlers }>;

export function TallyGroupRow({ group, rank, others, busy, handlers }: Props) {
  const [text, setText] = useState(group.displayText);
  const [points, setPoints] = useState(group.pointsOverride === null ? '' : String(group.pointsOverride));

  const commitText = () => {
    const next = text.trim();
    if (next === group.displayText) return;
    handlers.rename(group.key, next === '' ? null : next);
  };
  const commitPoints = () => {
    const next = points.trim() === '' ? null : Number(points);
    if (next === group.pointsOverride) return;
    if (next !== null && (!Number.isInteger(next) || next < 0 || next > MAX_ANSWER_POINTS)) return;
    handlers.setPoints(group.key, next);
  };

  return (
    <li className="tally-row">
      <span className="answer-rank">{rank}</span>
      <div className="tally-main">
        <input
          className="input"
          value={text}
          maxLength={ANSWER_TEXT_MAX_LEN}
          aria-label={`Display text for ${group.key}`}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          disabled={busy}
        />
        <span className="muted small">
          {group.count} said: {variantsSummary(group.variants)}
          {group.mergedKeys.length > 0 ? ` · merged: ${group.mergedKeys.join(', ')}` : ''}
        </span>
        <div className="row">
          <label className="row small">
            <span>Points</span>
            <input
              className="input points-input"
              inputMode="numeric"
              placeholder={String(group.points)}
              value={points}
              aria-label={`Points override for ${group.key}`}
              onChange={(e) => setPoints(e.target.value)}
              onBlur={commitPoints}
              disabled={busy}
            />
          </label>
          <select
            className="input merge-select"
            value=""
            aria-label={`Merge ${group.key} into`}
            disabled={busy || others.length === 0}
            onChange={(e) => e.target.value && handlers.merge(group.key, e.target.value)}
          >
            <option value="">Merge into…</option>
            {others.map((o) => (
              <option key={o.key} value={o.key}>{o.displayText} ({o.count})</option>
            ))}
          </select>
          <button type="button" className="btn btn-ghost btn-inline" disabled={busy} onClick={() => handlers.drop(group.key)}>
            Hide
          </button>
        </div>
      </div>
      <span className="answer-points">{group.points}</span>
    </li>
  );
}
