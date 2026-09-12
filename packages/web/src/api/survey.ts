import type { OpenQuestion, SurveySubmitInput, SurveySubmitResult } from '@feud/shared';
import { apiRequest } from './client';

export const getOpenQuestions = () => apiRequest<OpenQuestion[]>('/api/survey/questions');

export const submitSurvey = (payload: SurveySubmitInput) =>
  apiRequest<{ results: SurveySubmitResult[] }>('/api/survey/responses', { method: 'POST', body: payload });
