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
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthors, setManualAuthors] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [extractionError, setExtractionError] = useState('');
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
    const lastComma = beforeCursor.lastIndexOf(',');

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

  const handleTagKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    setExtractionError('');
    setExistingPaper(null);
    setLoading(true);

    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      if (tagArray.length === 0) {
        setError('At least one tag is required');
        setLoading(false);
        return;
      }

      // If manual title is provided, send it with authors
      const submitData: any = { url, tags: tagArray };
      if (showManualInput && manualTitle.trim()) {
        submitData.title = manualTitle.trim();
        if (manualAuthors.trim()) {
          submitData.authors = manualAuthors.trim();
        }
      }

      await papers.submit(submitData.url, submitData.tags, submitData.title, submitData.authors);
      navigate('/');
    } catch (error: any) {
      // Check if it's extraction failure (422 Unprocessable Entity)
      if (error.response?.status === 422) {
        if (error.response?.data?.canRetry) {
          setExtractionError(error.response.data.message);
          setShowManualInput(true);
        } else if (error.response?.data?.needsAuthors) {
          // Authors extraction failed, show manual input for authors only
          setExtractionError(error.response.data.message);
          setShowManualInput(true);
        } else {
          setError(error.response.data.error || error.response.data.message);
        }
      }
      // Check if it's a duplicate paper error (409 Conflict)
      else if (error.response?.status === 409 && error.response?.data?.existingPaper) {
        setError(error.response.data.error);
        setExistingPaper(error.response.data.existingPaper);
      } else {
        setError(error.response?.data?.error || 'Failed to submit paper');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setExtractionError('');
    setShowManualInput(false);
    setManualTitle('');
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <div className="bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Submit a Paper</h2>
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
            <div className="font-semibold">{error}</div>
            {existingPaper && (
              <div className="mt-2 text-sm">
                <div className="mb-1">
                  <span className="font-medium">Paper: </span>
                  <span>{existingPaper.title}</span>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="text-red-900 dark:text-red-300 underline hover:text-red-800 dark:hover:text-red-200"
                >
                  View the existing submission on the homepage
                </button>
              </div>
            )}
          </div>
        )}
        {extractionError && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded mb-4">
            <div className="font-semibold">Automatic extraction failed</div>
            <div className="text-sm mt-1">{extractionError}</div>
            <div className="mt-3 flex space-x-3">
              <button
                type="button"
                onClick={handleRetry}
                disabled={loading}
                className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700 disabled:bg-gray-400"
              >
                Retry Extraction
              </button>
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600"
              >
                Enter Title Manually
              </button>
            </div>
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
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Paper URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://eprint.iacr.org/2025/2097"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Best optimized for <strong>eprint.iacr.org</strong> papers. Also supports arXiv and DOI links. We'll automatically extract the title, abstract, and BibTeX entry.
            </p>
          </div>
          {showManualInput && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Paper Title (Manual) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Enter paper title manually"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required={showManualInput}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Automatic extraction failed, so please enter the title manually.
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Authors <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualAuthors}
                  onChange={(e) => setManualAuthors(e.target.value)}
                  placeholder="Enter authors (e.g., John Doe, Jane Smith)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required={showManualInput}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter the paper authors separated by commas.
                </p>
              </div>
            </>
          )}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Tags (comma-separated) <span className="text-red-500">*</span>
            </label>
            <input
              ref={tagInputRef}
              type="text"
              value={tags}
              onChange={handleTagChange}
              onClick={handleTagClick}
              onKeyUp={handleTagKeyUp}
              placeholder="cryptography, zero-knowledge, blockchain"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              disabled={loading}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && tagSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-b shadow-lg max-h-40 overflow-y-auto">
                {tagSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-orange-100 dark:hover:bg-orange-900 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Required. Separate multiple tags with commas. Start typing to see suggestions.
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
