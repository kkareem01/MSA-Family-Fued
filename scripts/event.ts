/**
 * Event-day launcher: starts the server, opens a Cloudflare quick tunnel for audience phones,
 * and registers the public URL so the projector's QR code fills in by itself.
 *
 *   npm run event            build, start, tunnel
 *   npm run event -- --no-tunnel   same-wifi only (LAN URL on the QR)
 */
import { resolve } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { config as loadDotenv } from 'dotenv';
import { startTunnel } from './tunnel';
import { fetchLanUrl, registerPublicUrl, waitForHealth } from './registerUrl';

const repoRoot = resolve(import.meta.dirname, '..');
loadDotenv({ path: resolve(repoRoot, '.env'), quiet: true });

const DEFAULT_PORT = 3000;
const port = Number(process.env['PORT'] ?? DEFAULT_PORT);
const pin = process.env['HOST_PIN'];
const skipTunnel = process.argv.includes('--no-tunnel');
const base = `http://localhost:${port}`;

const line = '─'.repeat(64);

function banner(lines: readonly string[]): void {
  console.log(`\n${line}\n${lines.join('\n')}\n${line}\n`);
}

function startServer(): ChildProcess {
  return spawn(process.execPath, ['--no-warnings=ExperimentalWarning', '--import', 'tsx', 'packages/server/src/main.ts'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });
}

async function main(): Promise<void> {
  if (!pin || pin.length < 4) {
    console.error('HOST_PIN is missing. Copy .env.example to .env and set a PIN first.');
    process.exit(1);
  }
  const server = startServer();
  const children: ChildProcess[] = [server];
  const shutdown = () => {
    children.forEach((child) => child.kill('SIGTERM'));
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  server.on('exit', (code) => {
    console.error(`Server exited (code ${code ?? 'unknown'})`);
    process.exit(code ?? 1);
  });

  await waitForHealth(base);
  const lanUrl = (await fetchLanUrl(base, pin)) ?? base;
  banner([
    'MSA Family Feud is running.',
    `  Projector display : ${base}/display   (click once, then fullscreen)`,
    `  Host panel        : ${base}/host`,
    `  Same-wifi survey  : ${lanUrl}/survey`,
  ]);

  if (skipTunnel) {
    await registerPublicUrl(base, pin, lanUrl);
    console.log('Tunnel skipped. The QR code points at the same-wifi address.');
    return;
  }

  console.log('Opening a Cloudflare tunnel for audience phones…');
  const tunnel = startTunnel(port);
  children.push(tunnel.child);
  try {
    const publicUrl = await tunnel.url;
    await registerPublicUrl(base, pin, publicUrl);
    banner([
      'Public link is live and on the projector QR code:',
      `  Survey : ${publicUrl}/survey`,
      `  Buzzer : ${publicUrl}/buzzer   (codes are in Host → Settings)`,
      'Keep this window open for the whole event. Ctrl+C stops everything.',
    ]);
  } catch (error) {
    console.error(`Tunnel problem: ${error instanceof Error ? error.message : String(error)}`);
    console.error('The game still works. Paste any public URL in Host → Settings, or rerun with --no-tunnel for same-wifi use.');
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
