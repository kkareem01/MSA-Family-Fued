import { describe, expect, it } from 'vitest';
import type { BuzzerStatePayload } from '@feud/shared';
import { buzzerView } from './buzzerStatus';

const base: BuzzerStatePayload = { seq: 1, phase: 'faceoff', buzzersOpen: true, lockedTeam: null, yourTeam: 'A', teamName: 'Lions' };

describe('buzzerView', () => {
  it('shows connecting until state arrives', () => {
    expect(buzzerView(null, false, false).status).toBe('connecting');
    expect(buzzerView(base, false, false).status).toBe('connecting');
  });
  it('is open only during an open face-off', () => {
    expect(buzzerView(base, true, false).status).toBe('open');
    expect(buzzerView({ ...base, buzzersOpen: false }, true, false).status).toBe('closed');
    expect(buzzerView({ ...base, phase: 'in_play', buzzersOpen: false }, true, false).status).toBe('closed');
  });
  it('acknowledges a tap and then the lock result', () => {
    expect(buzzerView(base, true, true).status).toBe('tapped');
    expect(buzzerView({ ...base, buzzersOpen: false, lockedTeam: 'A' }, true, true).status).toBe('you');
    expect(buzzerView({ ...base, buzzersOpen: false, lockedTeam: 'B' }, true, true).status).toBe('other');
  });
});
