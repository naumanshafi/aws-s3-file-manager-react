import React, { useState } from 'react';
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
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CloudUpload,
  CloudDownload,
  FolderOpen,
  Delete,
  Logout,
  VerifiedUser,
  SupervisorAccount,
  Person,
  AdminPanelSettings,
  AccountCircle,
  ExpandMore,
} from '@mui/icons-material';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useS3Config } from '../contexts/S3ConfigContext';
import { authService } from '../services/authService';
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
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Get current user info
  const userInfo = authService.getUserInfo();
  const isAdmin = authService.isAdmin();

  const handleLogout = () => {
    // Clear auth and config
    authService.clearAuth();
    clearConfig();
    // Instead of navigating to localhost:3000, reload the page to go back to login
    window.location.href = window.location.origin;
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const tabConfig = [
    {
      path: '/upload',
      label: 'Upload',
      icon: <CloudUpload />,
      component: <UploadTab />,
      visible: true,
    },
    {
      path: '/download',
      label: 'Download',
      icon: <CloudDownload />,
      component: <DownloadTab />,
      visible: true,
    },
    {
      path: '/browse',
      label: 'Browse',
      icon: <FolderOpen />,
      component: <BrowseTab />,
      visible: true,
    },
    {
      path: '/delete',
      label: 'Delete',
      icon: <Delete />,
      component: <DeleteTab />,
      visible: true,
    },
    {
      path: '/schema-validation',
      label: 'Schema Validation',
      icon: <VerifiedUser />,
      component: <SchemaValidationTab />,
      visible: true,
    },
    {
      path: '/user-management',
      label: 'User Management',
      icon: <SupervisorAccount />,
      component: <UserManagementTab />,
      visible: isAdmin, // Only show to admin users
    },
  ];

  // Filter visible tabs
  const visibleTabs = tabConfig.filter(tab => tab.visible);

  // Get current tab value from pathname
  const getCurrentTab = () => {
    const currentPath = location.pathname;
    const currentTab = visibleTabs.find(tab => tab.path === currentPath);
    return currentTab ? currentPath : '/upload'; // Default to upload
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  // Redirect to upload if on root path or if accessing restricted tab
  React.useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === '/' || (!visibleTabs.find(tab => tab.path === currentPath))) {
      navigate('/upload', { replace: true });
    }
  }, [location.pathname, navigate, visibleTabs]);

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
          <Box sx={{ 
            py: { xs: 1.5, md: 2.5 }, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            position: 'relative', 
            zIndex: 1,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
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
                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                    mb: 0.5,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.2,
                  }}
                >
                  AWS S3 File Manager
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: { xs: 1, md: 1.5 },
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: { xs: 1.5, md: 2 },
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
                        fontSize: { xs: '0.7rem', md: '0.75rem' },
                      }}
                    >
                      {config?.bucketName}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: { xs: 1.5, md: 2 },
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
                        fontSize: { xs: '0.7rem', md: '0.75rem' },
                      }}
                    >
                      {config?.region}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
            
            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 1.5, md: 2 },
                  px: { xs: 2, md: 3 },
                  py: { xs: 1, md: 1.5 },
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateY(-1px)',
                  },
                }}
                onClick={handleUserMenuOpen}
              >
                <Avatar
                  src={userInfo?.picture}
                  alt={userInfo?.name}
                  sx={{
                    width: { xs: 28, md: 32 },
                    height: { xs: 28, md: 32 },
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                  }}
                >
                  {userInfo?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', md: '0.875rem' },
                      lineHeight: 1.2,
                    }}
                  >
                    {userInfo?.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      icon={isAdmin ? <AdminPanelSettings /> : <Person />}
                      label={isAdmin ? 'Admin' : 'User'}
                      size="small"
                      sx={{ 
                        height: 18,
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        bgcolor: isAdmin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: isAdmin ? '#fca5a5' : '#93c5fd',
                        '& .MuiChip-icon': {
                          fontSize: '0.75rem',
                        },
                      }}
                    />
                  </Box>
                </Box>
                <ExpandMore sx={{ fontSize: { xs: 18, md: 20 }, color: '#cbd5e1', display: { xs: 'none', sm: 'block' } }} />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* User Menu Dropdown */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          '& .MuiPaper-root': {
            mt: 1,
            minWidth: 280,
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
            },
            '& .MuiMenuItem-root': {
              borderRadius: 2,
              mx: 2,
              my: 0.5,
              transition: 'all 0.2s ease',
            },
          },
        }}
      >
        {/* User Info Header */}
        <Box sx={{ 
          px: 4, 
          py: 3, 
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          position: 'relative',
          pt: 4, // Add top padding for the gradient line
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              src={userInfo?.picture}
              alt={userInfo?.name}
              sx={{
                width: 48,
                height: 48,
                border: '3px solid rgba(99, 102, 241, 0.2)',
                fontSize: '1.25rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
              }}
            >
              {userInfo?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#0f172a', 
                  mb: 0.5,
                  fontSize: '1.1rem',
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                }}
              >
                {userInfo?.name}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748b',
                  fontSize: '0.875rem',
                  wordBreak: 'break-word',
                  mb: 1,
                }}
              >
                {userInfo?.email}
              </Typography>
              <Chip 
                icon={isAdmin ? <AdminPanelSettings /> : <Person />}
                label={isAdmin ? 'Administrator' : 'User'}
                size="small"
                sx={{ 
                  height: 24,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  bgcolor: isAdmin ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: isAdmin ? '#dc2626' : '#2563eb',
                  border: `1px solid ${isAdmin ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                  '& .MuiChip-icon': {
                    fontSize: '0.875rem',
                    color: isAdmin ? '#dc2626' : '#2563eb',
                  },
                }}
              />
            </Box>
          </Box>
        </Box>
        
        {/* Menu Items */}
        <Box sx={{ py: 2 }}>
          <MenuItem 
            onClick={() => {
              handleUserMenuClose();
              handleLogout();
            }}
            sx={{ 
              color: '#dc2626',
              fontWeight: 500,
              py: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: '#b91c1c',
              },
            }}
          >
            <ListItemIcon>
              <Logout fontSize="small" sx={{ color: 'inherit' }} />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Sign Out
              </Typography>
            </ListItemText>
          </MenuItem>
        </Box>
      </Menu>

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
              {visibleTabs.map((tab) => (
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
              {isAdmin && <Route path="/user-management" element={<UserManagementTab />} />}
              <Route path="/" element={<UploadTab />} />
            </Routes>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default S3Dashboard; 