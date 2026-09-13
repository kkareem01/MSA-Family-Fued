import { describe, expect, it } from 'vitest';
import { normalizePublicUrl } from './publicUrl';

describe('normalizePublicUrl', () => {
  it('normalizes full urls and blanks', () => {
    expect(normalizePublicUrl('https://abc.trycloudflare.com/')).toBe('https://abc.trycloudflare.com');
    expect(normalizePublicUrl('http://10.0.0.2:3000')).toBe('http://10.0.0.2:3000');
    expect(normalizePublicUrl('   ')).toBeNull();
    expect(normalizePublicUrl(undefined)).toBeNull();
  });

  it('assumes https for a bare domain, which is what hosting dashboards hand out', () => {
    expect(normalizePublicUrl('msa-feud.up.railway.app')).toBe('https://msa-feud.up.railway.app');
    expect(normalizePublicUrl('msa-feud.fly.dev/')).toBe('https://msa-feud.fly.dev');
  });

  it('still rejects garbage and other protocols', () => {
    expect(() => normalizePublicUrl('not a url at all')).toThrow();
    expect(() => normalizePublicUrl('ftp://x.example')).toThrow(/protocol/u);
  });
});
