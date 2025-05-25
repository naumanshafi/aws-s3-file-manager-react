import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  LinearProgress,
  Box,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudDownload,
  Close,
  FolderOpen,
  GetApp,
} from '@mui/icons-material';
import { S3File } from '../types';
import { useBulkDownload } from '../hooks/useS3';
import { apiService } from '../services/apiService';

interface BulkDownloadProps {
  files: S3File[];
  folderName?: string;
  disabled?: boolean;
}

const BulkDownload: React.FC<BulkDownloadProps> = ({ 
  files, 
  folderName = 'folder',
  disabled = false 
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, currentFile: '' });
  
  const bulkDownloadMutation = useBulkDownload();

  const handleBulkDownload = async () => {
    if (files.length === 0) return;

    const fileKeys = files.map(file => file.key);
    
    try {
      await bulkDownloadMutation.mutateAsync({
        keys: fileKeys,
        onProgress: (completed, total, currentFile) => {
          setProgress({ completed, total, currentFile });
          
          // Show individual file download notifications
          if (currentFile !== 'Complete' && completed > 0) {
            console.log(`Downloaded: ${currentFile} (${completed}/${total})`);
          }
        }
      });
      
      // Close dialog after successful download
      setTimeout(() => {
        setDialogOpen(false);
        setProgress({ completed: 0, total: 0, currentFile: '' });
      }, 3000); // Longer delay to see completion message
      
    } catch (error) {
      console.error('Bulk download failed:', error);
    }
  };

  const handleClose = () => {
    if (!bulkDownloadMutation.isPending) {
      setDialogOpen(false);
      setProgress({ completed: 0, total: 0, currentFile: '' });
    }
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <>
      <Tooltip title={`Download all ${files.length} files from this folder`}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CloudDownload />}
          onClick={() => setDialogOpen(true)}
          disabled={disabled || files.length === 0}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Download All Files ({files.length})
        </Button>
      </Tooltip>

      <Dialog 
        open={dialogOpen} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={bulkDownloadMutation.isPending}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderOpen color="primary" />
            <Typography variant="h6">
              Bulk Download: {folderName}
            </Typography>
          </Box>
          {!bulkDownloadMutation.isPending && (
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          )}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>📁 Folder Download:</strong> This will download all {files.length} files 
                from the "{folderName}" folder individually. Each file will be saved to your 
                default download location.
              </Typography>
            </Alert>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Download Summary:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`${files.length} files`} 
                color="primary" 
                size="small" 
                icon={<GetApp />}
              />
              <Chip 
                label={apiService.formatFileSize(totalSize)} 
                color="secondary" 
                size="small" 
              />
            </Box>
          </Box>

          {bulkDownloadMutation.isPending && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Downloading: {progress.currentFile}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {progress.completed} of {progress.total} files completed ({Math.round(progressPercentage)}%)
              </Typography>
            </Box>
          )}

          {progress.completed > 0 && progress.completed === progress.total && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                ✅ All files downloaded successfully! Check your downloads folder.
              </Typography>
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>
              <Typography variant="body2">
                <strong>⚠️ Browser Settings:</strong> Make sure your browser allows multiple downloads. 
                Some browsers may block automatic downloads or ask for permission.
              </Typography>
            </Alert>
            <Typography variant="caption" color="text.secondary">
              <strong>📥 Download Process:</strong> Files will be downloaded one by one with a delay between each 
              to ensure reliable downloads. Check your browser's download folder and download notifications.
              If downloads don't appear, check your browser's download settings and popup blockers.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleClose} 
            disabled={bulkDownloadMutation.isPending}
            color="inherit"
          >
            {bulkDownloadMutation.isPending ? 'Downloading...' : 'Cancel'}
          </Button>
          {files.length > 0 && (
            <Button
              onClick={() => {
                // Test download with just the first file
                const testFile = files[0];
                const fileName = testFile.key.split('/').pop() || 'test-file';
                
                // Create a simple test download
                const testContent = `Test download for: ${fileName}\nFile key: ${testFile.key}\nTimestamp: ${new Date().toISOString()}`;
                const blob = new Blob([testContent], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `test-${fileName}.txt`;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setTimeout(() => {
                  window.URL.revokeObjectURL(url);
                }, 1000);
              }}
              variant="outlined"
              size="small"
              sx={{ mr: 1 }}
            >
              Test Download
            </Button>
          )}
          <Button
            onClick={handleBulkDownload}
            variant="contained"
            disabled={bulkDownloadMutation.isPending || files.length === 0}
            startIcon={<CloudDownload />}
            sx={{ minWidth: 140 }}
          >
            {bulkDownloadMutation.isPending ? 'Downloading...' : 'Start Download'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkDownload; 