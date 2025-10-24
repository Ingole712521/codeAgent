'use client';

import React, { useState } from 'react';
import SimpleGitHubAuth from './SimpleGitHubAuth';
import SimpleRepositoryList from './SimpleRepositoryList';
import SimpleCodeDiffViewer from './SimpleCodeDiffViewer';
import SimpleGitHubPush from './SimpleGitHubPush';

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

type WorkflowStep = 'auth' | 'repos' | 'code' | 'push';

export default function SimpleGitHubIntegration() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('auth');
  const [token, setToken] = useState('');
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [newCode, setNewCode] = useState('');
  const [commitMessage, setCommitMessage] = useState('');

  const handleAuthSuccess = (authToken: string) => {
    setToken(authToken);
    setCurrentStep('repos');
  };

  const handleRepositorySelect = (repo: Repository) => {
    setSelectedRepository(repo);
    setCurrentStep('code');
  };

  const handleCodeSubmit = (code: string, message: string, filePath: string) => {
    setNewCode(code);
    setCommitMessage(message);
    setSelectedFile(filePath);
    setCurrentStep('push');
  };

  const handlePushComplete = () => {
    setCurrentStep('code');
    setNewCode('');
    setCommitMessage('');
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'repos':
        setCurrentStep('auth');
        break;
      case 'code':
        setCurrentStep('repos');
        break;
      case 'push':
        setCurrentStep('code');
        break;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'auth':
        return 'GitHub Authentication';
      case 'repos':
        return 'Select Repository';
      case 'code':
        return 'Code Editor';
      case 'push':
        return 'Push Changes';
      default:
        return 'GitHub Integration';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'auth':
        return 'Connect to your GitHub account';
      case 'repos':
        return 'Choose a repository to work with';
      case 'code':
        return 'View and edit your code';
      case 'push':
        return 'Push your changes to GitHub';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🐙</span>
              <div>
                <h1 className="text-xl font-bold">{getStepTitle()}</h1>
                <p className="text-gray-600">{getStepDescription()}</p>
              </div>
            </div>
            
            {currentStep !== 'auth' && (
              <button 
                onClick={handleBack}
                className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      {currentStep !== 'auth' && (
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-center space-x-8">
              <div className={`flex items-center ${currentStep === 'repos' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep === 'repos' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  1
                </div>
                <span className="ml-2">Authentication</span>
              </div>
              
              <div className={`flex items-center ${currentStep === 'code' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep === 'code' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
                <span className="ml-2">Repository</span>
              </div>
              
              <div className={`flex items-center ${currentStep === 'push' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep === 'push' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  3
                </div>
                <span className="ml-2">Code Editor</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="py-8">
        {currentStep === 'auth' && (
          <SimpleGitHubAuth onAuthSuccess={handleAuthSuccess} />
        )}

        {currentStep === 'repos' && token && (
          <SimpleRepositoryList 
            token={token} 
            onRepositorySelect={handleRepositorySelect} 
          />
        )}

        {currentStep === 'code' && selectedRepository && (
          <SimpleCodeDiffViewer 
            token={token}
            repository={selectedRepository}
            onCodeSubmit={handleCodeSubmit}
          />
        )}

        {currentStep === 'push' && selectedRepository && newCode && commitMessage && selectedFile && (
          <SimpleGitHubPush
            token={token}
            repository={selectedRepository}
            filePath={selectedFile}
            newCode={newCode}
            commitMessage={commitMessage}
            onComplete={handlePushComplete}
          />
        )}
      </div>
    </div>
  );
}
