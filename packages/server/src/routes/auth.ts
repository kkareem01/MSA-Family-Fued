import type { FastifyInstance } from 'fastify';
import { verifyPinSchema } from '@feud/shared';
import { unauthorized } from '../services/errors';
import type { RouteDeps } from './deps';

export function registerAuthRoutes(app: FastifyInstance, deps: RouteDeps): void {
  app.post('/api/auth/verify', async (request, reply) => {
    const { pin } = verifyPinSchema.parse(request.body);
    if (!deps.auth.verifyPin(pin)) throw unauthorized();
    return reply.code(204).send();
  });
}
