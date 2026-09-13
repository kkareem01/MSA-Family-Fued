import { useCallback, useState } from 'react';
import type { SurveySubmitResult } from '@feud/shared';
import { STORAGE_KEYS } from '../../config';
import { readStorage, writeStorage } from '../../util/storage';
import { markAnswered, parseAnswered, type AnsweredMap } from './surveyState';

function generateToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function loadToken(): string {
  const stored = readStorage(STORAGE_KEYS.surveyToken);
  if (stored) return stored;
  const fresh = generateToken();
  writeStorage(STORAGE_KEYS.surveyToken, fresh);
  return fresh;
}

/** One anonymous token per phone, plus which questions it already answered. The server enforces uniqueness. */
export function useSurveyToken() {
  const [token] = useState(loadToken);
  const [answered, setAnswered] = useState<AnsweredMap>(() => parseAnswered(readStorage(STORAGE_KEYS.surveyAnswered)));

  const recordResults = useCallback((results: readonly SurveySubmitResult[]) => {
    setAnswered((current) => {
      const next = markAnswered(current, results);
      writeStorage(STORAGE_KEYS.surveyAnswered, JSON.stringify(next));
      return next;
    });
  }, []);

  return { token, answered, recordResults };
}
