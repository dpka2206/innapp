import { Membership } from '../models/Membership.js';
import { Project } from '../models/Project.js';

const ROLE_RANK = { viewer: 1, editor: 2, admin: 3, owner: 4 };

export async function loadMembership(req, res, next) {
  try {
    const projectId = req.params.projectId || req.params.id;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const membership = await Membership.findOne({
      projectId,
      userId: req.user._id,
      status: 'active',
    });

    if (!membership) {
      return res.status(403).json({ error: 'No access to this project' });
    }

    req.project = project;
    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.membership || !roles.includes(req.membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function requireMinRole(minRole) {
  return (req, res, next) => {
    const rank = ROLE_RANK[req.membership?.role] || 0;
    if (rank < ROLE_RANK[minRole]) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
