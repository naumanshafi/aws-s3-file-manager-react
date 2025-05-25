const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Proxy middleware for AWS S3
const s3Proxy = createProxyMiddleware({
  target: 'https://s3.amazonaws.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/s3': '', // Remove /api/s3 prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying request: ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

// Use the proxy for all /api/s3 routes
app.use('/api/s3', s3Proxy);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Proxy server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying AWS S3 requests from React app on http://localhost:3000`);
}); 