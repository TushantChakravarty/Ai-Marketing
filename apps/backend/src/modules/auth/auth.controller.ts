import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schema';
import { success, created, error } from '../../shared/utils/response.util';

export const authController: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify);

  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const dto = registerSchema.parse(request.body);
    const result = await authService.register(dto);
    return reply.status(201).send(created(result, 'Registration successful'));
  });

  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const dto = loginSchema.parse(request.body);
    const result = await authService.login(dto);
    return reply.status(200).send(success(result, 'Login successful'));
  });

  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = refreshTokenSchema.parse(request.body);
    const tokens = await authService.refreshToken(refreshToken);
    return reply.status(200).send(success(tokens, 'Token refreshed'));
  });

  fastify.post('/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = forgotPasswordSchema.parse(request.body);
    await authService.forgotPassword(email);
    return reply.status(200).send(
      success(null, 'If that email exists, a reset link has been sent'),
    );
  });

  fastify.post('/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const dto = resetPasswordSchema.parse(request.body);
    await authService.resetPassword(dto.token, dto.password);
    return reply.status(200).send(success(null, 'Password reset successfully'));
  });

  fastify.get('/verify-email', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = verifyEmailSchema.parse(request.query);
    await authService.verifyEmail(token);
    return reply.status(200).send(success(null, 'Email verified successfully'));
  });
};
