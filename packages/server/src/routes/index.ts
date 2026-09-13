import type { FastifyInstance } from 'fastify';
import type { RouteDeps } from './deps';
import { registerHealthRoutes } from './health';
import { registerAuthRoutes } from './auth';
import { registerQuestionRoutes } from './questions';
import { registerSurveyRoutes } from './survey';
import { registerTallyRoutes } from './tally';
import { registerSettingsRoutes } from './settings';
import { registerGameRoutes } from './game';
import { registerSoundRoutes } from './sounds';
import type { ServerConfig } from '../config';

export function registerRoutes(app: FastifyInstance, deps: RouteDeps, config: ServerConfig): void {
  registerHealthRoutes(app, deps);
  registerAuthRoutes(app, deps);
  registerQuestionRoutes(app, deps);
  registerSurveyRoutes(app, deps);
  registerTallyRoutes(app, deps);
  registerSettingsRoutes(app, deps);
  registerGameRoutes(app, deps);
  registerSoundRoutes(app, config);
}
