import cron from 'node-cron';
import { Post } from '../models/Post.js';
import { Project } from '../models/Project.js';
import { Membership } from '../models/Membership.js';
import { ReminderLog } from '../models/ReminderLog.js';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { sendReminderEmail } from '../services/email.js';
import { sendPushNotifications } from '../services/push.js';

export function startReminderJob() {
  cron.schedule('* * * * *', async () => {
    try {
      await runReminders();
    } catch (err) {
      console.error('Reminder job failed', err);
    }
  });
  console.log('Reminder cron started (every minute)');
}

async function runReminders() {
  const windowMin = config.reminderWindowMinutes;
  const now = Date.now();
  const from = new Date(now + (windowMin - 1) * 60 * 1000);
  const to = new Date(now + (windowMin + 1) * 60 * 1000);

  const posts = await Post.find({
    status: { $in: ['ready', 'scheduled'] },
    scheduledAt: { $gte: from, $lte: to },
  });

  for (const post of posts) {
    const existing = await ReminderLog.findOne({ postId: post._id });
    if (existing) continue;

    const project = await Project.findById(post.projectId);
    if (!project) continue;

    const channels = [];
    const alertEmails = [...new Set((project.alertEmails || []).map((e) => e.toLowerCase()))];

    for (const email of alertEmails) {
      await sendReminderEmail({
        to: email,
        projectName: project.name,
        postTitle: post.title,
        scheduledAt: post.scheduledAt,
      });
      channels.push(`email:${email}`);
    }

    const members = await Membership.find({ projectId: project._id, status: 'active' }).populate('userId');
    const tokens = [];
    for (const m of members) {
      if (m.userId?.expoPushTokens?.length) {
        tokens.push(...m.userId.expoPushTokens);
      }
    }
    const uniqueTokens = [...new Set(tokens)];
    if (uniqueTokens.length) {
      await sendPushNotifications(uniqueTokens, {
        title: `${project.name}: post soon`,
        body: `"${post.title}" is scheduled in ~${windowMin} minutes`,
        data: { projectId: project._id.toString(), postId: post._id.toString() },
      });
      channels.push('push');
    }

    // Also email active members who aren't already on alert list
    for (const m of members) {
      const email = (m.userId?.email || m.email || '').toLowerCase();
      if (!email || alertEmails.includes(email)) continue;
      await sendReminderEmail({
        to: email,
        projectName: project.name,
        postTitle: post.title,
        scheduledAt: post.scheduledAt,
      });
      channels.push(`email:${email}`);
    }

    await ReminderLog.create({ postId: post._id, channels, sentAt: new Date() });
  }
}
