import { describe, expect, it, vi } from 'vitest';
import { CUE_NAMES, type CueName } from '@feud/shared';
import { createSoundEngine } from './SoundEngine';
import { FakeAudioContext, FakeBufferSource } from './testing/fakeAudio';
import type { Synth } from './synth';

function fetchWithFiles(present: readonly CueName[]) {
  return vi.fn((url: string) => {
    if (url === '/api/sounds') {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, data: { overrides: present }, error: null }) } as unknown as Response);
    }
    const name = url.replace('/sounds/', '').replace('.mp3', '') as CueName;
    const ok = present.includes(name);
    return Promise.resolve({ ok, status: ok ? 200 : 404, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) } as unknown as Response);
  });
}

function fakeSynths() {
  return Object.fromEntries(CUE_NAMES.map((name) => [name, vi.fn()])) as Record<CueName, ReturnType<typeof vi.fn>> & Record<CueName, Synth>;
}

describe('createSoundEngine', () => {
  it('stays silent until unlocked, then resumes the context once', async () => {
    const ctx = new FakeAudioContext();
    const synths = fakeSynths();
    const engine = createSoundEngine({ createContext: () => ctx as unknown as AudioContext, synths, fetchFn: fetchWithFiles([]) });
    engine.play({ name: 'reveal' });
    expect(synths.reveal).not.toHaveBeenCalled();
    expect(engine.isUnlocked()).toBe(false);
    await engine.unlock();
    await engine.unlock();
    expect(ctx.resumed).toBe(1);
    expect(engine.isUnlocked()).toBe(true);
    engine.play({ name: 'reveal', rank: 2 });
    expect(synths.reveal).toHaveBeenCalledWith(ctx, 0, { name: 'reveal', rank: 2 });
  });

  it('prefers an mp3 override when the file exists', async () => {
    const ctx = new FakeAudioContext();
    const synths = fakeSynths();
    const fetchFn = fetchWithFiles(['strike']);
    const engine = createSoundEngine({ createContext: () => ctx as unknown as AudioContext, synths, fetchFn });
    await engine.unlock();
    await engine.preload();
    expect(engine.hasOverride('strike')).toBe(true);
    expect(engine.hasOverride('reveal')).toBe(false);
    engine.play({ name: 'strike', strikes: 1 });
    expect(synths.strike).not.toHaveBeenCalled();
    const sources = ctx.sourcesOf(FakeBufferSource);
    expect(sources).toHaveLength(1);
    expect(sources[0]?.loop).toBe(false);
    engine.play({ name: 'reveal' });
    expect(synths.reveal).toHaveBeenCalled();
    expect(fetchFn.mock.calls.map(([url]) => url)).toEqual(['/api/sounds', '/sounds/strike.mp3']);
  });

  it('loops a theme file and toggles it off on the next play', async () => {
    const ctx = new FakeAudioContext();
    const engine = createSoundEngine({ createContext: () => ctx as unknown as AudioContext, synths: fakeSynths(), fetchFn: fetchWithFiles(['theme']) });
    await engine.unlock();
    await engine.preload();
    engine.play({ name: 'theme' });
    const [source] = ctx.sourcesOf(FakeBufferSource);
    expect(source?.loop).toBe(true);
    expect(source?.stopped).toBeNull();
    engine.play({ name: 'theme' });
    expect(source?.stopped).not.toBeNull();
    engine.play({ name: 'theme' });
    expect(ctx.sourcesOf(FakeBufferSource)).toHaveLength(2);
    engine.stopTheme();
  });

  it('falls back to the synthesized theme when there is no file', async () => {
    const ctx = new FakeAudioContext();
    const synths = fakeSynths();
    const engine = createSoundEngine({ createContext: () => ctx as unknown as AudioContext, synths, fetchFn: fetchWithFiles([]) });
    await engine.unlock();
    engine.play({ name: 'theme' });
    expect(synths.theme).toHaveBeenCalled();
  });

  it('treats fetch failures as no override', async () => {
    const ctx = new FakeAudioContext();
    const engine = createSoundEngine({
      createContext: () => ctx as unknown as AudioContext,
      synths: fakeSynths(),
      fetchFn: vi.fn(() => Promise.reject(new Error('offline'))),
    });
    await engine.preload();
    expect(CUE_NAMES.some((name) => engine.hasOverride(name))).toBe(false);
  });
});
