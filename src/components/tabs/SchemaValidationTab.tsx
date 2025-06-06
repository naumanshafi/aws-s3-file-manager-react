import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Paper,
  Divider,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Upload,
  Description,
  ExpandMore,
  Warning,
  VerifiedUser,
  AccountTree,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    instancePath: string;
    schemaPath: string;
    keyword: string;
    params: any;
    message: string;
    itemIndex?: number;
  }>;
  itemCount?: number;
  validItems?: number;
  invalidItems?: number;
}



const SchemaValidationTab: React.FC = () => {
  const [schemaFile, setSchemaFile] = useState<File | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ schema: number; data: number }>({
    schema: 0,
    data: 0,
  });

  // Call backend API for validation
  const callValidationAPI = async (schemaFile: File, dataFile: File): Promise<ValidationResult> => {
    const formData = new FormData();
    formData.append('schema', schemaFile);
    formData.append('data', dataFile);

    // Fix the API URL construction for schema validation
    // For production: https://s3manager.turing.com/api -> https://s3manager.turing.com/api/schema/validate
    // For development: /api -> /api/schema/validate
    const apiUrl = process.env.REACT_APP_API_URL 
      ? `${process.env.REACT_APP_API_URL}/schema/validate`
      : '/api/schema/validate';

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    // Always try to get the response text first
    const responseText = await response.text();
    
    if (!response.ok) {
      // Try to parse error response, but if it fails, show the raw response
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.error || 'Validation failed';
        throw { message: errorMessage };
      } catch (parseError) {
        // If we can't parse the error response, show the raw text
        throw { message: `Backend error: ${responseText}` };
      }
    }

    // Try to parse the successful response
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      // If JSON parsing fails, but we have response text that looks like validation results
      if (responseText.includes('metadata') || responseText.includes('required property') || 
          responseText.includes('workitems') || responseText.includes('invalid')) {
        // Create a validation result from the raw text
        return {
          isValid: false,
          errors: [{
            instancePath: '',
            schemaPath: '',
            keyword: 'validation',
            params: {},
            message: responseText
          }]
        };
      }
      
      // If it doesn't look like validation results, throw the parse error
      throw { message: `Failed to parse response: ${responseText}` };
    }
  };

  // Handle schema file upload
  const onSchemaFileDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSchemaFile(file);
      setUploadProgress(prev => ({ ...prev, schema: 100 }));
    }
  }, []);

  // Handle data file upload
  const onDataFileDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setDataFile(file);
      setUploadProgress(prev => ({ ...prev, data: 100 }));
    }
  }, []);

  const schemaDropzone = useDropzone({
    onDrop: onSchemaFileDrop,
    accept: {
      'application/json': ['.json'],
    },
    maxFiles: 1,
  });

  const dataDropzone = useDropzone({
    onDrop: onDataFileDrop,
    accept: {
      'application/json': ['.json'],
    },
    maxFiles: 1,
  });

  // Perform validation
  const handleValidation = async () => {
    if (!schemaFile || !dataFile) {
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await callValidationAPI(schemaFile, dataFile);
      setValidationResult(result);
    } catch (error: unknown) {
      console.error('Validation error:', error);
      
      // Try to extract meaningful error message from backend
      let errorMessage = 'Unknown error';
      let backendError = null;
      
      if (error && typeof error === 'object' && 'message' in error) {
        const fullMessage = String((error as any).message);
        
        // Check if this is a backend validation error (contains actual validation info)
        if (fullMessage.includes('metadata') || fullMessage.includes('required property') || 
            fullMessage.includes('workitems') || fullMessage.includes('validation')) {
          backendError = fullMessage;
        } else {
          errorMessage = fullMessage;
        }
      } else if (typeof error === 'string') {
        if (error.includes('metadata') || error.includes('required property') || 
            error.includes('workitems') || error.includes('validation')) {
          backendError = error;
        } else {
          errorMessage = error;
        }
      }
      
      // If we have a backend error, show that instead of frontend error
      if (backendError) {
        setValidationResult({
          isValid: false,
          errors: [{ 
            instancePath: '', 
            schemaPath: '', 
            keyword: 'validation', 
            params: {}, 
            message: backendError
          }],
        });
      } else {
        // Only show frontend error if no backend error detected
        setValidationResult({
          isValid: false,
          errors: [{ 
            instancePath: '', 
            schemaPath: '', 
            keyword: 'error', 
            params: {}, 
            message: `Frontend error (backend may have validation results): ${errorMessage}` 
          }],
        });
      }
    } finally {
      setIsValidating(false);
    }
  };

  const resetValidation = () => {
    setSchemaFile(null);
    setDataFile(null);
    setValidationResult(null);
    setUploadProgress({ schema: 0, data: 0 });
  };

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
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
            }}
          >
            <VerifiedUser sx={{ fontSize: 24, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
              JSON Schema Validation
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
              Upload a JSON schema and data file to validate against the schema
            </Typography>
          </Box>
        </Box>

        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 3,
            border: '1px solid #dbeafe',
            backgroundColor: '#eff6ff',
            '& .MuiAlert-icon': {
              color: '#3b82f6',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            <strong>📋 Schema Validation:</strong> Upload your JSON schema file and the data file you want to validate. 
            The validator will check each item in the 'workitems' array against your schema.
          </Typography>
        </Alert>
      </Box>

      {/* File Upload Section */}
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
          Upload Files
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 4, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Schema File Upload */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
              1. Schema File (JSON)
            </Typography>
            <Paper
              {...schemaDropzone.getRootProps()}
              sx={{
                p: 3,
                border: '2px dashed',
                borderColor: schemaDropzone.isDragActive ? '#7c3aed' : '#d1d5db',
                borderRadius: 3,
                backgroundColor: schemaDropzone.isDragActive ? '#faf5ff' : '#fafafa',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#7c3aed',
                  backgroundColor: '#faf5ff',
                },
              }}
            >
              <input {...schemaDropzone.getInputProps()} />
              <Box sx={{ textAlign: 'center' }}>
                <AccountTree sx={{ fontSize: 48, color: '#7c3aed', mb: 2 }} />
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  {schemaFile ? schemaFile.name : 'Drop schema file here or click to browse'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  JSON schema file (.json)
                </Typography>
                {uploadProgress.schema > 0 && uploadProgress.schema < 100 && (
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress.schema} 
                    sx={{ mt: 2 }}
                  />
                )}
                {uploadProgress.schema === 100 && (
                  <Chip 
                    icon={<CheckCircle />} 
                    label="Schema Loaded" 
                    color="success" 
                    sx={{ mt: 2 }}
                  />
                )}
              </Box>
            </Paper>
          </Box>

          {/* Data File Upload */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
              2. Data File (JSON)
            </Typography>
            <Paper
              {...dataDropzone.getRootProps()}
              sx={{
                p: 3,
                border: '2px dashed',
                borderColor: dataDropzone.isDragActive ? '#7c3aed' : '#d1d5db',
                borderRadius: 3,
                backgroundColor: dataDropzone.isDragActive ? '#faf5ff' : '#fafafa',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#7c3aed',
                  backgroundColor: '#faf5ff',
                },
              }}
            >
              <input {...dataDropzone.getInputProps()} />
              <Box sx={{ textAlign: 'center' }}>
                <Description sx={{ fontSize: 48, color: '#7c3aed', mb: 2 }} />
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  {dataFile ? dataFile.name : 'Drop data file here or click to browse'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  JSON data file to validate (.json)
                </Typography>
                {uploadProgress.data > 0 && uploadProgress.data < 100 && (
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress.data} 
                    sx={{ mt: 2 }}
                  />
                )}
                {uploadProgress.data === 100 && (
                  <Chip 
                    icon={<CheckCircle />} 
                    label="Data Loaded" 
                    color="success" 
                    sx={{ mt: 2 }}
                  />
                )}
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={handleValidation}
            disabled={!schemaFile || !dataFile || isValidating}
            startIcon={isValidating ? undefined : <VerifiedUser />}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #6d28d9 0%, #9333ea 100%)',
              },
            }}
          >
            {isValidating ? 'Validating...' : 'Validate Schema'}
          </Button>
          <Button
            variant="outlined"
            onClick={resetValidation}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 3,
              borderColor: '#d1d5db',
              color: '#374151',
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: '#f9fafb',
              },
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>

      {/* Validation Results */}
      {validationResult && (
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
            Validation Results
          </Typography>

          {/* Summary */}
          <Box sx={{ mb: 3 }}>
            <Alert 
              severity={validationResult.isValid ? 'success' : 'error'}
              sx={{ borderRadius: 3, mb: 2 }}
            >
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {validationResult.isValid ? '✅ File is valid' : '❌ Validation failed'}
              </Typography>
            </Alert>

            {validationResult.itemCount !== undefined && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={`Total Items: ${validationResult.itemCount}`} 
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
                {validationResult.validItems !== undefined && (
                  <Chip 
                    icon={<CheckCircle />}
                    label={`Valid: ${validationResult.validItems}`} 
                    color="success"
                    sx={{ fontWeight: 600 }}
                  />
                )}
                {validationResult.invalidItems !== undefined && validationResult.invalidItems > 0 && (
                  <Chip 
                    icon={<Error />}
                    label={`Invalid: ${validationResult.invalidItems}`} 
                    color="error"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>
            )}
          </Box>

          {/* Error Details */}
          {validationResult.errors.length > 0 && (
            <Accordion sx={{ borderRadius: 3, border: '1px solid #fee2e2' }}>
              <AccordionSummary 
                expandIcon={<ExpandMore />}
                sx={{ 
                  backgroundColor: '#fef2f2',
                  borderRadius: '12px 12px 0 0',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Warning sx={{ color: '#dc2626' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#dc2626' }}>
                    Validation Errors ({validationResult.errors.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {validationResult.errors.map((error, index) => (
                    <ListItem key={index} sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <ListItemIcon>
                        <Error sx={{ color: '#dc2626' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#dc2626' }}>
                            {error.itemIndex ? `Item ${error.itemIndex}: ` : ''}
                            {error.message}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                              Path: {error.instancePath || 'root'}
                            </Typography>
                            {error.keyword && (
                              <Typography variant="caption" sx={{ color: '#6b7280', ml: 2 }}>
                                Keyword: {error.keyword}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SchemaValidationTab; 