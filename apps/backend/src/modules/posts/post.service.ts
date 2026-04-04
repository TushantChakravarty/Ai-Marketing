import { PostModel, IPost } from './post.model';
import { CreatePostDto, SchedulePostDto, UpdatePostDto } from './post.types';
import { POST_STATUS, Platform } from '../../config/constants';

export class PostService {
  async create(authorId: string, dto: CreatePostDto): Promise<IPost> {
    const platformEntries = dto.platforms.map((platform) => ({
      platform,
      status: POST_STATUS.DRAFT,
    }));

    return PostModel.create({
      business: dto.businessId,
      author: authorId,
      content: {
        text: dto.text,
        mediaUrls: dto.mediaUrls ?? [],
        hashtags: dto.hashtags ?? [],
      },
      platforms: platformEntries,
      mode: dto.mode ?? 'manual',
      aiPrompt: dto.aiPrompt,
      status: POST_STATUS.DRAFT,
    });
  }

  async schedule(id: string, authorId: string, dto: SchedulePostDto): Promise<IPost | null> {
    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw Object.assign(new Error('Scheduled time must be in the future'), { statusCode: 400 });
    }

    return PostModel.findOneAndUpdate(
      { _id: id, author: authorId },
      {
        $set: {
          scheduledAt,
          status: POST_STATUS.SCHEDULED,
          'platforms.$[].status': POST_STATUS.SCHEDULED,
        },
      },
      { new: true },
    ).exec();
  }

  async publish(id: string, authorId: string): Promise<IPost | null> {
    const post = await PostModel.findOne({ _id: id, author: authorId }).exec();
    if (!post) return null;

    // Mark as publishing
    post.status = POST_STATUS.PUBLISHING;
    for (const p of post.platforms) {
      p.status = POST_STATUS.PUBLISHING;
    }
    await post.save();

    // Simulate publish to each platform (real implementation hooks into PlatformService)
    let allSucceeded = true;
    for (const platformEntry of post.platforms) {
      try {
        // In production, call platformService.publishPost(...)
        platformEntry.status = POST_STATUS.PUBLISHED;
        platformEntry.publishedAt = new Date();
        platformEntry.platformPostId = `mock_${platformEntry.platform}_${Date.now()}`;
      } catch (err) {
        platformEntry.status = POST_STATUS.FAILED;
        platformEntry.error = err instanceof Error ? err.message : 'Unknown error';
        allSucceeded = false;
      }
    }

    post.status = allSucceeded ? POST_STATUS.PUBLISHED : POST_STATUS.FAILED;
    post.publishedAt = allSucceeded ? new Date() : undefined;
    await post.save();

    return post;
  }

  async getByBusiness(
    businessId: string,
    page: number,
    limit: number,
    status?: string,
  ): Promise<{ posts: IPost[]; total: number }> {
    const filter: Record<string, unknown> = { business: businessId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      PostModel.find(filter)
        .populate('author', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      PostModel.countDocuments(filter),
    ]);

    return { posts, total };
  }

  async getById(id: string): Promise<IPost | null> {
    return PostModel.findById(id).populate('author', 'firstName lastName email').exec();
  }

  async update(id: string, authorId: string, dto: UpdatePostDto): Promise<IPost | null> {
    const updateFields: Record<string, unknown> = {};
    if (dto.text !== undefined) updateFields['content.text'] = dto.text;
    if (dto.mediaUrls !== undefined) updateFields['content.mediaUrls'] = dto.mediaUrls;
    if (dto.hashtags !== undefined) updateFields['content.hashtags'] = dto.hashtags;
    if (dto.aiPrompt !== undefined) updateFields.aiPrompt = dto.aiPrompt;
    if (dto.platforms !== undefined) {
      updateFields.platforms = dto.platforms.map((platform) => ({
        platform,
        status: POST_STATUS.DRAFT,
      }));
    }

    return PostModel.findOneAndUpdate(
      { _id: id, author: authorId, status: { $in: [POST_STATUS.DRAFT, POST_STATUS.SCHEDULED] } },
      { $set: updateFields },
      { new: true },
    ).exec();
  }

  async delete(id: string, authorId: string): Promise<void> {
    await PostModel.findOneAndDelete({ _id: id, author: authorId }).exec();
  }

  async updateEngagementStats(
    id: string,
    platform: Platform,
    stats: { likes: number; comments: number; shares: number; reach: number; impressions: number },
  ): Promise<void> {
    await PostModel.findByIdAndUpdate(id, {
      $set: { [`engagementStats.${platform}`]: stats },
    }).exec();
  }

  async getScheduledPosts(before: Date): Promise<IPost[]> {
    return PostModel.find({
      status: POST_STATUS.SCHEDULED,
      scheduledAt: { $lte: before },
    })
      .populate('business')
      .exec();
  }

  async getAnalytics(id: string): Promise<IPost | null> {
    return PostModel.findById(id).select('engagementStats platforms status publishedAt content.hashtags').exec();
  }
}

export const postService = new PostService();
