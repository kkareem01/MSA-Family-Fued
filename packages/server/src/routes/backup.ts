import type { FastifyInstance } from 'fastify';
import { apiOk } from '@feud/shared';
import type { RouteDeps } from './deps';

/** Host-only dump of every table, for a download the host keeps on their own device. */
export function registerBackupRoutes(app: FastifyInstance, deps: RouteDeps): void {
  app.get('/api/backup', { preHandler: deps.requireHost }, async (_request, reply) => {
    const stamp = new Date().toISOString().replace(/[:.]/gu, '-');
    reply.header('content-disposition', `attachment; filename="msa-feud-backup-${stamp}.json"`);
    return apiOk(deps.backup.dumpAll());
  });
}
