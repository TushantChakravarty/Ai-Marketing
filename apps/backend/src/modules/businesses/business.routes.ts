import { FastifyInstance } from 'fastify';
import { businessController } from './business.controller';

export async function businessRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.register(businessController, { prefix: '/businesses' });
}
