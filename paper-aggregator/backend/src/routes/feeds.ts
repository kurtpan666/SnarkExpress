import { Router } from 'express';
import db from '../database/db';

const router = Router();

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper function to generate RSS feed
function generateRssFeed(papers: any[], title: string, description: string, link: string): string {
  const items = papers.map((paper: any) => {
    const tags = paper.tags ? paper.tags.split(',') : [];
    const categories = tags.map((tag: string) => `    <category>${escapeXml(tag)}</category>`).join('\n');

    const authors = paper.authors ? `<p><strong>Authors:</strong> ${escapeXml(paper.authors)}</p>` : '';
    const abstract = paper.abstract ? `<p><strong>Abstract:</strong> ${escapeXml(paper.abstract)}</p>` : '';
    const pubDate = paper.published_date ? `<p><strong>Published:</strong> ${escapeXml(paper.published_date)}</p>` : '';

    return `  <item>
    <title>${escapeXml(paper.title)}</title>
    <link>${escapeXml(paper.url)}</link>
    <guid>${escapeXml(paper.url)}</guid>
    <pubDate>${new Date(paper.created_at).toUTCString()}</pubDate>
    <description><![CDATA[
      ${authors}
      ${abstract}
      ${pubDate}
      <p><strong>Submitted by:</strong> ${escapeXml(paper.submitter_username)}</p>
      <p><strong>Votes:</strong> ${paper.vote_count}</p>
    ]]></description>
${categories}
  </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(link)}</link>
    <description>${escapeXml(description)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(link)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

// RSS feed for recent papers
router.get('/recent', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const papers = db.prepare(`
      SELECT
        p.*,
        u.username as submitter_username,
        COALESCE(SUM(CASE
          WHEN v.vote_type = 1 THEN 1
          WHEN v.vote_type = -1 THEN -1
          ELSE 0
        END), 0) as vote_count,
        GROUP_CONCAT(t.name) as tags
      FROM papers p
      LEFT JOIN users u ON p.submitter_id = u.id
      LEFT JOIN votes v ON p.id = v.paper_id
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(limit);

    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const feedXml = generateRssFeed(
      papers,
      'Snark Express - Recent Papers',
      'Latest cryptography papers submitted to Snark Express',
      `${baseUrl}/api/feeds/recent`
    );

    res.set('Content-Type', 'application/rss+xml');
    res.send(feedXml);
  } catch (error) {
    console.error('Error generating recent feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// RSS feed for hot papers
router.get('/hot', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const papers = db.prepare(`
      SELECT
        p.*,
        u.username as submitter_username,
        COALESCE(SUM(CASE
          WHEN v.vote_type = 1 THEN 1
          WHEN v.vote_type = -1 THEN -1
          ELSE 0
        END), 0) as vote_count,
        GROUP_CONCAT(t.name) as tags,
        (COALESCE(SUM(CASE
          WHEN v.vote_type = 1 THEN 1
          WHEN v.vote_type = -1 THEN -1
          ELSE 0
        END), 0) + 1) / POWER((JULIANDAY('now') - JULIANDAY(p.created_at)) * 24 + 2, 1.8) as hotness
      FROM papers p
      LEFT JOIN users u ON p.submitter_id = u.id
      LEFT JOIN votes v ON p.id = v.paper_id
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      GROUP BY p.id
      ORDER BY hotness DESC, p.created_at DESC
      LIMIT ?
    `).all(limit);

    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const feedXml = generateRssFeed(
      papers,
      'Snark Express - Hot Papers',
      'Trending cryptography papers on Snark Express',
      `${baseUrl}/api/feeds/hot`
    );

    res.set('Content-Type', 'application/rss+xml');
    res.send(feedXml);
  } catch (error) {
    console.error('Error generating hot feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// RSS feed for specific tag
router.get('/tag/:tagName', (req, res) => {
  try {
    const { tagName } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const papers = db.prepare(`
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
      WHERE p.id IN (
        SELECT paper_id FROM paper_tags
        JOIN tags ON paper_tags.tag_id = tags.id
        WHERE tags.name = ?
      )
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(tagName, limit);

    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const feedXml = generateRssFeed(
      papers,
      `Snark Express - ${tagName} Papers`,
      `Latest papers tagged with ${tagName}`,
      `${baseUrl}/api/feeds/tag/${encodeURIComponent(tagName)}`
    );

    res.set('Content-Type', 'application/rss+xml');
    res.send(feedXml);
  } catch (error) {
    console.error('Error generating tag feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// RSS feed for user's submissions
router.get('/user/:username', (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Get user ID
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const papers = db.prepare(`
      SELECT
        p.*,
        u.username as submitter_username,
        COALESCE(SUM(CASE
          WHEN v.vote_type = 1 THEN 1
          WHEN v.vote_type = -1 THEN -1
          ELSE 0
        END), 0) as vote_count,
        GROUP_CONCAT(t.name) as tags
      FROM papers p
      LEFT JOIN users u ON p.submitter_id = u.id
      LEFT JOIN votes v ON p.id = v.paper_id
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.submitter_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(user.id, limit);

    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const feedXml = generateRssFeed(
      papers,
      `Snark Express - ${username}'s Submissions`,
      `Papers submitted by ${username}`,
      `${baseUrl}/api/feeds/user/${encodeURIComponent(username)}`
    );

    res.set('Content-Type', 'application/rss+xml');
    res.send(feedXml);
  } catch (error) {
    console.error('Error generating user feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
