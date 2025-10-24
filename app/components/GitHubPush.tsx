'use client';

import React, { useState } from 'react';
import { Card, Typography, Button, Alert, Spin, Steps, Result } from 'antd';
import { CheckCircleOutlined, GithubOutlined, UploadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Step } = Steps;

interface GitHubPushProps {
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

export default function GitHubPush({ 
  token, 
  repository, 
  filePath, 
  newCode, 
  commitMessage, 
  onComplete 
}: GitHubPushProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [commitUrl, setCommitUrl] = useState('');

  const steps = [
    {
      title: 'Get File SHA',
      description: 'Fetching current file information'
    },
    {
      title: 'Create Commit',
      description: 'Creating new commit with changes'
    },
    {
      title: 'Push to GitHub',
      description: 'Pushing changes to repository'
    }
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
        <Result
          icon={<CheckCircleOutlined className="text-green-500" />}
          title="Successfully Pushed to GitHub!"
          subTitle={`Your changes have been committed to ${repository.full_name}`}
          extra={[
            <Button 
              type="primary" 
              key="view"
              href={commitUrl}
              target="_blank"
              rel="noopener noreferrer"
              icon={<GithubOutlined />}
            >
              View Commit on GitHub
            </Button>,
            <Button key="new" onClick={onComplete}>
              Work on Another File
            </Button>
          ]}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-6">
        <Title level={2} className="mb-2">Push Changes to GitHub</Title>
        <Text type="secondary">
          Repository: {repository.full_name} | File: {filePath}
        </Text>
      </div>

      <Card className="mb-6">
        <div className="space-y-4">
          <div>
            <Text strong>Commit Message:</Text>
            <div className="p-3 bg-gray-50 rounded border mt-1">
              <Text code>{commitMessage}</Text>
            </div>
          </div>
          
          <div>
            <Text strong>File Path:</Text>
            <div className="p-3 bg-gray-50 rounded border mt-1">
              <Text code>{filePath}</Text>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Steps current={currentStep} className="mb-6">
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={loading && currentStep === index ? <Spin /> : undefined}
            />
          ))}
        </Steps>

        {error && (
          <Alert
            message="Push Failed"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={handleRetry}>
                Retry
              </Button>
            }
            className="mb-4"
          />
        )}

        <div className="text-center">
          {!loading && !success && (
            <Button
              type="primary"
              size="large"
              onClick={pushToGitHub}
              icon={<UploadOutlined />}
              className="bg-green-600 hover:bg-green-700"
            >
              Push to GitHub
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
