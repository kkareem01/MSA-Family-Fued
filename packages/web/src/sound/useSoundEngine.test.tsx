import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CUE_NAMES, type CueName } from '@feud/shared';
import { FakeAudioContext } from './testing/fakeAudio';
import type { Synth } from './synth';
import { useSoundEngine } from './useSoundEngine';

const manifest = () =>
  vi.fn((_url: string) =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, data: { overrides: [] }, error: null }) } as unknown as Response),
  );

function setup(ctx = new FakeAudioContext()) {
  const synth = vi.fn(() => ({ stop: vi.fn(), endsAt: 1 }));
  const synths = Object.fromEntries(CUE_NAMES.map((name) => [name, synth])) as unknown as Record<CueName, Synth>;
  const fetchFn = manifest();
  const hook = renderHook(() => useSoundEngine({ createContext: () => ctx as unknown as AudioContext, fetchFn, synths }));
  return { ctx, synth, fetchFn, hook };
}

describe('useSoundEngine', () => {
  it('starts off, then unlocks and plays in one gesture with playNow', async () => {
    const { synth, fetchFn, hook } = setup();
    expect(hook.result.current.status).toBe('off');
    await act(async () => {
      expect(await hook.result.current.playNow({ name: 'reveal' })).toBe(true);
    });
    expect(synth).toHaveBeenCalledTimes(1);
    expect(hook.result.current.status).toBe('on');
    expect(fetchFn).toHaveBeenCalledWith('/api/sounds');
  });

  it('preloads overrides once and follows the context state', async () => {
    const { ctx, fetchFn, hook } = setup();
    await act(async () => {
      await hook.result.current.unlock();
      await hook.result.current.unlock();
    });
    expect(fetchFn.mock.calls.filter(([url]) => url === '/api/sounds')).toHaveLength(1);
    act(() => ctx.setState('suspended'));
    expect(hook.result.current.status).toBe('locked');
    act(() => ctx.setState('running'));
    expect(hook.result.current.status).toBe('on');
  });

  it('survives a browser without Web Audio', async () => {
    const hook = renderHook(() =>
      useSoundEngine({
        createContext: () => {
          throw new Error('nope');
        },
      }),
    );
    await act(async () => {
      expect(await hook.result.current.playNow({ name: 'reveal' })).toBe(false);
    });
    expect(hook.result.current.status).toBe('off');
    expect(() => hook.result.current.play({ name: 'reveal' })).not.toThrow();
    expect(hook.result.current.hasOverride('reveal')).toBe(false);
  });
});
