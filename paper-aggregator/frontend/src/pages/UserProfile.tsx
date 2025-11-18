import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { users } from '../api';
import { UserProfile as UserProfileType, Paper, Comment, Vote } from '../types';

type TabType = 'submissions' | 'comments' | 'votes';

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
            const commentsResponse = await users.getComments(username);
            setComments(commentsResponse.data);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'User not found'}</p>
          <Link to="/" className="text-orange-600 hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
              {profile.user.username}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Joined {formatDate(profile.user.created_at)}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                {profile.stats.submission_count}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Submissions</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                {profile.stats.comment_count}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Comments</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                {profile.stats.vote_count}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Votes Cast</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                {profile.stats.total_votes_received}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Votes Received</div>
            </div>
          </div>

          {/* Badges */}
          {profile.badges.length > 0 && (
            <div>
              <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Badges</h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {profile.badges.map((badge, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 flex items-center space-x-1.5 sm:space-x-2"
                    title={badge.description}
                  >
                    <span className="text-xl sm:text-2xl">{badge.icon}</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                        {badge.name}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-600 hidden sm:block">
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
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex -mb-px min-w-max">
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-3 sm:px-6 py-2 sm:py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'submissions'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Submissions ({profile.stats.submission_count})</span>
                <span className="sm:hidden">Subs ({profile.stats.submission_count})</span>
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-3 sm:px-6 py-2 sm:py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'comments'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Comments ({profile.stats.comment_count})</span>
                <span className="sm:hidden">Cmts ({profile.stats.comment_count})</span>
              </button>
              <button
                onClick={() => setActiveTab('votes')}
                className={`px-3 sm:px-6 py-2 sm:py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'votes'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                  <p className="text-gray-500 text-center py-8 text-sm">No submissions yet</p>
                ) : (
                  submissions.map((paper) => (
                    <div key={paper.id} className="border-b border-gray-200 pb-3 sm:pb-4 last:border-b-0">
                      <div className="flex items-start space-x-2">
                        <div className="text-gray-600 font-semibold min-w-[2.5rem] sm:min-w-[3rem] text-center flex-shrink-0">
                          <div className="text-orange-600 text-sm sm:text-base">{paper.vote_count}</div>
                          <div className="text-[10px] sm:text-xs">points</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                            <a
                              href={paper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-orange-600 break-words"
                            >
                              {paper.title}
                            </a>
                          </h3>
                          <div className="text-xs sm:text-sm text-gray-600 mt-1 flex flex-wrap gap-1">
                            {paper.tags.map((tag) => (
                              <Link
                                key={tag}
                                to={`/?tag=${tag}`}
                                className="inline-block bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded hover:bg-gray-200"
                              >
                                {tag}
                              </Link>
                            ))}
                            <span className="text-gray-400">•</span>
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
                  <p className="text-gray-500 text-center py-8 text-sm">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-200 pb-3 sm:pb-4 last:border-b-0">
                      <div className="text-xs sm:text-sm text-gray-600 mb-2">
                        On:{' '}
                        <Link to={`/?paper=${comment.paper_id}`} className="text-orange-600 hover:underline break-words">
                          {comment.paper_title}
                        </Link>{' '}
                        - {formatRelativeTime(comment.created_at)}
                      </div>
                      <div className="text-sm sm:text-base text-gray-900 bg-gray-50 p-2 sm:p-3 rounded break-words">
                        {comment.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'votes' && (
              <div className="space-y-3 sm:space-y-4">
                {votes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 text-sm">No votes yet</p>
                ) : (
                  votes.map((vote, index) => (
                    <div key={index} className="border-b border-gray-200 pb-3 sm:pb-4 last:border-b-0">
                      <div className="flex items-start space-x-2">
                        <div
                          className={`text-xl sm:text-2xl flex-shrink-0 ${
                            vote.vote_type === 1 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {vote.vote_type === 1 ? '↑' : '↓'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                            <a
                              href={vote.paper_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-orange-600 break-words"
                            >
                              {vote.paper_title}
                            </a>
                          </h3>
                          <div className="text-xs sm:text-sm text-gray-600 mt-1">
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
