import type { FastifyInstance } from 'fastify';
import { apiOk, restoreBackupSchema } from '@feud/shared';
import type { RouteDeps } from './deps';

const BODY_LIMIT_BYTES = 20 * 1024 * 1024;

/** Host-only: loads a pulled backup (questions + tallies) into this server. Existing questions are skipped. */
export function registerRestoreRoutes(app: FastifyInstance, deps: RouteDeps): void {
  app.post('/api/restore', { preHandler: deps.requireHost, bodyLimit: BODY_LIMIT_BYTES }, async (request) => {
    const backup = restoreBackupSchema.parse(request.body);
    return apiOk(deps.restoreService.restore(backup));
  });
}
