import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { adsService } from './ads.service';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { success, created, noContent, paginated } from '../../shared/utils/response.util';

// ─── Validation Schemas ───────────────────────────────────────────────────────

const budgetSchema = z.object({
  type: z.enum(['daily', 'lifetime']),
  amount: z.number().positive(),       // in cents
  currency: z.string().default('USD'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

const targetingSchema = z.object({
  ageMin: z.number().min(13).max(65).optional(),
  ageMax: z.number().min(13).max(65).optional(),
  genders: z.array(z.enum(['male', 'female', 'all'])).optional(),
  countries: z.array(z.string().length(2)).optional(),
  cities: z.array(z.string()).optional(),
  interests: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  customAudienceIds: z.array(z.string()).optional(),
  lookalikeSources: z.array(z.string()).optional(),
  excludedAudienceIds: z.array(z.string()).optional(),
});

const creativeSchema = z.object({
  headline: z.string().min(1).max(255),
  bodyText: z.string().min(1).max(1000),
  callToAction: z.enum([
    'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'CONTACT_US',
    'GET_QUOTE', 'BOOK_NOW', 'DOWNLOAD',
  ]),
  imageUrls: z.array(z.string().url()).optional(),
  videoUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  displayLink: z.string().optional(),
});

const createCampaignSchema = z.object({
  businessId: z.string(),
  platform: z.enum(['meta']),
  name: z.string().min(1).max(100),
  objective: z.enum(['AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS', 'APP_PROMOTION', 'SALES']),
  budget: budgetSchema,
  targeting: targetingSchema,
  placements: z.array(z.string()).default([]),
  optimizationGoal: z.enum([
    'REACH', 'LINK_CLICKS', 'IMPRESSIONS', 'LEAD_GENERATION', 'CONVERSIONS', 'POST_ENGAGEMENT',
  ]),
  billingEvent: z.enum(['IMPRESSIONS', 'LINK_CLICKS', 'POST_ENGAGEMENT']),
  creative: creativeSchema,
  metaAdAccountId: z.string().optional().default(''),
  selectedPlatforms: z.array(z.string()).optional().default(['facebook', 'instagram']),
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  budget: budgetSchema.partial().optional(),
  targeting: targetingSchema.optional(),
  creative: creativeSchema.partial().optional(),
});

// ─── Controller ───────────────────────────────────────────────────────────────

export const adsController: FastifyPluginAsync = async (fastify) => {
  // POST /ads — create campaign (draft)
  fastify.post('/', { preHandler: authenticate }, async (req, reply) => {
    const dto = createCampaignSchema.parse(req.body);
    const campaign = await adsService.createCampaign(req.authUser!.id, {
      ...dto,
      budget: {
        ...dto.budget,
        startDate: new Date(dto.budget.startDate),
        endDate: dto.budget.endDate ? new Date(dto.budget.endDate) : undefined,
      },
    });

    return reply.status(201).send(created(campaign, 'Campaign created as draft'));
  });

  // GET /ads?businessId=&status=&page=&limit= — list campaigns
  fastify.get('/', { preHandler: authenticate }, async (req, reply) => {
    const { businessId, status, platform, page, limit } = req.query as any;
    const user = (req as any).user;

    const result = await adsService.getCampaigns({
      businessId,
      status,
      platform,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    return reply.send(
      paginated(result.campaigns, result.total, result.page, result.limit),
    );
  });

  // GET /ads/:id — get single campaign
  fastify.get('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = (req as any).user;
    const campaign = await adsService.getCampaignById(id, user.id);
    return reply.send(success(campaign));
  });

  // PATCH /ads/:id — update campaign (only allowed for drafts)
  fastify.patch('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = (req as any).user;
    const dto = updateCampaignSchema.parse(req.body);
    const campaign = await adsService.updateCampaign(id, user.id, dto);
    return reply.send(success(campaign, 'Campaign updated'));
  });

  // DELETE /ads/:id — archive campaign
  fastify.delete('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = (req as any).user;
    await adsService.deleteCampaign(id, user.id);
    return reply.status(204).send(noContent());
  });

  // POST /ads/:id/launch — push draft to Meta and activate
  fastify.post('/:id/launch', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = (req as any).user;
    const campaign = await adsService.launchCampaign(id, user.id);
    return reply.send(success(campaign, 'Campaign launched'));
  });

  // POST /ads/:id/pause
  fastify.post('/:id/pause', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = (req as any).user;
    const campaign = await adsService.pauseCampaign(id, user.id);
    return reply.send(success(campaign, 'Campaign paused'));
  });

  // POST /ads/:id/resume
  fastify.post('/:id/resume', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = (req as any).user;
    const campaign = await adsService.resumeCampaign(id, user.id);
    return reply.send(success(campaign, 'Campaign resumed'));
  });

  // POST /ads/:id/sync-insights — pull latest metrics from Meta
  fastify.post('/:id/sync-insights', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = (req as any).user;
    const campaign = await adsService.syncInsights(id, user.id);
    return reply.send(success(campaign, 'Insights synced'));
  });

  // GET /ads/tools/interests?q=&adAccountId=
  fastify.get('/tools/interests', { preHandler: authenticate }, async (req, reply) => {
    const { adAccountId, q } = req.query as any;
    const interests = await adsService.searchInterests(adAccountId, q);
    return reply.send(success(interests));
  });

  // POST /ads/tools/estimate-audience
  fastify.post('/tools/estimate-audience', { preHandler: authenticate }, async (req, reply) => {
    const { adAccountId, targeting } = req.body as any;
    const estimate = await adsService.estimateAudience(adAccountId, targeting);
    return reply.send(success(estimate));
  });
};
