import { z } from 'zod';
import { TEAM_IDS } from '../constants';

export const idSchema = z.string().min(1).max(64);
export const teamIdSchema = z.enum(TEAM_IDS);
export const pinSchema = z.string().min(4).max(64);
export const tallyKeySchema = z.string().min(1).max(200);
