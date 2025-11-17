# Admin CLI Tool

The Admin CLI provides a user-friendly command-line interface for managing the Snark Express platform.

## Features

1. **View Database Statistics** - Get counts of users, papers, votes, and tags
2. **Reset Database** - Completely reset the database (warning: deletes all data!)
3. **View Recent Papers** - Display the 10 most recently submitted papers
4. **View Configuration** - Display current .env configuration (with masked sensitive values)
5. **Generate Secure Admin Key** - Create a cryptographically secure admin key
6. **Backup Database** - Create a timestamped backup of the database
7. **Test Admin API** - Run diagnostic tests on the admin API endpoints
8. **Configure Email Whitelist** - Configure email domain restrictions (future feature)

## Quick Start

### Prerequisites

1. Make sure the backend server is running:
   ```bash
   cd paper-aggregator/backend
   npm run dev
   ```

2. In a separate terminal, run the admin CLI:
   ```bash
   cd paper-aggregator/backend
   npm run admin
   ```

## Usage

The CLI will display an interactive menu:

```
=========================================
Snark Express - Admin Mode
=========================================

1. View Database Statistics
2. Reset Database (WARNING: Deletes all data!)
3. View Recent Papers
4. View Configuration (.env)
5. Generate Secure Admin Key
6. Backup Database
7. Test Admin API
8. Configure Email Whitelist
9. Exit Admin Mode

Choose an option (1-9):
```

Simply enter the number corresponding to the action you want to perform.

## Authentication

The CLI automatically reads the `ADMIN_KEY` from your `.env` file and uses it to authenticate with the admin API endpoints.

### Setting Up the Admin Key

1. **Using the default key** (for development only):
   ```bash
   # .env file
   ADMIN_KEY=admin-secret-key-change-in-production
   ```

2. **Generating a secure key**:
   - Run the admin CLI and choose option 5
   - The CLI will generate a cryptographically secure key
   - Choose 'yes' to automatically save it to your .env file
   - Restart the backend server for changes to take effect

## Common Tasks

### Resetting the Database for Testing

1. Run `npm run admin`
2. Choose option 2 (Reset Database)
3. Type 'yes' to confirm
4. The database will be reset to an empty state

### Checking Database Statistics

1. Run `npm run admin`
2. Choose option 1 (View Database Statistics)
3. View counts of users, papers, votes, and tags

### Creating a Database Backup

1. Run `npm run admin`
2. Choose option 6 (Backup Database)
3. A timestamped backup will be created in the backend directory

## Troubleshooting

### "Unauthorized. Invalid admin key" Error

This means the ADMIN_KEY in your .env file doesn't match the key expected by the server.

**Solution:**
1. Check that your .env file exists in `paper-aggregator/backend/`
2. Verify that ADMIN_KEY is set in the .env file
3. Restart the backend server after changing the admin key
4. Make sure the admin CLI is reading from the same .env file

### "Server is not responding" Error

The backend server is not running.

**Solution:**
```bash
cd paper-aggregator/backend
npm run dev
```

Then run the admin CLI in a separate terminal.

### "Database file not found" Error

The database hasn't been initialized yet.

**Solution:**
```bash
cd paper-aggregator/backend
npm run init-db
```

## Security Best Practices

1. **Never commit the .env file** - It's already in .gitignore
2. **Change the default admin key in production** - Use option 5 to generate a secure key
3. **Restrict access to the admin CLI** - Only run on trusted machines
4. **Use HTTPS in production** - Prevent admin key interception
5. **Rotate admin keys regularly** - Generate new keys periodically

## Technical Details

The admin CLI communicates with the backend server via HTTP requests to the admin API endpoints:

- `GET /api/admin/stats` - Database statistics
- `POST /api/admin/reset-database` - Reset database

All requests include the `X-Admin-Key` header for authentication.

## Future Enhancements

- Export database to JSON/CSV
- Import data from files
- User management (view, edit, delete users)
- Paper moderation tools
- System health monitoring
- Automated backup scheduling
