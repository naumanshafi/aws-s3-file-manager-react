import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { S3Config } from '../types';
import { apiService } from '../services/apiService';

interface S3ConfigContextType {
  config: S3Config | null;
  isConfigured: boolean;
  setConfig: (config: S3Config) => Promise<void>;
  clearConfig: () => void;
}

const S3ConfigContext = createContext<S3ConfigContextType | undefined>(undefined);

interface S3ConfigProviderProps {
  children: ReactNode;
}

export const S3ConfigProvider: React.FC<S3ConfigProviderProps> = ({ children }) => {
  const [config, setConfigState] = useState<S3Config | null>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('s3Config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfigState(parsedConfig);
        // Re-initialize the API service with saved config
        apiService.initialize(parsedConfig).catch(error => {
          console.error('Failed to re-initialize API service:', error);
          localStorage.removeItem('s3Config');
          setConfigState(null);
        });
      } catch (error) {
        console.error('Failed to parse saved S3 config:', error);
        localStorage.removeItem('s3Config');
      }
    }
  }, []);

  const setConfig = async (newConfig: S3Config) => {
    try {
      // Initialize the API service first
      await apiService.initialize(newConfig);
      
      setConfigState(newConfig);
      
      // Save to localStorage (excluding sensitive data for security)
      const configToSave = {
        bucketName: newConfig.bucketName,
        region: newConfig.region,
        roleArn: newConfig.roleArn,
        // Store credentials (in production, consider more secure storage)
        accessKeyId: newConfig.accessKeyId,
        secretAccessKey: newConfig.secretAccessKey,
      };
      localStorage.setItem('s3Config', JSON.stringify(configToSave));
    } catch (error) {
      console.error('Failed to set S3 config:', error);
      throw error;
    }
  };

  const clearConfig = () => {
    setConfigState(null);
    localStorage.removeItem('s3Config');
  };

  const isConfigured = config !== null;

  return (
    <S3ConfigContext.Provider value={{ config, isConfigured, setConfig, clearConfig }}>
      {children}
    </S3ConfigContext.Provider>
  );
};

export const useS3Config = () => {
  const context = useContext(S3ConfigContext);
  if (context === undefined) {
    throw new Error('useS3Config must be used within a S3ConfigProvider');
  }
  return context;
}; 