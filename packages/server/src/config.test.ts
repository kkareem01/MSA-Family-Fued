import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('applies defaults and coerces numbers', () => {
    const config = loadConfig({ HOST_PIN: 'secret-pin' }, '/repo');
    expect(config.port).toBe(3000);
    expect(config.hostPin).toBe('secret-pin');
    expect(config.dbPath).toBe('/repo/data/feud.db');
    expect(config.soundsDir).toBe('/repo/sounds');
    expect(config.webDist).toBe('/repo/packages/web/dist');
    expect(config.publicUrl).toBeNull();
    expect(config.logLevel).toBe('info');
    expect(config.nodeEnv).toBe('development');
    expect(config.trustProxy).toBe(false);
  });

  it('reads overrides and resolves relative paths against the repo root', () => {
    const config = loadConfig(
      { HOST_PIN: 'abcd', PORT: '4100', DB_PATH: ':memory:', SOUNDS_DIR: '/abs/sounds', PUBLIC_URL: 'https://x.trycloudflare.com/', LOG_LEVEL: 'warn', NODE_ENV: 'production', TRUST_PROXY: 'true' },
      '/repo',
    );
    expect(config.port).toBe(4100);
    expect(config.dbPath).toBe(':memory:');
    expect(config.soundsDir).toBe('/abs/sounds');
    expect(config.publicUrl).toBe('https://x.trycloudflare.com');
    expect(config.logLevel).toBe('warn');
    expect(config.nodeEnv).toBe('production');
    expect(config.trustProxy).toBe(true);
  });

  it('rejects a missing or short PIN and a bad port', () => {
    expect(() => loadConfig({}, '/repo')).toThrow(/HOST_PIN/);
    expect(() => loadConfig({ HOST_PIN: '12' }, '/repo')).toThrow(/HOST_PIN/);
    expect(() => loadConfig({ HOST_PIN: 'abcd', PORT: 'nope' }, '/repo')).toThrow(/PORT/);
    expect(() => loadConfig({ HOST_PIN: 'abcd', TRUST_PROXY: 'yes' }, '/repo')).toThrow(/TRUST_PROXY/);
  });

  it('treats a blank PUBLIC_URL as unset', () => {
    expect(loadConfig({ HOST_PIN: 'abcd', PUBLIC_URL: '' }, '/repo').publicUrl).toBeNull();
  });

  it('accepts a bare hosting domain for PUBLIC_URL by assuming https', () => {
    expect(loadConfig({ HOST_PIN: 'abcd', PUBLIC_URL: 'msa-feud.up.railway.app' }, '/repo').publicUrl).toBe('https://msa-feud.up.railway.app');
    expect(loadConfig({ HOST_PIN: 'abcd', PUBLIC_URL: ' msa-feud.up.railway.app/ ' }, '/repo').publicUrl).toBe('https://msa-feud.up.railway.app');
  });

  it('starts without a public URL instead of crashing on an unusable one', () => {
    const warnings: string[] = [];
    const config = loadConfig({ HOST_PIN: 'abcd', PUBLIC_URL: 'not a url at all' }, '/repo', (message) => warnings.push(message));
    expect(config.publicUrl).toBeNull();
    expect(warnings[0]).toMatch(/PUBLIC_URL/u);
    expect(loadConfig({ HOST_PIN: 'abcd', PUBLIC_URL: 'ftp://x.example' }, '/repo', () => undefined).publicUrl).toBeNull();
  });
});
