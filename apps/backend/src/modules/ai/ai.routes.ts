import { FastifyInstance } from 'fastify';
import { aiController } from './ai.controller';

export async function aiRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.register(aiController, { prefix: '/ai' });
}
