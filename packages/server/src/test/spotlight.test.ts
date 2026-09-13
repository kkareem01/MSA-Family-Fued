import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, type TestApp } from './helpers';
import { connectClient, listenTestApp, waitFor, type ClientSocket } from './socketHelpers';

describe('projector spotlight', () => {
  let t: TestApp;
  const clients: ClientSocket[] = [];
  const put = (spotlight: unknown) => t.app.inject({ method: 'PUT', url: '/api/settings/spotlight', headers: t.hostHeaders, payload: { spotlight } });
  const current = async () => (await t.app.inject({ method: 'GET', url: '/api/settings', headers: t.hostHeaders })).json().data.spotlight as unknown;

  beforeEach(async () => {
    t = await buildTestApp();
  });
  afterEach(async () => {
    clients.splice(0).forEach((c) => c.close());
    await t.app.close();
  });

  it('persists the spotlight, validates it and needs the host PIN', async () => {
    expect(await current()).toBeNull();
    expect((await put('survey')).json().data.spotlight).toBe('survey');
    expect(await current()).toBe('survey');
    expect((await put('disco')).statusCode).toBe(400);
    expect(await current()).toBe('survey');
    expect((await put(null)).json().data.spotlight).toBeNull();
    expect((await t.app.inject({ method: 'PUT', url: '/api/settings/spotlight', payload: { spotlight: 'survey' } })).statusCode).toBe(401);
  });

  it('pushes the spotlight to every screen through meta', async () => {
    const port = await listenTestApp(t);
    const display = await connectClient(port, { role: 'display' });
    clients.push(display);
    expect((await waitFor(display, 'meta')).spotlight).toBeNull();
    await put('survey');
    await waitFor(display, 'meta', (m) => m.spotlight === 'survey');
    await put(null);
    await waitFor(display, 'meta', (m) => m.spotlight === null);
  });
});
