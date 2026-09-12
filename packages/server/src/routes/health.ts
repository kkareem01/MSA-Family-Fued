import type { FastifyInstance } from 'fastify';
import { apiOk } from '@feud/shared';
import type { RouteDeps } from './deps';

export function registerHealthRoutes(app: FastifyInstance, deps: RouteDeps): void {
  app.get('/api/health', async () =>
    apiOk({ ok: true, uptime: process.uptime(), seq: deps.gameService.getSeq(), phase: deps.gameService.getState().phase }),
  );
}
