import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BoardPreview, revealLabel } from './BoardPreview';
import { sampleBoard } from '@feud/shared/testing';

describe('BoardPreview', () => {
  it('enables reveal only for hidden answers when the phase allows it', () => {
    const onReveal = vi.fn();
    render(<BoardPreview board={sampleBoard(3, [2])} phase="in_play" canReveal onReveal={onReveal} />);
    const first = screen.getByRole('button', { name: /answer 1/u });
    const second = screen.getByRole('button', { name: /answer 2/u });
    expect(first).toBeEnabled();
    expect(second).toBeDisabled();
    fireEvent.click(first);
    expect(onReveal).toHaveBeenCalledWith(1);
  });

  it('disables everything when reveals are not allowed', () => {
    render(<BoardPreview board={sampleBoard(2)} phase="faceoff" canReveal={false} onReveal={() => undefined} />);
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
  });

  it('labels the button by phase', () => {
    expect(revealLabel('steal')).toBe('Steal it');
    expect(revealLabel('round_over')).toBe('Show');
    expect(revealLabel('in_play')).toBe('Reveal');
  });
});
