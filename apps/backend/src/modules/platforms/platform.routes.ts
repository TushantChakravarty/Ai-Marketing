import { FastifyInstance } from 'fastify';
import { platformController } from './platform.controller';

export async function platformRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.register(platformController, { prefix: '/platforms' });
}
