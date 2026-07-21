import { Router } from 'express';
import { z } from 'zod';
import { Project } from '../models/Project.js';
import { Membership } from '../models/Membership.js';
import { Post } from '../models/Post.js';
import { requireAuth, publicUser } from '../middleware/auth.js';
import { loadMembership, requireMinRole, requireRole } from '../middleware/rbac.js';
import { PLATFORMS } from '@smc/shared';

const router = Router();

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function serializeProject(project, membership) {
  return {
    id: project._id.toString(),
    name: project.name,
    slug: project.slug,
    color: project.color,
    logoUrl: project.logoUrl || null,
    description: project.description || '',
    platforms: project.platforms,
    ownerId: project.ownerId.toString(),
    alertEmails: project.alertEmails || [],
    categories: project.categories,
    contentTypes: project.contentTypes,
    role: membership?.role || null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const memberships = await Membership.find({
      userId: req.user._id,
      status: 'active',
    });
    const projectIds = memberships.map((m) => m.projectId);
    const projects = await Project.find({ _id: { $in: projectIds } }).sort({ updatedAt: -1 });
    const byId = Object.fromEntries(memberships.map((m) => [m.projectId.toString(), m]));
    res.json({
      projects: projects.map((p) => serializeProject(p, byId[p._id.toString()])),
    });
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  platforms: z.array(z.enum(PLATFORMS)).min(1).optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const project = await Project.create({
      name: body.name,
      slug: slugify(body.name),
      color: body.color || '#C8F53A',
      logoUrl: body.logoUrl || undefined,
      description: body.description || '',
      platforms: body.platforms || ['instagram'],
      ownerId: req.user._id,
      alertEmails: [req.user.email],
    });

    await Membership.create({
      projectId: project._id,
      userId: req.user._id,
      email: req.user.email,
      role: 'owner',
      status: 'active',
      invitedBy: req.user._id,
      acceptedAt: new Date(),
    });

    res.status(201).json({ project: serializeProject(project, { role: 'owner' }) });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid input' });
    }
    next(err);
  }
});

router.get('/:id', loadMembership, (req, res) => {
  res.json({ project: serializeProject(req.project, req.membership) });
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  logoUrl: z.string().url().optional().nullable().or(z.literal('')),
  description: z.string().optional(),
  platforms: z.array(z.enum(PLATFORMS)).min(1).optional(),
  alertEmails: z.array(z.string().email()).optional(),
  categories: z.array(z.string().min(1)).optional(),
  contentTypes: z.array(z.string().min(1)).optional(),
});

router.patch('/:id', loadMembership, requireMinRole('admin'), async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    Object.assign(req.project, body);
    if (body.name) req.project.slug = slugify(body.name);
    if (body.logoUrl === '') req.project.logoUrl = undefined;
    await req.project.save();
    res.json({ project: serializeProject(req.project, req.membership) });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid input' });
    }
    next(err);
  }
});

router.delete('/:id', loadMembership, requireRole('owner'), async (req, res, next) => {
  try {
    await Post.deleteMany({ projectId: req.project._id });
    await Membership.deleteMany({ projectId: req.project._id });
    await Project.deleteOne({ _id: req.project._id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
