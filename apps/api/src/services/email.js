import crypto from 'crypto';
import { Resend } from 'resend';
import { config } from '../config/env.js';

let resend = null;
if (config.resendApiKey) {
  resend = new Resend(config.resendApiKey);
}

export function createInviteToken() {
  return crypto.randomBytes(24).toString('hex');
}

export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.log(`[email:dev] to=${to} subject=${subject}`);
    console.log(`[email:dev] body preview: ${html.replace(/<[^>]+>/g, ' ').slice(0, 200)}`);
    return { id: 'dev-log', logged: true };
  }
  return resend.emails.send({
    from: config.emailFrom,
    to,
    subject,
    html,
  });
}

export async function sendInviteEmail({
  to,
  projectName,
  inviterName,
  token,
  role,
  alreadyMember = false,
  projectId,
}) {
  const link = token
    ? `${config.appUrl.replace(/\/$/, '')}/invite/${token}`
    : `${config.appUrl.replace(/\/$/, '')}/(app)/project/${projectId || ''}`;

  if (alreadyMember) {
    return sendEmail({
      to,
      subject: `You've been added to ${projectName}`,
      html: `
        <p>${inviterName} added you to <strong>${projectName}</strong> as <strong>${role}</strong>.</p>
        <p><a href="${config.appUrl}">Open Inn</a> — the project is on your home screen.</p>
      `,
    });
  }

  return sendEmail({
    to,
    subject: `You're invited to ${projectName}`,
    html: `
      <p>${inviterName} invited you to collaborate on <strong>${projectName}</strong> as <strong>${role}</strong>.</p>
      <p><a href="${link}">Accept invite</a></p>
      <p>Sign up or log in with <strong>${to}</strong>, then open the link.</p>
      <p style="color:#666;font-size:12px">Invite link: ${link}</p>
    `,
  });
}

export async function sendReminderEmail({ to, projectName, postTitle, scheduledAt }) {
  const when = new Date(scheduledAt).toLocaleString();
  return sendEmail({
    to,
    subject: `Reminder: "${postTitle}" goes live soon`,
    html: `
      <p>Heads up — <strong>${postTitle}</strong> in <strong>${projectName}</strong> is scheduled for ${when}.</p>
      <p>Open the calendar: <a href="${config.appUrl}">${config.appUrl}</a></p>
    `,
  });
}
