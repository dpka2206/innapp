import { Router } from 'express';
import { z } from 'zod';
import { Membership } from '../models/Membership.js';
import { User } from '../models/User.js';
import { requireAuth, publicUser } from '../middleware/auth.js';
import { loadMembership, requireMinRole } from '../middleware/rbac.js';
import { createInviteToken, sendInviteEmail } from '../services/email.js';
import { config } from '../config/env.js';

const router = Router({ mergeParams: true });

function inviteUrl(token) {
  return `${config.appUrl.replace(/\/$/, '')}/invite/${token}`;
}

function serializeMember(m) {
  const pending = m.status === 'pending' && m.inviteToken;
  return {
    id: m._id.toString(),
    email: m.email,
    role: m.role,
    status: m.status,
    user: m.userId ? publicUser(m.userId) : null,
    inviteUrl: pending ? inviteUrl(m.inviteToken) : null,
    createdAt: m.createdAt,
  };
}

router.get('/', requireAuth, loadMembership, async (req, res, next) => {
  try {
    const members = await Membership.find({ projectId: req.project._id })
      .populate('userId')
      .sort({ status: 1, createdAt: -1 });
    res.json({
      members: members.map(serializeMember),
      emailConfigured: Boolean(config.resendApiKey),
    });
  } catch (err) {
    next(err);
  }
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

router.post('/invites', requireAuth, loadMembership, requireMinRole('admin'), async (req, res, next) => {
  try {
    const body = inviteSchema.parse(req.body);
    const email = body.email.toLowerCase();

    if (email === req.user.email.toLowerCase()) {
      return res.status(400).json({ error: 'You are already a member' });
    }

    const existing = await Membership.findOne({ projectId: req.project._id, email });
    if (existing) {
      return res.status(409).json({ error: 'Already invited or a member' });
    }

    const existingUser = await User.findOne({ email });
    const token = createInviteToken();
    const membership = await Membership.create({
      projectId: req.project._id,
      userId: existingUser?._id,
      email,
      role: body.role,
      status: existingUser ? 'active' : 'pending',
      invitedBy: req.user._id,
      inviteToken: existingUser ? undefined : token,
      acceptedAt: existingUser ? new Date() : undefined,
    });

    await sendInviteEmail({
      to: email,
      projectName: req.project.name,
      inviterName: req.user.name,
      token: existingUser ? '' : token,
      role: body.role,
      alreadyMember: !!existingUser,
      projectId: req.project._id.toString(),
    });

    await membership.populate('userId');
    res.status(201).json({
      member: serializeMember(membership),
      inviteUrl: existingUser ? null : inviteUrl(token),
      emailDelivery: config.resendApiKey ? 'sent' : 'logged',
      message: existingUser
        ? 'User already has an account — project added to their home immediately.'
        : 'Pending invite created. Copy and share the invite link.',
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid input' });
    }
    next(err);
  }
});

router.post('/:memberId/resend', requireAuth, loadMembership, requireMinRole('admin'), async (req, res, next) => {
  try {
    const member = await Membership.findOne({
      _id: req.params.memberId,
      projectId: req.project._id,
      status: 'pending',
    });
    if (!member) {
      return res.status(404).json({ error: 'Pending invite not found' });
    }
    const token = createInviteToken();
    member.inviteToken = token;
    await member.save();
    await sendInviteEmail({
      to: member.email,
      projectName: req.project.name,
      inviterName: req.user.name,
      token,
      role: member.role,
    });
    res.json({
      ok: true,
      inviteUrl: inviteUrl(token),
      emailDelivery: config.resendApiKey ? 'sent' : 'logged',
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:memberId', requireAuth, loadMembership, requireMinRole('admin'), async (req, res, next) => {
  try {
    const role = z.enum(['admin', 'editor', 'viewer']).parse(req.body.role);
    const member = await Membership.findOne({
      _id: req.params.memberId,
      projectId: req.project._id,
    }).populate('userId');
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    if (member.role === 'owner') {
      return res.status(400).json({ error: 'Cannot change owner role' });
    }
    member.role = role;
    await member.save();
    res.json({ member: serializeMember(member) });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid input' });
    }
    next(err);
  }
});

router.delete('/:memberId', requireAuth, loadMembership, requireMinRole('admin'), async (req, res, next) => {
  try {
    const member = await Membership.findOne({
      _id: req.params.memberId,
      projectId: req.project._id,
    });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    if (member.role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove owner' });
    }
    await member.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
