import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { papers } from '../api';
import { useAuth } from '../AuthContext';

export function Submit() {
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await papers.submit(url, tagArray);
      navigate('/');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to submit paper');
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
            {error}
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
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="cryptography, zero-knowledge, blockchain"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional. Separate multiple tags with commas.
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
