import { FastifyRequest, FastifyReply } from 'fastify';
import { JWTPayload } from '../types';

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

    request.authUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      firstName: '',
      lastName: '',
      isEmailVerified: true,
    };
  } catch (_err) {
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
  if (request.authUser?.role !== 'admin') {
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
    request.authUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      firstName: '',
      lastName: '',
      isEmailVerified: true,
    };
  } catch {
    // silently ignore — user is optional
  }
}
