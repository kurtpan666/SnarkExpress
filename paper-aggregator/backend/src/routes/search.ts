import { Router } from 'express';
import db from '../database/db';

const router = Router();

// Advanced search endpoint
router.get('/', (req, res) => {
  try {
    const {
      q,           // General query
      title,       // Title search
      author,      // Author search
      abstract: abstractQuery,   // Abstract search
      tag,         // Tag filter
      sort = 'relevance',  // Sort by: relevance, date, votes
      limit = 30,
      offset = 0
    } = req.query;

    let query = `
      SELECT
        p.*,
        u.username as submitter_username,
        COALESCE(SUM(CASE
          WHEN v.vote_type = 1 THEN 1
          WHEN v.vote_type = -1 THEN -1
          ELSE 0
        END), 0) as vote_count,
        GROUP_CONCAT(DISTINCT t.name) as tags
      FROM papers p
      LEFT JOIN users u ON p.submitter_id = u.id
      LEFT JOIN votes v ON p.id = v.paper_id
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    // General query searches across title, abstract, and authors
    if (q) {
      conditions.push('(p.title LIKE ? OR p.abstract LIKE ? OR p.authors LIKE ?)');
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Specific field searches
    if (title) {
      conditions.push('p.title LIKE ?');
      params.push(`%${title}%`);
    }

    if (author) {
      conditions.push('p.authors LIKE ?');
      params.push(`%${author}%`);
    }

    if (abstractQuery) {
      conditions.push('p.abstract LIKE ?');
      params.push(`%${abstractQuery}%`);
    }

    // Tag filter
    if (tag) {
      conditions.push(`p.id IN (
        SELECT paper_id FROM paper_tags
        JOIN tags ON paper_tags.tag_id = tags.id
        WHERE tags.name = ?
      )`);
      params.push(tag);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY p.id';

    // Sorting
    switch (sort) {
      case 'date':
        query += ' ORDER BY p.created_at DESC';
        break;
      case 'votes':
        query += ' ORDER BY vote_count DESC, p.created_at DESC';
        break;
      case 'relevance':
      default:
        // For relevance, we prioritize exact matches in title
        if (q) {
          query += ` ORDER BY
            CASE
              WHEN p.title LIKE ? THEN 0
              WHEN p.authors LIKE ? THEN 1
              WHEN p.abstract LIKE ? THEN 2
              ELSE 3
            END,
            vote_count DESC,
            p.created_at DESC
          `;
          params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        } else {
          query += ' ORDER BY vote_count DESC, p.created_at DESC';
        }
        break;
    }

    // Get total count first
    let countQuery = `SELECT COUNT(DISTINCT p.id) as total FROM papers p`;
    if (tag) {
      countQuery += ` LEFT JOIN paper_tags pt ON p.id = pt.paper_id
                      LEFT JOIN tags t ON pt.tag_id = t.id`;
    }
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const countParams = [...params];
    const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const papers = db.prepare(query).all(...params);

    const processedPapers = papers.map((p: any) => ({
      ...p,
      tags: p.tags ? p.tags.split(',') : []
    }));

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    res.json({
      papers: processedPapers,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total
      }
    });
  } catch (error) {
    console.error('Error searching papers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search suggestions endpoint
router.get('/suggestions', (req, res) => {
  try {
    const { q } = req.query;

    if (!q || (q as string).length < 2) {
      return res.json({ titles: [], authors: [], tags: [] });
    }

    const searchTerm = `%${q}%`;

    // Get title suggestions
    const titles = db.prepare(`
      SELECT DISTINCT title
      FROM papers
      WHERE title LIKE ?
      ORDER BY created_at DESC
      LIMIT 5
    `).all(searchTerm).map((r: any) => r.title);

    // Get author suggestions
    const authors = db.prepare(`
      SELECT DISTINCT authors
      FROM papers
      WHERE authors LIKE ? AND authors IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `).all(searchTerm).map((r: any) => r.authors);

    // Get tag suggestions
    const tags = db.prepare(`
      SELECT name
      FROM tags
      WHERE name LIKE ?
      ORDER BY name
      LIMIT 5
    `).all(searchTerm).map((r: any) => r.name);

    res.json({ titles, authors, tags });
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
