# Snark Express

A cryptography paper aggregation platform inspired by Hacker News. Optimized for ePrint IACR papers with automatic metadata extraction, BibTeX generation, and LaTeX math rendering.

## Features

- **User Authentication**: Password-based or secp256k1 cryptographic key authentication
- **Paper Submission**: Submit papers by URL (supports ePrint IACR, arXiv, and DOI)
- **Automatic Metadata Extraction**: Extracts title, abstract, authors, and BibTeX entries
- **Math Formula Rendering**: KaTeX-powered LaTeX math rendering
- **Voting & Ranking**: Hacker News-style algorithm (score/age)
- **Comments System**: Nested comments with edit/delete
- **User Profiles**: View submissions, comments, and votes
- **Related Papers**: AI-powered recommendations and network visualization
- **Dark Mode**: Full dark mode support
- **Email Whitelist**: Optional invitation-only registration

## Tech Stack

**Backend**: Node.js, Express, TypeScript, SQLite, JWT

**Frontend**: React 18, TypeScript, Vite, Tailwind CSS, KaTeX

## Quick Start

### One-Command Setup

```bash
./start.sh
```

This will automatically:
- Install all dependencies
- Initialize the database
- Start both backend and frontend servers

Then open http://localhost:3000

### Manual Setup

#### Backend

```bash
cd backend
npm install
cp .env.example .env  # Edit to set your secrets
npm run init-db
npm run migrate
npm run dev
```

Backend runs on http://localhost:3001

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

## Environment Configuration

Edit `backend/.env`:

```env
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
ADMIN_KEY=your-admin-key-change-in-production

# Email whitelist (optional)
# Leave empty for open registration
# Specific emails: user1@example.com,user2@example.com
# Domains: @university.edu,@company.com
ALLOWED_EMAILS=
```

## Usage

### Registration

**Option A: Password Registration**
- Click "register"
- Choose "Password" method
- Enter username, email, password

**Option B: Cryptographic Key Registration** (Recommended)
- Click "register"
- Choose "Cryptographic Key" method
- Click "Generate Key Pair"
- **IMPORTANT**: Save your private key securely!
- No password needed - your private key IS your password

### Login

**Password Login**: Enter username and password

**Private Key Login**:
- Paste your private key (no username needed!)
- System finds your account by your key

### Submit Papers

Best supported sources:
- ePrint IACR: `https://eprint.iacr.org/2025/2097`
- arXiv: `https://arxiv.org/abs/2203.11932`
- DOI: `https://doi.org/10.1145/3548606.3560593`

## Math Formula Support

Abstracts support LaTeX math:
- Inline: `$O(n^2)$` or `\(x^2\)`
- Display: `$$E = mc^2$$` or `\[...\]`

Example: `The prover computes $\pi = g^{r_1} \cdot h^{r_2} \mod p$ in $\mathbb{G}$.`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register (password or public key)
- `POST /api/auth/login` - Login (password or private key)

### Papers
- `GET /api/papers?tag=<tag>&sort=<hot|top|new>` - List papers
- `POST /api/papers` - Submit paper (auth required)
- `POST /api/papers/:id/vote` - Vote (auth required)
- `GET /api/papers/tags` - Get all tags

### Admin
- `POST /api/admin/reset-database` - Reset database (requires admin key)
- `GET /api/admin/stats` - Database statistics (requires admin key)

## Project Structure

```
paper-aggregator/
├── backend/
│   ├── src/
│   │   ├── database/          # SQLite database setup
│   │   ├── middleware/        # JWT authentication
│   │   ├── routes/            # API endpoints
│   │   ├── utils/             # Paper metadata extraction
│   │   └── server.ts          # Express server
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── App.tsx
│   │   ├── api.ts             # API client
│   │   └── types.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── .gitignore
├── start.sh                   # Quick start script
└── README.md
```

## Ranking Algorithm

```
score = (votes + 1) / (age_in_hours + 2)^1.8
```

Balances quality (votes) and recency.

## Cryptographic Key Authentication

Uses secp256k1 elliptic curve (same as Bitcoin):

1. **Registration**: Generate key pair in browser, only public key is stored
2. **Login**: Derive public key from private key, find user by matching
3. **Security**: 256-bit security, never stored on server

**Key Management**: Save your private key securely - if lost, you lose access permanently!

## Production Deployment

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

### Production Checklist

- [ ] Change JWT_SECRET to a secure random value
- [ ] Change ADMIN_KEY to a secure random value
- [ ] Configure ALLOWED_EMAILS for invitation-only registration
- [ ] Use PostgreSQL instead of SQLite for production
- [ ] Set up HTTPS/SSL
- [ ] Configure CORS for your domain
- [ ] Set up automated backups
- [ ] Configure monitoring and logging

## Troubleshooting

### Port Already in Use

```bash
# Kill backend (port 3001)
lsof -ti:3001 | xargs kill -9

# Kill frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

### Database Errors

```bash
cd backend
# Run migrations
npm run migrate

# Or reset completely
rm -rf data/
npm run init-db
```

### Missing Dependencies

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

## License

MIT

## Contributing

Contributions welcome! Please submit a Pull Request.
