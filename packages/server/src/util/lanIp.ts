import { networkInterfaces } from 'node:os';

/** First non-internal IPv4 address, or null when the machine has no LAN interface up. */
export function lanIp(): string | null {
  const all = Object.values(networkInterfaces()).flatMap((list) => list ?? []);
  const match = all.find((iface) => iface.family === 'IPv4' && !iface.internal);
  return match?.address ?? null;
}
