import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Paper } from '../types';
import { papers as papersApi, recommendations } from '../api';
import { PaperItem } from './PaperItem';
import { useAuth } from '../AuthContext';

export function PaperList() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [recommendedPapers, setRecommendedPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const selectedTag = searchParams.get('tag') || undefined;
  const sortBy = searchParams.get('sort') || 'new';

  useEffect(() => {
    loadPapers();
    loadTags();
    loadRecommendations();
  }, [selectedTag, sortBy, isAuthenticated]);

  const loadPapers = async () => {
    try {
      setLoading(true);
      const response = await papersApi.getAll(selectedTag, sortBy);
      setPapers(response.data);
    } catch (error) {
      console.error('Error loading papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await papersApi.getTags();
      setTags(response.data);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await recommendations.getPersonalized(5);
      setRecommendedPapers(response.data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleVoteChange = (paperId: number, voteCount: number, userVote: number | null) => {
    setPapers(papers.map(paper =>
      paper.id === paperId
        ? { ...paper, vote_count: voteCount, user_vote: userVote }
        : paper
    ));
  };

  const handleTagFilter = (tag: string | null) => {
    setSearchParams(params => {
      if (tag) {
        params.set('tag', tag);
      } else {
        params.delete('tag');
      }
      return params;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-4">
          {/* Tag Filter */}
          <div className="bg-white rounded border border-gray-300 p-3">
            <h3 className="font-bold text-sm mb-2">Filter by tag:</h3>
            <div className="space-y-1 text-sm">
              <button
                onClick={() => handleTagFilter(null)}
                className={`block w-full text-left px-2 py-1 rounded ${
                  !selectedTag ? 'bg-orange-100 font-semibold' : 'hover:bg-gray-100'
                }`}
              >
                All
              </button>
              {tags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => handleTagFilter(tag.name)}
                  className={`block w-full text-left px-2 py-1 rounded ${
                    selectedTag === tag.name ? 'bg-orange-100 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  {tag.name} ({tag.count})
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Papers */}
          {recommendedPapers.length > 0 && (
            <div className="bg-white rounded border border-gray-300 p-3">
              <h3 className="font-bold text-sm mb-2">
                {isAuthenticated ? 'Recommended for you' : 'Popular papers'}
              </h3>
              <div className="space-y-3 text-sm">
                {recommendedPapers.map((paper) => (
                  <div key={paper.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-orange-600 line-clamp-2 block"
                      title={paper.title}
                    >
                      {paper.title}
                    </a>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                      <span className="text-orange-600 font-semibold">
                        {paper.vote_count} points
                      </span>
                      <span>•</span>
                      <Link
                        to={`/user/${paper.submitter_username}`}
                        className="hover:underline"
                      >
                        {paper.submitter_username}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="bg-white rounded border border-gray-300">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading papers...</div>
            ) : papers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No papers found. Be the first to submit one!
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {papers.map((paper) => (
                  <div key={paper.id} className="px-4">
                    <PaperItem paper={paper} onVoteChange={handleVoteChange} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
