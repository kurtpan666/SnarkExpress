import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../api';
import { useAuth } from '../AuthContext';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [usePrivateKey, setUsePrivateKey] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (usePrivateKey) {
        // Login with private key
        const response = await auth.loginWithPrivateKey(username, privateKey);
        login(response.data.user, response.data.token);
        navigate('/');
      } else {
        // Traditional password login
        const response = await auth.login(username, password);
        login(response.data.user, response.data.token);
        navigate('/');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 px-4">
      <div className="bg-white rounded border border-gray-300 p-6">
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Authentication Method Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Login Method</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUsePrivateKey(false)}
              className={`flex-1 py-2 px-4 rounded border ${
                !usePrivateKey
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setUsePrivateKey(true)}
              className={`flex-1 py-2 px-4 rounded border ${
                usePrivateKey
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Private Key
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {!usePrivateKey ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                required={!usePrivateKey}
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Private Key</label>
              <textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                rows={3}
                required={usePrivateKey}
                placeholder="Enter your private key (64 hex characters)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your private key is never stored on our servers
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center">
          Don't have an account?{' '}
          <Link to="/register" className="text-orange-500 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
