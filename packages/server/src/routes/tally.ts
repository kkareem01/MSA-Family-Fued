import type { FastifyInstance } from 'fastify';
import {
  apiOk,
  tallyDropSchema,
  tallyFinalizeSchema,
  tallyMergeSchema,
  tallyPointsSchema,
  tallyRenameSchema,
  tallyUnmergeSchema,
} from '@feud/shared';
import type { RouteDeps } from './deps';
import { questionId } from './params';

export function registerTallyRoutes(app: FastifyInstance, deps: RouteDeps): void {
  const { tallyService, requireHost } = deps;
  const opts = { preHandler: requireHost };

  app.get('/api/questions/:id/tally', opts, async (request) => apiOk(tallyService.getTally(questionId(request.params))));

  app.post('/api/questions/:id/tally/merge', opts, async (request) => {
    const { sourceKey, targetKey } = tallyMergeSchema.parse(request.body);
    return apiOk(tallyService.merge(questionId(request.params), sourceKey, targetKey));
  });

  app.post('/api/questions/:id/tally/unmerge', opts, async (request) => {
    const { key } = tallyUnmergeSchema.parse(request.body);
    return apiOk(tallyService.unmerge(questionId(request.params), key));
  });

  app.post('/api/questions/:id/tally/rename', opts, async (request) => {
    const { key, displayText } = tallyRenameSchema.parse(request.body);
    return apiOk(tallyService.rename(questionId(request.params), key, displayText));
  });

  app.post('/api/questions/:id/tally/drop', opts, async (request) => {
    const { key, dropped } = tallyDropSchema.parse(request.body);
    return apiOk(tallyService.drop(questionId(request.params), key, dropped));
  });

  app.post('/api/questions/:id/tally/points', opts, async (request) => {
    const { key, points } = tallyPointsSchema.parse(request.body);
    return apiOk(tallyService.setPoints(questionId(request.params), key, points));
  });

  app.post('/api/questions/:id/finalize', opts, async (request) => {
    const { topN } = tallyFinalizeSchema.parse(request.body);
    return apiOk(tallyService.finalize(questionId(request.params), topN));
  });
}
