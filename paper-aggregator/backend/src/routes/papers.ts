import express, { Response } from 'express';
import db from '../database/db';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';
import { extractPaperMetadata } from '../utils/paperExtractor';
import { Paper } from '../types';

const router = express.Router();

// Get papers with ranking algorithm (Hacker News style)
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { tag, sort = 'hot' } = req.query;
    const userId = req.userId;

    let query = `
      SELECT
        p.*,
        STRFTIME('%Y-%m-%dT%H:%M:%SZ', p.created_at) as created_at,
        u.username as submitter_username,
        (SELECT COALESCE(SUM(CASE WHEN vote_type = 1 THEN 1 WHEN vote_type = -1 THEN -1 ELSE 0 END), 0)
         FROM votes WHERE paper_id = p.id) as vote_count,
        ${userId ? `(SELECT vote_type FROM votes WHERE user_id = ? AND paper_id = p.id) as user_vote,` : ''}
        GROUP_CONCAT(DISTINCT t.name) as tags
      FROM papers p
      LEFT JOIN users u ON p.submitter_id = u.id
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
    `;

    const params: any[] = userId ? [userId] : [];

    if (tag) {
      query += ` WHERE t.name = ?`;
      params.push(tag);
    }

    query += ` GROUP BY p.id`;

    // Sorting algorithm
    if (sort === 'hot') {
      // Hacker News ranking: score / (age + 2)^gravity
      query += ` ORDER BY (vote_count + 1) /
                POWER((JULIANDAY('now') - JULIANDAY(p.created_at)) * 24 + 2, 1.8) DESC`;
    } else if (sort === 'top') {
      // Sort by votes first, then by submission time for papers with same votes
      query += ` ORDER BY vote_count DESC, p.created_at DESC`;
    } else if (sort === 'new') {
      // Sort by submission time, then by votes for papers submitted at same time
      query += ` ORDER BY p.created_at DESC, vote_count DESC`;
    }

    query += ` LIMIT 50`;

    const papers = db.prepare(query).all(...params) as any[];

    // Process tags
    const processedPapers = papers.map(paper => ({
      ...paper,
      tags: paper.tags ? paper.tags.split(',') : [],
      vote_count: Number(paper.vote_count),
      user_vote: paper.user_vote || null
    }));

    res.json(processedPapers);
  } catch (error) {
    console.error('Error fetching papers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit a new paper
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { url, tags, title: manualTitle } = req.body;
    const userId = req.userId!;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Normalize URL for duplicate checking
    // Remove trailing slashes and standardize
    const normalizedUrl = url.trim().replace(/\/+$/, '');

    // Check if URL already exists
    const existingPaper = db.prepare(`
      SELECT id, title, url
      FROM papers
      WHERE REPLACE(url, '/', '') = REPLACE(?, '/', '')
         OR url = ?
         OR REPLACE(REPLACE(url, 'http://', ''), 'https://', '') = REPLACE(REPLACE(?, 'http://', ''), 'https://', '')
    `).get(normalizedUrl, normalizedUrl, normalizedUrl) as { id: number; title: string; url: string } | undefined;

    if (existingPaper) {
      return res.status(409).json({
        error: 'This paper has already been submitted',
        existingPaper: {
          id: existingPaper.id,
          title: existingPaper.title,
          url: existingPaper.url
        }
      });
    }

    // Extract or use manual metadata
    let metadata;
    if (manualTitle) {
      // User provided manual title, skip extraction
      console.log('Using manual title:', manualTitle);
      metadata = {
        title: manualTitle,
        abstract: undefined,
        bib_entry: undefined,
        authors: undefined,
        published_date: undefined
      };
    } else {
      // Extract metadata automatically
      console.log('Extracting metadata from:', url);
      metadata = await extractPaperMetadata(url);
      console.log('Extracted metadata:', {
        title: metadata.title,
        hasAbstract: !!metadata.abstract,
        abstractLength: metadata.abstract?.length || 0,
        hasBibEntry: !!metadata.bib_entry,
        authors: metadata.authors
      });

      // Check if extraction failed
      if (metadata.title === 'Unable to extract title') {
        return res.status(422).json({
          error: 'Unable to extract paper metadata',
          message: 'We could not automatically extract the paper information from this URL. This may happen if the site is slow, unavailable, or uses an unsupported format.',
          url: url,
          canRetry: true
        });
      }
    }

    // Insert paper
    const result = db.prepare(`
      INSERT INTO papers (title, url, abstract, bib_entry, authors, published_date, submitter_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      metadata.title,
      url,
      metadata.abstract || null,
      metadata.bib_entry || null,
      metadata.authors || null,
      metadata.published_date || null,
      userId
    );

    const paperId = result.lastInsertRowid as number;

    // Handle tags
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        const normalizedTag = tagName.toLowerCase().trim();

        // Insert tag if it doesn't exist
        db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(normalizedTag);

        // Get tag id
        const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(normalizedTag) as { id: number };

        // Link paper to tag
        db.prepare('INSERT INTO paper_tags (paper_id, tag_id) VALUES (?, ?)').run(paperId, tag.id);
      }
    }

    // Get the created paper
    const paper = db.prepare(`
      SELECT
        p.*,
        STRFTIME('%Y-%m-%dT%H:%M:%SZ', p.created_at) as created_at,
        u.username as submitter_username,
        0 as vote_count,
        NULL as user_vote,
        GROUP_CONCAT(t.name) as tags
      FROM papers p
      LEFT JOIN users u ON p.submitter_id = u.id
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(paperId) as any;

    paper.tags = paper.tags ? paper.tags.split(',') : [];

    res.status(201).json(paper);
  } catch (error) {
    console.error('Error submitting paper:', error);
    res.status(500).json({ error: 'Failed to submit paper' });
  }
});

// Vote on a paper
router.post('/:id/vote', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const paperId = parseInt(req.params.id);
    const { vote } = req.body; // 1 for upvote, -1 for downvote, 0 to remove vote
    const userId = req.userId!;

    if (![1, -1, 0].includes(vote)) {
      return res.status(400).json({ error: 'Vote must be 1 (upvote), -1 (downvote), or 0 (remove)' });
    }

    // Check if paper exists
    const paper = db.prepare('SELECT id FROM papers WHERE id = ?').get(paperId);
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    if (vote === 0) {
      // Remove vote
      db.prepare('DELETE FROM votes WHERE user_id = ? AND paper_id = ?').run(userId, paperId);
    } else {
      // Insert or update vote
      db.prepare(`
        INSERT INTO votes (user_id, paper_id, vote_type)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, paper_id)
        DO UPDATE SET vote_type = excluded.vote_type
      `).run(userId, paperId, vote);
    }

    // Get updated vote count
    const result = db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN vote_type = 1 THEN 1 WHEN vote_type = -1 THEN -1 ELSE 0 END), 0) as vote_count
      FROM votes
      WHERE paper_id = ?
    `).get(paperId) as { vote_count: number };

    res.json({
      vote_count: result.vote_count,
      user_vote: vote === 0 ? null : vote
    });
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all available tags
router.get('/tags', async (req: AuthRequest, res: Response) => {
  try {
    const tags = db.prepare(`
      SELECT t.name, COUNT(pt.paper_id) as count
      FROM tags t
      LEFT JOIN paper_tags pt ON t.id = pt.tag_id
      GROUP BY t.id
      ORDER BY count DESC, t.name ASC
    `).all();

    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
