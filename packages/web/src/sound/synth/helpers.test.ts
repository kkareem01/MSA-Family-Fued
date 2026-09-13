import { describe, expect, it, vi } from 'vitest';
import { FakeAudioContext, FakeBufferSource, FakeFilter, FakeGain, FakeOscillator } from '../testing/fakeAudio';
import { handle, noiseBurst, tone, type AudioBus } from './helpers';

function makeBus() {
  const fake = new FakeAudioContext();
  const out = fake.createGain();
  const bus: AudioBus = { ctx: fake as unknown as AudioContext, out: out as unknown as AudioNode };
  return { fake, out, bus };
}

const envelopes = (fake: FakeAudioContext, out: FakeGain) => fake.sourcesOf(FakeGain).filter((gain) => gain !== out);

describe('tone', () => {
  it('routes its envelope into the bus output and returns the scheduled oscillator', () => {
    const { fake, out, bus } = makeBus();
    const osc = tone(bus, { type: 'sine', freq: 440, start: 1, duration: 0.5 }) as unknown as FakeOscillator;
    expect(osc).toBeInstanceOf(FakeOscillator);
    expect(osc.connections).toEqual(envelopes(fake, out));
    expect(envelopes(fake, out)[0]?.connections).toEqual([out]);
    expect(osc.started).toBe(1);
    expect(osc.stopped).toBeCloseTo(1.55);
    expect(out.connections).toEqual([]);
  });

  it('inserts a lowpass filter when asked', () => {
    const { fake, out, bus } = makeBus();
    const osc = tone(bus, { type: 'sawtooth', freq: 110, start: 0, duration: 0.2, filterFreq: 700 }) as unknown as FakeOscillator;
    const [filter] = fake.sourcesOf(FakeFilter);
    expect(osc.connections).toEqual([filter]);
    expect(filter?.connections).toEqual(envelopes(fake, out));
  });
});

describe('noiseBurst', () => {
  it('returns the buffer source wired through a highpass into the bus', () => {
    const { fake, out, bus } = makeBus();
    const source = noiseBurst(bus, 2, 1, 0.1, 4000) as unknown as FakeBufferSource;
    expect(source).toBeInstanceOf(FakeBufferSource);
    expect(fake.sourcesOf(FakeFilter)[0]?.type).toBe('highpass');
    expect(envelopes(fake, out)[0]?.connections).toEqual([out]);
    expect(source.started).toBe(2);
  });
});

describe('handle', () => {
  it('stops every node and shrugs off nodes that already stopped', () => {
    const stopped = vi.fn();
    const broken = {
      stop: () => {
        throw new Error('already stopped');
      },
    };
    const h = handle([{ stop: stopped }, broken], 7);
    expect(h.endsAt).toBe(7);
    expect(() => h.stop()).not.toThrow();
    expect(stopped).toHaveBeenCalledTimes(1);
  });
});
