import { describe, expect, it, vi } from 'vitest';
import { CUE_NAMES, type CueName } from '@feud/shared';
import { createSoundEngine, type SoundStatus } from './SoundEngine';
import { FakeAudioContext, FakeBufferSource, FakeCompressor, FakeGain } from './testing/fakeAudio';
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
  return Object.fromEntries(CUE_NAMES.map((name) => [name, vi.fn(() => ({ stop: vi.fn(), endsAt: 3 }))])) as Record<CueName, ReturnType<typeof vi.fn>> &
    Record<CueName, Synth>;
}

function build(present: readonly CueName[] = [], ctx = new FakeAudioContext()) {
  const synths = fakeSynths();
  const fetchFn = fetchWithFiles(present);
  const engine = createSoundEngine({ createContext: () => ctx as unknown as AudioContext, synths, fetchFn });
  return { ctx, synths, engine, fetchFn };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createSoundEngine', () => {
  it('stays silent until unlocked, then resumes the context once', async () => {
    const { ctx, synths, engine } = build();
    engine.play({ name: 'reveal' });
    expect(synths.reveal).not.toHaveBeenCalled();
    expect(engine.status()).toBe('off');
    expect(engine.isUnlocked()).toBe(false);
    expect(await engine.unlock()).toBe(true);
    expect(await engine.unlock()).toBe(true);
    expect(ctx.resumed).toBe(1);
    expect(engine.status()).toBe('on');
    engine.play({ name: 'reveal', rank: 2 });
    expect(synths.reveal).toHaveBeenCalledWith(expect.objectContaining({ ctx }), 0, { name: 'reveal', rank: 2 });
  });

  it('routes every sound through a master gain and compressor into the destination', async () => {
    const { ctx, synths, engine } = build();
    await engine.unlock();
    const [gain] = ctx.sourcesOf(FakeGain);
    const [compressor] = ctx.sourcesOf(FakeCompressor);
    expect(gain?.connections).toEqual([compressor]);
    expect(compressor?.connections).toEqual([ctx.destination]);
    expect(gain?.gain.value).toBeGreaterThan(1);
    engine.play({ name: 'buzz', team: 'A' });
    expect(synths.buzz).toHaveBeenCalledWith({ ctx, out: gain }, 0, { name: 'buzz', team: 'A' });
  });

  it('reports a browser without Web Audio as off, without throwing', async () => {
    const engine = createSoundEngine({
      createContext: () => {
        throw new Error('no audio');
      },
      synths: fakeSynths(),
      fetchFn: fetchWithFiles([]),
    });
    expect(await engine.unlock()).toBe(false);
    expect(engine.status()).toBe('off');
    expect(() => engine.play({ name: 'reveal' })).not.toThrow();
  });

  it('stays locked when the browser refuses to resume', async () => {
    const ctx = new FakeAudioContext();
    ctx.resumable = false;
    const { engine, synths } = build([], ctx);
    expect(await engine.unlock()).toBe(false);
    expect(engine.status()).toBe('locked');
    engine.play({ name: 'reveal' });
    await tick();
    expect(synths.reveal).not.toHaveBeenCalled();
  });

  it('resumes a paused context on play once it has been unlocked before', async () => {
    const { ctx, synths, engine } = build();
    await engine.unlock();
    ctx.setState('suspended');
    expect(engine.status()).toBe('locked');
    engine.play({ name: 'reveal' });
    expect(synths.reveal).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(synths.reveal).toHaveBeenCalled());
    expect(ctx.resumed).toBe(2);
    expect(engine.status()).toBe('on');
  });

  it('drops the cue when resuming fails', async () => {
    const { ctx, synths, engine } = build();
    await engine.unlock();
    ctx.setState('suspended');
    ctx.resumeError = new Error('interrupted');
    engine.play({ name: 'reveal' });
    await tick();
    expect(synths.reveal).not.toHaveBeenCalled();
    expect(engine.status()).toBe('locked');
  });

  it('notifies subscribers only when the status actually changes', async () => {
    const { ctx, engine } = build();
    const seen: SoundStatus[] = [];
    const unsubscribe = engine.subscribe((status) => seen.push(status));
    await engine.unlock();
    await engine.unlock();
    ctx.setState('suspended');
    unsubscribe();
    ctx.setState('running');
    expect(seen).toEqual(['locked', 'on', 'locked']);
  });

  it('prefers an mp3 override when the file exists', async () => {
    const { ctx, synths, engine, fetchFn } = build(['strike']);
    await engine.unlock();
    await engine.preload();
    expect(engine.hasOverride('strike')).toBe(true);
    expect(engine.hasOverride('reveal')).toBe(false);
    engine.play({ name: 'strike', strikes: 1 });
    expect(synths.strike).not.toHaveBeenCalled();
    const sources = ctx.sourcesOf(FakeBufferSource);
    expect(sources).toHaveLength(1);
    expect(sources[0]?.loop).toBe(false);
    expect(sources[0]?.connections).toEqual([ctx.sourcesOf(FakeGain)[0]]);
    engine.play({ name: 'reveal' });
    expect(synths.reveal).toHaveBeenCalled();
    expect(fetchFn.mock.calls.map(([url]) => url)).toEqual(['/api/sounds', '/sounds/strike.mp3']);
  });

  it('loops a theme file and toggles it off on the next play', async () => {
    const { ctx, engine } = build(['theme']);
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
    expect(ctx.sourcesOf(FakeBufferSource)[1]?.stopped).not.toBeNull();
  });

  it('toggles the synthesized theme instead of stacking it, and restarts once it has ended', async () => {
    const { ctx, synths, engine } = build();
    await engine.unlock();
    const stop = vi.fn();
    synths.theme.mockReturnValue({ stop, endsAt: 4 });
    engine.play({ name: 'theme' });
    engine.play({ name: 'theme' });
    expect(synths.theme).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
    engine.play({ name: 'theme' });
    expect(synths.theme).toHaveBeenCalledTimes(2);
    ctx.currentTime = 10;
    engine.play({ name: 'theme' });
    expect(synths.theme).toHaveBeenCalledTimes(3);
    expect(stop).toHaveBeenCalledTimes(1);
    engine.stopTheme();
    engine.stopTheme();
    expect(stop).toHaveBeenCalledTimes(2);
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
