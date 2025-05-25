import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Paper,
  Stack,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CloudUpload,
  Settings,
  Security,
  AccountTree,
} from '@mui/icons-material';
import { useS3Config } from '../contexts/S3ConfigContext';
import { S3Config } from '../types';

const S3ConfigSetup: React.FC = () => {
  const { setConfig } = useS3Config();
  const [formData, setFormData] = useState<S3Config>({
    bucketName: process.env.REACT_APP_S3_BUCKET_NAME || 'agi-ds-turing',
    region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || '',
    roleArn: process.env.REACT_APP_AWS_ROLE_ARN || '',
  });
  const [showSecrets, setShowSecrets] = useState({
    accessKey: false,
    secretKey: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleInputChange = (field: keyof S3Config) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
    setTestResult(null);
  };

  const toggleShowSecret = (field: keyof typeof showSecrets) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Prevent double-clicks
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields - now including roleArn as mandatory
      if (!formData.bucketName || !formData.region || !formData.accessKeyId || !formData.secretAccessKey || !formData.roleArn) {
        throw new Error('All fields are required: Bucket name, region, access key ID, secret access key, and IAM Role ARN are mandatory for security');
      }

      // Build configuration with all required fields
      const config: S3Config = {
        bucketName: formData.bucketName.trim(),
        region: formData.region.trim(),
        accessKeyId: formData.accessKeyId.trim(),
        secretAccessKey: formData.secretAccessKey.trim(),
        roleArn: formData.roleArn.trim(), // Now mandatory
      };

      // Validate credential lengths
      if (config.accessKeyId && config.accessKeyId.length !== 20) {
        throw new Error(`Invalid Access Key ID length: ${config.accessKeyId.length} (expected 20 characters)`);
      }
      if (config.secretAccessKey && config.secretAccessKey.length !== 40) {
        throw new Error(`Invalid Secret Access Key length: ${config.secretAccessKey.length} (expected 40 characters). Check for extra characters.`);
      }

      // Debug: Log the configuration being sent (without sensitive data)
      console.log('Sending configuration:', {
        bucketName: config.bucketName,
        region: config.region,
        accessKeyId: config.accessKeyId ? `${config.accessKeyId.substring(0, 8)}...` : 'missing',
        secretAccessKey: config.secretAccessKey ? `${config.secretAccessKey.substring(0, 8)}...` : 'missing',
        roleArn: config.roleArn,
      });

      // Test the connection by initializing the API service and trying to list folders
      const { apiService } = await import('../services/apiService');
      await apiService.initialize(config);
      
      // Test connection by attempting to list top-level folders
      const result = await apiService.testConnection();
      
      // If we get here, the connection is successful
      setTestResult(`✅ Connection successful! Found ${result.count} top-level folders in bucket "${config.bucketName}"`);
      
      // Wait a moment to show the success message, then proceed
      setTimeout(async () => {
        try {
          await setConfig(config);
        } catch (error) {
          console.error('Failed to save config:', error);
          setError('Failed to save configuration. Please try again.');
        }
      }, 1500);
          } catch (err) {
        console.error('S3 Connection Error:', err);
        console.error('Error details:', {
          name: err instanceof Error ? err.name : 'Unknown',
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          config: {
            bucketName: formData.bucketName,
            region: formData.region,
            hasCredentials: !!(formData.accessKeyId && formData.secretAccessKey),
            hasRoleArn: !!formData.roleArn
          }
        });
        
        let errorMessage = 'Failed to connect to S3';
        
        if (err instanceof Error) {
          const errorMsg = err.message.toLowerCase();
          const errorName = err.name.toLowerCase();
          
          if (errorMsg.includes('failed to fetch') || errorMsg.includes('fetch')) {
            errorMessage = '🚫 CORS Error: Browser blocked the request to AWS S3. This is common when running locally. Try using a proxy server or deploy to a proper domain.';
          } else if (errorMsg.includes('invalidaccesskeyid') || errorName.includes('invalidaccesskeyid')) {
            errorMessage = 'Invalid Access Key ID. Please check your credentials.';
          } else if (errorMsg.includes('signaturedoesnotmatch') || errorName.includes('signaturedoesnotmatch')) {
            errorMessage = 'Invalid Secret Access Key. Please check your credentials.';
          } else if (errorMsg.includes('tokenrefreshrequired') || errorName.includes('tokenrefreshrequired')) {
            errorMessage = 'Session token has expired. Please provide a new token.';
          } else if (errorMsg.includes('accessdenied') || errorName.includes('accessdenied')) {
            errorMessage = 'Access denied. Please check your permissions for this S3 bucket and IAM role.';
          } else if (errorMsg.includes('nosuchbucket') || errorName.includes('nosuchbucket')) {
            errorMessage = 'The specified bucket does not exist or you do not have access to it.';
          } else if (errorMsg.includes('networkingerror') || errorMsg.includes('enotfound') || errorMsg.includes('network')) {
            errorMessage = 'Network error. Please check your internet connection and AWS region.';
          } else if (errorMsg.includes('cors') || errorMsg.includes('cross-origin')) {
            errorMessage = 'CORS error. This might be a browser security restriction when running locally.';
          } else if (errorMsg.includes('credentialsnotfound') || errorMsg.includes('unable to load credentials')) {
            errorMessage = 'No AWS credentials found. Please provide Access Key ID and Secret Access Key.';
          } else if (errorMsg.includes('assumerole') || errorMsg.includes('role')) {
            errorMessage = 'Failed to assume IAM role. Please check your role ARN and permissions.';
          } else {
            errorMessage = `Connection failed: ${err.message}`;
          }
        }
        
        setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
          borderBottom: '1px solid #334155',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(168, 85, 247, 0.1) 100%)',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7, #ec4899)',
          },
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 2,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    pointerEvents: 'none',
                  },
                }}
              >
                <CloudUpload sx={{ fontSize: 28, color: 'white', position: 'relative', zIndex: 1 }} />
              </Box>
              <Box>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '1.5rem', md: '1.75rem' },
                    mb: 0.5,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.2,
                  }}
                >
                  AWS S3 File Manager
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: 1.5,
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#e2e8f0',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    >
                      Configuration Setup
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: 1.5,
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#cbd5e1',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    >
                      Enterprise-grade S3 Management
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

             {/* Main Content */}
       <Box sx={{ flex: 1, py: 6 }}>
         <Container maxWidth="xl">
           <Box
             sx={{
               background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
               borderRadius: 4,
               border: '1px solid #e2e8f0',
               boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
               overflow: 'hidden',
               position: 'relative',
               '&::before': {
                 content: '""',
                 position: 'absolute',
                 top: 0,
                 left: 0,
                 right: 0,
                 height: '4px',
                 background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
               },
             }}
           >
            {error && (
              <Alert severity="error" sx={{ m: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {testResult && (
              <Alert severity="success" sx={{ m: 3, borderRadius: 2 }}>
                {testResult}
              </Alert>
            )}

                        <Box sx={{ p: { xs: 5, md: 8 }, pt: { xs: 6, md: 9 } }}>
              <form onSubmit={handleSubmit}>
                <Stack spacing={5}>
                {/* Basic Configuration Section */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 52,
                        height: 52,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                        mr: 4,
                      }}
                    >
                      <Settings sx={{ color: 'white', fontSize: 26 }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.6rem', md: '2rem' } }}>
                      Basic Configuration
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                    <TextField
                      fullWidth
                      label="S3 Bucket Name"
                      value={formData.bucketName}
                      onChange={handleInputChange('bucketName')}
                      required
                      placeholder="my-s3-bucket"
                      variant="outlined"
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 3,
                          backgroundColor: '#fafafa',
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          fontWeight: 600,
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="AWS Region"
                      value={formData.region}
                      onChange={handleInputChange('region')}
                      required
                      placeholder="us-east-1"
                      variant="outlined"
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 3,
                          backgroundColor: '#fafafa',
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          fontWeight: 600,
                        },
                      }}
                    />
                  </Box>
                                  </Box>

                <Divider sx={{ borderColor: '#e2e8f0', my: 2 }} />

                {/* AWS Credentials Section */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 52,
                        height: 52,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                        mr: 4,
                      }}
                    >
                      <Security sx={{ color: 'white', fontSize: 26 }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.6rem', md: '2rem' } }}>
                      AWS Credentials (Required)
                    </Typography>
                  </Box>
                  
                  <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                    <Typography variant="body2">
                      <strong>🔐 Security Notice:</strong> Your AWS access credentials are required for secure authentication. 
                      All credentials are processed securely and never stored permanently.
                    </Typography>
                  </Alert>

                  <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                    <TextField
                      fullWidth
                      label="Access Key ID"
                      type={showSecrets.accessKey ? 'text' : 'password'}
                      value={formData.accessKeyId}
                      onChange={handleInputChange('accessKeyId')}
                      required
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      variant="outlined"
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 3,
                          backgroundColor: '#fafafa',
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          fontWeight: 600,
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => toggleShowSecret('accessKey')}
                              edge="end"
                            >
                              {showSecrets.accessKey ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Secret Access Key"
                      type={showSecrets.secretKey ? 'text' : 'password'}
                      value={formData.secretAccessKey}
                      onChange={handleInputChange('secretAccessKey')}
                      required
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      variant="outlined"
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 3,
                          backgroundColor: '#fafafa',
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          fontWeight: 600,
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => toggleShowSecret('secretKey')}
                              edge="end"
                            >
                              {showSecrets.secretKey ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </Box>

                <Divider sx={{ borderColor: '#e2e8f0', my: 2 }} />

                {/* IAM Role Section */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 52,
                        height: 52,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                        mr: 4,
                      }}
                    >
                      <AccountTree sx={{ color: 'white', fontSize: 26 }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.6rem', md: '2rem' } }}>
                      IAM Role Configuration (Required)
                    </Typography>
                  </Box>
                  
                  <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    <Typography variant="body2">
                      <strong>🎯 Role Assumption:</strong> The application will assume this IAM role using your credentials 
                      to access S3 resources securely. This role must have appropriate S3 permissions.
                    </Typography>
                  </Alert>

                  <TextField
                    fullWidth
                    label="IAM Role ARN"
                    value={formData.roleArn}
                    onChange={handleInputChange('roleArn')}
                    required
                    placeholder="arn:aws:iam::123456789012:role/YourRoleName"
                    variant="outlined"
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: 3,
                        backgroundColor: '#fafafa',
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'white',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 600,
                      },
                    }}
                    helperText="This role will be assumed using your credentials to access S3 resources"
                  />
                </Box>

                {/* Submit Button */}
                <Box sx={{ pt: 3 }}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="medium"
                    disabled={isLoading}
                    sx={{ 
                      py: 2,
                      borderRadius: 3,
                      fontSize: '1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                      textTransform: 'none',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        transition: 'left 0.5s',
                      },
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                        boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
                        transform: 'translateY(-1px)',
                        '&::before': {
                          left: '100%',
                        },
                      },
                      '&:disabled': {
                        background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                        boxShadow: 'none',
                        transform: 'none',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isLoading ? 'Connecting to AWS...' : 'Connect to S3'}
                  </Button>
                </Box>
              </Stack>
            </form>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default S3ConfigSetup; 