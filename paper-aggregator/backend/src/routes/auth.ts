import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/db';
import { generateToken } from '../middleware/auth';
import { User } from '../types';

const router = express.Router();

// Email whitelist checker
function isEmailAllowed(email: string): boolean {
  const allowedEmails = process.env.ALLOWED_EMAILS?.trim();

  // If no whitelist configured, allow all emails
  if (!allowedEmails) {
    return true;
  }

  const whitelist = allowedEmails.split(',').map(e => e.trim()).filter(e => e.length > 0);

  // If empty after splitting, allow all
  if (whitelist.length === 0) {
    return true;
  }

  const emailLower = email.toLowerCase();

  for (const entry of whitelist) {
    // Domain whitelist (starts with @)
    if (entry.startsWith('@')) {
      const domain = entry.toLowerCase();
      if (emailLower.endsWith(domain)) {
        return true;
      }
    }
    // Exact email match
    else if (entry.toLowerCase() === emailLower) {
      return true;
    }
  }

  return false;
}

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check email whitelist
    if (!isEmailAllowed(email)) {
      return res.status(403).json({
        error: 'This email is not authorized to register. Please contact the administrator for an invitation.'
      });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(username, email) as User | undefined;

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username, email, passwordHash);

    const userId = result.lastInsertRowid as number;
    const token = generateToken(userId);

    res.status(201).json({
      user: {
        id: userId,
        username,
        email
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ?')
      .get(username) as User | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
