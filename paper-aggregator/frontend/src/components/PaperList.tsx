import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Paper, PaginationInfo } from '../types';
import { papers as papersApi, recommendations } from '../api';
import { PaperItem } from './PaperItem';
import { Pagination } from './Pagination';
import { useAuth } from '../AuthContext';

export function PaperList() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [recommendedPapers, setRecommendedPapers] = useState<Paper[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Responsive sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTagsCollapsed, setIsTagsCollapsed] = useState(false);
  const [isRecsCollapsed, setIsRecsCollapsed] = useState(false);

  const selectedTag = searchParams.get('tag') || undefined;
  const sortBy = searchParams.get('sort') || 'new';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = 30;

  useEffect(() => {
    loadPapers();
    loadTags();
    loadRecommendations();
  }, [selectedTag, sortBy, isAuthenticated, currentPage]);

  const loadPapers = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await papersApi.getAll({
        tag: selectedTag,
        sort: sortBy,
        limit: itemsPerPage,
        offset
      });
      setPapers(response.data.papers);
      setPagination(response.data.pagination);
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
      params.delete('page'); // Reset to page 1
      return params;
    });
    // Close sidebar on mobile after selecting a tag
    setIsSidebarOpen(false);
  };

  const handlePageChange = (page: number) => {
    setSearchParams(params => {
      params.set('page', page.toString());
      return params;
    });
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Mobile sidebar toggle button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed bottom-20 right-4 z-40 bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 transition-colors"
          aria-label="Toggle filters"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isSidebarOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            )}
          </svg>
        </button>

        {/* Sidebar - responsive */}
        {/* Mobile backdrop */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar container */}
        <div className="lg:w-56 lg:flex-shrink-0">
          <div
            className={`
              fixed lg:static top-0 left-0 bottom-0 z-40 lg:z-auto
              w-80 max-w-[85vw] lg:w-full
              bg-gray-50 lg:bg-transparent
              p-4 lg:p-0
              transition-transform duration-300 ease-in-out lg:transition-none
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              overflow-y-auto lg:overflow-visible
            `}
          >
            {/* Close button for mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10"
              aria-label="Close sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-4">

              {/* Tag Filter */}
              <div className="bg-white rounded border border-gray-300 shadow-sm">
                <button
                  onClick={() => setIsTagsCollapsed(!isTagsCollapsed)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-bold text-sm">Filter by tag:</h3>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                      isTagsCollapsed ? '-rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {!isTagsCollapsed && (
                  <div className="px-3 pb-3 space-y-1 text-sm max-h-64 overflow-y-auto">
                    <button
                      onClick={() => handleTagFilter(null)}
                      className={`block w-full text-left px-2 py-1 rounded transition-colors ${
                        !selectedTag ? 'bg-orange-100 font-semibold' : 'hover:bg-gray-100'
                      }`}
                    >
                      All
                    </button>
                    {tags.map((tag) => (
                      <button
                        key={tag.name}
                        onClick={() => handleTagFilter(tag.name)}
                        className={`block w-full text-left px-2 py-1 rounded transition-colors ${
                          selectedTag === tag.name ? 'bg-orange-100 font-semibold' : 'hover:bg-gray-100'
                        }`}
                      >
                        {tag.name} ({tag.count})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommended Papers */}
              {recommendedPapers.length > 0 && (
                <div className="bg-white rounded border border-gray-300 shadow-sm">
                  <button
                    onClick={() => setIsRecsCollapsed(!isRecsCollapsed)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-bold text-sm">
                      {isAuthenticated ? 'Recommended for you' : 'Popular papers'}
                    </h3>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                        isRecsCollapsed ? '-rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {!isRecsCollapsed && (
                    <div className="px-3 pb-3 space-y-3 text-sm max-h-96 overflow-y-auto">
                      {recommendedPapers.map((paper) => (
                        <div key={paper.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-900 hover:text-orange-600 line-clamp-2 block transition-colors"
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
                              onClick={() => setIsSidebarOpen(false)}
                            >
                              {paper.submitter_username}
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded border border-gray-300 shadow-sm">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading papers...</div>
            ) : papers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No papers found. Be the first to submit one!
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-200">
                  {papers.map((paper) => (
                    <div key={paper.id} className="px-2 sm:px-4">
                      <PaperItem paper={paper} onVoteChange={handleVoteChange} />
                    </div>
                  ))}
                </div>
                {pagination && (
                  <div className="px-2 sm:px-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(pagination.total / pagination.limit)}
                      onPageChange={handlePageChange}
                      totalItems={pagination.total}
                      itemsPerPage={pagination.limit}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
