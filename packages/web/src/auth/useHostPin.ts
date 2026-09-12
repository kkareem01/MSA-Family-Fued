import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../config';
import { readStorage, removeStorage, writeStorage } from '../util/storage';
import { verifyPin } from '../api/auth';
import { describeError } from '../api/client';

export type HostPinStatus = 'checking' | 'signed_in' | 'signed_out';

export type HostPinValue = Readonly<{
  pin: string | null;
  status: HostPinStatus;
  error: string | null;
  signIn: (candidate: string) => Promise<boolean>;
  signOut: () => void;
}>;

const WRONG_PIN_MESSAGE = 'Wrong PIN. Check the HOST_PIN in your .env file.';

/** Remembers the host PIN in localStorage and re-verifies it against the server on every load. */
export function useHostPin(): HostPinValue {
  const [pin, setPin] = useState<string | null>(() => readStorage(STORAGE_KEYS.hostPin));
  const [status, setStatus] = useState<HostPinStatus>(() => (readStorage(STORAGE_KEYS.hostPin) ? 'checking' : 'signed_out'));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStorage(STORAGE_KEYS.hostPin);
    if (!stored) return undefined;
    let cancelled = false;
    verifyPin(stored)
      .then((ok) => {
        if (cancelled) return;
        if (ok) {
          setStatus('signed_in');
          return;
        }
        removeStorage(STORAGE_KEYS.hostPin);
        setPin(null);
        setStatus('signed_out');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(describeError(err));
        setStatus('signed_out');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (candidate: string): Promise<boolean> => {
    const trimmed = candidate.trim();
    setStatus('checking');
    setError(null);
    try {
      const ok = await verifyPin(trimmed);
      if (!ok) {
        setError(WRONG_PIN_MESSAGE);
        setStatus('signed_out');
        return false;
      }
      writeStorage(STORAGE_KEYS.hostPin, trimmed);
      setPin(trimmed);
      setStatus('signed_in');
      return true;
    } catch (err) {
      setError(describeError(err));
      setStatus('signed_out');
      return false;
    }
  }, []);

  const signOut = useCallback(() => {
    removeStorage(STORAGE_KEYS.hostPin);
    setPin(null);
    setStatus('signed_out');
  }, []);

  return { pin, status, error, signIn, signOut };
}
