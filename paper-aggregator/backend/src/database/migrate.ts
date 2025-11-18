import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'papers.db');

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.log('No existing database found. Run init.ts first.');
  process.exit(0);
}

const db = new Database(dbPath);

console.log('Starting database migration...');

try {
  // Check if public_key column already exists
  const columns = db.pragma("table_info('users')") as Array<{ name: string }>;
  const hasPublicKey = columns.some((col) => col.name === 'public_key');

  if (!hasPublicKey) {
    console.log('Adding public_key column to users table...');

    // Disable foreign key constraints temporarily
    db.pragma('foreign_keys = OFF');

    // Begin transaction
    db.exec('BEGIN TRANSACTION');

    // SQLite doesn't support ALTER TABLE to modify constraints
    // So we need to recreate the table

    // 1. Create new table with updated schema
    db.exec(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        public_key TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CHECK (password_hash IS NOT NULL OR public_key IS NOT NULL)
      )
    `);

    // 2. Copy data from old table
    db.exec(`
      INSERT INTO users_new (id, username, email, password_hash, created_at)
      SELECT id, username, email, password_hash, created_at
      FROM users
    `);

    // 3. Drop old table
    db.exec('DROP TABLE users');

    // 4. Rename new table
    db.exec('ALTER TABLE users_new RENAME TO users');

    // Commit transaction
    db.exec('COMMIT');

    // Re-enable foreign key constraints
    db.pragma('foreign_keys = ON');

    console.log('Migration completed successfully!');
  } else {
    console.log('Database is already up to date.');
  }

} catch (error) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}

console.log('Migration finished.');
