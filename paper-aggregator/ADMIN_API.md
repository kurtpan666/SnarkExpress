# Admin API Documentation

This document describes the admin endpoints for managing the Snark Express platform.

## Authentication

All admin endpoints require an admin key to be passed in the request headers:

```
X-Admin-Key: your-admin-key-here
```

The admin key is configured in the `.env` file with the `ADMIN_KEY` variable.

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

---

## Future Admin Endpoints (Potential)

- `POST /api/admin/backup` - Create a database backup
- `POST /api/admin/restore` - Restore from backup
- `DELETE /api/admin/paper/:id` - Delete a specific paper
- `PUT /api/admin/user/:id/role` - Change user role
- `GET /api/admin/logs` - View system logs
