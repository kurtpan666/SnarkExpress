import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Paper } from '../types';
import { papers as papersApi } from '../api';
import { useAuth } from '../AuthContext';
import { MathText } from './MathText';
import { Comments } from './Comments';
import { RelatedPapers } from './RelatedPapers';

interface PaperItemProps {
  paper: Paper;
  onVoteChange: (paperId: number, voteCount: number, userVote: number | null) => void;
}

export function PaperItem({ paper, onVoteChange }: PaperItemProps) {
  const { isAuthenticated, user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(paper.title);
  const [editTags, setEditTags] = useState(paper.tags.join(', '));
  const [editAuthors, setEditAuthors] = useState(paper.authors || '');
  const [editAbstract, setEditAbstract] = useState(paper.abstract || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = user && paper.submitter_username === user.username;

  const handleVote = async (vote: number) => {
    if (!isAuthenticated) {
      alert('Please login to vote');
      return;
    }

    try {
      const response = await papersApi.vote(paper.id, vote);
      onVoteChange(paper.id, response.data.vote_count, response.data.user_vote);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

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

    // For dates older than 30 days, show the actual date
    return created.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const copyBibTeX = async () => {
    if (!paper.bib_entry) return;

    try {
      await navigator.clipboard.writeText(paper.bib_entry);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy BibTeX:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this paper? This will also delete all associated comments.')) return;

    setIsDeleting(true);
    try {
      await papersApi.delete(paper.id);
      window.location.reload(); // Reload to update the list
    } catch (error: any) {
      console.error('Error deleting paper:', error);
      alert(error.response?.data?.error || 'Failed to delete paper');
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      alert('Title is required');
      return;
    }

    const tagArray = editTags.split(',').map(t => t.trim()).filter(t => t);
    if (tagArray.length === 0) {
      alert('At least one tag is required');
      return;
    }

    setIsSaving(true);
    try {
      await papersApi.edit(paper.id, {
        title: editTitle,
        tags: tagArray,
        authors: editAuthors || undefined,
        abstract: editAbstract || undefined
      });
      window.location.reload(); // Reload to show updated data
    } catch (error: any) {
      console.error('Error editing paper:', error);
      alert(error.response?.data?.error || 'Failed to edit paper');
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Paper</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Authors</label>
                <input
                  type="text"
                  value={editAuthors}
                  onChange={(e) => setEditAuthors(e.target.value)}
                  placeholder="e.g., John Doe, Jane Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma-separated) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="e.g., cryptography, zero-knowledge"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Abstract</label>
                <textarea
                  value={editAbstract}
                  onChange={(e) => setEditAbstract(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(paper.title);
                    setEditTags(paper.tags.join(', '));
                    setEditAuthors(paper.authors || '');
                    setEditAbstract(paper.abstract || '');
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="py-2 border-b border-gray-200">
        <div className="flex items-start space-x-2">
        <div className="flex flex-col items-center text-gray-600 min-w-[40px]">
          <button
            onClick={() => handleVote(paper.user_vote === 1 ? 0 : 1)}
            className={`text-lg ${paper.user_vote === 1 ? 'text-orange-500' : 'hover:text-orange-500'}`}
            disabled={!isAuthenticated}
          >
            ▲
          </button>
          <span className="text-sm font-semibold">{paper.vote_count}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline">
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:underline text-base"
            >
              {paper.title}
            </a>
            <span className="text-xs text-gray-500 ml-2">
              ({getHostname(paper.url)})
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            <div className="space-x-2">
              <span>by {paper.submitter_username}</span>
              <span>|</span>
              <span>{formatDate(paper.created_at)}</span>
              {paper.updated_at && (
                <span className="text-gray-500 italic">(edited)</span>
              )}
              {(paper.abstract || paper.bib_entry) && (
                <>
                  <span>|</span>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-blue-600 hover:underline"
                  >
                    {showDetails ? 'hide' : 'show'} details
                  </button>
                </>
              )}
              {isAuthenticated && isOwner && (
                <>
                  <span>|</span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:underline"
                  >
                    edit
                  </button>
                  <span>|</span>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-600 hover:underline disabled:text-gray-400"
                  >
                    {isDeleting ? 'deleting...' : 'delete'}
                  </button>
                </>
              )}
            </div>
            {paper.authors && (
              <div className="mt-1 italic">
                <span className="font-semibold not-italic">Authors:</span> {paper.authors}
              </div>
            )}
            {paper.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {paper.tags.map((tag, index) => (
                  <Link
                    key={index}
                    to={`/?tag=${encodeURIComponent(tag)}`}
                    className="bg-gray-200 px-2 py-0.5 rounded hover:bg-gray-300 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {showDetails && (
            <div className="mt-3 space-y-3">
              <div className="p-3 bg-gray-50 rounded text-sm">
                {paper.abstract && (
                  <div className="mb-3">
                    <h4 className="font-semibold mb-1">Abstract:</h4>
                    <MathText text={paper.abstract} className="text-gray-700 leading-relaxed" />
                  </div>
                )}
                {paper.bib_entry && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">BibTeX:</h4>
                      <button
                        onClick={copyBibTeX}
                        className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
                      >
                        {copied ? '✓ Copied!' : 'Copy BibTeX'}
                      </button>
                    </div>
                    <pre className="bg-white p-2 rounded border border-gray-300 overflow-x-auto text-xs">
                      {paper.bib_entry}
                    </pre>
                  </div>
                )}
                <Comments paperId={paper.id} />
              </div>
              <RelatedPapers paperId={paper.id} />
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
