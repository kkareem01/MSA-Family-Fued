import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSurveyToken } from './useSurveyToken';
import { STORAGE_KEYS } from '../../config';

describe('useSurveyToken', () => {
  beforeEach(() => localStorage.clear());

  it('creates a token once and reuses it', () => {
    const first = renderHook(() => useSurveyToken());
    const token = first.result.current.token;
    expect(token.length).toBeGreaterThan(8);
    expect(localStorage.getItem(STORAGE_KEYS.surveyToken)).toBe(token);
    const second = renderHook(() => useSurveyToken());
    expect(second.result.current.token).toBe(token);
  });

  it('remembers answered questions across loads', () => {
    const { result } = renderHook(() => useSurveyToken());
    act(() => result.current.recordResults([{ questionId: 'q1', status: 'accepted' }, { questionId: 'q2', status: 'invalid' }]));
    expect(result.current.answered).toEqual({ q1: true });
    const again = renderHook(() => useSurveyToken());
    expect(again.result.current.answered).toEqual({ q1: true });
  });
});
