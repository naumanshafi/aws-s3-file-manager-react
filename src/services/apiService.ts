import { S3File, S3Folder, S3Config } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/s3';

class ApiService {
  private isInitialized = false;

  async initialize(config: S3Config): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to initialize S3 connection');
    }

    this.isInitialized = true;
  }

  async testConnection(): Promise<{ success: boolean; folders: S3Folder[]; count: number }> {
    if (!this.isInitialized) {
      throw new Error('API service not initialized');
    }

    const response = await fetch(`${API_BASE_URL}/test`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Connection test failed');
    }

    return await response.json();
  }

  async listTopLevelFolders(): Promise<S3Folder[]> {
    if (!this.isInitialized) {
      throw new Error('API service not initialized');
    }

    const response = await fetch(`${API_BASE_URL}/folders`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list folders');
    }

    return await response.json();
  }

  async listSubfolders(prefix: string): Promise<S3Folder[]> {
    if (!this.isInitialized) {
      throw new Error('API service not initialized');
    }

    const response = await fetch(`${API_BASE_URL}/folders?prefix=${encodeURIComponent(prefix)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list subfolders');
    }

    return await response.json();
  }

  async listFiles(prefix: string = ''): Promise<S3File[]> {
    if (!this.isInitialized) {
      throw new Error('API service not initialized');
    }

    const response = await fetch(`${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list files');
    }

    const files = await response.json();
    return files.map((file: any) => ({
      ...file,
      lastModified: new Date(file.lastModified),
    }));
  }

  async listDateFolders(project: string, dataType: 'inputData' | 'outputData'): Promise<string[]> {
    const prefix = `${project}/${dataType}/`;
    const folders = await this.listSubfolders(prefix);
    return folders.map(folder => folder.name).sort().reverse();
  }

  async uploadFile(
    file: File, 
    key: string, 
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('API service not initialized');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);

    // Simulate progress since we can't track real progress easily
    if (onProgress) {
      onProgress(0);
      const progressInterval = setInterval(() => {
        onProgress(Math.min(90, Math.random() * 90));
      }, 100);

      try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        onProgress(100);
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    } else {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('API service not initialized');
    }

    const response = await fetch(`${API_BASE_URL}/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Delete failed');
    }
  }

  async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('API service not initialized');
    }

    const response = await fetch(`${API_BASE_URL}/presigned`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, expiresIn }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate presigned URL');
    }

    const result = await response.json();
    return result.url;
  }

  // Helper method to extract folder structure from S3 key
  private extractFolderStructure(key: string): { folderPath: string; fileName: string } {
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
  }

  async bulkDownloadFiles(keys: string[], onProgress?: (completed: number, total: number, currentFile: string) => void): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('API service not initialized');
    }

    const total = keys.length;
    let completed = 0;

    for (const key of keys) {
      const { folderPath, fileName } = this.extractFolderStructure(key);
      const downloadFileName = folderPath ? `${folderPath}/${fileName}` : fileName;
      
      if (onProgress) {
        onProgress(completed, total, fileName);
      }

      try {
        // Get presigned URL
        const url = await this.generatePresignedUrl(key);
        
        // Try multiple download methods for better compatibility
        let downloadSuccess = false;
        
        // Method 1: Blob download (most reliable)
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
          
          const blob = await response.blob();
          
          // Create download blob with proper MIME type
          const downloadBlob = new Blob([blob], { 
            type: 'application/octet-stream'
          });
          
          const blobUrl = window.URL.createObjectURL(downloadBlob);
          
          // Create download link with folder structure preserved
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          downloadLink.download = downloadFileName; // This preserves folder structure
          downloadLink.style.display = 'none';
          
          // Set additional attributes to force download
          downloadLink.setAttribute('download', downloadFileName);
          downloadLink.setAttribute('target', '_blank');
          downloadLink.setAttribute('rel', 'noopener noreferrer');
          
          // Add to DOM, trigger click with user interaction simulation
          document.body.appendChild(downloadLink);
          
          // Simulate user interaction for better browser compatibility
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
          });
          
          downloadLink.dispatchEvent(clickEvent);
          
          // Remove from DOM after a short delay
          setTimeout(() => {
            if (document.body.contains(downloadLink)) {
              document.body.removeChild(downloadLink);
            }
            window.URL.revokeObjectURL(blobUrl);
          }, 2000);
          
          downloadSuccess = true;
          
        } catch (blobError) {
          console.warn(`Blob download failed for ${fileName}, trying fallback:`, blobError);
          
          // Method 2: Direct link fallback
          try {
            const fallbackLink = document.createElement('a');
            fallbackLink.href = url;
            fallbackLink.download = downloadFileName;
            fallbackLink.style.display = 'none';
            fallbackLink.setAttribute('download', downloadFileName);
            fallbackLink.setAttribute('target', '_blank');
            fallbackLink.setAttribute('rel', 'noopener noreferrer');
            
            document.body.appendChild(fallbackLink);
            fallbackLink.click();
            
            setTimeout(() => {
              if (document.body.contains(fallbackLink)) {
                document.body.removeChild(fallbackLink);
              }
            }, 1000);
            
            downloadSuccess = true;
            
          } catch (fallbackError) {
            console.error(`All download methods failed for ${fileName}:`, fallbackError);
            const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
            throw new Error(`Download failed: ${errorMessage}`);
          }
        }
        
        if (downloadSuccess) {
          completed++;
          
          // Longer delay between downloads to ensure browser processes each one
          if (completed < total) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        
      } catch (error) {
        console.error(`Failed to download ${fileName}:`, error);
        // Continue with next file even if one fails
        completed++;
      }
    }

    if (onProgress) {
      onProgress(completed, total, 'Complete');
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const apiService = new ApiService(); 