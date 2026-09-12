import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { apiFail } from '@feud/shared';
import { AppError } from '../services/errors';

type HttpError = Error & { statusCode?: number };

export type ErrorHandlerOptions = Readonly<{ spaFallback: boolean }>;

/** Paths that are files, not app routes: a miss there must be a real 404, never the SPA shell. */
const NON_SPA_PREFIXES = ['/api/', '/socket.io', '/sounds/', '/assets/', '/fonts/'] as const;

function wantsSpaPage(method: string, url: string): boolean {
  return method === 'GET' && !NON_SPA_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export function registerErrorHandler(app: FastifyInstance, options: ErrorHandlerOptions): void {
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

  /** Unknown app routes get the SPA shell (client-side routing); everything else is a JSON 404. */
  app.setNotFoundHandler((request, reply) => {
    if (options.spaFallback && wantsSpaPage(request.method, request.url)) {
      return reply.header('cache-control', 'no-cache').sendFile('index.html');
    }
    return reply.code(404).send(apiFail('not_found', `Route ${request.method} ${request.url} not found`));
  });
}
