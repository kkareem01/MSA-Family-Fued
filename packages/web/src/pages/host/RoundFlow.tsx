import type { Phase } from '@feud/shared';
import { ROUND_FLOW, stepIndexForPhase } from '../../guide/roundFlowSteps';

/** Compact stepper showing where the round is, with a fold-out explaining each step. */
export function RoundFlow({ phase }: { phase: Phase }) {
  const current = stepIndexForPhase(phase);
  return (
    <section className="round-flow">
      <ol className="round-flow-steps" aria-label="Round steps">
        {ROUND_FLOW.map((step, i) => (
          <li key={step.label} className={i === current ? 'current' : i < current ? 'done' : ''} aria-current={i === current ? 'step' : undefined}>
            {step.label}
          </li>
        ))}
      </ol>
      <details className="round-flow-help">
        <summary>What each step means</summary>
        <ul>
          {ROUND_FLOW.map((step) => (
            <li key={step.label}>
              <strong>{step.label}.</strong> {step.detail}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
