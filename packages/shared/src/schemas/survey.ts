import { z } from 'zod';
import { SURVEY_ANSWER_MAX_LEN, SURVEY_MAX_ANSWERS_PER_SUBMIT } from '../constants';
import { idSchema } from './common';

export const surveyTokenSchema = z.string().min(8).max(64);

export const surveySubmitSchema = z.object({
  token: surveyTokenSchema,
  answers: z
    .array(z.object({ questionId: idSchema, text: z.string().max(SURVEY_ANSWER_MAX_LEN) }))
    .min(1)
    .max(SURVEY_MAX_ANSWERS_PER_SUBMIT),
});

export const SURVEY_RESULT_STATUSES = ['accepted', 'duplicate', 'closed', 'invalid'] as const;
export type SurveyResultStatus = (typeof SURVEY_RESULT_STATUSES)[number];
export type SurveySubmitInput = z.infer<typeof surveySubmitSchema>;
export type SurveySubmitResult = Readonly<{ questionId: string; status: SurveyResultStatus }>;
export type OpenQuestion = Readonly<{ id: string; prompt: string }>;
