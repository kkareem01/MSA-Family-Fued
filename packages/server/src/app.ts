import Fastify, { type FastifyInstance } from 'fastify';
import type { ServerConfig } from './config';
import type { Database } from './db/connection';
import { createQuestionRepo } from './repositories/questionRepo';
import { createSurveyRepo } from './repositories/surveyRepo';
import { createTallyDecisionRepo } from './repositories/tallyDecisionRepo';
import { createBoardAnswerRepo } from './repositories/boardAnswerRepo';
import { createGameStateRepo } from './repositories/gameStateRepo';
import { createSettingsRepo } from './repositories/settingsRepo';
import { createBackupRepo } from './repositories/backupRepo';
import { createRestoreService } from './services/restoreService';
import { describeStorage, type StorageInfo } from './db/storage';
import { createAuth } from './services/auth';
import { createQuestionService } from './services/questionService';
import { createSurveyService } from './services/surveyService';
import { createTallyService } from './services/tallyService';
import { createSettingsService } from './services/settingsService';
import { createGameService } from './services/gameService';
import { registerErrorHandler } from './plugins/errorHandler';
import { registerStaticSite } from './plugins/staticSite';
import { DEFAULT_RATE_LIMITS, registerRateLimit, type RateLimits } from './plugins/rateLimit';
import { createHostGuard } from './plugins/hostAuth';
import { registerRoutes } from './routes';
import type { RouteDeps } from './routes/deps';
import { attachSockets } from './sockets/attach';
import type { FeudServer } from './sockets/types';

export type BuildAppOptions = Readonly<{
  config: ServerConfig;
  db: Database;
  rateLimits?: RateLimits;
  now?: () => number;
  storage?: StorageInfo;
}>;

export type BuiltApp = Readonly<{ app: FastifyInstance; io: FeudServer; services: Omit<RouteDeps, 'requireHost' | 'rateLimits' | 'backup' | 'responses' | 'storage' | 'restoreService'> }>;

/** Wires repositories, services, plugins, routes and Socket.IO onto one Fastify instance. */
export async function buildApp({ config, db, rateLimits = DEFAULT_RATE_LIMITS, now = Date.now, storage = describeStorage(config.dbPath) }: BuildAppOptions): Promise<BuiltApp> {
  const app = Fastify({ logger: config.logLevel === 'silent' ? false : { level: config.logLevel }, trustProxy: config.trustProxy });

  const questions = createQuestionRepo(db);
  const boards = createBoardAnswerRepo(db);
  const responses = createSurveyRepo(db);
  const decisions = createTallyDecisionRepo(db);

  const auth = createAuth(config.hostPin);
  const questionService = createQuestionService({ questions, boards, now });
  const surveyService = createSurveyService({ questions, responses, now });
  const tallyService = createTallyService({ questions, responses, decisions, boards, now });
  const settingsService = createSettingsService({ settings: createSettingsRepo(db), config, now });
  const gameService = createGameService({ gameState: createGameStateRepo(db), questionService, now, log: app.log });

  const { spaFallback } = await registerStaticSite(app, config);
  registerErrorHandler(app, { spaFallback });
  await registerRateLimit(app, rateLimits);
  const services = { auth, questionService, surveyService, tallyService, settingsService, gameService };
  const restoreService = createRestoreService({ db, questions, responses, tally: tallyService, now });
  registerRoutes(app, { ...services, requireHost: createHostGuard(auth), rateLimits, backup: createBackupRepo(db), responses, storage, restoreService }, config);
  const io = attachSockets(app, { auth, gameService, settingsService, now });

  return { app, io, services };
}
