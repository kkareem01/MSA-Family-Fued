import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScorePanel } from './ScorePanel';

describe('ScorePanel', () => {
  it('highlights the team in control', () => {
    const { container } = render(<ScorePanel team={{ id: 'A', name: 'Lions', score: 120 }} side="left" inControl />);
    expect(screen.getByText('Lions')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('control');
  });
  it('is plain otherwise', () => {
    const { container } = render(<ScorePanel team={{ id: 'B', name: 'Tigers', score: 0 }} side="right" inControl={false} />);
    expect(container.firstChild).not.toHaveClass('control');
  });
});
