import { z } from 'zod';
import { QUESTION_PROMPT_MAX_LEN, SURVEY_ANSWER_MAX_LEN } from '../constants';
import { questionStatusSchema } from './question';

const MAX_QUESTIONS = 500;
const MAX_COUNT = 10_000;
const ID_MAX_LEN = 64;

const variantSchema = z.object({ text: z.string().trim().min(1).max(SURVEY_ANSWER_MAX_LEN), count: z.number().int().min(1).max(MAX_COUNT) });
const groupSchema = z.object({
  key: z.string().min(1),
  displayText: z.string().max(SURVEY_ANSWER_MAX_LEN).optional(),
  variants: z.array(variantSchema),
  mergedInto: z.string().nullable().default(null),
  dropped: z.boolean().default(false),
  pointsOverride: z.number().int().nullable().default(null),
});
const questionSchema = z.object({
  id: z.string().min(1).max(ID_MAX_LEN),
  prompt: z.string().trim().min(1).max(QUESTION_PROMPT_MAX_LEN),
  status: questionStatusSchema,
  sortOrder: z.number().int().optional(),
});

/** The shape `scripts/pullBackup.ts` writes: each question with the tally the host saw. */
export const restoreBackupSchema = z.object({
  questions: z.array(z.object({ question: questionSchema, tally: z.object({ groups: z.array(groupSchema), hidden: z.array(groupSchema) }) })).max(MAX_QUESTIONS),
});

export type RestoreBackupInput = z.infer<typeof restoreBackupSchema>;
export type RestoredQuestion = Readonly<{ id: string; prompt: string; answers: number; decisions: number; note: string | null }>;
export type RestoreResult = Readonly<{ restored: readonly RestoredQuestion[]; skipped: readonly Readonly<{ id: string; prompt: string; reason: string }>[] }>;
