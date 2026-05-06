import { FastifyPluginAsync } from 'fastify';
import { uploadController } from './upload.controller';

export const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(uploadController, { prefix: '/upload' });
};
