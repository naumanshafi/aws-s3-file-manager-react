require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local'
});

const express = require('express');
const cors = require('cors');
const { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 5001;

// Path for authorized users JSON file
const AUTHORIZED_USERS_FILE = path.join(__dirname, 'data', 'authorized-users.json');

// Path for activity logs JSON file
const ACTIVITY_LOGS_FILE = path.join(__dirname, 'data', 'activity.json');

// Ensure data directory exists
const dataDir = path.dirname(AUTHORIZED_USERS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize authorized users file if it doesn't exist
function initializeAuthorizedUsersFile() {
  if (!fs.existsSync(AUTHORIZED_USERS_FILE)) {
    const defaultUsers = {
      users: [
        {
          email: 'admin@turing.com',
          role: 'admin',
          addedAt: new Date().toISOString(),
          addedBy: 'system'
        }
      ]
    };
    fs.writeFileSync(AUTHORIZED_USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    console.log('✅ Initialized authorized users file with default admin');
  }
}

// Load authorized users from JSON file
function loadAuthorizedUsers() {
  try {
    if (fs.existsSync(AUTHORIZED_USERS_FILE)) {
      const data = fs.readFileSync(AUTHORIZED_USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return { users: [] };
  } catch (error) {
    console.error('❌ Error loading authorized users:', error);
    return { users: [] };
  }
}

// Save authorized users to JSON file
function saveAuthorizedUsers(usersData) {
  try {
    fs.writeFileSync(AUTHORIZED_USERS_FILE, JSON.stringify(usersData, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving authorized users:', error);
    return false;
  }
}

// Initialize activity logs file if it doesn't exist
function initializeActivityLogsFile() {
  if (!fs.existsSync(ACTIVITY_LOGS_FILE)) {
    const defaultActivities = {
      activities: []
    };
    fs.writeFileSync(ACTIVITY_LOGS_FILE, JSON.stringify(defaultActivities, null, 2));
    console.log('✅ Initialized activity logs file');
  }
}

// Load activity logs from JSON file
function loadActivityLogs() {
  try {
    if (fs.existsSync(ACTIVITY_LOGS_FILE)) {
      const data = fs.readFileSync(ACTIVITY_LOGS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return { activities: [] };
  } catch (error) {
    console.error('❌ Error loading activity logs:', error);
    return { activities: [] };
  }
}

// Save activity logs to JSON file
function saveActivityLogs(activityData) {
  try {
    fs.writeFileSync(ACTIVITY_LOGS_FILE, JSON.stringify(activityData, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving activity logs:', error);
    return false;
  }
}

// Helper function to log user activity
function logActivity(userEmail, userName, action, fileName, fileSize, status, details) {
  try {
    const activityData = loadActivityLogs();
    const newActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userEmail,
      userName,
      action, // 'upload', 'download', 'delete'
      fileName,
      fileSize,
      timestamp: new Date().toISOString(),
      status, // 'success', 'failed'
      details
    };
    
    activityData.activities.unshift(newActivity); // Add to beginning
    
    // Keep only the last 1000 activities to prevent file from growing too large
    if (activityData.activities.length > 1000) {
      activityData.activities = activityData.activities.slice(0, 1000);
    }
    
    saveActivityLogs(activityData);
    console.log(`📝 Activity logged: ${userEmail} - ${action} - ${fileName} - ${status}`);
  } catch (error) {
    console.error('❌ Error logging activity:', error);
  }
}

// Middleware to check if user is authorized
function checkUserAuthorization(req, res, next) {
  // For development/testing, allow localhost access
  if (process.env.NODE_ENV !== 'production') {
    req.user = { email: 'admin@turing.com', role: 'admin' };
    return next();
  }

  // In production, check the user's email from Google OAuth
  const userEmail = req.headers['x-user-email']; // This should be set by Google OAuth
  
  if (!userEmail) {
    return res.status(401).json({ 
      error: 'UNAUTHORIZED', 
      message: 'User email not found. Please ensure you are properly authenticated.' 
    });
  }

  const usersData = loadAuthorizedUsers();
  const authorizedUser = usersData.users.find(user => user.email.toLowerCase() === userEmail.toLowerCase());
  
  if (!authorizedUser) {
    return res.status(403).json({ 
      error: 'ACCESS_DENIED', 
      message: 'Your email is not authorized to access this application. Please contact an administrator.' 
    });
  }

  req.user = authorizedUser;
  next();
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'ADMIN_REQUIRED', 
      message: 'Administrator privileges required for this operation.' 
    });
  }
  next();
}

// Initialize authorized users file on startup
initializeAuthorizedUsersFile();

// Initialize activity logs file on startup
initializeActivityLogsFile();

// Log environment and port information
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port source:', process.env.PORT ? 'Environment variable' : 'Default fallback');
console.log('🚪 Selected PORT:', PORT);

// AWS Configuration from environment variables
const AWS_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  roleArn: process.env.AWS_ROLE_ARN,
  bucketName: process.env.AWS_S3_BUCKET_NAME,
  sessionName: process.env.AWS_SESSION_NAME || 'S3FileManagerSession'
};

// Validate required environment variables
const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('Please set the following environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  process.exit(1);
}

console.log('✅ AWS Configuration loaded from environment variables');
console.log('📋 Configuration:', {
  region: AWS_CONFIG.region,
  bucketName: AWS_CONFIG.bucketName,
  roleArn: AWS_CONFIG.roleArn ? 'Configured' : 'Not set',
  accessKeyId: AWS_CONFIG.accessKeyId ? `${AWS_CONFIG.accessKeyId.substring(0, 8)}...` : 'Missing'
});

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS with dynamic origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'http://104.198.177.87:5000', 
      'http://104.198.177.87', 
      'https://104.198.177.87:5000',
      'https://104.198.177.87'
    ]
  : [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000'
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email']
}));

app.use(express.json());

// Serve static files from React build directory
app.use(express.static(path.join(__dirname, 'build')));

let s3Client = null;
let bucketName = AWS_CONFIG.bucketName;
let tokenExpirationTime = null;
let isInitialized = false;

// Helper function to check if tokens are expired
function areTokensExpired() {
  if (!tokenExpirationTime) return false;
  return Date.now() > tokenExpirationTime;
}

// Helper function to handle expired token errors
function handleExpiredTokenError(res, error) {
  if (error.name === 'TokenRefreshRequired' || 
      error.message.includes('token has expired') || 
      error.message.includes('security token included in the request is expired') ||
      error.Code === 'TokenRefreshRequired' ||
      error.Code === 'ExpiredToken' ||
      areTokensExpired()) {
    console.log('🔒 Tokens have expired, reinitializing...');
    s3Client = null;
    isInitialized = false;
    return res.status(401).json({ 
      error: 'TOKEN_EXPIRED',
      message: 'Session has expired. Reinitializing...',
      expired: true 
    });
  }
  return null; // Not an expired token error
}

// Initialize S3 client with environment variables
async function initializeS3Client() {
  if (isInitialized && s3Client && !areTokensExpired()) {
    console.log('✅ Using existing S3 client');
    return true;
  }

  try {
    console.log('🔄 Initializing S3 client...');
    
    // If roleArn is provided, assume the role
    if (AWS_CONFIG.roleArn) {
      console.log('🔐 Assuming role:', AWS_CONFIG.roleArn);
      
      // Create STS client with base credentials
      const stsClient = new STSClient({
        region: AWS_CONFIG.region,
        credentials: {
          accessKeyId: AWS_CONFIG.accessKeyId,
          secretAccessKey: AWS_CONFIG.secretAccessKey,
        },
      });
      
      // Try different session durations starting with the shortest
      const durations = [900, 1800, 3600]; // 15 min, 30 min, 1 hour
      let assumeRoleResponse = null;
      let lastError = null;
      
      for (const duration of durations) {
        try {
          console.log(`⏱️ Trying to assume role with ${duration} seconds duration...`);
          const assumeRoleCommand = new AssumeRoleCommand({
            RoleArn: AWS_CONFIG.roleArn,
            RoleSessionName: AWS_CONFIG.sessionName,
            DurationSeconds: duration,
          });
          
          assumeRoleResponse = await stsClient.send(assumeRoleCommand);
          console.log(`✅ Successfully assumed role with ${duration} seconds duration`);
          
          // Store token expiration time
          tokenExpirationTime = Date.now() + (duration * 1000);
          console.log('🕒 Tokens will expire at:', new Date(tokenExpirationTime).toISOString());
          break;
        } catch (error) {
          console.log(`❌ Failed with ${duration} seconds:`, error.message);
          lastError = error;
          if (!error.message.includes('DurationSeconds exceeds')) {
            // If it's not a duration error, no point trying other durations
            throw error;
          }
        }
      }
      
      if (!assumeRoleResponse) {
        console.error('❌ Failed to assume role with any duration');
        throw lastError || new Error('Failed to assume role');
      }
      
      const tempCredentials = assumeRoleResponse.Credentials;
      
      // Create S3 client with temporary credentials
      s3Client = new S3Client({
        region: AWS_CONFIG.region,
        credentials: {
          accessKeyId: tempCredentials.AccessKeyId,
          secretAccessKey: tempCredentials.SecretAccessKey,
          sessionToken: tempCredentials.SessionToken,
        },
      });
      
      console.log('✅ Successfully created S3 client with assumed role');
    } else {
      console.log('🔑 Using direct credentials (no role assumption)');
      // Clear token expiration since we're using permanent credentials
      tokenExpirationTime = null;
      
      // Use credentials directly
      s3Client = new S3Client({
        region: AWS_CONFIG.region,
        credentials: {
          accessKeyId: AWS_CONFIG.accessKeyId,
          secretAccessKey: AWS_CONFIG.secretAccessKey,
        },
      });
    }
    
    isInitialized = true;
    console.log('🚀 S3 client initialization completed successfully');
    return true;
  } catch (error) {
    console.error('❌ S3 initialization error:', error);
    s3Client = null;
    isInitialized = false;
    throw error;
  }
}

// Middleware to ensure S3 client is initialized
async function ensureS3Client(req, res, next) {
  try {
    if (!isInitialized || areTokensExpired()) {
      await initializeS3Client();
    }
    next();
  } catch (error) {
    console.error('❌ Failed to initialize S3 client:', error);
    res.status(500).json({ 
      error: 'AWS_INITIALIZATION_FAILED',
      message: 'Failed to initialize AWS connection. Please check server configuration.',
      details: error.message 
    });
  }
}

// Initialize S3 client on server startup
initializeS3Client().catch(error => {
  console.error('❌ Failed to initialize S3 client on startup:', error);
});

// Get current configuration endpoint
app.get('/api/s3/config', (req, res) => {
  res.json({
    bucketName: AWS_CONFIG.bucketName,
    region: AWS_CONFIG.region,
    hasRole: !!AWS_CONFIG.roleArn,
    isInitialized,
    tokenExpires: tokenExpirationTime ? new Date(tokenExpirationTime).toISOString() : null
  });
});

// Test connection by listing top-level folders
app.get('/api/s3/test', ensureS3Client, async (req, res) => {
  try {
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
    
    // Check if this is an expired token error
    const expiredResponse = handleExpiredTokenError(res, error);
    if (expiredResponse) return expiredResponse;
    
    res.status(500).json({ error: error.message });
  }
});

// List folders
app.get('/api/s3/folders', ensureS3Client, async (req, res) => {
  try {
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
    
    // Check if this is an expired token error
    const expiredResponse = handleExpiredTokenError(res, error);
    if (expiredResponse) return expiredResponse;
    
    res.status(500).json({ error: error.message });
  }
});

// List files
app.get('/api/s3/files', ensureS3Client, async (req, res) => {
  try {
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
    
    // Check if this is an expired token error
    const expiredResponse = handleExpiredTokenError(res, error);
    if (expiredResponse) return expiredResponse;
    
    res.status(500).json({ error: error.message });
  }
});

// Upload file
app.post('/api/s3/upload', checkUserAuthorization, ensureS3Client, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const { key } = req.body;
    const fileName = key.split('/').pop() || req.file.originalname || 'unknown-file';
    const fileSize = `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });
    
    await s3Client.send(command);
    
    // Log successful upload activity
    logActivity(
      req.user.email,
      req.user.name || req.user.email,
      'upload',
      fileName,
      fileSize,
      'success',
      `File uploaded to ${key}`
    );
    
    res.json({ success: true, message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Log failed upload activity
    const fileName = req.body?.key?.split('/').pop() || req.file?.originalname || 'unknown-file';
    const fileSize = req.file ? `${(req.file.size / (1024 * 1024)).toFixed(2)} MB` : 'unknown';
    
    logActivity(
      req.user?.email || 'unknown',
      req.user?.name || req.user?.email || 'unknown',
      'upload',
      fileName,
      fileSize,
      'failed',
      `Upload failed: ${error.message}`
    );
    
    // Check if this is an expired token error
    const expiredResponse = handleExpiredTokenError(res, error);
    if (expiredResponse) return expiredResponse;
    
    res.status(500).json({ error: error.message });
  }
});

// Delete file
app.delete('/api/s3/delete', checkUserAuthorization, ensureS3Client, async (req, res) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'File key is required' });
    }
    
    const fileName = key.split('/').pop() || 'unknown-file';
    
    // Get file size before deletion (optional - we could skip this to avoid extra API call)
    let fileSize = 'unknown';
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      const headResponse = await s3Client.send(headCommand);
      fileSize = `${(headResponse.ContentLength / (1024 * 1024)).toFixed(2)} MB`;
    } catch (headError) {
      console.log('Could not get file size before deletion:', headError.message);
    }
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    await s3Client.send(command);
    
    // Log successful delete activity
    logActivity(
      req.user.email,
      req.user.name || req.user.email,
      'delete',
      fileName,
      fileSize,
      'success',
      `File deleted from ${key}`
    );
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    
    // Log failed delete activity
    const fileName = req.body?.key?.split('/').pop() || 'unknown-file';
    
    logActivity(
      req.user?.email || 'unknown',
      req.user?.name || req.user?.email || 'unknown',
      'delete',
      fileName,
      'unknown',
      'failed',
      `Delete failed: ${error.message}`
    );
    
    // Check if this is an expired token error
    const expiredResponse = handleExpiredTokenError(res, error);
    if (expiredResponse) return expiredResponse;
    
    res.status(500).json({ error: error.message });
  }
});

// Generate presigned URL
app.post('/api/s3/presigned', checkUserAuthorization, ensureS3Client, async (req, res) => {
  try {
    const { key, expiresIn = 3600 } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'File key is required' });
    }
    
    // Extract filename from key for Content-Disposition header
    const fileName = key.split('/').pop() || 'download';
    
    // Get file size for logging
    let fileSize = 'unknown';
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      const headResponse = await s3Client.send(headCommand);
      fileSize = `${(headResponse.ContentLength / (1024 * 1024)).toFixed(2)} MB`;
    } catch (headError) {
      console.log('Could not get file size for download logging:', headError.message);
    }
    
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
    
    // Log successful download activity
    logActivity(
      req.user.email,
      req.user.name || req.user.email,
      'download',
      fileName,
      fileSize,
      'success',
      `Download URL generated for ${key} (expires in ${expiresIn}s)`
    );
    
    res.json({ url });
  } catch (error) {
    console.error('Presigned URL error:', error);
    
    // Log failed download activity
    const fileName = req.body?.key?.split('/').pop() || 'unknown-file';
    
    logActivity(
      req.user?.email || 'unknown',
      req.user?.name || req.user?.email || 'unknown',
      'download',
      fileName,
      'unknown',
      'failed',
      `Download URL generation failed: ${error.message}`
    );
    
    // Check if this is an expired token error
    const expiredResponse = handleExpiredTokenError(res, error);
    if (expiredResponse) return expiredResponse;
    
    res.status(500).json({ error: error.message });
  }
});

// Log download activity
app.post('/api/s3/activities/log-download', checkUserAuthorization, async (req, res) => {
  try {
    const { fileName, fileSize, fileKey, status = 'success', details } = req.body;
    
    if (!fileName || !fileKey) {
      return res.status(400).json({ error: 'fileName and fileKey are required' });
    }
    
    // Log the download activity
    logActivity(
      req.user.email,
      req.user.name || req.user.email,
      'download',
      fileName,
      fileSize || 'unknown',
      status,
      details || `File downloaded: ${fileKey}`
    );
    
    res.json({ success: true, message: 'Download activity logged successfully' });
  } catch (error) {
    console.error('Log download activity error:', error);
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

// ============================================
// USER MANAGEMENT API ENDPOINTS
// ============================================

// Get authorized users list
app.get('/api/users/authorized', checkUserAuthorization, (req, res) => {
  try {
    const usersData = loadAuthorizedUsers();
    
    res.json({
      users: usersData.users.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)),
      currentUser: {
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('❌ Error fetching authorized users:', error);
    res.status(500).json({ 
      error: 'FETCH_USERS_FAILED', 
      message: 'Failed to fetch authorized users list.' 
    });
  }
});

// Add new authorized user
app.post('/api/users/authorized', checkUserAuthorization, requireAdmin, (req, res) => {
  try {
    const { email, role } = req.body;
    
    if (!email || !email.trim()) {
      return res.status(400).json({ 
        error: 'INVALID_EMAIL', 
        message: 'Email address is required.' 
      });
    }
    
    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ 
        error: 'INVALID_ROLE', 
        message: 'Role must be either "admin" or "user".' 
      });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    const usersData = loadAuthorizedUsers();
    
    // Check if user already exists
    const existingUser = usersData.users.find(user => user.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'USER_EXISTS', 
        message: 'User with this email already exists.' 
      });
    }
    
    // Add new user
    const newUser = {
      email: normalizedEmail,
      role,
      addedAt: new Date().toISOString(),
      addedBy: req.user.email
    };
    
    usersData.users.push(newUser);
    
    if (!saveAuthorizedUsers(usersData)) {
      return res.status(500).json({ 
        error: 'SAVE_FAILED', 
        message: 'Failed to save user to authorized users list.' 
      });
    }
    
    console.log(`✅ User added: ${normalizedEmail} (${role}) by ${req.user.email}`);
    res.json({ 
      success: true, 
      message: 'User added successfully.',
      user: newUser
    });
    
  } catch (error) {
    console.error('❌ Error adding user:', error);
    res.status(500).json({ 
      error: 'ADD_USER_FAILED', 
      message: 'Failed to add user to authorized users list.' 
    });
  }
});

// Update user role
app.put('/api/users/authorized/:email', checkUserAuthorization, requireAdmin, (req, res) => {
  try {
    const targetEmail = decodeURIComponent(req.params.email).toLowerCase();
    const { role } = req.body;
    
    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ 
        error: 'INVALID_ROLE', 
        message: 'Role must be either "admin" or "user".' 
      });
    }
    
    const usersData = loadAuthorizedUsers();
    const userIndex = usersData.users.findIndex(user => user.email.toLowerCase() === targetEmail);
    
    if (userIndex === -1) {
      return res.status(404).json({ 
        error: 'USER_NOT_FOUND', 
        message: 'User not found in authorized users list.' 
      });
    }
    
    // Prevent admins from removing their own admin privileges
    if (targetEmail === req.user.email.toLowerCase() && role !== 'admin') {
      return res.status(400).json({ 
        error: 'CANNOT_DEMOTE_SELF', 
        message: 'You cannot remove your own administrator privileges.' 
      });
    }
    
    usersData.users[userIndex].role = role;
    
    if (!saveAuthorizedUsers(usersData)) {
      return res.status(500).json({ 
        error: 'SAVE_FAILED', 
        message: 'Failed to update user role.' 
      });
    }
    
    console.log(`✅ User role updated: ${targetEmail} -> ${role} by ${req.user.email}`);
    res.json({ 
      success: true, 
      message: 'User role updated successfully.',
      user: usersData.users[userIndex]
    });
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ 
      error: 'UPDATE_USER_FAILED', 
      message: 'Failed to update user role.' 
    });
  }
});

// Delete authorized user
app.delete('/api/users/authorized/:email', checkUserAuthorization, requireAdmin, (req, res) => {
  try {
    const targetEmail = decodeURIComponent(req.params.email).toLowerCase();
    
    // Prevent admins from deleting their own account
    if (targetEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({ 
        error: 'CANNOT_DELETE_SELF', 
        message: 'You cannot delete your own account.' 
      });
    }
    
    const usersData = loadAuthorizedUsers();
    const userIndex = usersData.users.findIndex(user => user.email.toLowerCase() === targetEmail);
    
    if (userIndex === -1) {
      return res.status(404).json({ 
        error: 'USER_NOT_FOUND', 
        message: 'User not found in authorized users list.' 
      });
    }
    
    const deletedUser = usersData.users.splice(userIndex, 1)[0];
    
    if (!saveAuthorizedUsers(usersData)) {
      return res.status(500).json({ 
        error: 'SAVE_FAILED', 
        message: 'Failed to delete user from authorized users list.' 
      });
    }
    
    console.log(`✅ User deleted: ${targetEmail} by ${req.user.email}`);
    res.json({ 
      success: true, 
      message: 'User deleted successfully.',
      deletedUser: deletedUser
    });
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ 
      error: 'DELETE_USER_FAILED', 
      message: 'Failed to delete user from authorized users list.' 
    });
  }
});

// ============================================
// ACTIVITY LOGS API ENDPOINTS
// ============================================

// Get activity logs (admin only)
app.get('/api/activities', checkUserAuthorization, requireAdmin, (req, res) => {
  try {
    const activityData = loadActivityLogs();
    const activities = activityData.activities || [];
    
    // Calculate statistics
    const stats = {
      totalUploads: activities.filter(a => a.action === 'upload').length,
      totalDownloads: activities.filter(a => a.action === 'download').length,
      totalDeletes: activities.filter(a => a.action === 'delete').length,
      totalUsers: new Set(activities.map(a => a.userEmail)).size,
    };
    
    res.json({
      activities: activities.slice(0, 100), // Return last 100 activities
      totalCount: activities.length,
      stats
    });
  } catch (error) {
    console.error('❌ Error fetching activities:', error);
    res.status(500).json({ 
      error: 'FETCH_ACTIVITIES_FAILED', 
      message: 'Failed to fetch activity logs.' 
    });
  }
});

// ============================================
// EXISTING S3 API ENDPOINTS
// ============================================

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 S3 API server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Accessible at http://104.198.177.87:${PORT}`);
}); 