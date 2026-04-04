import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthUser, JWTPayload } from '../types';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const payload = await request.jwtVerify<JWTPayload>();

    if (payload.type !== 'access') {
      return reply.status(401).send({
        success: false,
        message: 'Invalid token type',
        statusCode: 401,
      });
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      firstName: '',
      lastName: '',
      isEmailVerified: true,
    } as AuthUser;
  } catch (err) {
    return reply.status(401).send({
      success: false,
      message: 'Unauthorized: Invalid or expired token',
      statusCode: 401,
    });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await authenticate(request, reply);
  if (request.user?.role !== 'admin') {
    return reply.status(403).send({
      success: false,
      message: 'Forbidden: Admin access required',
      statusCode: 403,
    });
  }
}

export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    const payload = await request.jwtVerify<JWTPayload>();
    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      firstName: '',
      lastName: '',
      isEmailVerified: true,
    } as AuthUser;
  } catch {
    // silently ignore — user is optional
  }
}
