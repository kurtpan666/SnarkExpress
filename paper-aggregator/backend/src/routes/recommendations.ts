import { Router } from 'express';
import db from '../database/db';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get related papers based on shared tags and authors
router.get('/related/:paperId', (req, res) => {
  try {
    const { paperId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get the target paper's tags and authors
    const paper = db.prepare(`
      SELECT p.*, GROUP_CONCAT(DISTINCT t.name) as tags
      FROM papers p
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(paperId) as any;

    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    const paperTags = paper.tags ? paper.tags.split(',') : [];
    const paperAuthors = paper.authors ? paper.authors.split(',').map((a: string) => a.trim()) : [];

    // Find related papers based on tag overlap and author overlap
    const relatedPapers = db.prepare(`
      SELECT
        p.*,
        u.username as submitter_username,
        COALESCE(SUM(CASE
          WHEN v.vote_type = 1 THEN 1
          WHEN v.vote_type = -1 THEN -1
          ELSE 0
        END), 0) as vote_count,
        GROUP_CONCAT(DISTINCT t.name) as tags,
        0 as relevance_score
      FROM papers p
      LEFT JOIN users u ON p.submitter_id = u.id
      LEFT JOIN votes v ON p.id = v.paper_id
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.id != ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `).all(paperId);

    // Calculate relevance scores
    const scoredPapers = relatedPapers.map((rp: any) => {
      let score = 0;
      const relatedTags = rp.tags ? rp.tags.split(',') : [];
      const relatedAuthors = rp.authors ? rp.authors.split(',').map((a: string) => a.trim()) : [];

      // Tag overlap (each shared tag adds 10 points)
      const sharedTags = paperTags.filter((tag: string) => relatedTags.includes(tag));
      score += sharedTags.length * 10;

      // Author overlap (each shared author adds 20 points)
      const sharedAuthors = paperAuthors.filter((author: string) =>
        relatedAuthors.some((ra: string) => ra.toLowerCase().includes(author.toLowerCase()) ||
                                            author.toLowerCase().includes(ra.toLowerCase()))
      );
      score += sharedAuthors.length * 20;

      // Recency bonus (newer papers get slight preference)
      const daysOld = (Date.now() - new Date(rp.created_at).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 5 - daysOld / 30); // Up to 5 points for very recent papers

      // Vote count bonus
      score += Math.min(rp.vote_count * 0.5, 10); // Up to 10 points from votes

      return {
        ...rp,
        relevance_score: score,
        shared_tags: sharedTags,
        shared_authors: sharedAuthors
      };
    });

    // Sort by relevance and filter out papers with zero relevance
    const filteredPapers = scoredPapers
      .filter((p: any) => p.relevance_score > 0)
      .sort((a: any, b: any) => b.relevance_score - a.relevance_score)
      .slice(0, limit);

    const processedPapers = filteredPapers.map((p: any) => ({
      ...p,
      tags: p.tags ? p.tags.split(',') : []
    }));

    res.json(processedPapers);
  } catch (error) {
    console.error('Error fetching related papers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get paper network data for graph visualization
router.get('/network/:paperId', (req, res) => {
  try {
    const { paperId } = req.params;
    const depth = parseInt(req.query.depth as string) || 1; // How many levels deep to go

    // Get the target paper
    const targetPaper = db.prepare(`
      SELECT p.*, GROUP_CONCAT(DISTINCT t.name) as tags
      FROM papers p
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(paperId) as any;

    if (!targetPaper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    // Get related papers
    const relatedPapers = db.prepare(`
      SELECT
        p.id,
        p.title,
        p.url,
        p.created_at,
        GROUP_CONCAT(DISTINCT t.name) as tags,
        p.authors
      FROM papers p
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.id IN (
        SELECT DISTINCT p2.id
        FROM papers p2
        JOIN paper_tags pt2 ON p2.id = pt2.paper_id
        WHERE pt2.tag_id IN (
          SELECT tag_id FROM paper_tags WHERE paper_id = ?
        )
        AND p2.id != ?
      )
      GROUP BY p.id
      LIMIT 20
    `).all(paperId, paperId);

    const targetTags = targetPaper.tags ? targetPaper.tags.split(',') : [];

    // Build nodes and edges for graph
    const nodes = [
      {
        id: targetPaper.id.toString(),
        label: targetPaper.title,
        url: targetPaper.url,
        tags: targetTags,
        isTarget: true
      },
      ...relatedPapers.map((p: any) => ({
        id: p.id.toString(),
        label: p.title,
        url: p.url,
        tags: p.tags ? p.tags.split(',') : [],
        isTarget: false
      }))
    ];

    const edges: any[] = [];

    // Create edges based on shared tags
    relatedPapers.forEach((rp: any) => {
      const relatedTags = rp.tags ? rp.tags.split(',') : [];
      const sharedTags = targetTags.filter((tag: string) => relatedTags.includes(tag));

      if (sharedTags.length > 0) {
        edges.push({
          from: targetPaper.id.toString(),
          to: rp.id.toString(),
          label: sharedTags.join(', '),
          weight: sharedTags.length
        });
      }

      // Also check for author overlap
      if (targetPaper.authors && rp.authors) {
        const targetAuthors = targetPaper.authors.split(',').map((a: string) => a.trim());
        const relatedAuthors = rp.authors.split(',').map((a: string) => a.trim());
        const sharedAuthors = targetAuthors.filter((author: string) =>
          relatedAuthors.some((ra: string) => ra.toLowerCase().includes(author.toLowerCase()) ||
                                              author.toLowerCase().includes(ra.toLowerCase()))
        );

        if (sharedAuthors.length > 0) {
          // Update edge or add new one with author info
          const existingEdge = edges.find(e => e.from === targetPaper.id.toString() && e.to === rp.id.toString());
          if (existingEdge) {
            existingEdge.label += ' | Authors: ' + sharedAuthors.join(', ');
            existingEdge.weight += sharedAuthors.length * 2;
          } else {
            edges.push({
              from: targetPaper.id.toString(),
              to: rp.id.toString(),
              label: 'Authors: ' + sharedAuthors.join(', '),
              weight: sharedAuthors.length * 2
            });
          }
        }
      }
    });

    res.json({ nodes, edges });
  } catch (error) {
    console.error('Error fetching paper network:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get personalized recommendations for authenticated user
router.get('/personalized', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      // For non-authenticated users, return top papers
      const topPapers = db.prepare(`
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
        GROUP BY p.id
        ORDER BY vote_count DESC, p.created_at DESC
        LIMIT ?
      `).all(limit);

      return res.json(topPapers.map((p: any) => ({
        ...p,
        tags: p.tags ? p.tags.split(',') : []
      })));
    }

    // Get user's voting history to understand preferences
    const userVotedPapers = db.prepare(`
      SELECT p.id, GROUP_CONCAT(DISTINCT t.name) as tags, p.authors
      FROM papers p
      JOIN votes v ON p.id = v.paper_id
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE v.user_id = ? AND v.vote_type = 1
      GROUP BY p.id
    `).all(userId);

    // Extract preferred tags and authors
    const preferredTags = new Map<string, number>();
    const preferredAuthors = new Set<string>();

    userVotedPapers.forEach((p: any) => {
      if (p.tags) {
        p.tags.split(',').forEach((tag: string) => {
          preferredTags.set(tag, (preferredTags.get(tag) || 0) + 1);
        });
      }
      if (p.authors) {
        p.authors.split(',').forEach((author: string) => {
          preferredAuthors.add(author.trim().toLowerCase());
        });
      }
    });

    // Get papers the user hasn't voted on yet
    const candidatePapers = db.prepare(`
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
      WHERE p.id NOT IN (
        SELECT paper_id FROM votes WHERE user_id = ?
      )
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `).all(userId);

    // Score each candidate paper
    const scoredPapers = candidatePapers.map((p: any) => {
      let score = 0;
      const paperTags = p.tags ? p.tags.split(',') : [];

      // Tag preference score
      paperTags.forEach((tag: string) => {
        score += (preferredTags.get(tag) || 0) * 5;
      });

      // Author preference score
      if (p.authors) {
        const paperAuthors = p.authors.split(',').map((a: string) => a.trim().toLowerCase());
        paperAuthors.forEach((author: string) => {
          if (Array.from(preferredAuthors).some(pref => author.includes(pref) || pref.includes(author))) {
            score += 15;
          }
        });
      }

      // Recency and popularity
      const daysOld = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 10 - daysOld / 7); // Recency bonus
      score += Math.min(p.vote_count * 0.5, 10); // Vote bonus

      return { ...p, recommendation_score: score };
    });

    // Sort by score and return top recommendations
    const recommendations = scoredPapers
      .sort((a: any, b: any) => b.recommendation_score - a.recommendation_score)
      .slice(0, limit);

    res.json(recommendations.map((p: any) => ({
      ...p,
      tags: p.tags ? p.tags.split(',') : []
    })));
  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
