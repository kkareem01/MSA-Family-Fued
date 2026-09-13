import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { loadConfig } from './config';
import { openDatabase } from './db/connection';
import { runMigrations } from './db/migrations';
import { describeStorage } from './db/storage';
import { buildApp } from './app';

const repoRoot = resolve(import.meta.dirname, '../../..');
loadDotenv({ path: resolve(repoRoot, '.env'), quiet: true });

async function main(): Promise<void> {
  const config = loadConfig(process.env, repoRoot);
  const db = openDatabase(config.dbPath);
  const applied = runMigrations(db);
  const storage = describeStorage(config.dbPath);
  const { app, services } = await buildApp({ config, db, storage });
  if (applied > 0) app.log.info({ applied }, 'Applied database migrations');
  if (storage.kind === 'ephemeral') {
    app.log.error({ dbPath: config.dbPath }, 'NO PERSISTENT VOLUME: questions and answers will be wiped on the next restart. Attach a volume at /data.');
  } else {
    app.log.info(storage, 'Database storage');
  }

  await app.listen({ port: config.port, host: '0.0.0.0' });
  app.log.info({ local: `http://localhost:${config.port}`, lan: services.settingsService.getLanUrl() }, 'MSA Family Feud is up');

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'Shutting down');
    await app.close();
    db.close();
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
