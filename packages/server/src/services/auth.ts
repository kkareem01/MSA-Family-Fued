import { safeEqualHex, sha256Hex } from '../util/hash';

export type Auth = Readonly<{ verifyPin(candidate: unknown): boolean }>;

export function createAuth(hostPin: string): Auth {
  const expected = sha256Hex(hostPin);
  return {
    verifyPin: (candidate) => typeof candidate === 'string' && safeEqualHex(sha256Hex(candidate), expected),
  };
}
