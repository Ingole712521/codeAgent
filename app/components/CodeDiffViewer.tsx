'use client';

import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Spin, Alert, Tabs, Space, Tag } from 'antd';
import { FileTextOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface FileContent {
  name: string;
  path: string;
  content: string;
  sha: string;
  size: number;
  type: string;
  download_url: string;
}

interface CodeDiffViewerProps {
  token: string;
  repository: {
    name: string;
    full_name: string;
    html_url: string;
  };
  onCodeSubmit: (code: string, commitMessage: string, filePath: string) => void;
}

export default function CodeDiffViewer({ token, repository, onCodeSubmit }: CodeDiffViewerProps) {
  const [files, setFiles] = useState<FileContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [newCode, setNewCode] = useState('');
  const [commitMessage, setCommitMessage] = useState('');

  useEffect(() => {
    fetchRepositoryFiles();
  }, [repository]);

  const fetchRepositoryFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.github.com/repos/${repository.full_name}/contents`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (response.ok) {
        const filesData = await response.json();
        const codeFiles = filesData.filter((file: any) => 
          file.type === 'file' && 
          (file.name.endsWith('.js') || 
           file.name.endsWith('.ts') || 
           file.name.endsWith('.tsx') || 
           file.name.endsWith('.jsx') || 
           file.name.endsWith('.py') || 
           file.name.endsWith('.java') || 
           file.name.endsWith('.cpp') || 
           file.name.endsWith('.c') || 
           file.name.endsWith('.cs') || 
           file.name.endsWith('.php') || 
           file.name.endsWith('.rb') || 
           file.name.endsWith('.go'))
        );
        setFiles(codeFiles);
      } else {
        setError('Failed to fetch repository files. Please check your permissions.');
      }
    } catch (err) {
      setError('Failed to connect to GitHub. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (file: FileContent) => {
    try {
      const response = await fetch(file.download_url, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const content = await response.text();
        setSelectedFile({ ...file, content });
        setNewCode(content);
      } else {
        setError('Failed to fetch file content.');
      }
    } catch (err) {
      setError('Failed to load file content.');
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      'js': '🟨',
      'ts': '🔷',
      'tsx': '🔷',
      'jsx': '🟨',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'cs': '🔷',
      'php': '🐘',
      'rb': '💎',
      'go': '🐹'
    };
    return iconMap[extension || ''] || '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <Button size="small" onClick={fetchRepositoryFiles}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-6">
        <Title level={2} className="mb-2">Code Diff Viewer</Title>
        <Text type="secondary">
          Repository: <a href={repository.html_url} target="_blank" rel="noopener noreferrer">
            {repository.full_name}
          </a>
        </Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File List */}
        <Card title="Repository Files" className="h-fit">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={file.sha}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedFile?.sha === file.sha 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
                onClick={() => fetchFileContent(file)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getFileIcon(file.name)}</span>
                    <Text strong className="text-sm">{file.name}</Text>
                  </div>
                  <Tag color="blue">{formatFileSize(file.size)}</Tag>
                </div>
                <Text type="secondary" className="text-xs">
                  {file.path}
                </Text>
              </div>
            ))}
          </div>
        </Card>

        {/* Code Editor */}
        <Card title={selectedFile ? `Editing: ${selectedFile.name}` : 'Select a file to edit'}>
          {selectedFile ? (
            <div className="space-y-4">
              <Tabs defaultActiveKey="current">
                <TabPane tab="Current Code" key="current">
                  <div className="bg-gray-100 p-4 rounded border max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {selectedFile.content}
                    </pre>
                  </div>
                </TabPane>
                <TabPane tab="Edit Code" key="edit">
                  <div className="space-y-4">
                    <Text strong>Modify the code below:</Text>
                    <textarea
                      value={newCode}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewCode(e.target.value)}
                      className="w-full h-64 p-3 border rounded font-mono text-sm"
                      placeholder="Enter your code here..."
                    />
                    <div>
                      <Text strong>Commit Message:</Text>
                      <input
                        type="text"
                        value={commitMessage}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommitMessage(e.target.value)}
                        placeholder="Enter commit message..."
                        className="w-full p-2 border rounded mt-1"
                      />
                    </div>
                    <Button
                      type="primary"
                      size="large"
                      block
                      onClick={() => onCodeSubmit(newCode, commitMessage, selectedFile.path)}
                      disabled={!newCode.trim() || !commitMessage.trim()}
                    >
                      Push Changes to GitHub
                    </Button>
                  </div>
                </TabPane>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileTextOutlined className="text-4xl text-gray-400 mb-4" />
              <Text type="secondary">
                Select a file from the list to view and edit its content
              </Text>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
