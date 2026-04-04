import { FastifyPluginAsync, FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { z } from 'zod';
import { billingService } from './billing.service';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { success } from '../../shared/utils/response.util';

const createCheckoutSchema = z.object({
  planId: z.enum(['starter', 'pro', 'enterprise']),
  businessId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const purchaseCreditsSchema = z.object({
  credits: z.number().int().min(10).max(10000),
  businessId: z.string().min(1),
});

interface BusinessQuery extends RouteGenericInterface {
  Querystring: { businessId?: string };
}

export const billingController: FastifyPluginAsync = async (fastify) => {
  // POST /billing/checkout
  fastify.post(
    '/checkout',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = createCheckoutSchema.parse(request.body);
      const result = await billingService.createCheckoutSession(
        request.authUser!.id,
        request.authUser!.email,
        dto,
      );
      return reply.send(success(result, 'Checkout session created'));
    },
  );

  // POST /billing/portal
  fastify.post(
    '/portal',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const result = await billingService.createPortalSession(request.authUser!.id);
      return reply.send(success(result, 'Portal session created'));
    },
  );

  // POST /billing/webhook - raw body required (no auth)
  fastify.post(
    '/webhook',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const signature = request.headers['stripe-signature'] as string;
      if (!signature) {
        return reply.status(400).send({ success: false, message: 'Missing stripe signature' });
      }

      // rawBody is populated when @fastify/rawbody is registered, fallback to body buffer
      const rawBody = Buffer.isBuffer(request.body)
        ? request.body
        : Buffer.from(JSON.stringify(request.body));

      await billingService.handleWebhook(rawBody, signature);
      return reply.send({ received: true });
    },
  );

  // GET /billing/subscription
  fastify.get<BusinessQuery>(
    '/subscription',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { businessId } = z.object({ businessId: z.string().min(1) }).parse(request.query);
      const subscription = await billingService.getSubscription(request.authUser!.id, businessId);
      return reply.send(success(subscription, 'Subscription retrieved'));
    },
  );

  // DELETE /billing/subscription
  fastify.delete<BusinessQuery>(
    '/subscription',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { businessId } = z.object({ businessId: z.string().min(1) }).parse(request.query);
      const subscription = await billingService.cancelSubscription(request.authUser!.id, businessId);
      return reply.send(success(subscription, 'Subscription cancelled at period end'));
    },
  );

  // POST /billing/credits
  fastify.post(
    '/credits',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = purchaseCreditsSchema.parse(request.body);
      const result = await billingService.purchasePostCredits(
        request.authUser!.id,
        request.authUser!.email,
        dto,
      );
      return reply.send(success(result, 'Credits checkout created'));
    },
  );
};
