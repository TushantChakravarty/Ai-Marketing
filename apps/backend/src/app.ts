import path from 'path';
import fs from 'fs';
import Fastify, { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
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
import { uploadRoutes } from './modules/upload/upload.routes';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

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
  await fastify.register(multipart);

  // ── Health check ──────────────────────────────────────────────────────────
  fastify.get('/health', { logLevel: 'silent' }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  }));

  // ── Serve uploaded files ──────────────────────────────────────────────────
  fastify.get('/uploads/:filename', async (request, reply) => {
    const { filename } = request.params as { filename: string };
    // Prevent path traversal
    const safeName = path.basename(filename);
    const filePath = path.join(UPLOADS_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ success: false, message: 'File not found' });
    }
    const ext = path.extname(safeName).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
    };
    reply.header('Content-Type', mimeMap[ext] ?? 'application/octet-stream');
    reply.header('Cache-Control', 'public, max-age=31536000');
    return reply.send(fs.createReadStream(filePath));
  });

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
      await api.register(uploadRoutes);
    },
    { prefix: '/api/v1' },
  );

  return fastify;
}
