import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Membership } from '../models/Membership.js';
import { config } from '../config/env.js';
import { requireAuth, signToken, publicUser } from '../middleware/auth.js';

const router = Router();
const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null;

async function activatePendingInvites(user) {
  await Membership.updateMany(
    { email: user.email.toLowerCase(), status: 'pending' },
    {
      $set: {
        userId: user._id,
        status: 'active',
        acceptedAt: new Date(),
      },
      $unset: { inviteToken: 1 },
    }
  );
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const email = body.email.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({ email, passwordHash, name: body.name });
    await activatePendingInvites(user);

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid input' });
    }
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user?.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    await activatePendingInvites(user);
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid input' });
    }
    next(err);
  }
});

router.post('/google', async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'idToken required' });
    }
    if (!googleClient) {
      return res.status(503).json({ error: 'Google auth not configured. Set GOOGLE_CLIENT_ID.' });
    }
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();
    const email = payload.email?.toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Google account has no email' });
    }

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });
    if (!user) {
      user = await User.create({
        email,
        googleId: payload.sub,
        name: payload.name || email.split('@')[0],
        avatarUrl: payload.picture,
      });
    } else {
      if (!user.googleId) user.googleId = payload.sub;
      if (payload.picture) user.avatarUrl = payload.picture;
      await user.save();
    }
    await activatePendingInvites(user);

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const name = z.string().min(1).parse(req.body.name);
    req.user.name = name.trim();
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid input' });
    }
    next(err);
  }
});

router.post('/push-token', requireAuth, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'token required' });
    }
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { expoPushTokens: token },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
