import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Cloud,
  Security,
  Storage,
  CheckCircle,
  Error,
  Warning,
  Refresh,
} from '@mui/icons-material';

interface AWSConfig {
  bucketName: string;
  region: string;
  hasRole: boolean;
  isInitialized: boolean;
  tokenExpires: string | null;
}

interface ConnectionStatus {
  status: 'loading' | 'connected' | 'error' | 'warning';
  message: string;
  details?: string;
}

const S3StatusPanel: React.FC = () => {
  const [config, setConfig] = useState<AWSConfig | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'loading',
    message: 'Checking AWS connection...'
  });

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/s3/config');
      const data = await response.json();
      setConfig(data);
      
      // Test the connection
      const testResponse = await fetch('/api/s3/test');
      const testData = await testResponse.json();
      
      if (testResponse.ok && testData.success) {
        setConnectionStatus({
          status: 'connected',
          message: `Connected to AWS S3 - Found ${testData.count} folders`,
          details: testData.folders?.slice(0, 3).map((f: any) => f.name).join(', ')
        });
      } else {
        // Safely extract error details with proper type checking
        let errorDetails = 'No additional details';
        let errorMessage = 'Connection failed';
        
        if (testData && typeof testData === 'object') {
          const dataObj = testData as Record<string, unknown>;
          if ('message' in dataObj && typeof dataObj.message === 'string') {
            errorDetails = dataObj.message;
          }
          if ('error' in dataObj && typeof dataObj.error === 'string') {
            errorMessage = dataObj.error;
          }
        }
        
        setConnectionStatus({
          status: 'error',
          message: errorMessage,
          details: errorDetails
        });
      }
    } catch (error: unknown) {
      let errorMessage: string;
      if (error instanceof globalThis.Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Unknown error';
      }
      
      setConnectionStatus({
        status: 'error',
        message: 'Failed to connect to server',
        details: errorMessage
      });
    }
  };

  useEffect(() => {
    fetchConfig();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchConfig, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'loading':
        return <CircularProgress size={24} />;
      case 'connected':
        return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'warning':
        return <Warning sx={{ color: 'warning.main' }} />;
      case 'error':
        return <Error sx={{ color: 'error.main' }} />;
      default:
        return <CircularProgress size={24} />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const formatTokenExpiry = (tokenExpires: string | null) => {
    if (!tokenExpires) return 'No expiration (permanent credentials)';
    
    const expiryTime = new Date(tokenExpires);
    const now = new Date();
    const diffMs = expiryTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 0) {
      return 'Expired (will auto-refresh)';
    } else if (diffMinutes < 60) {
      return `Expires in ${diffMinutes} minutes`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `Expires in ${diffHours} hours`;
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Card
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          mb: 2,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Cloud sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                AWS S3 Connection Status
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Server-managed AWS configuration
              </Typography>
            </Box>
          </Box>
          
          <Alert
            severity={getStatusColor() as 'success' | 'warning' | 'error' | 'info'}
            icon={getStatusIcon()}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              '& .MuiAlert-icon': {
                color: 'white !important',
              },
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {connectionStatus.message}
            </Typography>
            {connectionStatus.details && (
              <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                {connectionStatus.details}
              </Typography>
            )}
          </Alert>
        </CardContent>
      </Card>

      {config && (
        <Card sx={{ border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#0f172a' }}>
              Configuration Details
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Storage sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                      S3 Bucket
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {config.bucketName}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Cloud sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                      AWS Region
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {config.region}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Divider />
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                      Authentication Method
                    </Typography>
                    <Chip
                      label={config.hasRole ? 'IAM Role Assumption' : 'Direct Credentials'}
                      color={config.hasRole ? 'primary' : 'default'}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
                
                {config.hasRole && (
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Refresh sx={{ color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Token Status
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatTokenExpiry(config.tokenExpires)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
            
            <Alert 
              severity="info" 
              sx={{ 
                mt: 2,
                borderRadius: 2,
                backgroundColor: '#eff6ff',
                border: '1px solid #dbeafe',
              }}
            >
              <Typography variant="body2">
                <strong>🔒 Security:</strong> AWS credentials are securely managed on the server using environment variables. 
                No sensitive information is exposed to the client.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default S3StatusPanel; 