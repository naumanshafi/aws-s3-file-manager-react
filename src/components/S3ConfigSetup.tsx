import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Button,
  Typography,
  Alert,
  Paper,
  Stack,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import {
  Google,
  CloudUpload,
  Security,
  CheckCircle,
} from '@mui/icons-material';
import { useS3Config } from '../contexts/S3ConfigContext';

// Declare Google Identity Services types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

const GoogleAuthSetup: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setConfig } = useS3Config();

  // Google OAuth Client ID
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id.googleusercontent.com';
  
  // Test mode for local development
  const isLocalDevelopment = window.location.hostname === 'localhost';

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleAuth;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Auto-render fallback button when Google services are ready
  useEffect(() => {
    if (window.google && !user) {
      const timer = setTimeout(() => {
        renderGoogleButton();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [window.google, user]);

  const initializeGoogleAuth = () => {
    if (window.google) {
      try {
        console.log('Initializing Google Auth with Client ID:', GOOGLE_CLIENT_ID);
        
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        console.log('Google Auth initialized successfully');
      } catch (error) {
        console.error('Google Auth initialization error:', error);
        setError('Failed to initialize Google Sign-In. Please check your internet connection.');
      }
    } else {
      console.error('Google Identity Services not loaded');
      setError('Google Sign-In services are not available. Please refresh the page.');
    }
  };

  const handleCredentialResponse = (response: any) => {
    try {
      console.log('Received credential response:', response);
    setIsLoading(true);
    setError(null);

      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      // Decode the JWT token
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      console.log('Decoded payload:', payload);
      
      const userData: GoogleUser = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };

      setUser(userData);
      console.log('Google Auth Success:', userData);
      
    } catch (error) {
      console.error('Authentication error:', error);
      setError(`Failed to authenticate with Google: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      }
  };

  const handleGoogleSignIn = () => {
    try {
      setError(null);
      setIsLoading(true);
      
      if (window.google && window.google.accounts && window.google.accounts.id) {
        console.log('Triggering Google Sign-In prompt...');
        window.google.accounts.id.prompt((notification: any) => {
          console.log('Prompt notification:', notification);
          setIsLoading(false);
          
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('Prompt was not displayed or skipped');
            renderGoogleButton();
          }
        });
      } else {
        setIsLoading(false);
        setError('Google Sign-In is not available. Please refresh the page and try again.');
        console.error('Google services not available');
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Sign-in trigger error:', error);
      setError('Failed to start Google Sign-In. Please try again.');
        }
  };

  const renderGoogleButton = () => {
    const buttonContainer = document.getElementById('google-signin-button');
    if (buttonContainer && window.google) {
      buttonContainer.innerHTML = '';
      
      window.google.accounts.id.renderButton(
        buttonContainer,
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: 250,
        }
      );
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setError(null);
  };

  const handleContinue = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Set a minimal server-managed configuration
      // The actual AWS operations are handled by the backend
      await setConfig({
        bucketName: 'server-managed', // Backend will use actual bucket from env
        region: 'server-managed', // Backend will use actual region from env
      });
      
      console.log('Successfully navigated to main application');
    } catch (error) {
      console.error('Failed to navigate to main application:', error);
      setError(`Failed to launch file manager: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = () => {
    // Test user for local development
    const testUser: GoogleUser = {
      id: 'test-user-123',
      name: 'Test User',
      email: 'test@example.com',
      picture: 'https://via.placeholder.com/150'
    };
    setUser(testUser);
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
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ py: 2.5, display: 'flex', alignItems: 'center' }}>
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
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
                }}
              >
                <CloudUpload sx={{ fontSize: 28, color: 'white' }} />
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
                  }}
                >
                  AWS S3 File Manager
                </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#cbd5e1',
                        fontWeight: 500,
                      }}
                    >
                  with JSON Schema Validation
                    </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

             {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
        <Container maxWidth="sm">
          {user ? (
            // Success state
           <Box
             sx={{
                background: 'white',
               borderRadius: 4,
               border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                p: 6,
                textAlign: 'center',
              }}
            >
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 3 }} />
              
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>
                Welcome, {user.name}!
              </Typography>
              
              <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
                You're now authenticated and ready to manage your S3 files.
              </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 4, textAlign: 'left' }}>
                {error}
              </Alert>
            )}

              <Avatar
                src={user.picture}
                alt={user.name}
                      sx={{
                  width: 80, 
                  height: 80,
                  mx: 'auto',
                  mb: 3,
                  border: '3px solid #e2e8f0',
                }}
              />

              <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
                {user.email}
                    </Typography>

              <Stack spacing={2} direction="row" sx={{ justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleContinue}
                  disabled={isLoading}
                      sx={{ 
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                      }}
                >
                  {isLoading ? 'Launching...' : 'Launch File Manager'}
                </Button>
                
                <Button
                      variant="outlined"
                  onClick={handleSignOut}
                  sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                >
                  Sign Out
                </Button>
              </Stack>
                  </Box>
          ) : (
            // Sign-in state
                    <Box
                      sx={{
                background: 'white',
                borderRadius: 4,
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                p: 8,
                textAlign: 'center',
                      }}
                    >
              <Google sx={{ fontSize: 64, color: '#4285f4', mb: 3 }} />
              
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>
                Sign In Required
                    </Typography>
              
              <Typography variant="body1" sx={{ color: '#64748b', mb: 6, maxWidth: 400, mx: 'auto' }}>
                Please sign in with your Google account to access the AWS S3 File Manager.
                    </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 4, textAlign: 'left' }}>
                  {error}
                  </Alert>
              )}

                  <Button
                    variant="contained"
                size="large"
                startIcon={<Google />}
                onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    sx={{ 
                  background: 'linear-gradient(135deg, #4285f4 0%, #3367d6 100%)',
                  color: 'white',
                  fontWeight: 600,
                      py: 2,
                  px: 6,
                  borderRadius: 2,
                      fontSize: '1rem',
                      textTransform: 'none',
                  mb: 3,
                      '&:hover': {
                    background: 'linear-gradient(135deg, #3367d6 0%, #1d4ed8 100%)',
                  },
                    }}
                  >
                {isLoading ? 'Signing in...' : 'Sign in with Google'}
                  </Button>

              {/* Fallback Google Button */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <div id="google-signin-button" style={{ minHeight: '44px' }} />
                </Box>

              {/* Test Mode for Development */}
              {isLocalDevelopment && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleTestLogin}
                    sx={{ fontSize: '0.875rem' }}
                  >
                    Test Mode (Development Only)
                  </Button>
                </>
              )}
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default GoogleAuthSetup; 