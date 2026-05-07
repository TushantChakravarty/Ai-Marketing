import { FastifyRequest } from 'fastify';

export function getServerOrigin(request: FastifyRequest): string {
  const proto =
    (request.headers['x-forwarded-proto'] as string | undefined)
      ?.split(',')[0]
      .trim() ?? 'http';
  const host = request.headers.host ?? 'localhost:3001';
  return `${proto}://${host}`;
}
