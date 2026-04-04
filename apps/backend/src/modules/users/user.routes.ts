import { FastifyInstance } from 'fastify';
import { userController } from './user.controller';

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.register(userController, { prefix: '/users' });
}
