import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseTunnelUrl, tunnelArgs, writeEmptyTunnelConfig } from './tunnel';

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

describe('tunnel launch arguments', () => {
  it('pins an empty config so a personal ~/.cloudflared/config.yml cannot hijack the quick tunnel', () => {
    const dir = mkdtempSync(join(tmpdir(), 'feud-tunnel-'));
    const configPath = writeEmptyTunnelConfig(dir);
    expect(readFileSync(configPath, 'utf8').trim()).toBe('{}');
    expect(tunnelArgs(3000, configPath)).toEqual(['tunnel', '--config', configPath, '--url', 'http://localhost:3000', '--no-autoupdate']);
  });
});
