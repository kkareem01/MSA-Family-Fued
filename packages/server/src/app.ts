import Fastify, { type FastifyInstance } from 'fastify';
import type { ServerConfig } from './config';
import type { Database } from './db/connection';
import { createQuestionRepo } from './repositories/questionRepo';
import { createSurveyRepo } from './repositories/surveyRepo';
import { createTallyDecisionRepo } from './repositories/tallyDecisionRepo';
import { createBoardAnswerRepo } from './repositories/boardAnswerRepo';
import { createGameStateRepo } from './repositories/gameStateRepo';
import { createSettingsRepo } from './repositories/settingsRepo';
import { createAuth } from './services/auth';
import { createQuestionService } from './services/questionService';
import { createSurveyService } from './services/surveyService';
import { createTallyService } from './services/tallyService';
import { createSettingsService } from './services/settingsService';
import { createGameService } from './services/gameService';
import { registerErrorHandler } from './plugins/errorHandler';
import { DEFAULT_RATE_LIMITS, registerRateLimit, type RateLimits } from './plugins/rateLimit';
import { createHostGuard } from './plugins/hostAuth';
import { registerRoutes } from './routes';
import type { RouteDeps } from './routes/deps';

export type BuildAppOptions = Readonly<{
  config: ServerConfig;
  db: Database;
  rateLimits?: RateLimits;
  now?: () => number;
}>;

export type BuiltApp = Readonly<{ app: FastifyInstance; services: Omit<RouteDeps, 'requireHost' | 'rateLimits'> }>;

/** Wires repositories, services, plugins and routes onto a Fastify instance. Sockets attach in `attachSockets`. */
export async function buildApp({ config, db, rateLimits = DEFAULT_RATE_LIMITS, now = Date.now }: BuildAppOptions): Promise<BuiltApp> {
  const app = Fastify({ logger: config.logLevel === 'silent' ? false : { level: config.logLevel } });

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

  registerErrorHandler(app);
  await registerRateLimit(app, rateLimits);
  const services = { auth, questionService, surveyService, tallyService, settingsService, gameService };
  registerRoutes(app, { ...services, requireHost: createHostGuard(auth), rateLimits });

  return { app, services };
}
