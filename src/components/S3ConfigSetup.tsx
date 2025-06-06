import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Avatar,
  Stack,
  Divider,
  Chip,
  Paper,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload,
  Google,
  CheckCircle,
  Security,
  AdminPanelSettings,
  Person,
  Error as ErrorIcon,
  FolderOpen,
} from '@mui/icons-material';
import { useS3Config } from '../contexts/S3ConfigContext';
import { authService } from '../services/authService';

// Declare global Google types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
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
  const { setConfig } = useS3Config();
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<'signin' | 'validating' | 'success' | 'error'>('signin');

  const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google script loaded');
      initializeGoogleAuth();
    };
    script.onerror = () => {
      console.error('Failed to load Google script');
      setError('Failed to load Google Sign-In. Please check your internet connection.');
    };
    document.head.appendChild(script);

    // Check if user is already authenticated
    const savedUser = authService.getUserInfo();
    if (savedUser) {
      setUser({
        id: 'restored',
        name: savedUser.name,
        email: savedUser.email,
        picture: savedUser.picture
      });
      setUserRole(savedUser.role);
      setAuthStep('success');
      // Auto-launch the app
      handleLaunchApp();
    }

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const initializeGoogleAuth = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        console.log('Initializing Google Auth');
        window.google.accounts.id.initialize({
          client_id: '549557403268-707u7eagk8bbknhdg95p9kaukak74voq.apps.googleusercontent.com',
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        renderGoogleButton();
        console.log('Google Auth initialized successfully');
      } catch (error) {
        console.error('Google Auth initialization error:', error);
        setError('Failed to initialize Google Sign-In. Please refresh the page.');
      }
    } else {
      console.log('Google services not ready, retrying...');
      setTimeout(initializeGoogleAuth, 1000);
    }
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      setIsLoading(true);
      setError(null);
      setAuthStep('validating');
      
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const userData: GoogleUser = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };

      console.log('Google Auth Success:', userData);

      // Validate user with backend (only if not in local development)
      if (!isLocalDevelopment) {
        const validation = await authService.validateAndSetUser({
          email: userData.email,
          name: userData.name,
          picture: userData.picture
        });

        if (!validation.success) {
          setError(validation.error || 'Authorization failed');
          setAuthStep('error');
          return;
        }

        setUserRole(validation.role || 'user');
      } else {
        // In local development, just set user directly
        authService.setUser({
          email: userData.email,
          name: userData.name
        });
        setUserRole('admin'); // Default to admin for local development
      }

      setUser(userData);
      setAuthStep('success');
      
      // Auto-launch after successful authentication
      setTimeout(() => {
        handleLaunchApp();
      }, 1500);
      
    } catch (error) {
      console.error('Authentication error:', error);
      setError(`Failed to authenticate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAuthStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    try {
      setError(null);
      setIsLoading(true);
      setAuthStep('signin');
      
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
    if (buttonContainer && window.google && window.google.accounts) {
      buttonContainer.innerHTML = '';
      
      try {
        window.google.accounts.id.renderButton(
          buttonContainer,
          {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: 280,
          }
        );
      } catch (error) {
        console.error('Error rendering Google button:', error);
      }
    }
  };

  const handleSignOut = () => {
    authService.clearAuth();
    setUser(null);
    setUserRole(null);
    setError(null);
    setAuthStep('signin');
    // Reinitialize Google Auth for new login
    setTimeout(initializeGoogleAuth, 100);
  };

  const handleLaunchApp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Set a minimal server-managed configuration
      await setConfig({
        bucketName: 'server-managed',
        region: 'server-managed',
      });
      
      console.log('Successfully navigated to main application');
    } catch (error) {
      console.error('Failed to navigate to main application:', error);
      setError(`Failed to launch file manager: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    // Test user for local development
    const testUser: GoogleUser = {
      id: 'test-user-123',
      name: 'Test User',
      email: 'admin@turing.com',
      picture: 'https://via.placeholder.com/150'
    };
    
    setIsLoading(true);
    setAuthStep('validating');
    
    // For local development, just set user directly without backend validation
    if (isLocalDevelopment) {
      authService.setUser({
        email: testUser.email,
        name: testUser.name
      });
      setUser(testUser);
      setUserRole('admin');
      setAuthStep('success');
      setIsLoading(false);
      return;
    }

    // For production, validate with backend
    try {
      const validation = await authService.validateAndSetUser({
        email: testUser.email,
        name: testUser.name,
        picture: testUser.picture
      });

      if (!validation.success) {
        setError(validation.error || 'Test user not authorized');
        setAuthStep('error');
        setIsLoading(false);
        return;
      }
      
      setUser(testUser);
      setUserRole(validation.role || 'user');
      setAuthStep('success');
    } catch (error) {
      setError('Unable to validate test user. Backend may not be available.');
      setAuthStep('error');
    }
    
    setIsLoading(false);
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
          <Box sx={{ 
            py: { xs: 2, md: 2.5 }, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-start',
            position: 'relative', 
            zIndex: 1 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 40, md: 48 },
                  height: { xs: 40, md: 48 },
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
                <CloudUpload sx={{ fontSize: { xs: 24, md: 28 }, color: 'white', position: 'relative', zIndex: 1 }} />
              </Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem', lg: '2rem' },
                    letterSpacing: '-0.025em',
                    lineHeight: 1.2,
                  }}
                >
                  AWS S3 File Manager
                </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#cbd5e1',
                        fontWeight: 500,
                    fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.9rem', lg: '1rem' },
                    mt: 0.5,
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
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="sm">
          {authStep === 'success' && user ? (
            // Success State
            <Card
             sx={{
               borderRadius: 4,
               border: '1px solid #e2e8f0',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
               overflow: 'hidden',
               position: 'relative',
               '&::before': {
                 content: '""',
                 position: 'absolute',
                 top: 0,
                 left: 0,
                 right: 0,
                 height: '4px',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
               },
             }}
           >
              <CardContent sx={{ p: { xs: 4, md: 6 }, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: { xs: 48, md: 64 }, color: 'success.main', mb: 3 }} />
                
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  mb: 2, 
                  color: '#0f172a',
                  fontSize: { xs: '1.5rem', md: '2rem' }
                }}>
                  Welcome, {user.name}!
                </Typography>
                
                <Typography variant="body1" sx={{ 
                  color: '#64748b', 
                  mb: 4,
                  fontSize: { xs: '0.9rem', md: '1rem' }
                }}>
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
                    width: { xs: 64, md: 80 },
                    height: { xs: 64, md: 80 },
                    mx: 'auto',
                    mb: 3,
                    border: '3px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}
                />

                <Typography variant="body2" sx={{ 
                  color: '#64748b', 
                  mb: 2,
                  fontSize: { xs: '0.8rem', md: '0.875rem' }
                }}>
                  {user.email}
                </Typography>

                {userRole && (
                  <Chip 
                    icon={userRole === 'admin' ? <AdminPanelSettings /> : <Person />}
                    label={userRole === 'admin' ? 'Administrator' : 'User'}
                    color={userRole === 'admin' ? 'error' : 'primary'}
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', md: '0.875rem' },
                      mb: 4,
                      height: { xs: 28, md: 32 },
                    }}
                  />
                )}

                {isLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Launching application...
                    </Typography>
                  </Box>
                )}

                <Stack 
                  spacing={2} 
                  direction={{ xs: 'column', sm: 'row' }} 
                  sx={{ justifyContent: 'center' }}
                >
                  {!isLoading && (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleLaunchApp}
                      sx={{ 
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        fontWeight: 600,
                        px: { xs: 3, md: 4 },
                        py: { xs: 1.25, md: 1.5 },
                        borderRadius: 2,
                        fontSize: { xs: '0.9rem', md: '1rem' },
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                          '&:hover': {
                          background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 16px rgba(99, 102, 241, 0.5)',
                        },
                      }}
                    >
                      Launch File Manager
                    </Button>
                  )}
                  
                  <Button
                      variant="outlined"
                    onClick={handleSignOut}
                    disabled={isLoading}
                    sx={{ 
                      px: { xs: 3, md: 4 }, 
                      py: { xs: 1.25, md: 1.5 }, 
                      borderRadius: 2,
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Sign Out
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            // Sign-in State
            <Card
                      sx={{ 
                borderRadius: 4,
                border: '1px solid #e2e8f0',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: authStep === 'error' 
                    ? 'linear-gradient(90deg, #dc2626, #b91c1c)' 
                    : 'linear-gradient(90deg, #4285f4, #3367d6)',
                },
              }}
            >
              <CardContent sx={{ p: { xs: 6, md: 8 }, textAlign: 'center' }}>
                {authStep === 'error' ? (
                  <ErrorIcon sx={{ fontSize: { xs: 48, md: 64 }, color: '#dc2626', mb: 3 }} />
                ) : authStep === 'validating' ? (
                  <CircularProgress size={56} sx={{ mb: 3 }} />
                ) : (
                  <Google sx={{ fontSize: { xs: 48, md: 64 }, color: '#4285f4', mb: 3 }} />
                )}
                
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  mb: 2, 
                  color: '#0f172a',
                  fontSize: { xs: '1.5rem', md: '2rem' }
                }}>
                  {authStep === 'error' ? 'Access Denied' : 
                   authStep === 'validating' ? 'Validating Access' : 
                   'Sign In Required'}
                </Typography>
                
                <Typography variant="body1" sx={{ 
                  color: '#64748b', 
                  mb: 6, 
                  maxWidth: 400, 
                  mx: 'auto',
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  lineHeight: 1.6,
                }}>
                  {authStep === 'error' ? 'Your account is not authorized to access this application. Please contact your administrator.' :
                   authStep === 'validating' ? 'Please wait while we verify your authorization...' :
                   'Please sign in with your Google account to access the AWS S3 File Manager with advanced features.'}
                </Typography>

                {error && (
                  <Alert 
                    severity="error" 
                      sx={{
                      mb: 4, 
                      textAlign: 'left',
                      borderRadius: 2,
                      '& .MuiAlert-message': {
                        fontSize: { xs: '0.8rem', md: '0.875rem' }
                      }
                    }}
                  >
                    {error}
                  </Alert>
                )}

                {authStep !== 'validating' && authStep !== 'error' && (
                  <>
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
                        py: { xs: 1.5, md: 2 },
                        px: { xs: 4, md: 6 },
                        borderRadius: 2,
                        fontSize: { xs: '0.9rem', md: '1rem' },
                        textTransform: 'none',
                        mb: 3,
                        boxShadow: '0 4px 12px rgba(66, 133, 244, 0.4)',
                          '&:hover': {
                          background: 'linear-gradient(135deg, #3367d6 0%, #1d4ed8 100%)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 16px rgba(66, 133, 244, 0.5)',
                        },
                        '&:disabled': {
                          background: '#9ca3af',
                          transform: 'none',
                        },
                      }}
                    >
                      {isLoading ? 'Signing in...' : 'Sign in with Google'}
                    </Button>

                    {/* Fallback Google Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                      <div id="google-signin-button" style={{ minHeight: '44px' }} />
                    </Box>

                    {/* Features Section */}
                    <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid #e2e8f0' }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600, 
                        mb: 3, 
                        color: '#374151',
                        fontSize: { xs: '1rem', md: '1.125rem' }
                      }}>
                        What you can do:
                      </Typography>
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                        gap: 2,
                        textAlign: 'left'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <CloudUpload sx={{ color: '#6366f1', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                            Upload & Download Files
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Security sx={{ color: '#6366f1', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                            JSON Schema Validation
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <FolderOpen sx={{ color: '#6366f1', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                            Browse S3 Buckets
                    </Typography>
                  </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <AdminPanelSettings sx={{ color: '#6366f1', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                            User Management
                    </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </>
                )}

                {authStep === 'error' && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setError(null);
                      setAuthStep('signin');
                    }}
                    sx={{ 
                      px: { xs: 4, md: 6 }, 
                      py: { xs: 1.5, md: 2 }, 
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      textTransform: 'none',
                    }}
                  >
                    Try Again
                  </Button>
                )}

                {/* Test Mode for Development */}
                {isLocalDevelopment && authStep === 'signin' && (
                  <>
                    <Divider sx={{ my: 4 }} />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleTestLogin}
                      disabled={isLoading}
                      sx={{ 
                        fontSize: { xs: '0.8rem', md: '0.875rem' },
                        textTransform: 'none',
                        color: '#6b7280',
                        borderColor: '#d1d5db',
                      }}
                    >
                      Test Mode (Development Only)
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default GoogleAuthSetup; 