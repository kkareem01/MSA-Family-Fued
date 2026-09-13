import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../config';

vi.mock('../api/auth', () => ({ verifyPin: vi.fn() }));
const { verifyPin } = await import('../api/auth');
const { PinGate } = await import('./PinGate');
const { useHostSession } = await import('./HostPinContext');

function Inside() {
  const { pin } = useHostSession();
  return <p>signed in as {pin}</p>;
}

describe('PinGate', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(verifyPin).mockImplementation((pin) => Promise.resolve(pin === '1234'));
  });

  it('asks for a PIN, rejects a wrong one and lets a right one through', async () => {
    render(<PinGate><Inside /></PinGate>);
    const input = screen.getByLabelText('Host PIN');
    fireEvent.change(input, { target: { value: '0000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Open host panel' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Wrong PIN/u);
    fireEvent.change(screen.getByLabelText('Host PIN'), { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Open host panel' }));
    expect(await screen.findByText('signed in as 1234')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEYS.hostPin)).toBe('1234');
  });

  it('skips the form when a valid PIN is remembered', async () => {
    localStorage.setItem(STORAGE_KEYS.hostPin, '1234');
    render(<PinGate><Inside /></PinGate>);
    await waitFor(() => expect(screen.getByText('signed in as 1234')).toBeInTheDocument());
  });
});
