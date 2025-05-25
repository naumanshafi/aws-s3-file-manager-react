# AWS S3 File Manager - React

A modern, professional React application for managing AWS S3 files with a beautiful Material-UI interface. This application provides an intuitive way to upload, download, browse, and delete files in your S3 buckets.

## Features

- 🚀 **Modern UI**: Built with Material-UI for a professional, responsive design
- 📁 **File Management**: Upload, download, browse, and delete files
- 🔄 **Real-time Updates**: Automatic refresh and progress tracking
- 📊 **Smart Caching**: Efficient data fetching with React Query
- 🎯 **Project Organization**: Navigate through project folders and date-based organization
- 🔒 **Secure**: Support for AWS credentials and IAM roles
- 📱 **Responsive**: Works seamlessly on desktop and mobile devices

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- AWS account with S3 access
- AWS credentials configured (via AWS CLI, environment variables, or IAM roles)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd aws-s3-file-manager-react
   npm install
   ```

2. **Configure environment variables (optional):**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_S3_BUCKET_NAME=your-bucket-name
   REACT_APP_AWS_REGION=us-east-1
   REACT_APP_AWS_ACCESS_KEY_ID=your-access-key
   REACT_APP_AWS_SECRET_ACCESS_KEY=your-secret-key
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Configuration

### AWS Credentials

The application supports multiple ways to configure AWS credentials:

1. **Environment Variables** (recommended for development):
   ```env
   REACT_APP_AWS_ACCESS_KEY_ID=your-access-key
   REACT_APP_AWS_SECRET_ACCESS_KEY=your-secret-key
   REACT_APP_AWS_SESSION_TOKEN=your-session-token  # For temporary credentials
   ```

2. **AWS CLI Configuration**:
   ```bash
   aws configure --profile your-profile-name
   ```

3. **IAM Roles** (recommended for production):
   When running on EC2 or other AWS services, the application can use IAM roles automatically.

4. **Manual Configuration**:
   Enter credentials directly in the application's configuration screen.

### S3 Bucket Structure

The application expects your S3 bucket to follow this structure:
```
your-bucket/
├── project1/
│   ├── inputData/
│   │   └── 2024-01-15/
│   │       └── annotation_inputs/
│   │           └── input_files/
│   └── outputData/
│       └── 2024-01-15/
├── project2/
│   ├── inputData/
│   └── outputData/
```

## Usage

### 1. Upload Files
- Select a project folder and date
- Drag and drop files or click to select
- Monitor upload progress in real-time
- View uploaded files immediately

### 2. Download Files
- Choose a project and date folder
- Browse available files in the inputData directory
- Click download to get files instantly
- Files are downloaded with original names

### 3. Browse S3 Bucket
- Navigate through your entire S3 bucket structure
- View folders and files with detailed information
- Use breadcrumb navigation for easy traversal
- Real-time file size and modification date display

### 4. Delete Files
- Select project and date for outputData
- View files available for deletion
- Confirm deletion with safety warnings
- Immediate UI updates after deletion

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **State Management**: React Query (TanStack Query)
- **AWS Integration**: AWS SDK v3
- **File Handling**: react-dropzone
- **Notifications**: react-hot-toast
- **Build Tool**: Create React App

## Project Structure

```
src/
├── components/           # React components
│   ├── tabs/            # Tab-specific components
│   ├── FileUpload.tsx   # Drag & drop file upload
│   ├── FileList.tsx     # File listing with actions
│   ├── S3ConfigSetup.tsx # AWS configuration
│   └── S3Dashboard.tsx  # Main dashboard
├── contexts/            # React contexts
│   └── S3ConfigContext.tsx
├── hooks/               # Custom React hooks
│   └── useS3.ts        # S3 operations hooks
├── services/            # Business logic
│   └── s3Service.ts    # AWS S3 service wrapper
├── types/               # TypeScript definitions
│   └── index.ts
└── utils/               # Utility functions
```

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Key Features Implementation

1. **Efficient Caching**: React Query provides intelligent caching and background updates
2. **Error Handling**: Comprehensive error handling with user-friendly messages
3. **Progress Tracking**: Real-time upload progress with visual indicators
4. **Responsive Design**: Mobile-first approach with Material-UI breakpoints
5. **Type Safety**: Full TypeScript implementation for better development experience

## Security Considerations

- Never commit AWS credentials to version control
- Use IAM roles with minimal required permissions
- Consider using temporary credentials for enhanced security
- Implement proper CORS settings on your S3 bucket
- Use HTTPS in production environments

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to AWS S3 + CloudFront

1. Build the application
2. Upload the `build/` folder to an S3 bucket configured for static hosting
3. Set up CloudFront distribution for global CDN
4. Configure proper IAM policies for S3 access

### Environment Variables for Production

Set these in your deployment environment:
```env
REACT_APP_S3_BUCKET_NAME=production-bucket
REACT_APP_AWS_REGION=us-east-1
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your S3 bucket has proper CORS configuration
2. **Permission Denied**: Check IAM policies and bucket permissions
3. **Slow Loading**: Verify network connectivity and AWS region settings
4. **Upload Failures**: Check file size limits and bucket policies

### Debug Mode

Enable debug logging by setting:
```env
REACT_APP_DEBUG=true
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review AWS S3 documentation
- Open an issue on GitHub
