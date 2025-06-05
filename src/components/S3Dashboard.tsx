import React from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Paper,
} from '@mui/material';
import {
  CloudUpload,
  CloudDownload,
  FolderOpen,
  Delete,
  Logout,
  VerifiedUser,
  SupervisorAccount,
} from '@mui/icons-material';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useS3Config } from '../contexts/S3ConfigContext';
import UploadTab from './tabs/UploadTab';
import DownloadTab from './tabs/DownloadTab';
import BrowseTab from './tabs/BrowseTab';
import DeleteTab from './tabs/DeleteTab';
import SchemaValidationTab from './tabs/SchemaValidationTab';
import UserManagementTab from './tabs/UserManagementTab';

const S3Dashboard: React.FC = () => {
  const { config, clearConfig } = useS3Config();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearConfig();
    // Navigate to localhost:3000 (configuration page)
    window.location.href = 'http://localhost:3000';
  };

  const tabConfig = [
    {
      path: '/upload',
      label: 'Upload',
      icon: <CloudUpload />,
      component: <UploadTab />,
    },
    {
      path: '/download',
      label: 'Download',
      icon: <CloudDownload />,
      component: <DownloadTab />,
    },
    {
      path: '/browse',
      label: 'Browse',
      icon: <FolderOpen />,
      component: <BrowseTab />,
    },
    {
      path: '/delete',
      label: 'Delete',
      icon: <Delete />,
      component: <DeleteTab />,
    },
    {
      path: '/schema-validation',
      label: 'Schema Validation',
      icon: <VerifiedUser />,
      component: <SchemaValidationTab />,
    },
    {
      path: '/user-management',
      label: 'User Management',
      icon: <SupervisorAccount />,
      component: <UserManagementTab />,
    },
  ];

  // Get current tab value from pathname
  const getCurrentTab = () => {
    const currentPath = location.pathname;
    const currentTab = tabConfig.find(tab => tab.path === currentPath);
    return currentTab ? currentPath : '/upload'; // Default to upload
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  // Redirect to upload if on root path
  React.useEffect(() => {
    if (location.pathname === '/') {
      navigate('/upload', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 2,
                      py: 0.5,
                      borderRadius: 1.5,
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
                      }}
                    />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#e2e8f0',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    >
                      {config?.bucketName}
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
                      {config?.region}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
            
            <IconButton 
              onClick={handleLogout} 
              title="Disconnect"
              sx={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#e2e8f0',
                backdropFilter: 'blur(10px)',
                width: 40,
                height: 40,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Logout sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Container>
      </Box>

      {/* Single Tab Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
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
          {/* Tab Navigation */}
          <Box sx={{ px: 6, pt: 4, pb: 2 }}>
            <Tabs
              value={getCurrentTab()}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                },
              }}
            >
              {tabConfig.map((tab) => (
                <Tab
                  key={tab.path}
                  value={tab.path}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                  sx={{
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#64748b',
                    px: 3,
                    py: 2,
                    '&.Mui-selected': {
                      color: '#6366f1',
                      fontWeight: 700,
                    },
                    '&:hover': {
                      color: '#6366f1',
                      background: 'rgba(99, 102, 241, 0.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ px: 6, pb: 6 }}>
            <Routes>
              <Route path="/upload" element={<UploadTab />} />
              <Route path="/download" element={<DownloadTab />} />
              <Route path="/browse" element={<BrowseTab />} />
              <Route path="/delete" element={<DeleteTab />} />
              <Route path="/schema-validation" element={<SchemaValidationTab />} />
              <Route path="/user-management" element={<UserManagementTab />} />
              <Route path="/" element={<UploadTab />} />
            </Routes>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default S3Dashboard; 