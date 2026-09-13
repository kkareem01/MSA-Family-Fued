import type { FastifyInstance } from 'fastify';
import { apiOk, publicUrlSchema, spotlightSchema } from '@feud/shared';
import type { RouteDeps } from './deps';

export function registerSettingsRoutes(app: FastifyInstance, deps: RouteDeps): void {
  const { settingsService, requireHost } = deps;
  const opts = { preHandler: requireHost };

  app.get('/api/settings', opts, async () => apiOk(settingsService.getPublicSettings()));

  app.put('/api/settings/public-url', opts, async (request) => {
    const { url } = publicUrlSchema.parse(request.body);
    settingsService.setPublicUrl(url);
    return apiOk(settingsService.getPublicSettings());
  });

  app.put('/api/settings/spotlight', opts, async (request) => {
    const { spotlight } = spotlightSchema.parse(request.body);
    settingsService.setSpotlight(spotlight);
    return apiOk(settingsService.getPublicSettings());
  });

  app.post('/api/settings/buzzer-codes/rotate', opts, async () => {
    settingsService.rotateBuzzerCodes();
    return apiOk(settingsService.getPublicSettings());
  });
}
