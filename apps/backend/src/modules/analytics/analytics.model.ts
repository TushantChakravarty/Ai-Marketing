import mongoose, { Document, Schema } from 'mongoose';
import { PLATFORMS, Platform } from '../../config/constants';

export interface IAnalytics extends Document {
  business: mongoose.Types.ObjectId;
  date: Date;
  platform: Platform;
  metrics: {
    impressions: number;
    reach: number;
    engagement: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    followers: number;
    followersGained: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const metricsSchema = new Schema(
  {
    impressions: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    followersGained: { type: Number, default: 0 },
  },
  { _id: false },
);

const analyticsSchema = new Schema<IAnalytics>(
  {
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    date: { type: Date, required: true },
    platform: { type: String, enum: PLATFORMS, required: true },
    metrics: { type: metricsSchema, default: () => ({}) },
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

// One record per business/platform/day
analyticsSchema.index({ business: 1, platform: 1, date: 1 }, { unique: true });
analyticsSchema.index({ business: 1, date: -1 });

export const AnalyticsModel = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
