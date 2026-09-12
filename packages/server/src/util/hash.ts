import { createHash, timingSafeEqual } from 'node:crypto';

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** Constant-time comparison of two hex digests. */
export function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

const IP_HASH_LEN = 16;

/** Short, non-reversible marker of a client address for abuse review only. */
export function hashIp(ip: string): string {
  return sha256Hex(ip).slice(0, IP_HASH_LEN);
}
