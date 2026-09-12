import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, type TestApp } from './helpers';

describe('settings and health routes', () => {
  let t: TestApp;
  beforeEach(async () => {
    t = await buildTestApp();
  });
  afterEach(async () => {
    await t.app.close();
  });

  it('health is public and auth verify checks the PIN', async () => {
    const health = await t.app.inject({ method: 'GET', url: '/api/health' });
    expect(health.statusCode).toBe(200);
    expect(health.json().data).toMatchObject({ ok: true, seq: 0 });
    expect((await t.app.inject({ method: 'POST', url: '/api/auth/verify', payload: { pin: 'test-pin' } })).statusCode).toBe(204);
    expect((await t.app.inject({ method: 'POST', url: '/api/auth/verify', payload: { pin: 'wrong-pin' } })).statusCode).toBe(401);
    expect((await t.app.inject({ method: 'POST', url: '/api/auth/verify', payload: { pin: 'x' } })).statusCode).toBe(400);
  });

  it('exposes lan url and generated buzzer codes', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/api/settings', headers: t.hostHeaders });
    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(data.publicUrl).toBeNull();
    expect(data.lanUrl).toMatch(/^http:\/\/[\d.]+:\d+$/u);
    expect(data.buzzerCodes.A).toMatch(/^[A-Z2-9]{4}$/u);
    expect(data.buzzerCodes.B).toMatch(/^[A-Z2-9]{4}$/u);
    expect(data.buzzerCodes.A).not.toBe(data.buzzerCodes.B);
    const again = await t.app.inject({ method: 'GET', url: '/api/settings', headers: t.hostHeaders });
    expect(again.json().data.buzzerCodes).toEqual(data.buzzerCodes);
    const rotated = await t.app.inject({ method: 'POST', url: '/api/settings/buzzer-codes/rotate', headers: t.hostHeaders });
    expect(rotated.json().data.buzzerCodes).not.toEqual(data.buzzerCodes);
  });

  it('sets, normalizes, clears and validates the public url', async () => {
    const put = (url: unknown) => t.app.inject({ method: 'PUT', url: '/api/settings/public-url', headers: t.hostHeaders, payload: { url } });
    expect((await put('https://abc.trycloudflare.com/')).json().data.publicUrl).toBe('https://abc.trycloudflare.com');
    expect((await t.app.inject({ method: 'GET', url: '/api/settings', headers: t.hostHeaders })).json().data.publicUrl).toBe('https://abc.trycloudflare.com');
    expect((await put('not a url')).statusCode).toBe(400);
    expect((await put('ftp://x.example')).statusCode).toBe(400);
    expect((await put(null)).json().data.publicUrl).toBeNull();
  });
});
