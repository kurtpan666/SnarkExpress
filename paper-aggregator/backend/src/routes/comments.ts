import { Router, Request, Response } from 'express';
import db from '../database/db';
import { authenticateToken } from '../middleware/auth';
import { Comment } from '../types';

const router = Router();

// Get comments for a paper
router.get('/papers/:paperId/comments', (req: Request, res: Response) => {
  try {
    const paperId = parseInt(req.params.paperId);

    // Get all comments for the paper with user information
    const comments = db.prepare(`
      SELECT
        c.id,
        c.paper_id,
        c.user_id,
        c.parent_id,
        c.content,
        STRFTIME('%Y-%m-%dT%H:%M:%SZ', c.created_at) as created_at,
        u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.paper_id = ?
      ORDER BY c.created_at ASC
    `).all(paperId) as Comment[];

    // Build a nested comment tree
    const commentMap = new Map<number, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create comment objects with replies array
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build the tree structure
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parent_id === null) {
        rootComments.push(commentWithReplies);
      } else {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies!.push(commentWithReplies);
        }
      }
    });

    res.json(rootComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create a new comment
router.post('/papers/:paperId/comments', authenticateToken, (req: Request, res: Response) => {
  try {
    const paperId = parseInt(req.params.paperId);
    const { content, parent_id } = req.body;
    const userId = (req as any).userId;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Verify paper exists
    const paper = db.prepare('SELECT id FROM papers WHERE id = ?').get(paperId);
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    // If parent_id is provided, verify it exists and belongs to the same paper
    if (parent_id) {
      const parentComment = db.prepare(
        'SELECT id, paper_id FROM comments WHERE id = ?'
      ).get(parent_id) as any;

      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }

      if (parentComment.paper_id !== paperId) {
        return res.status(400).json({ error: 'Parent comment does not belong to this paper' });
      }
    }

    // Insert the comment
    const result = db.prepare(`
      INSERT INTO comments (paper_id, user_id, parent_id, content)
      VALUES (?, ?, ?, ?)
    `).run(paperId, userId, parent_id || null, content.trim());

    // Fetch the created comment with user information
    const comment = db.prepare(`
      SELECT
        c.id,
        c.paper_id,
        c.user_id,
        c.parent_id,
        c.content,
        STRFTIME('%Y-%m-%dT%H:%M:%SZ', c.created_at) as created_at,
        u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid) as Comment;

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

export default router;
