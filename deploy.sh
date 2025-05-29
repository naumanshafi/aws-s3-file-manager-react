#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting deployment to GCP server...${NC}"

# Configuration
SERVER="ubuntu@104.198.177.87"
APP_DIR="~/aws-s3-file-manager-react"
APP_NAME="s3-file-manager"

echo -e "${YELLOW}📦 Building application locally...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Exiting...${NC}"
    exit 1
fi

echo -e "${YELLOW}📤 Uploading files to server...${NC}"
rsync -avz --exclude 'node_modules' --exclude '.git' ./ $SERVER:$APP_DIR/

echo -e "${YELLOW}🔧 Installing dependencies on server...${NC}"
ssh $SERVER "cd $APP_DIR && npm install --production"

echo -e "${YELLOW}🔄 Restarting application...${NC}"
ssh $SERVER "cd $APP_DIR && pm2 restart $APP_NAME || pm2 start ecosystem.config.js"

echo -e "${YELLOW}💾 Saving PM2 configuration...${NC}"
ssh $SERVER "pm2 save"

echo -e "${YELLOW}🏥 Checking application health...${NC}"
sleep 5
ssh $SERVER "pm2 status $APP_NAME"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application should be running on http://104.198.177.87:5000${NC}" 