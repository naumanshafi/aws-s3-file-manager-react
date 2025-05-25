import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Avatar,
} from '@mui/material';
import { CloudUpload, FolderOpen, UploadFile } from '@mui/icons-material';
import { useTopLevelFolders, useDateFolders, useFiles } from '../../hooks/useS3';
import FileUpload from '../FileUpload';
import FileList from '../FileList';

const UploadTab: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const { data: projects = [], isLoading: projectsLoading } = useTopLevelFolders();
  const { data: dateFolders = [], isLoading: datesLoading } = useDateFolders(
    selectedProject,
    'inputData',
    !!selectedProject
  );

  const targetPath = selectedProject && selectedDate 
    ? `${selectedProject}/outputData/${selectedDate}/`
    : '';

  const { data: existingFiles = [], isLoading: filesLoading, refetch: refetchFiles } = useFiles(
    targetPath,
    !!targetPath
  );

  const handleUploadComplete = () => {
    refetchFiles();
  };

  const activeStep = !selectedProject ? 0 : !selectedDate ? 1 : 2;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
            }}
          >
            <CloudUpload sx={{ fontSize: 24, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
              Upload Files to S3
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
              Upload files to your S3 bucket's outputData folder with drag & drop support
            </Typography>
          </Box>
        </Box>

        <Alert 
          severity="success" 
          sx={{ 
            borderRadius: 3,
            border: '1px solid #d1fae5',
            backgroundColor: '#f0fdf4',
            '& .MuiAlert-icon': {
              color: '#059669',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            <strong>📤 Upload Ready:</strong> Select your destination folder and drag & drop files or click to browse. 
            Multiple files and large uploads are supported with real-time progress tracking.
          </Typography>
        </Alert>
      </Box>

      {/* Progress Stepper */}
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
          Upload Process
        </Typography>
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel
          sx={{
            '& .MuiStepLabel-root .Mui-completed': {
              color: '#059669',
            },
            '& .MuiStepLabel-root .Mui-active': {
              color: '#6366f1',
            },
            '& .MuiStepConnector-alternativeLabel': {
              top: 10,
              left: 'calc(-50% + 16px)',
              right: 'calc(50% + 16px)',
            },
            '& .MuiStepConnector-alternativeLabel.Mui-active .MuiStepConnector-line': {
              borderColor: '#6366f1',
            },
            '& .MuiStepConnector-alternativeLabel.Mui-completed .MuiStepConnector-line': {
              borderColor: '#059669',
            },
          }}
        >
          <Step>
            <StepLabel>Select Project</StepLabel>
          </Step>
          <Step>
            <StepLabel>Choose Date</StepLabel>
          </Step>
          <Step>
            <StepLabel>Upload Files</StepLabel>
          </Step>
        </Stepper>
      </Box>

      {/* Project and Date Selection */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          p: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
            }}
          >
            <FolderOpen sx={{ fontSize: 20, color: 'white' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
            1. Select Destination
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 4, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <FormControl fullWidth>
            <InputLabel sx={{ fontWeight: 600 }}>Project Folder</InputLabel>
            <Select
              value={selectedProject}
              label="Project Folder"
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedDate(''); // Reset date when project changes
              }}
              disabled={projectsLoading}
              sx={{ 
                borderRadius: 3,
                backgroundColor: '#fafafa',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
              }}
            >
              {projects.map((project) => (
                <MenuItem key={project.name} value={project.name}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <FolderOpen fontSize="small" sx={{ color: '#6366f1' }} />
                    <Typography sx={{ fontWeight: 500 }}>{project.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!selectedProject}>
            <InputLabel sx={{ fontWeight: 600 }}>Date Folder</InputLabel>
            <Select
              value={selectedDate}
              label="Date Folder"
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={!selectedProject || datesLoading}
              sx={{ 
                borderRadius: 3,
                backgroundColor: !selectedProject ? '#f8fafc' : '#fafafa',
                '&:hover': {
                  backgroundColor: !selectedProject ? '#f8fafc' : '#f5f5f5',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
              }}
            >
              {dateFolders.map((date) => (
                <MenuItem key={date} value={date}>
                  <Typography sx={{ fontWeight: 500 }}>{date}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {targetPath && (
          <Alert 
            severity="info" 
            sx={{ 
              borderRadius: 3,
              border: '1px solid #bfdbfe',
              backgroundColor: '#eff6ff',
              '& .MuiAlert-icon': {
                color: '#3b82f6',
              },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              <strong>Target path:</strong> {targetPath}
            </Typography>
          </Alert>
        )}
      </Box>

      {/* File Upload Section */}
      {targetPath && (
        <Box
          sx={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            p: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              }}
            >
              <UploadFile sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
              2. Upload Files
            </Typography>
          </Box>
          <FileUpload 
            targetPath={targetPath} 
            onUploadComplete={handleUploadComplete}
          />
        </Box>
      )}

      {/* Existing Files */}
      {targetPath && (
        <Box
          sx={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            p: 4,
          }}
        >
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              border: '1px solid #bfdbfe',
              backgroundColor: '#eff6ff',
              '& .MuiAlert-icon': {
                color: '#3b82f6',
              },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              <strong>📁 Existing Files:</strong> Files already in this location are shown below. 
              You can download any of these files, but deletion is only available in the Delete tab for safety.
            </Typography>
          </Alert>
          <FileList
            files={existingFiles}
            isLoading={filesLoading}
            prefix={targetPath}
            actionMode="download-only"
            title="Files in This Location"
          />
        </Box>
      )}

      {/* Help Messages */}
      {!selectedProject && (
        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 3,
            border: '1px solid #bfdbfe',
            backgroundColor: '#eff6ff',
            '& .MuiAlert-icon': {
              color: '#3b82f6',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            👆 Please select a project folder to begin uploading files.
          </Typography>
        </Alert>
      )}

      {selectedProject && !selectedDate && (
        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 3,
            border: '1px solid #bfdbfe',
            backgroundColor: '#eff6ff',
            '& .MuiAlert-icon': {
              color: '#3b82f6',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            📅 Please select a date folder to continue.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default UploadTab; 