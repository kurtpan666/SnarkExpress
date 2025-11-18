import { Router } from 'express';
import db from '../database/db';

const router = Router();

// Badge thresholds
const BADGE_THRESHOLDS = {
  FIRST_POST: 1,
  CONTRIBUTOR: 5,
  ACTIVE_CONTRIBUTOR: 10,
  PROLIFIC_CONTRIBUTOR: 25,
  FIRST_COMMENT: 1,
  COMMENTER: 10,
  ACTIVE_COMMENTER: 50,
  FIRST_VOTE: 1,
  VOTER: 25,
  ACTIVE_VOTER: 100,
  SUPER_VOTER: 500,
};

// Badge type definitions
const BADGE_TYPES = {
  FIRST_POST: { name: 'First Post', description: 'Submitted first paper', icon: '📝' },
  CONTRIBUTOR: { name: 'Contributor', description: 'Submitted 5 papers', icon: '📚' },
  ACTIVE_CONTRIBUTOR: { name: 'Active Contributor', description: 'Submitted 10 papers', icon: '🔥' },
  PROLIFIC_CONTRIBUTOR: { name: 'Prolific Contributor', description: 'Submitted 25 papers', icon: '⭐' },
  FIRST_COMMENT: { name: 'First Comment', description: 'Posted first comment', icon: '💬' },
  COMMENTER: { name: 'Commenter', description: 'Posted 10 comments', icon: '🗣️' },
  ACTIVE_COMMENTER: { name: 'Active Commenter', description: 'Posted 50 comments', icon: '💭' },
  FIRST_VOTE: { name: 'First Vote', description: 'Cast first vote', icon: '👍' },
  VOTER: { name: 'Voter', description: 'Cast 25 votes', icon: '🗳️' },
  ACTIVE_VOTER: { name: 'Active Voter', description: 'Cast 100 votes', icon: '🎯' },
  SUPER_VOTER: { name: 'Super Voter', description: 'Cast 500 votes', icon: '🏆' },
};

// Award badge helper function
function awardBadge(userId: number, badgeType: string) {
  const stmt = db.prepare(`
    INSERT INTO user_badges (user_id, badge_type)
    SELECT ?, ?
    WHERE NOT EXISTS (
      SELECT 1 FROM user_badges
      WHERE user_id = ? AND badge_type = ?
    )
  `);
  stmt.run(userId, badgeType, userId, badgeType);
}

// Check and award badges based on user activity
function checkAndAwardBadges(userId: number, stats: any) {
  // Submission badges
  if (stats.submission_count >= BADGE_THRESHOLDS.PROLIFIC_CONTRIBUTOR) {
    awardBadge(userId, 'PROLIFIC_CONTRIBUTOR');
  } else if (stats.submission_count >= BADGE_THRESHOLDS.ACTIVE_CONTRIBUTOR) {
    awardBadge(userId, 'ACTIVE_CONTRIBUTOR');
  } else if (stats.submission_count >= BADGE_THRESHOLDS.CONTRIBUTOR) {
    awardBadge(userId, 'CONTRIBUTOR');
  } else if (stats.submission_count >= BADGE_THRESHOLDS.FIRST_POST) {
    awardBadge(userId, 'FIRST_POST');
  }

  // Comment badges
  if (stats.comment_count >= BADGE_THRESHOLDS.ACTIVE_COMMENTER) {
    awardBadge(userId, 'ACTIVE_COMMENTER');
  } else if (stats.comment_count >= BADGE_THRESHOLDS.COMMENTER) {
    awardBadge(userId, 'COMMENTER');
  } else if (stats.comment_count >= BADGE_THRESHOLDS.FIRST_COMMENT) {
    awardBadge(userId, 'FIRST_COMMENT');
  }

  // Vote badges
  if (stats.vote_count >= BADGE_THRESHOLDS.SUPER_VOTER) {
    awardBadge(userId, 'SUPER_VOTER');
  } else if (stats.vote_count >= BADGE_THRESHOLDS.ACTIVE_VOTER) {
    awardBadge(userId, 'ACTIVE_VOTER');
  } else if (stats.vote_count >= BADGE_THRESHOLDS.VOTER) {
    awardBadge(userId, 'VOTER');
  } else if (stats.vote_count >= BADGE_THRESHOLDS.FIRST_VOTE) {
    awardBadge(userId, 'FIRST_VOTE');
  }
}

// Get user profile by username
router.get('/:username', (req, res) => {
  try {
    const { username } = req.params;

    // Get user basic info
    const user = db.prepare(`
      SELECT id, username, email, STRFTIME('%Y-%m-%dT%H:%M:%SZ', created_at) as created_at
      FROM users
      WHERE username = ?
    `).get(username) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user statistics
    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM papers WHERE submitter_id = ?) as submission_count,
        (SELECT COUNT(*) FROM comments WHERE user_id = ?) as comment_count,
        (SELECT COUNT(*) FROM votes WHERE user_id = ?) as vote_count,
        (SELECT COALESCE(SUM(vote_count), 0) FROM (
          SELECT p.id, COALESCE(SUM(CASE
            WHEN v.vote_type = 1 THEN 1
            WHEN v.vote_type = -1 THEN -1
            ELSE 0
          END), 0) as vote_count
          FROM papers p
          LEFT JOIN votes v ON p.id = v.paper_id
          WHERE p.submitter_id = ?
          GROUP BY p.id
        )) as total_votes_received
    `).get(user.id, user.id, user.id, user.id);

    // Check and award new badges
    checkAndAwardBadges(user.id, stats);

    // Get user badges
    const badges = db.prepare(`
      SELECT badge_type, earned_at
      FROM user_badges
      WHERE user_id = ?
      ORDER BY earned_at DESC
    `).all(user.id);

    const badgesWithInfo = badges.map((b: any) => ({
      ...b,
      ...BADGE_TYPES[b.badge_type as keyof typeof BADGE_TYPES]
    }));

    res.json({
      user: {
        username: user.username,
        created_at: user.created_at
      },
      stats,
      badges: badgesWithInfo
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's submissions
router.get('/:username/submissions', (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 30;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get user ID
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's submissions with vote counts and tags
    const submissions = db.prepare(`
      SELECT
        p.id,
        p.title,
        p.url,
        p.abstract,
        p.bib_entry,
        p.authors,
        p.published_date,
        p.submitter_id,
        STRFTIME('%Y-%m-%dT%H:%M:%SZ', p.created_at) as created_at,
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
      LIMIT ? OFFSET ?
    `).all(user.id, limit, offset);

    const processedSubmissions = submissions.map((p: any) => ({
      ...p,
      tags: p.tags ? p.tags.split(',') : []
    }));

    res.json(processedSubmissions);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's comments
router.get('/:username/comments', (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 30;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get user ID
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's comments with paper info
    const comments = db.prepare(`
      SELECT
        c.id,
        c.paper_id,
        c.user_id,
        c.parent_id,
        c.content,
        STRFTIME('%Y-%m-%dT%H:%M:%SZ', c.created_at) as created_at,
        p.title as paper_title,
        p.id as paper_id
      FROM comments c
      JOIN papers p ON c.paper_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(user.id, limit, offset);

    res.json(comments);
  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's votes
router.get('/:username/votes', (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 30;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get user ID
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's votes with paper info
    const votes = db.prepare(`
      SELECT
        v.vote_type,
        STRFTIME('%Y-%m-%dT%H:%M:%SZ', v.created_at) as created_at,
        p.id as paper_id,
        p.title as paper_title,
        p.url as paper_url,
        u.username as submitter_username,
        GROUP_CONCAT(t.name) as tags
      FROM votes v
      JOIN papers p ON v.paper_id = p.id
      JOIN users u ON p.submitter_id = u.id
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE v.user_id = ?
      GROUP BY v.id
      ORDER BY v.created_at DESC
      LIMIT ? OFFSET ?
    `).all(user.id, limit, offset);

    const processedVotes = votes.map((v: any) => ({
      ...v,
      tags: v.tags ? v.tags.split(',') : []
    }));

    res.json(processedVotes);
  } catch (error) {
    console.error('Error fetching user votes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
