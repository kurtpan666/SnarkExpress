import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../api';
import { useAuth } from '../AuthContext';

export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useKeyPair, setUseKeyPair] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKeySaved, setPrivateKeySaved] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (useKeyPair) {
        // Register with key pair
        const response = await auth.registerWithKeyPair(username, email);
        const { user, token, privateKey: generatedPrivateKey } = response.data;

        // Store the private key temporarily to show to user
        if (generatedPrivateKey) {
          setPrivateKey(generatedPrivateKey);
          setShowPrivateKey(true);
          // Don't navigate away yet - user needs to save the private key
          login(user, token);
        } else {
          throw new Error('Failed to generate key pair');
        }
      } else {
        // Traditional password registration
        const response = await auth.register(username, email, password);
        login(response.data.user, response.data.token);
        navigate('/');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrivateKey = () => {
    if (privateKey) {
      navigator.clipboard.writeText(privateKey);
      alert('Private key copied to clipboard!');
    }
  };

  const handleConfirmSaved = () => {
    setPrivateKeySaved(true);
    navigate('/');
  };

  // Show private key modal after key pair registration
  if (showPrivateKey && privateKey) {
    return (
      <div className="max-w-2xl mx-auto mt-8 px-4">
        <div className="bg-white rounded border border-gray-300 p-6">
          <h2 className="text-2xl font-bold mb-4 text-red-600">⚠️ IMPORTANT: Save Your Private Key</h2>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
            <p className="font-semibold mb-2">This is the ONLY time your private key will be shown!</p>
            <p className="text-sm">
              Your private key is like a master password. Save it securely. If you lose it, you will lose access to your account permanently.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Your Private Key:</label>
            <div className="bg-gray-100 p-4 rounded border border-gray-300 break-all font-mono text-sm">
              {privateKey}
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={handleCopyPrivateKey}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={() => {
                const blob = new Blob([privateKey], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${username}-private-key.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              Download as File
            </button>
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={privateKeySaved}
                onChange={(e) => setPrivateKeySaved(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">I have saved my private key securely</span>
            </label>
          </div>

          <button
            onClick={handleConfirmSaved}
            disabled={!privateKeySaved}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Continue to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 px-4">
      <div className="bg-white rounded border border-gray-300 p-6">
        <h2 className="text-2xl font-bold mb-4">Register</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Authentication Method Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Authentication Method</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUseKeyPair(false)}
              className={`flex-1 py-2 px-4 rounded border ${
                !useKeyPair
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setUseKeyPair(true)}
              className={`flex-1 py-2 px-4 rounded border ${
                useKeyPair
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cryptographic Key
            </button>
          </div>
          {useKeyPair && (
            <p className="text-xs text-gray-600 mt-2">
              A secure key pair will be generated for you. You'll need to save your private key.
            </p>
          )}
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

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {!useKeyPair && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                required={!useKeyPair}
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:bg-gray-400"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-500 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
