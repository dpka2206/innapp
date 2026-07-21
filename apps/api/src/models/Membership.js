import mongoose from 'mongoose';
import { ROLES } from '@smc/shared';

const membershipSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ROLES, required: true },
    status: { type: String, enum: ['pending', 'active'], default: 'pending' },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    inviteToken: { type: String },
    acceptedAt: { type: Date },
  },
  { timestamps: true }
);

membershipSchema.index({ projectId: 1, email: 1 }, { unique: true });
membershipSchema.index({ userId: 1, projectId: 1 });
membershipSchema.index({ inviteToken: 1 });

export const Membership = mongoose.model('Membership', membershipSchema);
