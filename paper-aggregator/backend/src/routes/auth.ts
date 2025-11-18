import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/db';
import { generateToken } from '../middleware/auth';
import { User } from '../types';
import { generateKeyPair, isValidPublicKey, getPublicKeyFromPrivate, isValidPrivateKey } from '../utils/keyPair';

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
    const { username, email, password, useKeyPair } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    // Validate registration mode
    if (useKeyPair && password) {
      return res.status(400).json({
        error: 'Cannot use both password and key pair authentication. Choose one method.'
      });
    }

    if (!useKeyPair && !password) {
      return res.status(400).json({
        error: 'Either password or key pair authentication must be specified'
      });
    }

    if (password && password.length < 6) {
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

    let passwordHash: string | null = null;
    let publicKey: string | null = null;
    let privateKey: string | undefined = undefined;

    if (useKeyPair) {
      // Generate key pair
      const keyPair = generateKeyPair();
      publicKey = keyPair.publicKey;
      privateKey = keyPair.privateKey; // This will be sent to client once, never stored

      // Check if public key already exists (extremely unlikely but good to check)
      const existingKey = db.prepare('SELECT id FROM users WHERE public_key = ?')
        .get(publicKey) as User | undefined;

      if (existingKey) {
        return res.status(500).json({ error: 'Key collision detected. Please try again.' });
      }

      // Insert user with public key
      const result = db.prepare(
        'INSERT INTO users (username, email, public_key) VALUES (?, ?, ?)'
      ).run(username, email, publicKey);

      const userId = result.lastInsertRowid as number;
      const token = generateToken(userId);

      // IMPORTANT: Return the private key to the client (only once!)
      res.status(201).json({
        user: {
          id: userId,
          username,
          email,
          publicKey
        },
        token,
        privateKey, // Client must save this securely
        warning: 'IMPORTANT: Save your private key securely. It cannot be recovered if lost.'
      });
    } else {
      // Traditional password-based registration
      passwordHash = await bcrypt.hash(password, 10);

      // Insert user with password
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
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password, privateKey } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Validate that either password or privateKey is provided, but not both
    if (password && privateKey) {
      return res.status(400).json({
        error: 'Provide either password or private key, not both'
      });
    }

    if (!password && !privateKey) {
      return res.status(400).json({
        error: 'Either password or private key is required'
      });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ?')
      .get(username) as User | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Authentication: Password-based
    if (password) {
      if (!user.password_hash) {
        return res.status(401).json({
          error: 'This account uses key pair authentication. Please log in with your private key.'
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Authentication: Private key-based
    if (privateKey) {
      if (!user.public_key) {
        return res.status(401).json({
          error: 'This account uses password authentication. Please log in with your password.'
        });
      }

      // Validate private key format
      if (!isValidPrivateKey(privateKey)) {
        return res.status(401).json({ error: 'Invalid private key format' });
      }

      // Derive public key from private key
      let derivedPublicKey: string;
      try {
        derivedPublicKey = getPublicKeyFromPrivate(privateKey);
      } catch (error) {
        return res.status(401).json({ error: 'Invalid private key' });
      }

      // Verify that derived public key matches stored public key
      if (derivedPublicKey !== user.public_key) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        publicKey: user.public_key || undefined
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
