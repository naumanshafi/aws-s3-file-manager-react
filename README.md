# AWS S3 File Manager with Google OAuth

A modern, enterprise-grade React application for managing AWS S3 files with Google OAuth authentication and server-managed AWS configuration. Features include file upload/download, browsing, deletion, and JSON Schema validation with a beautiful Material-UI interface.

## 🚀 Features

- 🔐 **Google OAuth Authentication**: Secure sign-in with enterprise Google accounts
- 📁 **Complete File Management**: Upload, download, browse, and delete files in S3
- ✅ **JSON Schema Validation**: Validate JSON data against schemas with detailed error reporting
- 🎨 **Modern UI**: Beautiful Material-UI interface with responsive design
- 🔄 **Real-time Status**: Live AWS connection monitoring and progress tracking
- 🐍 **Python Backend**: Robust schema validation using jsonschema library
- 📊 **Smart Organization**: Project-based folder structure with date organization
- 🔒 **Enterprise Security**: Server-managed AWS credentials and IAM role support
- 📱 **Mobile Friendly**: Responsive design that works on all devices
- 🚀 **Production Ready**: Full CI/CD pipeline with nginx, SSL, and PM2

## 🌐 Live Application

**Production URL**: [https://s3manager.turing.com](https://s3manager.turing.com)

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+ with pip
- **AWS Account** with S3 access and IAM role
- **Google OAuth 2.0** client configuration

## 🛠️ Quick Start

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/your-username/aws-s3-file-manager-react.git
cd aws-s3-file-manager-react/aws-s3-file-manager-react
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

### 3. Local Development Setup

For local development, create a `.env` file:
```bash
# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID
REACT_APP_API_URL=http://localhost:5001/api
PORT=3000
BACKEND_PORT=5001

# AWS Configuration (backend only)
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/your-role-name
```

### 4. Start the Application

**Terminal 1 - Backend Server:**
```bash
npm run dev
```

**Terminal 2 - Frontend Development Server:**
```bash
npm start
```

**Open your browser:**
Navigate to `http://localhost:3000`

## 🔐 Authentication & Configuration

### Google OAuth Setup

The application uses Google OAuth for authentication. For local development:

1. **Configure Google Cloud Console**:
   - Add `http://localhost:3000` to authorized origins
   - Add `http://localhost:3000` to authorized redirect URIs

2. **Use Test Mode**: Click "Test Mode (Development Only)" button for immediate access during local development

### Server-Managed AWS Configuration

AWS credentials are now managed on the server for enhanced security:

- ✅ **No client-side credential exposure**
- ✅ **Automatic IAM role token refresh**
- ✅ **Environment-based configuration**
- ✅ **Real-time connection monitoring**

## 🎯 Application Architecture

### Development Environment
```
Browser → React Dev Server (Port 3000) → Node.js Backend (Port 5001) → AWS S3
```

### Production Environment
```
Internet → nginx (Port 443) → Static React Files + Node.js Backend → AWS S3
                             ↓
                    Google OAuth Authentication
```

## 📖 Usage Guide

### 🔧 Getting Started

1. **Sign In**: Use Google OAuth or Test Mode (local development)
2. **Check Status**: View AWS S3 connection status on the dashboard
3. **Manage Files**: Upload, download, browse, and delete files
4. **Validate Schemas**: Use JSON schema validation for data integrity

### 📁 File Management Features

#### 1. **Upload Files**
- Navigate to the **Upload** tab
- Select a project folder from the dropdown
- Choose or create a date folder
- **Drag & drop files** or click to select
- Monitor **real-time upload progress**

#### 2. **Download Files**
- Go to the **Download** tab
- Select project and date folder
- Browse available files
- Click **download button** for instant file download

#### 3. **Browse S3 Bucket**
- Use the **Browse** tab for complete bucket exploration
- Navigate through folders with **breadcrumb navigation**
- View detailed file information (size, date, type)

#### 4. **Delete Files**
- Access the **Delete** tab
- Select project and date for outputData
- View files available for deletion
- **Confirm deletion** with safety warnings

### ✅ JSON Schema Validation

The **Schema Validation** tab provides powerful JSON validation:

1. **Upload Schema File (.json)**
2. **Upload Data File (.json)**
3. **Run Validation** and view detailed results
4. **Review Errors** with specific item-by-item feedback

## 🏗️ S3 Bucket Structure

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

## 💻 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI) v5** for enterprise UI
- **Google OAuth 2.0** for authentication
- **AWS SDK v3** for S3 operations
- **React Query** for data management

### Backend
- **Node.js** with Express
- **Python 3.8+** for schema validation
- **PM2** for process management
- **Multer** for file handling

### Infrastructure
- **nginx** reverse proxy with SSL
- **Let's Encrypt** SSL certificates
- **Ubuntu Server** deployment
- **GitHub Actions** CI/CD pipeline

## 📁 Project Structure

```
aws-s3-file-manager-react/
├── src/
│   ├── components/
│   │   ├── tabs/                    # Feature tabs
│   │   ├── S3ConfigSetup.tsx        # Google OAuth component
│   │   ├── S3StatusPanel.tsx        # AWS status dashboard
│   │   ├── S3Dashboard.tsx          # Main dashboard
│   │   └── FileUpload.tsx           # Upload component
│   ├── contexts/
│   │   └── S3ConfigContext.tsx      # Configuration context
│   ├── hooks/
│   │   └── useS3.ts                 # S3 operations hook
│   ├── services/
│   │   └── apiService.ts            # API communication
│   └── types/
│       └── index.ts                 # TypeScript definitions
├── docs/                            # Documentation
├── venv/                            # Python virtual environment
├── schema_validator.py              # Python validation script
├── server.js                       # Backend API server
├── ecosystem.config.js              # PM2 configuration
├── setup-server.sh                 # Ubuntu server setup script
├── nginx-s3manager.conf            # nginx configuration
└── package.json
```

## 🚀 Production Deployment

### Automated Deployment to s3manager.turing.com

The application includes a complete deployment pipeline for Ubuntu servers:

#### 1. **Server Setup**
```bash
# On your Ubuntu server (104.198.177.87)
git clone https://github.com/your-username/aws-s3-file-manager-react.git
cd aws-s3-file-manager-react/aws-s3-file-manager-react
chmod +x setup-server.sh
sudo ./setup-server.sh
```

The setup script automatically:
- Installs Node.js 18.x, PM2, nginx, and SSL tools
- Configures firewall and security settings
- Sets up nginx with SSL certificates
- Creates proper directory structure

#### 2. **SSL Certificate**
```bash
sudo certbot --nginx -d s3manager.turing.com --agree-tos --email admin@turing.com
```

#### 3. **Application Deployment**
```bash
npm install
npm run build
sudo cp -r build/* /var/www/s3manager.turing.com/
pm2 start ecosystem.config.js
pm2 save
```

### Manual Deployment

Use the included deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Environment Configuration

Set these environment variables on your server:
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=[Your AWS Access Key]
AWS_SECRET_ACCESS_KEY=[Your AWS Secret Key]
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/your-role
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_SESSION_NAME=S3FileManagerSession

# Server Configuration
NODE_ENV=production
PORT=5001
```

## 🔒 Security Features

### Enhanced Security Model
- 🔐 **Google OAuth 2.0**: Enterprise-grade authentication
- 🛡️ **Server-side credentials**: No client-side AWS exposure
- 🔄 **Automatic token refresh**: IAM role token management
- 🚪 **HTTPS-only**: Production SSL with HSTS headers
- 🔧 **Security headers**: XSS protection, frame options, content type sniffing prevention

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
        },
        {
            "Effect": "Allow",
            "Action": [
                "sts:AssumeRole"
            ],
            "Resource": "arn:aws:iam::123456789012:role/your-role-name"
        }
    ]
}
```

## 🛠️ Development

### Available Scripts
```bash
npm start          # Start React development server (port 3000)
npm run dev        # Start backend API server (port 5001)
npm run build      # Build for production
npm test           # Run tests
```

### Development with Test Mode
For local development without Google OAuth setup:
1. Start both servers: `npm run dev` and `npm start`
2. Open `http://localhost:3000`
3. Click "Test Mode (Development Only)" button
4. Access all features immediately

## 🔍 Monitoring & Health Checks

### Application Monitoring
- **Status Dashboard**: Real-time AWS S3 connection status
- **Health Endpoint**: `GET /api/health`
- **Configuration Check**: `GET /api/s3/config`
- **Connection Test**: `GET /api/s3/test`

### PM2 Process Management
```bash
# View status
pm2 status

# View logs
pm2 logs s3-file-manager

# Restart application
pm2 restart s3-file-manager

# Monitor in real-time
pm2 monit
```

## 🐛 Troubleshooting

### Common Issues

#### **Google OAuth Errors**
- Verify authorized origins include your domain
- Check client ID is correctly configured
- Ensure HTTPS is used in production

#### **AWS Connection Issues**
- Check server environment variables
- Verify IAM role permissions
- Monitor token expiration in status panel

#### **Deployment Issues**
- Verify nginx configuration: `sudo nginx -t`
- Check PM2 process status: `pm2 status`
- Review logs: `pm2 logs s3-file-manager`

### Debug Commands
```bash
# Check application health
curl https://s3manager.turing.com/api/health

# Test AWS configuration
curl https://s3manager.turing.com/api/s3/config

# Monitor server logs
tail -f /var/log/nginx/s3manager.turing.com.access.log
```

## 📝 API Endpoints

### Authentication & Configuration
- `GET /api/s3/config` - Get AWS configuration status
- `GET /api/s3/test` - Test AWS connection
- `GET /health` - Application health check

### File Operations
- `GET /api/s3/folders` - List folders
- `POST /api/s3/upload` - Upload files
- `GET /api/s3/files` - List files
- `DELETE /api/s3/delete` - Delete files

### Schema Validation
- `POST /api/schema/validate` - Validate JSON schema

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
- 🎫 **Open an issue** on GitHub for bugs or feature requests
- 💬 **Start a discussion** for general questions

## 🎉 Latest Updates

### v2.0 - Google OAuth & Server-Managed Configuration
- ✅ **Google OAuth Authentication** - Secure enterprise sign-in
- ✅ **Server-Managed AWS Configuration** - Enhanced security model
- ✅ **Real-time Status Dashboard** - Live AWS connection monitoring
- ✅ **Production Deployment Pipeline** - Complete CI/CD with nginx and SSL
- ✅ **Test Mode for Development** - Streamlined local development workflow
- ✅ **Enhanced Security Headers** - HSTS, XSS protection, frame options

---

**🌟 Ready for enterprise deployment at [s3manager.turing.com](https://s3manager.turing.com)!**
