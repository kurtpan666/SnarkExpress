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
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Paper URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://arxiv.org/abs/2101.12345 or https://doi.org/..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports arXiv, DOI, and other paper URLs. We'll automatically extract the title, abstract, and BibTeX entry.
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
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional. Separate multiple tags with commas.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 disabled:bg-gray-400"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
