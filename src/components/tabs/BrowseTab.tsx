import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Chip,
  Alert,
  IconButton,
  Paper,
  Avatar,
} from '@mui/material';
import {
  Folder,
  Home,
  ArrowBack,
  Refresh,
  ExploreOutlined,
  FolderOpen,
} from '@mui/icons-material';
import { useTopLevelFolders, useSubfolders, useFiles } from '../../hooks/useS3';
import FileList from '../FileList';
import { BreadcrumbItem } from '../../types';

const BrowseTab: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState<BreadcrumbItem[]>([]);

  const { data: topLevelFolders = [], isLoading: topLevelLoading } = useTopLevelFolders();
  const { data: subfolders = [], isLoading: subfoldersLoading } = useSubfolders(
    currentPath,
    !!currentPath
  );
  const { data: files = [], isLoading: filesLoading } = useFiles(
    currentPath,
    !!currentPath
  );

  const navigateToFolder = (folderPath: string, folderName: string) => {
    const newBreadcrumb: BreadcrumbItem = {
      label: folderName,
      path: folderPath,
    };

    setCurrentPath(folderPath);
    setPathHistory(prev => [...prev, newBreadcrumb]);
  };

  const navigateToPath = (targetPath: string) => {
    const targetIndex = pathHistory.findIndex(item => item.path === targetPath);
    
    if (targetIndex >= 0) {
      setCurrentPath(targetPath);
      setPathHistory(prev => prev.slice(0, targetIndex + 1));
    }
  };

  const navigateToRoot = () => {
    setCurrentPath('');
    setPathHistory([]);
  };

  const navigateBack = () => {
    if (pathHistory.length > 1) {
      const newHistory = pathHistory.slice(0, -1);
      const previousPath = newHistory[newHistory.length - 1]?.path || '';
      
      setCurrentPath(previousPath);
      setPathHistory(newHistory);
    } else {
      navigateToRoot();
    }
  };

  const isLoading = topLevelLoading || subfoldersLoading || filesLoading;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
            }}
          >
            <ExploreOutlined sx={{ fontSize: 24, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
              S3 Bucket Browser
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
              Navigate through your S3 bucket folders and files with full download and delete capabilities
            </Typography>
          </Box>
        </Box>

        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 3,
            border: '1px solid #bfdbfe',
            backgroundColor: '#eff6ff',
            '& .MuiAlert-icon': {
              color: '#3b82f6',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            <strong>🗂️ Explorer Mode:</strong> Browse your entire S3 bucket structure. 
            You can download any file or delete files as needed. Use the breadcrumb navigation to move between folders.
          </Typography>
        </Alert>
      </Box>

      {/* Navigation */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          p: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
              }}
            >
              <FolderOpen sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
              Navigation
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {pathHistory.length > 0 && (
              <IconButton 
                onClick={navigateBack} 
                size="small"
                sx={{ 
                  bgcolor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  '&:hover': { 
                    bgcolor: '#e2e8f0',
                    color: '#475569',
                  }
                }}
              >
                <ArrowBack />
              </IconButton>
            )}
            <IconButton 
              onClick={navigateToRoot} 
              size="small"
              sx={{ 
                bgcolor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                '&:hover': { 
                  bgcolor: '#e2e8f0',
                  color: '#475569',
                }
              }}
            >
              <Home />
            </IconButton>
          </Box>
        </Box>

        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component="button"
            variant="body2"
            onClick={navigateToRoot}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              textDecoration: 'none',
              fontWeight: 500,
              color: '#6366f1',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            <Home sx={{ mr: 0.5, fontSize: 16 }} />
            Root
          </Link>
          {pathHistory.map((item, index) => (
            <Link
              key={item.path}
              component="button"
              variant="body2"
              onClick={() => navigateToPath(item.path)}
              color={index === pathHistory.length - 1 ? 'text.primary' : 'inherit'}
              sx={{ 
                textDecoration: 'none',
                fontWeight: 500,
                color: index === pathHistory.length - 1 ? '#0f172a' : '#6366f1',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {item.label}
            </Link>
          ))}
        </Breadcrumbs>

        {/* Current Path Display */}
        {currentPath && (
          <Alert 
            severity="info" 
            sx={{ 
              borderRadius: 3,
              border: '1px solid #bfdbfe',
              backgroundColor: '#eff6ff',
              '& .MuiAlert-icon': {
                color: '#3b82f6',
              },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              <strong>Current path:</strong> {currentPath}
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Folder Contents */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          p: 4,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', mb: 3 }}>
          {currentPath ? 'Folder Contents' : 'Root Folders'}
        </Typography>

        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ color: '#64748b' }}>Loading...</Typography>
          </Box>
        ) : (
          <Box>
            {/* Folders */}
            {(currentPath ? subfolders : topLevelFolders.map(f => ({ name: f.name, path: f.path }))).length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontWeight: 600,
                  color: '#0f172a',
                  mb: 2
                }}>
                  <Folder sx={{ mr: 1, color: '#6366f1' }} />
                  Folders ({currentPath ? subfolders.length : topLevelFolders.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {(currentPath ? subfolders : topLevelFolders.map(f => ({ name: f.name, path: f.path }))).map((folder) => (
                    <Chip
                      key={folder.path}
                      label={folder.name}
                      icon={<Folder />}
                      onClick={() => navigateToFolder(folder.path, folder.name)}
                      clickable
                      variant="outlined"
                      sx={{ 
                        mb: 1,
                        borderRadius: 3,
                        borderColor: '#6366f1',
                        color: '#6366f1',
                        fontWeight: 500,
                        '&:hover': {
                          bgcolor: 'rgba(99, 102, 241, 0.05)',
                          borderColor: '#4f46e5',
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Files */}
            {currentPath && (
              <Box>
                <FileList
                  files={files}
                  isLoading={filesLoading}
                  prefix={currentPath}
                  actionMode="both"
                  title="Files in Current Folder"
                />
              </Box>
            )}

            {/* Empty State */}
            {!currentPath && topLevelFolders.length === 0 && (
              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: 3,
                  border: '1px solid #bfdbfe',
                  backgroundColor: '#eff6ff',
                  '& .MuiAlert-icon': {
                    color: '#3b82f6',
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  No folders found in the root of your S3 bucket.
                </Typography>
              </Alert>
            )}

            {currentPath && subfolders.length === 0 && files.length === 0 && (
              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: 3,
                  border: '1px solid #bfdbfe',
                  backgroundColor: '#eff6ff',
                  '& .MuiAlert-icon': {
                    color: '#3b82f6',
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  This folder is empty.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BrowseTab; 