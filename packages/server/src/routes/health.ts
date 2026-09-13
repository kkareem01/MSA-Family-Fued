import type { FastifyInstance } from 'fastify';
import { apiOk, type HealthInfo } from '@feud/shared';
import type { RouteDeps } from './deps';

export function registerHealthRoutes(app: FastifyInstance, deps: RouteDeps): void {
  app.get('/api/health', async () => {
    const info: HealthInfo = {
      ok: true,
      uptime: process.uptime(),
      seq: deps.gameService.getSeq(),
      phase: deps.gameService.getState().phase,
      storage: deps.storage,
      responseCount: deps.responses.countAll(),
    };
    return apiOk(info);
  });
}
