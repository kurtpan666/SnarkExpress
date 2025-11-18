import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../api';
import { useAuth } from '../AuthContext';
import { generateKeyPair } from '../utils/keyPair';

export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useKeyPair, setUseKeyPair] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKeySaved, setPrivateKeySaved] = useState(false);
  const [keysGenerated, setKeysGenerated] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleGenerateKeyPair = () => {
    try {
      const keyPair = generateKeyPair();
      setPrivateKey(keyPair.privateKey);
      setPublicKey(keyPair.publicKey);
      setKeysGenerated(true);
      setError('');
    } catch (error: any) {
      setError('Failed to generate key pair: ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (useKeyPair) {
        // Register with client-generated public key
        if (!publicKey) {
          throw new Error('Please generate a key pair first');
        }

        // Send username and publicKey to backend (email not required for key-based registration)
        const response = await auth.registerWithKeyPair(username, publicKey);
        const { user, token } = response.data;

        // Show success and navigate
        login(user, token);
        setShowPrivateKey(true);
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

          {!useKeyPair && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                required={!useKeyPair}
              />
            </div>
          )}

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

          {useKeyPair && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Key Pair Generation</label>
              {!keysGenerated ? (
                <button
                  type="button"
                  onClick={handleGenerateKeyPair}
                  className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                  Generate Key Pair
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
                    <p className="font-semibold text-sm mb-1">⚠️ Important: Save Your Private Key!</p>
                    <p className="text-xs">
                      Your private key will be needed to log in. Save it securely before registering.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Public Key:</label>
                    <div className="bg-gray-100 p-2 rounded border border-gray-300 break-all font-mono text-xs">
                      {publicKey}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Private Key (Save This!):</label>
                    <div className="bg-red-50 p-2 rounded border border-red-300 break-all font-mono text-xs">
                      {privateKey}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyPrivateKey}
                      className="flex-1 bg-green-500 text-white py-1 px-2 text-sm rounded hover:bg-green-600"
                    >
                      Copy Private Key
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (privateKey) {
                          const blob = new Blob([privateKey], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${username || 'user'}-private-key.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }
                      }}
                      className="flex-1 bg-blue-500 text-white py-1 px-2 text-sm rounded hover:bg-blue-600"
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setKeysGenerated(false);
                        setPrivateKey(null);
                        setPublicKey(null);
                      }}
                      className="flex-1 bg-gray-500 text-white py-1 px-2 text-sm rounded hover:bg-gray-600"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (useKeyPair && !keysGenerated)}
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
