import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  request.log.error({ err: error }, 'Unhandled error');

  // Zod validation errors
  if (error instanceof ZodError) {
    const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    reply.status(400).send({
      success: false,
      message: 'Validation failed',
      error: messages.join(', '),
      statusCode: 400,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const fastifyError = error as FastifyError;

  // Fastify validation errors
  if (fastifyError.validation) {
    reply.status(400).send({
      success: false,
      message: 'Request validation failed',
      error: fastifyError.message,
      statusCode: 400,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // JWT errors
  if (
    fastifyError.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED' ||
    fastifyError.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID'
  ) {
    reply.status(401).send({
      success: false,
      message: 'Unauthorized: Invalid or expired token',
      statusCode: 401,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Rate limit errors
  if (fastifyError.statusCode === 429) {
    reply.status(429).send({
      success: false,
      message: 'Too many requests. Please try again later.',
      statusCode: 429,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Not found
  if (fastifyError.statusCode === 404) {
    reply.status(404).send({
      success: false,
      message: fastifyError.message || 'Resource not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Known status codes
  const statusCode = fastifyError.statusCode ?? 500;
  if (statusCode >= 400 && statusCode < 500) {
    reply.status(statusCode).send({
      success: false,
      message: fastifyError.message || 'Bad request',
      statusCode,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Generic 500
  reply.status(500).send({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    statusCode: 500,
    timestamp: new Date().toISOString(),
  });
}
