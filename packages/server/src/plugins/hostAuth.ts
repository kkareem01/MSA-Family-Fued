import type { FastifyRequest } from 'fastify';
import { HOST_PIN_HEADER } from '@feud/shared';
import type { Auth } from '../services/auth';
import { unauthorized } from '../services/errors';

export type HostGuard = (request: FastifyRequest) => Promise<void>;

/** preHandler that rejects requests without a valid `x-host-pin` header. */
export function createHostGuard(auth: Auth): HostGuard {
  return async (request) => {
    const header = request.headers[HOST_PIN_HEADER];
    const pin = Array.isArray(header) ? header[0] : header;
    if (!auth.verifyPin(pin)) throw unauthorized();
  };
}
