import { Router } from 'express';
import { Membership } from '../models/Membership.js';
import { requireAuth } from '../middleware/auth.js';
import { publicUser } from '../middleware/auth.js';

const router = Router();

router.post('/:token/accept', requireAuth, async (req, res, next) => {
  try {
    const membership = await Membership.findOne({
      inviteToken: req.params.token,
      status: 'pending',
    });
    if (!membership) {
      return res.status(404).json({ error: 'Invite not found or already used' });
    }
    if (membership.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({ error: 'Invite email does not match your account' });
    }
    membership.userId = req.user._id;
    membership.status = 'active';
    membership.acceptedAt = new Date();
    membership.inviteToken = undefined;
    await membership.save();
    res.json({
      ok: true,
      projectId: membership.projectId.toString(),
      member: {
        id: membership._id.toString(),
        email: membership.email,
        role: membership.role,
        status: membership.status,
        user: publicUser(req.user),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
