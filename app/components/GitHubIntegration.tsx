'use client';

import React, { useState } from 'react';
import { Card, Typography, Button, Steps } from 'antd';
import { GithubOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import GitHubAuth from './GitHubAuth';
import RepositoryList from './RepositoryList';
import CodeDiffViewer from './CodeDiffViewer';
import GitHubPush from './GitHubPush';

const { Title, Text } = Typography;
const { Step } = Steps;

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

export default function GitHubIntegration() {
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
              <GithubOutlined className="text-2xl text-gray-600" />
              <div>
                <Title level={3} className="mb-0">{getStepTitle()}</Title>
                <Text type="secondary">{getStepDescription()}</Text>
              </div>
            </div>
            
            {currentStep !== 'auth' && (
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={handleBack}
                className="flex items-center"
              >
                Back
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      {currentStep !== 'auth' && (
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <Steps current={currentStep === 'repos' ? 0 : currentStep === 'code' ? 1 : 2}>
              <Step title="Authentication" description="GitHub token verified" />
              <Step title="Repository" description={selectedRepository ? selectedRepository.name : 'Select repository'} />
              <Step title="Code Editor" description="Edit your code" />
              <Step title="Push Changes" description="Commit to GitHub" />
            </Steps>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="py-8">
        {currentStep === 'auth' && (
          <GitHubAuth onAuthSuccess={handleAuthSuccess} />
        )}

        {currentStep === 'repos' && token && (
          <RepositoryList 
            token={token} 
            onRepositorySelect={handleRepositorySelect} 
          />
        )}

        {currentStep === 'code' && selectedRepository && (
          <CodeDiffViewer 
            token={token}
            repository={selectedRepository}
            onCodeSubmit={handleCodeSubmit}
          />
        )}

        {currentStep === 'push' && selectedRepository && newCode && commitMessage && selectedFile && (
          <GitHubPush
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
