'use client';

import React, { useState } from 'react';

interface SimpleGitHubPushProps {
  token: string;
  repository: {
    name: string;
    full_name: string;
    html_url: string;
  };
  filePath: string;
  newCode: string;
  commitMessage: string;
  onComplete: () => void;
}

export default function SimpleGitHubPush({ 
  token, 
  repository, 
  filePath, 
  newCode, 
  commitMessage, 
  onComplete 
}: SimpleGitHubPushProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [commitUrl, setCommitUrl] = useState('');

  const steps = [
    'Get File SHA',
    'Create Commit',
    'Push to GitHub'
  ];

  const pushToGitHub = async () => {
    try {
      setLoading(true);
      setError('');

      // Step 1: Get current file SHA
      setCurrentStep(0);
      const fileResponse = await fetch(
        `https://api.github.com/repos/${repository.full_name}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!fileResponse.ok) {
        throw new Error('Failed to fetch file information');
      }

      const fileData = await fileResponse.json();
      const currentSha = fileData.sha;

      // Step 2: Create commit
      setCurrentStep(1);
      const commitResponse = await fetch(
        `https://api.github.com/repos/${repository.full_name}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: commitMessage,
            content: btoa(newCode), // Base64 encode the content
            sha: currentSha
          })
        }
      );

      if (!commitResponse.ok) {
        const errorData = await commitResponse.json();
        throw new Error(errorData.message || 'Failed to create commit');
      }

      const commitData = await commitResponse.json();

      // Step 3: Success
      setCurrentStep(2);
      setSuccess(true);
      setCommitUrl(commitData.commit.html_url);

    } catch (err: any) {
      setError(err.message || 'Failed to push changes to GitHub');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    setSuccess(false);
    setCurrentStep(0);
    pushToGitHub();
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-6xl text-green-500 mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Successfully Pushed to GitHub!</h2>
          <p className="text-gray-600 mb-6">
            Your changes have been committed to {repository.full_name}
          </p>
          <div className="space-x-4">
            <a
              href={commitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              🐙 View Commit on GitHub
            </a>
            <button
              onClick={onComplete}
              className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Work on Another File
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Push Changes to GitHub</h2>
        <p className="text-gray-600">
          Repository: {repository.full_name} | File: {filePath}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Commit Message:</h4>
            <div className="p-3 bg-gray-50 rounded border">
              <code>{commitMessage}</code>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium">File Path:</h4>
            <div className="p-3 bg-gray-50 rounded border">
              <code>{filePath}</code>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep > index 
                    ? 'bg-green-500 text-white' 
                    : currentStep === index 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > index ? '✓' : index + 1}
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep >= index ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > index ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Push Failed:</strong> {error}
            <button 
              onClick={handleRetry}
              className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Retry
            </button>
          </div>
        )}

        <div className="text-center">
          {!loading && !success && (
            <button
              onClick={pushToGitHub}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              🚀 Push to GitHub
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
