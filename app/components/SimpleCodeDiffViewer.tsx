'use client';

import React, { useState, useEffect } from 'react';

interface FileContent {
  name: string;
  path: string;
  content: string;
  sha: string;
  size: number;
  type: string;
  download_url: string;
}

interface SimpleCodeDiffViewerProps {
  token: string;
  repository: {
    name: string;
    full_name: string;
    html_url: string;
  };
  onCodeSubmit: (code: string, commitMessage: string, filePath: string) => void;
}

export default function SimpleCodeDiffViewer({ token, repository, onCodeSubmit }: SimpleCodeDiffViewerProps) {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button 
          onClick={fetchRepositoryFiles}
          className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Code Diff Viewer</h2>
        <p className="text-gray-600">
          Repository: <a href={repository.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
            {repository.full_name}
          </a>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File List */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Repository Files</h3>
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
                    <span className="font-medium text-sm">{file.name}</span>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {file.path}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Code Editor */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">
            {selectedFile ? `Editing: ${selectedFile.name}` : 'Select a file to edit'}
          </h3>
          
          {selectedFile ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Current Code:</h4>
                <div className="bg-gray-100 p-4 rounded border max-h-48 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {selectedFile.content}
                  </pre>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Modify the code below:</h4>
                <textarea
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full h-48 p-3 border rounded font-mono text-sm"
                  placeholder="Enter your code here..."
                />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Commit Message:</h4>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Enter commit message..."
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <button
                onClick={() => onCodeSubmit(newCode, commitMessage, selectedFile.path)}
                disabled={!newCode.trim() || !commitMessage.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
              >
                Push Changes to GitHub
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl text-gray-400 mb-4">📄</div>
              <p className="text-gray-600">
                Select a file from the list to view and edit its content
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
