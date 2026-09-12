import type { FastifyInstance, FastifyRequest } from 'fastify';
import rateLimit from '@fastify/rate-limit';

export type RateLimits = Readonly<{ surveyMax: number; globalMax: number; timeWindowMs: number }>;

/**
 * Generous by design: a whole audience on venue wifi shares one public IP.
 * These catch runaway scripts, not people. The per-token uniqueness in the DB is the real guard.
 */
export const DEFAULT_RATE_LIMITS: RateLimits = { surveyMax: 120, globalMax: 1000, timeWindowMs: 60_000 };

/** Behind a Cloudflare tunnel the real client address arrives in a header. */
export function clientKey(request: FastifyRequest): string {
  const header = request.headers['cf-connecting-ip'];
  const cf = Array.isArray(header) ? header[0] : header;
  return cf && cf.length > 0 ? cf : request.ip;
}

export async function registerRateLimit(app: FastifyInstance, limits: RateLimits): Promise<void> {
  await app.register(rateLimit, {
    global: true,
    max: limits.globalMax,
    timeWindow: limits.timeWindowMs,
    keyGenerator: clientKey,
    // The plugin throws an Error with statusCode 429; the shared error handler turns it into the API envelope.
  });
}

export function surveyRouteConfig(limits: RateLimits) {
  return { rateLimit: { max: limits.surveyMax, timeWindow: limits.timeWindowMs } };
}
