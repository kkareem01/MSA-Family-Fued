import type { PublicSettings, Spotlight } from '@feud/shared';
import { apiRequest } from './client';

export const getSettings = (pin: string) => apiRequest<PublicSettings>('/api/settings', { pin });

export const setPublicUrl = (pin: string, url: string | null) =>
  apiRequest<PublicSettings>('/api/settings/public-url', { method: 'PUT', body: { url }, pin });

export const rotateBuzzerCodes = (pin: string) =>
  apiRequest<PublicSettings>('/api/settings/buzzer-codes/rotate', { method: 'POST', pin });

export const setSpotlight = (pin: string, spotlight: Spotlight) =>
  apiRequest<PublicSettings>('/api/settings/spotlight', { method: 'PUT', body: { spotlight }, pin });
