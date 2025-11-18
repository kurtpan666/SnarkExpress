import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { papers } from '../api';
import { useAuth } from '../AuthContext';

interface ExistingPaper {
  id: number;
  title: string;
  url: string;
}

export function Submit() {
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [existingPaper, setExistingPaper] = useState<ExistingPaper | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<{ name: string; count: number }[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Load available tags
    const loadTags = async () => {
      try {
        const response = await papers.getTags();
        setAvailableTags(response.data);
      } catch (err) {
        console.error('Error loading tags:', err);
      }
    };
    loadTags();
  }, []);

  useEffect(() => {
    // Get current word being typed
    const beforeCursor = tags.slice(0, cursorPosition);
    const afterCursor = tags.slice(cursorPosition);
    const lastComma = beforeCursor.lastIndexOf(',');
    const nextComma = afterCursor.indexOf(',');

    const currentTag = (lastComma === -1
      ? beforeCursor
      : beforeCursor.slice(lastComma + 1)
    ).trim().toLowerCase();

    if (currentTag.length > 0) {
      const matches = availableTags
        .filter(tag => tag.name.toLowerCase().startsWith(currentTag))
        .map(tag => tag.name)
        .slice(0, 5);

      setTagSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [tags, cursorPosition, availableTags]);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTags(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  const handleTagClick = (e: React.MouseEvent<HTMLInputElement>) => {
    setCursorPosition((e.target as HTMLInputElement).selectionStart || 0);
  };

  const selectSuggestion = (suggestion: string) => {
    const beforeCursor = tags.slice(0, cursorPosition);
    const afterCursor = tags.slice(cursorPosition);
    const lastComma = beforeCursor.lastIndexOf(',');

    const prefix = lastComma === -1 ? '' : beforeCursor.slice(0, lastComma + 1);
    const suffix = afterCursor.indexOf(',') === -1 ? afterCursor : afterCursor.slice(afterCursor.indexOf(','));

    const newTags = prefix + (prefix && !prefix.endsWith(' ') ? ' ' : '') + suggestion + suffix;
    setTags(newTags);
    setShowSuggestions(false);

    // Focus back on input
    setTimeout(() => {
      if (tagInputRef.current) {
        const newPosition = prefix.length + suggestion.length + (prefix ? 1 : 0);
        tagInputRef.current.focus();
        tagInputRef.current.setSelectionRange(newPosition, newPosition);
        setCursorPosition(newPosition);
      }
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setExistingPaper(null);
    setLoading(true);

    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await papers.submit(url, tagArray);
      navigate('/');
    } catch (error: any) {
      // Check if it's a duplicate paper error (409 Conflict)
      if (error.response?.status === 409 && error.response?.data?.existingPaper) {
        setError(error.response.data.error);
        setExistingPaper(error.response.data.existingPaper);
      } else {
        setError(error.response?.data?.error || 'Failed to submit paper');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <div className="bg-white rounded border border-gray-300 p-6">
        <h2 className="text-2xl font-bold mb-4">Submit a Paper</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="font-semibold">{error}</div>
            {existingPaper && (
              <div className="mt-2 text-sm">
                <div className="mb-1">
                  <span className="font-medium">Paper: </span>
                  <span>{existingPaper.title}</span>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="text-red-900 underline hover:text-red-800"
                >
                  View the existing submission on the homepage
                </button>
              </div>
            )}
          </div>
        )}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <div className="font-semibold">Extracting paper metadata...</div>
              <div className="text-sm">This may take 10-30 seconds. We're fetching the title, abstract, authors, and BibTeX citation.</div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Paper URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://eprint.iacr.org/2025/2097"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Best optimized for <strong>eprint.iacr.org</strong> papers. Also supports arXiv and DOI links. We'll automatically extract the title, abstract, and BibTeX entry.
            </p>
          </div>
          <div className="mb-4 relative">
            <label className="block text-sm font-medium mb-2">
              Tags (comma-separated)
            </label>
            <input
              ref={tagInputRef}
              type="text"
              value={tags}
              onChange={handleTagChange}
              onClick={handleTagClick}
              onKeyUp={handleTagClick}
              placeholder="cryptography, zero-knowledge, blockchain"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={loading}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && tagSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b shadow-lg max-h-40 overflow-y-auto">
                {tagSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-orange-100 text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Optional. Separate multiple tags with commas. Start typing to see suggestions.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={loading}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
