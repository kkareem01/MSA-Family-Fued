import { existsSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import type { StorageInfo } from '@feud/shared';
import { MEMORY_DB } from './connection';

/** volume: survives redeploys; local: a file on this machine; ephemeral: inside a container with no mount, wiped on restart. */
export type { StorageInfo, StorageKind } from '@feud/shared';

export type StorageProbe = Readonly<{
  env: Readonly<Record<string, string | undefined>>;
  /** Device id of the filesystem holding `path`; a mount point sits on a different device from `/`. */
  deviceOf: (path: string) => number;
  inContainer: () => boolean;
}>;

const MOUNT_VARS = ['RAILWAY_VOLUME_MOUNT_PATH', 'FLY_VOLUME_MOUNT_PATH'] as const;
const DOCKER_MARKER = '/.dockerenv';
/** Hosting platforms that run the image without leaving the Docker marker behind. */
const PLATFORM_VARS = ['RAILWAY_ENVIRONMENT', 'RAILWAY_PROJECT_ID', 'FLY_APP_NAME', 'KUBERNETES_SERVICE_HOST', 'RENDER'] as const;

export function inHostedContainer(env: Readonly<Record<string, string | undefined>>, dockerMarker = DOCKER_MARKER): boolean {
  return existsSync(dockerMarker) || PLATFORM_VARS.some((name) => typeof env[name] === 'string' && env[name] !== '');
}

export const defaultProbe: StorageProbe = {
  env: process.env,
  deviceOf: (path) => Number(statSync(path).dev),
  inContainer: () => inHostedContainer(process.env),
};

function onDeclaredMount(dir: string, env: StorageProbe['env']): boolean {
  return MOUNT_VARS.some((name) => {
    const mount = env[name];
    return typeof mount === 'string' && mount.length > 0 && dir.startsWith(mount);
  });
}

function onSeparateDevice(dir: string, deviceOf: StorageProbe['deviceOf']): boolean {
  try {
    return deviceOf(dir) !== deviceOf('/');
  } catch {
    return false;
  }
}

/** Says whether the database file will still be there after a restart. Never throws. */
export function describeStorage(dbPath: string, probe: StorageProbe = defaultProbe): StorageInfo {
  if (dbPath === MEMORY_DB) return { path: dbPath, kind: 'memory' };
  const dir = dirname(dbPath);
  if (onDeclaredMount(dir, probe.env) || onSeparateDevice(dir, probe.deviceOf)) return { path: dbPath, kind: 'volume' };
  return { path: dbPath, kind: probe.inContainer() ? 'ephemeral' : 'local' };
}
