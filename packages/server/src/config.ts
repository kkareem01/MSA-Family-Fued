import { isAbsolute, resolve } from 'node:path';
import { z } from 'zod';
import { normalizePublicUrl } from './util/publicUrl';

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'] as const;
const NODE_ENVS = ['development', 'production', 'test'] as const;
const MIN_PIN_LENGTH = 4;
const DEFAULT_PORT = 3000;

const envSchema = z.object({
  HOST_PIN: z.string().min(MIN_PIN_LENGTH, `HOST_PIN must be at least ${MIN_PIN_LENGTH} characters`),
  PORT: z.coerce.number().int().min(1).max(65535).default(DEFAULT_PORT),
  DB_PATH: z.string().min(1).default('./data/feud.db'),
  SOUNDS_DIR: z.string().min(1).default('./sounds'),
  WEB_DIST: z.string().min(1).default('./packages/web/dist'),
  PUBLIC_URL: z.string().default(''),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  NODE_ENV: z.enum(NODE_ENVS).default('development'),
});

export type ServerConfig = Readonly<{
  hostPin: string;
  port: number;
  dbPath: string;
  soundsDir: string;
  webDist: string;
  publicUrl: string | null;
  logLevel: (typeof LOG_LEVELS)[number];
  nodeEnv: (typeof NODE_ENVS)[number];
  repoRoot: string;
}>;

const MEMORY_DB = ':memory:';

function resolvePath(repoRoot: string, value: string): string {
  return value === MEMORY_DB || isAbsolute(value) ? value : resolve(repoRoot, value);
}

/** Parses process-style env into a typed config. Throws a readable error naming the bad variable. */
export function loadConfig(env: Readonly<Record<string, string | undefined>>, repoRoot: string): ServerConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${details}`);
  }
  const e = parsed.data;
  return {
    hostPin: e.HOST_PIN,
    port: e.PORT,
    dbPath: resolvePath(repoRoot, e.DB_PATH),
    soundsDir: resolvePath(repoRoot, e.SOUNDS_DIR),
    webDist: resolvePath(repoRoot, e.WEB_DIST),
    publicUrl: normalizePublicUrl(e.PUBLIC_URL),
    logLevel: e.LOG_LEVEL,
    nodeEnv: e.NODE_ENV,
    repoRoot,
  };
}
