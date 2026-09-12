import type { BoardInput, QuestionStatus, QuestionSummary, UpdateQuestionInput } from '@feud/shared';
import { apiRequest } from './client';

export const listQuestions = (pin: string) => apiRequest<QuestionSummary[]>('/api/questions', { pin });

export const createQuestion = (pin: string, prompt: string) =>
  apiRequest<QuestionSummary>('/api/questions', { method: 'POST', body: { prompt }, pin });

export const updateQuestion = (pin: string, id: string, patch: UpdateQuestionInput) =>
  apiRequest<QuestionSummary>(`/api/questions/${id}`, { method: 'PATCH', body: patch, pin });

export const deleteQuestion = (pin: string, id: string) => apiRequest<void>(`/api/questions/${id}`, { method: 'DELETE', pin });

export const setQuestionStatus = (pin: string, id: string, status: QuestionStatus) =>
  apiRequest<QuestionSummary>(`/api/questions/${id}/status`, { method: 'POST', body: { status }, pin });

export const getBoard = (pin: string, id: string) => apiRequest<BoardInput>(`/api/questions/${id}/board`, { pin });
