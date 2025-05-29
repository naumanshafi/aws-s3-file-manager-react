# AWS S3 File Manager with JSON Schema Validation

A modern, professional React application for managing AWS S3 files with a beautiful Material-UI interface. Features include file upload/download, browsing, deletion, and **JSON Schema Validation** powered by Python backend.

## 🚀 Features

- 📁 **Complete File Management**: Upload, download, browse, and delete files in S3
- ✅ **JSON Schema Validation**: Validate JSON data against schemas with detailed error reporting
- 🎨 **Modern UI**: Beautiful Material-UI interface with responsive design
- 🔄 **Real-time Updates**: Live progress tracking and instant feedback
- 🐍 **Python Backend**: Robust schema validation using jsonschema library
- 📊 **Smart Organization**: Project-based folder structure with date organization
- 🔒 **Secure**: AWS IAM role support and credential management
- 📱 **Mobile Friendly**: Responsive design that works on all devices

## 📋 Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.8+ with pip
- **AWS Account** with S3 access
- **AWS Credentials** (CLI, environment variables, or IAM roles)

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd aws-s3-file-manager-react
npm install
```

### 2. Python Environment Setup

```bash
# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install jsonschema
```

### 3. Environment Configuration (Optional)

Create a `.env` file in the root directory:
```env
REACT_APP_S3_BUCKET_NAME=your-bucket-name
REACT_APP_AWS_REGION=us-east-1
REACT_APP_AWS_ACCESS_KEY_ID=your-access-key
REACT_APP_AWS_SECRET_ACCESS_KEY=your-secret-key
```

### 4. Start the Application

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend Development Server:**
```bash
npm start
```

**Open your browser:**
Navigate to `http://localhost:3000`

## 🎯 Application Architecture

The application consists of two main components:

- **Frontend (React)**: Runs on `http://localhost:3000`
- **Backend (Node.js + Python)**: Runs on `http://localhost:3001`

The backend handles S3 operations and schema validation by calling Python scripts.

## 📖 Complete Usage Guide

### 🔧 Initial Configuration

1. **Open the application** at `http://localhost:3000`
2. **Enter AWS credentials** in the configuration screen:
   - AWS Access Key ID
   - AWS Secret Access Key
   - AWS Region (e.g., `us-east-1`)
   - S3 Bucket Name
   - IAM Role ARN (optional)

### 📁 File Management Features

#### 1. **Upload Files**
- Navigate to the **Upload** tab
- Select a project folder from the dropdown
- Choose or create a date folder
- **Drag & drop files** or click to select
- Monitor **real-time upload progress**
- Files are organized in: `bucket/project/inputData/date/annotation_inputs/input_files/`

#### 2. **Download Files**
- Go to the **Download** tab
- Select project and date folder
- Browse available files in the inputData directory
- Click **download button** for instant file download
- Files maintain their original names and structure

#### 3. **Browse S3 Bucket**
- Use the **Browse** tab for complete bucket exploration
- Navigate through folders with **breadcrumb navigation**
- View detailed file information:
  - File size (formatted: KB, MB, GB)
  - Last modified date
  - File type and extension
- **Real-time folder and file listing**

#### 4. **Delete Files**
- Access the **Delete** tab
- Select project and date for outputData
- View files available for deletion
- **Confirm deletion** with safety warnings
- Immediate UI updates after successful deletion

### ✅ JSON Schema Validation

The **Schema Validation** tab provides powerful JSON validation capabilities:

#### **How to Use Schema Validation:**

1. **Navigate to Schema Validation tab**
2. **Upload Schema File (.json)**:
   - Drag & drop or click to select your JSON schema file
   - Schema should contain `outputDataDefinition.outputSchema` structure
   - Supports JSON Schema Draft 4 format

3. **Upload Data File (.json)**:
   - Upload the JSON data file you want to validate
   - File should contain a `workitems` array
   - Each item in the array will be validated against the schema

4. **Run Validation**:
   - Click **"Validate Schema"** button
   - View real-time validation progress
   - Get detailed results with error reporting

#### **Validation Results:**

- ✅ **Success**: Shows total items validated successfully
- ❌ **Errors**: Detailed error messages for each invalid item
- 📊 **Summary**: Total items, valid count, invalid count
- 🔍 **Error Details**: Expandable section with:
  - Item index with validation errors
  - Specific error messages (e.g., "metadata is a required property")
  - JSON path information
  - Schema validation keywords

#### **Schema Validation Features:**

- **Regex Pattern Fixing**: Automatically fixes double-escaped regex patterns
- **Detailed Error Reporting**: Shows exactly which items fail and why
- **Item-by-Item Validation**: Validates each item in the `workitems` array
- **Python-Powered**: Uses robust `jsonschema` library for accurate validation
- **Error Categorization**: Groups errors by type and provides clear messages

## 🏗️ S3 Bucket Structure

The application expects this folder structure:

```
your-s3-bucket/
├── project1/
│   ├── inputData/
│   │   └── 2024-01-15/
│   │       └── annotation_inputs/
│   │           └── input_files/
│   │               ├── file1.json
│   │               └── file2.pdf
│   └── outputData/
│       └── 2024-01-15/
│           ├── results.json
│           └── processed_data.csv
├── project2/
│   ├── inputData/
│   └── outputData/
└── schema-validation/
    ├── schemas/
    │   └── my-schema.json
    └── data/
        └── validation-data.json
```

## 🔧 AWS Configuration Options

### 1. **Environment Variables** (Development)
```env
REACT_APP_AWS_ACCESS_KEY_ID=AKIA...
REACT_APP_AWS_SECRET_ACCESS_KEY=secret...
REACT_APP_AWS_SESSION_TOKEN=token...  # For temporary credentials
REACT_APP_AWS_REGION=us-east-1
REACT_APP_S3_BUCKET_NAME=my-bucket
```

### 2. **AWS CLI Configuration**
```bash
aws configure --profile my-profile
aws configure set region us-east-1 --profile my-profile
```

### 3. **IAM Roles** (Production)
- Recommended for EC2, Lambda, or other AWS services
- Automatic credential management
- Enhanced security with temporary credentials

### 4. **Manual Configuration**
- Enter credentials directly in the app's configuration screen
- Supports session tokens for temporary access
- Real-time credential validation

## 💻 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI) v5** for beautiful UI components
- **React Query** for efficient data fetching and caching
- **react-dropzone** for drag & drop file uploads
- **AWS SDK v3** for S3 operations

### Backend
- **Node.js** with Express for API server
- **Python 3.8+** for schema validation
- **jsonschema** library for robust JSON validation
- **Multer** for file upload handling

## 📁 Project Structure

```
aws-s3-file-manager-react/
├── src/
│   ├── components/
│   │   ├── tabs/
│   │   │   ├── UploadTab.tsx
│   │   │   ├── DownloadTab.tsx
│   │   │   ├── BrowseTab.tsx
│   │   │   ├── DeleteTab.tsx
│   │   │   └── SchemaValidationTab.tsx  # New!
│   │   ├── S3Dashboard.tsx
│   │   ├── S3ConfigSetup.tsx
│   │   ├── FileUpload.tsx
│   │   └── FileList.tsx
│   ├── contexts/
│   │   └── S3ConfigContext.tsx
│   ├── hooks/
│   │   └── useS3.ts
│   ├── services/
│   │   └── s3Service.ts
│   └── types/
│       └── index.ts
├── venv/                    # Python virtual environment
├── schema_validator.py      # Python validation script
├── server.js               # Backend API server
├── package.json
└── README.md
```

## 🚀 Development

### Available Scripts

```bash
npm start          # Start React development server (port 3000)
npm run server     # Start backend API server (port 3001)
npm run build      # Build for production
npm test           # Run tests
```

### Development Workflow

1. **Start backend server**: `npm run server`
2. **Start frontend**: `npm start` (in another terminal)
3. **Make changes** to React components or Python validation
4. **Test schema validation** with your JSON files
5. **Commit changes**: `git add . && git commit -m "Your message"`

## 🔒 Security Best Practices

- ✅ **Never commit AWS credentials** to version control
- ✅ **Use IAM roles** with minimal required permissions
- ✅ **Implement proper CORS** settings on S3 buckets
- ✅ **Use HTTPS** in production environments
- ✅ **Validate file types** before upload
- ✅ **Set appropriate bucket policies** for access control

### Required IAM Permissions

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
```

## 🚀 Production Deployment

### 1. Build the Application
```bash
npm run build
```

### 2. Deploy Frontend
- Upload `build/` folder to S3 static hosting
- Configure CloudFront for global CDN
- Set up custom domain with Route 53

### 3. Deploy Backend
- Deploy Node.js server to EC2, ECS, or Lambda
- Ensure Python environment is available
- Configure environment variables for production

### 4. Environment Variables (Production)
```env
NODE_ENV=production
REACT_APP_S3_BUCKET_NAME=production-bucket
REACT_APP_AWS_REGION=us-east-1
REACT_APP_API_URL=https://api.yourdomain.com
```

## 🚀 Automated Deployment (CI/CD)

This project includes automated deployment using GitHub Actions and PM2 for process management.

### 🔧 Prerequisites for Automated Deployment

1. **GCP VM or any Linux server** with SSH access
2. **GitHub repository** for your code
3. **SSH key pair** for server access

### 📋 Step 1: Server Setup

1. **Copy the setup script to your server:**
```bash
scp setup-server.sh ubuntu@your-server-ip:~/
```

2. **Run the setup script on your server:**
```bash
ssh ubuntu@your-server-ip
chmod +x setup-server.sh
./setup-server.sh
```

This script will:
- Install Node.js 18.x
- Install PM2 globally
- Install Git
- Configure firewall (ports 22, 3000, 5000)
- Set up PM2 startup scripts

### 📋 Step 2: GitHub Repository Setup

1. **Create a GitHub repository** and push your code:
```bash
cd aws-s3-file-manager-react
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/aws-s3-file-manager-react.git
git push -u origin main
```

2. **Add GitHub Secrets** for deployment (in your GitHub repo: Settings → Secrets and variables → Actions):
   - `HOST`: `104.198.177.87` (your server IP)
   - `USERNAME`: `ubuntu`
   - `PORT`: `22`
   - `PRIVATE_KEY`: Your private SSH key content (the one that pairs with your public key)

### 📋 Step 3: Clone Repository on Server

```bash
ssh ubuntu@your-server-ip
git clone https://github.com/yourusername/aws-s3-file-manager-react.git
cd aws-s3-file-manager-react
npm install
pm2 start ecosystem.config.js
pm2 save
```

### 🤖 How Automated Deployment Works

Once set up, every push to the `main` branch will:

1. **Build** the application
2. **Deploy** to your server via SSH
3. **Install** dependencies
4. **Restart** the application using PM2
5. **Verify** the deployment health

The GitHub Actions workflow (`.github/workflows/deploy.yml`) handles this automatically.

### 📋 Manual Deployment Script

For manual deployments, use the included deployment script:

```bash
# Make script executable (first time only)
chmod +x deploy.sh

# Deploy to server
./deploy.sh
```

The deployment script will:
- 📦 Build the application locally
- 📤 Upload files to the server (excluding node_modules)
- 🔧 Install production dependencies
- 🔄 Restart the application with PM2
- 🏥 Check application health

### 🔍 PM2 Process Management

**View application status:**
```bash
ssh ubuntu@your-server-ip "pm2 status"
```

**View application logs:**
```bash
ssh ubuntu@your-server-ip "pm2 logs s3-file-manager"
```

**Restart application manually:**
```bash
ssh ubuntu@your-server-ip "pm2 restart s3-file-manager"
```

**Stop application:**
```bash
ssh ubuntu@your-server-ip "pm2 stop s3-file-manager"
```

### 🌐 Access Your Application

After successful deployment, your application will be available at:
- **Backend API**: `http://your-server-ip:5000`
- **Frontend**: You may need to set up a reverse proxy (nginx) to serve the React build files

### 🔧 Setting up Nginx (Recommended)

1. **Install Nginx on your server:**
```bash
ssh ubuntu@your-server-ip
sudo apt install nginx -y
```

2. **Create Nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/s3-file-manager
```

3. **Add this configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com your-server-ip;

    # Serve React build files
    location / {
        root /home/ubuntu/aws-s3-file-manager-react/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/s3-file-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 🔒 SSL Setup (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

### 📊 Deployment Monitoring

Monitor your deployment with these commands:

```bash
# Check application health
curl http://your-server-ip:5000/health

# Monitor PM2 processes
ssh ubuntu@your-server-ip "pm2 monit"

# Check system resources
ssh ubuntu@your-server-ip "htop"
```

### 🔄 Rollback Strategy

If deployment fails, you can quickly rollback:

```bash
ssh ubuntu@your-server-ip
cd aws-s3-file-manager-react
git log --oneline -5  # See recent commits
git checkout PREVIOUS_COMMIT_HASH
npm install
pm2 restart s3-file-manager
```

### 🚨 Deployment Troubleshooting

**Common deployment issues:**

1. **SSH Connection Failed**: Check if your SSH key is correctly added to GitHub secrets
2. **PM2 Process Not Starting**: Check logs with `pm2 logs s3-file-manager`
3. **Build Failures**: Ensure all dependencies are installed locally
4. **Permission Denied**: Check file permissions on the server

**Debug deployment:**
```bash
# Check GitHub Actions logs in your repository
# Monitor server logs during deployment
ssh ubuntu@your-server-ip "tail -f ~/aws-s3-file-manager-react/logs/combined.log"
```

## 🐛 Troubleshooting

### Common Issues

#### **CORS Errors**
```json
// Add to S3 bucket CORS configuration
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
        "ExposeHeaders": []
    }
]
```

#### **Schema Validation Errors**
- ✅ Ensure Python virtual environment is activated
- ✅ Check that `jsonschema` is installed: `pip list | grep jsonschema`
- ✅ Verify schema file has correct structure with `outputDataDefinition.outputSchema`
- ✅ Confirm data file contains `workitems` array

#### **Backend Connection Issues**
- ✅ Verify backend server is running on port 3001
- ✅ Check that both frontend and backend are running
- ✅ Ensure no firewall blocking local connections

#### **AWS Permission Issues**
- ✅ Verify IAM policies allow required S3 operations
- ✅ Check bucket policies and access control
- ✅ Confirm credentials are valid and not expired

### Debug Mode

Enable detailed logging:
```env
REACT_APP_DEBUG=true
NODE_ENV=development
```

## 📝 API Endpoints

The backend server provides these endpoints:

- `GET /health` - Health check
- `POST /api/s3/configure` - Configure S3 credentials
- `GET /api/s3/folders` - List top-level folders
- `POST /api/s3/upload` - Upload files
- `GET /api/s3/files` - List files
- `DELETE /api/s3/delete` - Delete files
- `POST /api/schema/validate` - **Validate JSON schema** 🆕

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:

- 📖 **Check this README** for comprehensive instructions
- 🐛 **Review troubleshooting section** for common issues
- 📚 **Consult AWS S3 documentation** for AWS-specific problems
- 🎫 **Open an issue** on GitHub for bugs or feature requests
- 💬 **Start a discussion** for general questions

## 🎉 What's New

### Latest Features
- ✅ **JSON Schema Validation Tab** - Validate JSON data against schemas
- ✅ **Python Backend Integration** - Robust validation using jsonschema
- ✅ **Detailed Error Reporting** - Item-by-item validation results
- ✅ **Improved Error Handling** - Better frontend/backend error management
- ✅ **Material-UI Icon Fixes** - Resolved all icon import issues

---

**Happy file managing and schema validating! 🚀**
# Server configured for port 5000
