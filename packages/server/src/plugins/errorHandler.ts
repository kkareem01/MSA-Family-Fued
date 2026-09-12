import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { apiFail } from '@feud/shared';
import { AppError } from '../services/errors';

type HttpError = Error & { statusCode?: number };

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: HttpError, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send(apiFail('validation', 'Invalid request', error.issues));
    }
    if (error instanceof AppError) {
      return reply.code(error.status).send(apiFail(error.code, error.message));
    }
    const status = error.statusCode;
    if (status === 429) return reply.code(429).send(apiFail('rate_limited', 'Too many requests, please slow down'));
    if (status !== undefined && status >= 400 && status < 500) {
      return reply.code(status).send(apiFail('bad_request', error.message));
    }
    request.log.error({ err: error }, 'Unhandled error');
    return reply.code(500).send(apiFail('internal', 'Something went wrong on the server'));
  });

  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send(apiFail('not_found', `Route ${request.method} ${request.url} not found`)),
  );
}
