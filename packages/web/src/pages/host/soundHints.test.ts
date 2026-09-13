import { describe, expect, it } from 'vitest';
import { projectorSoundHint } from './soundHints';

const presence = (displays: number, displaysWithSound: number) => ({ displays, displaysWithSound, hosts: 1, buzzers: { A: 0, B: 0 } });

describe('projectorSoundHint', () => {
  it('explains what to do at each stage', () => {
    expect(projectorSoundHint(null)).toMatch(/No projector connected/u);
    expect(projectorSoundHint(presence(0, 0))).toMatch(/Open \/display/u);
    expect(projectorSoundHint(presence(1, 0))).toMatch(/sound is off/u);
    expect(projectorSoundHint(presence(2, 1))).toMatch(/Projector sound is on/u);
  });
});
