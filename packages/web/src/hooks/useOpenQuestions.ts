import { useEffect, useState } from 'react';
import type { OpenQuestion } from '@feud/shared';
import { getOpenQuestions } from '../api/survey';
import { SURVEY_POLL_INTERVAL_MS } from '../config';

/** The questions the audience can answer right now, refreshed on an interval. Null until the first load; errors keep the last list. */
export function useOpenQuestions(intervalMs = SURVEY_POLL_INTERVAL_MS): readonly OpenQuestion[] | null {
  const [questions, setQuestions] = useState<readonly OpenQuestion[] | null>(null);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const next = await getOpenQuestions();
        if (active) setQuestions(next);
      } catch {
        /* keep what we had; the next tick retries */
      }
    };
    void load();
    const timer = setInterval(() => void load(), intervalMs);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [intervalMs]);
  return questions;
}
