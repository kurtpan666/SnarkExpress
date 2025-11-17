# Admin API & Configuration Guide

This comprehensive guide covers all administrative operations for the Snark Express platform, including API endpoints, configuration management, and common maintenance tasks.

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [Email Whitelist Management](#email-whitelist-management)
4. [Database Management](#database-management)
5. [Common Administrative Tasks](#common-administrative-tasks)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Authentication

All admin endpoints require an admin key to be passed in the request headers:

```
X-Admin-Key: your-admin-key-here
```

The admin key is configured in the `backend/.env` file with the `ADMIN_KEY` variable.

### Setting Up Admin Authentication

1. Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` and set a secure admin key:
```env
ADMIN_KEY=your-very-secure-random-key-here-change-this
```

3. Restart the backend server for changes to take effect:
```bash
npm run dev
```

**⚠️ Security Warning**: The default key (`admin-secret-key-change-in-production`) is for development only. **Always change it in production!**

## Endpoints

### 1. Reset Database

**POST** `/api/admin/reset-database`

Completely resets the database by dropping and recreating all tables. **This will delete all data!**

**Headers:**
```
X-Admin-Key: snark-express-admin-key-2025
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Database has been reset successfully. All data has been cleared.",
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:3001/api/admin/reset-database \
  -H "X-Admin-Key: snark-express-admin-key-2025" \
  -H "Content-Type: application/json"
```

**Example using fetch (JavaScript):**
```javascript
fetch('http://localhost:3001/api/admin/reset-database', {
  method: 'POST',
  headers: {
    'X-Admin-Key': 'snark-express-admin-key-2025',
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

### 2. Get Database Statistics

**GET** `/api/admin/stats`

Returns statistics about the current state of the database.

**Headers:**
```
X-Admin-Key: snark-express-admin-key-2025
```

**Response (200 OK):**
```json
{
  "users": 5,
  "papers": 23,
  "votes": 47,
  "tags": 8,
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

**Example using curl:**
```bash
curl http://localhost:3001/api/admin/stats \
  -H "X-Admin-Key: snark-express-admin-key-2025"
```

---

## Error Responses

### Unauthorized (403)

If the admin key is missing or incorrect:

```json
{
  "error": "Unauthorized. Invalid admin key."
}
```

### Server Error (500)

If an error occurs during the operation:

```json
{
  "error": "Failed to reset database"
}
```

---

## Security Notes

1. **Never commit the actual admin key to version control**
2. **Change the default admin key in production**
3. **Use HTTPS in production** to prevent key interception
4. **Restrict admin endpoint access** at the network level if possible
5. **Monitor admin API usage** for unauthorized access attempts

---

## Configuration

Set the admin key in `backend/.env`:

```env
ADMIN_KEY=your-secure-admin-key-here
```

Default value (for development only):
```
ADMIN_KEY=snark-express-admin-key-2025
```

---

## Email Whitelist Management

Control who can register on your platform using email whitelisting.

### Configuration

Edit `backend/.env`:

```env
# Allow all emails (open registration) - DEFAULT
ALLOWED_EMAILS=

# Allow specific emails only
ALLOWED_EMAILS=alice@example.com,bob@example.com,charlie@university.edu

# Allow entire domains
ALLOWED_EMAILS=@university.edu,@company.com,@research.org

# Mixed mode (specific emails + domains)
ALLOWED_EMAILS=alice@gmail.com,bob@outlook.com,@mit.edu,@stanford.edu
```

### How It Works

**Domain Whitelisting** (entries starting with `@`):
- `@university.edu` allows: `student@university.edu`, `prof@cs.university.edu`, etc.
- Case-insensitive matching
- Matches any email ending with the domain

**Email Whitelisting** (exact matches):
- `alice@example.com` allows only this specific email
- Case-insensitive matching

### Testing Email Whitelist

1. **Set up whitelist**:
```bash
# In backend/.env
ALLOWED_EMAILS=test@example.com,@university.edu
```

2. **Restart backend**:
```bash
cd backend
npm run dev
```

3. **Test registration**:
- ✅ `test@example.com` - Allowed (exact match)
- ✅ `student@university.edu` - Allowed (domain match)
- ❌ `other@gmail.com` - Rejected (not whitelisted)

### Disabling Whitelist

To allow anyone to register, use one of these methods:

```env
# Method 1: Leave empty
ALLOWED_EMAILS=

# Method 2: Comment out
# ALLOWED_EMAILS=@example.com

# Method 3: Remove the line entirely
```

Restart backend after any `.env` changes!

---

## Database Management

### Direct Database Access

The SQLite database is located at `backend/data/database.sqlite`.

**Using SQLite CLI**:
```bash
cd backend/data
sqlite3 database.sqlite

# List all tables
.tables

# View users
SELECT * FROM users;

# View papers with vote counts
SELECT
  p.id, p.title, p.url, u.username,
  COUNT(v.id) as vote_count
FROM papers p
LEFT JOIN users u ON p.submitter_id = u.id
LEFT JOIN votes v ON p.id = v.paper_id
GROUP BY p.id
ORDER BY vote_count DESC;

# Exit
.exit
```

### Database Schema

**Tables**:
- `users` - User accounts (id, username, email, password_hash, created_at)
- `papers` - Submitted papers (id, title, url, abstract, bib_entry, authors, published_date, submitter_id, created_at)
- `tags` - Paper tags (id, name, created_at)
- `paper_tags` - Many-to-many relationship (paper_id, tag_id)
- `votes` - User votes on papers (id, user_id, paper_id, vote_type, created_at)

**Key Features**:
- URL deduplication prevents duplicate paper submissions
- Vote types: +1 (upvote), -1 (downvote)
- Cascading deletes maintain referential integrity

### Backup & Restore

**Manual Backup**:
```bash
cd backend/data
cp database.sqlite database.backup.$(date +%Y%m%d_%H%M%S).sqlite
```

**Automated Backup Script**:
```bash
#!/bin/bash
# Save as: backend/scripts/backup.sh

BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp data/database.sqlite "$BACKUP_DIR/database.$TIMESTAMP.sqlite"
echo "Backup created: $BACKUP_DIR/database.$TIMESTAMP.sqlite"

# Keep only last 30 backups
ls -t $BACKUP_DIR/database.*.sqlite | tail -n +31 | xargs -r rm
```

**Restore from Backup**:
```bash
cd backend

# Stop the server first!
# Then restore
cp data/database.backup.20250117_143000.sqlite data/database.sqlite

# Restart server
npm run dev
```

---

## Common Administrative Tasks

### 1. Add a Test User Manually

```bash
cd backend
node -e "
const bcrypt = require('bcryptjs');
const db = require('./dist/database/db').default;

const username = 'testuser';
const email = 'test@example.com';
const password = 'password123';

bcrypt.hash(password, 10).then(hash => {
  db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(username, email, hash);
  console.log('User created:', username);
});
"
```

### 2. Find Duplicate Papers

```bash
sqlite3 backend/data/database.sqlite "
SELECT url, COUNT(*) as count
FROM papers
GROUP BY url
HAVING count > 1;
"
```

### 3. Delete a Specific Paper

```bash
# Find the paper ID first
sqlite3 backend/data/database.sqlite "
SELECT id, title FROM papers WHERE title LIKE '%keyword%';
"

# Delete by ID (cascading delete will remove votes and tags)
sqlite3 backend/data/database.sqlite "
DELETE FROM papers WHERE id = 123;
"
```

### 4. List Most Active Users

```bash
sqlite3 backend/data/database.sqlite "
SELECT
  u.username,
  u.email,
  COUNT(DISTINCT p.id) as papers_submitted,
  COUNT(DISTINCT v.id) as votes_cast
FROM users u
LEFT JOIN papers p ON u.id = p.submitter_id
LEFT JOIN votes v ON u.id = v.user_id
GROUP BY u.id
ORDER BY papers_submitted DESC, votes_cast DESC
LIMIT 10;
"
```

### 5. Export Papers to CSV

```bash
sqlite3 -header -csv backend/data/database.sqlite \
  "SELECT p.title, p.url, p.authors, u.username as submitter, p.created_at
   FROM papers p
   LEFT JOIN users u ON p.submitter_id = u.id
   ORDER BY p.created_at DESC;" > papers_export.csv
```

### 6. Clean Up Orphaned Tags

```bash
sqlite3 backend/data/database.sqlite "
DELETE FROM tags
WHERE id NOT IN (SELECT DISTINCT tag_id FROM paper_tags);
"
```

### 7. Change Admin Key Without Restarting

While not recommended for production, you can update the `.env` file and the server will use the new key for new requests:

```bash
# Edit .env
nano backend/.env

# Change ADMIN_KEY value
# Save and exit

# Verify it works
curl http://localhost:3001/api/admin/stats \
  -H "X-Admin-Key: your-new-admin-key"
```

**Note**: For production, always restart the server after changing configuration.

---

## Monitoring & Maintenance

### Health Check Endpoint

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

### Regular Monitoring Tasks

**1. Check Database Size**:
```bash
du -h backend/data/database.sqlite
```

**2. Monitor Database Growth**:
```bash
sqlite3 backend/data/database.sqlite "
SELECT
  'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Papers', COUNT(*) FROM papers
UNION ALL
SELECT 'Votes', COUNT(*) FROM votes
UNION ALL
SELECT 'Tags', COUNT(*) FROM tags;
"
```

**3. View Recent Activity**:
```bash
sqlite3 backend/data/database.sqlite "
SELECT
  'Recent Papers' as type,
  title as description,
  created_at
FROM papers
ORDER BY created_at DESC
LIMIT 5;
"
```

### Automated Monitoring Script

Save as `backend/scripts/monitor.sh`:

```bash
#!/bin/bash
ADMIN_KEY="your-admin-key-here"

echo "=== Snark Express Health Check ==="
echo "Timestamp: $(date)"
echo ""

# API Health
echo "API Status:"
curl -s http://localhost:3001/api/health | jq .
echo ""

# Database Stats
echo "Database Statistics:"
curl -s http://localhost:3001/api/admin/stats \
  -H "X-Admin-Key: $ADMIN_KEY" | jq .
echo ""

# Database Size
echo "Database Size:"
du -h backend/data/database.sqlite
echo ""

# Disk Space
echo "Disk Space:"
df -h . | tail -1
```

Run it:
```bash
chmod +x backend/scripts/monitor.sh
./backend/scripts/monitor.sh
```

---

## Security Best Practices

### 1. Admin Key Security

✅ **DO**:
- Use a strong, random admin key (32+ characters)
- Store admin key in `.env` file (not committed to git)
- Use different keys for development and production
- Rotate keys periodically (quarterly recommended)
- Use HTTPS in production to prevent key interception

❌ **DON'T**:
- Hardcode admin keys in source code
- Share admin keys via email or chat
- Use simple, guessable keys
- Commit `.env` file to version control
- Reuse keys across different environments

**Generate a secure admin key**:
```bash
# macOS/Linux
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Email Whitelist Security

- Review whitelist regularly to remove departed users
- Use domain whitelisting for organizations
- Log registration attempts for security auditing
- Consider implementing invitation codes for higher security

### 3. Database Security

- Keep regular backups (automated daily recommended)
- Restrict file system access to database file
- Monitor for unusual query patterns
- Implement rate limiting on API endpoints

### 4. Production Checklist

Before deploying to production:

```bash
# 1. Change all secrets
grep -r "change-in-production" backend/.env
# Should return nothing!

# 2. Verify HTTPS is enabled
# Check your reverse proxy configuration (nginx/Apache)

# 3. Set up automated backups
crontab -e
# Add: 0 2 * * * /path/to/backup.sh

# 4. Enable firewall rules
# Only allow necessary ports (80, 443)

# 5. Set up monitoring
# Configure alerts for API errors
```

---

## Troubleshooting

### Problem: "Unauthorized. Invalid admin key"

**Solution**:
1. Check `.env` file exists and contains `ADMIN_KEY`
2. Verify no extra spaces: `ADMIN_KEY=key` not `ADMIN_KEY = key`
3. Restart backend after changing `.env`
4. Verify header format: `-H "X-Admin-Key: your-key"`

```bash
# Debug: Print your admin key (BE CAREFUL!)
cd backend
grep ADMIN_KEY .env

# Test with exact key from .env
ADMIN_KEY=$(grep ADMIN_KEY .env | cut -d '=' -f2)
curl http://localhost:3001/api/admin/stats -H "X-Admin-Key: $ADMIN_KEY"
```

### Problem: Database Locked

**Solution**:
```bash
# Stop all processes accessing the database
pkill -f "node.*server"

# If still locked, check for lock files
cd backend/data
rm -f database.sqlite-shm database.sqlite-wal

# Restart server
cd ..
npm run dev
```

### Problem: Email Whitelist Not Working

**Solution**:
```bash
# 1. Verify .env configuration
cd backend
cat .env | grep ALLOWED_EMAILS

# 2. Check for common errors
# ❌ WRONG: ALLOWED_EMAILS = user@example.com (space before =)
# ✅ RIGHT: ALLOWED_EMAILS=user@example.com

# 3. Verify server restarted after changes
# Stop server and restart:
npm run dev

# 4. Test registration with curl
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

### Problem: Duplicate Papers Getting Through

**Solution**:
```bash
# This should be prevented by the duplicate check, but if you see duplicates:

# 1. Find duplicates
sqlite3 backend/data/database.sqlite "
SELECT url, COUNT(*) as count, GROUP_CONCAT(id) as paper_ids
FROM papers
GROUP BY REPLACE(REPLACE(url, 'http://', ''), 'https://', '')
HAVING count > 1;
"

# 2. Remove duplicates (keep oldest)
# Manual process - review each case before deleting
```

### Problem: High Database Size

**Solution**:
```bash
# 1. Check what's using space
sqlite3 backend/data/database.sqlite "
SELECT
  'papers.abstract' as field,
  AVG(LENGTH(abstract)) as avg_length,
  MAX(LENGTH(abstract)) as max_length,
  SUM(LENGTH(abstract)) / 1024.0 / 1024.0 as total_mb
FROM papers;
"

# 2. Optimize database
sqlite3 backend/data/database.sqlite "VACUUM;"

# 3. Clean up old data (if needed)
sqlite3 backend/data/database.sqlite "
DELETE FROM papers WHERE created_at < date('now', '-1 year');
"
```

### Problem: Performance Degradation

**Solution**:
```bash
# 1. Rebuild indexes
sqlite3 backend/data/database.sqlite "
REINDEX;
"

# 2. Update statistics
sqlite3 backend/data/database.sqlite "
ANALYZE;
"

# 3. Check for slow queries
# Enable query logging in development
```

---

## Advanced Configuration

### Environment Variables Reference

Complete list of available environment variables:

```env
# Server Configuration
PORT=3001                    # Backend server port (default: 3001)

# Security
JWT_SECRET=your-jwt-secret   # Secret for JWT token signing (REQUIRED)
ADMIN_KEY=your-admin-key     # Admin API authentication key (REQUIRED)

# Email Whitelist
ALLOWED_EMAILS=              # Comma-separated emails/domains (optional)
                             # Empty = open registration
                             # Examples:
                             #   user@example.com,admin@test.com
                             #   @university.edu,@company.com
                             #   mixed@example.com,@domain.edu
```

### Production Deployment Example

**Using PM2** (Process Manager):

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
npm run build
pm2 start dist/server.js --name snark-express-backend

# Start frontend (serve built files)
cd ../frontend
npm run build
pm2 serve dist 3000 --name snark-express-frontend --spa

# Save PM2 configuration
pm2 save
pm2 startup
```

**Using systemd** (Linux):

```bash
# Create service file: /etc/systemd/system/snark-express.service
[Unit]
Description=Snark Express Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/snark-express/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable snark-express
sudo systemctl start snark-express
sudo systemctl status snark-express
```

---

## Use Cases

### Testing & Development

Reset the database to start with a clean slate:

```bash
curl -X POST http://localhost:3001/api/admin/reset-database \
  -H "X-Admin-Key: snark-express-admin-key-2025"
```

### Monitoring

Check database statistics:

```bash
curl http://localhost:3001/api/admin/stats \
  -H "X-Admin-Key: snark-express-admin-key-2025"
```

### Production Maintenance

Weekly backup routine:
```bash
# Backup database
./scripts/backup.sh

# Check stats
curl http://localhost:3001/api/admin/stats \
  -H "X-Admin-Key: $PRODUCTION_ADMIN_KEY"

# Verify backup
ls -lh backups/
```

---

## Future Admin Endpoints (Planned)

We're planning to add these admin endpoints in future versions:

- `POST /api/admin/backup` - Create a database backup
- `POST /api/admin/restore` - Restore from backup
- `DELETE /api/admin/paper/:id` - Delete a specific paper
- `DELETE /api/admin/user/:id` - Delete a user account
- `PUT /api/admin/user/:id/role` - Change user role (for future RBAC)
- `GET /api/admin/logs` - View system logs
- `GET /api/admin/papers/duplicates` - Find potential duplicate papers
- `POST /api/admin/email/invite` - Send invitation emails
- `GET /api/admin/reports/activity` - Generate activity reports

**Want to contribute?** These endpoints would be great additions! See our contributing guidelines.
