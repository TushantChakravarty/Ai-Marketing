import { FastifyPluginAsync } from 'fastify';
import { adsController } from './ads.controller';

export const adsRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(adsController, { prefix: '/ads' });
};
