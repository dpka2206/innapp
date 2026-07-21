import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from './config/env.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import memberRoutes from './routes/members.js';
import postRoutes from './routes/posts.js';
import inviteRoutes from './routes/invites.js';
import { startReminderJob } from './jobs/reminders.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || config.corsOrigin.includes(origin) || config.corsOrigin.includes('*')) {
        return cb(null, true);
      }
      return cb(null, true); // allow Expo Go / LAN during trial
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/projects/:projectId/members', memberRoutes);
app.use('/projects/:projectId/posts', postRoutes);
app.use('/invites', inviteRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

async function resolveMongoUri() {
  const uri = config.mongoUri || '';
  const isPlaceholder =
    !uri ||
    uri.includes('USER:PASSWORD') ||
    uri.includes('CLUSTER.mongodb.net') ||
    process.env.USE_MEMORY_DB === '1';

  if (!isPlaceholder) return uri;

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  const memoryUri = mongod.getUri('socialmediacalander');
  console.log('Using in-memory MongoDB for local trial (set a real Atlas MONGODB_URI for production)');
  return memoryUri;
}

async function main() {
  const mongoUri = await resolveMongoUri();
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`API listening on http://0.0.0.0:${config.port}`);
  });
  startReminderJob();
}

main().catch((err) => {
  console.error('Failed to start API', err);
  process.exit(1);
});
