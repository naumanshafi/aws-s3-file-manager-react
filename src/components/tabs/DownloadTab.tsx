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
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Avatar,
} from '@mui/material';
import { Search, Download, CloudDownload, FolderOpen } from '@mui/icons-material';
import { useTopLevelFolders, useDateFolders, useFiles } from '../../hooks/useS3';
import FileList from '../FileList';

const DownloadTab: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const { data: projects = [], isLoading: projectsLoading } = useTopLevelFolders();
  const { data: dateFolders = [], isLoading: datesLoading } = useDateFolders(
    selectedProject,
    'inputData',
    !!selectedProject
  );

  const sourcePath = selectedProject && selectedDate 
    ? `${selectedProject}/inputData/${selectedDate}/annotation_inputs/input_files/`
    : '';

  const { data: files = [], isLoading: filesLoading, error } = useFiles(
    sourcePath,
    !!sourcePath
  );

  const handleProjectChange = (projectName: string) => {
    setSelectedProject(projectName);
    setSelectedDate('');
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
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
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
            }}
          >
            <CloudDownload sx={{ fontSize: 24, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
              Download Ingestion Files
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
              Download files from your S3 bucket's inputData folder for local processing
            </Typography>
          </Box>
        </Box>

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
            <strong>💡 Download Tip:</strong> Files will be downloaded directly to your browser's default download folder. 
            Large files may take some time to download depending on your internet connection.
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
          Download Process
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
            <StepLabel>Download Files</StepLabel>
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
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
            }}
          >
            <FolderOpen sx={{ fontSize: 20, color: 'white' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
            1. Select Source Location
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 4, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <FormControl fullWidth>
            <InputLabel sx={{ fontWeight: 600 }}>Project Folder</InputLabel>
            <Select
              value={selectedProject}
              label="Project Folder"
              onChange={(e) => handleProjectChange(e.target.value)}
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
              onChange={(e) => handleDateChange(e.target.value)}
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

        {sourcePath && (
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
              <strong>Looking in:</strong> {sourcePath}
            </Typography>
          </Alert>
        )}
      </Box>

      {/* File List */}
      {sourcePath && (
        <Box
          sx={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            p: 4,
          }}
        >
          {error ? (
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: 3,
                border: '1px solid #fecaca',
                backgroundColor: '#fef2f2',
                '& .MuiAlert-icon': {
                  color: '#dc2626',
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Failed to load files: {error instanceof Error ? error.message : String(error)}
              </Typography>
            </Alert>
          ) : files.length === 0 && !filesLoading ? (
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
                No files found in {sourcePath}
              </Typography>
            </Alert>
          ) : (
            <>
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 3,
                  border: '1px solid #d1fae5',
                  backgroundColor: '#f0fdf4',
                  '& .MuiAlert-icon': {
                    color: '#059669',
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  <strong>📥 Ready for Download:</strong> Click the download button (⬇️) next to any file to download it to your computer.
                  Downloads will start immediately and save to your default download folder.
                </Typography>
              </Alert>
              <FileList
                files={files}
                isLoading={filesLoading}
                prefix={sourcePath}
                actionMode="download-only"
                title="Available Files for Download"
              />
            </>
          )}
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
            👆 Please select a project folder to begin downloading files.
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

export default DownloadTab; 