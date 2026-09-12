import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHostPin } from './useHostPin';
import { STORAGE_KEYS } from '../config';

function stubVerify(validPins: readonly string[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn((_url: string, init?: RequestInit) => {
      const { pin } = JSON.parse(String(init?.body)) as { pin: string };
      const status = validPins.includes(pin) ? 204 : 401;
      return Promise.resolve({
        status,
        ok: status < 400,
        json: () => Promise.resolve({ ok: false, data: null, error: { code: 'unauthorized', message: 'Host PIN required' } }),
        text: () => Promise.resolve(''),
      } as unknown as Response);
    }),
  );
}

describe('useHostPin', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('starts signed out when nothing is stored', () => {
    stubVerify(['1234']);
    const { result } = renderHook(() => useHostPin());
    expect(result.current.status).toBe('signed_out');
    expect(result.current.pin).toBeNull();
  });

  it('re-verifies a stored pin on mount', async () => {
    stubVerify(['1234']);
    localStorage.setItem(STORAGE_KEYS.hostPin, '1234');
    const { result } = renderHook(() => useHostPin());
    expect(result.current.status).toBe('checking');
    await waitFor(() => expect(result.current.status).toBe('signed_in'));
    expect(result.current.pin).toBe('1234');
  });

  it('drops a stale stored pin', async () => {
    stubVerify(['1234']);
    localStorage.setItem(STORAGE_KEYS.hostPin, 'old');
    const { result } = renderHook(() => useHostPin());
    await waitFor(() => expect(result.current.status).toBe('signed_out'));
    expect(localStorage.getItem(STORAGE_KEYS.hostPin)).toBeNull();
  });

  it('signs in, stores the pin, reports a wrong pin and signs out', async () => {
    stubVerify(['1234']);
    const { result } = renderHook(() => useHostPin());
    await act(async () => {
      expect(await result.current.signIn('nope')).toBe(false);
    });
    expect(result.current.status).toBe('signed_out');
    expect(result.current.error).toMatch(/PIN/u);
    await act(async () => {
      expect(await result.current.signIn('1234')).toBe(true);
    });
    expect(result.current.status).toBe('signed_in');
    expect(localStorage.getItem(STORAGE_KEYS.hostPin)).toBe('1234');
    act(() => result.current.signOut());
    expect(result.current.status).toBe('signed_out');
    expect(localStorage.getItem(STORAGE_KEYS.hostPin)).toBeNull();
  });
});
