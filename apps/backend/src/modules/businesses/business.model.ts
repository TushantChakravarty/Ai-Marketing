import mongoose, { Document, Schema } from 'mongoose';
import {
  PLATFORMS,
  MARKETING_MODE,
  TONE,
  INDUSTRY_LIST,
  MarketingMode,
  Tone,
  Industry,
  Platform,
} from '../../config/constants';

export interface IBusiness extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  industry: Industry;
  website?: string;
  logo?: string;
  socialHandles: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  marketingMode: MarketingMode;
  targetAudience?: string;
  tone: Tone;
  connectedPlatforms: Array<{
    platform: Platform;
    connectedAt: Date;
    platformUserId?: string;
    platformUsername?: string;
  }>;
  platformAdConfigs: Array<{
    platform: Platform;
    enabled: boolean;
    costPerAd: number;   // in cents — what the app charges per ad run
    currency: string;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const connectedPlatformSchema = new Schema(
  {
    platform: { type: String, enum: PLATFORMS, required: true },
    connectedAt: { type: Date, default: Date.now },
    platformUserId: String,
    platformUsername: String,
  },
  { _id: false },
);

const businessSchema = new Schema<IBusiness>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    industry: { type: String, enum: INDUSTRY_LIST, required: true },
    website: { type: String },
    logo: { type: String },
    socialHandles: {
      twitter: String,
      facebook: String,
      instagram: String,
      linkedin: String,
    },
    marketingMode: {
      type: String,
      enum: Object.values(MARKETING_MODE),
      default: MARKETING_MODE.MANUAL,
    },
    targetAudience: { type: String, maxlength: 300 },
    tone: {
      type: String,
      enum: Object.values(TONE),
      default: TONE.PROFESSIONAL,
    },
    connectedPlatforms: [connectedPlatformSchema],
    platformAdConfigs: {
      type: [
        new Schema(
          {
            platform: { type: String, enum: PLATFORMS, required: true },
            enabled: { type: Boolean, default: false },
            costPerAd: { type: Number, default: 0 },
            currency: { type: String, default: 'USD' },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    isActive: { type: Boolean, default: true },
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

businessSchema.index({ owner: 1, name: 1 });

export const BusinessModel = mongoose.model<IBusiness>('Business', businessSchema);
