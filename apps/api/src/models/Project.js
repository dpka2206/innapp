import mongoose from 'mongoose';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CONTENT_TYPES,
  PLATFORMS,
} from '@smc/shared';

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    color: { type: String, default: '#C8F53A' },
    logoUrl: { type: String },
    description: { type: String, default: '' },
    platforms: {
      type: [String],
      enum: PLATFORMS,
      default: ['instagram'],
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    alertEmails: [{ type: String, lowercase: true, trim: true }],
    categories: { type: [String], default: () => [...DEFAULT_CATEGORIES] },
    contentTypes: { type: [String], default: () => [...DEFAULT_CONTENT_TYPES] },
  },
  { timestamps: true }
);

projectSchema.index({ ownerId: 1 });
projectSchema.index({ slug: 1, ownerId: 1 });

export const Project = mongoose.model('Project', projectSchema);
