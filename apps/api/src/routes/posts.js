import { Router } from 'express';
import { z } from 'zod';
import { Post } from '../models/Post.js';
import { requireAuth, publicUser } from '../middleware/auth.js';
import { loadMembership, requireMinRole } from '../middleware/rbac.js';
import { PLATFORMS, POST_STATUSES, APPROVAL_STATUSES } from '@smc/shared';

const router = Router({ mergeParams: true });

function serializePost(post) {
  return {
    id: post._id.toString(),
    projectId: post.projectId.toString(),
    title: post.title,
    platforms: post.platforms,
    contentType: post.contentType,
    category: post.category,
    scheduledAt: post.scheduledAt,
    status: post.status,
    assigneeId: post.assigneeId?.toString?.() || post.assigneeId || null,
    assignee: post.assigneeId?.email ? publicUser(post.assigneeId) : null,
    caption: post.caption || '',
    hashtags: post.hashtags || '',
    assetLinks: post.assetLinks || [],
    referenceLinks: post.referenceLinks || [],
    publishedUrl: post.publishedUrl || null,
    insights: post.insights || {},
    approvalStatus: post.approvalStatus,
    notes: post.notes || '',
    createdBy: post.createdBy?.toString?.() || post.createdBy,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

router.get('/', requireAuth, loadMembership, async (req, res, next) => {
  try {
    const q = { projectId: req.project._id };
    if (req.query.from || req.query.to) {
      q.scheduledAt = {};
      if (req.query.from) q.scheduledAt.$gte = new Date(req.query.from);
      if (req.query.to) q.scheduledAt.$lte = new Date(req.query.to);
    }
    if (req.query.platform) q.platforms = req.query.platform;
    if (req.query.type) q.contentType = req.query.type;
    if (req.query.status) q.status = req.query.status;
    if (req.query.assignee) q.assigneeId = req.query.assignee;

    const posts = await Post.find(q).populate('assigneeId').sort({ scheduledAt: 1 });
    res.json({ posts: posts.map(serializePost) });
  } catch (err) {
    next(err);
  }
});

const insightsSchema = z
  .object({
    reach: z.number().optional(),
    impressions: z.number().optional(),
    likes: z.number().optional(),
    comments: z.number().optional(),
    shares: z.number().optional(),
    saves: z.number().optional(),
    views: z.number().optional(),
    clicks: z.number().optional(),
  })
  .optional();

const createSchema = z.object({
  title: z.string().min(1),
  platforms: z.array(z.enum(PLATFORMS)).min(1),
  contentType: z.string().min(1),
  category: z.string().min(1),
  scheduledAt: z.string().datetime().or(z.coerce.date()),
  status: z.enum(POST_STATUSES).optional(),
  assigneeId: z.string().optional().nullable(),
  caption: z.string().optional(),
  hashtags: z.string().optional(),
  assetLinks: z.array(z.string()).optional(),
  referenceLinks: z.array(z.string()).optional(),
  publishedUrl: z.string().optional().nullable(),
  insights: insightsSchema,
  approvalStatus: z.enum(APPROVAL_STATUSES).optional(),
  notes: z.string().optional(),
});

router.post('/', requireAuth, loadMembership, requireMinRole('editor'), async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const post = await Post.create({
      ...body,
      scheduledAt: new Date(body.scheduledAt),
      projectId: req.project._id,
      createdBy: req.user._id,
      assigneeId: body.assigneeId || undefined,
    });
    await post.populate('assigneeId');
    res.status(201).json({ post: serializePost(post) });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid input' });
    }
    next(err);
  }
});

router.patch('/:postId', requireAuth, loadMembership, requireMinRole('editor'), async (req, res, next) => {
  try {
    const body = createSchema.partial().parse(req.body);
    const post = await Post.findOne({ _id: req.params.postId, projectId: req.project._id });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (body.scheduledAt) body.scheduledAt = new Date(body.scheduledAt);
    if (body.assigneeId === null) body.assigneeId = undefined;
    Object.assign(post, body);
    await post.save();
    await post.populate('assigneeId');
    res.json({ post: serializePost(post) });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid input' });
    }
    next(err);
  }
});

router.delete('/:postId', requireAuth, loadMembership, requireMinRole('editor'), async (req, res, next) => {
  try {
    const result = await Post.deleteOne({ _id: req.params.postId, projectId: req.project._id });
    if (!result.deletedCount) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
