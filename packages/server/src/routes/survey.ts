import type { FastifyInstance } from 'fastify';
import { apiOk, surveySubmitSchema } from '@feud/shared';
import { clientKey, surveyRouteConfig } from '../plugins/rateLimit';
import { hashIp } from '../util/hash';
import type { RouteDeps } from './deps';

export function registerSurveyRoutes(app: FastifyInstance, deps: RouteDeps): void {
  app.get('/api/survey/questions', async () => apiOk(deps.surveyService.openQuestions()));

  app.post('/api/survey/responses', { config: surveyRouteConfig(deps.rateLimits) }, async (request) => {
    const body = surveySubmitSchema.parse(request.body);
    const results = deps.surveyService.submit(body, hashIp(clientKey(request)));
    return apiOk({ results });
  });
}
