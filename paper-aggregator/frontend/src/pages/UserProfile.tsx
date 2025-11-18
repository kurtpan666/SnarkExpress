import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { users, comments as commentsApi } from '../api';
import { UserProfile as UserProfileType, Paper, Comment, Vote } from '../types';
import { MathText } from '../components/MathText';

type TabType = 'submissions' | 'comments' | 'votes';

interface UserCommentItemProps {
  comment: Comment;
  currentUsername: string;
  onUpdate: () => void;
}

function UserCommentItem({ comment, currentUsername, onUpdate }: UserCommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isDeleted = comment.deleted === 1;

  const formatRelativeTime = (date: string) => {
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

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await commentsApi.edit(comment.paper_id, comment.id, editContent);
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error editing comment:', error);
      alert(error.response?.data?.error || 'Failed to edit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsDeleting(true);
    try {
      await commentsApi.delete(comment.paper_id, comment.id);
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      alert(error.response?.data?.error || 'Failed to delete comment');
      setIsDeleting(false);
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 last:border-b-0">
      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
        On:{' '}
        <Link to={`/?paper=${comment.paper_id}`} className="text-orange-600 dark:text-orange-400 hover:underline break-words">
          {comment.paper_title}
        </Link>{' '}
        - {formatRelativeTime(comment.created_at)}
        {comment.updated_at && !isDeleted && (
          <span className="ml-1 text-gray-500 dark:text-gray-500 italic">(edited)</span>
        )}
        {!isDeleted && (
          <>
            <span className="mx-1">|</span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              edit
            </button>
            <span className="mx-1">|</span>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 dark:text-red-400 hover:underline disabled:text-gray-400"
            >
              {isDeleting ? 'deleting...' : 'delete'}
            </button>
          </>
        )}
      </div>
      {isEditing ? (
        <form onSubmit={handleEdit} className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
            disabled={isSubmitting}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !editContent.trim()}
              className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className={`text-sm sm:text-base ${isDeleted ? 'text-gray-500 dark:text-gray-500 italic' : 'text-gray-900 dark:text-gray-100'} bg-gray-50 dark:bg-gray-800 p-2 sm:p-3 rounded break-words`}>
          <MathText text={comment.content} className="leading-relaxed" />
        </div>
      )}
    </div>
  );
}

export function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [submissions, setSubmissions] = useState<Paper[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('submissions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await users.getProfile(username);
        setProfile(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const loadComments = async () => {
    if (!username) return;
    try {
      const commentsResponse = await users.getComments(username);
      setComments(commentsResponse.data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  useEffect(() => {
    if (!username) return;

    const fetchTabData = async () => {
      try {
        switch (activeTab) {
          case 'submissions':
            const subsResponse = await users.getSubmissions(username);
            setSubmissions(subsResponse.data);
            break;
          case 'comments':
            loadComments();
            break;
          case 'votes':
            const votesResponse = await users.getVotes(username);
            setVotes(votesResponse.data);
            break;
        }
      } catch (err) {
        console.error('Failed to load tab data:', err);
      }
    };

    fetchTabData();
  }, [username, activeTab]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'User not found'}</p>
          <Link to="/" className="text-orange-600 dark:text-orange-400 hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">
              {profile.user.username}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Joined {formatDate(profile.user.created_at)}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {profile.stats.submission_count}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Submissions</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {profile.stats.comment_count}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Comments</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {profile.stats.vote_count}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Votes Cast</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {profile.stats.total_votes_received}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Votes Received</div>
            </div>
          </div>

          {/* Badges */}
          {profile.badges.length > 0 && (
            <div>
              <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-900 dark:text-white">Badges</h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {profile.badges.map((badge, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900 dark:to-orange-950 border border-orange-200 dark:border-orange-700 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 flex items-center space-x-1.5 sm:space-x-2"
                    title={badge.description}
                  >
                    <span className="text-xl sm:text-2xl">{badge.icon}</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-orange-200 text-xs sm:text-sm truncate">
                        {badge.name}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-600 dark:text-orange-300 hidden sm:block">
                        {badge.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <nav className="flex -mb-px min-w-max">
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-3 sm:px-6 py-2 sm:py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'submissions'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="hidden sm:inline">Submissions ({profile.stats.submission_count})</span>
                <span className="sm:hidden">Subs ({profile.stats.submission_count})</span>
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-3 sm:px-6 py-2 sm:py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'comments'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="hidden sm:inline">Comments ({profile.stats.comment_count})</span>
                <span className="sm:hidden">Cmts ({profile.stats.comment_count})</span>
              </button>
              <button
                onClick={() => setActiveTab('votes')}
                className={`px-3 sm:px-6 py-2 sm:py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'votes'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Votes ({profile.stats.vote_count})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-3 sm:p-6">
            {activeTab === 'submissions' && (
              <div className="space-y-3 sm:space-y-4">
                {submissions.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">No submissions yet</p>
                ) : (
                  submissions.map((paper) => (
                    <div key={paper.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 last:border-b-0">
                      <div className="flex items-start space-x-2">
                        <div className="text-gray-600 dark:text-gray-400 font-semibold min-w-[2.5rem] sm:min-w-[3rem] text-center flex-shrink-0">
                          <div className="text-orange-600 dark:text-orange-400 text-sm sm:text-base">{paper.vote_count}</div>
                          <div className="text-[10px] sm:text-xs">points</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            <a
                              href={paper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-orange-600 dark:hover:text-orange-400 break-words"
                            >
                              {paper.title}
                            </a>
                          </h3>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-1">
                            {paper.tags.map((tag) => (
                              <Link
                                key={tag}
                                to={`/?tag=${tag}`}
                                className="inline-block bg-gray-100 dark:bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                              >
                                {tag}
                              </Link>
                            ))}
                            <span className="text-gray-400 dark:text-gray-500">•</span>
                            <span>{formatRelativeTime(paper.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-3 sm:space-y-4">
                {comments.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <UserCommentItem
                      key={comment.id}
                      comment={comment}
                      currentUsername={profile.user.username}
                      onUpdate={loadComments}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'votes' && (
              <div className="space-y-3 sm:space-y-4">
                {votes.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">No votes yet</p>
                ) : (
                  votes.map((vote, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 last:border-b-0">
                      <div className="flex items-start space-x-2">
                        <div
                          className={`text-xl sm:text-2xl flex-shrink-0 ${
                            vote.vote_type === 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {vote.vote_type === 1 ? '↑' : '↓'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            <a
                              href={vote.paper_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-orange-600 dark:hover:text-orange-400 break-words"
                            >
                              {vote.paper_title}
                            </a>
                          </h3>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                            by {vote.submitter_username} - {formatRelativeTime(vote.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
