import { useState, useEffect } from 'react';
import { Comment } from '../types';
import { comments as commentsApi } from '../api';
import { useAuth } from '../AuthContext';
import { MathText } from './MathText';

interface CommentsProps {
  paperId: number;
}

interface CommentItemProps {
  comment: Comment;
  paperId: number;
  onReply: (parentId: number) => void;
  replyingTo: number | null;
  onCancelReply: () => void;
  onCommentAdded: () => void;
}

function CommentItem({
  comment,
  paperId,
  onReply,
  replyingTo,
  onCancelReply,
  onCommentAdded
}: CommentItemProps) {
  const { isAuthenticated } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffInMs = now.getTime() - created.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      if (diffInMinutes < 1) return 'just now';
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }

    return created.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await commentsApi.create(paperId, replyContent, comment.id);
      setReplyContent('');
      onCancelReply();
      onCommentAdded();
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-2">
      <div className="text-xs text-gray-600">
        <span className="font-semibold">{comment.username}</span>
        <span className="ml-2">{formatDate(comment.created_at)}</span>
        {isAuthenticated && (
          <>
            <span className="mx-1">|</span>
            <button
              onClick={() => onReply(comment.id)}
              className="text-blue-600 hover:underline"
            >
              reply
            </button>
          </>
        )}
      </div>
      <div className="mt-1 text-sm text-gray-800">
        <MathText text={comment.content} className="leading-relaxed" />
      </div>

      {replyingTo === comment.id && (
        <form onSubmit={handleSubmitReply} className="mt-2 ml-4">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply... (supports KaTeX: use $ for inline math, $$ for display math)"
            className="w-full p-2 border border-gray-300 rounded text-sm"
            rows={3}
            disabled={isSubmitting}
          />
          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              disabled={isSubmitting || !replyContent.trim()}
              className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? 'Posting...' : 'Post Reply'}
            </button>
            <button
              type="button"
              onClick={onCancelReply}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 mt-2 border-l-2 border-gray-200 pl-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              paperId={paperId}
              onReply={onReply}
              replyingTo={replyingTo}
              onCancelReply={onCancelReply}
              onCommentAdded={onCommentAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Comments({ paperId }: CommentsProps) {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const loadComments = async () => {
    try {
      const response = await commentsApi.getAll(paperId);
      setComments(response.data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [paperId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await commentsApi.create(paperId, newComment);
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-gray-600 mt-3">Loading comments...</div>;
  }

  return (
    <div className="mt-4 border-t border-gray-300 pt-3">
      <h4 className="font-semibold mb-2 text-sm">Comments</h4>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... (supports KaTeX: use $ for inline math, $$ for display math)"
            className="w-full p-2 border border-gray-300 rounded text-sm"
            rows={3}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="mt-1 px-4 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors disabled:bg-gray-400"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="mb-4 text-sm text-gray-600">
          Please <a href="/login" className="text-blue-600 hover:underline">log in</a> to comment.
        </div>
      )}

      {comments.length === 0 ? (
        <div className="text-sm text-gray-600">No comments yet. Be the first to comment!</div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              paperId={paperId}
              onReply={setReplyingTo}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              onCommentAdded={loadComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
