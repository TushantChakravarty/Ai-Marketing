import Fastify, { FastifyInstance } from 'fastify';
import { errorHandler } from './shared/middleware/error.middleware';

// Plugins
import mongodbPlugin from './plugins/mongodb.plugin';
import jwtPlugin from './plugins/jwt.plugin';
import corsPlugin from './plugins/cors.plugin';
import rateLimitPlugin from './plugins/rateLimit.plugin';
import swaggerPlugin from './plugins/swagger.plugin';

// Module routes
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/user.routes';
import { businessRoutes } from './modules/businesses/business.routes';
import { postRoutes } from './modules/posts/post.routes';
import { aiRoutes } from './modules/ai/ai.routes';
import { platformRoutes } from './modules/platforms/platform.routes';
import { billingRoutes } from './modules/billing/billing.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { adsRoutes } from './modules/ads/ads.routes';

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    disableRequestLogging: false,
    ajv: {
      customOptions: {
        strict: false,
        coerceTypes: true,
      },
    },
  });

  // Register global error handler
  fastify.setErrorHandler(errorHandler);

  // Register 404 handler
  fastify.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      success: false,
      message: 'Route not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Core plugins (order matters) ──────────────────────────────────────────
  await fastify.register(corsPlugin);
  await fastify.register(swaggerPlugin);
  await fastify.register(mongodbPlugin);
  await fastify.register(jwtPlugin);
  await fastify.register(rateLimitPlugin);

  // ── Health check ──────────────────────────────────────────────────────────
  fastify.get('/health', { logLevel: 'silent' }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  }));

  // ── API v1 routes ─────────────────────────────────────────────────────────
  await fastify.register(
    async (api) => {
      await api.register(authRoutes);
      await api.register(userRoutes);
      await api.register(businessRoutes);
      await api.register(postRoutes);
      await api.register(aiRoutes);
      await api.register(platformRoutes);
      await api.register(billingRoutes);
      await api.register(analyticsRoutes);
      await api.register(adsRoutes);
    },
    { prefix: '/api/v1' },
  );

  return fastify;
}
