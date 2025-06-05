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

# Install nginx and certbot for SSL
echo "📦 Installing nginx and SSL tools..."
sudo apt install -y nginx certbot python3-certbot-nginx git

# Create web directory for domain
echo "📁 Creating web directory..."
sudo mkdir -p /var/www/s3manager.turing.com
sudo chown -R www-data:www-data /var/www/s3manager.turing.com

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p ~/aws-s3-file-manager-react/logs

# Configure firewall for HTTPS
echo "🔒 Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5001
sudo ufw --force enable

# Setup nginx configuration for s3manager.turing.com
echo "⚙️ Setting up nginx configuration..."

# Check if nginx-s3manager.conf exists in current directory
if [ -f "nginx-s3manager.conf" ]; then
    echo "📄 Using standalone nginx-s3manager.conf file..."
    sudo cp nginx-s3manager.conf /etc/nginx/sites-available/s3manager.turing.com
elif [ -f "../nginx-s3manager.conf" ]; then
    echo "📄 Using nginx-s3manager.conf from parent directory..."
    sudo cp ../nginx-s3manager.conf /etc/nginx/sites-available/s3manager.turing.com
else
    echo "❌ nginx-s3manager.conf not found. Please ensure it's in the project directory."
    exit 1
fi

# Enable the nginx site
echo "🔗 Enabling nginx site..."
sudo ln -sf /etc/nginx/sites-available/s3manager.turing.com /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    sudo systemctl reload nginx
else
    echo "❌ Nginx configuration has errors. Please check."
    exit 1
fi

# Setup PM2 startup
echo "⚡ Setting up PM2 startup..."
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "✅ Server setup completed!"
echo ""
echo "🔧 Next steps:"
echo "1. Clone your repository: git clone <your-repo-url>"
echo "2. Install dependencies: npm install"
echo "3. Get SSL certificate: sudo certbot --nginx -d s3manager.turing.com --agree-tos --email admin@turing.com"
echo "4. Build React app: npm run build"
echo "5. Copy build files: sudo cp -r build/* /var/www/s3manager.turing.com/"
echo "6. Start the application: pm2 start ecosystem.config.js"
echo "7. Save PM2 configuration: pm2 save"
echo ""
echo "🌐 Your app will be available at: https://s3manager.turing.com" 