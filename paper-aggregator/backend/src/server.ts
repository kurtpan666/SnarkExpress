import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import db from './database/db';
import authRoutes from './routes/auth';
import papersRoutes from './routes/papers';
import adminRoutes from './routes/admin';
import commentsRoutes from './routes/comments';
import usersRoutes from './routes/users';
import feedsRoutes from './routes/feeds';
import searchRoutes from './routes/search';
import recommendationsRoutes from './routes/recommendations';

// Load .env from the backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
console.log('Loading .env from:', path.resolve(__dirname, '../.env'));
console.log('ADMIN_KEY loaded:', process.env.ADMIN_KEY ? `${process.env.ADMIN_KEY.substring(0, 10)}...` : 'NOT FOUND');

// Run database migrations
console.log('Running database migrations...');
try {
  // Check and add columns if they don't exist
  const commentTableInfo = db.prepare("PRAGMA table_info(comments)").all() as any[];
  const hasDeleted = commentTableInfo.some((col: any) => col.name === 'deleted');
  const hasCommentUpdatedAt = commentTableInfo.some((col: any) => col.name === 'updated_at');

  if (!hasDeleted) {
    db.exec('ALTER TABLE comments ADD COLUMN deleted INTEGER DEFAULT 0');
    console.log('Added deleted column to comments table');
  }

  if (!hasCommentUpdatedAt) {
    db.exec('ALTER TABLE comments ADD COLUMN updated_at DATETIME');
    console.log('Added updated_at column to comments table');
  }

  const paperTableInfo = db.prepare("PRAGMA table_info(papers)").all() as any[];
  const hasPaperUpdatedAt = paperTableInfo.some((col: any) => col.name === 'updated_at');

  if (!hasPaperUpdatedAt) {
    db.exec('ALTER TABLE papers ADD COLUMN updated_at DATETIME');
    console.log('Added updated_at column to papers table');
  }

  console.log('Database migrations completed successfully');
} catch (error) {
  console.error('Database migration failed:', error);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/papers', papersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', commentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/feeds', feedsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/recommendations', recommendationsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
