import { z } from 'zod';
import { pinSchema } from './common';

export const verifyPinSchema = z.object({ pin: pinSchema });
export const HOST_PIN_HEADER = 'x-host-pin';
