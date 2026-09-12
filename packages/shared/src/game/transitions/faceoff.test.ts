import { describe, expect, it } from 'vitest';
import { choosePlayOrPass, faceoffMiss, faceoffReveal, lockBuzzer, resetBuzzer, setControl, startFaceoff } from './faceoff';
import { sampleBoard, stateInPhase } from '../testing/fixtures';

describe('startFaceoff', () => {
  it('opens the buzzers', () => {
    const next = startFaceoff(stateInPhase('round_intro'));
    expect(next.phase).toBe('faceoff');
    expect(next.round.faceoff.buzzersOpen).toBe(true);
  });
});

describe('lockBuzzer', () => {
  it('locks the first team and closes the buzzers', () => {
    const next = lockBuzzer(stateInPhase('faceoff'), 'B', 'buzzer', 500);
    expect(next.phase).toBe('faceoff_answering');
    expect(next.round.faceoff).toMatchObject({ buzzersOpen: false, lockedTeam: 'B', lockedAt: 500, lockedBy: 'buzzer', answeringTeam: 'B' });
  });

  it('ignores a buzzer once already locked', () => {
    const locked = stateInPhase('faceoff_answering');
    expect(lockBuzzer(locked, 'B', 'buzzer', 600)).toBe(locked);
  });

  it('lets the host re-assign the lock before any attempt', () => {
    const locked = stateInPhase('faceoff_answering');
    const next = lockBuzzer(locked, 'B', 'host', 700);
    expect(next.round.faceoff.lockedTeam).toBe('B');
    expect(next.round.faceoff.lockedBy).toBe('host');
    expect(next.round.faceoff.answeringTeam).toBe('B');
  });

  it('refuses a host re-assign after an attempt was made', () => {
    const attempted = faceoffReveal(stateInPhase('faceoff_answering'), 3);
    expect(lockBuzzer(attempted, 'B', 'host', 800)).toBe(attempted);
  });

  it('ignores a buzz when buzzers are closed in faceoff', () => {
    const base = stateInPhase('faceoff');
    const closed = { ...base, round: { ...base.round, faceoff: { ...base.round.faceoff, buzzersOpen: false } } };
    expect(lockBuzzer(closed, 'A', 'buzzer', 1)).toBe(closed);
  });
});

describe('resetBuzzer', () => {
  it('reopens buzzers, clears attempts and keeps revealed tiles', () => {
    const attempted = faceoffReveal(stateInPhase('faceoff_answering'), 3);
    const next = resetBuzzer(attempted);
    expect(next.phase).toBe('faceoff');
    expect(next.round.faceoff.buzzersOpen).toBe(true);
    expect(next.round.faceoff.lockedTeam).toBeNull();
    expect(next.round.faceoff.attempts).toEqual([]);
    expect(next.round.board?.answers.find((a) => a.rank === 3)?.revealed).toBe(true);
  });
});

describe('faceoffReveal', () => {
  it('number one answer wins the face-off immediately', () => {
    const next = faceoffReveal(stateInPhase('faceoff_answering'), 1);
    expect(next.phase).toBe('play_or_pass');
    expect(next.round.faceoff.winner).toBe('A');
    expect(next.round.board?.answers[0]).toMatchObject({ revealed: true, scored: true });
  });

  it('a lower answer hands the buzzer to the other team', () => {
    const next = faceoffReveal(stateInPhase('faceoff_answering'), 3);
    expect(next.phase).toBe('faceoff_answering');
    expect(next.round.faceoff.answeringTeam).toBe('B');
    expect(next.round.faceoff.attempts).toEqual([{ team: 'A', rank: 3 }]);
  });

  it('after two attempts the better rank wins', () => {
    const first = faceoffReveal(stateInPhase('faceoff_answering'), 3);
    const bWins = faceoffReveal(first, 2);
    expect(bWins.phase).toBe('play_or_pass');
    expect(bWins.round.faceoff.winner).toBe('B');
    const aWins = faceoffReveal(faceoffReveal(stateInPhase('faceoff_answering'), 2), 4);
    expect(aWins.round.faceoff.winner).toBe('A');
  });

  it('is a no-op for an already revealed or unknown rank', () => {
    const first = faceoffReveal(stateInPhase('faceoff_answering'), 3);
    expect(faceoffReveal(first, 3)).toBe(first);
    expect(faceoffReveal(first, 8)).toBe(first);
  });

  it('is a no-op when nobody is answering', () => {
    const base = stateInPhase('faceoff_answering');
    const broken = { ...base, round: { ...base.round, faceoff: { ...base.round.faceoff, answeringTeam: null } } };
    expect(faceoffReveal(broken, 1)).toBe(broken);
  });
});

describe('faceoffMiss', () => {
  it('first miss passes to the other team without counting a strike', () => {
    const next = faceoffMiss(stateInPhase('faceoff_answering'));
    expect(next.phase).toBe('faceoff_answering');
    expect(next.round.faceoff.answeringTeam).toBe('B');
    expect(next.round.strikes).toBe(0);
    expect(next.round.faceoff.attempts).toEqual([{ team: 'A', rank: null }]);
  });

  it('hit then miss: the team that hit wins', () => {
    const next = faceoffMiss(faceoffReveal(stateInPhase('faceoff_answering'), 4));
    expect(next.phase).toBe('play_or_pass');
    expect(next.round.faceoff.winner).toBe('A');
  });

  it('miss then hit: the team that hit wins', () => {
    const next = faceoffReveal(faceoffMiss(stateInPhase('faceoff_answering')), 5);
    expect(next.phase).toBe('play_or_pass');
    expect(next.round.faceoff.winner).toBe('B');
  });

  it('two misses reopen the buzzers', () => {
    const next = faceoffMiss(faceoffMiss(stateInPhase('faceoff_answering')));
    expect(next.phase).toBe('faceoff');
    expect(next.round.faceoff.buzzersOpen).toBe(true);
    expect(next.round.faceoff.attempts).toEqual([]);
  });
});

describe('setControl', () => {
  it('hands control to a team and starts play', () => {
    const next = setControl(stateInPhase('faceoff'), 'B');
    expect(next.phase).toBe('in_play');
    expect(next.round.controlTeam).toBe('B');
    expect(next.round.faceoff.winner).toBe('B');
    expect(next.round.faceoff.buzzersOpen).toBe(false);
  });

  it('auto-awards a board that is already cleared', () => {
    const next = setControl(stateInPhase('faceoff_answering', { board: sampleBoard(1, [1]) }), 'A');
    expect(next.phase).toBe('round_over');
    expect(next.teams.A.score).toBe(38);
    expect(next.round.result?.reason).toBe('cleared');
  });
});

describe('choosePlayOrPass', () => {
  it('play keeps control with the face-off winner', () => {
    const next = choosePlayOrPass(stateInPhase('play_or_pass'), 'play');
    expect(next.phase).toBe('in_play');
    expect(next.round.controlTeam).toBe('A');
  });
  it('pass gives control to the other team', () => {
    expect(choosePlayOrPass(stateInPhase('play_or_pass'), 'pass').round.controlTeam).toBe('B');
  });
  it('is a no-op without a face-off winner', () => {
    const base = stateInPhase('play_or_pass');
    const broken = { ...base, round: { ...base.round, faceoff: { ...base.round.faceoff, winner: null } } };
    expect(choosePlayOrPass(broken, 'play')).toBe(broken);
  });
});
