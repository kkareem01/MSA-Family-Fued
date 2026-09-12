import { z } from 'zod';
import { ANSWER_TEXT_MAX_LEN, MAX_ANSWER_POINTS, MAX_BOARD_ANSWERS, MIN_ANSWER_POINTS } from '../constants';
import { tallyKeySchema } from './common';

export const tallyMergeSchema = z.object({ sourceKey: tallyKeySchema, targetKey: tallyKeySchema });
export const tallyUnmergeSchema = z.object({ key: tallyKeySchema });
export const tallyRenameSchema = z.object({
  key: tallyKeySchema,
  displayText: z.string().trim().min(1).max(ANSWER_TEXT_MAX_LEN).nullable(),
});
export const tallyDropSchema = z.object({ key: tallyKeySchema, dropped: z.boolean() });
export const tallyPointsSchema = z.object({
  key: tallyKeySchema,
  points: z.number().int().min(MIN_ANSWER_POINTS).max(MAX_ANSWER_POINTS).nullable(),
});
export const tallyFinalizeSchema = z.object({ topN: z.number().int().min(1).max(MAX_BOARD_ANSWERS) });
