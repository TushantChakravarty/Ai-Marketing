import path from 'path';
import fs from 'fs';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { success } from '../../shared/utils/response.util';
import { env } from '../../config/env.config';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const uploadController: FastifyPluginAsync = async (fastify) => {
  // POST /upload/image  — multipart file upload
  fastify.post(
    '/image',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await request.file({ limits: { fileSize: MAX_FILE_SIZE } });
      if (!data) {
        return reply.status(400).send({ success: false, message: 'No file provided' });
      }
      if (!ALLOWED_MIME.includes(data.mimetype)) {
        return reply.status(400).send({ success: false, message: 'Only JPEG, PNG, GIF, and WebP images are allowed' });
      }

      const ext = data.mimetype.split('/')[1].replace('jpeg', 'jpg');
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);

      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      fs.writeFileSync(filePath, buffer);

      const fileUrl = `${env.BACKEND_URL}/uploads/${filename}`;
      return reply.send(success({ url: fileUrl }, 'Image uploaded'));
    },
  );
};
