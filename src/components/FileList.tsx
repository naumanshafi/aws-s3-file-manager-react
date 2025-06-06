import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
  Paper,
  Avatar,
} from '@mui/material';
import {
  Download,
  Delete,
  Refresh,
  GetApp,
  InsertDriveFile,
  Image,
  VideoFile,
  AudioFile,
  PictureAsPdf,
  Description,
  Archive,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { S3File } from '../types';
import { useDeleteFile, usePresignedUrl, useRefreshData } from '../hooks/useS3';
import { apiService } from '../services/apiService';
import BulkDownload from './BulkDownload';

export type ActionMode = 'download-only' | 'delete-only' | 'both' | 'none';

interface FileListProps {
  files: S3File[];
  isLoading?: boolean;
  error?: string | null;
  prefix: string;
  actionMode?: ActionMode;
  title?: string;
}

const FileList: React.FC<FileListProps> = ({ 
  files, 
  isLoading, 
  error, 
  prefix,
  actionMode = 'both',
  title = 'Files'
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<S3File | null>(null);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

  const deleteMutation = useDeleteFile();
  const presignedUrlMutation = usePresignedUrl();
  const { refreshFiles } = useRefreshData();

  const handleDeleteClick = (file: S3File) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    try {
      await deleteMutation.mutateAsync(fileToDelete.key);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Helper method to extract folder structure from S3 key
  const extractFolderStructure = (key: string): { folderPath: string; fileName: string } => {
    const parts = key.split('/');
    const fileName = parts.pop() || 'download';
    
    // Extract meaningful folder structure (skip project name, keep date and subfolder structure)
    let folderPath = '';
    
    if (parts.length >= 3) {
      // For paths like: project/inputData/2025-05-09/annotation_inputs/input_files/
      // or: project/outputData/2025-05-09/annotation_outputs/output_files/
      const dateIndex = parts.findIndex(part => /^\d{4}-\d{2}-\d{2}$/.test(part));
      
      if (dateIndex !== -1) {
        // Include date and any subfolders after it
        const relevantParts = parts.slice(dateIndex);
        folderPath = relevantParts.join('/');
      }
    }
    
    return { folderPath, fileName };
  };

  const handleDownload = async (file: S3File) => {
    setDownloadingFiles(prev => new Set(prev).add(file.key));
    const { folderPath, fileName } = extractFolderStructure(file.key);
    const downloadFileName = folderPath ? `${folderPath}/${fileName}` : fileName;
    
    // Show loading toast
    const loadingToast = toast.loading(`Preparing download: ${fileName}`);

    try {
      const url = await presignedUrlMutation.mutateAsync(file.key);
      
      // Format file size for logging
      const fileSizeFormatted = apiService.formatFileSize(file.size);
      
      // Method 1: Always use fetch to get the file as a blob and force download
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get the content type from response headers
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        
        const blob = await response.blob();
        
        // Create a new blob with the correct MIME type to ensure download
        const downloadBlob = new Blob([blob], { 
          type: 'application/octet-stream' // Force download by using generic binary type
        });
        
        const blobUrl = window.URL.createObjectURL(downloadBlob);
        
        // Create download link with folder structure preserved
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = downloadFileName; // This preserves folder structure
        downloadLink.style.display = 'none';
        
        // Force download attributes
        downloadLink.setAttribute('download', downloadFileName);
        downloadLink.setAttribute('target', '_self');
        
        // Add to DOM, click, and remove
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up the blob URL after a short delay
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 1000);
        
        console.log(`Successfully downloaded: ${downloadFileName}`);
        toast.success(`Download started: ${fileName}`, { id: loadingToast });
        
        // Log successful download activity
        try {
          await apiService.logDownloadActivity(
            fileName,
            fileSizeFormatted,
            file.key,
            'success',
            `File downloaded successfully: ${file.key}`
          );
        } catch (logError) {
          console.warn('Failed to log download activity:', logError);
          // Don't fail the download if logging fails
        }
        
      } catch (fetchError) {
        console.warn('Blob download failed, trying alternative method:', fetchError);
        
        // Method 2: Create a hidden iframe to force download
        try {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = url;
          document.body.appendChild(iframe);
          
          // Remove iframe after download starts
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 5000);
          
          console.log(`Initiated download via iframe: ${fileName}`);
          toast.success(`Download started: ${fileName}`, { id: loadingToast });
          
          // Log download activity (iframe method - assume success)
          try {
            await apiService.logDownloadActivity(
              fileName,
              fileSizeFormatted,
              file.key,
              'success',
              `File download initiated via iframe: ${file.key}`
            );
          } catch (logError) {
            console.warn('Failed to log download activity:', logError);
          }
          
        } catch (iframeError) {
          console.warn('Iframe download failed, using direct link:', iframeError);
          
          // Method 3: Fallback to direct link with download attribute
          const link = document.createElement('a');
          link.href = url;
          link.download = downloadFileName;
          link.style.display = 'none';
          
          // Force download by setting additional attributes
          link.setAttribute('download', downloadFileName);
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log(`Fallback download attempted: ${downloadFileName}`);
          toast.success(`Download initiated: ${fileName}`, { id: loadingToast });
          
          // Log download activity (fallback method - assume success)
          try {
            await apiService.logDownloadActivity(
              fileName,
              fileSizeFormatted,
              file.key,
              'success',
              `File download attempted via fallback method: ${file.key}`
            );
          } catch (logError) {
            console.warn('Failed to log download activity:', logError);
          }
        }
      }
      
    } catch (error) {
      console.error('Download failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Download failed: ${fileName} - ${errorMessage}`, { id: loadingToast });
      
      // Log failed download activity
      try {
        const fileSizeFormatted = apiService.formatFileSize(file.size);
        await apiService.logDownloadActivity(
          fileName,
          fileSizeFormatted,
          file.key,
          'failed',
          `Download failed: ${errorMessage}`
        );
      } catch (logError) {
        console.warn('Failed to log failed download activity:', logError);
      }
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.key);
        return newSet;
      });
    }
  };

  const handleRefresh = () => {
    refreshFiles(prefix);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
      case 'webp':
        return <Image color="primary" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
      case 'webm':
        return <VideoFile color="secondary" />;
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
      case 'ogg':
        return <AudioFile color="success" />;
      case 'pdf':
        return <PictureAsPdf color="error" />;
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
        return <Description color="info" />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <Archive color="warning" />;
      default:
        return <InsertDriveFile />;
    }
  };

  const getFileExtension = (fileName: string) => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()?.toUpperCase() : 'FILE';
  };

  const getFileTypeColor = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
      case 'webp':
        return 'primary';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
      case 'webm':
        return 'secondary';
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
      case 'ogg':
        return 'success';
      case 'pdf':
        return 'error';
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
        return 'info';
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const showDownloadAction = actionMode === 'download-only' || actionMode === 'both';
  const showDeleteAction = actionMode === 'delete-only' || actionMode === 'both';
  const showActions = actionMode !== 'none';

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Card elevation={2} sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <InsertDriveFile />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {title} ({files.length})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {prefix || 'Root directory'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {files.length > 0 && actionMode !== 'delete-only' && (
                <BulkDownload 
                  files={files} 
                  folderName={prefix.split('/').filter(Boolean).pop() || 'Root'}
                  disabled={isLoading}
                />
              )}
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={isLoading}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Loading files...
                </Typography>
              </Box>
            </Box>
          ) : files.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Avatar sx={{ 
                bgcolor: 'grey.100', 
                color: 'grey.400',
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2
              }}>
                <InsertDriveFile sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No files found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This location doesn't contain any files
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>File</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Modified</TableCell>
                    {showActions && <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.map((file, index) => {
                    const fileName = file.key.split('/').pop() || file.key;
                    const isDownloading = downloadingFiles.has(file.key);
                    
                    return (
                      <TableRow 
                        key={file.key} 
                        hover 
                        sx={{ 
                          '&:hover': { bgcolor: 'action.hover' },
                          borderBottom: index === files.length - 1 ? 'none' : '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {getFileIcon(fileName)}
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {fileName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {file.key}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getFileExtension(fileName)}
                            size="small"
                            variant="outlined"
                            color={getFileTypeColor(fileName) as any}
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {apiService.formatFileSize(file.size)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(file.lastModified)}
                          </Typography>
                        </TableCell>
                        {showActions && (
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              {showDownloadAction && (
                                <Tooltip title="Download file">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDownload(file)}
                                    disabled={isDownloading || presignedUrlMutation.isPending}
                                    color="primary"
                                    sx={{ 
                                      bgcolor: 'primary.50',
                                      '&:hover': { bgcolor: 'primary.100' }
                                    }}
                                  >
                                    {isDownloading ? (
                                      <CircularProgress size={20} />
                                    ) : (
                                      <Download />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              )}
                              {showDeleteAction && (
                                <Tooltip title="Delete file">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteClick(file)}
                                    disabled={deleteMutation.isPending}
                                    color="error"
                                    sx={{ 
                                      bgcolor: 'error.50',
                                      '&:hover': { bgcolor: 'error.100' }
                                    }}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'error.main' }}>
              <Delete />
            </Avatar>
            <Typography variant="h6">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to delete <strong>"{fileToDelete?.key.split('/').pop()}"</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. The file will be permanently removed from S3.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            sx={{ 
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete File'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileList; 