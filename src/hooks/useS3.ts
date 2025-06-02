import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import { S3File, S3Folder } from '../types';
import { useS3Config } from '../contexts/S3ConfigContext';
import toast from 'react-hot-toast';

// Helper function to handle API errors including token expiration
const useApiErrorHandler = () => {
  const { handleTokenExpiration } = useS3Config();
  
  return (error: any) => {
    // Check if this is a token expiration error first
    if (handleTokenExpiration(error)) {
      return; // Token expiration handled, user logged out
    }
    
    // Handle other errors normally
    console.error('API Error:', error);
    toast.error(error.message || 'An error occurred');
  };
};

// Query keys
export const queryKeys = {
  topLevelFolders: ['s3', 'topLevelFolders'],
  subfolders: (prefix: string) => ['s3', 'subfolders', prefix],
  files: (prefix: string) => ['s3', 'files', prefix],
  dateFolders: (project: string, dataType: string) => ['s3', 'dateFolders', project, dataType],
};

// Hook for fetching top-level folders
export const useTopLevelFolders = () => {
  const handleError = useApiErrorHandler();
  
  return useQuery({
    queryKey: queryKeys.topLevelFolders,
    queryFn: async () => {
      try {
        return await apiService.listTopLevelFolders();
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching subfolders
export const useSubfolders = (prefix: string, enabled: boolean = true) => {
  const handleError = useApiErrorHandler();
  
  return useQuery({
    queryKey: queryKeys.subfolders(prefix),
    queryFn: async () => {
      try {
        return await apiService.listSubfolders(prefix);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    enabled: enabled && !!prefix,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook for fetching files
export const useFiles = (prefix: string, enabled: boolean = true) => {
  const handleError = useApiErrorHandler();
  
  return useQuery({
    queryKey: queryKeys.files(prefix),
    queryFn: async () => {
      try {
        return await apiService.listFiles(prefix);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    enabled: enabled && prefix !== undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes for files (more frequent updates)
    gcTime: 5 * 60 * 1000,
  });
};

// Hook for fetching date folders
export const useDateFolders = (
  project: string, 
  dataType: 'inputData' | 'outputData',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: queryKeys.dateFolders(project, dataType),
    queryFn: () => apiService.listDateFolders(project, dataType),
    enabled: enabled && !!project,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook for uploading files
export const useUploadFile = () => {
  const queryClient = useQueryClient();
  const handleError = useApiErrorHandler();

  return useMutation({
    mutationFn: async ({ 
      file, 
      key, 
      onProgress 
    }: { 
      file: File; 
      key: string; 
      onProgress?: (progress: number) => void;
    }) => {
      try {
        await apiService.uploadFile(file, key, onProgress);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      const prefix = variables.key.substring(0, variables.key.lastIndexOf('/'));
      queryClient.invalidateQueries({ queryKey: queryKeys.files(prefix) });
      
      toast.success(`File "${variables.file.name}" uploaded successfully!`);
    },
    onError: (error: Error, variables) => {
      toast.error(`Failed to upload "${variables.file.name}": ${error.message}`);
    },
  });
};

// Hook for deleting files
export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string) => {
      await apiService.deleteFile(key);
    },
    onSuccess: (_, key) => {
      // Invalidate relevant queries
      const prefix = key.substring(0, key.lastIndexOf('/'));
      queryClient.invalidateQueries({ queryKey: queryKeys.files(prefix) });
      
      const fileName = key.substring(key.lastIndexOf('/') + 1);
      toast.success(`File "${fileName}" deleted successfully!`);
    },
    onError: (error: Error, key) => {
      const fileName = key.substring(key.lastIndexOf('/') + 1);
      toast.error(`Failed to delete "${fileName}": ${error.message}`);
    },
  });
};

// Hook for generating presigned URLs
export const usePresignedUrl = () => {
  return useMutation({
    mutationFn: async (key: string) => {
      return await apiService.generatePresignedUrl(key);
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate download link: ${error.message}`);
    },
  });
};

// Hook for bulk downloading files
export const useBulkDownload = () => {
  return useMutation({
    mutationFn: async ({ 
      keys, 
      onProgress 
    }: { 
      keys: string[], 
      onProgress?: (completed: number, total: number, currentFile: string) => void 
    }) => {
      return await apiService.bulkDownloadFiles(keys, onProgress);
    },
    onSuccess: (_, variables) => {
      toast.success(`Successfully downloaded ${variables.keys.length} files!`);
    },
    onError: (error: Error) => {
      toast.error(`Bulk download failed: ${error.message}`);
    },
  });
};

// Hook for refreshing data
export const useRefreshData = () => {
  const queryClient = useQueryClient();

  const refreshFiles = (prefix: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.files(prefix) });
  };

  const refreshFolders = (prefix?: string) => {
    if (prefix) {
      queryClient.invalidateQueries({ queryKey: queryKeys.subfolders(prefix) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.topLevelFolders });
    }
  };

  const refreshDateFolders = (project: string, dataType: 'inputData' | 'outputData') => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dateFolders(project, dataType) });
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['s3'] });
  };

  return {
    refreshFiles,
    refreshFolders,
    refreshDateFolders,
    refreshAll,
  };
}; 