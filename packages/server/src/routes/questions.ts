import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { apiOk, createQuestionSchema, questionStatusSchema, setQuestionStatusSchema, updateQuestionSchema } from '@feud/shared';
import type { RouteDeps } from './deps';
import { questionId } from './params';

const listQuerySchema = z.object({ status: questionStatusSchema.optional() });

export function registerQuestionRoutes(app: FastifyInstance, deps: RouteDeps): void {
  const { questionService, requireHost } = deps;
  const opts = { preHandler: requireHost };

  app.get('/api/questions', opts, async (request) => {
    const { status } = listQuerySchema.parse(request.query);
    return apiOk(status ? questionService.listByStatus(status) : questionService.list());
  });

  app.post('/api/questions', opts, async (request, reply) => {
    const { prompt } = createQuestionSchema.parse(request.body);
    reply.code(201);
    return apiOk(questionService.create(prompt));
  });

  app.patch('/api/questions/:id', opts, async (request) => {
    const patch = updateQuestionSchema.parse(request.body);
    return apiOk(questionService.update(questionId(request.params), patch));
  });

  app.delete('/api/questions/:id', opts, async (request, reply) => {
    questionService.remove(questionId(request.params));
    return reply.code(204).send();
  });

  app.post('/api/questions/:id/status', opts, async (request) => {
    const { status } = setQuestionStatusSchema.parse(request.body);
    return apiOk(questionService.setStatus(questionId(request.params), status));
  });

  app.get('/api/questions/:id/board', opts, async (request) => apiOk(questionService.getBoard(questionId(request.params))));
}
