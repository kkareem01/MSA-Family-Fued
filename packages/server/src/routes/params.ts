import { z } from 'zod';
import { idSchema } from '@feud/shared';

export const idParamsSchema = z.object({ id: idSchema });

export function questionId(params: unknown): string {
  return idParamsSchema.parse(params).id;
}
