import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { search as searchApi } from '../api';
import { Paper, PaginationInfo } from '../types';
import { Pagination } from '../components/Pagination';

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [abstractQuery, setAbstractQuery] = useState('');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState<string>('relevance');
  const [results, setResults] = useState<Paper[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = 4;

  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch({ q: initialQuery });
    }
  }, []);

  const performSearch = async (params?: any, page: number = currentPage) => {
    try {
      setLoading(true);
      const offset = (page - 1) * itemsPerPage;
      const searchParams = params || {
        q: query || undefined,
        title: title || undefined,
        author: author || undefined,
        abstract: abstractQuery || undefined,
        tag: tag || undefined,
        sort,
      };

      const response = await searchApi.search({
        ...searchParams,
        limit: itemsPerPage,
        offset
      });
      setResults(response.data.papers);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query, page: '1' });
    performSearch({ q: query, sort }, 1);
  };

  const handleAdvancedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(params => {
      params.set('page', '1');
      return params;
    });
    performSearch(undefined, 1);
  };

  const handlePageChange = (page: number) => {
    setSearchParams(params => {
      params.set('page', page.toString());
      return params;
    });
    performSearch(undefined, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow p-3 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Search Papers</h1>

          {/* Quick Search */}
          <form onSubmit={handleQuickSearch} className="mb-3 sm:mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search papers, authors..."
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </form>

          {/* Advanced Search Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-orange-600 hover:underline text-xs sm:text-sm mb-3 sm:mb-4 flex items-center gap-1"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showAdvanced ? 'Hide' : 'Show'} Advanced Search
          </button>

          {/* Advanced Search Form */}
          {showAdvanced && (
            <form onSubmit={handleAdvancedSearch} className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Search in paper titles"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Search by author name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Abstract
                </label>
                <input
                  type="text"
                  value={abstractQuery}
                  onChange={(e) => setAbstractQuery(e.target.value)}
                  placeholder="Search in abstracts"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Tag
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Filter by tag"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="votes">Votes</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 text-sm sm:text-base bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Search with Filters
              </button>
            </form>
          )}
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          {loading ? (
            <p className="text-gray-600 text-center py-8 text-sm">Searching...</p>
          ) : results.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">
              {query || title || author || abstractQuery || tag
                ? 'No results found'
                : 'Enter a search query to get started'}
            </p>
          ) : (
            <div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm">
                Found {pagination?.total || results.length} result{(pagination?.total || results.length) !== 1 ? 's' : ''}
              </p>
              <div className="space-y-3 sm:space-y-4">
                {results.map((paper) => (
                  <div key={paper.id} className="border-b border-gray-200 pb-3 sm:pb-4 last:border-b-0">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="text-gray-600 font-semibold min-w-[2.5rem] sm:min-w-[3rem] text-center flex-shrink-0">
                        <div className="text-orange-600 text-sm sm:text-base">{paper.vote_count}</div>
                        <div className="text-[10px] sm:text-xs">points</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm sm:text-lg text-gray-900">
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-orange-600 break-words"
                          >
                            {paper.title}
                          </a>
                        </h3>
                        {paper.authors && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                            <span className="font-medium">Authors:</span> {paper.authors}
                          </p>
                        )}
                        {paper.abstract && (
                          <p className="text-xs sm:text-sm text-gray-700 mt-2 line-clamp-2">
                            {paper.abstract}
                          </p>
                        )}
                        <div className="text-xs sm:text-sm text-gray-600 mt-2 flex items-center gap-1 sm:gap-2 flex-wrap">
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
                          <span className="truncate max-w-[150px] sm:max-w-none">
                            by{' '}
                            <Link
                              to={`/user/${paper.submitter_username}`}
                              className="text-orange-600 hover:underline"
                            >
                              {paper.submitter_username}
                            </Link>
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="whitespace-nowrap">{formatRelativeTime(paper.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {pagination && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(pagination.total / pagination.limit)}
                  onPageChange={handlePageChange}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
