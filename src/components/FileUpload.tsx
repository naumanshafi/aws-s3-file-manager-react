import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  Chip,
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useUploadFile } from '../hooks/useS3';
import { s3Service } from '../services/s3Service';

interface FileUploadProps {
  targetPath: string;
  onUploadComplete?: (fileName: string) => void;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ targetPath, onUploadComplete }) => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const uploadMutation = useUploadFile();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (index: number) => {
    const fileItem = files[index];
    if (!fileItem || fileItem.status === 'uploading') return;

    const key = `${targetPath}${targetPath.endsWith('/') ? '' : '/'}${fileItem.file.name}`;

    setFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, status: 'uploading', progress: 0 } : item
    ));

    try {
      await uploadMutation.mutateAsync({
        file: fileItem.file,
        key,
        onProgress: (progress) => {
          setFiles(prev => prev.map((item, i) => 
            i === index ? { ...item, progress } : item
          ));
        },
      });

      setFiles(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'completed', progress: 100 } : item
      ));

      onUploadComplete?.(fileItem.file.name);
    } catch (error) {
      setFiles(prev => prev.map((item, i) => 
        i === index ? { 
          ...item, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : item
      ));
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => file.status === 'pending');

    for (const { index } of pendingFiles) {
      await uploadFile(index);
    }
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(file => file.status !== 'completed'));
  };

  const getStatusIcon = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'uploading':
        return <CloudUpload color="primary" />;
      default:
        return <InsertDriveFile />;
    }
  };

  const getStatusColor = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'uploading':
        return 'primary';
      default:
        return 'default';
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const uploadingCount = files.filter(f => f.status === 'uploading').length;
  const completedCount = files.filter(f => f.status === 'completed').length;

  return (
    <Box>
      {/* Upload Target Info */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Upload destination:</strong> {targetPath}
        </Typography>
      </Alert>

      {/* Dropzone */}
      <Card
        {...getRootProps()}
        sx={{
          mb: 2,
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <Box sx={{ textAlign: 'center' }}>
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            or click to select files
          </Typography>
          <Button variant="outlined" component="span">
            Select Files
          </Button>
        </Box>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Files ({files.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {pendingCount > 0 && (
                  <Button
                    variant="contained"
                    onClick={uploadAllFiles}
                    disabled={uploadingCount > 0}
                    startIcon={<CloudUpload />}
                  >
                    Upload All ({pendingCount})
                  </Button>
                )}
                {completedCount > 0 && (
                  <Button
                    variant="outlined"
                    onClick={clearCompleted}
                    size="small"
                  >
                    Clear Completed
                  </Button>
                )}
              </Box>
            </Box>

            <List>
              {files.map((fileItem, index) => (
                <ListItem
                  key={`${fileItem.file.name}-${index}`}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    {getStatusIcon(fileItem.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {fileItem.file.name}
                        </Typography>
                        <Chip
                          label={fileItem.status}
                          size="small"
                          color={getStatusColor(fileItem.status) as any}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {s3Service.formatFileSize(fileItem.file.size)}
                        </Typography>
                        {fileItem.status === 'uploading' && (
                          <LinearProgress
                            variant="determinate"
                            value={fileItem.progress}
                            sx={{ mt: 1 }}
                          />
                        )}
                        {fileItem.error && (
                          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                            {fileItem.error}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {fileItem.status === 'pending' && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => uploadFile(index)}
                        disabled={uploadingCount > 0}
                      >
                        Upload
                      </Button>
                    )}
                    {fileItem.status !== 'uploading' && (
                      <IconButton
                        size="small"
                        onClick={() => removeFile(index)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FileUpload; 