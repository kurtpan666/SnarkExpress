# Paper Aggregator

A paper aggregation platform inspired by Hacker News and zksecurity.xyz. Submit research papers, vote on them, and discover trending papers in your field.

## Features

- **User Authentication**: Register and login with JWT-based authentication
- **Paper Submission**: Submit papers by URL (supports arXiv, DOI, and other academic sources)
- **Automatic Metadata Extraction**: Automatically extracts title, abstract, authors, and BibTeX entries
- **Voting System**: Upvote papers you find interesting
- **Smart Ranking**: Papers ranked using a Hacker News-style algorithm (score/age)
- **Tag System**: Categorize papers with tags and filter by topic
- **Multiple Sort Options**: Sort by hot, top, or new

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- SQLite (better-sqlite3)
- JWT for authentication
- bcryptjs for password hashing
- Axios + Cheerio for metadata extraction

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

## Project Structure

```
paper-aggregator/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── db.ts
│   │   │   └── init.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   └── papers.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── paperExtractor.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Header.tsx
    │   │   ├── PaperItem.tsx
    │   │   └── PaperList.tsx
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   └── Submit.tsx
    │   ├── App.tsx
    │   ├── AuthContext.tsx
    │   ├── api.ts
    │   ├── types.ts
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository** (or navigate to the project folder)

2. **Set up the backend**:

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Initialize the database
npm run init-db

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:3001`

3. **Set up the frontend** (in a new terminal):

```bash
cd frontend
npm install

# Start the frontend development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. **Register an account**: Click "register" in the header
2. **Submit a paper**: Click "submit" and paste a paper URL (arXiv or DOI)
3. **Vote on papers**: Click the upvote arrow on papers you like
4. **Filter by tags**: Use the sidebar to filter papers by topic
5. **Sort papers**: Choose between hot, top, or new sorting

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login

### Papers
- `GET /api/papers?tag=<tag>&sort=<hot|top|new>` - Get papers
- `POST /api/papers` - Submit a paper (requires authentication)
- `POST /api/papers/:id/vote` - Vote on a paper (requires authentication)
- `GET /api/papers/tags` - Get all tags

## Ranking Algorithm

Papers are ranked using a Hacker News-style algorithm:

```
score = (votes + 1) / (age_in_hours + 2)^1.8
```

This ensures that:
- Recent papers with votes appear higher
- Papers gradually decay over time
- A balance between quality (votes) and recency

## Supported Paper Sources

- **arXiv**: Automatically extracts metadata from arXiv API
- **DOI**: Uses CrossRef API for DOI-based papers
- **Generic URLs**: Attempts to extract metadata from meta tags

## Development

### Backend Development

```bash
cd backend
npm run dev  # Uses ts-node for hot reload
```

### Frontend Development

```bash
cd frontend
npm run dev  # Vite dev server with hot reload
```

### Building for Production

**Backend**:
```bash
cd backend
npm run build
npm start
```

**Frontend**:
```bash
cd frontend
npm run build
npm run preview
```

## Environment Variables

Create a `.env` file in the backend directory:

```
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
```

## Future Enhancements

- Comment system
- User profiles
- Email notifications
- RSS feeds
- Advanced search
- Paper recommendations
- Save/bookmark papers
- Admin moderation tools

## License

MIT
