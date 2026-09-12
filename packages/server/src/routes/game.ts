import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { apiOk, gameActionSchema } from '@feud/shared';
import type { RouteDeps } from './deps';

const actionBodySchema = z.object({ action: gameActionSchema });

export function registerGameRoutes(app: FastifyInstance, deps: RouteDeps): void {
  const { gameService, questionService, requireHost } = deps;
  const opts = { preHandler: requireHost };

  app.get('/api/game/state', opts, async () => apiOk(gameService.getEnvelope()));

  /** HTTP fallback for the socket `host:action` event (also used by end-to-end tests to seed state). */
  app.post('/api/game/action', opts, async (request) => {
    const { action } = actionBodySchema.parse(request.body);
    return apiOk(gameService.dispatch(action));
  });

  app.get('/api/game/candidates', opts, async () => apiOk(questionService.listByStatus('finalized')));
}
