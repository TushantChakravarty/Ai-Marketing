import { FastifyInstance } from 'fastify';
import { analyticsController } from './analytics.controller';

export async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.register(analyticsController, { prefix: '/analytics' });
}
