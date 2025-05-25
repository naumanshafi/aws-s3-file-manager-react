export interface S3File {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

export interface S3Folder {
  name: string;
  path: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface S3Config {
  bucketName: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  roleArn?: string;
}

export interface ProjectFolder {
  name: string;
  path: string;
}

export interface DateFolder {
  date: string;
  path: string;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
}

export interface FileOperation {
  type: 'upload' | 'download' | 'delete';
  fileName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  progress?: number;
  error?: string;
} 