const express = require('express');
const cors = require('cors');
const { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Set AWS profile for the server
process.env.AWS_PROFILE = 'amazon';

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

let s3Client = null;
let bucketName = '';
let isInitializing = false;
let lastConfig = null;

// Initialize S3 client with role assumption
app.post('/api/s3/init', async (req, res) => {
  try {
    const { 
      region, 
      accessKeyId, 
      secretAccessKey, 
      roleArn, 
      bucketName: bucket,
      sessionName = 'S3FileManagerSession'
    } = req.body;

    // Check if we're already initializing to prevent concurrent requests
    if (isInitializing) {
      console.log('Already initializing, waiting...');
      // Wait a bit and return success if client exists
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (s3Client) {
        return res.json({ success: true, message: 'S3 client already initialized' });
      }
    }

    // Check if we already have a valid client with the same config
    const currentConfig = { region, accessKeyId, secretAccessKey, roleArn, bucketName: bucket };
    if (s3Client && lastConfig && JSON.stringify(currentConfig) === JSON.stringify(lastConfig)) {
      console.log('Using existing S3 client with same configuration');
      return res.json({ success: true, message: 'S3 client already initialized with same config' });
    }
    
    // Debug: Log received configuration (without sensitive data)
    console.log('Received configuration:', {
      region,
      bucketName: bucket,
      accessKeyId: accessKeyId ? `${accessKeyId.substring(0, 8)}...` : 'missing',
      secretAccessKey: secretAccessKey ? `${secretAccessKey.substring(0, 8)}...` : 'missing',
      roleArn: roleArn || 'not provided',
    });

    // Debug: Check for hidden characters or encoding issues
    console.log('Credential lengths:', {
      accessKeyIdLength: accessKeyId ? accessKeyId.length : 0,
      secretAccessKeyLength: secretAccessKey ? secretAccessKey.length : 0,
      expectedAccessKeyLength: 20,
      expectedSecretKeyLength: 40,
    });

    // Debug: Check for whitespace or special characters
    if (accessKeyId) {
      console.log('Access Key ID starts with:', JSON.stringify(accessKeyId.substring(0, 10)));
      console.log('Access Key ID ends with:', JSON.stringify(accessKeyId.substring(-10)));
    }
    if (secretAccessKey) {
      console.log('Secret Key starts with:', JSON.stringify(secretAccessKey.substring(0, 10)));
      console.log('Secret Key ends with:', JSON.stringify(secretAccessKey.substring(-10)));
    }

    // Validate required fields
    if (!accessKeyId || !secretAccessKey || !region || !bucket) {
      return res.status(400).json({ 
        error: 'Missing required fields: accessKeyId, secretAccessKey, region, and bucketName are required' 
      });
    }
    
    bucketName = bucket;
    isInitializing = true;
    
    // If roleArn is provided, assume the role
    if (roleArn) {
      console.log('Assuming role:', roleArn);
      
      // Create STS client with base credentials
      const stsClient = new STSClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      
      // Assume the role
      const assumeRoleCommand = new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: sessionName,
        DurationSeconds: 3600, // 1 hour
      });
      
      const assumeRoleResponse = await stsClient.send(assumeRoleCommand);
      const tempCredentials = assumeRoleResponse.Credentials;
      
      // Create S3 client with temporary credentials
      s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId: tempCredentials.AccessKeyId,
          secretAccessKey: tempCredentials.SecretAccessKey,
          sessionToken: tempCredentials.SessionToken,
        },
      });
      
      console.log('Successfully assumed role and created S3 client');
    } else {
      console.log('Using direct credentials (no role assumption)');
      // Use credentials directly
      s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
    
    // Store the current config and mark initialization as complete
    lastConfig = currentConfig;
    isInitializing = false;
    
    res.json({ success: true, message: 'S3 client initialized successfully' });
  } catch (error) {
    console.error('S3 initialization error:', error);
    isInitializing = false; // Reset flag on error
    res.status(500).json({ error: error.message });
  }
});

// Test connection by listing top-level folders
app.get('/api/s3/test', async (req, res) => {
  try {
    if (!s3Client) {
      return res.status(400).json({ error: 'S3 client not initialized' });
    }
    
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Delimiter: '/',
    });
    
    const response = await s3Client.send(command);
    const folders = [];
    
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
    
    res.json({ 
      success: true, 
      folders: folders.sort((a, b) => a.name.localeCompare(b.name)),
      count: folders.length 
    });
  } catch (error) {
    console.error('S3 test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List folders
app.get('/api/s3/folders', async (req, res) => {
  try {
    if (!s3Client) {
      return res.status(400).json({ error: 'S3 client not initialized' });
    }
    
    const { prefix = '' } = req.query;
    const normalizedPrefix = prefix && !prefix.endsWith('/') ? prefix + '/' : prefix;
    
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: normalizedPrefix,
      Delimiter: '/',
    });
    
    const response = await s3Client.send(command);
    const folders = [];
    
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
    
    res.json(folders.sort((a, b) => a.name.localeCompare(b.name)));
  } catch (error) {
    console.error('List folders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List files
app.get('/api/s3/files', async (req, res) => {
  try {
    if (!s3Client) {
      return res.status(400).json({ error: 'S3 client not initialized' });
    }
    
    const { prefix = '' } = req.query;
    const normalizedPrefix = prefix && !prefix.endsWith('/') ? prefix + '/' : prefix;
    
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: normalizedPrefix,
    });
    
    const response = await s3Client.send(command);
    const files = [];
    
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
    
    res.json(files.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)));
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload file
app.post('/api/s3/upload', upload.single('file'), async (req, res) => {
  try {
    if (!s3Client) {
      return res.status(400).json({ error: 'S3 client not initialized' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const { key } = req.body;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });
    
    await s3Client.send(command);
    res.json({ success: true, message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete file
app.delete('/api/s3/delete', async (req, res) => {
  try {
    if (!s3Client) {
      return res.status(400).json({ error: 'S3 client not initialized' });
    }
    
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'File key is required' });
    }
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    await s3Client.send(command);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate presigned URL
app.post('/api/s3/presigned', async (req, res) => {
  try {
    if (!s3Client) {
      return res.status(400).json({ error: 'S3 client not initialized' });
    }
    
    const { key, expiresIn = 3600 } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'File key is required' });
    }
    
    // Extract filename from key for Content-Disposition header
    const fileName = key.split('/').pop() || 'download';
    
    // Sanitize filename to prevent issues
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${sanitizedFileName}"`,
      ResponseCacheControl: 'no-cache, no-store, must-revalidate',
      ResponseContentType: 'application/octet-stream', // Force download by setting generic binary type
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    console.log(`Generated presigned URL for download: ${fileName}`);
    
    res.json({ url });
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Schema validation endpoint
app.post('/api/schema/validate', upload.fields([
  { name: 'schema', maxCount: 1 },
  { name: 'data', maxCount: 1 }
]), async (req, res) => {
  let schemaFilePath = null;
  let dataFilePath = null;
  
  try {
    if (!req.files || !req.files.schema || !req.files.data) {
      return res.status(400).json({ 
        error: 'Both schema and data files are required' 
      });
    }
    
    const schemaFile = req.files.schema[0];
    const dataFile = req.files.data[0];
    
    // Create temporary files
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    schemaFilePath = path.join(tempDir, `schema_${timestamp}.json`);
    dataFilePath = path.join(tempDir, `data_${timestamp}.json`);
    
    // Write uploaded files to temporary location
    fs.writeFileSync(schemaFilePath, schemaFile.buffer);
    fs.writeFileSync(dataFilePath, dataFile.buffer);
    
    // Call Python validation script
    const pythonScript = path.join(__dirname, 'schema_validator.py');
    const pythonPath = path.join(__dirname, 'venv', 'bin', 'python');
    const pythonProcess = spawn(pythonPath, [pythonScript, schemaFilePath, dataFilePath]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      // Clean up temporary files
      try {
        if (fs.existsSync(schemaFilePath)) fs.unlinkSync(schemaFilePath);
        if (fs.existsSync(dataFilePath)) fs.unlinkSync(dataFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp files:', cleanupError);
      }
      
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          res.json(result);
        } catch (parseError) {
          console.error('Error parsing Python output:', parseError);
          res.status(500).json({ 
            error: 'Failed to parse validation results',
            details: output 
          });
        }
      } else {
        console.error('Python script error:', errorOutput);
        res.status(500).json({ 
          error: 'Schema validation failed',
          details: errorOutput || output 
        });
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      
      // Clean up temporary files
      try {
        if (fs.existsSync(schemaFilePath)) fs.unlinkSync(schemaFilePath);
        if (fs.existsSync(dataFilePath)) fs.unlinkSync(dataFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp files:', cleanupError);
      }
      
      res.status(500).json({ 
        error: 'Failed to execute validation script',
        details: error.message 
      });
    });
    
  } catch (error) {
    console.error('Schema validation error:', error);
    
    // Clean up temporary files
    try {
      if (schemaFilePath && fs.existsSync(schemaFilePath)) fs.unlinkSync(schemaFilePath);
      if (dataFilePath && fs.existsSync(dataFilePath)) fs.unlinkSync(dataFilePath);
    } catch (cleanupError) {
      console.error('Error cleaning up temp files:', cleanupError);
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'S3 API server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 S3 API server running on http://localhost:${PORT}`);
  console.log(`📡 Serving S3 operations for React app on http://localhost:3000`);
}); 