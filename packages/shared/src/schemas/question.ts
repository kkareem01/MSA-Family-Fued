import { z } from 'zod';
import { QUESTION_PROMPT_MAX_LEN, QUESTION_STATUSES } from '../constants';

export const questionStatusSchema = z.enum(QUESTION_STATUSES);

export const createQuestionSchema = z.object({
  prompt: z.string().trim().min(1).max(QUESTION_PROMPT_MAX_LEN),
});

export const updateQuestionSchema = z
  .object({
    prompt: z.string().trim().min(1).max(QUESTION_PROMPT_MAX_LEN).optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((v) => v.prompt !== undefined || v.sortOrder !== undefined, { message: 'Nothing to update' });

export const setQuestionStatusSchema = z.object({ status: questionStatusSchema });

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
