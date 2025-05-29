#!/bin/bash

# Server Setup Script for AWS S3 File Manager
echo "🚀 Setting up server for AWS S3 File Manager..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Git (if not already installed)
echo "📦 Installing Git..."
sudo apt install git -y

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p ~/aws-s3-file-manager-react/logs

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 5000
sudo ufw allow 3000
sudo ufw --force enable

# Setup PM2 startup
echo "⚡ Setting up PM2 startup..."
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "✅ Server setup completed!"
echo "🔧 Next steps:"
echo "1. Clone your repository: git clone <your-repo-url>"
echo "2. Install dependencies: npm install"
echo "3. Start the application: pm2 start ecosystem.config.js"
echo "4. Save PM2 configuration: pm2 save" 