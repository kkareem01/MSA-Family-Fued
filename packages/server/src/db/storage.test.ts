import { describe, expect, it } from 'vitest';
import { describeStorage, inHostedContainer } from './storage';

const probe = (over: Partial<Parameters<typeof describeStorage>[1]> = {}) => ({
  env: {},
  deviceOf: () => 1,
  inContainer: () => false,
  ...over,
});

describe('describeStorage', () => {
  it('reports an in-memory database', () => {
    expect(describeStorage(':memory:', probe())).toEqual({ path: ':memory:', kind: 'memory' });
  });

  it('trusts the hosting platform mount variable', () => {
    const info = describeStorage('/data/feud.db', probe({ env: { RAILWAY_VOLUME_MOUNT_PATH: '/data' }, inContainer: () => true }));
    expect(info.kind).toBe('volume');
  });

  it('treats a directory on a different device from the root as a mounted volume', () => {
    const info = describeStorage('/data/feud.db', probe({ deviceOf: (path) => (path === '/data' ? 42 : 1), inContainer: () => true }));
    expect(info.kind).toBe('volume');
  });

  it('flags a container without a volume as ephemeral, and a laptop file as local', () => {
    expect(describeStorage('/data/feud.db', probe({ inContainer: () => true })).kind).toBe('ephemeral');
    expect(describeStorage('/Users/me/feud/data/feud.db', probe()).kind).toBe('local');
  });

  it('never throws when the filesystem cannot be inspected', () => {
    const info = describeStorage('/data/feud.db', probe({ deviceOf: () => { throw new Error('nope'); }, inContainer: () => true }));
    expect(info.kind).toBe('ephemeral');
  });
});

describe('inHostedContainer', () => {
  it('recognizes hosting platforms by their environment, not only the Docker marker', () => {
    expect(inHostedContainer({ RAILWAY_ENVIRONMENT: 'production' }, '/nonexistent-marker')).toBe(true);
    expect(inHostedContainer({ FLY_APP_NAME: 'feud' }, '/nonexistent-marker')).toBe(true);
    expect(inHostedContainer({}, '/nonexistent-marker')).toBe(false);
  });
});
