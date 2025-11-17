import express, { Request, Response } from 'express';
import db from '../database/db';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Middleware to check admin authentication
function authenticateAdmin(req: Request, res: Response, next: express.NextFunction) {
  const ADMIN_KEY = process.env.ADMIN_KEY || 'admin-secret-key-change-in-production';
  const adminKey = req.headers['x-admin-key'];

  console.log('Received admin key:', adminKey);
  console.log('Expected admin key:', ADMIN_KEY);
  console.log('Keys match:', adminKey === ADMIN_KEY);

  if (!adminKey || adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Unauthorized. Invalid admin key.' });
  }

  next();
}

// Reset database endpoint
router.post('/reset-database', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    console.log('Resetting database...');

    // Drop all tables
    db.exec(`
      DROP TABLE IF EXISTS votes;
      DROP TABLE IF EXISTS paper_tags;
      DROP TABLE IF EXISTS tags;
      DROP TABLE IF EXISTS papers;
      DROP TABLE IF EXISTS users;
    `);

    // Recreate all tables
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE papers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        abstract TEXT,
        bib_entry TEXT,
        authors TEXT,
        published_date TEXT,
        submitter_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submitter_id) REFERENCES users(id)
      );

      CREATE TABLE tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE paper_tags (
        paper_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (paper_id, tag_id),
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );

      CREATE TABLE votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        paper_id INTEGER NOT NULL,
        vote_type INTEGER NOT NULL CHECK(vote_type IN (-1, 1)),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, paper_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_papers_created_at ON papers(created_at DESC);
      CREATE INDEX idx_votes_paper_id ON votes(paper_id);
      CREATE INDEX idx_paper_tags_paper_id ON paper_tags(paper_id);
      CREATE INDEX idx_paper_tags_tag_id ON paper_tags(tag_id);
    `);

    console.log('Database reset successfully!');

    res.json({
      success: true,
      message: 'Database has been reset successfully. All data has been cleared.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// Get database stats (for admin monitoring)
router.get('/stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const paperCount = db.prepare('SELECT COUNT(*) as count FROM papers').get() as { count: number };
    const voteCount = db.prepare('SELECT COUNT(*) as count FROM votes').get() as { count: number };
    const tagCount = db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number };

    res.json({
      users: userCount.count,
      papers: paperCount.count,
      votes: voteCount.count,
      tags: tagCount.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
