import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RoundFlow } from './RoundFlow';

describe('RoundFlow', () => {
  it('highlights the step for the current phase and explains every step', () => {
    render(<RoundFlow phase="in_play" />);
    const current = screen.getByRole('listitem', { current: 'step' });
    expect(current).toHaveTextContent('In play');
    expect(screen.getByText(/What each step means/u)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(8);
  });
});
