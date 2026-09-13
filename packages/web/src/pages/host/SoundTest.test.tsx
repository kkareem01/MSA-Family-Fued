import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { sendCue, playCue, socket } = vi.hoisted(() => ({
  sendCue: vi.fn(),
  playCue: vi.fn(() => Promise.resolve(true)),
  socket: { presence: null as null | { displays: number; displaysWithSound: number; hosts: number; buzzers: { A: number; B: number } } },
}));
vi.mock('../../socket/GameSocketContext', () => ({ useGameSocketContext: () => ({ sendCue, presence: socket.presence }) }));
vi.mock('./HostContext', () => ({ useHost: () => ({ playCue }) }));

const { SoundTest } = await import('./SoundTest');

describe('SoundTest', () => {
  it('plays each cue on this device and on the projector', () => {
    render(<SoundTest />);
    fireEvent.click(screen.getByRole('button', { name: /Strike/u }));
    expect(playCue).toHaveBeenCalledWith({ name: 'strike' });
    expect(sendCue).toHaveBeenCalledWith('strike');
    expect(screen.getByText(/Plays on this device and on the projector/u)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/No projector connected/u);
  });

  it('confirms when the projector has sound', () => {
    socket.presence = { displays: 1, displaysWithSound: 1, hosts: 1, buzzers: { A: 0, B: 0 } };
    render(<SoundTest />);
    expect(screen.getByRole('status')).toHaveTextContent(/Projector sound is on/u);
  });
});
