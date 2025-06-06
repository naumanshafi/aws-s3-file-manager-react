import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Timeline,
  CloudUpload,
  CloudDownload,
  Delete,
  Search,
  FilterList,
  Person,
  AccessTime,
  CheckCircle,
  Error,
  Refresh,
  TrendingUp,
  Assessment,
} from '@mui/icons-material';
import { authService } from '../../services/authService';

interface Activity {
  id: string;
  userEmail: string;
  userName: string;
  action: 'upload' | 'download' | 'delete';
  fileName: string;
  fileSize: string;
  timestamp: string;
  status: 'success' | 'failed';
  details: string;
}

interface ActivityResponse {
  activities: Activity[];
  totalCount: number;
  stats: {
    totalUploads: number;
    totalDownloads: number;
    totalDeletes: number;
    totalUsers: number;
  };
}

const ActivityTab: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalDownloads: 0,
    totalDeletes: 0,
    totalUsers: 0,
  });

  // Check if running in local development
  const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Helper function to make authenticated requests
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const authHeaders = authService.getAuthHeaders();
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });
  };

  // Fetch activities
  const fetchActivities = async () => {
    // Skip API calls in local development and show sample data
    if (isLocalDevelopment) {
      // Simulate loading
      setTimeout(() => {
        const sampleActivities: Activity[] = [
          {
            id: "act_001",
            userEmail: "noman.s@turing.com",
            userName: "Noman Shafi",
            action: "upload",
            fileName: "sample-data.json",
            fileSize: "2.5 MB",
            timestamp: "2025-06-05T18:30:15.123Z",
            status: "success",
            details: "File uploaded to /uploads/sample-data.json"
          },
          {
            id: "act_002",
            userEmail: "aarunik.g@turing.com",
            userName: "Aarunik G",
            action: "download",
            fileName: "report-2025.pdf",
            fileSize: "1.8 MB",
            timestamp: "2025-06-05T17:45:30.456Z",
            status: "success",
            details: "File downloaded from /reports/report-2025.pdf"
          },
          {
            id: "act_003",
            userEmail: "noman.s@turing.com",
            userName: "Noman Shafi",
            action: "delete",
            fileName: "old-backup.zip",
            fileSize: "15.2 MB",
            timestamp: "2025-06-05T16:20:45.789Z",
            status: "success",
            details: "File deleted from /backups/old-backup.zip"
          },
          {
            id: "act_004",
            userEmail: "aarunik.g@turing.com",
            userName: "Aarunik G",
            action: "upload",
            fileName: "config.json",
            fileSize: "0.5 MB",
            timestamp: "2025-06-05T15:10:12.345Z",
            status: "failed",
            details: "Upload failed: Invalid file format"
          }
        ];
        
        setActivities(sampleActivities);
        setFilteredActivities(sampleActivities);
        setStats({
          totalUploads: sampleActivities.filter(a => a.action === 'upload').length,
          totalDownloads: sampleActivities.filter(a => a.action === 'download').length,
          totalDeletes: sampleActivities.filter(a => a.action === 'delete').length,
          totalUsers: new Set(sampleActivities.map(a => a.userEmail)).size,
        });
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      if (!authService.isAuthenticated()) {
        setError('User not authenticated. Please sign in again.');
        return;
      }
      
      const response = await makeAuthenticatedRequest('/api/activities');
      
      if (!response.ok) {
        setError(`Failed to fetch activities: ${response.statusText}`);
        return;
      }
      
      const data: ActivityResponse = await response.json();
      setActivities(data.activities || []);
      setFilteredActivities(data.activities || []);
      setStats(data.stats || { totalUploads: 0, totalDownloads: 0, totalDeletes: 0, totalUsers: 0 });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError((err as Error).message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Failed to fetch activities');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter activities based on search and filters
  useEffect(() => {
    let filtered = activities;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(activity => activity.action === actionFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(activity => activity.status === statusFilter);
    }

    setFilteredActivities(filtered);
  }, [activities, searchTerm, actionFilter, statusFilter]);

  // Load activities on component mount
  useEffect(() => {
    fetchActivities();
  }, []);

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'upload':
        return <CloudUpload sx={{ fontSize: 20, color: '#059669' }} />;
      case 'download':
        return <CloudDownload sx={{ fontSize: 20, color: '#2563eb' }} />;
      case 'delete':
        return <Delete sx={{ fontSize: 20, color: '#dc2626' }} />;
      default:
        return <Timeline sx={{ fontSize: 20, color: '#6b7280' }} />;
    }
  };

  // Get action color
  const getActionColor = (action: string) => {
    switch (action) {
      case 'upload':
        return 'success';
      case 'download':
        return 'primary';
      case 'delete':
        return 'error';
      default:
        return 'default';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date),
    };
  };

  // Get relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const isAdmin = authService.isAdmin();

  // Check if user is admin
  if (!isAdmin) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            p: 6,
            textAlign: 'center',
          }}
        >
          <Timeline sx={{ fontSize: 64, color: '#6b7280', mb: 3 }} />
          
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
            Admin Access Required
          </Typography>
          
          <Typography variant="body1" sx={{ color: '#64748b', mb: 4, maxWidth: 500, mx: 'auto' }}>
            Activity logs are only accessible to administrators. Please contact your administrator if you need access to this information.
          </Typography>

          <Alert severity="warning" sx={{ textAlign: 'left', maxWidth: 600, mx: 'auto' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              This section contains sensitive user activity data and is restricted to admin users only.
            </Typography>
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          p: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              }}
            >
              <Timeline sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
              Activity Logs
            </Typography>
          </Box>
          
          <Tooltip title="Refresh Activities">
            <IconButton
              onClick={fetchActivities}
              disabled={isLoading}
              sx={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                },
                '&:disabled': {
                  background: '#9ca3af',
                },
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {isLocalDevelopment && (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            <Typography variant="body2">
              <strong>Development Mode:</strong> Showing sample activity data. In production, this will display real user activity logs.
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Statistics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
        }}
      >
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <CloudUpload sx={{ fontSize: 40, color: '#059669', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              {stats.totalUploads}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Total Uploads
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <CloudDownload sx={{ fontSize: 40, color: '#2563eb', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              {stats.totalDownloads}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Total Downloads
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Delete sx={{ fontSize: 40, color: '#dc2626', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              {stats.totalDeletes}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Total Deletes
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Person sx={{ fontSize: 40, color: '#7c3aed', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              {stats.totalUsers}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Active Users
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          p: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <FilterList sx={{ color: '#6b7280' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
            Filters
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: 3,
          }}
        >
          <TextField
            fullWidth
            placeholder="Search by user, file, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#6b7280' }} />
                </InputAdornment>
              ),
            }}
            sx={{ borderRadius: 3 }}
          />
          
          <FormControl fullWidth>
            <InputLabel>Action</InputLabel>
            <Select
              value={actionFilter}
              label="Action"
              onChange={(e) => setActionFilter(e.target.value)}
              sx={{ borderRadius: 3 }}
            >
              <MenuItem value="all">All Actions</MenuItem>
              <MenuItem value="upload">Upload</MenuItem>
              <MenuItem value="download">Download</MenuItem>
              <MenuItem value="delete">Delete</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ borderRadius: 3 }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ 
            borderRadius: 3,
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {error}
          </Typography>
        </Alert>
      )}

      {/* Activities Table */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          p: 4,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', mb: 3 }}>
          Recent Activities ({filteredActivities.length})
        </Typography>

        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography sx={{ color: '#64748b' }}>Loading activities...</Typography>
          </Box>
        ) : filteredActivities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Assessment sx={{ fontSize: 48, color: '#9ca3af', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
              No activities found
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              {activities.length === 0 ? 'No user activities recorded yet' : 'Try adjusting your filters'}
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>File</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredActivities.map((activity) => {
                  const timeInfo = formatTimestamp(activity.timestamp);
                  return (
                    <TableRow key={activity.id} sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#6366f1', fontSize: '0.875rem' }}>
                            {activity.userName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {activity.userName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {activity.userEmail}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={getActionIcon(activity.action)}
                          label={activity.action.toUpperCase()}
                          color={getActionColor(activity.action) as any}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {activity.fileName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {activity.fileSize}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={activity.status === 'success' ? <CheckCircle /> : <Error />}
                          label={activity.status.toUpperCase()}
                          color={activity.status === 'success' ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {timeInfo.relative}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {timeInfo.date} {timeInfo.time}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 200 }}>
                          {activity.details}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default ActivityTab; 