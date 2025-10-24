'use client';

import React, { useState, useEffect } from 'react';
import { List, Card, Typography, Button, Spin, Alert, Tag } from 'antd';
import { GithubOutlined, StarOutlined, EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

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

interface RepositoryListProps {
  token: string;
  onRepositorySelect: (repo: Repository) => void;
}

export default function RepositoryList({ token, onRepositorySelect }: RepositoryListProps) {
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
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={fetchRepositories}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-6">
        <Title level={2} className="mb-2">Select a Repository</Title>
        <Text type="secondary">
          Choose a repository to work with. Click on a repository to select it.
        </Text>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
        dataSource={repositories}
        renderItem={(repo, index) => (
          <List.Item>
            <Card
              hoverable
              className="h-full cursor-pointer transition-all duration-200 hover:shadow-lg"
              onClick={() => onRepositorySelect(repo)}
              actions={[
                <Button
                  type="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRepositorySelect(repo);
                  }}
                  className="w-full"
                >
                  Select Repository
                </Button>
              ]}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GithubOutlined className="text-gray-600" />
                    <Title level={4} className="mb-0 text-blue-600">
                      {repo.name}
                    </Title>
                  </div>
                  <Text type="secondary" className="text-sm">
                    #{index + 1}
                  </Text>
                </div>

                {repo.description && (
                  <Text type="secondary" className="block">
                    {repo.description.length > 100 
                      ? `${repo.description.substring(0, 100)}...` 
                      : repo.description
                    }
                  </Text>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <StarOutlined className="text-yellow-500" />
                      <Text className="text-sm">{repo.stargazers_count}</Text>
                    </div>
                    <div className="flex items-center space-x-1">
                      <EyeOutlined className="text-blue-500" />
                      <Text className="text-sm">{repo.watchers_count}</Text>
                    </div>
                  </div>
                  
                  {repo.language && (
                    <Tag color="blue">{repo.language}</Tag>
                  )}
                </div>

                <Text type="secondary" className="text-xs">
                  Updated {formatDate(repo.updated_at)}
                </Text>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
