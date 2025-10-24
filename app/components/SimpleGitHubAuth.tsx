'use client';

import React, { useState } from 'react';

interface SimpleGitHubAuthProps {
  onAuthSuccess: (token: string) => void;
}

export default function SimpleGitHubAuth({ onAuthSuccess }: SimpleGitHubAuthProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    if (!token.trim()) {
      setError('Please enter a GitHub token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Test the token by making a simple API call
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        onAuthSuccess(token);
      } else {
        setError('Invalid GitHub token. Please check your token and try again.');
      }
    } catch (err) {
      setError('Failed to authenticate. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🐙</div>
          <h2 className="text-2xl font-bold mb-2">GitHub Authentication</h2>
          <p className="text-gray-600">
            Enter your GitHub Personal Access Token to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Authentication Error:</strong> {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Token:
            </label>
            <input
              type="password"
              placeholder="Enter your GitHub token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
          >
            {loading ? 'Authenticating...' : '🐙 Connect to GitHub'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have a token?{' '}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Create one here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
