import mongoose, { Document, Schema } from 'mongoose';
import { PLATFORMS, POST_STATUS, POST_MODE, PostStatus, PostMode, Platform } from '../../config/constants';

export interface IPost extends Document {
  business: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: {
    text: string;
    mediaUrls: string[];
    hashtags: string[];
  };
  platforms: Array<{
    platform: Platform;
    status: PostStatus;
    platformPostId?: string;
    publishedAt?: Date;
    error?: string;
  }>;
  scheduledAt?: Date;
  publishedAt?: Date;
  status: PostStatus;
  mode: PostMode;
  aiPrompt?: string;
  engagementStats: Map<string, {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    impressions: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const platformStatusSchema = new Schema(
  {
    platform: { type: String, enum: PLATFORMS, required: true },
    status: { type: String, enum: Object.values(POST_STATUS), default: POST_STATUS.DRAFT },
    platformPostId: String,
    publishedAt: Date,
    error: String,
  },
  { _id: false },
);

const engagementSchema = new Schema(
  {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
  },
  { _id: false },
);

const postSchema = new Schema<IPost>(
  {
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: {
      text: { type: String, required: true, maxlength: 5000 },
      mediaUrls: [{ type: String }],
      hashtags: [{ type: String }],
    },
    platforms: [platformStatusSchema],
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
    status: {
      type: String,
      enum: Object.values(POST_STATUS),
      default: POST_STATUS.DRAFT,
      index: true,
    },
    mode: {
      type: String,
      enum: Object.values(POST_MODE),
      default: POST_MODE.MANUAL,
    },
    aiPrompt: String,
    engagementStats: {
      type: Map,
      of: engagementSchema,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

postSchema.index({ business: 1, status: 1, scheduledAt: 1 });
postSchema.index({ business: 1, createdAt: -1 });

export const PostModel = mongoose.model<IPost>('Post', postSchema);
