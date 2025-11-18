import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { search as searchApi } from '../api';
import { Paper } from '../types';

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [abstractQuery, setAbstractQuery] = useState('');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState<string>('relevance');
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch({ q: initialQuery });
    }
  }, []);

  const performSearch = async (params?: any) => {
    try {
      setLoading(true);
      const searchParams = params || {
        q: query || undefined,
        title: title || undefined,
        author: author || undefined,
        abstract: abstractQuery || undefined,
        tag: tag || undefined,
        sort,
      };

      const response = await searchApi.search(searchParams);
      setResults(response.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
    performSearch({ q: query, sort });
  };

  const handleAdvancedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Search Papers</h1>

          {/* Quick Search */}
          <form onSubmit={handleQuickSearch} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search papers, authors, abstracts..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Search
              </button>
            </div>
          </form>

          {/* Advanced Search Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-orange-600 hover:underline text-sm mb-4"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Search
          </button>

          {/* Advanced Search Form */}
          {showAdvanced && (
            <form onSubmit={handleAdvancedSearch} className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Search in paper titles"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Search by author name"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Abstract
                </label>
                <input
                  type="text"
                  value={abstractQuery}
                  onChange={(e) => setAbstractQuery(e.target.value)}
                  placeholder="Search in abstracts"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tag
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Filter by tag"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="votes">Votes</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Search with Filters
              </button>
            </form>
          )}
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <p className="text-gray-600 text-center py-8">Searching...</p>
          ) : results.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {query || title || author || abstractQuery || tag
                ? 'No results found'
                : 'Enter a search query to get started'}
            </p>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-4">
                {results.map((paper) => (
                  <div key={paper.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <div className="text-gray-600 font-semibold min-w-[3rem] text-center">
                        <div className="text-orange-600">{paper.vote_count}</div>
                        <div className="text-xs">points</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg text-gray-900">
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-orange-600"
                          >
                            {paper.title}
                          </a>
                        </h3>
                        {paper.authors && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Authors:</span> {paper.authors}
                          </p>
                        )}
                        {paper.abstract && (
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                            {paper.abstract}
                          </p>
                        )}
                        <div className="text-sm text-gray-600 mt-2 flex items-center gap-2 flex-wrap">
                          {paper.tags.map((tag) => (
                            <Link
                              key={tag}
                              to={`/?tag=${tag}`}
                              className="inline-block bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200"
                            >
                              {tag}
                            </Link>
                          ))}
                          <span className="text-gray-400">•</span>
                          <span>
                            by{' '}
                            <Link
                              to={`/user/${paper.submitter_username}`}
                              className="text-orange-600 hover:underline"
                            >
                              {paper.submitter_username}
                            </Link>
                          </span>
                          <span className="text-gray-400">•</span>
                          <span>{formatRelativeTime(paper.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
