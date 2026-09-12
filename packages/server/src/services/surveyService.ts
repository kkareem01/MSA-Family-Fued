import { normalizeAnswer, type OpenQuestion, type SurveySubmitInput, type SurveySubmitResult } from '@feud/shared';
import type { QuestionRepo } from '../repositories/questionRepo';
import type { SurveyRepo } from '../repositories/surveyRepo';

export type SurveyServiceDeps = Readonly<{ questions: QuestionRepo; responses: SurveyRepo; now: () => number }>;

export function createSurveyService({ questions, responses, now }: SurveyServiceDeps) {
  const submitOne = (token: string, questionId: string, text: string, ipHash: string | null): SurveySubmitResult => {
    const question = questions.get(questionId);
    if (!question) return { questionId, status: 'invalid' };
    if (question.status !== 'open') return { questionId, status: 'closed' };
    const normalizedText = normalizeAnswer(text);
    if (normalizedText === '') return { questionId, status: 'invalid' };
    const outcome = responses.insert({ questionId, rawText: text.trim(), normalizedText, submitterToken: token, ipHash }, now());
    return { questionId, status: outcome === 'inserted' ? 'accepted' : 'duplicate' };
  };

  return {
    openQuestions: (): OpenQuestion[] => questions.listByStatus('open').map((q) => ({ id: q.id, prompt: q.prompt })),
    submit: (input: SurveySubmitInput, ipHash: string | null): SurveySubmitResult[] =>
      input.answers.map((a) => submitOne(input.token, a.questionId, a.text, ipHash)),
  };
}

export type SurveyService = ReturnType<typeof createSurveyService>;
