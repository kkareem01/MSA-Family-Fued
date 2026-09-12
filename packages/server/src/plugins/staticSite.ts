import { existsSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import type { ServerConfig } from '../config';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const SOUNDS_PREFIX = '/sounds/';

/** Serves the built web bundle (long-cached hashed assets, uncached index) and optional sound overrides. */
export async function registerStaticSite(app: FastifyInstance, config: ServerConfig): Promise<{ spaFallback: boolean }> {
  const hasBundle = existsSync(config.webDist);
  if (hasBundle) {
    await app.register(fastifyStatic, {
      root: config.webDist,
      prefix: '/',
      wildcard: true,
      maxAge: ONE_YEAR_SECONDS * 1000,
      setHeaders: (res, path) => {
        if (path.endsWith('index.html')) res.header('cache-control', 'no-cache');
      },
    });
  }
  if (existsSync(config.soundsDir)) {
    await app.register(fastifyStatic, {
      root: config.soundsDir,
      prefix: SOUNDS_PREFIX,
      decorateReply: !hasBundle,
      cacheControl: false,
    });
  }
  return { spaFallback: hasBundle };
}
