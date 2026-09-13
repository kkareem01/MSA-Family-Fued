import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { sendCue, playCue } = vi.hoisted(() => ({ sendCue: vi.fn(), playCue: vi.fn(() => Promise.resolve(true)) }));
vi.mock('../../socket/GameSocketContext', () => ({ useGameSocketContext: () => ({ sendCue, presence: null }) }));
vi.mock('./HostContext', () => ({ useHost: () => ({ playCue }) }));

const { SoundTest } = await import('./SoundTest');

describe('SoundTest', () => {
  it('plays each cue on this device and on the projector', () => {
    render(<SoundTest />);
    fireEvent.click(screen.getByRole('button', { name: /Strike/u }));
    expect(playCue).toHaveBeenCalledWith({ name: 'strike' });
    expect(sendCue).toHaveBeenCalledWith('strike');
    expect(screen.getByText(/Plays on this device and on the projector/u)).toBeInTheDocument();
  });
});
