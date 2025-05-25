import { 
  S3Client, 
  ListObjectsV2Command, 
  PutObjectCommand, 
  DeleteObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3File, S3Folder, S3Config } from '../types';

class S3Service {
  private client: S3Client | null = null;
  private config: S3Config | null = null;

  initialize(config: S3Config) {
    this.config = config;
    this.client = new S3Client({
      region: config.region,
      credentials: config.accessKeyId && config.secretAccessKey ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        sessionToken: config.sessionToken,
      } : undefined,
      // Configure for browser compatibility
      forcePathStyle: false,
      useAccelerateEndpoint: false,
      useDualstackEndpoint: false,
    });
  }

  private ensureInitialized() {
    if (!this.client || !this.config) {
      throw new Error('S3 service not initialized. Call initialize() first.');
    }
  }

  async listTopLevelFolders(): Promise<S3Folder[]> {
    this.ensureInitialized();
    
    const command = new ListObjectsV2Command({
      Bucket: this.config!.bucketName,
      Delimiter: '/',
    });

    const response = await this.client!.send(command);
    const folders: S3Folder[] = [];

    if (response.CommonPrefixes) {
      for (const prefix of response.CommonPrefixes) {
        if (prefix.Prefix) {
          const folderName = prefix.Prefix.replace('/', '');
          folders.push({
            name: folderName,
            path: prefix.Prefix,
          });
        }
      }
    }

    return folders.sort((a, b) => a.name.localeCompare(b.name));
  }

  async listSubfolders(prefix: string): Promise<S3Folder[]> {
    this.ensureInitialized();
    
    const normalizedPrefix = prefix.endsWith('/') ? prefix : prefix + '/';
    
    const command = new ListObjectsV2Command({
      Bucket: this.config!.bucketName,
      Prefix: normalizedPrefix,
      Delimiter: '/',
    });

    const response = await this.client!.send(command);
    const folders: S3Folder[] = [];

    if (response.CommonPrefixes) {
      for (const folderPrefix of response.CommonPrefixes) {
        if (folderPrefix.Prefix) {
          const folderPath = folderPrefix.Prefix;
          const folderName = folderPath.split('/').slice(-2, -1)[0];
          folders.push({
            name: folderName,
            path: folderPath,
          });
        }
      }
    }

    return folders.sort((a, b) => a.name.localeCompare(b.name));
  }

  async listFiles(prefix: string = ''): Promise<S3File[]> {
    this.ensureInitialized();
    
    const normalizedPrefix = prefix && !prefix.endsWith('/') ? prefix + '/' : prefix;
    
    const command = new ListObjectsV2Command({
      Bucket: this.config!.bucketName,
      Prefix: normalizedPrefix,
    });

    const response = await this.client!.send(command);
    const files: S3File[] = [];

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key && !obj.Key.endsWith('/')) {
          files.push({
            key: obj.Key,
            size: obj.Size || 0,
            lastModified: obj.LastModified || new Date(),
            etag: obj.ETag,
          });
        }
      }
    }

    return files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  async listDateFolders(project: string, dataType: 'inputData' | 'outputData'): Promise<string[]> {
    this.ensureInitialized();
    
    const prefix = `${project}/${dataType}/`;
    
    const command = new ListObjectsV2Command({
      Bucket: this.config!.bucketName,
      Prefix: prefix,
      Delimiter: '/',
    });

    const response = await this.client!.send(command);
    const dateFolders: string[] = [];

    if (response.CommonPrefixes) {
      for (const folderPrefix of response.CommonPrefixes) {
        if (folderPrefix.Prefix) {
          const dateFolder = folderPrefix.Prefix.replace(prefix, '').replace('/', '');
          if (dateFolder) {
            dateFolders.push(dateFolder);
          }
        }
      }
    }

    return dateFolders.sort().reverse(); // Most recent first
  }

  async uploadFile(
    file: File, 
    key: string, 
    onProgress?: (progress: number) => void
  ): Promise<void> {
    this.ensureInitialized();
    
    const command = new PutObjectCommand({
      Bucket: this.config!.bucketName,
      Key: key,
      Body: file,
      ContentType: file.type,
    });

    // For now, we'll simulate progress since AWS SDK doesn't provide built-in progress tracking
    if (onProgress) {
      onProgress(0);
      const progressInterval = setInterval(() => {
        onProgress(Math.min(90, Math.random() * 90));
      }, 100);

      try {
        await this.client!.send(command);
        clearInterval(progressInterval);
        onProgress(100);
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    } else {
      await this.client!.send(command);
    }
  }

  async deleteFile(key: string): Promise<void> {
    this.ensureInitialized();
    
    const command = new DeleteObjectCommand({
      Bucket: this.config!.bucketName,
      Key: key,
    });

    await this.client!.send(command);
  }

  async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    this.ensureInitialized();
    
    const command = new GetObjectCommand({
      Bucket: this.config!.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.client!, command, { expiresIn });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const s3Service = new S3Service(); 