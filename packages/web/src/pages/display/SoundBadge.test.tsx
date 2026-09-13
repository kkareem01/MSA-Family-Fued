import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SoundBadge } from './SoundBadge';

describe('SoundBadge', () => {
  it('is hidden while sound is on', () => {
    const { container } = render(<SoundBadge status="on" onRetry={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('explains the problem and retries on click', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<SoundBadge status="off" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /Sound is off/u }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(<SoundBadge status="locked" onRetry={onRetry} />);
    expect(screen.getByRole('button', { name: /Sound is paused/u })).toBeInTheDocument();
  });
});
