import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmediacalander',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'Inn <onboarding@resend.dev>',
  appUrl: process.env.APP_URL || 'http://localhost:8081',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:8081').split(',').map((s) => s.trim()),
  reminderWindowMinutes: Number(process.env.REMINDER_WINDOW_MINUTES || 30),
};
