import { readdirSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import { apiOk, CUE_NAMES, type CueName } from '@feud/shared';
import type { ServerConfig } from '../config';

const EXTENSION = '.mp3';

/** Which cue overrides exist in the sounds folder right now. */
export function listSoundOverrides(soundsDir: string): readonly CueName[] {
  try {
    const files = new Set(readdirSync(soundsDir));
    return CUE_NAMES.filter((name) => files.has(`${name}${EXTENSION}`));
  } catch {
    return [];
  }
}

export function registerSoundRoutes(app: FastifyInstance, config: ServerConfig): void {
  app.get('/api/sounds', async () => apiOk({ overrides: listSoundOverrides(config.soundsDir) }));
}
