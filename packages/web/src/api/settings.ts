import type { PublicSettings } from '@feud/shared';
import { apiRequest } from './client';

export const getSettings = (pin: string) => apiRequest<PublicSettings>('/api/settings', { pin });

export const setPublicUrl = (pin: string, url: string | null) =>
  apiRequest<PublicSettings>('/api/settings/public-url', { method: 'PUT', body: { url }, pin });

export const rotateBuzzerCodes = (pin: string) =>
  apiRequest<PublicSettings>('/api/settings/buzzer-codes/rotate', { method: 'POST', pin });
