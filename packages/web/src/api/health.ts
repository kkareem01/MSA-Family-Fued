import type { HealthInfo } from '@feud/shared';
import { apiRequest } from './client';

export const getHealth = () => apiRequest<HealthInfo>('/api/health');
