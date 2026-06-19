#!/bin/bash
set -e

echo "=== Installing Node.js 18 ==="
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

echo "=== Rebuilding frontend ==="
cd /opt/darlam/frontend
rm -rf node_modules
npm install --legacy-peer-deps 2>&1 | tail -3
npx vite build 2>&1 | tail -10

echo "=== Restarting services ==="
systemctl restart darlam-api
systemctl restart nginx

echo ""
echo "========================================="
echo "  FRONTEND BUILD COMPLETE!"
echo "  Access: http://195.88.211.5"
echo "========================================="
