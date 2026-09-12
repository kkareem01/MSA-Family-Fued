import { z } from 'zod';
import { TEAM_NAME_MAX_LEN } from '../constants';

const URL_MAX_LEN = 2048;

export const publicUrlSchema = z.object({ url: z.string().max(URL_MAX_LEN).nullable() });
export const teamNamesSchema = z.object({
  A: z.string().trim().min(1).max(TEAM_NAME_MAX_LEN),
  B: z.string().trim().min(1).max(TEAM_NAME_MAX_LEN),
});

export type BuzzerCodes = Readonly<{ A: string; B: string }>;
export type PublicSettings = Readonly<{
  publicUrl: string | null;
  lanUrl: string;
  buzzerCodes: BuzzerCodes;
}>;
