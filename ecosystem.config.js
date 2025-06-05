require('dotenv').config();

module.exports = {
  apps: [{
    name: 's3-file-manager',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_file: '.env',
    env: {
      NODE_ENV: 'development',
      PORT: process.env.PORT || 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 5000,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_ROLE_ARN: process.env.AWS_ROLE_ARN,
      AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
      AWS_SESSION_NAME: process.env.AWS_SESSION_NAME
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}; 