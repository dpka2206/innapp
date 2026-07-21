import mongoose from 'mongoose';
import { PLATFORMS, POST_STATUSES, APPROVAL_STATUSES } from '@smc/shared';

const insightsSchema = new mongoose.Schema(
  {
    reach: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true },
    platforms: { type: [String], enum: PLATFORMS, default: ['instagram'] },
    contentType: { type: String, required: true },
    category: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: POST_STATUSES, default: 'idea' },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    caption: { type: String, default: '' },
    hashtags: { type: String, default: '' },
    assetLinks: [{ type: String }],
    referenceLinks: [{ type: String }],
    publishedUrl: { type: String },
    insights: { type: insightsSchema, default: () => ({}) },
    approvalStatus: { type: String, enum: APPROVAL_STATUSES, default: 'pending' },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

postSchema.index({ projectId: 1, scheduledAt: 1 });
postSchema.index({ projectId: 1, status: 1 });
postSchema.index({ assigneeId: 1, scheduledAt: 1 });

export const Post = mongoose.model('Post', postSchema);
