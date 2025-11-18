import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Paper } from '../types';
import { papers as papersApi } from '../api';
import { PaperItem } from './PaperItem';

export function PaperList() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedTag = searchParams.get('tag') || undefined;
  const sortBy = searchParams.get('sort') || 'new';

  useEffect(() => {
    loadPapers();
    loadTags();
  }, [selectedTag, sortBy]);

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
        <div className="w-48 flex-shrink-0">
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
