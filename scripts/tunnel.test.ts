import { describe, expect, it } from 'vitest';
import { parseTunnelUrl } from './tunnel';

describe('parseTunnelUrl', () => {
  it('extracts the quick tunnel URL from cloudflared output', () => {
    const output = `2026-09-12T18:00:00Z INF +--------------------------------------------------------------------------------------------+
2026-09-12T18:00:00Z INF |  https://silly-otters-jump-quickly.trycloudflare.com                                       |
+--------------------------------------------------------------------------------------------+`;
    expect(parseTunnelUrl(output)).toBe('https://silly-otters-jump-quickly.trycloudflare.com');
  });

  it('ignores unrelated lines', () => {
    expect(parseTunnelUrl('INF Starting tunnel tunnelID=abc')).toBeNull();
    expect(parseTunnelUrl('https://api.trycloudflare.com/status')).toBe('https://api.trycloudflare.com');
  });
});
