'use client';

import React, { useState, useEffect } from 'react';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  updated_at: string;
}

interface SimpleRepositoryListProps {
  token: string;
  onRepositorySelect: (repo: Repository) => void;
}

export default function SimpleRepositoryList({ token, onRepositorySelect }: SimpleRepositoryListProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRepositories();
  }, [token]);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const repos = await response.json();
        setRepositories(repos);
      } else {
        setError('Failed to fetch repositories. Please check your token permissions.');
      }
    } catch (err) {
      setError('Failed to connect to GitHub. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button 
          onClick={fetchRepositories}
          className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Select a Repository</h2>
        <p className="text-gray-600">
          Choose a repository to work with. Click on a repository to select it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {repositories.map((repo, index) => (
          <div
            key={repo.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onRepositorySelect(repo)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📁</span>
                <h3 className="font-semibold text-blue-600">{repo.name}</h3>
              </div>
              <span className="text-sm text-gray-500">#{index + 1}</span>
            </div>

            {repo.description && (
              <p className="text-gray-600 text-sm mb-3">
                {repo.description.length > 100 
                  ? `${repo.description.substring(0, 100)}...` 
                  : repo.description
                }
              </p>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span>⭐</span>
                  <span>{repo.stargazers_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>👁️</span>
                  <span>{repo.watchers_count}</span>
                </div>
              </div>
              
              {repo.language && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {repo.language}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Updated {formatDate(repo.updated_at)}
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onRepositorySelect(repo);
              }}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Select Repository
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
