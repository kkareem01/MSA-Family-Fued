import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/survey', () => ({ getOpenQuestions: vi.fn(), submitSurvey: vi.fn() }));

const { getOpenQuestions } = await import('../api/survey');
const { useOpenQuestions } = await import('./useOpenQuestions');

describe('useOpenQuestions', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('loads now, polls on an interval, and keeps the last good list on errors', async () => {
    vi.mocked(getOpenQuestions).mockResolvedValueOnce([{ id: 'q1', prompt: 'Name a fruit' }]);
    const { result, unmount } = renderHook(() => useOpenQuestions(1000));
    expect(result.current).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current).toEqual([{ id: 'q1', prompt: 'Name a fruit' }]);
    vi.mocked(getOpenQuestions).mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current).toEqual([{ id: 'q1', prompt: 'Name a fruit' }]);
    vi.mocked(getOpenQuestions).mockResolvedValueOnce([]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current).toEqual([]);
    expect(getOpenQuestions).toHaveBeenCalledTimes(3);
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(getOpenQuestions).toHaveBeenCalledTimes(3);
  });
});
