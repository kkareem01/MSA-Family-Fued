import { z } from 'zod';
import { CUE_NAMES } from '../constants';
import { gameActionSchema } from '../game/actions';
import { pinSchema, teamIdSchema } from './common';

const BUZZER_CODE_LEN = 4;

export const socketAuthSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('display') }),
  z.object({ role: z.literal('host'), pin: pinSchema }),
  z.object({ role: z.literal('buzzer'), team: teamIdSchema, code: z.string().trim().length(BUZZER_CODE_LEN) }),
]);

export const hostActionPayloadSchema = z.object({ action: gameActionSchema });
export const hostCuePayloadSchema = z.object({ name: z.enum(CUE_NAMES) });
