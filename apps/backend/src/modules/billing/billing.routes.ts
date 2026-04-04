import { FastifyInstance } from 'fastify';
import { billingController } from './billing.controller';

export async function billingRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.register(billingController, { prefix: '/billing' });
}
