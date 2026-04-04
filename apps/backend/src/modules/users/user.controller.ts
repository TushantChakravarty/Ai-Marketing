import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { userService } from './user.service';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { success, noContent } from '../../shared/utils/response.util';

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain a number'),
});

export const userController: FastifyPluginAsync = async (fastify) => {
  // GET /users/me
  fastify.get(
    '/me',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await userService.findById(request.user!.id);
      if (!user) {
        return reply.status(404).send({ success: false, message: 'User not found', statusCode: 404 });
      }
      return reply.send(success(user, 'User profile retrieved'));
    },
  );

  // PATCH /users/me
  fastify.patch(
    '/me',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = updateProfileSchema.parse(request.body);
      const user = await userService.updateProfile(request.user!.id, dto);
      return reply.send(success(user, 'Profile updated'));
    },
  );

  // POST /users/change-password
  fastify.post(
    '/change-password',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = changePasswordSchema.parse(request.body);
      await userService.changePassword(request.user!.id, dto);
      return reply.send(success(null, 'Password changed successfully'));
    },
  );

  // DELETE /users/me
  fastify.delete(
    '/me',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await userService.deleteAccount(request.user!.id);
      return reply.status(200).send(noContent('Account deleted successfully'));
    },
  );
};
