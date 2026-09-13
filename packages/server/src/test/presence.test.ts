import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, TEST_PIN, type TestApp } from './helpers';
import { connectClient, listenTestApp, sleep, waitFor, type ClientSocket } from './socketHelpers';

describe('presence', () => {
  let t: TestApp;
  let port: number;
  const clients: ClientSocket[] = [];
  const connect = async (auth: Record<string, unknown>) => {
    const socket = await connectClient(port, auth);
    clients.push(socket);
    return socket;
  };
  const buzzerCodes = async () =>
    (await t.app.inject({ method: 'GET', url: '/api/settings', headers: t.hostHeaders })).json().data.buzzerCodes as { A: string; B: string };

  beforeEach(async () => {
    t = await buildTestApp();
    port = await listenTestApp(t);
  });
  afterEach(async () => {
    clients.splice(0).forEach((c) => c.close());
    await t.app.close();
  });

  it('tells hosts who is connected and whether the projector has sound', async () => {
    const host = await connect({ role: 'host', pin: TEST_PIN });
    expect(await waitFor(host, 'presence')).toEqual({ displays: 0, displaysWithSound: 0, hosts: 1, buzzers: { A: 0, B: 0 } });

    const display = await connect({ role: 'display' });
    await waitFor(host, 'presence', (p) => p.displays === 1 && p.displaysWithSound === 0);
    display.emit('display:status', { audioUnlocked: true });
    await waitFor(host, 'presence', (p) => p.displaysWithSound === 1);

    display.emit('display:status', { audioUnlocked: 'yes' } as never);
    await sleep(50);
    expect((await waitFor(host, 'presence')).displaysWithSound).toBe(1);

    const { A } = await buzzerCodes();
    await connect({ role: 'buzzer', team: 'A', code: A });
    await waitFor(host, 'presence', (p) => p.buzzers.A === 1 && p.buzzers.B === 0);

    display.close();
    await waitFor(host, 'presence', (p) => p.displays === 0 && p.displaysWithSound === 0);
  });

  it('keeps presence private to hosts', async () => {
    const display = await connect({ role: 'display' });
    await connect({ role: 'host', pin: TEST_PIN });
    await expect(waitFor(display, 'presence', () => true, 200)).rejects.toThrow(/Timed out/);
  });
});
