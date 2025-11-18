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
    const { username, email, password, publicKey } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Validate registration mode
    const isPasswordAuth = password && !publicKey;
    const isKeyPairAuth = publicKey && !password;

    if (password && publicKey) {
      return res.status(400).json({
        error: 'Cannot use both password and key pair authentication. Choose one method.'
      });
    }

    if (!password && !publicKey) {
      return res.status(400).json({
        error: 'Either password or publicKey must be specified'
      });
    }

    // For password-based registration, email is required
    if (isPasswordAuth) {
      if (!email) {
        return res.status(400).json({ error: 'Email is required for password-based registration' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Check email whitelist for password-based registration
      if (!isEmailAllowed(email)) {
        return res.status(403).json({
          error: 'This email is not authorized to register. Please contact the administrator for an invitation.'
        });
      }
    }

    // For key pair registration, validate the public key
    if (isKeyPairAuth) {
      if (!isValidPublicKey(publicKey)) {
        return res.status(400).json({ error: 'Invalid public key format' });
      }

      // Check if public key already exists
      const existingKey = db.prepare('SELECT id FROM users WHERE public_key = ?')
        .get(publicKey) as User | undefined;

      if (existingKey) {
        return res.status(400).json({ error: 'This public key is already registered' });
      }
    }

    // Check if username already exists
    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?')
      .get(username) as User | undefined;

    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // For password-based registration, check if email already exists
    if (isPasswordAuth && email) {
      const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?')
        .get(email) as User | undefined;

      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    let passwordHash: string | null = null;
    let userEmail: string | null = null;
    let userPublicKey: string | null = null;

    if (isKeyPairAuth) {
      // Key pair registration (client-generated keys)
      userPublicKey = publicKey;
      // Generate a unique email for key-based users (database requires non-null email)
      // Use provided email if available, otherwise generate one
      userEmail = email || `${username}@keypair.local`;

      // Insert user with public key only
      const result = db.prepare(
        'INSERT INTO users (username, email, public_key) VALUES (?, ?, ?)'
      ).run(username, userEmail, userPublicKey);

      const userId = result.lastInsertRowid as number;
      const token = generateToken(userId);

      res.status(201).json({
        user: {
          id: userId,
          username,
          email: userEmail,
          publicKey: userPublicKey
        },
        token
      });
    } else if (isPasswordAuth) {
      // Traditional password-based registration
      passwordHash = await bcrypt.hash(password, 10);
      userEmail = email;

      // Insert user with password
      const result = db.prepare(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
      ).run(username, userEmail, passwordHash);

      const userId = result.lastInsertRowid as number;
      const token = generateToken(userId);

      res.status(201).json({
        user: {
          id: userId,
          username,
          email: userEmail
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
