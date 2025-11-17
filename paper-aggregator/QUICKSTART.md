# Quick Start Guide

This guide will help you get the Paper Aggregator platform up and running in minutes.

## Method 1: Using the Start Script (Recommended)

```bash
cd paper-aggregator
./start.sh
```

This will automatically:
- Install all dependencies
- Initialize the database
- Start both backend and frontend servers

## Method 2: Manual Setup

### Step 1: Install Backend Dependencies

```bash
cd paper-aggregator/backend
npm install
```

### Step 2: Initialize Database

```bash
npm run init-db
```

### Step 3: Start Backend Server

```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Step 4: Install Frontend Dependencies (in a new terminal)

```bash
cd paper-aggregator/frontend
npm install
```

### Step 5: Start Frontend Server

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## First Steps

1. **Open your browser** and navigate to `http://localhost:3000`

2. **Register an account**:
   - Click "register" in the header
   - Create a username, email, and password
   - You'll be automatically logged in

3. **Submit your first paper**:
   - Click "submit" in the header
   - Paste a paper URL (try an arXiv link like `https://arxiv.org/abs/2101.12345`)
   - Add tags (e.g., "cryptography, zero-knowledge")
   - Click submit

4. **Explore features**:
   - Vote on papers using the upvote arrow
   - Filter by tags in the sidebar
   - Sort by hot, top, or new
   - View paper abstracts and BibTeX entries

## Example Paper URLs to Try

- arXiv: `https://arxiv.org/abs/2203.11932`
- DOI: `https://doi.org/10.1145/3548606.3560593`

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

**Backend (port 3001)**:
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9
```

**Frontend (port 3000)**:
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
```

### Database Errors

If you encounter database errors, reinitialize:

```bash
cd backend
rm -rf data/
npm run init-db
```

### Missing Dependencies

If you see module not found errors:

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Project Structure Overview

```
paper-aggregator/
├── backend/          # Express API server
│   ├── src/
│   │   ├── database/    # SQLite database setup
│   │   ├── middleware/  # Auth middleware
│   │   ├── routes/      # API routes
│   │   ├── utils/       # Paper metadata extraction
│   │   └── server.ts    # Main server file
│   └── data/            # SQLite database (created on init)
│
└── frontend/         # React application
    └── src/
        ├── components/  # React components
        ├── pages/       # Page components
        ├── api.ts       # API client
        └── AuthContext.tsx  # Authentication state
```

## Development Tips

- **Hot Reload**: Both frontend and backend support hot reload
- **API Proxy**: Frontend proxies `/api` requests to backend automatically
- **Database Browser**: Use a SQLite browser to inspect the database at `backend/data/papers.db`
- **Token Storage**: Auth tokens are stored in localStorage

## Next Steps

- Check out the main [README.md](./README.md) for detailed documentation
- Explore the API endpoints
- Customize the ranking algorithm
- Add your own features!

Happy coding! 🚀
