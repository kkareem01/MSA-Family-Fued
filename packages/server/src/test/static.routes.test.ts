import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type BuiltApp } from '../app';
import { createTestDb, testConfig } from './helpers';

describe('static site and sounds', () => {
  let built: BuiltApp;
  let soundsDir: string;

  beforeEach(async () => {
    const root = mkdtempSync(join(tmpdir(), 'feud-static-'));
    const webDist = join(root, 'dist');
    soundsDir = join(root, 'sounds');
    mkdirSync(join(webDist, 'assets'), { recursive: true });
    mkdirSync(soundsDir);
    writeFileSync(join(webDist, 'index.html'), '<!doctype html><title>Feud</title><div id="root"></div>');
    writeFileSync(join(webDist, 'assets', 'app.js'), 'console.log(1)');
    writeFileSync(join(soundsDir, 'reveal.mp3'), 'not-really-audio');
    built = await buildApp({ config: testConfig({ webDist, soundsDir }), db: createTestDb() });
    await built.app.ready();
  });
  afterEach(async () => {
    await built.app.close();
  });

  it('serves the bundle and falls back to index.html for app routes', async () => {
    const index = await built.app.inject({ method: 'GET', url: '/' });
    expect(index.statusCode).toBe(200);
    expect(index.body).toContain('id="root"');
    expect(index.headers['cache-control']).toContain('no-cache');
    const asset = await built.app.inject({ method: 'GET', url: '/assets/app.js' });
    expect(asset.statusCode).toBe(200);
    expect(asset.headers['cache-control']).toContain('max-age');
    const spa = await built.app.inject({ method: 'GET', url: '/host/tally/abc' });
    expect(spa.statusCode).toBe(200);
    expect(spa.body).toContain('id="root"');
  });

  it('keeps JSON 404s for the API and non-GET requests', async () => {
    const api = await built.app.inject({ method: 'GET', url: '/api/nope' });
    expect(api.statusCode).toBe(404);
    expect(api.json()).toMatchObject({ ok: false, error: { code: 'not_found' } });
    const post = await built.app.inject({ method: 'POST', url: '/display' });
    expect(post.statusCode).toBe(404);
  });

  it('serves sound overrides and 404s missing ones', async () => {
    const present = await built.app.inject({ method: 'GET', url: '/sounds/reveal.mp3' });
    expect(present.statusCode).toBe(200);
    expect(present.headers['content-type']).toContain('audio/mpeg');
    const head = await built.app.inject({ method: 'HEAD', url: '/sounds/reveal.mp3' });
    expect(head.statusCode).toBe(200);
    const missing = await built.app.inject({ method: 'GET', url: '/sounds/strike.mp3' });
    expect(missing.statusCode).toBe(404);
  });

  it('lists which sound overrides exist', async () => {
    const res = await built.app.inject({ method: 'GET', url: '/api/sounds' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual({ overrides: ['reveal'] });
  });

  it('runs without a built bundle', async () => {
    const bare = await buildApp({ config: testConfig(), db: createTestDb() });
    await bare.app.ready();
    const res = await bare.app.inject({ method: 'GET', url: '/display' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('not_found');
    expect((await bare.app.inject({ method: 'GET', url: '/api/sounds' })).json().data).toEqual({ overrides: [] });
    await bare.app.close();
  });
});
