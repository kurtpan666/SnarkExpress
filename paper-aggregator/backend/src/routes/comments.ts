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
        COALESCE(c.deleted, 0) as deleted,
        STRFTIME('%Y-%m-%dT%H:%M:%SZ', c.created_at) as created_at,
        STRFTIME('%Y-%m-%dT%H:%M:%SZ', c.updated_at) as updated_at,
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
        COALESCE(c.deleted, 0) as deleted,
        STRFTIME('%Y-%m-%dT%H:%M:%SZ', c.created_at) as created_at,
        STRFTIME('%Y-%m-%dT%H:%M:%SZ', c.updated_at) as updated_at,
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

// Delete a comment (soft delete if has replies, hard delete otherwise)
router.delete('/papers/:paperId/comments/:commentId', authenticateToken, (req: Request, res: Response) => {
  try {
    const paperId = parseInt(req.params.paperId);
    const commentId = parseInt(req.params.commentId);
    const userId = (req as any).userId;

    // Check if comment exists and user is the author
    const comment = db.prepare('SELECT id, user_id, paper_id FROM comments WHERE id = ?').get(commentId) as any;
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    if (comment.paper_id !== paperId) {
      return res.status(400).json({ error: 'Comment does not belong to this paper' });
    }

    // Check if comment has replies
    const hasReplies = db.prepare('SELECT COUNT(*) as count FROM comments WHERE parent_id = ?').get(commentId) as { count: number };

    if (hasReplies.count > 0) {
      // Soft delete - mark as deleted
      db.prepare('UPDATE comments SET deleted = 1, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run('[deleted by the author]', commentId);
      res.json({ message: 'Comment marked as deleted', soft: true });
    } else {
      // Hard delete - no replies
      db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
      res.json({ message: 'Comment deleted successfully', soft: false });
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Edit a comment
router.patch('/papers/:paperId/comments/:commentId', authenticateToken, (req: Request, res: Response) => {
  try {
    const paperId = parseInt(req.params.paperId);
    const commentId = parseInt(req.params.commentId);
    const { content } = req.body;
    const userId = (req as any).userId;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Check if comment exists and user is the author
    const comment = db.prepare('SELECT id, user_id, paper_id, deleted FROM comments WHERE id = ?').get(commentId) as any;
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    if (comment.paper_id !== paperId) {
      return res.status(400).json({ error: 'Comment does not belong to this paper' });
    }

    if (comment.deleted) {
      return res.status(400).json({ error: 'Cannot edit a deleted comment' });
    }

    // Update comment
    db.prepare('UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(content.trim(), commentId);

    // Fetch updated comment
    const updatedComment = db.prepare(`
      SELECT
        c.id,
        c.paper_id,
        c.user_id,
        c.parent_id,
        c.content,
        c.deleted,
        STRFTIME('%Y-%m-%dT%H:%M:%SZ', c.created_at) as created_at,
        STRFTIME('%Y-%m-%dT%H:%M:%SZ', c.updated_at) as updated_at,
        u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(commentId) as Comment;

    res.json(updatedComment);
  } catch (error) {
    console.error('Error editing comment:', error);
    res.status(500).json({ error: 'Failed to edit comment' });
  }
});

export default router;
