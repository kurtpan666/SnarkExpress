import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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
