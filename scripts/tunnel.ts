import { spawn, type ChildProcess } from 'node:child_process';

export const TUNNEL_URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/u;
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_BINARY = 'cloudflared';

/** Finds the public quick-tunnel URL anywhere in cloudflared's chatter. */
export function parseTunnelUrl(text: string): string | null {
  return TUNNEL_URL_RE.exec(text)?.[0] ?? null;
}

export type Tunnel = Readonly<{ child: ChildProcess; url: Promise<string> }>;

export type TunnelOptions = Readonly<{ timeoutMs?: number; binary?: string }>;

/** Starts a Cloudflare quick tunnel to localhost:port and resolves with its https URL. */
export function startTunnel(port: number, options: TunnelOptions = {}): Tunnel {
  const binary = options.binary ?? DEFAULT_BINARY;
  const child = spawn(binary, ['tunnel', '--url', `http://localhost:${port}`, '--no-autoupdate'], { stdio: ['ignore', 'pipe', 'pipe'] });
  const url = new Promise<string>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };
    const timer = setTimeout(() => finish(() => reject(new Error(`cloudflared did not print a URL within ${(options.timeoutMs ?? DEFAULT_TIMEOUT_MS) / 1000}s`))), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const scan = (chunk: Buffer) => {
      const found = parseTunnelUrl(chunk.toString('utf8'));
      if (found) finish(() => resolve(found));
    };
    child.stdout?.on('data', scan);
    child.stderr?.on('data', scan);
    child.on('error', (error) => finish(() => reject(new Error(`Could not start ${binary}: ${error.message}`))));
    child.on('exit', (code) => finish(() => reject(new Error(`${binary} exited early (code ${code ?? 'unknown'})`))));
  });
  return { child, url };
}
